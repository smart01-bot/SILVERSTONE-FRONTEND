import test from "node:test";
import assert from "node:assert/strict";
import { createExchangeOutbox } from "../src/api/offlineExchanges.js";
import { createApiClient } from "../src/api/client.js";
const memory = () => {
  const data = new Map();
  return {
    data,
    getItem: async (k) => data.get(k) || null,
    setItem: async (k, v) => data.set(k, v),
    removeItem: async (k) => data.delete(k),
  };
};
const payload = {
  sourceAccountId: "source",
  destinationAccountId: "dest",
  amountTzs: "123456789012345678",
  currency: "TZS",
  urgent: false,
};
test("offline failures survive restart, keep idempotency key and deduplicate repeated taps", async () => {
  const storage = memory();
  let fail = true;
  const seen = [];
  const options = {
    storage,
    currentOwner: () => "owner-a",
    newKey: () => "stable-key-00000001",
    send: async (body, key, owner) => {
      seen.push({ body, key, owner });
      if (fail) throw new Error("Response lost");
      return { id: "request-1" };
    },
  };
  let queue = createExchangeOutbox(options);
  await Promise.all([
    queue.enqueue("owner-a", payload),
    queue.enqueue("owner-a", payload),
  ]);
  assert.equal((await queue.list("owner-a")).length, 1);
  assert.equal((await queue.sync("owner-a")).remaining, 1);
  queue = createExchangeOutbox(options);
  assert.equal((await queue.list("owner-a"))[0].state, "failed_or_uncertain");
  fail = false;
  assert.equal((await queue.sync("owner-a")).submitted[0].id, "request-1");
  assert.deepEqual(
    seen.map((r) => r.key),
    ["stable-key-00000001", "stable-key-00000001"],
  );
  assert.equal(seen[0].body.amountTzs, payload.amountTzs);
  assert.equal((await queue.list("owner-a")).length, 0);
});
test("account switching never replays another owner and leaves their records intact", async () => {
  const storage = memory();
  let owner = "a",
    calls = 0;
  const queue = createExchangeOutbox({
    storage,
    currentOwner: () => owner,
    newKey: () => "key-000000000001",
    send: async () => {
      calls++;
      throw new Error("offline");
    },
  });
  await queue.enqueue("a", payload);
  owner = "b";
  await assert.rejects(queue.sync("a"), /owner changed/);
  assert.equal(calls, 0);
  assert.equal((await queue.list("b")).length, 0);
  owner = "a";
  assert.equal((await queue.list("a")).length, 1);
});
test("corrupt and foreign records are retained for recovery", async () => {
  const storage = memory();
  await storage.setItem(
    "silverstone_exchange_outbox_v1_a",
    '[{"ownerId":"b"}]',
  );
  const queue = createExchangeOutbox({
    storage,
    currentOwner: () => "a",
    newKey: () => "x",
    send: async () => {
      throw new Error("must not send");
    },
  });
  await assert.rejects(queue.sync("a"), /recovery/);
  assert.equal(
    await storage.getItem("silverstone_exchange_outbox_v1_a"),
    '[{"ownerId":"b"}]',
  );
});
test("API owner check occurs before transport; idempotency header survives request", async () => {
  const calls = [];
  const api = createApiClient({
    baseUrl: "http://local/api/v1",
    storage: memory(),
    fetchImpl: async (url, opts) => {
      calls.push({ url, opts });
      return {
        ok: true,
        json: async () => ({
          data: url.endsWith("/auth/login")
            ? {
                agent: { id: JSON.parse(opts.body).email },
                accessToken: "test",
                refreshToken: "test",
              }
            : { id: "request" },
        }),
      };
    },
  });
  await api.login("a", "password");
  await api.call("/requests", {
    method: "POST",
    expectedOwner: "a",
    headers: { "Idempotency-Key": "stable-key" },
    body: payload,
  });
  assert.equal(calls.at(-1).opts.headers["Idempotency-Key"], "stable-key");
  await api.login("b", "password");
  const before = calls.length;
  await assert.rejects(
    api.call("/requests", { expectedOwner: "a" }),
    /owner changed/,
  );
  assert.equal(calls.length, before);
});
