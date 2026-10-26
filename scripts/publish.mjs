import { execFileSync, execSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { validateContent } from "../shared/validate-content.mjs";

// Copies saved editor content and uploaded images from the local Docker
// server into the repository, then builds, commits and pushes so GitHub Pages
// shows the same content. Use --no-push to stop after the local commit.
const root = process.env.EDITOR_URL ?? "http://localhost:8080/myprofile-/";
const contentPath = "app/src/content/default.json";
const mediaDir = "app/public/media";
const push = !process.argv.includes("--no-push");
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8" }).trim();

if (git("branch", "--show-current") !== "main")
  throw new Error("Switch to main before publishing.");
if (git("status", "--porcelain", "--", contentPath, mediaDir))
  throw new Error(`Commit or discard local changes in ${contentPath} and ${mediaDir} first.`);

let response;
try {
  response = await fetch(new URL("api/content", root));
} catch {
  throw new Error(`Editor server is not reachable at ${root}. Run: docker compose up -d`);
}
if (!response.ok) throw new Error(`Failed to read content: HTTP ${response.status}`);
const { content, revision } = await response.json();
const template = JSON.parse((await readFile(contentPath, "utf8")).replace(/^﻿/, ""));
validateContent(content, template);

const media = new Set();
const collect = (value) => {
  if (typeof value === "string") {
    const match = /^\/?media\/([a-zA-Z0-9._-]+)$/.exec(value);
    if (match) media.add(match[1]);
  } else if (value && typeof value === "object") Object.values(value).forEach(collect);
};
collect(content);

await mkdir(mediaDir, { recursive: true });
for (const name of await readdir(mediaDir))
  if (!media.has(name)) await rm(`${mediaDir}/${name}`);
for (const name of media) {
  const file = await fetch(new URL(`media/${name}`, root));
  if (!file.ok) throw new Error(`Missing uploaded image media/${name}: HTTP ${file.status}`);
  await writeFile(`${mediaDir}/${name}`, Buffer.from(await file.arrayBuffer()));
}
await writeFile(contentPath, JSON.stringify(content, null, 2) + "\n");
console.log(`Exported revision ${revision} with ${media.size} uploaded image(s).`);

git("add", "-A", "--", contentPath, mediaDir);
if (!git("diff", "--cached", "--name-only", "--", contentPath, mediaDir)) {
  console.log("Published site already matches the editor. Nothing to do.");
  process.exit(0);
}
execSync("npm run build", { stdio: "inherit" });
git("commit", "-m", `Publish editor content (revision ${revision})`, "--", contentPath, mediaDir);
console.log("Committed published content.");
if (push) {
  execFileSync("git", ["push", "origin", "main"], { stdio: "inherit" });
  console.log("Pushed. GitHub Pages will update in about a minute.");
}
