import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getRegistration, getRegistrationsByEmail } from "../utils/api.js";
import {
  generateQRDataURL,
  downloadQRCode,
  printQRCode,
} from "../utils/qrcode.js";
import {
  formatDate,
  formatDateTime,
  getProgramColor,
} from "../utils/helpers.js";
import "./ParentDashboard.css";

export default function ParentDashboard() {
  const [searchType, setSearchType] = useState("id"); // 'id' | 'email'
  const [searchValue, setSearchValue] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // QR state per registration
  const [qrMap, setQrMap] = useState({});
  const [qrLoading, setQrLoading] = useState({});

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError("");
    setSearched(false);

    try {
      if (searchType === "id") {
        const result = await getRegistration(searchValue.trim().toUpperCase());
        setRegistrations([result]);
      } else {
        const result = await getRegistrationsByEmail(
          searchValue.trim().toLowerCase(),
        );
        setRegistrations(
          Array.isArray(result.registrations) ? result.registrations : [result],
        );
      }
      setSearched(true);
    } catch (err) {
      setError(
        err.message ||
          "Could not find registration. Please check your details.",
      );
      setRegistrations([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadQR(id) {
    if (qrMap[id] || qrLoading[id]) return;
    setQrLoading((s) => ({ ...s, [id]: true }));
    try {
      const url = await generateQRDataURL(id);
      setQrMap((s) => ({ ...s, [id]: url }));
    } catch {}
    setQrLoading((s) => ({ ...s, [id]: false }));
  }

  function statusBadge(status) {
    const map = {
      Pending: "badge--pending",
      Paid: "badge--paid",
      Verified: "badge--verified",
      "Checked In": "badge--checkedin",
      Cancelled: "badge--cancelled",
      Waitlist: "badge--waitlist",
    };
    return (
      <span className={`badge ${map[status] || "badge--pending"}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="dashboard page-enter">
      <div className="container container--narrow">
        {/* Header */}
        <div className="dashboard__header">
          <h1>Parent Dashboard</h1>
          <p>
            Look up your child's registration status, payment info, and QR code.
          </p>
        </div>

        {/* Search */}
        <div className="card dashboard__search">
          <h2>Find Your Registration</h2>

          <div className="search-type-toggle">
            <button
              className={`toggle-btn ${searchType === "id" ? "active" : ""}`}
              onClick={() => {
                setSearchType("id");
                setSearchValue("");
                setRegistrations([]);
                setSearched(false);
              }}
            >
              🔍 By Registration ID
            </button>
            <button
              className={`toggle-btn ${searchType === "email" ? "active" : ""}`}
              onClick={() => {
                setSearchType("email");
                setSearchValue("");
                setRegistrations([]);
                setSearched(false);
              }}
            >
              📧 By Email Address
            </button>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="form-group">
              <label htmlFor="searchValue" className="form-label">
                {searchType === "id"
                  ? "Registration ID"
                  : "Parent Email Address"}
              </label>
              <div className="search-input-row">
                <input
                  id="searchValue"
                  type={searchType === "email" ? "email" : "text"}
                  className="form-input"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === "id"
                      ? "e.g. SP-2026-XXX"
                      : "parent@example.com"
                  }
                  autoComplete={searchType === "email" ? "email" : "off"}
                  required
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading || !searchValue.trim()}
                >
                  {loading ? (
                    <span className="spinner spinner--sm" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {error && (
          <div className="alert alert--error">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {searched && !error && registrations.length === 0 && (
          <div className="card dashboard__empty">
            <div className="empty-icon">🔍</div>
            <h3>No registrations found</h3>
            <p>
              Check that you've entered the correct{" "}
              {searchType === "id" ? "Registration ID" : "email address"}.
            </p>
            <Link
              to="/register"
              className="btn btn--primary"
              style={{ marginTop: 16 }}
            >
              Register Now →
            </Link>
          </div>
        )}

        {registrations.map((reg) => {
          const childName =
            `${reg.childFirstName || ""} ${reg.childLastName || ""}`.trim();
          const colors = getProgramColor(reg.program);

          return (
            <div key={reg.registrationId} className="card dashboard__reg-card">
              {/* Top bar */}
              <div className="reg-card__top">
                <div>
                  <h2 className="reg-card__name">{childName}</h2>
                  <code className="reg-card__id">{reg.registrationId}</code>
                </div>
                <div className="reg-card__statuses">
                  {statusBadge(reg.paymentStatus || "Pending")}
                  {reg.checkInTime && statusBadge("Checked In")}
                </div>
              </div>

              {/* Info grid */}
              <div className="reg-card__grid">
                <div className="info-cell">
                  <span>Program</span>
                  <strong style={{ color: colors.text }}>{reg.program}</strong>
                </div>
                <div className="info-cell">
                  <span>Date of Birth</span>
                  <strong>{formatDate(reg.dateOfBirth)}</strong>
                </div>
                <div className="info-cell">
                  <span>Parent</span>
                  <strong>
                    {`${reg.parentFirstName || ""} ${reg.parentLastName || ""}`.trim()}
                  </strong>
                </div>
                <div className="info-cell">
                  <span>Registered On</span>
                  <strong>{formatDateTime(reg.registrationTimestamp)}</strong>
                </div>
                {reg.checkInTime && (
                  <div className="info-cell">
                    <span>Checked In</span>
                    <strong>{formatDateTime(reg.checkInTime)}</strong>
                  </div>
                )}
              </div>

              {/* Payment info */}
              {(reg.paymentStatus === "Pending" || !reg.paymentStatus) && (
                <div
                  className="alert alert--warning"
                  style={{ marginBottom: 16 }}
                >
                  <span>💳</span>
                  <div>
                    <strong>Payment Pending</strong> — Your spot is reserved.
                    Please complete payment using Registration ID{" "}
                    <code>{reg.registrationId}</code> as the reference.
                  </div>
                </div>
              )}

              {reg.paymentStatus === "Paid" && (
                <div
                  className="alert alert--success"
                  style={{ marginBottom: 16 }}
                >
                  <span>✅</span>
                  <div>
                    <strong>Payment Confirmed!</strong> Your child's
                    registration is fully confirmed.
                  </div>
                </div>
              )}

              {/* QR Code section */}
              <div className="reg-card__qr">
                <h3>Check-In QR Code</h3>
                {!qrMap[reg.registrationId] ? (
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => loadQR(reg.registrationId)}
                    disabled={qrLoading[reg.registrationId]}
                  >
                    {qrLoading[reg.registrationId] ? (
                      <>
                        <span className="spinner spinner--sm" /> Generating…
                      </>
                    ) : (
                      "📲 Show QR Code"
                    )}
                  </button>
                ) : (
                  <div className="qr-row">
                    <img
                      src={qrMap[reg.registrationId]}
                      alt={`QR for ${childName}`}
                      className="qr-thumb"
                    />
                    <div className="qr-row__actions">
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() =>
                          downloadQRCode(
                            qrMap[reg.registrationId],
                            `${reg.registrationId}-qr.png`,
                          )
                        }
                      >
                        ⬇ Download
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          printQRCode(qrMap[reg.registrationId], {
                            childName,
                            registrationId: reg.registrationId,
                            program: reg.program,
                          })
                        }
                      >
                        🖨 Print
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            color: "var(--clr-text-muted)",
            fontSize: "0.875rem",
          }}
        >
          Need help? Contact us at{" "}
          <a
            href={`mailto:${import.meta.env.VITE_PROGRAM_CONTACT_EMAIL || "sports@yourorg.com"}`}
          >
            {import.meta.env.VITE_PROGRAM_CONTACT_EMAIL || "sports@yourorg.com"}
          </a>
        </div>
      </div>
    </div>
  );
}
