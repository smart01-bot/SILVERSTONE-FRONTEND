// Platform-independent client. SecureStore is injected by the native wrapper.
export function createApiClient({
  baseUrl,
  storage,
  fetchImpl = fetch,
  timeoutMs = 12000,
  onInvalidSession = () => {},
}) {
  const key = "silverstone_api_session_v1";
  let tokens = null;
  let revision = 0;
  let refreshing = null;
  let writing = Promise.resolve();
  async function request(path, { method = "GET", body, token } = {}) {
    if (!baseUrl || !/^https?:\/\//.test(baseUrl))
      throw new Error("Set the API address before signing in.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const envelope = await response.json();
      if (!response.ok) {
        const error = new Error(
          envelope.error?.message || "Unable to complete this action.",
        );
        Object.assign(error, {
          status: response.status,
          code: envelope.error?.code,
          fieldErrors: envelope.error?.fieldErrors,
        });
        throw error;
      }
      if (!Object.prototype.hasOwnProperty.call(envelope, "data"))
        throw new Error("Unexpected API response.");
      return envelope;
    } catch (error) {
      if (error.name === "AbortError")
        throw new Error("The request timed out. Please try again.");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  async function save(data, expected = revision) {
    const next = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    writing = writing
      .catch(() => {})
      .then(async () => {
        if (expected !== revision) throw new Error("Session changed.");
        await storage.setItem(key, JSON.stringify(next));
        if (expected === revision) tokens = next;
      });
    await writing;
  }
  async function clear() {
    revision++;
    tokens = null;
    writing = writing.catch(() => {}).then(() => storage.removeItem(key));
    await writing;
    onInvalidSession();
  }
  async function refresh() {
    if (!refreshing) {
      const current = revision;
      refreshing = (async () => {
        if (!tokens?.refreshToken)
          throw Object.assign(new Error("Please sign in again."), {
            status: 401,
          });
        const { data } = await request("/auth/refresh", {
          method: "POST",
          body: { refreshToken: tokens.refreshToken },
        });
        if (current !== revision) throw new Error("Session changed.");
        await save(data, current);
      })()
        .catch(async (error) => {
          if (error.status === 401 && current === revision) await clear();
          throw error;
        })
        .finally(() => {
          refreshing = null;
        });
    }
    return refreshing;
  }
  async function envelope(path, options = {}) {
    const current = revision;
    try {
      const result = await request(path, {
        ...options,
        token: tokens?.accessToken,
      });
      if (current !== revision) throw new Error("Session changed.");
      return result;
    } catch (error) {
      if (current !== revision) throw new Error("Session changed.");
      if (
        error.status !== 401 ||
        error.code !== "INVALID_SESSION" ||
        !tokens?.refreshToken
      )
        throw error;
      await refresh();
      try {
        const result = await request(path, {
          ...options,
          token: tokens?.accessToken,
        });
        if (current !== revision) throw new Error("Session changed.");
        return result;
      } catch (second) {
        if (second.status === 401) await clear();
        throw second;
      }
    }
  }
  return {
    async restore() {
      const raw = await storage.getItem(key);
      if (!raw) return null;
      try {
        tokens = JSON.parse(raw);
      } catch {
        await clear();
        return null;
      }
      try {
        return (await envelope("/me")).data;
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    },
    async login(email, password) {
      const current = ++revision;
      const { data } = await request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      await save(data, current);
      return data.agent;
    },
    async register(body) {
      const current = ++revision;
      const { data } = await request("/auth/register", {
        method: "POST",
        body,
      });
      await save(data, current);
      return data.agent;
    },
    async logout() {
      // A failed remote logout is reported; retained tokens allow revocation retry.
      await envelope("/auth/logout", { method: "POST", body: {} });
      await clear();
    },
    async call(path, options) {
      return (await envelope(path, options)).data;
    },
    envelope,
    async recovery(email) {
      return (
        await request("/auth/recovery", { method: "POST", body: { email } })
      ).data;
    },
  };
}
