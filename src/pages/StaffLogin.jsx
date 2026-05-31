import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStaffAuth } from "../hooks/useStaffAuth.jsx";
import "./StaffLogin.css";

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useStaffAuth();

  const [password, setPassword] = useState("");
  const [staffName, setStaffName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/staff", { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = await login(password, staffName || "Staff");
    if (ok) {
      navigate("/staff", { replace: true });
    } else {
      setError("Incorrect password. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="staff-login page-enter">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="card staff-login__card">
          <div className="staff-login__icon">🔒</div>
          <h1>Staff Portal</h1>
          <p>Sign in to manage registrations and rosters.</p>

          <form onSubmit={handleSubmit} className="staff-login__form">
            <div className="form-group">
              <label htmlFor="staffName" className="form-label">
                Your Name (optional)
              </label>
              <input
                id="staffName"
                type="text"
                className="form-input"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Coach Sarah"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Staff Password <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                className={`form-input ${error ? "error" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter staff password"
                autoComplete="current-password"
                autoFocus
                required
              />
              {error && (
                <span className="form-error" role="alert">
                  {error}
                </span>
              )}
              <span className="form-hint">
                <code></code>
              </span>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <span className="spinner spinner--sm" /> Verifying…
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <div className="staff-login__footer">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
