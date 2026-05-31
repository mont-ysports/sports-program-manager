import React, { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../hooks/useStaffAuth.jsx";
import "./Layout.css";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useStaffAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
    setMenuOpen(false);
  }

  return (
    <div className="layout">
      {/* ── Navigation ──────────────────────────────────── */}
      <header className="navbar">
        <div className="container navbar__inner">
          {/* Logo */}
          <Link
            to="/"
            className="navbar__logo"
            onClick={() => setMenuOpen(false)}
          >
            <span className="navbar__logo-icon">🏅</span>
            <span className="navbar__logo-text">
              <span className="navbar__logo-main">
                Sports<span className="accent">Camp</span>
              </span>
              <span className="navbar__logo-sub">2026</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="navbar__nav" aria-label="Main navigation">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/register" className={navClass}>
              Register
            </NavLink>
            <NavLink to="/dashboard" className={navClass}>
              My Dashboard
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/staff" className={navClass}>
                  Staff Portal
                </NavLink>
                <NavLink to="/checkin" className={navClass}>
                  Check-In
                </NavLink>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <NavLink to="/staff/login" className={navClass}>
                Staff Login
              </NavLink>
            )}
          </nav>

          {/* CTA + Hamburger */}
          <div className="navbar__actions">
            <Link
              to="/register"
              className="btn btn--primary btn--sm navbar__cta"
            >
              Register Now
            </Link>
            <button
              className={`navbar__hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            className="navbar__mobile"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/register" onClick={() => setMenuOpen(false)}>
              Register
            </NavLink>
            <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
              My Dashboard
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/staff" onClick={() => setMenuOpen(false)}>
                  Staff Portal
                </NavLink>
                <NavLink to="/checkin" onClick={() => setMenuOpen(false)}>
                  Check-In
                </NavLink>
                <button
                  className="btn btn--outline btn--sm"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <NavLink to="/staff/login" onClick={() => setMenuOpen(false)}>
                Staff Login
              </NavLink>
            )}
            <Link
              to="/register"
              className="btn btn--primary"
              onClick={() => setMenuOpen(false)}
            >
              Register Now
            </Link>
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__brand">
            <span className="footer__logo">🏅 SportsCamp 2026</span>
            <p>Building champions through play, teamwork & joy.</p>
          </div>

          <div className="footer__links">
            <div>
              <h4>Quick Links</h4>
              <Link to="/register">Register</Link>
              <Link to="/dashboard">Parent Dashboard</Link>
              <Link to="/checkin">Check-In</Link>
            </div>
            <div>
              <h4>Contact</h4>
              <a
                href={`mailto:${import.meta.env.VITE_PROGRAM_CONTACT_EMAIL || "sports@montserradoymca.org"}`}
              >
                {import.meta.env.VITE_PROGRAM_CONTACT_EMAIL ||
                  "sports@montserradoymca.org"}
              </a>
              <span>
                {import.meta.env.VITE_PROGRAM_CONTACT_PHONE ||
                  "+1 (555) 000-0000"}
              </span>
            </div>
          </div>

          <div className="footer__bottom">
            <p>
              © 2026{" "}
              {import.meta.env.VITE_PROGRAM_NAME ||
                "Children Vacation Sports Program"}
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function navClass({ isActive }) {
  return isActive ? "navbar__link active" : "navbar__link";
}
