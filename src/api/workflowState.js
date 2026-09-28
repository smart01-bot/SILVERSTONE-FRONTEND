// Presentation only: server state and permissions remain authoritative.
export function workflowError(error) {
  if (error?.code === 'APPLICATION_CHANGED')
    return 'This application changed. Your input is still here. Reopen the saved application to compare before trying again.';
  if (error?.status === 409)
    return 'This record changed. Refresh and review its current state before trying again. Your input has been retained.';
  return error?.message || 'Unable to load. Check your connection and retry.';
}
export function legLabel(leg) {
  const name = {origin_in: 'Source collection', destination_out: 'Destination payout'}[leg.type] || 'Payment leg';
  const state = {not_started: 'Not started', submitted: 'Submitted; confirmation pending', confirmed: 'Confirmed', failed: 'Failed', unknown: 'Outcome unknown; reconciliation required', reversed: 'Reversed'}[leg.status] || 'State unavailable';
  return `${name}: ${state}`;
}
export function nextActionLabel(request) {
  if (request.status === 'needs_attention' || request.legs?.some(l => l.status === 'unknown'))
    return 'Outcome unresolved. Reservation retained pending reconciliation. Do not send funds or start another payment.';
  if (request.status === 'awaiting_review') return 'Awaiting main-agent review. Acceptance reserves capacity; it does not make a payment.';
  if (request.status === 'awaiting_source') return 'Capacity reserved. Provider execution is unavailable. Do not send funds.';
  if (['cancelled', 'rejected', 'expired'].includes(request.status)) return 'This request is closed. No further payment action is available here.';
  return 'No payment action is available here. Review the recorded state.';
}
export function validateAmount(value) {
  if (!/^[0-9]+$/.test(value)) return 'Enter a whole-TZS amount using digits only.';
  const amount = BigInt(value);
  return amount > 0n && amount <= 9223372036854775807n ? null : 'Enter a positive whole-TZS amount within the supported range.';
}
// Return a complete list only: failed later pages must never look like an empty/successful refresh.
export async function loadRequests(api) {
  const rows = [], seen = new Set();
  let cursor = null;
  do {
    const result = await api.envelope('/requests' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''));
    rows.push(...result.data);
    cursor = result.page?.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error('Unable to finish refreshing requests. Please retry.');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return rows;
}
