import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-enter" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: '5rem', marginBottom: 16 }}>🏃</div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8 }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--clr-text-muted)', marginBottom: 32, fontSize: '1.1rem' }}>
        Looks like this page ran off the field!
      </p>
      <Link to="/" className="btn btn--primary btn--lg">← Back to Home</Link>
    </div>
  );
}
