/**
 * Minimal CDP driver.
 *
 * Playwright has no Android build, so this talks to the system Chromium over the
 * DevTools protocol directly. Node 22+ ships a global WebSocket, so there are no
 * dependencies at all.
 *
 * Convention: every `send` resolves with the command's `result`, and throws on
 * `error`. Malformed params raise instead of hanging, because a protocol error
 * that looks like a stall is worse than a crash.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* browser not up yet */
    }
    await sleep(250);
  }
  throw new Error('CDP endpoint never became ready: ' + url);
}

export async function launch({ width = 1440, height = 900, port = 9333, binary } = {}) {
  const profile = await mkdtemp(join(tmpdir(), 'cdp-'));
  const chrome = spawn(
    binary ?? process.env.CHROME_BIN ?? 'chromium-browser',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--force-color-profile=srgb',
      '--disable-lcd-text',
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      `about:blank`,
    ],
    { stdio: 'ignore' },
  );

  const version = await fetchJSON(`http://127.0.0.1:${port}/json/version`);
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error('CDP socket failed'));
  });

  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error.data ?? '')})`));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  };

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (pending.has(mid)) {
          pending.delete(mid);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);

  await call('Page.enable');
  await call('Runtime.enable');
  await call('Log.enable');
  await call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const consoleErrors = [];
  listeners.push((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      consoleErrors.push('pageerror: ' + (d.exception?.description ?? d.text));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push('console.error: ' + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push('log: ' + msg.params.entry.text + ' ' + (msg.params.entry.url ?? ''));
    }
  });

  const api = {
    consoleErrors,
    send: call,
    on: (fn) => listeners.push(fn),
    async goto(url, settle = 900) {
      await call('Page.navigate', { url });
      await sleep(settle);
    },
    async setViewport(w, h) {
      await call('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(320);
    },
    async evaluate(fn, arg) {
      // A string is used verbatim as the expression (for probes that need to be
      // composed with a helper), a function is stringified and invoked.
      const expression =
        typeof fn === 'string' ? fn : `(${fn.toString()})(${arg === undefined ? '' : JSON.stringify(arg)})`;
      const r = await call('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) {
        throw new Error('page eval threw: ' + (r.exceptionDetails.exception?.description ?? ''));
      }
      return r.result.value;
    },
    async shot(path, { fullPage = false } = {}) {
      const params = { format: 'png' };
      if (fullPage) params.captureBeyondViewport = true;
      const { data } = await call('Page.captureScreenshot', params);
      const { writeFile } = await import('node:fs/promises');
      await writeFile(path, Buffer.from(data, 'base64'));
      return path;
    },
    async key(text, code, keyCode) {
      for (const type of ['keyDown', 'keyUp']) {
        await call('Input.dispatchKeyEvent', { type, key: text, code, windowsVirtualKeyCode: keyCode });
      }
      await sleep(90);
    },
    async click(selector) {
      // The element may be below the fold; scroll it in and re-read the rect, or
      // the synthetic click lands on the wrong coordinates and the test lies.
      const box = await api.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const b = el.getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height };
      }, selector);
      if (!box) throw new Error('no element for ' + selector);
      if (box.y < 0 || box.y > 900) throw new Error(`click target offscreen: ${selector} y=${box.y}`);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await call('Input.dispatchMouseEvent', {
          type,
          x: box.x,
          y: box.y,
          button: 'left',
          clickCount: 1,
        });
      }
      await sleep(280);
      return box;
    },
    async close() {
      try {
        ws.close();
      } catch {}
      chrome.kill('SIGKILL');
      await sleep(300);
      await rm(profile, { recursive: true, force: true });
    },
  };
  return api;
}
