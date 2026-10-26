import assert from "node:assert/strict";
let password = "";
for await (const chunk of process.stdin) password += chunk;
password = password.trim();
const root = "http://localhost:8080";
const request = (path, options = {}) =>
  fetch(`${root}/myprofile-/api/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: root,
      ...options.headers,
    },
  });
const initial = await (await request("content")).json();
const login = await request("login", {
  method: "POST",
  body: JSON.stringify({ password }),
});
assert.equal(login.status, 200, "Configured password must authenticate");
const cookie = login.headers.get("set-cookie").split(";")[0];
const save = await request("content", {
  method: "PUT",
  headers: { Cookie: cookie },
  body: JSON.stringify(initial),
});
assert.equal(save.status, 200);
const saved = await save.json();
assert.ok(saved.revision > initial.revision);
assert.deepEqual(saved.content, initial.content);
const history = await request("history", { headers: { Cookie: cookie } });
assert.equal(history.status, 200);
const logout = await request("logout", {
  method: "POST",
  headers: { Cookie: cookie },
  body: "{}",
});
assert.equal(logout.status, 200);
assert.equal(
  (await request("history", { headers: { Cookie: cookie } })).status,
  401,
);
console.log(
  JSON.stringify({
    dockerLogin: "passed",
    dockerSave: "passed",
    logout: "passed",
    revision: saved.revision,
  }),
);
