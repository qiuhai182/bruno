jest.mock('electron', () => {
  const handleHandlers = new Map();
  const onHandlers = new Map();
  return {
    ipcMain: {
      handle: jest.fn((channel, handler) => handleHandlers.set(channel, handler)),
      on: jest.fn((channel, handler) => onHandlers.set(channel, handler)),
      __handleHandlers: handleHandlers,
      __onHandlers: onHandlers
    }
  };
});

const fs = require('fs');
const os = require('os');
const path = require('path');
const WebSocket = require('ws');
const { ipcBridge, startWebServer } = require('../src/web-server');

const makeTempWebDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-web-'));
  fs.mkdirSync(path.join(dir, 'static'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), '<html><head><title>bruno</title></head><body>app</body></html>');
  fs.writeFileSync(path.join(dir, 'static/app.js'), 'console.log("app")');
  return dir;
};

describe('web-server', () => {
  let server;
  let webDir;
  const base = () => `http://127.0.0.1:${server.port}`;

  beforeAll(async () => {
    ipcBridge.install();
    webDir = makeTempWebDir();
    server = await startWebServer({ port: 0, devPort: 59999, webDir });
  });

  afterAll(async () => {
    await server.close();
    fs.rmSync(webDir, { recursive: true, force: true });
  });

  it('injects the ipc shim into index.html', async () => {
    const response = await fetch(base());
    const html = await response.text();
    expect(html).toContain('<script src="/ipc-shim.js"></script>');
    expect(html.indexOf('/ipc-shim.js')).toBeLessThan(html.indexOf('<title>'));
  });

  it('serves static assets and the shim itself', async () => {
    const asset = await fetch(`${base()}/static/app.js`);
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain('console.log');

    const shim = await fetch(`${base()}/ipc-shim.js`);
    expect(shim.headers.get('content-type')).toContain('javascript');
    expect(await shim.text()).toContain('window.ipcRenderer = shim');
  });

  it('echoes requests as JSON by default', async () => {
    const response = await fetch(`${base()}/_echo/test?x=1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-marker': 'yes' },
      body: JSON.stringify({ hello: 'world' })
    });
    expect(response.status).toBe(200);
    const echo = await response.json();
    expect(echo.method).toBe('POST');
    expect(echo.path).toBe('/_echo/test');
    expect(echo.query.x).toBe('1');
    expect(echo.headers['x-marker']).toBe('yes');
    expect(echo.body).toEqual({ hello: 'world' });
  });

  it('keeps plus signs in query params without requiring %2B', async () => {
    const response = await fetch(`${base()}/_echo?sign=ab+cd%20ef&raw=1%2B2`);
    const echo = await response.json();
    expect(echo.query.sign).toBe('ab+cd ef');
    expect(echo.query.raw).toBe('1+2');
  });

  it('honors status/body/type/delay overrides', async () => {
    const response = await fetch(`${base()}/_echo/override?status=418&body=brewed&type=text/teapot`);
    expect(response.status).toBe(418);
    expect(response.headers.get('content-type')).toContain('text/teapot');
    expect(await response.text()).toBe('brewed');
  });

  it('dispatches invokes through the ipc bridge', async () => {
    const registered = ipcMainHandleSpy('test:sum', async (event, a, b) => ({ sum: a + b }));
    expect(registered).toBeTruthy();

    const result = await ipcBridge.dispatchInvoke('test:sum', [2, 3]);
    expect(result).toEqual({ sum: 5 });

    await expect(ipcBridge.dispatchInvoke('test:missing', [])).rejects.toThrow(/No ipc handler/);
  });

  it('bridges invokes and events over the websocket', async () => {
    ipcMainHandleSpy('ws:ping', (event, message) => `pong:${message}`);

    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ipc`);
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    const eventPromise = new Promise((resolve) => {
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.t === 'event') {
          resolve(msg);
        }
      });
    });

    server.broadcastEvent('main:test-event', [{ value: 42 }]);

    const event = await eventPromise;
    expect(event.channel).toBe('main:test-event');
    expect(event.args[0].value).toBe(42);

    const invokeResult = await new Promise((resolve, reject) => {
      ws.send(JSON.stringify({ t: 'invoke', id: 1, channel: 'ws:ping', args: ['hi'] }));
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.t === 'result' && msg.id === 1) {
          msg.ok ? resolve(msg.data) : reject(new Error(msg.error));
        }
      });
      setTimeout(() => reject(new Error('invoke timed out')), 2000);
    });

    expect(invokeResult).toBe('pong:hi');
    ws.close();
  });
});

const { ipcMain } = require('electron');
const ipcMainHandleSpy = (channel, handler) => {
  ipcMain.handle(channel, handler);
  return ipcMain.__handleHandlers.get(channel);
};
