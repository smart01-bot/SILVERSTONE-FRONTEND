/**
 * HomeScreen.jsx — MOCK WIRING PATCH
 *
 * Apply these two changes to your existing HomeScreen.jsx.
 * Everything not shown here stays exactly as-is.
 */

// ─── CHANGE 1: Add these two imports at the top (after existing imports) ───────

import { USE_MOCK } from '../../config/dev';

// ─── CHANGE 2: MOCK_REQUESTS constant — add above your component function ──────

const MOCK_BALANCE = { Voda: 850000, Airtel: 320000, Yas: 150000, Halotel: 0 };

const MOCK_REQUESTS = [
  {
    id: 'r1',
    sourceNetwork: 'Voda',
    destNetwork: 'Airtel',
    amount: 150000,
    status: 'completed',
    urgent: false,
    createdAt: { toDate: () => new Date(Date.now() - 3_600_000) },
  },
  {
    id: 'r2',
    sourceNetwork: 'Airtel',
    destNetwork: 'Yas',
    amount: 75000,
    status: 'pending',
    urgent: true,
    createdAt: { toDate: () => new Date(Date.now() - 900_000) },
  },
  {
    id: 'r3',
    sourceNetwork: 'Yas',
    destNetwork: 'Halotel',
    amount: 300000,
    status: 'rejected',
    urgent: false,
    createdAt: { toDate: () => new Date(Date.now() - 86_400_000) },
  },
  {
    id: 'r4',
    sourceNetwork: 'Halotel',
    destNetwork: 'Voda',
    amount: 500000,
    status: 'completed',
    urgent: false,
    createdAt: { toDate: () => new Date(Date.now() - 7_200_000) },
  },
  {
    id: 'r5',
    sourceNetwork: 'Voda',
    destNetwork: 'Yas',
    amount: 200000,
    status: 'approved',
    urgent: true,
    createdAt: { toDate: () => new Date(Date.now() - 1_800_000) },
  },
];

// ─── CHANGE 3: Inside your useEffect that currently calls onSnapshot ───────────
//
// Replace the entire effect body with this pattern:
//
//   useEffect(() => {
//     if (!user) return;
//
//     if (USE_MOCK) {
//       setAgentData({
//         name: 'Hassan Mwangi',
//         businessName: 'Hassan Mobile Money',
//         businessLocation: 'Kariakoo, Dar es Salaam',
//         networks: ['Voda', 'Airtel', 'Yas', 'Halotel'],
//         agentPhoneNumbers: {
//           Voda: '0712000001',
//           Airtel: '0682000001',
//           Yas: '0752000001',
//           Halotel: '0622000001',
//         },
//         requestCount: 12,
//         status: 'approved',
//       });
//       setBalance(MOCK_BALANCE);
//       setRequests(MOCK_REQUESTS);
//       setLoading(false);
//       return;   // ← no Firebase subscription needed
//     }
//
//     // ── existing onSnapshot code stays below, completely unchanged ──
//     const unsubAgent = onSnapshot(doc(db, 'agents', user.uid), (snap) => {
//       ...your existing code...
//     });
//
//     const unsubRequests = onSnapshot(query(...), (snap) => {
//       ...your existing code...
//     });
//
//     return () => { unsubAgent(); unsubRequests(); };
//   }, [user]);
//
// ──────────────────────────────────────────────────────────────────────────────
//
// That's it. USE_MOCK short-circuits before any Firebase call is made,
// so the skeleton loader clears instantly in dev without a seeded account.
