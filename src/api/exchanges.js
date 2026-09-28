import { api } from "../config/api";
// UUID-quality random keys using Expo's existing native random API through expo-modules-core.
import { uuid } from "expo-modules-core";
export const newExchangeKey = () => uuid.v4();
export const getNetworkAccounts = () => api.call("/me/accounts");
export const sendExchange = (body, key, owner) =>
  api.call("/requests", {
    method: "POST",
    body,
    headers: { "Idempotency-Key": key },
    expectedOwner: owner,
  });
export const exchangeAction = (row, action, reason = "") =>
  api.call(`/requests/${row.id}/${action}`, {
    method: "POST",
    body: { expectedVersion: row.version, reason },
    // Stable per version/action/reason; timeout retry must not generate another command.
    headers: {
      "Idempotency-Key": `${action}_${row.id}_${row.version}_${encodeURIComponent(
        reason,
      )
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 40)}`,
    },
    expectedOwner: api.currentOwner(),
  });
export const formatTzs = (value) =>
  String(value ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
