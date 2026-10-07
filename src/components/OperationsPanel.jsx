import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { api } from "../config/api";
import {
  createOperationsClient,
  caseResponsibility,
  escalationLabel,
} from "../api/operationsClient";
import { formatTzs } from "../api/exchanges";
import { fonts, spacing, radius } from "../constants/theme";
const operations = createOperationsClient(api);
export default function OperationsPanel({ visible, onClose }) {
  const { theme } = useTheme(),
    [scopes, setScopes] = useState([]),
    [scope, setScope] = useState(null),
    [cases, setCases] = useState([]),
    [owners, setOwners] = useState([]),
    [controls, setControls] = useState(null),
    [selected, setSelected] = useState(null),
    [evidence, setEvidence] = useState(null),
    [audit, setAudit] = useState(null),
    [diagnostics, setDiagnostics] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [stale, setStale] = useState(false),
    [form, setForm] = useState({
      ownerId: "",
      backupId: "",
      dueAt: "",
      reason: "",
      reference: "",
      amountTzs: "",
      legId: "",
    });
  const pending = useRef(null),
    generation = useRef(0);
  const capabilities = scope?.capabilities || [],
    has = (cap) => capabilities.includes(cap);
  const edit = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  async function action(fn) {
    const g = generation.current,
      owner = api.currentOwner();
    if (pending.current === g) return;
    pending.current = g;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await fn();
      if (g === generation.current && api.currentOwner() === owner)
        return result;
    } catch (e) {
      if (g === generation.current && api.currentOwner() === owner) {
        setError(e.message);
        if (e.status === 409) setStale(true);
      }
    } finally {
      if (pending.current === g) pending.current = null;
      if (g === generation.current) setBusy(false);
    }
  }
  useEffect(() => {
    generation.current++;
    setScopes([]);
    setScope(null);
    setCases([]);
    setSelected(null);
    setEvidence(null);
    setAudit(null);
    setControls(null);
    setDiagnostics(null);
    setError("");
    setNotice("");
    setStale(false);
    setBusy(false);
    if (visible) {
      const g = generation.current;
      action(async () => {
        const rows = await operations.scopes();
        if (g === generation.current) setScopes(rows);
      });
    }
    return () => {
      generation.current++;
    };
  }, [visible]);
  async function load(s = scope) {
    if (!s) return;
    const g = generation.current;
    await action(async () => {
      const [rows, control, eligible, summary] = await Promise.all([
        operations.cases(s.mainAgentId),
        operations.controls(s.mainAgentId),
        s.capabilities.includes("cases.manage")
          ? operations.owners(s.mainAgentId)
          : Promise.resolve([]),
        operations.diagnostics(s.mainAgentId),
      ]);
      if (g !== generation.current) return;
      setCases(rows);
      setDiagnostics(summary);
      setControls(control);
      setOwners(eligible);
      setScope(s);
      setSelected(null);
      setEvidence(null);
      setAudit(null);
      setStale(false);
    });
  }
  async function open(row) {
    const g = generation.current;
    await action(async () => {
      const [detail, freshCases] = await Promise.all([
        operations.evidence(scope.mainAgentId, row.requestId),
        operations.cases(scope.mainAgentId),
      ]);
      row = freshCases.find((r) => r.requestId === row.requestId) || row;
      if (g !== generation.current) return;
      setCases(freshCases);
      setSelected(row);
      setEvidence(detail);
      setStale(false);
      setForm((f) => ({
        ...f,
        ownerId: row.ownerId || "",
        backupId: row.backupId || "",
        dueAt: row.dueAt || "",
        amountTzs: row.amountTzs,
        legId: detail.legs[0]?.id || "",
      }));
    });
  }
  const button = (label, onPress, disabled = false) => (
    <TouchableOpacity
      key={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={[
        s.button,
        { borderColor: theme.border, opacity: disabled || busy ? 0.6 : 1 },
      ]}
    >
      <Text style={{ color: theme.primary, fontFamily: fonts.bodySemi }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  const input = (field, label, props = {}) => (
    <TextInput
      accessibilityLabel={label}
      placeholder={label}
      placeholderTextColor={theme.textDim}
      value={form[field]}
      onChangeText={(v) => edit(field, v)}
      editable={!busy}
      style={[s.input, { color: theme.text, borderColor: theme.border }]}
      {...props}
    />
  );
  const text = (value, muted = false) => (
    <Text style={[s.text, { color: muted ? theme.textDim : theme.text }]}>
      {value}
    </Text>
  );
  async function assign() {
    const result = await action(
      () =>
        operations.assign(scope.mainAgentId, selected.requestId, {
          expectedVersion: selected.version,
          ownerId: form.ownerId,
          backupId: form.backupId,
          dueAt: form.dueAt.trim() || null,
          reason: form.reason,
        }),
      true,
    );
    if (result) {
      setSelected((r) => ({ ...r, ...result }));
      setCases((rows) =>
        rows.map((r) =>
          r.requestId === result.requestId ? { ...r, ...result } : r,
        ),
      );
      setNotice("Responsibility recorded. No payment status changed.");
    }
  }
  async function record() {
    const leg = evidence.legs.find((l) => l.id === form.legId),
      origin = leg?.type === "origin_in",
      accounts = evidence.accounts;
    const result = await action(
      () =>
        operations.recordEvidence(scope.mainAgentId, selected.requestId, {
          legId: form.legId,
          source: "submitted_statement",
          reference: form.reference.trim(),
          amountTzs: form.amountTzs,
          currency: "TZS",
          fromAccountId: origin ? accounts.source.id : accounts.payout.id,
          toAccountId: origin
            ? accounts.collection.id
            : accounts.destination.id,
          observedAt: new Date().toISOString(),
          reason: form.reason,
        }),
      true,
    );
    if (result) {
      await open(selected);
      setNotice(
        result.matchesTerms
          ? "Recorded as unverified evidence matching the request terms. No settlement confirmed."
          : "Recorded discrepancy. The exchange remains unresolved.",
      );
    }
  }
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.heading}>
              <Text style={[s.title, { color: theme.text }]}>
                Operational controls
              </Text>
              {button("Close", onClose)}
            </View>
            {text(
              "Unresolved exchanges, responsibility and scoped pause controls. Payments and financial resolution remain unavailable.",
              true,
            )}
            {error ? (
              <View accessibilityLiveRegion="polite">
                {text(error)}
                {stale
                  ? text(
                      "Your input is retained. Reload before another change.",
                      true,
                    )
                  : null}
              </View>
            ) : null}
            {notice ? (
              <View accessibilityLiveRegion="polite">{text(notice)}</View>
            ) : null}
            {busy ? text("Loading…", true) : null}
            {button("Reload granted scopes", async () => {
              const rows = await action(() => operations.scopes());
              if (rows) {
                setScopes(rows);
                setError("");
              }
            })}
            {!busy && !scopes.length && !error
              ? text("No operational scope has been granted to this account.")
              : null}
            {scopes
              .filter((r) => r.capabilities.includes("cases.read"))
              .map((r) => button("Open scope " + r.mainAgentId, () => load(r)))}
            {scope ? (
              <>
                {button("Reload operational records", () => load())}
                {controls ? (
                  <View style={[s.section, { borderColor: theme.border }]}>
                    {text("Scope controls")}
                    {text(controls.reason || "No pause reason recorded.", true)}
                    {[
                      "requestsPaused",
                      "acceptancePaused",
                      "preparationPaused",
                    ].map((field, i) => (
                      <TouchableOpacity
                        key={field}
                        accessibilityRole="checkbox"
                        accessibilityState={{
                          checked: controls[field],
                          disabled: busy || !has("pause.manage"),
                        }}
                        disabled={busy || !has("pause.manage")}
                        onPress={() =>
                          setControls((c) => ({ ...c, [field]: !c[field] }))
                        }
                        style={s.choice}
                      >
                        {text(
                          (controls[field] ? "☑ " : "☐ ") +
                            [
                              "Pause new requests",
                              "Pause acceptance",
                              "Pause preparation",
                            ][i],
                        )}
                      </TouchableOpacity>
                    ))}
                    {has("pause.manage") ? (
                      <>
                        {input("reason", "Reason for change", {
                          multiline: true,
                        })}
                        {button(
                          "Save pause or resume",
                          async () => {
                            const result = await action(
                              () =>
                                operations.saveControls(scope.mainAgentId, {
                                  expectedVersion: controls.version,
                                  requestsPaused: controls.requestsPaused,
                                  acceptancePaused: controls.acceptancePaused,
                                  preparationPaused: controls.preparationPaused,
                                  reason: form.reason,
                                }),
                              true,
                            );
                            if (result) {
                              setControls(result);
                              setNotice(
                                "Scope controls saved. Existing holds and uncertain outcomes remain.",
                              );
                            }
                          },
                          stale || form.reason.trim().length < 3,
                        )}
                      </>
                    ) : null}
                    {text(
                      "Reads and evidence recording remain available. A claimed preparation can finish recording an unknown or disabled outcome; no provider execution is enabled.",
                      true,
                    )}
                  </View>
                ) : null}
                {text("Unresolved exchanges")}
                {diagnostics
                  ? text(
                      `${diagnostics.unresolvedCount} unresolved · ${diagnostics.unassignedCount} unassigned · ${diagnostics.escalationDueCount} escalation due · ${diagnostics.expiredPreparationClaims} expired preparation claims`,
                      true,
                    )
                  : null}
                {diagnostics
                  ? text(
                      "Held capacity: " +
                        formatTzs(diagnostics.reservedCapacityTzs) +
                        ". This is not a financial balance. Alerts appear here; no external notifications are configured.",
                      true,
                    )
                  : null}
                {!cases.length && !busy && !error
                  ? text(
                      "No unresolved exchanges in this authorized scope.",
                      true,
                    )
                  : null}
                {cases.map((r) => (
                  <View
                    key={r.requestId}
                    style={[s.section, { borderColor: theme.border }]}
                  >
                    {text(formatTzs(r.amountTzs))}
                    {text("Support reference: " + r.supportReference, true)}
                    {text(caseResponsibility(r))}
                    {text(escalationLabel(r), true)}
                    {button("Inspect " + r.requestId, () => open(r))}
                  </View>
                ))}
                {selected && evidence ? (
                  <View style={[s.section, { borderColor: theme.border }]}>
                    {text("Support reference: " + selected.requestId)}
                    {text(
                      "Owner: " +
                        (selected.ownerId || "Unassigned") +
                        " · Backup: " +
                        (selected.backupId || "Unassigned"),
                      true,
                    )}
                    {has("cases.manage") ? (
                      <>
                        {text("Choose owner")}
                        {owners.map((o) => (
                          <TouchableOpacity
                            key={"owner-" + o.id}
                            accessibilityRole="radio"
                            accessibilityState={{
                              selected: form.ownerId === o.id,
                              disabled: busy,
                            }}
                            disabled={busy}
                            onPress={() => edit("ownerId", o.id)}
                            style={s.choice}
                          >
                            {text(
                              (form.ownerId === o.id ? "● " : "○ ") + o.name,
                            )}
                          </TouchableOpacity>
                        ))}
                        {text("Choose backup")}
                        {owners.map((o) => (
                          <TouchableOpacity
                            key={"backup-" + o.id}
                            accessibilityRole="radio"
                            accessibilityState={{
                              selected: form.backupId === o.id,
                              disabled: busy,
                            }}
                            disabled={busy}
                            onPress={() => edit("backupId", o.id)}
                            style={s.choice}
                          >
                            {text(
                              (form.backupId === o.id ? "● " : "○ ") + o.name,
                            )}
                          </TouchableOpacity>
                        ))}
                        {input("dueAt", "UTC deadline (optional)", {
                          autoCapitalize: "none",
                        })}
                        {input("reason", "Reason for responsibility change", {
                          multiline: true,
                        })}
                        {button(
                          "Assign owner and backup",
                          assign,
                          stale ||
                            !form.ownerId ||
                            !form.backupId ||
                            form.ownerId === form.backupId ||
                            form.reason.trim().length < 3,
                        )}
                      </>
                    ) : null}
                    {text("Reconciliation evidence")}
                    {text(
                      "Reservation: " +
                        (evidence.reservation?.status || "none") +
                        " · " +
                        (evidence.reservation
                          ? formatTzs(evidence.reservation.amountTzs)
                          : "No held amount"),
                      true,
                    )}
                    {evidence.legs.map((l) => (
                      <Text key={l.id} style={[s.text, { color: theme.text }]}>
                        {l.type}: {l.status}
                      </Text>
                    ))}
                    {evidence.observations.map((o) => (
                      <Text key={o.id} style={[s.text, { color: theme.text }]}>
                        {o.reference} · {formatTzs(o.amountTzs)} ·{" "}
                        {o.matchesTerms ? "Terms match" : "Discrepancy"} ·
                        Unverified
                      </Text>
                    ))}
                    {has("evidence.record") && evidence.accounts ? (
                      <>
                        {evidence.legs.map((l) => (
                          <TouchableOpacity
                            key={"leg-" + l.id}
                            accessibilityRole="radio"
                            accessibilityState={{
                              selected: form.legId === l.id,
                              disabled: busy,
                            }}
                            disabled={busy}
                            onPress={() => edit("legId", l.id)}
                            style={s.choice}
                          >
                            {text((form.legId === l.id ? "● " : "○ ") + l.type)}
                          </TouchableOpacity>
                        ))}
                        {input("reference", "Statement reference", {
                          autoCapitalize: "none",
                        })}
                        {input("amountTzs", "Statement amount in whole TZS", {
                          keyboardType: "number-pad",
                        })}
                        {input("reason", "Reason for recording evidence", {
                          multiline: true,
                        })}
                        {button(
                          "Record unverified statement",
                          record,
                          stale ||
                            form.reference.trim().length < 3 ||
                            form.reason.trim().length < 3,
                        )}
                      </>
                    ) : null}
                    {button("Reload selected exchange", () =>
                      open(
                        cases.find((r) => r.requestId === selected.requestId) ||
                          selected,
                      ),
                    )}
                  </View>
                ) : null}
                {has("audit.read")
                  ? button("Load scoped audit history", async () => {
                      const result = await action(() =>
                        operations.audit(scope.mainAgentId),
                      );
                      if (result) setAudit(result);
                    })
                  : null}
                {audit?.map((e) => (
                  <View
                    key={e.id}
                    style={[s.section, { borderColor: theme.border }]}
                  >
                    {text(e.event + " · " + e.createdAt)}
                    {text(e.reason, true)}
                    {text("Actor: " + e.actorId, true)}
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  scroll: { padding: spacing.md, gap: spacing.sm },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  title: { fontFamily: fonts.display, fontSize: 24 },
  text: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  section: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  button: {
    minHeight: 48,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    justifyContent: "center",
  },
  choice: { minHeight: 48, justifyContent: "center" },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 48,
    fontFamily: fonts.body,
    fontSize: 16,
  },
});
