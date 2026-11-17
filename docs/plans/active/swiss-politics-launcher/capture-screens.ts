/*
 * Captures the voter screens of the built site at phone width, for the Screens tab of this sheet.
 * Each screenshot is framed in an SVG twice: views/<name>.svg (light frame) and views/dark/<name>.svg
 * (dark frame). The site itself has a light theme only, so the screenshot is the same in both.
 *
 *   npm run build                                  (at the repository root, writes dist/)
 *   node docs/plans/active/swiss-politics-launcher/capture-screens.ts
 *
 * Needs Chromium (CHROMIUM env var, else "chromium" on the PATH) and Node 26 (built-in WebSocket).
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../../..");
const PAGE = pathToFileURL(join(ROOT, "dist/index.html")).href;
const WIDTH = 390;
const HEIGHT = 780;
const SCALE = 1.5;
const PORT = 9333;

/** One screen: the address to open, then the steps to reach the state shown (run in the page). */
interface Screen {
  name: string;
  hash: string;
  steps?: string[];
  storage?: string;
}
const SCREENS: Screen[] = [
  { name: "ui-01-ballot-list", hash: "#ballot/ch" },
  { name: "ui-02-item-understand", hash: "#ballot/ch", steps: ["document.querySelector('.ballot-item[data-item=\"0\"]').click()"] },
  { name: "ui-03-item-compare", hash: "#ballot/ch", steps: ["document.querySelector('.ballot-item[data-item=\"0\"]').click()", "document.querySelector('[data-step=\"1\"]').click()", "window.scrollTo(0, 330)"] },
  { name: "ui-04-item-decide", hash: "#ballot/ge", steps: ["document.querySelector('.ballot-item[data-item=\"0\"]').click()", "document.querySelector('[data-step=\"2\"]').click()"] },
  { name: "ui-05-territory-sheet", hash: "#parties/ge", steps: ["document.getElementById('scope-btn').click()"] },
  { name: "ui-06-parties", hash: "#parties/ge", steps: ["document.getElementById('next').click()", "document.getElementById('next').click()", "window.scrollTo(0, 120)"] },
  { name: "ui-07-tools", hash: "#tools/ge" },
  { name: "ui-08-state-sites", hash: "#state/ge", steps: ["const q = document.getElementById('q'); q.value = 'grand'; q.dispatchEvent(new Event('input'))"] },
  { name: "ui-09-menu", hash: "#ballot/ge", steps: ["document.getElementById('menu-btn').click()"] },
  { name: "ui-10-institutions-ch", hash: "#institutions/ch", steps: ["window.scrollTo(0, 60)"] },
  { name: "ui-11-institutions-ch-chambers", hash: "#institutions/ch", steps: ["document.getElementById('t-national-council').scrollIntoView()", "window.scrollBy(0, -70)"] },
  { name: "ui-12-institutions-ge", hash: "#institutions/ge", steps: ["window.scrollTo(0, 60)"] },
  { name: "ui-13-party-card-ch", hash: "#parties/ch", steps: [...Array(7)].map(() => "document.getElementById('next').click()").concat(["document.getElementById('detail').scrollIntoView()", "window.scrollBy(0, -130)"]) },
  { name: "ui-14-party-card-ge", hash: "#parties/ge", steps: [...Array(2)].map(() => "document.getElementById('next').click()").concat(["document.getElementById('detail').scrollIntoView()", "window.scrollBy(0, -130)"]) },
  { name: "ui-15-institutions-ge-grand-council", hash: "#institutions/ge", steps: ["document.getElementById('t-grand-council').scrollIntoView()", "window.scrollBy(0, -70)"] },
  { name: "ui-16-institutions-ge-bern", hash: "#institutions/ge", steps: ["document.getElementById('t-canton-in-bern').scrollIntoView()", "window.scrollBy(0, -70)"] },
  { name: "ui-17-institutions-ch-party-members", hash: "#institutions/ch", steps: ["document.querySelector('.seat-legend__btn[data-council=\"CN\"][data-group=\"PLR\"]').click()", "document.querySelector('.seat-legend__btn[data-council=\"CN\"][data-group=\"PLR\"]').scrollIntoView()", "window.scrollBy(0, -180)"] },
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

    await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: true });
    mkdirSync(join(HERE, "views/dark"), { recursive: true });
    for (const s of SCREENS) {
      // A fresh page per screen: no territory remembered from the previous one.
      await send("Page.navigate", { url: "about:blank" });
      await sleep(200);
      await send("Page.navigate", { url: PAGE + s.hash });
      await sleep(800);
      await run("try { localStorage.clear() } catch (e) {}");
      await send("Page.reload", {});
      await sleep(800);
      for (const step of s.steps ?? []) {
        await run(step);
        await sleep(300);
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
