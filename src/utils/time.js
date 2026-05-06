export function timeAgo(timestamp, lang = 'en') {
  if (!timestamp) return '';
  const ms   = timestamp?.toMillis?.() ?? (typeof timestamp === 'number' ? timestamp : Date.parse(timestamp));
  if (!ms) return '';
  const secs = Math.floor((Date.now() - ms) / 1000);

  if (secs < 60)  return lang === 'sw' ? 'Sasa hivi' : 'Just now';

  const mins = Math.floor(secs / 60);
  if (mins < 60)  return lang === 'sw' ? `dakika ${mins} zilizopita` : `${mins} min ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return lang === 'sw' ? `saa ${hrs} zilizopita` : `${hrs === 1 ? '1 hour' : `${hrs} hours`} ago`;

  const now  = new Date();
  const date = new Date(ms);
  const diffDays = Math.floor((Date.now() - ms) / 86400000);

  if (diffDays === 1) return lang === 'sw' ? 'Jana' : 'Yesterday';

  if (diffDays < 7)  return lang === 'sw' ? `siku ${diffDays} zilizopita` : `${diffDays} days ago`;

  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return lang === 'sw' ? `wiki ${weeks} zilizopita` : `${weeks === 1 ? '1 week' : `${weeks} weeks`} ago`;

  const day   = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en', { month: 'short' });
  const year  = date.getFullYear();
  return `${day} ${month} ${year}`;
}
