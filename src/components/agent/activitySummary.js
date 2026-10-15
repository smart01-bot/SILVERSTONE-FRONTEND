// Amounts remain exact whole-TZS integers. Convert only normalized chart ratios.
const DAY = 86400000;
const EAT = 3 * 60 * 60 * 1000;
const dayNumber = timestamp => Math.floor((timestamp + EAT) / DAY);

export function transferTimestamp(row) {
  const history = Array.isArray(row.history) ? row.history : [];
  const candidates = [row.processedAt, ...history.filter(event => event.event === 'payout_confirmed').map(event => event.createdAt)];
  for (const value of candidates) {
    if (!value) continue;
    const time = Date.parse(value);
    if (Number.isFinite(time)) return time;
  }
  return null;
}

export function transferActivity(rows, { days = 7, now = Date.now() } = {}) {
  const period = days === 30 ? 30 : 7;
  const today = dayNumber(now);
  const first = today - period + 1;
  const buckets = Array.from({ length: period }, (_, index) => ({
    key: first + index, timestamp: (first + index) * DAY - EAT, amount: 0n, count: 0,
  }));
  let total = 0n, count = 0, omitted = 0;
  const seen = new Set();
  for (const row of rows) {
    if (row.status !== 'completed' || row.legs?.some(leg => leg.status === 'unknown')) continue;
    if (row.id && seen.has(row.id)) continue;
    if (row.id) seen.add(row.id);
    const value = row.amountTzs ?? row.amount;
    const validNumber = typeof value !== 'number' || Number.isSafeInteger(value);
    if (!validNumber || !/^[0-9]+$/.test(String(value ?? ''))) { omitted++; continue; }
    const amount = BigInt(value);
    const time = transferTimestamp(row);
    if (amount <= 0n || time === null || time > now) { omitted++; continue; }
    const index = dayNumber(time) - first;
    if (index < 0 || index >= period) continue;
    buckets[index].amount += amount;
    buckets[index].count++;
    total += amount;
    count++;
  }
  const max = buckets.reduce((value, bucket) => bucket.amount > value ? bucket.amount : value, 0n);
  return { buckets, total, count, max, omitted, days: period };
}

export const amountRatio = (amount, maximum) => maximum > 0n ? Number(amount * 10000n / maximum) / 10000 : 0;
export const formatActivityAmount = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function activityDate(timestamp, lang = 'en', weekday = false) {
  // Format at UTC+03 explicitly even on runtimes without timezone databases.
  const date = new Date(timestamp + EAT);
  if (weekday) return (lang === 'sw'
    ? ['Jpili', 'Jtatu', 'Jnne', 'Jtano', 'Alh', 'Iju', 'Jmosi']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])[date.getUTCDay()];
  const months = lang === 'sw'
    ? ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
}
