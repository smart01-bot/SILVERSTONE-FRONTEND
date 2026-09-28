// Explicit boundary for established screen labels. Canonical API states stay separate.
export const networkLabels = {
  vodacom: "Voda",
  airtel: "Airtel",
  yas: "Yas",
  halotel: "Halotel",
};
export function agentView(agent) {
  return {
    ...agent,
    status:
      agent.accountStatus === "active" && agent.applicationStatus === "approved"
        ? "approved"
        : agent.applicationStatus === "rejected"
          ? "rejected"
          : "pending",
  };
}
export function requestView(row) {
  return {
    ...row,
    agentId: row.subAgentId,
    sourcePhone: row.accounts?.source?.identifier ?? "Unavailable",
    destPhone: row.accounts?.destination?.identifier ?? "Unavailable",
    destNetwork:
      networkLabels[row.destinationNetwork] || row.destinationNetwork,
    sourceNetwork: networkLabels[row.sourceNetwork] || row.sourceNetwork,
    amount: row.amountTzs,
  };
}
export const canOperate = (agent) =>
  agent?.accountStatus === "active" &&
  agent?.applicationStatus === "approved" &&
  ["sub-agent", "main-agent"].includes(agent?.role);

export const requestStatusLabel = status => ({awaiting_review:'Awaiting review',awaiting_source:'Reserved · provider disabled',needs_attention:'Reconciliation needed',completed:'Completed',rejected:'Rejected',cancelled:'Cancelled',expired:'Expired'}[status] || 'Action unavailable');
