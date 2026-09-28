// Temporary read adapter for existing screen subscriptions; never imports Firebase.
// These query descriptors only filter already server-scoped API results.
import { api } from "../config/api";
import { agentView, requestView } from "./presentation";
export const db = Object.freeze({ source: "api-v1" });
export const collection = (_, name) => ({ name, filters: [] });
export const doc = (_, name, id) => ({ name, id });
export const where = (field, op, value) => ({
  kind: "where",
  field,
  op,
  value,
});
export const orderBy = (field, direction = "asc") => ({
  kind: "order",
  field,
  direction,
});
export const limit = (value) => ({ kind: "limit", value });
export const query = (source, ...filters) => ({ ...source, filters });
export const Timestamp = { now: () => new Date().toISOString() };
export const serverTimestamp = Timestamp.now;
const unavailable = () => {
  throw new Error("This action is not available yet. No changes were saved.");
};
export const increment = unavailable;
export async function getDocs(source) {
  if (!["requests", "agents"].includes(source.name)) return unavailable();
  let rows = [],
    cursor = null;
  do {
    const result = await api.envelope(
      `/${source.name}${cursor ? `?cursor=${cursor}` : ""}`,
    );
    rows.push(...result.data);
    cursor = result.page?.nextCursor;
  } while (cursor);
  rows = rows.map(source.name === "agents" ? agentView : requestView);
  for (const filter of source.filters || []) {
    if (filter.kind === "where") {
      if (filter.op !== "==") return unavailable();
      rows = rows.filter((row) => row[filter.field] === filter.value);
    }
    if (filter.kind === "order")
      rows.sort(
        (a, b) =>
          String(a[filter.field] ?? "").localeCompare(
            String(b[filter.field] ?? ""),
          ) * (filter.direction === "desc" ? -1 : 1),
      );
    if (filter.kind === "limit") rows = rows.slice(0, filter.value);
  }
  return {
    docs: rows.map((row) => ({ id: row.id, data: () => row })),
    size: rows.length,
    empty: !rows.length,
  };
}
export function onSnapshot(source, onValue, onError) {
  let cancelled = false,
    timer;
  async function poll() {
    try {
      const result = await getDocs(source);
      if (!cancelled) onValue(result);
    } catch (error) {
      if (!cancelled) onError?.(error);
    } finally {
      if (!cancelled) timer = setTimeout(poll, 15000);
    }
  }
  poll();
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
export async function updateDoc(target, fields) {
  if (
    target.name === "agents" &&
    Object.keys(fields).every((key) => key === "name")
  ) {
    const me = await api.call("/me");
    if (me.id !== target.id) return unavailable();
    return api.call("/me", { method: "PATCH", body: fields });
  }
  return unavailable();
}
export const addDoc = unavailable;
export const setDoc = unavailable;
export const getDoc = unavailable;
