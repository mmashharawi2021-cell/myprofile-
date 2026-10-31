import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";

const base = "http://127.0.0.1:4173/myprofile-/";
const output = "qa-artifacts";
mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ["./node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, CI: "1" },
});
let serverLog = "";
for (const stream of [server.stdout, server.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => { serverLog += chunk; });
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error("Vite preview exited early: " + serverLog);
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error("Vite preview did not start: " + serverLog);
}

const failures = [];
const results = [];
let browser;
async function check(name, run) {
  try {
    await run();
    results.push({ name, status: "pass" });
    console.log("PASS " + name);
  } catch (error) {
    failures.push({ name, error: String(error?.stack ?? error) });
    results.push({ name, status: "fail" });
    console.error("FAIL " + name, error);
  }
}

async function launchViewport(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    sessionStorage.setItem("portfolio-brand-intro-v2", "seen");
    window.__qaWindowOpen = null;
    window.open = (url) => { window.__qaWindowOpen = String(url); return null; };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator(".project-card").first().waitFor();
  return { context, page, errors };
}

try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });

  for (const [width, height] of [[320, 700], [390, 844], [768, 1024], [1280, 800]]) {
    await check("Responsive & first-project image: " + width, async () => {
      const { context, page, errors } = await launchViewport(width, height);
      try {
        const hero = page.locator(".hero-project-button img");
        assert.equal(await hero.getAttribute("alt"), "UN Field", "Hero must display UN Field first");
        const mainImg = await hero.evaluate(async (image) => {
          try { await image.decode(); } catch {}
          return { loaded: image.complete && image.naturalWidth > 0, src: image.currentSrc };
        });
        assert.ok(mainImg.loaded, "UN Field hero image failed to load: " + mainImg.src);
        const first = page.locator(".project-card").first();
        assert.match(await first.innerText(), /UN Field/);
        assert.equal(await page.locator(".project-card").count(), 5);
        const extent = await page.evaluate(() => ({
          pageWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        }));
        const horizontalScroll = await page.evaluate(() => {
          const scroller = document.scrollingElement;
          const initialY = window.scrollY;
          window.scrollTo({ left: 1000, top: initialY, behavior: "instant" });
          const actualX = window.scrollX;
          window.scrollTo({ left: 0, top: initialY, behavior: "instant" });
          return { availableWidth: scroller.clientWidth, scrollableWidth: scroller.scrollWidth, actualX };
        });
        assert.ok(horizontalScroll.scrollableWidth <= horizontalScroll.availableWidth + 2
          && horizontalScroll.actualX < 2,
          "Page can actually scroll horizontally: " + JSON.stringify({ ...extent, ...horizontalScroll }));
        const firstCardImg = first.locator(".project-preview img");
        await firstCardImg.scrollIntoViewIfNeeded();
        const cardLoaded = await firstCardImg.evaluate(async (image) => {
          try { await image.decode(); } catch {}
          return image.naturalWidth > 0;
        });
        assert.ok(cardLoaded, "First project card image failed to load");
        assert.deepEqual(errors, [], "JavaScript exceptions in browser");
        await page.screenshot({ path: output + "/portfolio-" + width + ".png", fullPage: true, animations: "disabled" });
      } finally { await context.close(); }
    });
  }

  await check("Project filters, dialog navigation and Escape", async () => {
    const { context, page, errors } = await launchViewport(390, 844);
    try {
      const filters = page.locator(".filters button");
      await filters.nth(1).click();
      assert.equal(await page.locator(".project-card").count(), 2, "GIS filter must show two projects");
      await filters.nth(0).click();
      assert.equal(await page.locator(".project-card").count(), 5);
      await page.locator(".project-card").first().locator(".project-info h3 button").click();
      const dialog = page.locator("dialog.studio-dialog");
      await dialog.waitFor({ state: "visible" });
      assert.match(await dialog.locator("#project-title").innerText(), /UN Field/);
      await dialog.locator(".dialog-navigation button").last().click();
      assert.match(await dialog.locator("#project-title").innerText(), /رِفق/);
      await dialog.locator(".dialog-navigation button").first().click();
      assert.match(await dialog.locator("#project-title").innerText(), /UN Field/);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 5000 });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check("Light/dark persistence and mobile navigation", async () => {
    const { context, page, errors } = await launchViewport(390, 844);
    try {
      const initial = await page.locator("html").getAttribute("data-theme");
      assert.equal(initial, "dark");
      await page.getByRole("button", { name: "تفعيل الوضع الفاتح" }).click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
      await page.reload({ waitUntil: "domcontentloaded" });
      assert.equal(await page.locator("html").getAttribute("data-theme"), "light",
        "Theme preference must survive reload");
      await page.getByRole("button", { name: "تفعيل الوضع الداكن" }).click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
      const menu = page.getByRole("button", { name: "القائمة" });
      await menu.click();
      assert.equal(await menu.getAttribute("aria-expanded"), "true");
      await page.locator(".desktop-nav a[href='#projects']").click();
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check("Contact form validation and WhatsApp URL", async () => {
    const { context, page, errors } = await launchViewport(390, 844);
    try {
      await page.locator(".contact-form button[type='submit']").click();
      assert.equal(await page.evaluate(() => window.__qaWindowOpen), null,
        "Required fields must block an empty form");
      await page.locator("input[name='name']").fill("QA Test");
      await page.locator("textarea[name='message']").fill("فحص تواصل دون إرسال");
      await page.locator(".contact-form button[type='submit']").click();
      const opened = await page.evaluate(() => window.__qaWindowOpen);
      assert.match(opened ?? "", /^https:\/\/wa\.me\/[0-9]+\?text=/);
      assert.match(decodeURIComponent(opened), /QA Test/);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check("Intro is skippable without leaving page locked", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const skip = page.getByRole("button", { name: /تخطي المقدمة/ });
      await skip.waitFor({ state: "visible" });
      await skip.click();
      await page.locator(".brand-intro-overlay").waitFor({ state: "detached" });
      assert.notEqual(await page.locator("html").evaluate(el => el.style.overflow), "hidden");
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  writeFileSync(output + "/results.json", JSON.stringify({ results, failures, serverLog }, null, 2));
}
if (failures.length) {
  console.error("QA failed " + failures.length + " / " + results.length + " cases");
  process.exitCode = 1;
} else {
  console.log("QA passed " + results.length + " cases");
}
