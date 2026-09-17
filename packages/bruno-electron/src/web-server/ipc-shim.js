/**
 * Browser-side IPC shim, served by the Bruno web server at /ipc-shim.js.
 *
 * The bruno-app renderer talks to the main process through `window.ipcRenderer`
 * (normally provided by the electron preload script). When the app is served
 * over HTTP, this shim provides the same surface on top of a WebSocket bridge
 * (/ipc) so the renderer code works unmodified in a regular browser.
 */
/* global window, location */
(function () {
  'use strict';

  if (window.__BRUNO_IPC_SHIM__) {
    return;
  }
  window.__BRUNO_IPC_SHIM__ = true;

  // The electron renderer runs with nodeIntegration enabled, so a few modules
  // read `process.*` directly. Provide a minimal stand-in for the browser.
  if (typeof window.process === 'undefined') {
    window.process = {
      env: {},
      platform: 'browser',
      arch: 'browser',
      version: '',
      versions: {},
      pid: 0,
      title: 'bruno-web',
      type: 'browser',
      cwd: function () { return '/'; },
      nextTick: function (fn) { return setTimeout(fn, 0); }
    };
  }

  const RECONNECT_DELAY = 1000;
  const INVOKE_TIMEOUT = 120000;

  let socket = null;
  let nextId = 1;
  const pending = new Map(); // id -> { resolve, reject, timer }
  const listeners = new Map(); // channel -> Set<handler>
  const outbox = [];

  function wsUrl() {
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ipc';
  }

  function rawSend(payload) {
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify(payload));
      return;
    }
    // Socket is (re)connecting: queue and flush once it opens, so invokes
    // issued while offline resolve after reconnection instead of hanging.
    outbox.push(payload);
  }

  function flushOutbox() {
    const queue = outbox.splice(0, outbox.length);
    queue.forEach(function (payload) {
      socket.send(JSON.stringify(payload));
    });
  }

  function connect() {
    try {
      socket = new WebSocket(wsUrl());
    } catch (err) {
      socket = null;
      setTimeout(connect, RECONNECT_DELAY);
      return;
    }

    socket.onopen = flushOutbox;

    socket.onmessage = function (event) {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        return;
      }

      if (msg.t === 'result') {
        const entry = pending.get(msg.id);
        if (!entry) {
          return;
        }
        pending.delete(msg.id);
        clearTimeout(entry.timer);
        if (msg.ok) {
          entry.resolve(msg.data);
        } else {
          entry.reject(new Error(msg.error || 'IPC call failed: ' + msg.channel));
        }
      } else if (msg.t === 'event') {
        const set = listeners.get(msg.channel);
        if (!set) {
          return;
        }
        const args = msg.args || [];
        set.forEach(function (handler) {
          try {
            handler.apply(null, args);
          } catch (err) {
            console.error('Error in ipc event handler for', msg.channel, err);
          }
        });
      }
    };

    socket.onclose = function () {
      socket = null;
      setTimeout(connect, RECONNECT_DELAY);
    };

    socket.onerror = function () {
      if (socket) {
        try { socket.close(); } catch (err) { /* noop */ }
      }
    };
  }

  function invoke(channel) {
    const args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (resolve, reject) {
      const id = nextId++;
      const entry = {
        resolve: resolve,
        reject: reject,
        timer: setTimeout(function () {
          pending.delete(id);
          reject(new Error('IPC invoke timed out: ' + channel));
        }, INVOKE_TIMEOUT)
      };
      pending.set(id, entry);
      rawSend({ t: 'invoke', id: id, channel: channel, args: args });
    });
  }

  const shim = {
    invoke: invoke,

    send: function (channel) {
      const args = Array.prototype.slice.call(arguments, 1);
      rawSend({ t: 'send', channel: channel, args: args });
    },

    on: function (channel, handler) {
      if (!listeners.has(channel)) {
        listeners.set(channel, new Set());
      }
      listeners.get(channel).add(handler);
      return function () {
        shim.removeListener(channel, handler);
      };
    },

    once: function (channel, handler) {
      const wrapped = function () {
        shim.removeListener(channel, wrapped);
        handler.apply(null, arguments);
      };
      shim.on(channel, wrapped);
    },

    removeListener: function (channel, handler) {
      const set = listeners.get(channel);
      if (set) {
        set.delete(handler);
      }
    },

    removeAllListeners: function (channel) {
      if (channel === undefined) {
        listeners.clear();
      } else {
        listeners.delete(channel);
      }
    },

    // The electron preload exposes file drag-drop paths via webUtils, which
    // has no browser equivalent.
    getFilePath: function () {
      return '';
    },

    openExternal: function (url) {
      window.open(url, '_blank');
    }
  };

  window.ipcRenderer = shim;

  connect();
})();
