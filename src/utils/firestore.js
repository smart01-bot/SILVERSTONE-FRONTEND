// Firestore helpers — all CRUD for agents, requests, transactions
import {
  collection, doc, addDoc, getDocs, getDoc, updateDoc,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Requests ──────────────────────────────────────────────────
export const submitRequest = async (agentId, agentName, data) => {
  // Count current pending requests for queue position
  const q = query(collection(db, 'requests'), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  const queuePosition = snap.size + 1;

  const ref = await addDoc(collection(db, 'requests'), {
    agentId,
    agentName,
    ...data,
    status: 'pending',
    queuePosition,
    createdAt: serverTimestamp(),
    processedAt: null,
    processedBy: null,
  });
  return ref.id;
};

export const listenRequests = (agentId, callback) => {
  const q = query(
    collection(db, 'requests'),
    where('agentId', '==', agentId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const listenAllRequests = (callback) => {
  const q = query(
    collection(db, 'requests'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const updateRequestStatus = async (requestId, status, processedBy) => {
  await updateDoc(doc(db, 'requests', requestId), {
    status,
    processedBy,
    processedAt: serverTimestamp(),
  });
};

// ── Transactions ───────────────────────────────────────────────
export const createTransaction = async (request, processedBy) => {
  await addDoc(collection(db, 'transactions'), {
    requestId:     request.id,
    agentId:       request.agentId,
    agentName:     request.agentName,
    sourceNetwork: request.sourceNetwork,
    destNetwork:   request.destNetwork,
    amount:        request.amount,
    processedBy,
    createdAt:     serverTimestamp(),
  });
  await updateRequestStatus(request.id, 'completed', processedBy);
};

export const listenTransactions = (callback) => {
  const q = query(
    collection(db, 'transactions'),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ── Agents ─────────────────────────────────────────────────────
export const listenAgents = (callback) => {
  const q = query(
    collection(db, 'agents'),
    where('role', '==', 'sub-agent'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

export const approveAgent = async (agentId) => {
  await updateDoc(doc(db, 'agents', agentId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
  });
};

export const rejectAgent = async (agentId) => {
  await updateDoc(doc(db, 'agents', agentId), {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
  });
};

export const updateAgentNetworks = async (agentId, networks, phoneNumbers) => {
  await updateDoc(doc(db, 'agents', agentId), {
    networks,
    agentPhoneNumbers: phoneNumbers,
  });
};

// ── Dashboard stats (derived) ──────────────────────────────────
export const listenDashboardStats = (callback) => {
  // Listen to requests + transactions + agents simultaneously
  const unsubs = [];

  let data = { requests: [], transactions: [], agents: [] };

  const emit = () => callback({
    totalRequests:  data.requests.length,
    pendingCount:   data.requests.filter(r => r.status === 'pending').length,
    completedCount: data.requests.filter(r => r.status === 'completed').length,
    totalTx:        data.transactions.length,
    activeAgents:   data.agents.filter(a => a.status === 'approved').length,
    pendingAgents:  data.agents.filter(a => a.status === 'pending').length,
    totalVolume:    data.transactions.reduce((s, t) => s + (t.amount || 0), 0),
    requests:       data.requests,
    transactions:   data.transactions,
    agents:         data.agents,
  });

  unsubs.push(onSnapshot(
    query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(200)),
    (snap) => { data.requests = snap.docs.map(d => ({ id: d.id, ...d.data() })); emit(); }
  ));
  unsubs.push(onSnapshot(
    query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(200)),
    (snap) => { data.transactions = snap.docs.map(d => ({ id: d.id, ...d.data() })); emit(); }
  ));
  unsubs.push(onSnapshot(
    query(collection(db, 'agents')),
    (snap) => { data.agents = snap.docs.map(d => ({ id: d.id, ...d.data() })); emit(); }
  ));

  return () => unsubs.forEach(u => u());
};