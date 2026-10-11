export const HOSTED_API_URL = "https://silverstone-backend.onrender.com/api/v1";

// Accept a server origin, the legacy /api root, or the canonical versioned root.
// Do not redirect credentials to a different host or silently accept arbitrary paths.
export function normalizeApiBaseUrl(value) {
  const input = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
  const match = /^(https?:\/\/[^/?#\s@]+)(\/[^?#\s]*)?$/.exec(input);
  if (!match || !["", "/api", "/api/v1"].includes(match[2] || "")) {
    throw new Error("Check the app API address. It must use the server URL followed by /api/v1.");
  }
  return `${match[1]}/api/v1`;
}
