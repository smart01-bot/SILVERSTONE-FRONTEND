import { useEffect, useRef, useState } from 'react';
import { api } from '../../config/api';
import { workflowError } from '../../api/workflowState';

export function useSavedDocuments(ids = []) {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const key = ids.join(',');
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setLoading(true); setError(''); setDocuments([]);
    Promise.all((key ? key.split(',') : []).map(id => api.call(`/documents/${id}?metadata=1`)))
      .then(rows => { if (current === generation.current) setDocuments(rows); })
      .catch(e => { if (current === generation.current) setError(workflowError(e)); })
      .finally(() => { if (current === generation.current) setLoading(false); });
    return () => { generation.current++; };
  }, [key, attempt]);
  return { documents, error, loading, retry: () => setAttempt(n => n + 1) };
}
