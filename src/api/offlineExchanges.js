// Injected persistence and transport keep retries testable without a native device.
// No legacy queue is read or removed. Each owner has a separate versioned outbox.
export function createExchangeOutbox({ storage, send, currentOwner, newKey }) {
  let tail = Promise.resolve();
  const serial = (fn) => {
    const p = tail.catch(() => {}).then(fn);
    tail = p;
    return p;
  };
  const key = (owner) => "silverstone_exchange_outbox_v1_" + owner;
  const guard = (owner) => {
    if (!owner || currentOwner() !== owner)
      throw new Error("Session owner changed. Saved requests retained.");
  };
  async function read(owner) {
    guard(owner);
    const raw = await storage.getItem(key(owner));
    guard(owner);
    const rows = raw ? JSON.parse(raw) : [];
    if (
      !Array.isArray(rows) ||
      rows.some((r) => r.ownerId !== owner || !r.key || !r.payload)
    )
      throw new Error("Saved requests need recovery. Nothing was removed.");
    return rows;
  }
  const write = (owner, rows) =>
    storage.setItem(key(owner), JSON.stringify(rows));
  return {
    list: (owner) => serial(() => read(owner)),
    enqueue: (owner, payload) =>
      serial(async () => {
        const rows = await read(owner);
        const normalized = {
          sourceAccountId: payload.sourceAccountId,
          destinationAccountId: payload.destinationAccountId,
          amountTzs: payload.amountTzs,
          currency: "TZS",
          urgent: !!payload.urgent,
        };
        const same = rows.find(
          (r) => JSON.stringify(r.payload) === JSON.stringify(normalized),
        );
        if (same) return same;
        const record = {
          ownerId: owner,
          key: newKey(),
          payload: normalized,
          state: "saved",
          lastError: null,
          createdAt: new Date().toISOString(),
        };
        guard(owner);
        await write(owner, [...rows, record]);
        return record;
      }),
    sync: (owner) =>
      serial(async () => {
        const rows = await read(owner),
          submitted = [];
        for (const record of [...rows]) {
          guard(owner);
          try {
            const result = await send(record.payload, record.key, owner);
            // A success belongs only to its original owner's outbox even if sign-out races.
            if (!result?.id)
              throw new Error("Uncertain response. Retry with the same key.");
            rows.splice(
              rows.findIndex((r) => r.key === record.key),
              1,
            );
            await write(owner, rows);
            submitted.push(result);
          } catch (error) {
            record.state = "failed_or_uncertain";
            record.lastError = error.message;
            await write(owner, rows);
            if (currentOwner() !== owner) break;
          }
        }
        return { submitted, remaining: rows.length };
      }),
  };
}
