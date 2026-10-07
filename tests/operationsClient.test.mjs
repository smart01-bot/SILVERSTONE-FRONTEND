import test from "node:test";
import assert from "node:assert/strict";
import {
  createOperationsClient,
  caseResponsibility,
  escalationLabel,
} from "../src/api/operationsClient.js";
test("operational cases fetch every scoped page and reject incomplete or repeated pagination", async () => {
  let calls = [];
  const c = createOperationsClient({
    envelope: async (p) => {
      calls.push(p);
      return p.includes("cursor=")
        ? { data: [{ requestId: "two" }], page: { nextCursor: null } }
        : { data: [{ requestId: "one" }], page: { nextCursor: "2" } };
    },
  });
  assert.equal((await c.cases("scope")).length, 2);
  assert.ok(calls.every((p) => p.startsWith("/operations/scopes/scope/cases")));
  const interrupted = createOperationsClient({
    envelope: async (p) => {
      if (p.includes("cursor=")) throw Error("offline");
      return { data: [{}], page: { nextCursor: "2" } };
    },
  });
  await assert.rejects(interrupted.cases("scope"), /offline/);
  const cycle = createOperationsClient({
    envelope: async () => ({ data: [{}], page: { nextCursor: "2" } }),
  });
  await assert.rejects(cycle.cases("scope"), /pagination/);
});
test("operational mutations carry explicit version/body and do not retry or offer settlement", async () => {
  let calls = 0;
  const c = createOperationsClient({
    call: async (path, options) => {
      calls++;
      assert.equal(path, "/operations/scopes/scope/cases/request/assign");
      assert.equal(options.method, "POST");
      assert.equal(options.body.expectedVersion, 2);
      throw Object.assign(Error("stale"), { status: 409 });
    },
  });
  await assert.rejects(c.assign("scope", "request", { expectedVersion: 2 }), {
    status: 409,
  });
  assert.equal(calls, 1);
  assert.equal(c.settle, undefined);
});
test("responsibility and escalation never invent an owner, SLA or verified settlement", () => {
  assert.match(caseResponsibility({}), /needed/);
  assert.match(escalationLabel({}), /not configured/);
  assert.equal(escalationLabel({ escalationDue: true }), "Escalation due");
  assert.match(
    caseResponsibility({ ownerId: "one", backupId: "two" }),
    /assigned/,
  );
});

test("suspended or revoked responsibility is never shown as usable",()=>{assert.match(caseResponsibility({ownerId:"one",backupId:"two",ownerAvailable:false,backupAvailable:true}),/reassignment needed/);});
