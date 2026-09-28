// Legacy import path retained for screen compatibility; no Firebase access.
import { collection,db,onSnapshot,query,where,orderBy } from '../api/screenData';
const disabled=async()=>{throw new Error('This action is not available yet. No changes were saved.');};
export const submitRequest=disabled;
export const updateRequestStatus=disabled;
export const createTransaction=disabled;
export const approveAgent=disabled;
export const rejectAgent=disabled;
export const updateAgentNetworks=disabled;
export const listenRequests=(id,callback)=>onSnapshot(query(collection(db,'requests'),where('agentId','==',id),orderBy('createdAt','desc')),snap=>callback(snap.docs.map(d=>d.data())));
export const listenAllRequests=callback=>onSnapshot(collection(db,'requests'),snap=>callback(snap.docs.map(d=>d.data())));
export const listenAgents=callback=>onSnapshot(collection(db,'agents'),snap=>callback(snap.docs.map(d=>d.data())));
export const listenTransactions=()=>()=>{}; // No fabricated settlement feed.
export const listenDashboardStats=()=>()=>{};
