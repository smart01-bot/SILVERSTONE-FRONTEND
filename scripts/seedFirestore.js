/**
 * Seeds the first main-agent document in Firestore and deploys security rules.
 *
 * Prerequisites:
 *   npm install firebase-admin --save-dev
 *   npm install -g firebase-tools  (if not already installed)
 *   firebase login
 *
 * Credentials (pick one):
 *   - Place a service-account.json key in the project root, OR
 *   - Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json, OR
 *   - Run `firebase login` — the CLI token is used as ADC fallback
 *
 * Usage:
 *   node scripts/seedFirestore.js YOUR_UID_HERE
 */

const path = require('path');
const fs   = require('fs');
const { execSync } = require('child_process');

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
  console.error('\n  Usage: node scripts/seedFirestore.js YOUR_UID_HERE\n');
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
  // Fall back to Application Default Credentials (firebase login sets these up)
  admin.initializeApp({ projectId: firebaseProjectId });
}

const db = admin.firestore();

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nProject:  ${firebaseProjectId}`);
  console.log(`UID:      ${uid}\n`);

  // 1. Seed agent document
  console.log('Creating agents/' + uid + ' ...');
  await db.collection('agents').doc(uid).set(
    {
      role: 'main-agent',
      status: 'approved',
      pinSet: false,
      networks: [],
      agentPhoneNumbers: {},
      createdAt: new Date(),
    },
    { merge: true }
  );
  console.log('  Done.\n');

  // 2. Deploy Firestore security rules
  console.log('Deploying firestore.rules ...');
  try {
    execSync('firebase deploy --only firestore:rules', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('\n  Rules deployed.\n');
  } catch {
    console.warn(
      '\n  Auto-deploy failed. Deploy manually:\n' +
      '    firebase deploy --only firestore:rules\n'
    );
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\nError:', err.message || err);
  process.exit(1);
});
