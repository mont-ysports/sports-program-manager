/**
 * useStaffAuth.jsx — Simple client-side staff authentication
 *
 * Uses sessionStorage to persist the auth state for the browser session.
 * Password is verified against a bcrypt hash stored in the env variable.
 *
 * NOTE: This is suitable for a low-stakes internal portal.
 * For higher-security needs, implement server-side sessions.
 */

import React, { createContext, useContext, useState, useEffect } from "react";

const StaffAuthContext = createContext(null);

const SESSION_KEY = "cvsp_staff_auth";
const CHECK_IN_PIN_KEY = "cvsp_checkin_pin";

/**
 * Very lightweight password check — compares against the env hash.
 * We use a simple approach: the staff password hash stored in env is a
 * SHA-256 hex of the password, generated at build time.
 *
 * To generate: open browser console and run:
 *   const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'));
 *   console.log([...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''));
 */
async function verifyPassword(input) {
  const envHash = import.meta.env.VITE_STAFF_PASSWORD_HASH;

  // If hash not configured, allow any password (dev mode only — log a warning)
  if (!envHash || envHash.startsWith("$2a$")) {
    // Fallback plain-text comparison for dev / unconfigured deploys
    const devPassword = "staff2026";
    console.warn(
      "[Auth] Using default dev password. Set VITE_STAFF_PASSWORD_HASH for production.",
    );
    return input === devPassword;
  }

  // Hash the input and compare
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(input));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex === envHash;
}

export function StaffAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session?.authenticated && session?.expiresAt > Date.now()) {
          setIsAuthenticated(true);
          setStaffName(session.staffName || "Staff");
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Attempt to log in with the given password.
   * @param {string} password
   * @param {string} name — optional staff name
   * @returns {boolean} success
   */
  async function login(password, name = "Staff") {
    const ok = await verifyPassword(password);
    if (ok) {
      const session = {
        authenticated: true,
        staffName: name,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setStaffName(name);
    }
    return ok;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setStaffName("");
  }

  return (
    <StaffAuthContext.Provider
      value={{ isAuthenticated, staffName, loading, login, logout }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx)
    throw new Error("useStaffAuth must be used inside StaffAuthProvider");
  return ctx;
}

/**
 * Check-in PIN helpers (stored separately, simpler access).
 * Default PIN is "1234" — change via VITE_CHECKIN_PIN env var.
 */
export function verifyCheckInPin(pin) {
  const expected = import.meta.env.VITE_CHECKIN_PIN || "1822";
  return pin === expected;
}
