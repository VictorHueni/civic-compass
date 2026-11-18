/*
 * Captures the screens of the media page at phone width, for the Screens tab of this sheet.
 * The page is not built yet: the screens come from the owner-approved mockup (v3, 2026-11-17),
 * whose sources are kept outside git. Once US-20 and US-21 are built, point MOCKUP at a page of
 * dist/ instead and capture the real site.
 *
 *   node docs/plans/active/transparency-media/capture-screens.ts [<mockup folder>]
 *
 * <mockup folder> holds the mockup's index.html; it defaults to the handoff copy under var/handoffs/.
 * The mockup loads Cytoscape, fcose and ECharts from public CDNs: the script downloads them first,
 * so the capture needs network.
 * Each screenshot is framed in an SVG twice: views/<name>.svg (light frame) and views/dark/<name>.svg
 * (dark frame). The site has a light theme only, so the screenshot is the same in both.
 *
 * Needs Chromium (CHROMIUM env var, else "chromium" on the PATH) and Node 26 (built-in WebSocket).
 */
import { spawn } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../../..");
const MOCKUP = resolve(process.argv[2] ?? join(ROOT, "var/handoffs/transparency-media-lobbies/02-mockup-sources/site-mock"));
const WIDTH = 390;
const HEIGHT = 780;
const SCALE = 1.5;
const PORT = 9334;

/** One screen: the query and hash to open, then the steps to reach the state shown (run in the page). */
interface Screen {
  name: string;
  query?: string;
  hash: string;
  steps?: string[];
}
const scrollTo = (selector: string, offset: number) => [`document.querySelector('${selector}').scrollIntoView()`, `window.scrollBy(0, ${offset})`];
const SCREENS: Screen[] = [
  { name: "ui-01-menu-transparence", hash: "#media", steps: ["document.getElementById('menu-btn').click()"] },
  { name: "ui-02-media-network", hash: "#media", steps: scrollTo(".mx-switch", -20) },
  { name: "ui-03-media-sun", query: "?view=sun", hash: "#media", steps: scrollTo(".mx-switch", -110) },
  { name: "ui-04-media-card-disputed", query: "?show=tvlb", hash: "#media", steps: scrollTo("#mx-detail", -20) },
  { name: "ui-05-media-card-fog", query: "?show=m_24h", hash: "#media", steps: scrollTo("#mx-detail", -20) },
  { name: "ui-06-media-bridges-list", hash: "#media", steps: scrollTo(".mx-c", -20) },
  { name: "ui-07-media-report-error", query: "?show=m_lib", hash: "#media", steps: ["document.querySelector('.mx-report-box').open = true", ...scrollTo(".mx-report-box", -300)] },
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

/**
 * Headless Chromium can stall on the CDNs the mockup names. Copy the mockup into `into`, let Node
 * download each library once, and point the page at the local copies: the capture then needs
 * network for those downloads only. Returns the file URL of the copied page.
 */
async function localMockup(into: string): Promise<string> {
  cpSync(MOCKUP, into, { recursive: true });
  const page = join(into, "index.html");
  let html = readFileSync(page, "utf8");
  const urls = [...html.matchAll(/<script src="(https:\/\/[^"]+)"/g)].map((m) => m[1]);
  for (const [i, url] of urls.entries()) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    const name = `lib-${i}.js`;
    writeFileSync(join(into, name), Buffer.from(await r.arrayBuffer()));
    html = html.replace(url, name);
  }
  writeFileSync(page, html);
  return pathToFileURL(page).href;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const profile = mkdtempSync(join(tmpdir(), "capture-"));
  const copy = mkdtempSync(join(tmpdir(), "mockup-"));
  const PAGE = await localMockup(copy);
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

    await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: false }); // the mockup has no viewport meta: lay it out at 390 px as is
    mkdirSync(join(HERE, "views/dark"), { recursive: true });
    for (const s of SCREENS) {
      await send("Page.navigate", { url: "about:blank" });
      await sleep(200);
      await send("Page.navigate", { url: PAGE + (s.query ?? "") + s.hash });
      // The graph libraries come from CDNs and the layout runs once: give both time.
      await run(
        "new Promise((ok, ko) => { const t0 = Date.now(); (function wait() {" +
          " if (typeof cytoscape !== 'undefined' && typeof echarts !== 'undefined' && document.readyState === 'complete') ok(true);" +
          " else if (Date.now() - t0 > 20000) ko(new Error('Cytoscape or ECharts did not load: cytoscape=' + typeof cytoscape + ', echarts=' + typeof echarts));" +
          " else setTimeout(wait, 200); })(); })",
      );
      await sleep(1500);
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
    rmSync(copy, { recursive: true, force: true });
  }
}

await main();
