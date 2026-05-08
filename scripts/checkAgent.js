/**
 * Reads an agent document from Firestore and prints all fields.
 *
 * Usage:
 *   node scripts/checkAgent.js YOUR_UID_HERE
 */

const path = require('path');
const fs   = require('fs');

// ── Resolve firebase-admin ────────────────────────────────────────────────────
let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error(
    '\n  firebase-admin is not installed.\n' +
    '  Run:  npm install firebase-admin --save-dev\n'
  );
  process.exit(1);
}

// ── Read Firebase project ID from app.json ────────────────────────────────────
const appJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8')
);
const { firebaseProjectId } = appJson.expo.extra;

// ── Validate UID arg ──────────────────────────────────────────────────────────
const uid = process.argv[2];
if (!uid) {
  console.error('\n  Usage: node scripts/checkAgent.js YOUR_UID_HERE\n');
  process.exit(1);
}

// ── Initialize Admin SDK ──────────────────────────────────────────────────────
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '../service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: firebaseProjectId,
  });
} else {
  admin.initializeApp({ projectId: firebaseProjectId });
}

const db = admin.firestore();

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nProject:  ${firebaseProjectId}`);
  console.log(`UID:      ${uid}\n`);

  const snap = await db.collection('agents').doc(uid).get();

  if (!snap.exists) {
    console.log('  Document does not exist.\n');
    process.exit(1);
  }

  const data = snap.data();

  console.log('── agents/' + uid + ' ──────────────────────────');
  for (const [key, value] of Object.entries(data)) {
    const display =
      value instanceof Date
        ? value.toISOString()
        : value && typeof value.toDate === 'function'
        ? value.toDate().toISOString()
        : JSON.stringify(value);
    console.log(`  ${key.padEnd(20)} ${display}`);
  }
  console.log('─────────────────────────────────────────────\n');

  const roleOk   = data.role   === 'main-agent';
  const statusOk = data.status === 'approved';

  console.log(`  role   = "${data.role}"   ${roleOk   ? '✓ correct' : '✗ expected "main-agent"'}`);
  console.log(`  status = "${data.status}"  ${statusOk ? '✓ correct' : '✗ expected "approved"'}\n`);

  process.exit(roleOk && statusOk ? 0 : 1);
}

main().catch(err => {
  console.error('\nError:', err.message || err);
  process.exit(1);
});
