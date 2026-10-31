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
    sessionStorage.setItem("portfolio-digital-glitch-v1", "seen");
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

  await check("Recruitment inquiry uses the existing WhatsApp form", async () => {
    const { context, page, errors } = await launchViewport(390, 844);
    try {
      const types = page.locator(".contact-form select[name='type']");
      await types.selectOption({ label: "فرصة عمل أو تعاون مهني" });
      await page.locator(".contact-form input[name='name']").fill("جهة توظيف اختبار");
      await page.locator(".contact-form textarea[name='message']").fill("فرصة عمل في نظم المعلومات الجغرافية");
      await page.locator(".contact-form button[type='submit']").click();
      const opened = await page.evaluate(() => window.__qaWindowOpen);
      assert.match(opened ?? "", /^https:\/\/wa\.me\/[0-9]+\?text=/);
      const message = new URL(opened).searchParams.get("text");
      assert.match(message ?? "", /فرصة عمل أو تعاون مهني/);
      assert.match(message ?? "", /جهة توظيف اختبار/);
      assert.match(message ?? "", /فرصة عمل في نظم المعلومات الجغرافية/);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check("Contact links, keyboard entry and accessibility landmarks", async () => {
    const { context, page, errors } = await launchViewport(390, 844);
    try {
      assert.equal(await page.locator("main#main").count(), 1);
      assert.equal(await page.locator("a.skip-link[href='#main']").count(), 1);
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains("skip-link")), true,
        "Skip-to-content must be first in keyboard navigation");
      const hrefs = await page.locator("#contact a").evaluateAll(links =>
        links.map(a => ({ href: a.getAttribute("href"), text: a.textContent.trim() }))
      );
      assert.ok(hrefs.some(a => /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.href ?? "")), "Email link required");
      assert.ok(hrefs.some(a => /^https:\/\/github\.com\//.test(a.href ?? "")), "GitHub link required");
      assert.ok(hrefs.some(a => /^https:\/\/wa\.me\/[0-9]+\?text=/.test(a.href ?? "")), "WhatsApp link required");
      const invalidExternal = await page.locator("a[target='_blank']").evaluateAll(links =>
        links.filter(a => !/\b(noopener|noreferrer)\b/.test(a.getAttribute("rel") ?? "")).map(a => a.href)
      );
      assert.deepEqual(invalidExternal, [], "External links should protect the opener");
      const missingAlt = await page.locator("img").evaluateAll(images =>
        images.filter(img => !img.hasAttribute("alt")).map(img => img.currentSrc)
      );
      assert.deepEqual(missingAlt, [], "Images need alt attributes (empty for decorative branding)");
      assert.equal(await page.locator(".contact-form label").count(), 3, "Form controls must have labels");
      const heroImage = page.locator(".hero-project-button img");
      assert.equal(await heroImage.getAttribute("fetchpriority"), "high");
      assert.equal(await heroImage.getAttribute("loading"), "eager");
      assert.equal(await page.locator(".project-card img[loading='lazy']").count(), 5);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check("Social profiles in contact and footer on mobile and desktop", async () => {
    const expected = [
      ["LinkedIn", "https://www.linkedin.com/in/mohanad-elmashharawi-a4bb23148"],
      ["Facebook", "https://www.facebook.com/share/18ytFS2SDE/"],
      ["Instagram", "https://www.instagram.com/mohanad.mashharawi/"],
      ["TikTok", "https://www.tiktok.com/@mohanad.mashharawi"],
      ["GitHub", "https://github.com/mmashharawi2021-cell"],
    ];
    for (const width of [320, 1280]) {
      const { context, page, errors } = await launchViewport(width, 800);
      try {
        const contactLinks = await page.locator("#contact .contact-social a").evaluateAll(links =>
          links.map(a => ({ label: a.textContent.trim(), url: a.getAttribute("href"), rel: a.getAttribute("rel") }))
        );
        const footerLinks = await page.locator("footer .footer-social a").evaluateAll(links =>
          links.map(a => ({ label: a.getAttribute("aria-label"), url: a.getAttribute("href"), rel: a.getAttribute("rel") }))
        );
        assert.equal(contactLinks.length, 7, "Six networks and existing email in contact");
        assert.equal(footerLinks.length, 6, "Six networks in footer");
        for (const [label, url] of expected) {
          assert.equal(contactLinks.find(item => item.label === label)?.url, url, label + " contact link");
          assert.equal(footerLinks.find(item => item.label === label)?.url, url, label + " footer link");
        }
        for (const links of [contactLinks, footerLinks]) {
          const wa = links.find(item => item.label === "واتساب");
          assert.match(wa?.url ?? "", /^https:\/\/wa\.me\/972599876261\?text=/, "Current WhatsApp number");
          assert.ok(links.every(item => item.url?.startsWith("mailto:") ||
            /\bnoopener\b/.test(item.rel ?? "") && /\bnoreferrer\b/.test(item.rel ?? "")),
            "External social links must use safe target attributes");
        }
        assert.match(contactLinks.find(item => item.label === "البريد")?.url ?? "", /^mailto:/);
        const overflow = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        assert.ok(overflow.scrollWidth <= overflow.width + 2,
          "Social links must not cause horizontal scrolling: " + JSON.stringify(overflow));
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
  });

  await check("Digital glitch intro keeps the original V4 M and GIS pin", async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const overlay = page.locator(".brand-intro-overlay.digital-intro");
      await overlay.waitFor({ state: "visible" });
      assert.equal(await overlay.locator(".brand-intro-orbital-scene, .brand-intro-satellite").count(), 0);
      assert.equal(await overlay.locator(".brand-intro-laser-core, .brand-intro-laser-sweep").count(), 0,
        "Old laser loader must not be rendered");
      assert.equal(await overlay.locator(".digital-intro-fragment").count(), 10);
      assert.equal(await overlay.locator(".digital-intro-signal").count(), 16);
      assert.equal(await overlay.locator(".digital-intro-circuits").count(), 1);
      const shape = await overlay.locator(".digital-intro-edge").getAttribute("d");
      assert.match(shape ?? "", /\bC\b/, "The approved mark has curved V4 paths");
      assert.equal(shape, await overlay.locator("#digitalMarkClip path").getAttribute("d"));
      const url = await overlay.locator(".digital-intro-base").getAttribute("src");
      assert.match(url ?? "", /^\/myprofile-\/assets\/brand\/muhanad-symbol\.svg\?v=laser-glitch-v4-/);
      const asset = await page.evaluate(async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Logo asset unavailable: " + response.status);
        const image = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
        return {
          contour: image.querySelector("#shape path")?.getAttribute("d"),
          outline: image.querySelector('path[stroke="#6ABAFD"]')?.getAttribute("d"),
          pin: image.querySelectorAll('g[transform="translate(610 125)"] circle').length,
        };
      }, url);
      assert.equal(asset.contour, shape);
      assert.equal(asset.outline, shape);
      assert.equal(asset.pin, 1, "Original GIS pin must remain");
      assert.deepEqual(errors, []);
      await page.getByRole("button", { name: /تخطي المقدمة/ }).click();
      await overlay.waitFor({ state: "detached" });
    } finally { await context.close(); }
  });

  await check("Digital glitch is brief, assembled from one image and never loops", async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const overlay = page.locator(".brand-intro-overlay.digital-intro");
      await overlay.waitFor({ state: "visible" });
      await page.waitForFunction(() => document.querySelector(".digital-intro.is-running") !== null);
      const styles = await overlay.evaluate(el => {
        const fragment = el.querySelector(".digital-intro-fragment");
        const baseMark = el.querySelector(".digital-intro-base");
        const edge = el.querySelector(".digital-intro-edge");
        const fragmentCss = getComputedStyle(fragment);
        const baseCss = getComputedStyle(baseMark);
        return {
          fragmentAnimation: fragmentCss.animationName,
          iterations: fragmentCss.animationIterationCount,
          baseAnimation: baseCss.animationName,
          edgeAnimation: getComputedStyle(edge).animationName,
          imageCount: el.querySelectorAll(".digital-intro-fragment").length,
          uniqueImages: new Set(Array.from(el.querySelectorAll(".digital-intro-base, .digital-intro-fragment"), img => img.getAttribute("src"))).size,
        };
      });
      assert.match(styles.fragmentAnimation, /digital-fragment-reveal/);
      assert.equal(styles.iterations, "1");
      assert.match(styles.baseAnimation, /digital-base-reveal/);
      assert.match(styles.edgeAnimation, /digital-edge-assemble/);
      assert.equal(styles.imageCount, 10);
      assert.equal(styles.uniqueImages, 1, "All pieces reuse the original logo asset");
      await page.waitForTimeout(2100);
      const completed = await overlay.locator(".digital-intro-base").evaluate(el => ({
        opacity: Number.parseFloat(getComputedStyle(el).opacity),
        loaded: el.complete && el.naturalWidth > 0,
      }));
      assert.equal(completed.loaded, true);
      assert.ok(completed.opacity > .98, "The final resolved logo must be fully visible");
      await page.screenshot({ path: output + "/digital-glitch-resolved.png" });
      await page.getByRole("button", { name: /تخطي المقدمة/ }).click();
      await overlay.waitFor({ state: "detached" });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check("Digital glitch layout fits mobile and desktop without fake progress text", async () => {
    for (const [width, height] of [[320, 700], [390, 844], [1280, 800]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      try {
        await page.goto(base, { waitUntil: "domcontentloaded" });
        const overlay = page.locator(".brand-intro-overlay.digital-intro");
        await overlay.waitFor({ state: "visible" });
        assert.equal(await overlay.locator(".brand-intro-progress, .brand-intro-status, .brand-intro-ar, .brand-intro-en").count(), 0);
        const metrics = await overlay.locator(".digital-intro-symbol").evaluate(el => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
            viewportWidth: innerWidth, viewportHeight: innerHeight };
        });
        assert.ok(metrics.left >= 0 && metrics.right <= metrics.viewportWidth,
          "Mark must fit viewport width: " + JSON.stringify(metrics));
        assert.ok(metrics.top >= 0 && metrics.bottom <= metrics.viewportHeight,
          "Mark must fit viewport height: " + JSON.stringify(metrics));
        await page.screenshot({ path: output + "/digital-glitch-" + width + ".png" });
        await page.getByRole("button", { name: /تخطي المقدمة/ }).click();
        await overlay.waitFor({ state: "detached" });
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
  });

  await check("Digital glitch hands off exactly one M to header", async () => {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 800 }, reducedMotion: "no-preference",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      try {
        await page.goto(base, { waitUntil: "domcontentloaded" });
        const overlay = page.locator(".brand-intro-overlay.digital-intro");
        await overlay.waitFor({ state: "visible" });
        await page.waitForFunction(() => document.querySelector(".brand-intro-flight") !== null,
          { timeout: 6500 });
        const flight = await page.evaluate(() => {
          const symbol = document.querySelector(".digital-intro-symbol");
          const movingLogo = document.querySelector(".brand-intro-flight");
          return {
            originalVisibility: symbol && getComputedStyle(symbol).visibility,
            movingCount: document.querySelectorAll(".brand-intro-flight").length,
            movingVisible: movingLogo && getComputedStyle(movingLogo).visibility,
            movingLoaded: movingLogo && movingLogo.complete && movingLogo.naturalWidth > 0,
          };
        });
        assert.equal(flight.originalVisibility, "hidden",
          "Original must hide during flight to avoid double M");
        assert.equal(flight.movingCount, 1);
        assert.equal(flight.movingVisible, "visible");
        assert.equal(flight.movingLoaded, true);
        await page.screenshot({ path: output + "/digital-glitch-flight-" + width + ".png" });
        await overlay.waitFor({ state: "detached", timeout: 5000 });
        assert.equal(await page.locator(".brand-intro-flight").count(), 0);
        assert.equal(await page.locator(".site-header .portfolio-brand-mark.is-pending").count(), 0);
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
  });

  await check("Digital glitch intro respects reduced motion", async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      assert.equal(await page.locator(".brand-intro-overlay").count(), 0,
        "Reduced-motion visitors must not be forced through the intro");
    } finally { await context.close(); }
  });

  await check("Digital glitch intro exits naturally and keeps the header brand", async () => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const overlay = page.locator(".brand-intro-overlay");
      await overlay.waitFor({ state: "visible" });
      const began = Date.now();
      await overlay.waitFor({ state: "detached", timeout: 10000 });
      assert.ok(Date.now() - began < 6500, "Digital glitch intro must finish quickly");
      assert.equal(await page.locator(".site-header .portfolio-brand-mark.is-pending").count(), 0);
      assert.notEqual(await page.locator("html").evaluate(el => el.style.overflow), "hidden");
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
