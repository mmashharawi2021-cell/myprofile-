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
    sessionStorage.setItem("portfolio-traced-r13-intro-v2", "seen");
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

  await check("Synthetic mobile and desktop performance baseline", async () => {
    const measurements = [];
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
      await context.addInitScript(() => {
        window.__portfolioVitals = { lcp: null, cls: 0 };
        try {
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            if (entries.length) window.__portfolioVitals.lcp = entries.at(-1).startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
        } catch {}
        try {
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) window.__portfolioVitals.cls += entry.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
        } catch {}
      });
      const page = await context.newPage();
      try {
        await page.goto(base, { waitUntil: "networkidle" });
        await page.locator(".project-card").first().waitFor();
        const reading = await page.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          const paints = performance.getEntriesByType("paint");
          const fcp = paints.find(entry => entry.name === "first-contentful-paint");
          const assets = performance.getEntriesByType("resource").filter(entry =>
            new URL(entry.name).origin === location.origin && /\.(?:js|css|webp|svg)(?:$|\?)/.test(entry.name));
          return {
            width: innerWidth,
            fcpMs: fcp?.startTime ?? null,
            lcpMs: window.__portfolioVitals?.lcp ?? null,
            cls: window.__portfolioVitals?.cls ?? 0,
            domReadyMs: nav?.domContentLoadedEventEnd ?? null,
            loadMs: nav?.loadEventEnd ?? null,
            assetCount: assets.length,
            encodedAssetKB: Math.round(assets.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0) / 1024),
          };
        });
        measurements.push(reading);
        assert.ok(reading.assetCount > 0, "Expect some same-origin site assets");
      } finally { await context.close(); }
    }
    writeFileSync(output + "/performance-baseline.json", JSON.stringify({
      note: "Synthetic Playwright Chromium, reduced motion, local Vite preview; not Lighthouse or real-user Core Web Vitals. Values vary by runner.",
      measurements,
    }, null, 2));
  });

  await check("Static build has no CMS API requests or editor button", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const apiRequests = [];
    page.on("request", request => {
      if (new URL(request.url()).pathname.startsWith("/myprofile-/api/")) {
        apiRequests.push(request.url());
      }
    });
    try {
      await page.goto(base, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".editor-launch").count(), 0, "Static build must hide the CMS editor button");
      assert.deepEqual(apiRequests, [], "Static build must not request CMS API endpoints");
    } finally { await context.close(); }
  });

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

  await check("Offscreen card glow sampling waits until the card approaches the viewport", async () => {
    const { context, page, errors } = await launchViewport(390, 700);
    try {
      const last = page.locator(".project-card").last();
      const below = await last.evaluate(el => el.getBoundingClientRect().top > innerHeight + 200);
      assert.ok(below, "Last project should start beyond the sampling threshold");
      assert.equal(await last.locator(".card-glow.is-ready").count(), 0,
        "Do not decode offscreen card images just to compute glow");
      await last.scrollIntoViewIfNeeded();
      await last.locator(".card-glow.is-ready").waitFor({timeout:10000});
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });

  await check("Floating words are less dense on phones", async () => {
    for (const [width, shown] of [[390, 5], [1280, 18]]) {
      const { context, page, errors } = await launchViewport(width, 800);
      try {
        const counts = await page.locator(".floating-words > span").evaluateAll(nodes => ({
          total: nodes.length,
          visible: nodes.filter(node => getComputedStyle(node).display !== "none").length,
        }));
        assert.equal(counts.total, 18, "Preserve the 18 decorative words");
        assert.equal(counts.visible, shown, "Unexpected word density at width " + width);
        assert.deepEqual(errors, []);
      } finally { await context.close(); }
    }
  });

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
      await page.locator(".skip-link").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => document.activeElement?.id), "main",
        "Skip link should move keyboard focus to the main landmark");
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


  await check("Signature header keeps the approved M, removes its icon frame, and adds cyan rule", async () => {
    for (const [width,height] of [[320,700],[390,844],[1280,800]]) {
      const {context,page,errors}=await launchViewport(width,height);
      try {
        const header=page.locator(".site-header");
        const metrics=await header.evaluate(el=>{
          const mark=el.querySelector(".portfolio-brand-mark");
          const brandText=el.querySelector(".portfolio-brand-text");
          const img=mark.querySelector("img");
          const m=getComputedStyle(mark), t=getComputedStyle(brandText);
          const r=mark.getBoundingClientRect(), tr=brandText.getBoundingClientRect();
          return {
            width:r.width,height:r.height,border:m.borderTopWidth,
            imageSrc:img.getAttribute("src"),
            imageFilter:getComputedStyle(img).filter,
            dividerWidth:t.borderInlineStartWidth,
            dividerStyle:t.borderInlineStartStyle,
            bg:m.backgroundImage,
            brandTextRight:tr.right,
            scrollWidth:document.documentElement.scrollWidth,
            viewportWidth:document.documentElement.clientWidth,
          };
        });
        assert.equal(metrics.border,"0px","Signature has no surrounding frame");
        assert.equal(metrics.dividerWidth,"2px","Signature uses a slim blue text divider");
        assert.equal(metrics.dividerStyle,"solid");
        assert.match(metrics.bg,/radial-gradient/,"A subtle blue glow replaces the frame");
        assert.match(metrics.imageSrc??"",/traced-r13-logo\.svg/,"Original approved logo must remain");
        assert.match(metrics.imageFilter,/brightness/,"Unframed logo receives Signature luminance treatment");
        assert.ok(metrics.width>=48 && metrics.height>=50,"The GIS mark must remain legible");
        assert.ok(metrics.scrollWidth<=metrics.viewportWidth+2,
          "Signature header must never overflow viewport at width "+width+": "+JSON.stringify(metrics));
        await page.screenshot({path:output+"/signature-header-"+width+".png"});
        assert.deepEqual(errors,[]);
      } finally {await context.close();}
    }
  });

  await check("Signature header supports light theme without changing the loading animation", async () => {
    const {context,page,errors}=await launchViewport(390,844);
    try {
      const brand=page.locator(".site-header .portfolio-brand-mark");
      await page.evaluate(()=>document.documentElement.setAttribute("data-theme","light"));
      const state=await brand.evaluate(el=>({
        background:getComputedStyle(el).backgroundImage,
        divider:getComputedStyle(document.querySelector(".site-header .portfolio-brand-text")).borderInlineStartColor,
        logo:getComputedStyle(el.querySelector("img")).filter,
        src:el.querySelector("img").getAttribute("src"),
      }));
      assert.match(state.background,/radial-gradient/);
      assert.match(state.src??"",/traced-r13-logo\.svg/);
      assert.match(state.logo,/brightness/);
      assert.notEqual(state.divider,"rgba(0, 0, 0, 0)");
      assert.equal(await page.locator(".reference-intro").count(),0,
        "Loader is unchanged and should stay skipped for returning or reduced-motion users");
      assert.deepEqual(errors,[]);
    } finally {await context.close();}
  });

  await check("Accelerated r13 loader preserves SVG segments, map roads and both pins", async () => {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"no-preference"});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    try {
      await page.goto(base,{waitUntil:"domcontentloaded"});
      const overlay=page.locator(".brand-intro-overlay.reference-intro");
      await overlay.waitFor({state:"visible"});
      await page.waitForFunction(()=>document.querySelector(".reference-intro.is-running")!==null);
      // Collect all overlay-dependent data at once: the introduction lasts only 1.35s.
      const snapshot=await overlay.evaluate(el=>{
        const style=getComputedStyle(el.querySelector(".edge-segment"));
        return {
          fake:el.querySelectorAll("video, source, .reference-intro-slice, .brand-intro-progress").length,
          edges:el.querySelectorAll(".outline-layer .edge-segment").length,
          glows:el.querySelectorAll(".outline-layer .edge-glow").length,
          roads:el.querySelectorAll(".local-road, .topo-stroke, .main-road, .neon-road").length,
          glitches:el.querySelectorAll(".glitch-line").length,
          pin:el.querySelectorAll(".big-pin .pin-outer").length,
          hole:el.querySelectorAll(".big-pin .pin-hole").length,
          localPin:el.querySelectorAll(".small-pin .local-pin").length,
          shape:el.querySelector("#m-clip path")?.getAttribute("d"),
          viewBox:el.querySelector(".m-svg")?.getAttribute("viewBox"),
          animation:style.animationName, iterations:style.animationIterationCount, dash:style.strokeDasharray,
        };
      });
      assert.equal(snapshot.fake,0);
      assert.ok(snapshot.edges>=24 && snapshot.glows>=24 && snapshot.roads>=65);
      assert.equal(snapshot.glitches,16);
      assert.equal(snapshot.pin,1);
      assert.equal(snapshot.hole,1);
      assert.equal(snapshot.localPin,1);
      assert.match(snapshot.shape??"",/Q 7 8/);
      assert.equal(snapshot.viewBox,"-20 -20 420 360");
      assert.match(snapshot.animation,/draw-one/);
      assert.equal(snapshot.iterations,"1");
      assert.ok(snapshot.dash.includes("100"));
      const headerSrc=await page.locator(".site-header .portfolio-brand-mark img").getAttribute("src");
      assert.match(headerSrc??"",/traced-r13-logo\.svg\?v=approved-r13-traced-v2/);
      const asset=await page.evaluate(async url=>{
        const response=await fetch(url);
        const svg=new DOMParser().parseFromString(await response.text(),"image/svg+xml");
        return {ok:response.ok,parseError:Boolean(svg.querySelector("parsererror")),
          curve:svg.querySelector("#m-clip path")?.getAttribute("d"),
          pin:svg.querySelectorAll(".big-pin .pin-outer").length};
      },headerSrc);
      assert.ok(asset.ok);
      assert.equal(asset.parseError,false);
      assert.equal(asset.curve,snapshot.shape);
      assert.equal(asset.pin,1);
      await overlay.waitFor({state:"detached",timeout:2500});
      assert.notEqual(await page.locator("html").evaluate(el=>el.style.overflow),"hidden");
      assert.deepEqual(errors,[]);
    } finally {await context.close();}
  });

  await check("One-second SVG stroke timings preserve progressive drawing", async () => {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"no-preference"});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    try {
      await page.goto(base,{waitUntil:"domcontentloaded"});
      const overlay=page.locator(".reference-intro");
      await overlay.waitFor({state:"visible"});
      await page.waitForFunction(()=>document.querySelector(".reference-intro.is-running")!==null);
      const map=await overlay.locator(".local-road").first().evaluate(el=>({
        duration:parseFloat(getComputedStyle(el).animationDuration),
        delay:parseFloat(getComputedStyle(el).animationDelay),
        source:el.getAttribute("d"),
      }));
      assert.ok(map.duration>=0.085 && map.duration<=0.12,"Original stroke duration should scale by six: "+map.duration);
      assert.ok(map.delay>=0.26 && map.delay<=0.29,"Original stroke delay should scale by six: "+map.delay);
      assert.ok(map.source?.startsWith("M"));
      await page.waitForTimeout(490);
      const drawn=await overlay.evaluate(el=>({
        edges:[...el.querySelectorAll(".edge-segment")].filter(p=>parseFloat(getComputedStyle(p).strokeDashoffset)<2).length,
        total:el.querySelectorAll(".edge-segment").length,
      }));
      assert.ok(drawn.edges>=drawn.total*.7,"Contour should be substantially drawn within 0.5s");
      await page.screenshot({path:output+"/approved-trace-mid.png",animations:"allow"});
      await overlay.waitFor({state:"detached",timeout:2500});
      assert.deepEqual(errors,[]);
    } finally {await context.close();}
  });

  await check("Rounded traced loader is centered on mobile and desktop", async () => {
    for(const [width,height] of [[320,700],[390,844],[1280,800]]) {
      const context=await browser.newContext({viewport:{width,height},reducedMotion:"no-preference"});
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      try {
        await page.goto(base,{waitUntil:"domcontentloaded"});
        const overlay=page.locator(".reference-intro");
        await overlay.waitFor({state:"visible"});
        const metrics=await overlay.locator(".reference-intro-symbol").evaluate(el=>{
          const r=el.getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight};
        });
        assert.ok(metrics.left>=0&&metrics.right<=metrics.w&&metrics.top>=0&&metrics.bottom<=metrics.h,
          "Approved M must fit viewport: "+JSON.stringify(metrics));
        await page.screenshot({path:output+"/approved-traced-intro-"+width+".png"});
        await overlay.waitFor({state:"detached",timeout:2500});
        assert.deepEqual(errors,[]);
      } finally {await context.close();}
    }
  });

  await check("One-second drawing hands a single matching M to the header", async () => {
    for(const width of [390,1280]) {
      const context=await browser.newContext({viewport:{width,height:800},reducedMotion:"no-preference"});
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      try {
        await page.goto(base,{waitUntil:"domcontentloaded"});
        const overlay=page.locator(".reference-intro");
        await overlay.waitFor({state:"visible"});
        const began=Date.now();
        await page.waitForFunction(()=>document.querySelector(".reference-intro-flight")!==null,
          {timeout:2500});
        const time=Date.now()-began;
        assert.ok(time>=600&&time<1600,"Flight should start after about 1s, measured "+time);
        const flight=await page.evaluate(()=>{
          const source=document.querySelector(".reference-intro-symbol");
          const img=document.querySelector(".reference-intro-flight");
          const head=document.querySelector(".site-header .portfolio-brand-mark");
          return {sourceVisibility:source&&getComputedStyle(source).visibility,
            count:document.querySelectorAll(".reference-intro-flight").length,
            flightSrc:img?.getAttribute("src"),
            loaded:img?.complete&&img?.naturalWidth>0,
            headerPending:head?.classList.contains("is-pending")};
        });
        assert.equal(flight.sourceVisibility,"hidden","Hide source as flight begins");
        assert.equal(flight.count,1,"No duplicated logo during flight");
        assert.match(flight.flightSrc??"",/traced-r13-logo\.svg/);
        assert.ok(flight.loaded,"Preloaded asset should be visible while moving");
        assert.equal(flight.headerPending,true,"Destination mark must remain hidden until transfer finishes");
        await page.screenshot({path:output+"/approved-traced-flight-"+width+".png"});
        await overlay.waitFor({state:"detached",timeout:2200});
        assert.equal(await page.locator(".reference-intro-flight").count(),0);
        assert.equal(await page.locator(".site-header .portfolio-brand-mark.is-pending").count(),0);
        assert.notEqual(await page.locator("html").evaluate(el=>el.style.overflow),"hidden");
        assert.deepEqual(errors,[]);
      } finally {await context.close();}
    }
  });

  await check("Approved tracing loader respects reduced motion", async () => {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
    const page=await context.newPage();
    try {
      await page.goto(base,{waitUntil:"domcontentloaded"});
      assert.equal(await page.locator(".brand-intro-overlay").count(),0);
    } finally {await context.close();}
  });

  await check("Approved tracing loader can be skipped without scroll lock", async () => {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"no-preference"});
    const page=await context.newPage();
    try {
      await page.goto(base,{waitUntil:"domcontentloaded"});
      const overlay=page.locator(".reference-intro");
      await overlay.waitFor({state:"visible"});
      await page.getByRole("button",{name:/تخطي المقدمة/}).click();
      await overlay.waitFor({state:"detached",timeout:2500});
      assert.notEqual(await page.locator("html").evaluate(el=>el.style.overflow),"hidden");
    } finally {await context.close();}
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
