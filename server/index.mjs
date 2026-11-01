import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContent } from "../shared/validate-content.mjs";
const scrypt = promisify(scryptCallback);
const base = "/myprofile-/";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};
export async function createApp({
  dataDir,
  publicDir,
  seedPath,
  credentialPath,
  secureCookie = false,
}) {
  await mkdir(resolve(dataDir, "media"), { recursive: true });
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  const credentials = JSON.parse(await readFile(credentialPath, "utf8"));
  if (
    !/^[0-9a-f]{32}$/.test(credentials.salt) ||
    !/^[0-9a-f]{128}$/.test(credentials.hash)
  )
    throw new Error("Invalid editor credentials file");
  const db = new DatabaseSync(resolve(dataDir, "content.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS versions(id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
    CREATE TABLE IF NOT EXISTS site(id INTEGER PRIMARY KEY CHECK(id=1),content TEXT NOT NULL,revision INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts(ip TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_config(id INTEGER PRIMARY KEY CHECK(id=1),fingerprint TEXT NOT NULL);`);
  const fingerprint = hash(credentials.salt + credentials.hash);
  const previousCredentials = db
    .prepare("SELECT fingerprint FROM auth_config WHERE id=1")
    .get();
  if (previousCredentials && previousCredentials.fingerprint !== fingerprint) {
    db.exec("DELETE FROM sessions; DELETE FROM attempts;");
  }
  db.prepare(
    "INSERT INTO auth_config VALUES(1,?) ON CONFLICT(id) DO UPDATE SET fingerprint=excluded.fingerprint",
  ).run(fingerprint);
  if (!db.prepare("SELECT id FROM site WHERE id=1").get()) {
    validateContent(seed, seed);
    const initial = db
      .prepare("INSERT INTO versions(content) VALUES(?)")
      .run(JSON.stringify(seed));
    db.prepare("INSERT INTO site VALUES(1,?,?)").run(
      JSON.stringify(seed),
      Number(initial.lastInsertRowid),
    );
  }
  const current = () => {
    const row = db
      .prepare("SELECT content,revision FROM site WHERE id=1")
      .get();
    return { content: JSON.parse(row.content), revision: row.revision };
  };
  const cookie = (token, age) =>
    `profile_editor=${token}; HttpOnly; SameSite=Strict; Path=${base}; Max-Age=${age}${secureCookie ? "; Secure" : ""}`;
  function json(res, status, body, headers = {}) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    });
    res.end(JSON.stringify(body));
  }
  async function body(req, limit = 1500000) {
    if (!req.headers["content-type"]?.startsWith("application/json"))
      throw Object.assign(new Error("نوع الطلب غير صالح."), { status: 415 });
    let size = 0;
    const parts = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit)
        throw Object.assign(new Error("حجم الطلب أكبر من المسموح."), {
          status: 413,
        });
      parts.push(chunk);
    }
    try {
      return JSON.parse(Buffer.concat(parts).toString("utf8"));
    } catch {
      throw Object.assign(new Error("بيانات الطلب غير صالحة."), {
        status: 400,
      });
    }
  }
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: http: data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me",
    );
    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      if (path === "/health") {
        json(res, 200, { ok: true });
        return;
      }
      if (path === "/" || path === "/myprofile-") {
        res.writeHead(302, { Location: base });
        res.end();
        return;
      }
      if (path.startsWith(`${base}api/`)) {
        const endpoint = path.slice((base + "api/").length);
        if (req.method === "GET" && endpoint === "content") {
          json(res, 200, current());
          return;
        }
        const token = /(?:^|;\s*)profile_editor=([a-f0-9]{64})(?:;|$)/.exec(
          req.headers.cookie ?? "",
        )?.[1];
        const session =
          token &&
          db
            .prepare(
              "SELECT expires FROM sessions WHERE token_hash=? AND expires>?",
            )
            .get(hash(token), Date.now());
        if (req.method === "GET" && endpoint === "session") {
          json(res, 200, { authenticated: !!session });
          return;
        }
        if (!["GET", "HEAD"].includes(req.method)) {
          let origin;
          try {
            origin = new URL(req.headers.origin ?? "");
          } catch {}
          if (
            !origin ||
            origin.host !== req.headers.host ||
            !["http:", "https:"].includes(origin.protocol)
          ) {
            json(res, 403, { error: "مصدر الطلب غير مسموح." });
            return;
          }
        }
        if (req.method === "POST" && endpoint === "login") {
          const ip = req.socket.remoteAddress ?? "unknown";
          const now = Date.now();
          db.prepare("DELETE FROM attempts WHERE until<?").run(now);
          db.prepare("DELETE FROM sessions WHERE expires<?").run(now);
          const attempt = db
            .prepare("SELECT count,until FROM attempts WHERE ip=?")
            .get(ip);
          const globalAttempts = db
            .prepare("SELECT COALESCE(SUM(count),0) AS total FROM attempts")
            .get().total;
          if ((attempt?.count ?? 0) >= 5 || globalAttempts >= 100) {
            json(
              res,
              429,
              { error: "محاولات كثيرة. أعد المحاولة بعد 15 دقيقة." },
              { "Retry-After": "900" },
            );
            return;
          }
          const input = await body(req, 2048);
          if (
            typeof input.password !== "string" ||
            input.password.length > 128
          ) {
            json(res, 400, { error: "كلمة المرور غير صالحة." });
            return;
          }
          db.prepare(
            "INSERT INTO attempts(ip,count,until) VALUES(?,1,?) ON CONFLICT(ip) DO UPDATE SET count=count+1",
          ).run(ip, now + 900000);
          const derived = await scrypt(input.password, credentials.salt, 64, {
            N: 32768,
            r: 8,
            p: 1,
            maxmem: 67108864,
          });
          if (!timingSafeEqual(derived, Buffer.from(credentials.hash, "hex"))) {
            json(res, 401, { error: "كلمة المرور غير صحيحة." });
            return;
          }
          db.prepare("DELETE FROM attempts WHERE ip=?").run(ip);
          const next = randomBytes(32).toString("hex");
          if (token)
            db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
              hash(token),
            );
          db.prepare("INSERT INTO sessions VALUES(?,?)").run(
            hash(next),
            now + 8 * 3600000,
          );
          json(
            res,
            200,
            { authenticated: true },
            { "Set-Cookie": cookie(next, 8 * 3600) },
          );
          return;
        }
        if (!session) {
          json(res, 401, { error: "سجّل الدخول للتحرير." });
          return;
        }
        if (req.method === "POST" && endpoint === "logout") {
          db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
            hash(token),
          );
          json(res, 200, { ok: true }, { "Set-Cookie": cookie("", 0) });
          return;
        }
        if (req.method === "PUT" && endpoint === "content") {
          const input = await body(req);
          validateContent(input.content, seed);
          db.exec("BEGIN IMMEDIATE");
          try {
            if (input.revision !== current().revision) {
              db.exec("ROLLBACK");
              json(res, 409, {
                error:
                  "تم تعديل الموقع من جلسة أخرى. احفظ نسخة من مسودتك وأعد تحميل أحدث محتوى.",
              });
              return;
            }
            const serialized = JSON.stringify(input.content);
            const next = db
              .prepare("INSERT INTO versions(content) VALUES(?)")
              .run(serialized);
            db.prepare("UPDATE site SET content=?,revision=? WHERE id=1").run(
              serialized,
              Number(next.lastInsertRowid),
            );
            db.prepare(
              "DELETE FROM versions WHERE id NOT IN(SELECT id FROM versions ORDER BY id DESC LIMIT 30)",
            ).run();
            db.exec("COMMIT");
          } catch (error) {
            if (db.isTransaction) db.exec("ROLLBACK");
            throw error;
          }
          json(res, 200, current());
          return;
        }
        if (req.method === "GET" && endpoint === "history") {
          json(res, 200, {
            versions: db
              .prepare(
                "SELECT id,created_at FROM versions ORDER BY id DESC LIMIT 30",
              )
              .all(),
          });
          return;
        }
        if (req.method === "GET" && /^history\/\d+$/.test(endpoint)) {
          const row = db
            .prepare("SELECT content FROM versions WHERE id=?")
            .get(Number(endpoint.split("/")[1]));
          json(
            res,
            row ? 200 : 404,
            row
              ? { content: JSON.parse(row.content) }
              : { error: "النسخة غير موجودة." },
          );
          return;
        }
        if (req.method === "POST" && endpoint === "media") {
          const input = await body(req, 11500000);
          if (
            typeof input.data !== "string" ||
            input.data.length > 11200000 ||
            !/^[A-Za-z0-9+/]*={0,2}$/.test(input.data)
          ) {
            json(res, 400, { error: "ملف غير صالح." });
            return;
          }
          const bytes = Buffer.from(input.data, "base64");
          let extension;
          if (
            bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          )
            extension = ".png";
          else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
            extension = ".jpg";
          else if (
            bytes.subarray(0, 4).toString() === "RIFF" &&
            bytes.subarray(8, 12).toString() === "WEBP"
          )
            extension = ".webp";
          if (!extension || bytes.length > 8 * 1024 * 1024) {
            json(res, 400, {
              error: "استخدم صورة PNG أو JPEG أو WebP لا تتجاوز 8 ميغابايت.",
            });
            return;
          }
          const name = randomBytes(16).toString("hex") + extension;
          await writeFile(resolve(dataDir, "media", name), bytes, {
            flag: "wx",
          });
          json(res, 201, { path: "media/" + name });
          return;
        }
        json(res, 404, { error: "المسار غير موجود." });
        return;
      }
      if (!["GET", "HEAD"].includes(req.method)) {
        json(res, 405, { error: "غير مسموح." });
        return;
      }
      if (path === `${base}cv`) {
        res.writeHead(308, { Location: `${base}cv/` });
        res.end();
        return;
      }
      if (!path.startsWith(base)) {
        json(res, 404, { error: "غير موجود." });
        return;
      }
      const relative = decodeURIComponent(path.slice(base.length));
      const media = relative.startsWith("media/");
      const root = resolve(media ? resolve(dataDir, "media") : publicDir);
      const file = resolve(
        root,
        (media ? relative.slice(6) : relative === "cv/" ? "cv/index.html" : relative) || "index.html",
      );
      if (!file.startsWith(root + sep) || relative.includes("\\")) {
        json(res, 404, { error: "غير موجود." });
        return;
      }
      let info;
      try {
        info = await stat(file);
      } catch {
        json(res, 404, { error: "غير موجود." });
        return;
      }
      if (!info.isFile() || !mime[extname(file)]) {
        json(res, 404, { error: "غير موجود." });
        return;
      }
      res.writeHead(200, {
        "Content-Type": mime[extname(file)],
        "Content-Length": info.size,
        "Cache-Control":
          extname(file) === ".html" ? "no-cache" : "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : await readFile(file));
    } catch (error) {
      json(res, error.status ?? 500, {
        error: error.status ? error.message : "تعذّر إكمال الطلب.",
      });
      if (!error.status) console.error("Request failed:", error.message);
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  return {
    server,
    close: () =>
      new Promise((resolveClose) =>
        server.close(() => {
          db.close();
          resolveClose();
        }),
      ),
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const app = await createApp({
    dataDir: process.env.DATA_DIR ?? "./runtime",
    publicDir: process.env.PUBLIC_DIR ?? "./docs",
    seedPath: process.env.SEED_PATH ?? "./app/src/content/default.json",
    credentialPath:
      process.env.EDITOR_CREDENTIALS_FILE ??
      "./.secrets/editor-credentials.json",
    secureCookie: process.env.COOKIE_SECURE === "true",
  });
  app.server.listen(Number(process.env.PORT ?? 8080), "0.0.0.0", () =>
    console.log("Portfolio server ready on port " + (process.env.PORT ?? 8080)),
  );
  process.on("SIGTERM", () => app.close().then(() => process.exit(0)));
}
