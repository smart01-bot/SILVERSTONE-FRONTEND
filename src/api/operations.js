// Read-only presentation of already-authorized request data; no SLA or owner inferred.
export const needsReconciliation = request => request.status === 'needs_attention'
  || request.legs?.some(leg => leg.status === 'unknown') === true
  || request.providerEvidence?.some(evidence => evidence.reconciliationRequired === true) === true;

export function recordedTime(value) {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? new Date(time).toISOString() : 'Time unavailable';
}

export function requestAge(value, now = Date.now()) {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(time) || !Number.isFinite(now) || time > now) return 'Age unavailable';
  return `${Math.floor((now - time) / 60000)} min since request`;
}

export function reservationLabel(reservation) {
  if (!reservation) return 'No reservation recorded.';
  const value = reservation.amountTzs;
  const amount = typeof value === 'string' && /^[0-9]+$/.test(value)
    ? `TZS ${value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : 'Amount unavailable';
  return `Reservation: ${reservation.status} · ${amount}. A reservation is not a payment.`;
}
