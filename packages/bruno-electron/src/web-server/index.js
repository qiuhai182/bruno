const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
const { ipcMain } = require('electron');
const { safeStringifyJSON, safeParseJSON } = require('../utils/common');
const { parseQueryParamsPreservingPlus } = require('../utils/parse-query-params');

const DEFAULT_PORT = 43110;
const MAX_PORT_ATTEMPTS = 20;

/**
 * Records every ipcMain.handle / ipcMain.on handler so the web server can
 * dispatch browser-originated calls to the exact same handlers the electron
 * renderer uses. Installed once, before any register*Ipc module runs.
 */
class IpcBridge {
  constructor() {
    this.handleHandlers = new Map();
    this.onHandlers = new Map();
    this.installed = false;
  }

  install() {
    if (this.installed) {
      return;
    }
    this.installed = true;

    const originalHandle = ipcMain.handle.bind(ipcMain);
    const originalOn = ipcMain.on.bind(ipcMain);

    ipcMain.handle = (channel, handler) => {
      this.handleHandlers.set(channel, handler);
      return originalHandle(channel, handler);
    };
    ipcMain.on = (channel, handler) => {
      this.onHandlers.set(channel, handler);
      return originalOn(channel, handler);
    };
  }

  buildFakeEvent() {
    return {
      sender: null,
      senderFrame: null,
      frameId: -1,
      processId: 0,
      reply: () => {}
    };
  }

  async dispatchInvoke(channel, args) {
    const handler = this.handleHandlers.get(channel);
    if (!handler) {
      throw new Error(`No ipc handler registered for '${channel}'`);
    }
    return await handler(this.buildFakeEvent(), ...args);
  }

  dispatchSend(channel, args) {
    const handler = this.onHandlers.get(channel);
    if (!handler) {
      throw new Error(`No ipc listener registered for '${channel}'`);
    }
    handler(this.buildFakeEvent(), ...args);
  }
}

const ipcBridge = new IpcBridge();

const injectShim = (html) => html.replace(/<head([^>]*)>/i, '<head$1><script src="/ipc-shim.js"></script>');

// Debug echo endpoint: /_echo and /_echo/<anything>.
// Query params: status=<http code>, delay=<ms>, type=<content-type>,
// body=<response body override>. Without overrides it answers with a JSON
// echo of the request (method, url, headers, query, body).
const registerEchoRoutes = (app) => {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.text({ type: '*/*', limit: '10mb' }));

  const echoHandler = (req, res) => {
    const delay = Number(req.query.delay);
    const respond = () => {
      if (Number(req.query.status) && Number(req.query.status) > 0) {
        res.status(Number(req.query.status));
      }

      const contentType = req.query.type;
      if (contentType) {
        res.set('content-type', contentType);
      }

      if (req.query.body !== undefined) {
        res.send(req.query.body);
        return;
      }

      res.json({
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        headers: req.headers,
        query: req.query,
        body: req.body
      });
    };

    if (delay > 0) {
      setTimeout(respond, Math.min(delay, 60000));
    } else {
      respond();
    }
  };

  app.all(['/_echo', '/_echo/*'], echoHandler);
};

const startWebServer = ({ port, devPort, webDir }) => new Promise((resolve, reject) => {
  const app = express();
  app.set('query parser', parseQueryParamsPreservingPlus);
  const hasStaticBuild = webDir && fs.existsSync(path.join(webDir, 'index.html'));

  const serveIndexHtml = async (req, res) => {
    try {
      let html;
      if (hasStaticBuild) {
        html = await fs.promises.readFile(path.join(webDir, 'index.html'), 'utf8');
      } else {
        // Dev mode: bruno-electron/web does not exist, proxy the renderer dev server.
        const response = await fetch(`http://127.0.0.1:${devPort}${req.originalUrl}`);
        html = await response.text();
      }
      res.type('html').send(injectShim(html));
    } catch (err) {
      res.status(502).type('html').send(
        `<h3>Bruno web server</h3><p>Failed to load the renderer page: ${err.message}</p>`
        + (hasStaticBuild ? '' : `<p>Is the dev server running at http://127.0.0.1:${devPort} ?</p>`)
      );
    }
  };

  app.get(['/', '/index.html'], serveIndexHtml);

  app.get('/ipc-shim.js', (req, res) => {
    res.type('application/javascript').send(fs.readFileSync(path.join(__dirname, 'ipc-shim.js'), 'utf8'));
  });

  registerEchoRoutes(app);

  if (hasStaticBuild) {
    app.use(express.static(webDir));
  } else {
    // Dev mode: proxy remaining asset requests to the renderer dev server.
    app.use(async (req, res) => {
      try {
        const response = await fetch(`http://127.0.0.1:${devPort}${req.originalUrl}`, {
          method: req.method,
          headers: { accept: req.headers.accept || '*/*' }
        });
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const html = await response.text();
          res.type('html').send(injectShim(html));
        } else {
          const body = Buffer.from(await response.arrayBuffer());
          res.status(response.status).type(contentType || 'application/octet-stream').send(body);
        }
      } catch (err) {
        res.status(502).type('html').send(
          `<h3>Bruno web server</h3><p>Renderer dev server not reachable at http://127.0.0.1:${devPort}</p>`
        );
      }
    });
  }

  const server = app.listen(port, '127.0.0.1');
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ipc') {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });

  const broadcastEvent = (channel, args) => {
    const payload = JSON.stringify({
      t: 'event',
      channel,
      args: (args || []).map((arg) => safeParseJSON(safeStringifyJSON(arg)))
    });
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  };

  wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (err) {
        return;
      }

      if (msg.t === 'invoke') {
        try {
          const data = await ipcBridge.dispatchInvoke(msg.channel, msg.args || []);
          const safeData = safeParseJSON(safeStringifyJSON(data));
          ws.send(JSON.stringify({ t: 'result', id: msg.id, ok: true, data: safeData }));
        } catch (err) {
          ws.send(JSON.stringify({ t: 'result', id: msg.id, ok: false, error: err && err.message ? err.message : String(err) }));
        }
      } else if (msg.t === 'send') {
        try {
          ipcBridge.dispatchSend(msg.channel, msg.args || []);
        } catch (err) {
          console.error(`Web bridge: failed to dispatch '${msg.channel}':`, err.message);
        }
      }
    });
  });

  server.on('error', (err) => reject(err));
  server.on('listening', () => resolve({
    port: server.address().port,
    url: `http://127.0.0.1:${server.address().port}`,
    broadcastEvent,
    close: () => new Promise((res) => {
      for (const client of wss.clients) {
        client.terminate();
      }
      wss.close(() => server.close(() => res()));
    })
  }));
});

/**
 * Starts the web server on the requested port, walking up to
 * MAX_PORT_ATTEMPTS consecutive ports if one is taken.
 */
const startWebServerWithFallbackPort = async ({ port, devPort, webDir }) => {
  let lastErr = null;
  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
    try {
      return await startWebServer({ port: Number(port) + attempt, devPort, webDir });
    } catch (err) {
      lastErr = err;
      if (!err || err.code !== 'EADDRINUSE') {
        throw err;
      }
    }
  }
  throw lastErr;
};

module.exports = {
  ipcBridge,
  startWebServer: startWebServerWithFallbackPort,
  DEFAULT_WEB_SERVER_PORT: DEFAULT_PORT
};
