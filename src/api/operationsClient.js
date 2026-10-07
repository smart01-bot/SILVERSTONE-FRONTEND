// Operational scope comes only from server grants. No financial resolution transport.
export function createOperationsClient(api) {
  const root = (scope) => "/operations/scopes/" + encodeURIComponent(scope);
  async function all(path) {
    const data = [];
    let cursor = null;
    const seen = new Set();
    do {
      const result = await api.envelope(
        path + (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""),
      );
      if (!Array.isArray(result.data))
        throw new Error("Unexpected operations response.");
      data.push(...result.data);
      cursor = result.page?.nextCursor ?? null;
      if (cursor && seen.has(cursor))
        throw new Error("Operations pagination needs recovery.");
      if (cursor) seen.add(cursor);
    } while (cursor);
    return data;
  }
  return {
    scopes: () => api.call("/operations/scopes"),
    cases: (scope) => all(root(scope) + "/cases"),
    owners: (scope) => api.call(root(scope) + "/owners"),
    controls: (scope) => api.call(root(scope) + "/controls"),
    diagnostics: (scope) => api.call(root(scope) + "/diagnostics"),
    audit: (scope) => all(root(scope) + "/audit"),
    evidence: (scope, id) =>
      api.call(root(scope) + "/cases/" + encodeURIComponent(id) + "/evidence"),
    assign: (scope, id, body) =>
      api.call(root(scope) + "/cases/" + encodeURIComponent(id) + "/assign", {
        method: "POST",
        body,
      }),
    recordEvidence: (scope, id, body) =>
      api.call(root(scope) + "/cases/" + encodeURIComponent(id) + "/evidence", {
        method: "POST",
        body,
      }),
    saveControls: (scope, body) =>
      api.call(root(scope) + "/controls", { method: "POST", body }),
  };
}
export const caseResponsibility = (row) =>
  row.ownerId && row.backupId
    ? row.ownerAvailable === false || row.backupAvailable === false
      ? "Owner or backup unavailable — reassignment needed"
      : "Owner and backup assigned"
    : "Owner or backup needed";
export const escalationLabel = (row) =>
  row.escalationDue
    ? "Escalation due"
    : row.dueAt
      ? "Deadline: " + row.dueAt
      : "Escalation deadline not configured";
