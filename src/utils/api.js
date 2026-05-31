/**
 * api.js — Frontend ↔ Google Apps Script Web App bridge
 *
 * Apps Script Web Apps do not support CORS preflight (OPTIONS) requests.
 * Strategy: ALL requests sent as GET with query params — no preflight triggered.
 * "Mutation" actions (register, checkIn, updatePayment) are also sent as GET
 * with an `action` param. Apps Script handles everything in doGet().
 */

const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

if (!BASE_URL || BASE_URL.includes('YOUR_DEPLOYMENT_ID')) {
  console.warn('[API] VITE_APPS_SCRIPT_URL is not configured.');
}

// ── Core: all calls go as plain GET (no preflight) ─────────────────────────

async function scriptCall(params = {}) {
  if (!BASE_URL || BASE_URL.includes('YOUR_DEPLOYMENT_ID')) {
    throw new Error('Apps Script URL not configured. Check your .env file.');
  }

  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      url.searchParams.set(k, v.join('||'));
    } else {
      url.searchParams.set(k, String(v));
    }
  });

  const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });

  if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message || 'Server error.');
  return json;
}

// ── POST for large payloads (photos) ──────────────────────────────────────
// Apps Script doPost receives the JSON body via e.postData.contents.
// We send as Content-Type: text/plain to avoid CORS preflight.

async function scriptPost(payload = {}) {
  if (!BASE_URL || BASE_URL.includes('YOUR_DEPLOYMENT_ID')) {
    throw new Error('Apps Script URL not configured. Check your .env file.');
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (json.status === 'error') throw new Error(json.message || 'Server error.');
  return json;
}

// ── Registration ───────────────────────────────────────────────────────────

export async function submitRegistration(formData) {
  // Extract photos before sending — they go via a separate upload call
  const { childPhoto, parentPhoto, ...rest } = formData;

  // 1. Register participant (no binary data)
  const result = await scriptCall({ action: 'registerParticipant', ...rest });

  // 2. Upload photos if provided (non-blocking — don't fail registration if photos fail)
  if (result.registrationId) {
    const uploads = [];
    if (childPhoto?.base64) {
      uploads.push(
        scriptPost({
          action: 'uploadPhoto',
          registrationId: result.registrationId,
          photoType: 'child',
          base64: childPhoto.base64,
          fileName: childPhoto.fileName || 'child-photo.jpg',
        }).catch((e) => console.warn('Child photo upload failed:', e.message))
      );
    }
    if (parentPhoto?.base64) {
      uploads.push(
        scriptPost({
          action: 'uploadPhoto',
          registrationId: result.registrationId,
          photoType: 'parent',
          base64: parentPhoto.base64,
          fileName: parentPhoto.fileName || 'parent-photo.jpg',
        }).catch((e) => console.warn('Parent photo upload failed:', e.message))
      );
    }
    await Promise.all(uploads);
  }

  return result;
}

export async function getRegistration(registrationId) {
  return scriptCall({ action: 'getRegistration', registrationId });
}

export async function getRegistrationsByEmail(email) {
  return scriptCall({ action: 'getByEmail', email });
}

// ── Check-In ───────────────────────────────────────────────────────────────

export async function checkInParticipant(registrationId, staffPin) {
  return scriptCall({ action: 'checkIn', registrationId, staffPin });
}

// ── Staff Portal ───────────────────────────────────────────────────────────

export async function getAllRegistrations(filters = {}) {
  return scriptCall({ action: 'getAllRegistrations', ...filters });
}

export async function updatePaymentStatus(registrationId, status) {
  return scriptCall({ action: 'updatePaymentStatus', registrationId, status });
}

export async function getProgramRoster(program) {
  return scriptCall({ action: 'getProgramRoster', program });
}

export async function getStats() {
  return scriptCall({ action: 'getStats' });
}

// ── Coupon ────────────────────────────────────────────────

/**
 * Validate and redeem a coupon code for a registration.
 * If valid, updates paymentStatus to 'Coupon Redeemed' in Sheets.
 * @param {string} registrationId
 * @param {string} couponCode
 */
export async function redeemCoupon(registrationId, couponCode) {
  return scriptCall({ action: 'redeemCoupon', registrationId, couponCode });
}
