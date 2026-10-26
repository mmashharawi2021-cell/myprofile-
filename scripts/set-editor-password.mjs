import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes, scrypt as callback } from "node:crypto";
import { promisify } from "node:util";
let input = "";
for await (const chunk of process.stdin) input += chunk;
const password = input.trim();
if (password.length < 6 || password.length > 128)
  throw new Error(
    "Password must be 6–128 characters. Supply it through stdin.",
  );
const salt = randomBytes(16).toString("hex");
const hash = await promisify(callback)(password, salt, 64, {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 67108864,
});
await mkdir(".secrets", { recursive: true });
await writeFile(
  ".secrets/editor-credentials.json",
  JSON.stringify({ salt, hash: hash.toString("hex") }),
  { mode: 0o600 },
);
console.log("Editor password hash saved. No plaintext password was stored.");
