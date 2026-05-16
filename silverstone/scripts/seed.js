/**
 * Silverstone — Firestore Seed Script
 * Run once: node scripts/seed.js
 *
 * Requires: firebase-admin, a serviceAccountKey.json in project root,
 * and FIREBASE_DATABASE_URL set, OR just update the config below.
 *
 * npm install firebase-admin  (dev dependency only)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // adjust path if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://YOUR_PROJECT.firebaseio.com', // only needed if using RTDB
});

const db = admin.firestore();

// ─── CONFIG ────────────────────────────────────────────────────────────────────
// Replace with the UID of a real test account you've registered in Firebase Auth,
// or create a dedicated seed UID.  The seed will upsert this document.
const TEST_UID = 'REPLACE_WITH_YOUR_TEST_UID';

const NETWORKS = ['Voda', 'Airtel', 'Yas', 'Halotel'];

const AGENT_DOC = {
  name: 'Hassan Mwangi',
  phone: '0712000001',
  email: 'hassan.test@silverstone.tz',
  role: 'sub-agent',
  status: 'approved',
  networks: NETWORKS,
  agentPhoneNumbers: {
    Voda: '0712000001',
    Airtel: '0682000001',
    Yas: '0752000001',
    Halotel: '0622000001',
  },
  businessName: 'Hassan Mobile Money',
  businessLocation: 'Kariakoo, Dar es Salaam',
  requestCount: 12,
  approvedAt: admin.firestore.Timestamp.fromDate(new Date('2025-01-10')),
};

// 10 requests: all 4 networks, all 4 statuses, 2 urgent
const now = Date.now();
const mins = (m) => new Date(now - m * 60 * 1000);

const REQUEST_DOCS = [
  // completed
  {
    sourceNetwork: 'Voda',    destNetwork: 'Airtel',  amount: 150000, status: 'completed',
    urgent: false, sourcePhone: '0712000001', destPhone: '0682000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(180)),
    processedAt: admin.firestore.Timestamp.fromDate(mins(160)),
  },
  {
    sourceNetwork: 'Airtel',  destNetwork: 'Halotel', amount: 500000, status: 'completed',
    urgent: false, sourcePhone: '0682000001', destPhone: '0622000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(300)),
    processedAt: admin.firestore.Timestamp.fromDate(mins(280)),
  },
  {
    sourceNetwork: 'Yas',     destNetwork: 'Voda',    amount: 250000, status: 'completed',
    urgent: false, sourcePhone: '0752000001', destPhone: '0712000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(1440)),
    processedAt: admin.firestore.Timestamp.fromDate(mins(1420)),
  },
  // pending
  {
    sourceNetwork: 'Airtel',  destNetwork: 'Yas',     amount: 75000,  status: 'pending',
    urgent: true,  sourcePhone: '0682000001', destPhone: '0752000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(15)),
    queuePosition: 3,
  },
  {
    sourceNetwork: 'Halotel', destNetwork: 'Airtel',  amount: 100000, status: 'pending',
    urgent: false, sourcePhone: '0622000001', destPhone: '0682000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(45)),
    queuePosition: 7,
  },
  // approved
  {
    sourceNetwork: 'Voda',    destNetwork: 'Yas',     amount: 200000, status: 'approved',
    urgent: true,  sourcePhone: '0712000001', destPhone: '0752000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(30)),
    approvedAt: admin.firestore.Timestamp.fromDate(mins(25)),
    queuePosition: 1,
  },
  {
    sourceNetwork: 'Halotel', destNetwork: 'Voda',    amount: 350000, status: 'approved',
    urgent: false, sourcePhone: '0622000001', destPhone: '0712000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(60)),
    approvedAt: admin.firestore.Timestamp.fromDate(mins(55)),
    queuePosition: 2,
  },
  // rejected
  {
    sourceNetwork: 'Yas',     destNetwork: 'Halotel', amount: 300000, status: 'rejected',
    urgent: false, sourcePhone: '0752000001', destPhone: '0622000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(1440)),
    rejectedAt: admin.firestore.Timestamp.fromDate(mins(1430)),
    rejectionReason: 'Insufficient float available at this time.',
  },
  {
    sourceNetwork: 'Airtel',  destNetwork: 'Voda',    amount: 50000,  status: 'rejected',
    urgent: false, sourcePhone: '0682000001', destPhone: '0712000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(2880)),
    rejectedAt: admin.firestore.Timestamp.fromDate(mins(2870)),
    rejectionReason: 'Phone number mismatch. Please verify and resubmit.',
  },
  {
    sourceNetwork: 'Voda',    destNetwork: 'Halotel', amount: 450000, status: 'completed',
    urgent: false, sourcePhone: '0712000001', destPhone: '0622000001',
    createdAt: admin.firestore.Timestamp.fromDate(mins(4320)),
    processedAt: admin.firestore.Timestamp.fromDate(mins(4300)),
  },
];

// ─── SEED ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱  Silverstone seed starting...\n');

  // 1. Upsert agent doc
  await db.collection('agents').doc(TEST_UID).set(
    { ...AGENT_DOC, agentId: TEST_UID, agentName: AGENT_DOC.name },
    { merge: true }
  );
  console.log(`✅  agents/${TEST_UID} written`);

  // 2. Write requests
  const batch = db.batch();
  REQUEST_DOCS.forEach((req, i) => {
    const ref = db.collection('requests').doc(`seed_${String(i + 1).padStart(2, '0')}`);
    batch.set(ref, {
      ...req,
      agentId: TEST_UID,
      agentName: AGENT_DOC.name,
    });
  });
  await batch.commit();
  console.log(`✅  ${REQUEST_DOCS.length} request docs written\n`);

  console.log('🎉  Seed complete. Restart your app and check HomeScreen.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
