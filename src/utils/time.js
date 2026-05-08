export const timeAgo = (ts, lang) => {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - (ts.toMillis?.() ?? ts)) / 1000);
  if (secs < 60)    return lang === 'sw' ? 'Sasa hivi' : 'Just now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}${lang === 'sw' ? ' dakika zilizopita' : ' min ago'}`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}${lang === 'sw' ? ' saa zilizopita' : 'h ago'}`;
  return `${Math.floor(secs / 86400)}${lang === 'sw' ? ' siku zilizopita' : 'd ago'}`;
};
