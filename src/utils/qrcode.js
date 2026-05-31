/**
 * qrcode.js — QR code generation utilities
 *
 * Uses the `qrcode` npm package to generate a data URL
 * that can be displayed as an <img> or printed.
 *
 * QR code content format:
 *   https://<app-domain>/checkin?id=<registrationId>
 *
 * When scanned by staff, this URL auto-populates the check-in field.
 */

import QRCode from 'qrcode';

/**
 * Generate a QR code data URL for a registration ID.
 * @param {string} registrationId
 * @returns {Promise<string>} base64 PNG data URL
 */
export async function generateQRDataURL(registrationId) {
  const appUrl = window.location.origin;
  const checkInUrl = `${appUrl}/checkin?id=${encodeURIComponent(registrationId)}`;

  try {
    const dataUrl = await QRCode.toDataURL(checkInUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 300,
      color: {
        dark:  '#1A1A2E',
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('[QR] Failed to generate QR code:', err);
    throw err;
  }
}

/**
 * Trigger a download of the QR code PNG.
 * @param {string} dataUrl — from generateQRDataURL()
 * @param {string} filename — e.g. "SP-2026-001-qr.png"
 */
export function downloadQRCode(dataUrl, filename = 'registration-qr.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print the QR code in a minimal print window.
 * @param {string} dataUrl
 * @param {Object} info — { childName, registrationId, program }
 */
export function printQRCode(dataUrl, { childName, registrationId, program }) {
  const win = window.open('', '_blank', 'width=400,height=500');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print.');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code — ${registrationId}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 20px; }
        h2 { font-size: 1.2rem; margin-bottom: 4px; }
        p  { font-size: 0.85rem; color: #555; margin: 2px 0; }
        img { margin: 12px auto; border: 1px solid #ddd; padding: 8px; }
        .id { font-family: monospace; font-size: 0.9rem; font-weight: bold; margin-top: 8px; }
      </style>
    </head>
    <body>
      <h2>2026 Children Vacation Sports Program</h2>
      <p>${childName}</p>
      <p>${program}</p>
      <img src="${dataUrl}" alt="Registration QR Code" width="220" />
      <div class="id">ID: ${registrationId}</div>
      <p style="margin-top:12px;font-size:0.75rem;color:#999;">Present this QR code at check-in</p>
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body>
    </html>
  `);

  win.document.close();
}
