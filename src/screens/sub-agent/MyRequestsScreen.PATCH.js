/**
 * MyRequestsScreen.jsx — RequestDetailModal WIRING PATCH
 *
 * Three surgical changes.  Everything else stays as-is.
 */

// ─── CHANGE 1: Add import at top ──────────────────────────────────────────────

import RequestDetailModal from '../../components/RequestDetailModal';

// ─── CHANGE 2: Add state near your other useState calls ───────────────────────

const [selectedRequest, setSelectedRequest] = React.useState(null);

// ─── CHANGE 3: On your RequestCard (or whatever pressable wraps each row) ─────
//
// Add onPress to open the modal:
//
//   <PressableScale
//     key={item.id}
//     onPress={() => setSelectedRequest(item)}   // ← add this
//     scaleDown={0.97}
//   >
//     <RequestCard {...item} />
//   </PressableScale>
//
// ─── CHANGE 4: Add modal just before the closing </> of your return ───────────
//
//   <RequestDetailModal
//     visible={!!selectedRequest}
//     request={selectedRequest}
//     onClose={() => setSelectedRequest(null)}
//   />
//
// ─── That's it.  The modal component itself is already complete at
//     src/components/RequestDetailModal.jsx — no changes needed there.
//
// ─── HAPTICS (optional enhancement) ─────────────────────────────────────────
//
// If you want a light tap when opening:
//
//   import { useHaptics } from '../../hooks/useHaptics';
//   const haptics = useHaptics();
//
//   onPress={() => { haptics.light(); setSelectedRequest(item); }}
