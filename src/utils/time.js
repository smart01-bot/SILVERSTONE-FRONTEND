// src/utils/time.js
export const timeAgo = (ts, lang) => {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)     return 'Just now';
  if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-TZ', { day: '2-digit', month: 'short' });
};
