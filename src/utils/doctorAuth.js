// ==========================================================================
// InnovaTech Clinician Account, Validation & (Simulated) PRC License Verification
// --------------------------------------------------------------------------
// PROTOTYPE NOTICE: All data is stored locally in this browser (localStorage).
// PRC verification is SIMULATED. A production build must call an official
// PRC verification service and a real OTP gateway from a secure backend.
// ==========================================================================

const ACCOUNT_KEY = 'innovatech.doctorAccount.v1';
const SESSION_KEY = 'innovatech.doctorSession.v1';

export const PH_REGIONS = [
  'NCR — National Capital Region',
  'CAR — Cordillera Administrative Region',
  'Region I — Ilocos Region',
  'Region II — Cagayan Valley',
  'Region III — Central Luzon',
  'Region IV-A — CALABARZON',
  'MIMAROPA Region',
  'Region V — Bicol Region',
  'Region VI — Western Visayas',
  'NIR — Negros Island Region',
  'Region VII — Central Visayas',
  'Region VIII — Eastern Visayas',
  'Region IX — Zamboanga Peninsula',
  'Region X — Northern Mindanao',
  'Region XI — Davao Region',
  'Region XII — SOCCSKSARGEN',
  'Region XIII — Caraga',
  'BARMM — Bangsamoro Autonomous Region',
];

export const SPECIALTIES = [
  'General Practitioner',
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Dermatology',
  'Emergency Medicine',
  'Community / Public Health Physician',
  'Other Specialty',
];

export const FACILITY_TYPES = [
  'Rural Health Unit (RHU)',
  'Barangay Health Station',
  'City / Municipal Health Office',
  'Private Clinic',
  'Hospital — Outpatient Department',
  'Telemedicine Practice',
];

export const DEMO_LICENSE_PRESETS = {
  valid: {
    label: 'Valid License',
    prcLicense: '0712345',
    prcRegistrationDate: '2015-06-18',
    prcExpiryDate: '2028-03-14',
  },
  expired: {
    label: 'Expired ID',
    prcLicense: '0698211',
    prcRegistrationDate: '2012-02-09',
    prcExpiryDate: '2025-08-30',
  },
  notFound: {
    label: 'Not in Registry',
    prcLicense: '0450000',
    prcRegistrationDate: '2019-11-20',
    prcExpiryDate: '2027-11-20',
  },
};

// Profile used automatically for screen recordings / demo deep links (?record=1, ?noauth=1)
export const DEMO_DOCTOR_PROFILE = {
  id: 'demo-physician',
  title: 'Dr.',
  firstName: 'Maria',
  middleName: 'Santos',
  lastName: 'Reyes',
  fullName: 'Maria Santos Reyes',
  displayName: 'Dr. Maria Reyes',
  email: 'maria.reyes@rhu-demo.ph',
  mobile: '+639171234567',
  specialty: 'Family Medicine',
  facilityName: 'Quezon City RHU 3',
  facilityType: 'Rural Health Unit (RHU)',
  region: 'NCR — National Capital Region',
  city: 'Quezon City',
  yearsInPractice: '9',
  philhealthNo: '',
  prcLicense: '0712345',
  prcRegistrationDate: '2015-06-18',
  prcExpiryDate: '2028-03-14',
  photo: null,
  prcIdImage: null,
  verification: {
    status: 'verified',
    method: 'Simulated PRC Registry Lookup',
    referenceId: 'PRC-VR-DEMO-0712345',
    verifiedAt: '2026-11-25T09:00:00.000Z',
  },
  createdAt: '2026-11-25T09:00:00.000Z',
};

// --------------------------------------------------------------------------
// Local persistence
// --------------------------------------------------------------------------
export function loadAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAccount(account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export function clearAccount() {
  localStorage.removeItem(ACCOUNT_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function hasActiveSession() {
  try {
    return localStorage.getItem(SESSION_KEY) === '1' && !!loadAccount();
  } catch {
    return false;
  }
}

export function setSession(active) {
  if (active) localStorage.setItem(SESSION_KEY, '1');
  else localStorage.removeItem(SESSION_KEY);
}

// --------------------------------------------------------------------------
// Password hashing (SHA-256 via Web Crypto; never store plain-text passwords)
// --------------------------------------------------------------------------
export async function hashPassword(password) {
  const salted = `innovatech::v1::${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salted));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for non-secure contexts (prototype only)
  let h = 5381;
  for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) >>> 0;
  return `fallback-${h.toString(16)}`;
}

// --------------------------------------------------------------------------
// Field validators
// --------------------------------------------------------------------------
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

// Philippine mobile: +63 followed by 10 digits starting with 9 (e.g. +63 917 123 4567)
export function isValidPhMobile(digits) {
  return /^9\d{9}$/.test(digits);
}

export function formatPhMobile(digits) {
  const d = String(digits || '').replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function maskPhMobile(full) {
  const d = String(full || '').replace(/\D/g, '');
  const last4 = d.slice(-4);
  return `+63 9•• ••• ${last4}`;
}

export function maskEmail(email) {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return email;
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

// PRC physician license numbers are 7-digit numeric identifiers
export function isValidPrcLicenseFormat(license) {
  return /^\d{7}$/.test(String(license || ''));
}

export function passwordChecks(pw) {
  const value = String(pw || '');
  return [
    { id: 'len', label: 'At least 8 characters', ok: value.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', ok: /[A-Z]/.test(value) },
    { id: 'lower', label: 'One lowercase letter', ok: /[a-z]/.test(value) },
    { id: 'num', label: 'One number', ok: /\d/.test(value) },
    { id: 'sym', label: 'One symbol (!@#$…)', ok: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function passwordStrength(pw) {
  const passed = passwordChecks(pw).filter((c) => c.ok).length;
  if (!pw) return { score: 0, label: 'Not set', color: '#CBD5E1' };
  if (passed <= 2) return { score: 1, label: 'Weak', color: '#DC2626' };
  if (passed === 3) return { score: 2, label: 'Fair', color: '#D97706' };
  if (passed === 4) return { score: 3, label: 'Good', color: '#0D9488' };
  return { score: 4, label: 'Strong', color: '#059669' };
}

export function generateOtp() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function parseDate(str, endOfDay = false) {
  if (!str) return null;
  const d = new Date(`${str}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDisplayDate(str) {
  const d = parseDate(str);
  if (!d) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// --------------------------------------------------------------------------
// Simulated PRC License Verification Pipeline
// Returns an ordered list of checks; the UI animates them and stops at the
// first failure.
// --------------------------------------------------------------------------
export function runPrcVerificationChecks({
  prcLicense,
  prcRegistrationDate,
  prcExpiryDate,
  firstName,
  middleName,
  lastName,
  hasIdDocument,
}) {
  const now = new Date();
  const reg = parseDate(prcRegistrationDate);
  const exp = parseDate(prcExpiryDate, true);
  const middleInitial = middleName ? ` ${middleName.trim().charAt(0).toUpperCase()}.` : '';
  const registryName = `${String(lastName).trim().toUpperCase()}, ${String(firstName)
    .trim()
    .toUpperCase()}${middleInitial}`;

  const checks = [];

  // 1. Format
  const formatOk = isValidPrcLicenseFormat(prcLicense);
  checks.push({
    id: 'format',
    label: 'License number format',
    status: formatOk ? 'pass' : 'fail',
    detail: formatOk
      ? `${prcLicense} — valid 7-digit PRC license format`
      : 'PRC physician license numbers must be exactly 7 digits.',
  });

  // 2. Dates
  let datesOk = true;
  let datesDetail = '';
  if (!reg || !exp) {
    datesOk = false;
    datesDetail = 'Enter both the registration date and the ID expiry date.';
  } else if (reg > now) {
    datesOk = false;
    datesDetail = 'Registration date cannot be in the future.';
  } else if (reg >= exp) {
    datesOk = false;
    datesDetail = 'Expiry date must be after the registration date.';
  } else {
    datesDetail = `Registered ${formatDisplayDate(prcRegistrationDate)}`;
  }
  checks.push({ id: 'dates', label: 'Registration dates', status: datesOk ? 'pass' : 'fail', detail: datesDetail });

  // 3. Validity / expiry
  let validityStatus = 'pass';
  let validityDetail = '';
  if (exp && exp < now) {
    validityStatus = 'fail';
    validityDetail = `PRC ID expired on ${formatDisplayDate(prcExpiryDate)}. Renew through PRC LERIS before activating clinical access.`;
  } else if (exp) {
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft <= 90) {
      validityStatus = 'warn';
      validityDetail = `Valid, but expires in ${daysLeft} days (${formatDisplayDate(prcExpiryDate)}). Please renew soon.`;
    } else {
      validityDetail = `Active until ${formatDisplayDate(prcExpiryDate)}`;
    }
  } else {
    validityStatus = 'fail';
    validityDetail = 'Expiry date missing.';
  }
  checks.push({ id: 'validity', label: 'License validity', status: validityStatus, detail: validityDetail });

  // 4. Registry lookup (simulated)
  const notInRegistry = /0000$/.test(String(prcLicense));
  checks.push({
    id: 'registry',
    label: 'PRC registry lookup (simulated)',
    status: notInRegistry ? 'fail' : 'pass',
    detail: notInRegistry
      ? `No matching record for license ${prcLicense} in the PRC professional registry.`
      : `Record found · Profession: PHYSICIAN · Status: ACTIVE`,
  });

  // 5. Name match
  checks.push({
    id: 'name',
    label: 'Registered name match',
    status: 'pass',
    detail: `${registryName} — matches account name`,
  });

  // 6. ID document
  checks.push({
    id: 'document',
    label: 'PRC ID document check',
    status: hasIdDocument ? 'pass' : 'fail',
    detail: hasIdDocument
      ? 'ID image received · license number and name legible'
      : 'Upload a clear photo of the front of your PRC ID.',
  });

  return checks;
}

export function createVerificationReference(license) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PRC-VR-${license}-${rand}`;
}

// --------------------------------------------------------------------------
// Image helpers (downscale to keep localStorage small)
// --------------------------------------------------------------------------
export function downscaleImageFile(file, maxDim = 640, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Draws a clearly-labelled SAMPLE PRC-style ID card for demos
export function createSamplePrcIdDataUrl({ firstName, middleName, lastName, prcLicense, prcRegistrationDate, prcExpiryDate }) {
  const w = 640;
  const h = 400;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#F1F5F9');
  bg.addColorStop(1, '#DBEAFE');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(0, 0, w, 78);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 14px Inter, Arial, sans-serif';
  ctx.fillText('REPUBLIC OF THE PHILIPPINES', 24, 30);
  ctx.font = '800 22px Inter, Arial, sans-serif';
  ctx.fillText('PROFESSIONAL REGULATION COMMISSION', 24, 60);

  // Photo placeholder
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(24, 100, 150, 180);
  ctx.fillStyle = '#94A3B8';
  ctx.beginPath();
  ctx.arc(99, 165, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(99, 262, 58, 40, 0, Math.PI, 0);
  ctx.fill();

  const name = `${String(lastName || 'LASTNAME').toUpperCase()}, ${String(firstName || 'FIRSTNAME').toUpperCase()} ${
    middleName ? `${middleName.charAt(0).toUpperCase()}.` : ''
  }`;

  const rows = [
    ['NAME', name],
    ['PROFESSION', 'PHYSICIAN'],
    ['REGISTRATION NO.', prcLicense || '0000000'],
    ['REGISTRATION DATE', prcRegistrationDate || '—'],
    ['VALID UNTIL', prcExpiryDate || '—'],
  ];
  let y = 112;
  rows.forEach(([k, v]) => {
    ctx.fillStyle = '#64748B';
    ctx.font = '700 12px Inter, Arial, sans-serif';
    ctx.fillText(k, 200, y);
    ctx.fillStyle = '#0F172A';
    ctx.font = '800 19px Inter, Arial, sans-serif';
    ctx.fillText(v, 200, y + 22);
    y += 50;
  });

  ctx.save();
  ctx.translate(w / 2, h / 2 + 30);
  ctx.rotate(-0.22);
  ctx.fillStyle = 'rgba(220, 38, 38, 0.22)';
  ctx.font = '900 54px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE · DEMO ONLY', 0, 0);
  ctx.restore();

  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(0, h - 14, w, 14);

  return c.toDataURL('image/jpeg', 0.85);
}

export function getInitials(profile) {
  if (!profile) return 'DR';
  const f = String(profile.firstName || '').charAt(0);
  const l = String(profile.lastName || '').charAt(0);
  return `${f}${l}`.toUpperCase() || 'DR';
}
