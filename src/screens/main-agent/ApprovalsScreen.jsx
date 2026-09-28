import { workflowError } from '../../api/workflowState';
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius, fonts } from "../../constants/theme";
import { api } from "../../config/api";

export default function ApprovalsScreen() {
  const { theme } = useTheme();
  const [agents, setAgents] = useState([]),
    [detail, setDetail] = useState(null),
    [reason, setReason] = useState(""),
    [corrections, setCorrections] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [listLoading, setListLoading] = useState(true),
    [stale, setStale] = useState(false),
    [documentLoading, setDocumentLoading] = useState(false),
    [evidence, setEvidence] = useState(null);
  async function load() {
    setListLoading(true);
    setError("");
    try {
      setAgents(await api.call("/review/applications"));
    } catch (e) {
      setError(workflowError(e));
    } finally { setListLoading(false); }
  }
  useEffect(() => {
    load();
  }, []);
  async function open(id, preserveInput = false) {
    setError("");
    setBusy(true);
    try {
      setDetail(await api.call(`/review/applications/${id}`));
      setStale(false);
      if (!preserveInput) { setReason(""); setCorrections([]); }
    } catch (e) {
      setError(workflowError(e));
    } finally {
      setBusy(false);
    }
  }
  async function decide(decision) {
    if (busy || stale || detail?.status !== "submitted") return;
    setBusy(true);
    setError("");
    try {
      await api.call(`/review/applications/${detail.agentId}/decisions`, {
        method: "POST",
        body: {
          expectedVersion: detail.version,
          decision,
          reason,
          fieldsToCorrect: corrections,
        },
      });
      setDetail(null);
      await load();
    } catch (e) {
      setError(workflowError(e));
      if (e.status === 409) setStale(true);
    } finally {
      setBusy(false);
    }
  }
  async function viewDocument(id) {
    if (documentLoading) return;
    setDocumentLoading(true);
    setError("");
    try {
      setEvidence(await api.call(`/documents/${id}`));
    } catch (e) {
      setError(workflowError(e));
    } finally { setDocumentLoading(false); }
  }
  const revision = detail?.revisions?.[0];
  const fieldLabels = {
    name: "Full name",
    nida: "NIDA",
    businessName: "Business name",
    businessLocation: "Location",
    businessTIN: "TIN",
    businessLicenceNumber: "Licence",
    networks: "Networks",
    floatCapacity: "Float capacity",
    coordinates: "Map location",
    documentIds: "Documents",
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        style={s.header}
      >
        <Text style={s.headerTitle}>Applications</Text>
        <Text style={s.headerSub}>Review your assigned applicants</Text>
        <Text style={s.headerBadgeText}>{agents.length} awaiting review</Text>
      </LinearGradient>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <Text accessibilityRole="alert" style={{ color: theme.primary }}>
            {error}
          </Text>
        ) : null}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled:busy || listLoading,busy:listLoading}} disabled={busy || listLoading} onPress={load}>
          <Text style={{ color: theme.primary, paddingVertical: 12 }}>
            Refresh applications
          </Text>
        </TouchableOpacity>
        {listLoading && <Text accessibilityLiveRegion="polite" style={{color:theme.textDim}}>Loading applications…</Text>}
        {documentLoading && <Text accessibilityLiveRegion="polite" style={{color:theme.textDim}}>Loading private document…</Text>}
        {!detail && !listLoading && !error && agents.length === 0 && (
          <Text style={{ color: theme.textDim }}>
            No applications awaiting your review.
          </Text>
        )}
        {!detail &&
          agents.map((a) => (
            <TouchableOpacity
              disabled={busy}
              key={a.id}
              onPress={() => open(a.id)}
              style={[
                s.card,
                {
                  padding: 16,
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceAlt,
                },
              ]}
            >
              <Text style={[s.agentName, { color: theme.text }]}>{a.name}</Text>
              <Text style={{ color: theme.textDim }}>
                Submitted · Open application →
              </Text>
            </TouchableOpacity>
          ))}
        {detail && (
          <View
            style={[
              s.card,
              {
                padding: 16,
                gap: 14,
                borderColor: theme.border,
                backgroundColor: theme.surfaceAlt,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setDetail(null)}>
              <Text style={{ color: theme.primary }}>
                ← Back to applications
              </Text>
            </TouchableOpacity>
            <Text style={[s.agentName, { color: theme.text }]}>
              Submission {detail.version}
            </Text>
            <Text accessibilityLiveRegion="polite" style={{color:theme.text}}>Application: {detail.status?.replaceAll('_', ' ')}{revision?.reason ? ` — ${revision.reason}` : ''}</Text>
            {revision?.reviewerId && <Text selectable style={{color:theme.textDim}}>Reviewer: {revision.reviewerId} · {revision.reviewedAt}</Text>}
            <Text style={{ color: theme.textDim }}>
              Phone: {detail.phone} ·{" "}
              {detail.phoneVerification === "synthetic_fixture"
                ? "Synthetic test fixture — not real verification"
                : detail.phoneVerification}
            </Text>
            {Object.entries(revision?.data || {})
              .filter(([key]) => key !== "documentIds")
              .map(([key, value]) => (
                <View key={key}>
                  <Text style={{ color: theme.textDim }}>
                    {fieldLabels[key] || key}
                  </Text>
                  <Text selectable style={{ color: theme.text }}>
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </Text>
                </View>
              ))}
            <Text style={{ color: theme.text, fontWeight: "bold" }}>
              Private evidence
            </Text>
            {(revision?.data?.documentIds || []).map((id, i) => (
              <TouchableOpacity key={id} onPress={() => viewDocument(id)}>
                <Text style={{ color: theme.primary, paddingVertical: 10 }}>
                  Open document {i + 1} →
                </Text>
              </TouchableOpacity>
            ))}
            {stale && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => open(detail.agentId, true)} style={{minHeight:48,justifyContent:'center'}}><Text style={{color:theme.primary}}>Reload application, then review again. Reason and correction choices will be kept.</Text></TouchableOpacity>}
            <Text style={{color:theme.textDim}}>A reason of at least 3 characters is required. Select fields when requesting corrections.</Text>
            <Text style={{ color: theme.text }}>Reason for decision</Text>
            <TextInput
              accessibilityLabel="Reason for decision"
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={1000}
              placeholder="Explain your decision or the corrections needed"
              placeholderTextColor={theme.textDim}
              style={{
                minHeight: 90,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                color: theme.text,
              }}
            />
            <Text style={{ color: theme.text }}>Fields needing correction</Text>
            {Object.entries(fieldLabels).map(([field, label]) => (
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: corrections.includes(field) }}
                style={{minHeight:48,justifyContent:"center"}}
                key={field}
                onPress={() =>
                  setCorrections((c) =>
                    c.includes(field)
                      ? c.filter((f) => f !== field)
                      : [...c, field],
                  )
                }
              >
                <Text style={{ color: theme.text, paddingVertical: 6 }}>
                  {corrections.includes(field) ? "✓" : "○"} {label}
                </Text>
              </TouchableOpacity>
            ))}
            {["approved", "changes_requested", "rejected"].map((decision) => (
              <TouchableOpacity
                key={decision}
                accessibilityRole="button"
                accessibilityState={{disabled:busy || stale || detail.status !== "submitted" || reason.trim().length < 3 || (decision === "changes_requested" && !corrections.length),busy}}
                disabled={
                  busy || stale || detail.status !== "submitted" ||
                  reason.trim().length < 3 ||
                  (decision === "changes_requested" && !corrections.length)
                }
                onPress={() => decide(decision)}
                style={{
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: theme.primary,
                  opacity: busy || stale || detail.status !== "submitted" || reason.trim().length < 3 || (decision === "changes_requested" && !corrections.length) ? 0.45 : 1,
                }}
              >
                <Text style={s.btnFilledText}>
                  {decision === "approved"
                    ? "Approve application"
                    : decision === "rejected"
                      ? "Reject application"
                      : "Request corrections"}
                </Text>
              </TouchableOpacity>
            ))}
            {detail.revisions.slice(1).map((r) => (
              <Text key={r.id} style={{ color: theme.textDim }}>
                Version {r.version}: {r.decision} — {r.reason}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={!!evidence}
        onRequestClose={() => setEvidence(null)}
        animationType="slide"
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.bg, padding: 20 }}
        >
          <TouchableOpacity onPress={() => setEvidence(null)}>
            <Text style={{ color: theme.primary, padding: 16 }}>
              Close private document
            </Text>
          </TouchableOpacity>
          <Text style={{ color: theme.text }}>{evidence?.name}</Text>
          {evidence?.mime.startsWith("image/") ? (
            <Image
              accessible accessibilityLabel="Private applicant document"
              resizeMode="contain"
              source={{
                uri: `data:${evidence.mime};base64,${evidence.base64}`,
              }}
              style={{ flex: 1 }}
            />
          ) : (
            <Text style={{ color: theme.text }}>
              This document cannot be displayed. Only PNG/JPEG evidence is supported; review an accessible image before approving.
            </Text>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 100 },

  header: {
    paddingHorizontal:       spacing.md + 2,
    paddingTop:              spacing.xxl + spacing.sm,
    paddingBottom:           spacing.lg,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow:                'hidden',
  },
  headerDecor: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerTitle: { fontSize: 30, fontFamily: fonts.display, color: '#fff' },
  headerSub:   { fontSize: 17, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerBadge: {
    marginTop:         spacing.sm,
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md - 2,
    paddingVertical:   spacing.xs,
    borderRadius:      radius.full,
  },
  headerBadgeText: { color: '#fff', fontSize: 15, fontFamily: fonts.bodySemi },

  filters:   { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md - 2, paddingVertical: spacing.sm + 1,
    borderRadius: radius.full, borderWidth: 1,
  },
  pillText: { fontSize: 17, fontFamily: fonts.bodySemi },

  card: {
    borderRadius: radius.lg, borderWidth: 1,
    marginBottom: spacing.md - 4, overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.md - 4, padding: spacing.md - 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText:      { fontSize: 20, fontFamily: fonts.bodyBold },
  agentInfo:       { flex: 1, gap: 2 },
  agentName:       { fontSize: 19, fontFamily: fonts.bodyBold },
  agentSub:        { fontSize: 15, fontFamily: fonts.body },
  rejectionReason: { fontSize: 15, fontFamily: fonts.body, color: '#C8102E', marginTop: 2 },
  daysAgo:         { fontSize: 13, fontFamily: fonts.bodyBold, letterSpacing: 0.4 },

  details: {
    borderTopWidth: 1, paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 2, gap: spacing.sm - 2,
  },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 15, fontFamily: fonts.body },
  detailValue: { fontSize: 15, fontFamily: fonts.bodySemi },

  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md - 2, paddingTop: 0 },
  btnOutline: {
    flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  btnOutlineText: { fontSize: 16, fontFamily: fonts.bodySemi },
  btnFilled: {
    flex: 1, height: 46, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnFilledText: { color: '#fff', fontSize: 16, fontFamily: fonts.bodyBold },
});