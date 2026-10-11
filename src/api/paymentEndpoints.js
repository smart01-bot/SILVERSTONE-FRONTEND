export function normalizePaymentEndpoint({ networkCode, identifierType, identifier }) {
  if (!['vodacom','airtel','yas','halotel'].includes(networkCode)) throw new Error('Choose a network.');
  if (!['phone','agent','till'].includes(identifierType)) throw new Error('Choose a wallet, agent or till number.');
  let number = String(identifier || '').trim();
  if (identifierType === 'phone') {
    number = number.replace(/[ ()-]/g, '');
    if (/^0[67]\d{8}$/.test(number)) number = '+255' + number.slice(1);
    if (/^255[67]\d{8}$/.test(number)) number = '+' + number;
    if (!/^\+255[67]\d{8}$/.test(number)) throw new Error('Enter a valid Tanzanian mobile wallet number.');
  } else if (!/^[A-Za-z0-9_-]{3,32}$/.test(number)) throw new Error('Enter a valid agent or till number (3–32 characters).');
  return { networkCode, identifierType, identifier: number };
}
