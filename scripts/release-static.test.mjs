import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const builtRoot = resolve("docs");
const builtFile = (path) => {
  const normalized = path.replace(/^\/myprofile-\//, "").split(/[?#]/)[0];
  const target = resolve(builtRoot, decodeURIComponent(normalized));
  assert.ok(target.startsWith(builtRoot + sep), "Asset must stay inside docs: " + path);
  return target;
};

test("release: emitted HTML points only to existing local files", () => {
  const html = readFileSync(resolve(builtRoot, "index.html"), "utf8");
  const assets = [...html.matchAll(/(?:src|href)="(\/myprofile-\/[^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(assets.length >= 3, "Expect JS, CSS and public metadata assets");
  assert.ok(assets.some((path) => /\/assets\/.*\.js$/.test(path)), "Missing Vite JS entry");
  assert.ok(assets.some((path) => /\/assets\/.*\.css$/.test(path)), "Missing Vite CSS entry");
  for (const asset of assets) {
    assert.ok(existsSync(builtFile(asset)), "Missing built asset: " + asset);
  }
});

test("release: project and identity images exist in the static artifact", () => {
  const content = JSON.parse(readFileSync("app/src/content/default.json", "utf8"));
  const images = [content.identity.portrait, ...content.projects.map((p) => p.image)];
  for (const image of images) {
    if (/^(https?:|data:|blob:)/i.test(image)) continue;
    const path = "/myprofile-/" + image.replace(/^\//, "");
    assert.ok(existsSync(builtFile(path)), "Missing content image: " + image);
  }
});

test("release: search verification, sitemap and share preview are preserved", () => {
  for (const path of [
    "google99f895784bf51371.html",
    "sitemap.xml",
    "og-preview.png",
  ]) {
    assert.ok(existsSync(resolve(builtRoot, path)), "Missing release file: " + path);
  }
});

test("release: dedicated CV entry, source images and downloadable PDF", () => {
  const cvHtml = readFileSync(resolve(builtRoot, "cv/index.html"), "utf8");
  const assets = [...cvHtml.matchAll(/(?:src|href)="(\/myprofile-\/[^"]+)"/g)]
    .map((m) => m[1]);
  assert.ok(assets.some(p => /\/assets\/.*\.js$/.test(p)), "Missing CV JS bundle");
  assert.ok(assets.some(p => /\/assets\/.*\.css$/.test(p)), "Missing CV CSS bundle");
  for (const path of assets) assert.ok(existsSync(builtFile(path)), "CV asset missing: " + path);
  const pdf = readFileSync(resolve(builtRoot, "cv/Mohanad-Almashharawi-CV.pdf"));
  assert.equal(pdf.subarray(0, 8).toString("ascii"), "%PDF-1.4");
  assert.ok(pdf.length > 3000, "CV PDF should contain professional history");
  assert.match(pdf.toString("ascii"), /%%EOF/);
});
