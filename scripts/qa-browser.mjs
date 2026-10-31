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

  await check("V4 intro has no orbits and uses a smooth M logo", async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const overlay = page.locator(".brand-intro-overlay");
      await overlay.waitFor({ state: "visible" });
      assert.equal(await overlay.locator(".brand-intro-orbital-scene").count(), 0,
        "No orbital scene may remain");
      assert.equal(await overlay.locator("animateMotion, .brand-intro-satellite").count(), 0,
        "No satellites or SMIL motion may remain");
      const traced = await overlay.locator(".brand-intro-outline path").getAttribute("d");
      assert.match(traced ?? "", /\bC\b/, "M outline should use smooth cubic Bezier curves");
      const logoUrl = await overlay.locator(".brand-intro-original").getAttribute("src");
      assert.match(logoUrl ?? "", /^\/myprofile-\/assets\/brand\/muhanad-symbol\.svg\?v=v4-refined-/,
        "The intro must load the updated logo asset");
      const svg = await page.evaluate(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Logo asset not available: " + response.status);
        const image = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
        const clipPath = image.querySelector("#shape path")?.getAttribute("d");
        return {
          clipPath,
          visibleOutline: image.querySelector('path[stroke="#6ABAFD"]')?.getAttribute("d"),
          contourCount: [...image.querySelectorAll("path")].filter(
            path => path.getAttribute("d") === clipPath,
          ).length,
        };
      }, logoUrl);
      assert.equal(svg.clipPath, traced, "Clip mask must use the same smooth outline as the intro");
      assert.equal(svg.visibleOutline, traced, "Visible outline must match the intro trace");
      assert.equal(svg.contourCount, 3,
        "All three logo contours should share the exact smooth path");
      const svgArtwork = await page.evaluate(async url => {
        const response = await fetch(url);
        const image = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
        const flow = image.querySelector("#geo-flow");
        const gradient = image.querySelector("#waveFade");
        return {
          contourLines: image.querySelectorAll("#contours path").length,
          contourOpacity: image.querySelector("#contours")?.getAttribute("opacity"),
          waveStrokes: [...(flow?.querySelectorAll("path") ?? [])].map(p => p.getAttribute("stroke-width")),
          fadeMask: flow?.getAttribute("mask"),
          stops: [...(gradient?.querySelectorAll("stop") ?? [])].map(s => s.getAttribute("offset")),
          pin: image.querySelectorAll('g[transform="translate(610 125)"] circle').length,
          colors: [...image.querySelectorAll("#blue stop")].map(s => s.getAttribute("stop-color")),
        };
      }, logoUrl);
      assert.equal(svgArtwork.contourLines, 4, "Topographic lines should be simplified to four");
      assert.equal(svgArtwork.contourOpacity, ".3");
      assert.deepEqual(svgArtwork.waveStrokes, ["62", "37", "6"], "Geospatial wave should be lighter");
      assert.equal(svgArtwork.fadeMask, "url(#waveFadeMask)", "Right wave ending should fade naturally");
      assert.deepEqual(svgArtwork.stops, ["0", ".83", "1"]);
      assert.equal(svgArtwork.pin, 1, "The original location pin must remain");
      assert.deepEqual(svgArtwork.colors, ["#07172B", "#0066CC", "#1684ED", "#00C8F0"],
        "Approved blue gradient colors must remain unchanged");
      assert.deepEqual(errors, []);
      await page.getByRole("button", { name: /تخطي المقدمة/ }).click();
      await overlay.waitFor({ state: "detached", timeout: 5000 });
    } finally { await context.close(); }
  });

  await check("Refined V4 loader legibility, full names and layout", async () => {
    for (const [width, height] of [[320, 700], [390, 844], [1280, 800]]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "no-preference",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      try {
        await page.goto(base, { waitUntil: "domcontentloaded" });
        const overlay = page.locator(".brand-intro-overlay");
        await overlay.waitFor({ state: "visible" });
        await page.waitForFunction(() =>
          document.querySelector(".brand-intro-en")?.textContent === "MUHANAD AL-MASHHARAWI",
          { timeout: 11000 });
        const metrics = await overlay.evaluate(el => {
          const top = el.querySelector(".brand-intro-top");
          const status = el.querySelector(".brand-intro-status");
          const logo = el.querySelector(".brand-intro-symbol");
          const name = el.querySelector(".brand-intro-ar");
          const english = el.querySelector(".brand-intro-en");
          const progress = el.querySelector(".brand-intro-progress");
          const box = node => {
            const r = node.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
          };
          return {
            topColor: getComputedStyle(top).color,
            statusColor: getComputedStyle(status).color,
            top: box(top), logo: box(logo), name: box(name),
            english: box(english), progress: box(progress),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            actualArabic: name.textContent,
            actualEnglish: english.textContent,
          };
        });
        assert.equal(metrics.topColor, "rgb(167, 196, 229)");
        assert.equal(metrics.statusColor, "rgb(185, 205, 228)");
        assert.equal(metrics.actualArabic.replace(/\\s/g, ""), "مهندالمشهراوي",
          "Arabic segments should complete and be visually separated by flex gap");
        assert.equal(metrics.actualEnglish, "MUHANAD AL-MASHHARAWI");
        for (const item of [metrics.logo, metrics.name, metrics.english, metrics.progress]) {
          assert.ok(item.left >= -1 && item.right <= metrics.viewportWidth + 1,
            "Loader item must fit viewport width: " + JSON.stringify({ width, item }));
          assert.ok(item.top >= -1 && item.bottom <= metrics.viewportHeight + 1,
            "Loader item must fit viewport height: " + JSON.stringify({ height, item }));
        }
        assert.ok(metrics.progress.top - metrics.english.bottom < 65,
          "English name and progress should not be separated by excessive whitespace");
        await page.screenshot({
          path: output + "/refined-v4-intro-" + width + ".png",
          animations: "allow",
        });
        await page.getByRole("button", { name: /تخطي المقدمة/ }).click();
        await overlay.waitFor({ state: "detached", timeout: 5000 });
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
  });

  await check("V4 loader respects reduced motion", async () => {
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

  await check("V4 loader exits naturally and keeps the header brand", async () => {
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
      await overlay.waitFor({ state: "detached", timeout: 15000 });
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
