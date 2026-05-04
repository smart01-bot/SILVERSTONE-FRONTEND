// ─── FIRESTORE OPERATIONS ─────────────────────────────────────────────────────
//
// SCHEMA OVERVIEW
// ═══════════════
//
// users/{uid}
//   name:             string
//   email:            string
//   phone:            string
//   role:             "sub-agent" | "main-agent"
//   status:           "pending" | "approved" | "rejected"
//   networks:         string[]          // e.g. ["Voda", "Yas"]
//   agentPhoneNumbers: { [net]: string }// e.g. { Voda: "0712...", Yas: "0742..." }
//   businessName:     string
//   businessLocation: string
//   businessRegNo:    string
//   tin:              string
//   nida:             string
//   createdAt:        Timestamp
//   approvedAt:       Timestamp | null
//   approvedBy:       string | null     // uid of approving main-agent
//
// requests/{reqId}
//   agentId:          string            // uid
//   agentName:        string
//   sourceNetwork:    string
//   destNetwork:      string
//   sourcePhone:      string
//   destPhone:        string
//   amount:           number
//   urgent:           boolean
//   status:           "pending" | "approved" | "completed" | "rejected"
//   queuePosition:    number
//   createdAt:        Timestamp
//   processedAt:      Timestamp | null
//   processedBy:      string | null     // uid
//   rejectionReason:  string | null
//
// transactions/{txId}
//   requestId:        string
//   agentId:          string
//   agentName:        string
//   sourceNetwork:    string
//   destNetwork:      string
//   amount:           number
//   processedBy:      string            // uid
//   createdAt:        Timestamp

import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, getDocs, increment,
} from 'firebase/firestore';
import { db } from './config';

// ─── USERS ────────────────────────────────────────────────────────────────────

export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    status:           'pending',
    role:             'sub-agent',
    networks:         [],
    agentPhoneNumbers:{},
    createdAt:        serverTimestamp(),
    approvedAt:       null,
    approvedBy:       null,
  });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), data);
};

// Real-time listener for user profile (auth status changes etc.)
export const subscribeToUser = (uid, callback) => {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};

// ─── REQUESTS ─────────────────────────────────────────────────────────────────

export const submitRequest = async (agentId, agentName, data) => {
  // Count pending requests ahead in queue
  const qSnap = await getDocs(
    query(collection(db, 'requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt')
    )
  );
  const queuePosition = qSnap.size + 1;

  const ref = await addDoc(collection(db, 'requests'), {
    agentId,
    agentName,
    ...data,
    urgent:          data.urgent ?? false,
    status:          'pending',
    queuePosition,
    createdAt:       serverTimestamp(),
    processedAt:     null,
    processedBy:     null,
    rejectionReason: null,
  });

  return ref.id;
};

// Sub-agent: their own requests, newest first
export const subscribeToAgentRequests = (agentId, callback) => {
  const q = query(
    collection(db, 'requests'),
    where('agentId', '==', agentId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// Main agent: full queue — urgent first, then oldest first
export const subscribeToQueue = (callback) => {
  const q = query(
    collection(db, 'requests'),
    where('status', '==', 'pending'),
    orderBy('urgent', 'desc'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// Main agent: all requests (for transfers tab)
export const subscribeToAllRequests = (callback) => {
  const q = query(
    collection(db, 'requests'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const approveRequest = async (requestId, mainAgentId) => {
  await updateDoc(doc(db, 'requests', requestId), {
    status:      'approved',
    processedAt: serverTimestamp(),
    processedBy: mainAgentId,
  });
};

export const rejectRequest = async (requestId, mainAgentId, reason = '') => {
  await updateDoc(doc(db, 'requests', requestId), {
    status:          'rejected',
    processedAt:     serverTimestamp(),
    processedBy:     mainAgentId,
    rejectionReason: reason,
  });
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const processTransfer = async (request, mainAgentId) => {
  // 1. Create transaction record
  const txRef = await addDoc(collection(db, 'transactions'), {
    requestId:     request.id,
    agentId:       request.agentId,
    agentName:     request.agentName,
    sourceNetwork: request.sourceNetwork,
    destNetwork:   request.destNetwork,
    sourcePhone:   request.sourcePhone,
    destPhone:     request.destPhone,
    amount:        request.amount,
    processedBy:   mainAgentId,
    createdAt:     serverTimestamp(),
  });

  // 2. Mark request as completed
  await updateDoc(doc(db, 'requests', request.id), {
    status:          'completed',
    processedAt:     serverTimestamp(),
    processedBy:     mainAgentId,
    transactionId:   txRef.id,
  });

  return txRef.id;
};

export const subscribeToTransactions = (callback) => {
  const q = query(
    collection(db, 'transactions'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ─── AGENTS (main agent view) ─────────────────────────────────────────────────

export const subscribeToAgents = (callback) => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'sub-agent'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const approveAgent = async (uid, mainAgentId) => {
  await updateDoc(doc(db, 'users', uid), {
    status:     'approved',
    approvedAt: serverTimestamp(),
    approvedBy: mainAgentId,
  });
};

export const rejectAgent = async (uid, mainAgentId) => {
  await updateDoc(doc(db, 'users', uid), {
    status:     'rejected',
    approvedAt: serverTimestamp(),
    approvedBy: mainAgentId,
  });
};

// ─── ANALYTICS HELPERS ────────────────────────────────────────────────────────

// Volume per network for a given agent (from completed requests)
export const getAgentNetworkVolume = async (agentId) => {
  const q = query(
    collection(db, 'requests'),
    where('agentId', '==', agentId),
    where('status', '==', 'completed')
  );
  const snap = await getDocs(q);
  const volume = {};
  snap.docs.forEach(d => {
    const { sourceNetwork, amount } = d.data();
    volume[sourceNetwork] = (volume[sourceNetwork] || 0) + amount;
  });
  return volume;
};
