import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "../src/api/client.js";
import { canOperate, agentView } from "../src/api/presentation.js";
const storage = () => {
  const values = new Map();
  return {
    getItem: async (k) => values.get(k),
    setItem: async (k, v) => values.set(k, v),
    removeItem: async (k) => values.delete(k),
  };
};
const response = (data, status = 200) => ({
  ok: status < 400,
  status,
  json: async () =>
    status < 400
      ? { data }
      : { error: { code: "INVALID_SESSION", message: "Sign in again" } },
});
test("client stores, restores and clears only its API session", async () => {
  const saved = storage();
  await saved.setItem("firebase-session", "untouched");
  const client = createApiClient({
    baseUrl: "http://localhost/api/v1",
    storage: saved,
    fetchImpl: async (url) =>
      response(
        url.endsWith("/login")
          ? { accessToken: "a", refreshToken: "r", agent: { id: "one" } }
          : url.endsWith("/me")
            ? { id: "one" }
            : { loggedOut: true },
      ),
  });
  assert.equal((await client.login("test@example.test", "test")).id, "one");
  assert.equal((await client.restore()).id, "one");
  await client.logout();
  assert.equal(await client.restore(), null);
  assert.equal(await saved.getItem("firebase-session"), "untouched");
});
test("simultaneous 401s share a single refresh", async () => {
  let refreshes = 0;
  const client = createApiClient({
    baseUrl: "http://localhost/api/v1",
    storage: storage(),
    fetchImpl: async (url, options) => {
      if (url.endsWith("/login"))
        return response({
          accessToken: "old",
          refreshToken: "r",
          agent: { id: "one" },
        });
      if (url.endsWith("/refresh")) {
        refreshes++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return response({ accessToken: "new", refreshToken: "r2" });
      }
      return options.headers.Authorization === "Bearer new"
        ? response({ id: "one" })
        : response(null, 401);
    },
  });
  await client.login("test", "test");
  const values = await Promise.all([client.call("/me"), client.call("/me")]);
  assert.equal(refreshes, 1);
  assert.equal(values[0].id, "one");
});
test("failed remote logout retains credentials for revocation retry", async () => {
  const saved = storage();
  const client = createApiClient({
    baseUrl: "http://localhost",
    storage: saved,
    fetchImpl: async (url) =>
      url.endsWith("/login")
        ? response({
            accessToken: "a",
            refreshToken: "r",
            agent: { id: "one" },
          })
        : response(null, 503),
  });
  await client.login("test", "test");
  await assert.rejects(client.logout());
  assert.ok(await saved.getItem("silverstone_api_session_v1"));
});
test("unknown, pending, suspended and unapproved states never enter dashboards", () => {
  for (const accountStatus of [
    "pending",
    "suspended",
    "closed",
    "unknown",
    undefined,
  ])
    assert.equal(
      canOperate({
        accountStatus,
        applicationStatus: "approved",
        role: "sub-agent",
      }),
      false,
    );
  assert.equal(
    canOperate({
      accountStatus: "active",
      applicationStatus: "draft",
      role: "sub-agent",
    }),
    false,
  );
  assert.equal(
    canOperate({
      accountStatus: "active",
      applicationStatus: "approved",
      role: "admin",
    }),
    false,
  );
  assert.equal(
    canOperate({
      accountStatus: "active",
      applicationStatus: "approved",
      role: "sub-agent",
    }),
    true,
  );
  assert.equal(
    agentView({ accountStatus: "pending", applicationStatus: "draft" }).status,
    "pending",
  );
});
test("late login cannot overwrite a newer account session", async () => {
  const saved = storage();
  let finishOld;
  const client = createApiClient({
    baseUrl: "http://localhost",
    storage: saved,
    fetchImpl: async (url, options) => {
      const { email } = JSON.parse(options.body);
      if (email === "old")
        await new Promise((resolve) => {
          finishOld = resolve;
        });
      return response({
        accessToken: email,
        refreshToken: email,
        agent: { id: email },
      });
    },
  });
  const old = client.login("old", "test");
  await client.login("new", "test");
  finishOld();
  await assert.rejects(old, /Session changed/);
  assert.equal(
    JSON.parse(await saved.getItem("silverstone_api_session_v1")).accessToken,
    "new",
  );
});

test("origin, legacy API root and versioned root all use versioned auth routes", async () => {
  for (const baseUrl of [
    "https://silverstone-backend.onrender.com",
    "https://silverstone-backend.onrender.com/",
    "https://silverstone-backend.onrender.com/api",
    " https://silverstone-backend.onrender.com/api/v1/// ",
  ]) {
    const urls = [];
    const client = createApiClient({
      baseUrl, storage: storage(),
      fetchImpl: async (url) => {
        urls.push(url);
        return response({ accessToken: "synthetic", refreshToken: "synthetic", agent: { id: "synthetic" } });
      },
    });
    await client.login("agent@example.test", "synthetic");
    await client.register({ email: "agent@example.test", password: "synthetic" });
    await client.recovery("agent@example.test");
    assert.deepEqual(urls, ["login", "register", "recovery"].map(action =>
      `https://silverstone-backend.onrender.com/api/v1/auth/${action}`));
  }
});

test("invalid API configuration cannot send credentials", async () => {
  for (const baseUrl of [undefined, "", "ftp://example.test", "https://user:secret@example.test", "https://example.test/api/v2", "https://example.test?target=other", "https://example.test/#fragment"]) {
    let requests = 0;
    const client = createApiClient({ baseUrl, storage: storage(), fetchImpl: async () => { requests++; } });
    await assert.rejects(client.login("agent@example.test", "synthetic"), /Check the app API address/);
    assert.equal(requests, 0);
  }
});

test("local development API keeps its own host and port", async () => {
  let requested;
  const client = createApiClient({
    baseUrl: "http://10.0.2.2:8800", storage: storage(),
    fetchImpl: async (url) => { requested = url; return response({ accessToken: "synthetic", refreshToken: "synthetic", agent: { id: "synthetic" } }); },
  });
  await client.login("agent@example.test", "synthetic");
  assert.equal(requested, "http://10.0.2.2:8800/api/v1/auth/login");
});

test("email confirmation response never persists tokens or claims a session", async () => {
  const saved=storage();
  const client=createApiClient({baseUrl:'https://synthetic.example.test/api/v1',storage:saved,
    fetchImpl:async()=>response({requiresEmailConfirmation:true},202)});
  assert.deepEqual(await client.register({email:'agent@example.test',password:'synthetic'}),{requiresEmailConfirmation:true});
  assert.equal(await saved.getItem('silverstone_api_session_v1'),undefined);
  assert.equal(client.currentOwner(),null);
});
