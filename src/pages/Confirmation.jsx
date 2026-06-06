import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getRegistration, redeemCoupon, getWhatsAppGroupLink } from '../utils/api.js';
import { generateQRDataURL, downloadQRCode, printQRCode } from '../utils/qrcode.js';
import { formatDate, calculateTotalCost, PROGRAMS, copyToClipboard } from '../utils/helpers.js';
import './Confirmation.css';

export default function Confirmation() {
  const { registrationId } = useParams();
  const location = useLocation();

  const [reg, setReg] = useState(location.state || null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(true);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [whatsAppLink, setWhatsAppLink]   = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  // Load registration data if not passed via state
  useEffect(() => {
    if (!reg && registrationId) {
      getRegistration(registrationId)
        .then((data) => { setReg(data); setPaymentStatus(data.paymentStatus || 'Pending'); })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else if (reg) {
      setPaymentStatus(reg.paymentStatus || 'Pending');
    }
  }, [registrationId]);

  // Generate QR code once we have the ID
  useEffect(() => {
    if (!registrationId) return;
    generateQRDataURL(registrationId)
      .then(setQrDataUrl)
      .catch(() => {})
      .finally(() => setQrLoading(false));
  }, [registrationId]);

  async function handleCopy() {
    const ok = await copyToClipboard(registrationId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCouponSubmit(e) {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const result = await redeemCoupon(registrationId, couponCode.trim().toUpperCase());
      setPaymentStatus('Coupon Redeemed');
      setCouponSuccess(result.message || 'Coupon applied successfully! Your registration is now confirmed.');
      setCouponCode('');
      // Fetch WhatsApp group link to show after redemption
      getWhatsAppGroupLink()
        .then((r) => setWhatsAppLink(r.link || ''))
        .catch(() => {}); // silently ignore if not configured
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon code. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="confirmation page-enter" style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <span className="spinner spinner--lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="confirmation page-enter">
        <div className="container container--narrow">
          <div className="alert alert--error">⚠️ {error}</div>
          <Link to="/" className="btn btn--primary" style={{ marginTop: 20 }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const childName = reg
    ? `${reg.childFirstName || ''} ${reg.childLastName || ''}`.trim()
    : '—';

  // Parse programs — stored as comma-separated string or array
  const selectedPrograms = reg && reg.program
    ? (Array.isArray(reg.program)
        ? reg.program
        : String(reg.program).split(',').map((p) => p.trim()).filter(Boolean))
    : [];

  // Build per-program cost breakdown
  const costBreakdown = selectedPrograms.map((val) => {
    const prog = PROGRAMS.find((p) => p.value === val);
    return { label: prog ? prog.label : val, price: prog ? prog.price : 0 };
  });

  const totalCost = calculateTotalCost(selectedPrograms);

  const paymentInstructions = import.meta.env.VITE_PAYMENT_INSTRUCTIONS ||
    'Please make payment via bank transfer. Use your Registration ID as the payment reference.';

  const isCouponRedeemed = paymentStatus === 'Coupon Redeemed';
  const isPaid = paymentStatus === 'Paid' || isCouponRedeemed;

  function StatusBadge() {
    if (isCouponRedeemed) return <span className="badge badge--paid">🎟️ Coupon Redeemed</span>;
    if (paymentStatus === 'Paid') return <span className="badge badge--paid">✅ Payment Confirmed</span>;
    return <span className="badge badge--pending">⏳ Pending Payment</span>;
  }

  return (
    <div className="confirmation page-enter">
      <div className="container container--narrow">

        {/* ── Success header ──────────────────────────────── */}
        <div className="confirmation__hero">
          <div className="confirmation__checkmark">🎉</div>
          <h1>Registration Complete!</h1>
          <p>
            Welcome to the 2026 Children Vacation Sports Program,{' '}
            <strong>{childName}</strong>!
          </p>
        </div>

        {/* ── Registration ID + QR Code ───────────────────── */}
        <div className="card confirmation__main">
          <div className="confirmation__split">

            {/* Left — details */}
            <div className="confirmation__details">
              <h2>Your Registration Details</h2>

              <div className="detail-row">
                <span>Registration ID</span>
                <div className="detail-value id-value">
                  <code>{registrationId}</code>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={handleCopy}
                    title="Copy ID"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>

              {reg && (
                <>
                  <div className="detail-row">
                    <span>Child</span>
                    <strong>{childName}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Program</span>
                    <strong>{selectedPrograms.join(', ') || reg.program}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Date of Birth</span>
                    <strong>{formatDate(reg.dateOfBirth)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Parent Email</span>
                    <strong>{reg.parentEmail}</strong>
                  </div>
                </>
              )}

              <div className="detail-row">
                <span>Status</span>
                <StatusBadge />
              </div>

              <div className="detail-row">
                <span>Amount Due</span>
                <strong className={`amount ${isPaid ? 'amount--paid' : ''}`}>
                  {isPaid ? '✓ Covered' : `$${totalCost}.00 USD`}
                </strong>
              </div>

              {/* ── Inline coupon entry ── */}
              {!isPaid && (
                <div className="coupon-inline">
                  <form onSubmit={handleCouponSubmit} className="coupon-inline__form">
                    <label className="coupon-inline__label">
                      🎟️ Have a coupon code?
                    </label>
                    <div className="coupon-input-row">
                      <input
                        type="text"
                        className={`form-input coupon-input ${couponError ? 'error' : ''}`}
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        placeholder="Enter coupon code"
                        maxLength={30}
                        disabled={couponLoading}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="submit"
                        className="btn btn--primary btn--sm"
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading
                          ? <span className="spinner spinner--sm" />
                          : 'Apply'
                        }
                      </button>
                    </div>
                    {couponError && (
                      <span className="form-error" role="alert">❌ {couponError}</span>
                    )}
                    {couponSuccess && (
                      <span className="coupon-inline__success">✅ {couponSuccess}</span>
                    )}
                  </form>
                </div>
              )}
            </div>

            {/* Right — QR code */}
            <div className="confirmation__qr">
              <h3>Your Check-In QR Code</h3>
              {qrLoading ? (
                <div className="qr-placeholder"><span className="spinner" /></div>
              ) : qrDataUrl ? (
                <div className="qr-wrapper">
                  <img src={qrDataUrl} alt={`QR Code for registration ${registrationId}`} />
                  <p className="qr-hint">Present this at check-in</p>
                </div>
              ) : (
                <p className="text-muted">QR code unavailable</p>
              )}

              <div className="qr-actions">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => qrDataUrl && downloadQRCode(qrDataUrl, `${registrationId}-qr.png`)}
                  disabled={!qrDataUrl}
                >
                  ⬇ Download PNG
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => qrDataUrl && printQRCode(qrDataUrl, { childName, registrationId, program: reg?.program || '' })}
                  disabled={!qrDataUrl}
                >
                  🖨 Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Coupon Redeemed success banner ─────────────── */}
        {isCouponRedeemed && (
          <div className="card coupon-success-card">
            <div className="coupon-success__icon">🎟️</div>
            <h2>Coupon Applied!</h2>
            <p>{couponSuccess || 'Your coupon has been successfully applied. Your registration is now fully confirmed!'}</p>
            <div className="alert alert--success" style={{ marginTop: 16, textAlign: 'left' }}>
              <span>✅</span>
              <div>
                <strong>Registration Confirmed</strong> — No further payment is required.
                Please save your QR code above and bring it on the program start date.
              </div>
            </div>

            {whatsAppLink && (
              <div className="whatsapp-join">
                <div className="whatsapp-join__text">
                  <span className="whatsapp-join__icon">💬</span>
                  <div>
                    <strong>Join Our Parents WhatsApp Group</strong>
                    <p>Stay updated with program news, schedules, and announcements.</p>
                  </div>
                </div>
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--whatsapp btn--full"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Join WhatsApp Group
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Payment / Coupon section (hidden after coupon redeemed) ── */}
        {!isPaid && (
          <div className="card confirmation__payment">
            <div className="payment-icon">💳</div>
            <h2>Payment Instructions</h2>

            {/* Cost breakdown table */}
            {costBreakdown.length > 0 && (
              <div className="cost-breakdown">
                <table className="cost-table">
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costBreakdown.map((item) => (
                      <tr key={item.label}>
                        <td>{item.label}</td>
                        <td>${item.price}.00</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="cost-total-row">
                      <td><strong>Total Due</strong></td>
                      <td><strong>${totalCost}.00 USD</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="payment-instructions">
              {paymentInstructions}
            </div>

            <div className="alert alert--warning" style={{ marginTop: 16 }}>
              <span>⚠️</span>
              <div>
                <strong>Important:</strong> Your registration is reserved but will not be confirmed
                until payment is received. Total amount due: <strong>${totalCost}.00 USD</strong>.
                Use your Registration ID <code>{registrationId}</code> as the payment reference.
              </div>
            </div>


          </div>
        )}

        {/* ── Next steps ──────────────────────────────────── */}
        <div className="card confirmation__nextsteps">
          <h2>What Happens Next?</h2>
          <ol className="next-steps-list">
            {!isPaid ? (
              <>
                <li>
                  <span className="step-num">1</span>
                  <div>
                    <strong>Make your payment or apply a coupon</strong>
                    <p>Follow the payment instructions above, or enter a valid coupon code to confirm instantly.</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <div>
                    <strong>Wait for confirmation</strong>
                    <p>Once payment is verified your status will update to confirmed.</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <div>
                    <strong>Save your QR Code</strong>
                    <p>Download or print the QR code above. Bring it on the first day for fast check-in.</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">4</span>
                  <div>
                    <strong>Show up & play!</strong>
                    <p>Arrive on the program start date, present your QR code, and let the fun begin!</p>
                  </div>
                </li>
              </>
            ) : (
              <>
                <li>
                  <span className="step-num">1</span>
                  <div>
                    <strong>Registration is confirmed! ✅</strong>
                    <p>Your spot is fully secured. No further payment is required.</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <div>
                    <strong>Save your QR Code</strong>
                    <p>Download or print the QR code above. Bring it on the first day for fast check-in.</p>
                  </div>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <div>
                    <strong>Show up & play!</strong>
                    <p>Arrive on the program start date, present your QR code, and let the fun begin!</p>
                  </div>
                </li>
              </>
            )}
          </ol>
        </div>

        {/* ── Actions ─────────────────────────────────────── */}
        <div className="confirmation__actions">
          <Link to="/dashboard" className="btn btn--secondary">
            📊 View My Dashboard
          </Link>
          <Link to="/register" className="btn btn--outline">
            + Register Another Child
          </Link>
          <Link to="/" className="btn btn--ghost">
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
