// Tanzanian phone: 0[6-9]XXXXXXXX (local) or +255[6-9]XXXXXXXX (intl)
export function validatePhone(str) {
  const v = (str ?? '').trim().replace(/\s+/g, '');
  if (!v) return { valid: false, message: 'Phone number is required.' };
  const ok = /^0[6-9]\d{8}$/.test(v) || /^\+255[6-9]\d{8}$/.test(v);
  return ok
    ? { valid: true, message: '' }
    : { valid: false, message: 'Enter a valid phone (e.g. 0754000000 or +255754000000).' };
}

// TIN: digits-digits-digits, e.g. 100-123-456
export function validateTIN(str) {
  const v = (str ?? '').trim();
  if (!v) return { valid: false, message: 'TIN is required.' };
  return /^\d{3}-\d{3}-\d{3}$/.test(v)
    ? { valid: true, message: '' }
    : { valid: false, message: 'TIN format: 100-123-456 (digits separated by dashes).' };
}

// NIDA: 20 digits starting with 19 or 20
export function validateNIDA(str) {
  const v = (str ?? '').trim();
  if (!v) return { valid: false, message: 'NIDA ID is required.' };
  return /^(19|20)\d{18}$/.test(v)
    ? { valid: true, message: '' }
    : { valid: false, message: 'NIDA must be 20 digits starting with 19 or 20.' };
}

// Amount: positive number, minimum 1,000 TZS, maximum 50,000,000
export function validateAmount(val) {
  const n = Number(val);
  if (!val || isNaN(n)) return { valid: false, message: 'Enter a valid amount.' };
  if (n < 1000)         return { valid: false, message: 'Minimum amount is TZS 1,000.' };
  if (n > 50_000_000)   return { valid: false, message: 'Maximum amount is TZS 50,000,000.' };
  return { valid: true, message: '' };
}

// Password: minimum 6 characters
export function validatePassword(str) {
  const v = (str ?? '');
  if (!v) return { valid: false, message: 'Password is required.' };
  return v.length >= 6
    ? { valid: true, message: '' }
    : { valid: false, message: 'Password must be at least 6 characters.' };
}

// Name: at least 2 words, letters and spaces only
export function validateName(str) {
  const v = (str ?? '').trim();
  if (!v) return { valid: false, message: 'Full name is required.' };
  if (!/^[a-zA-Z\s]+$/.test(v)) return { valid: false, message: 'Name must contain letters only.' };
  return v.split(/\s+/).filter(Boolean).length >= 2
    ? { valid: true, message: '' }
    : { valid: false, message: 'Please enter your full name (first and last).' };
}
