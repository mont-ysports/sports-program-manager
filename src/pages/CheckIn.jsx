import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { checkInParticipant, getRegistration } from "../utils/api.js";
import { verifyCheckInPin } from "../hooks/useStaffAuth.jsx";
import QRScanner from "../components/QRScanner.jsx";
import { formatDate, formatDateTime } from "../utils/helpers.js";
import "./CheckIn.css";

export default function CheckIn() {
  const [searchParams] = useSearchParams();
  const prefilledId = searchParams.get("id") || "";

  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const [registrationId, setRegistrationId] = useState(prefilledId);
  const [regInfo, setRegInfo] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [checkInError, setCheckInError] = useState("");

  const inputRef = useRef(null);

  // Auto-lookup when prefilled from QR scan
  useEffect(() => {
    if (prefilledId && pinVerified) {
      handleLookup(prefilledId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledId, pinVerified]);

  function handlePinSubmit(e) {
    e.preventDefault();
    if (verifyCheckInPin(pin)) {
      setPinVerified(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }
  }

  function handleQRScan(scannedId) {
    setShowScanner(false);
    setRegistrationId(scannedId);
    handleLookup(scannedId);
  }

  async function handleLookup(id) {
    const lookupId = (id || registrationId).trim().toUpperCase();
    if (!lookupId) return;

    setLookupLoading(true);
    setLookupError("");
    setRegInfo(null);
    setCheckInResult(null);
    setCheckInError("");

    try {
      const data = await getRegistration(lookupId);
      setRegInfo(data);
      setRegistrationId(lookupId);
    } catch (err) {
      setLookupError(err.message || "Registration not found.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!regInfo) return;
    setCheckingIn(true);
    setCheckInError("");

    try {
      const result = await checkInParticipant(regInfo.registrationId, pin);
      setCheckInResult(result);
      setRegInfo((prev) => ({ ...prev, checkInTime: result.checkInTime }));
    } catch (err) {
      setCheckInError(err.message || "Check-in failed. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  }

  function handleReset() {
    setRegistrationId("");
    setRegInfo(null);
    setCheckInResult(null);
    setCheckInError("");
    setLookupError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ── PIN gate ────────────────────────────────────────────
  if (!pinVerified) {
    return (
      <div className="checkin page-enter">
        <div className="container" style={{ maxWidth: 420 }}>
          <div className="card checkin__pin-card">
            <div className="checkin__icon">🔐</div>
            <h1>Staff Check-In</h1>
            <p>Enter your check-in PIN to access the scanner.</p>
            <form onSubmit={handlePinSubmit} className="pin-form">
              <div className="form-group">
                <label htmlFor="pin" className="form-label">
                  Check-In PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  className={`form-input pin-input ${pinError ? "error" : ""}`}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError("");
                  }}
                  placeholder="Enter PIN"
                  maxLength={8}
                  autoFocus
                />
                {pinError && <span className="form-error">{pinError}</span>}
                <span className="form-hint">
                  Default PIN is 1234 — change via VITE_CHECKIN_PIN env var
                </span>
              </div>
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={!pin}
              >
                Unlock Check-In →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin page-enter">
      <div className="container" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="checkin__header">
          <h1>✅ Check-In Station</h1>
          <p>
            Scan a QR code or manually enter a Registration ID to check in a
            participant.
          </p>
        </div>

        {/* ID input */}
        {!checkInResult && (
          <div className="card checkin__lookup">
            {showScanner && (
              <QRScanner
                onScan={handleQRScan}
                onClose={() => setShowScanner(false)}
              />
            )}
            <div className="form-group">
              <label htmlFor="regId" className="form-label">
                Registration ID
              </label>
              <div className="lookup-row">
                <input
                  id="regId"
                  type="text"
                  ref={inputRef}
                  className="form-input"
                  value={registrationId}
                  onChange={(e) =>
                    setRegistrationId(e.target.value.toUpperCase())
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  placeholder="e.g. SP-2026-XXX"
                  autoComplete="off"
                  autoFocus={!prefilledId}
                />
                <button
                  className="btn btn--secondary"
                  onClick={() => handleLookup()}
                  disabled={lookupLoading || !registrationId.trim()}
                >
                  {lookupLoading ? (
                    <span className="spinner spinner--sm" />
                  ) : (
                    "Look Up"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    setShowScanner((s) => !s);
                  }}
                  title="Scan QR Code with camera"
                >
                  {showScanner ? "✕ Close Scanner" : "📷 Scan QR"}
                </button>
              </div>
              <span className="form-hint">
                💡 Tip: When a parent scans their QR code, this field
                auto-populates.
              </span>
            </div>

            {lookupError && (
              <div className="alert alert--error">
                <span>⚠️</span>
                <div>{lookupError}</div>
              </div>
            )}
          </div>
        )}

        {/* Participant info card */}
        {regInfo && !checkInResult && (
          <div className="card checkin__participant">
            <div className="participant__top">
              <div className="participant__avatar">
                {regInfo.gender === "Female" ? "👧" : "👦"}
              </div>
              <div>
                <h2>{`${regInfo.childFirstName} ${regInfo.childLastName}`}</h2>
                <code className="reg-id-small">{regInfo.registrationId}</code>
              </div>
              <div className="participant__status">
                {regInfo.checkInTime ? (
                  <span className="badge badge--checkedin">
                    Already Checked In
                  </span>
                ) : (
                  <span className="badge badge--pending">Not Checked In</span>
                )}
              </div>
            </div>

            <div className="participant__details">
              <div className="detail-item">
                <span>Program</span>
                <strong>{regInfo.program}</strong>
              </div>
              <div className="detail-item">
                <span>Date of Birth</span>
                <strong>{formatDate(regInfo.dateOfBirth)}</strong>
              </div>
              <div className="detail-item">
                <span>Parent</span>
                <strong>{`${regInfo.parentFirstName} ${regInfo.parentLastName}`}</strong>
              </div>
              <div className="detail-item">
                <span>Parent Phone</span>
                <strong>{regInfo.parentPhone}</strong>
              </div>
              <div className="detail-item">
                <span>Payment</span>
                <strong>{regInfo.paymentStatus || "Pending"}</strong>
              </div>
              {regInfo.allergies && regInfo.allergies !== "None" && (
                <div className="detail-item detail-item--alert">
                  <span>⚠️ Allergies</span>
                  <strong>{regInfo.allergies}</strong>
                </div>
              )}
              {regInfo.medicalNotes && (
                <div className="detail-item detail-item--alert">
                  <span>🏥 Medical Notes</span>
                  <strong>{regInfo.medicalNotes}</strong>
                </div>
              )}
            </div>

            {regInfo.checkInTime ? (
              <div className="alert alert--info">
                <span>ℹ️</span>
                <div>
                  This participant was already checked in at{" "}
                  <strong>{formatDateTime(regInfo.checkInTime)}</strong>.
                </div>
              </div>
            ) : (
              <>
                {checkInError && (
                  <div className="alert alert--error">
                    <span>⚠️</span>
                    <div>{checkInError}</div>
                  </div>
                )}
                <div className="checkin__actions">
                  <button
                    className="btn btn--primary btn--lg btn--full checkin-btn"
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                  >
                    {checkingIn ? (
                      <>
                        <span className="spinner spinner--sm" /> Checking In…
                      </>
                    ) : (
                      "✅ Confirm Check-In"
                    )}
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={handleReset}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </>
            )}

            {regInfo.checkInTime && (
              <button
                className="btn btn--outline btn--sm"
                onClick={handleReset}
                style={{ marginTop: 16 }}
              >
                ← Scan Another
              </button>
            )}
          </div>
        )}

        {/* Success screen */}
        {checkInResult && (
          <div className="card checkin__success">
            <div className="success-icon">🎉</div>
            <h2>Checked In!</h2>
            <p>
              <strong>{`${regInfo.childFirstName} ${regInfo.childLastName}`}</strong>{" "}
              has been successfully checked in to{" "}
              <strong>{regInfo.program}</strong>.
            </p>
            <p className="checkin-time">
              Time: {formatDateTime(checkInResult.checkInTime)}
            </p>
            <button className="btn btn--primary btn--lg" onClick={handleReset}>
              ← Scan Next Participant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
