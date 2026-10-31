import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";

const execFile = promisify(execFileCallback);
const origin = "http://127.0.0.1:18080";
const image = "myprofile-phase6-smoke:" + process.pid;
const container = "myprofile-phase6-smoke-" + process.pid;
const password = "test-only-" + randomBytes(12).toString("hex");
const tmp = await mkdtemp(join(tmpdir(), "portfolio-docker-"));
const credentialFile = join(tmp, "credentials.json");
let createdImage = false;
let startedContainer = false;

async function docker(...args) {
  return execFile("docker", args, { timeout: 8 * 60_000, maxBuffer: 16 * 1024 * 1024 });
}
async function json(path, method = "GET", value, cookie) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(method !== "GET" ? { Origin: origin } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: value === undefined ? undefined : JSON.stringify(value),
  });
  return response;
}
try {
  const salt = randomBytes(16).toString("hex");
  await writeFile(credentialFile, JSON.stringify({
    salt,
    hash: scryptSync(password, salt, 64, {
      N: 32768, r: 8, p: 1, maxmem: 67108864,
    }).toString("hex"),
  }), { mode: 0o644 });

  console.log("Building the real Docker CMS image...");
  await docker("build", "-t", image, ".");
  createdImage = true;
  await docker(
    "run", "--detach", "--name", container,
    "--init", "--read-only",
    "--tmpfs", "/data:rw,uid=1000,gid=1000",
    "--tmpfs", "/tmp:rw,uid=1000,gid=1000",
    "--publish", "127.0.0.1:18080:8080",
    "--env", "COOKIE_SECURE=false",
    "--mount", `type=bind,src=${credentialFile},dst=/run/secrets/editor_credentials,readonly`,
    image,
  );
  startedContainer = true;

  let healthy = false;
  for (let i = 0; i < 80; i++) {
    try {
      const response = await fetch(origin + "/health");
      if (response.ok) { healthy = true; break; }
    } catch {}
    await sleep(350);
  }
  assert.ok(healthy, "Docker container must become healthy");

  const site = await fetch(origin + "/myprofile-/");
  assert.equal(site.status, 200);
  const html = await site.text();
  assert.match(html, /<html lang="ar" dir="rtl">/);
  const scriptPath = html.match(/<script[^>]*src="(\/myprofile-\/assets\/[^"]+\.js)"/)?.[1];
  assert.ok(scriptPath, "Docker CMS must serve the Vite production JS bundle");
  const script = await fetch(origin + scriptPath);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type") ?? "", /javascript/);

  const initialResponse = await json("/myprofile-/api/content");
  assert.equal(initialResponse.status, 200);
  const initial = await initialResponse.json();
  assert.ok(initial.content.projects.length > 0);
  assert.equal((await json("/myprofile-/api/session")).status, 200);

  const login = await json("/myprofile-/api/login", "POST", { password });
  assert.equal(login.status, 200, "Docker login must work with ephemeral credentials");
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.match(cookie ?? "", /^profile_editor=[a-f0-9]{64}$/);
  assert.equal((await (await json("/myprofile-/api/session", "GET", undefined, cookie)).json()).authenticated, true);

  const content = structuredClone(initial.content);
  content.projects[0].title += " QA";
  const save = await json("/myprofile-/api/content", "PUT", {
    content, revision: initial.revision,
  }, cookie);
  assert.equal(save.status, 200, "Docker CMS save must work");
  const saved = await save.json();
  assert.ok(saved.revision > initial.revision);
  const reread = await (await json("/myprofile-/api/content")).json();
  assert.equal(reread.content.projects[0].title, content.projects[0].title);

  const logout = await json("/myprofile-/api/logout", "POST", {}, cookie);
  assert.equal(logout.status, 200);
  assert.equal((await (await json("/myprofile-/api/session", "GET", undefined, cookie)).json()).authenticated, false);
  console.log("Docker CMS release smoke passed: static asset, health, login, save, public read, logout.");
} catch (error) {
  if (startedContainer) {
    try {
      const result = await docker("logs", "--tail", "70", container);
      console.error("Docker logs:", result.stdout, result.stderr);
    } catch {}
  }
  throw error;
} finally {
  if (startedContainer) await docker("rm", "-f", container).catch(() => {});
  if (createdImage) await docker("image", "rm", "-f", image).catch(() => {});
  await rm(tmp, { recursive: true, force: true });
}
