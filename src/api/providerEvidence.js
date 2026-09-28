// Truthful copy for the existing detail surface. Unknown charges never become zero.
export function providerChargeLabel(provider) {
  const fees = provider?.providerFees;
  if (fees?.status === 'known' && typeof fees.amountTzs === 'string' && /^\d+$/.test(fees.amountTzs)) {
    return `Provider charges: TZS ${fees.amountTzs.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
  return 'Provider charges: unknown';
}
export function providerEvidenceLabel(evidence) {
  if (evidence?.source !== 'synthetic_fixture' || evidence?.scope !== 'embedded_test') {
    return 'Evidence unavailable · actual settlement unverified';
  }
  const labels = {
    unknown: 'outcome unknown',
    acknowledged: 'acknowledged; settlement not confirmed',
    confirmed: 'confirmation recorded',
    failed: 'failure recorded',
    reversed: 'reversal recorded',
  };
  return `Synthetic test evidence: ${labels[evidence.evidenceStatus] || 'unrecognized outcome'} · no real payment verified`;
}
