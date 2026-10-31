import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const site = "https://mmashharawi2021-cell.github.io/myprofile-/";
const html = readFileSync("docs/index.html", "utf8");
const config = JSON.parse(readFileSync("app/src/content/default.json", "utf8"));
const sitemap = readFileSync("docs/sitemap.xml", "utf8");

function meta(kind, name) {
  const tags = html.match(/<meta\b[^>]*>/g) ?? [];
  const matches = tags.filter((tag) => tag.includes(kind + '="' + name + '"'));
  assert.equal(matches.length, 1, "Expected exactly one " + kind + "=" + name + " meta tag");
  const found = matches[0].match(/\bcontent="([^"]*)"/);
  assert.ok(found, "Missing meta content for " + name);
  return found[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
}
function link(rel) {
  const tags = html.match(/<link\b[^>]*>/g) ?? [];
  const matches = tags.filter((tag) => tag.includes('rel="' + rel + '"'));
  assert.equal(matches.length, 1, "Expected one " + rel + " link");
  return matches[0];
}
test("SEO: static title, description and canonical match site content", () => {
  assert.equal((html.match(/<title>/g) ?? []).length, 1);
  assert.ok(html.includes("<title>" + config.seo.title + "</title>"));
  assert.equal(meta("name", "description"), config.seo.description);
  assert.equal(meta("property", "og:title"), config.seo.title);
  assert.equal(meta("property", "og:description"), config.seo.description);
  assert.equal(meta("name", "twitter:title"), config.seo.title);
  assert.equal(meta("name", "twitter:description"), config.seo.description);
  assert.ok(link("canonical").includes('href="' + site + '"'));
  assert.equal(meta("property", "og:url"), site);
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.ok(!/noindex/i.test(meta("name", "robots")));
});
test("SEO: share cards use public PNG with correct dimensions and mime", () => {
  const image = meta("property", "og:image");
  assert.ok(image.startsWith(site), "Image must be absolute HTTPS URL");
  assert.match(image, /^https:\/\/[^"]+\/myprofile-\/og-preview\.png(?:\?v=[a-z0-9]+)?$/);
  assert.equal(meta("name", "twitter:image"), image);
  assert.equal(meta("property", "og:image:secure_url"), image);
  assert.equal(meta("property", "og:image:type"), "image/png");
  assert.equal(meta("property", "og:image:width"), "1200");
  assert.equal(meta("property", "og:image:height"), "630");
  assert.ok(meta("property", "og:image:alt").includes("مهند"));
  assert.ok(meta("name", "twitter:image:alt").includes("مهند"));
  const png = readFileSync("docs/og-preview.png");
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "PNG signature");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length > 12000, "Preview appears blank or incomplete");
});
test("SEO: JSON-LD describes actual person, website and page", () => {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(matches.length, 1, "One valid JSON-LD block");
  const jsonld = JSON.parse(matches[0][1]);
  assert.equal(jsonld["@context"], "https://schema.org");
  const graph = jsonld["@graph"];
  assert.ok(Array.isArray(graph));
  const person = graph.find((node) => node["@type"] === "Person");
  const website = graph.find((node) => node["@type"] === "WebSite");
  const webpage = graph.find((node) => node["@type"] === "WebPage");
  assert.equal(person.name, config.identity.name);
  assert.equal(person.alternateName, "Muhanad Al-Mashharawi");
  assert.deepEqual(person.sameAs, [config.identity.github]);
  assert.equal(person.url, site);
  assert.equal(website.url, site);
  assert.equal(website.creator["@id"], person["@id"]);
  assert.equal(webpage.about["@id"], person["@id"]);
  assert.equal(webpage.name, config.seo.title);
  assert.equal(webpage.isPartOf["@id"], website["@id"]);
});
test("SEO: sitemap contains only actual canonical page", () => {
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls, [site]);
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.ok(link("sitemap").includes('href="/myprofile-/sitemap.xml"'));
  assert.equal(config.projects[0].id, "un-field");
  assert.ok(readFileSync("docs/assets/projects/un-field.webp").length > 1000);
});
