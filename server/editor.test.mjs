import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { createApp } from "./index.mjs";

test("editor authentication, validation and durable content", async (t) => {
  const directory = await mkdtemp(resolve(tmpdir(), "myprofile-cms-test-"));
  const salt = randomBytes(16).toString("hex");
  const password = "test-only-admin-893";
  const credentialPath = resolve(directory, "credentials.json");
  await writeFile(
    credentialPath,
    JSON.stringify({
      salt,
      hash: scryptSync(password, salt, 64, {
        N: 32768,
        r: 8,
        p: 1,
        maxmem: 67108864,
      }).toString("hex"),
    }),
  );
  const options = {
    dataDir: directory,
    publicDir: resolve("docs"),
    seedPath: resolve("app/src/content/default.json"),
    credentialPath,
  };
  let app,
    origin,
    cookie = "";
  async function start() {
    app = await createApp(options);
    await new Promise((done) => app.server.listen(0, "127.0.0.1", done));
    origin = `http://127.0.0.1:${app.server.address().port}`;
  }
  async function request(path, method = "GET", body, extra = {}) {
    return fetch(`${origin}/myprofile-/api/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  await start();
  let initial;
  try {
    await t.test(
      "public content is readable; writes and history require authentication",
      async () => {
        const res = await request("content");
        assert.equal(res.status, 200);
        initial = await res.json();
        assert.equal(initial.content.projects.length, 5);
        assert.equal((await request("content", "PUT", initial)).status, 401);
        assert.equal((await request("history")).status, 401);
      },
    );
    await t.test(
      "bad passwords fail; correct password creates an HttpOnly session",
      async () => {
        assert.equal(
          (await request("login", "POST", { password: "wrong-password" }))
            .status,
          401,
        );
        const res = await request("login", "POST", { password });
        assert.equal(res.status, 200);
        const header = res.headers.get("set-cookie");
        assert.match(header, /HttpOnly/);
        assert.match(header, /SameSite=Strict/);
        assert.ok(!header.includes(password));
        cookie = header.split(";")[0];
        assert.equal(
          (await (await request("session")).json()).authenticated,
          true,
        );
      },
    );
    await t.test(
      "cross-origin writes are rejected even with a session",
      async () => {
        assert.equal(
          (
            await request("content", "PUT", initial, {
              Origin: "https://untrusted.example",
            })
          ).status,
          403,
        );
      },
    );
    await t.test(
      "invalid links, empty projects and unknown fields cannot be saved",
      async () => {
        for (const mutate of [
          (c) => (c.projects[0].link = "javascript:alert(1)"),
          (c) => (c.projects = []),
          (c) => (c.extra = "unexpected"),
        ]) {
          const content = structuredClone(initial.content);
          mutate(content);
          assert.equal(
            (
              await request("content", "PUT", {
                content,
                revision: initial.revision,
              })
            ).status,
            400,
          );
        }
      },
    );
    let saved;
    await t.test(
      "save is durable and conflicting revisions are rejected",
      async () => {
        const content = structuredClone(initial.content);
        content.projects[0].title = "Integration test project";
        let res = await request("content", "PUT", {
          content,
          revision: initial.revision,
        });
        assert.equal(res.status, 200);
        saved = await res.json();
        assert.ok(saved.revision > initial.revision);
        assert.equal((await request("content", "PUT", initial)).status, 409);
        const publicContent = await (await request("content")).json();
        assert.equal(
          publicContent.content.projects[0].title,
          "Integration test project",
        );
      },
    );
    await t.test(
      "history preserves the previous content and allows recovery through save",
      async () => {
        const history = await (await request("history")).json();
        assert.equal(history.versions.length, 2);
        const old = await (await request(`history/${initial.revision}`)).json();
        assert.equal(
          old.content.projects[0].title,
          initial.content.projects[0].title,
        );
        const res = await request("content", "PUT", {
          content: old.content,
          revision: saved.revision,
        });
        assert.equal(res.status, 200);
        saved = await res.json();
      },
    );
    await t.test(
      "uploads reject active content and serve validated image files",
      async () => {
        assert.equal(
          (
            await request("media", "POST", {
              data: Buffer.from('<svg onload="alert(1)"/>').toString("base64"),
            })
          ).status,
          400,
        );
        const data =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2K0AAAAASUVORK5CYII=";
        const res = await request("media", "POST", { data });
        assert.equal(res.status, 201);
        const file = await res.json();
        assert.match(file.path, /^media\/[a-f0-9]+\.png$/);
        const image = await fetch(`${origin}/myprofile-/${file.path}`);
        assert.equal(image.status, 200);
        assert.equal(image.headers.get("content-type"), "image/png");
      },
    );
    await t.test("content and session survive server restart", async () => {
      await app.close();
      await start();
      const value = await (await request("content")).json();
      assert.equal(value.revision, saved.revision);
      assert.equal(
        (await (await request("session")).json()).authenticated,
        true,
      );
    });
    await t.test(
      "logout revokes the session; login attempts are rate limited",
      async () => {
        assert.equal((await request("logout", "POST", {})).status, 200);
        assert.equal((await request("history")).status, 401);
        cookie = "";
        for (let i = 0; i < 5; i++)
          assert.equal(
            (await request("login", "POST", { password: "invalid" })).status,
            401,
          );
        assert.equal(
          (await request("login", "POST", { password })).status,
          429,
        );
      },
    );
  } finally {
    await app.close();
    const target = resolve(directory);
    if (
      !target.startsWith(resolve(tmpdir()) + sep) ||
      !target.includes("myprofile-cms-test-")
    )
      throw new Error("Unsafe test cleanup path");
    await rm(target, { recursive: true, force: true });
  }
});
