/*
 * Captures the screens of the media page of the built site at phone width, for the Screens tab of this sheet.
 *
 *   npm run build
 *   node docs/plans/active/transparency-media/capture-screens.ts [<site folder>]
 *
 * <site folder> holds the built index.html; it defaults to dist/. The page is opened from disk (file://), as a
 * visitor would, with reduced motion so that scrolls and the graph's focus land at once; it needs no network.
 * Each screenshot is framed in an SVG twice: views/<name>.svg (light frame) and views/dark/<name>.svg
 * (dark frame). The site has a light theme only, so the screenshot is the same in both.
 *
 * Needs Chromium (CHROMIUM env var, else "chromium" on the PATH) and Node 26 (built-in WebSocket).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../../..");
const SITE = resolve(process.argv[2] ?? join(ROOT, "dist"));
const WIDTH = 390;
const HEIGHT = 780;
const SCALE = 1.5;
const PORT = 9334;

/** One screen: the steps that reach the state shown, run in the page once `ready` holds. */
interface Screen {
  name: string;
  /** A condition polled before the steps, such as the drawing being on the page. */
  ready: string;
  steps?: string[];
}
const scrollTo = (selector: string, offset: number) => [`document.querySelector('${selector}').scrollIntoView()`, `window.scrollBy(0, ${offset})`];
/** Finds a name with the page's own search, which opens its card. */
const find = (name: string) => `(() => { document.getElementById('media-q').value = ${JSON.stringify(name)}; document.getElementById('media-search').requestSubmit(); })()`;
const NETWORK_DRAWN = "!!document.querySelector('#media-pane canvas')";
const SCREENS: Screen[] = [
  { name: "ui-01-menu-transparence", ready: NETWORK_DRAWN, steps: ["document.getElementById('menu-btn').click()"] },
  { name: "ui-02-media-network", ready: NETWORK_DRAWN, steps: scrollTo(".media-switch", -20) },
  {
    name: "ui-03-media-sun",
    ready: NETWORK_DRAWN,
    steps: ["document.querySelector('[data-view=\"sun\"]').click()", ...scrollTo(".media-switch", -110)],
  },
  { name: "ui-04-media-card-disputed", ready: NETWORK_DRAWN, steps: [find("TV LEMAN BLEU SA"), ...scrollTo("#media-card", -20)] },
  { name: "ui-05-media-card-fog", ready: NETWORK_DRAWN, steps: [find("24 heures"), ...scrollTo("#media-card .fog-box", -300)] },
  { name: "ui-06-media-bridges-list", ready: NETWORK_DRAWN, steps: scrollTo(".media-chips", -110) },
  {
    name: "ui-07-media-report-error",
    ready: NETWORK_DRAWN,
    steps: [find("La Liberté"), "document.querySelector('#media-card .media-report').open = true", ...scrollTo("#media-card .media-report", -300)],
  },
];

const FRAMES = {
  light: { canvas: "#FFFFFF", border: "#D7DCE3" },
  dark: { canvas: "#1A1E24", border: "#353C46" },
};

function frame(png: string, theme: keyof typeof FRAMES): string {
  const f = FRAMES[theme];
  const pad = 12;
  const w = WIDTH + pad * 2;
  const h = HEIGHT + pad * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="22" fill="${f.canvas}" stroke="${f.border}"/>` +
    `<image x="${pad}" y="${pad}" width="${WIDTH}" height="${HEIGHT}" href="data:image/png;base64,${png}"/>` +
    `<rect x="${pad + 0.5}" y="${pad + 0.5}" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="12" fill="none" stroke="${f.border}"/>` +
    `</svg>\n`
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const index = join(SITE, "index.html");
  if (!existsSync(index)) throw new Error(`${index} not found: run npm run build first`);
  const PAGE = pathToFileURL(index).href;
  const profile = mkdtempSync(join(tmpdir(), "capture-"));
  const browser = spawn(process.env.CHROMIUM || "chromium", [
    "--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    "--hide-scrollbars", "--force-color-profile=srgb", "about:blank",
  ], { stdio: "ignore" });
  try {
    let target: { webSocketDebuggerUrl: string } | undefined;
    for (let i = 0; i < 50 && !target; i++) {
      await sleep(200);
      try {
        const list = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
        target = list.find((t) => t.type === "page");
      } catch {}
    }
    if (!target) throw new Error("Chromium did not start");
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let id = 0;
    const pending = new Map<number, (v: any) => void>();
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(String(e.data));
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)?.(msg);
        pending.delete(msg.id);
      }
    });
    const send = (method: string, params: object = {}) =>
      new Promise<any>((resolve, reject) => {
        const n = ++id;
        pending.set(n, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
        ws.send(JSON.stringify({ id: n, method, params }));
      });
    const run = async (expression: string) => {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(`${expression}: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    };

    await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: false });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    mkdirSync(join(HERE, "views/dark"), { recursive: true });
    for (const s of SCREENS) {
      await send("Page.navigate", { url: "about:blank" });
      await sleep(200);
      await send("Page.navigate", { url: PAGE + "#media" });
      // The second script loads on the first showing of the page and its layout runs once: wait for the drawing.
      await run(
        "new Promise((ok, ko) => { const t0 = Date.now(); (function wait() {" +
          ` if (document.readyState === 'complete' && (${s.ready})) ok(true);` +
          " else if (Date.now() - t0 > 20000) ko(new Error('the page did not reach its state: ' + " + JSON.stringify(s.ready) + "));" +
          " else setTimeout(wait, 200); })(); })",
      );
      await sleep(500);
      for (const step of s.steps ?? []) {
        await run(step);
        await sleep(400);
      }
      const shot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(HERE, "views", `${s.name}.svg`), frame(shot.data, "light"));
      writeFileSync(join(HERE, "views/dark", `${s.name}.svg`), frame(shot.data, "dark"));
      console.log(`views/${s.name}.svg + views/dark/${s.name}.svg`);
    }
    ws.close();
  } finally {
    browser.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}

await main();
