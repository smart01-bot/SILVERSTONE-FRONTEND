const codes = {
  Voda: "vodacom",
  Airtel: "airtel",
  Yas: "yas",
  Halotel: "halotel",
};
const labels = Object.fromEntries(
  Object.entries(codes).map(([a, b]) => [b, a]),
);
export function applicationFields(p) {
  const data = {};
  for (const key of [
    "name",
    "nida",
    "businessName",
    "businessLocation",
    "businessTIN",
    "businessLicenceNumber",
    "coordinates",
    "documentIds",
  ])
    if (p[key] !== undefined) data[key] = p[key];
  if (p.networks) data.networks = p.networks.map((n) => codes[n] || n);
  if (p.floatCapacity !== undefined)
    data.floatCapacity = String(p.floatCapacity);
  return data;
}
export function wizardParams(state) {
  return {
    ...state.data,
    phone: state.phone,
    email: state.email,
    expectedVersion: state.version,
    networks: state.data.networks?.map((n) => labels[n] || n),
    floatCapacity: Number(state.data.floatCapacity || 500000),
  };
}
export async function saveDraft(api, params) {
  if (!Number.isInteger(params.expectedVersion))
    throw new Error("Reload your saved application before editing.");
  return api.call("/applications/me/draft", {
    method: "PUT",
    body: {
      expectedVersion: params.expectedVersion,
      data: applicationFields(params),
    },
  });
}
// Preserve screen keys and local input state while sharing the new server version
// across the back stack. This prevents our own saves causing stale-version errors.
export function syncWizard(navigation, saved) {
  const params = wizardParams(saved),
    state = navigation.getState();
  navigation.reset({
    ...state,
    routes: state.routes.map((route) =>
      route.name.startsWith("Step")
        ? { ...route, params: { ...route.params, ...params } }
        : route,
    ),
  });
  return params;
}
