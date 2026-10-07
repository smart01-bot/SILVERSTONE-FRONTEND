// Display formatting only. Request/account values sent to the API are untouched.
const networkNames = {
  Voda: 'M-Pesa', vodacom: 'M-Pesa',
  Airtel: 'Airtel Money', airtel: 'Airtel Money',
  Yas: 'Mixx by Yas', yas: 'Mixx by Yas',
  Halotel: 'HaloPesa', halotel: 'HaloPesa',
};

export const networkDisplayName = network => networkNames[network] || network;

export function maskedIdentifier(value) {
  if (value == null || value === '' || value === 'Unavailable') return 'Unavailable';
  return `•••• ${String(value).trim().slice(-4)}`;
}

export function submittedTimeEat(value, lang = 'en') {
  const timestamp = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp)) return lang === 'sw' ? 'Muda haupatikani' : 'Time unavailable';
  try {
    return `${new Intl.DateTimeFormat(lang === 'sw' ? 'sw-TZ' : 'en-GB', {
      timeZone: 'Africa/Dar_es_Salaam', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).format(new Date(timestamp))} EAT`;
  } catch (_) {
    // Tanzania is UTC+03 throughout the year. Retain an explicit timezone on
    // runtimes whose Intl implementation lacks the regional timezone database.
    const date = new Date(timestamp + 3 * 60 * 60 * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${hour}:${minute} EAT`;
  }
}
