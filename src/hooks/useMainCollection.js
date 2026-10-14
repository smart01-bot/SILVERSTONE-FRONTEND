import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection,query,where,orderBy,onSnapshot,getDocs,db } from '../api/screenData';
import { workflowError } from '../api/workflowState';

// Server-scoped reads only. Refresh never retries a financial command.
export function useMainCollection(kind, direction='desc') {
  const {user}=useAuth();
  const [state,setState]=useState({rows:[],loading:true,refreshing:false,error:''});
  const generation=useRef(0),owner=useRef(user?.id),dataOwner=useRef(user?.id);
  const refreshing=useRef(false);owner.current=user?.id;
  const makeQuery=()=>kind==='agents'
    ? query(collection(db,'agents'),where('status','==','approved'),where('role','==','sub-agent'))
    : query(collection(db,'requests'),orderBy('createdAt',direction));
  useEffect(()=>{
    const expected=++generation.current,identity=user?.id;dataOwner.current=identity;refreshing.current=false;
    setState({rows:[],loading:!!identity,refreshing:false,error:''});if(!identity)return;
    const unsubscribe=onSnapshot(makeQuery(),snap=>{
      if(generation.current!==expected||owner.current!==identity)return;
      setState(s=>({...s,rows:snap.docs.map(d=>({id:d.id,...d.data()})),loading:false,error:''}));
    },error=>{if(generation.current===expected&&owner.current===identity)setState(s=>({...s,loading:false,error:workflowError(error)}));});
    return()=>{++generation.current;unsubscribe();};
  },[kind,direction,user?.id]);
  const refresh=async()=>{
    if(refreshing.current||!user?.id)return;
    const expected=generation.current,identity=user.id;refreshing.current=true;setState(s=>({...s,refreshing:true}));
    try{const snap=await getDocs(makeQuery());if(generation.current===expected&&owner.current===identity)setState(s=>({...s,rows:snap.docs.map(d=>({id:d.id,...d.data()})),error:'',loading:false}));}
    catch(error){if(generation.current===expected&&owner.current===identity)setState(s=>({...s,error:workflowError(error),loading:false}));}
    finally{if(generation.current===expected&&owner.current===identity){refreshing.current=false;setState(s=>({...s,refreshing:false}));}}
  };
  return {...(dataOwner.current===user?.id?state:{rows:[],error:'',loading:!!user?.id,refreshing:false}),refresh};
}
