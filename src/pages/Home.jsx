import React from "react";
import { Link } from "react-router-dom";
import { PROGRAMS } from "../utils/helpers.js";
import "./Home.css";

export default function Home() {
  return (
    <div className="home page-enter">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero bg-pattern">
        <div className="hero__shapes" aria-hidden="true">
          <div className="shape shape--1" />
          <div className="shape shape--2" />
          <div className="shape shape--3" />
          <span className="emoji-float e1">⚽</span>
          <span className="emoji-float e2">🏀</span>
          <span className="emoji-float e3">🏊</span>
          <span className="emoji-float e4">🎾</span>
          <span className="emoji-float e5">🏅</span>
        </div>
        <div className="container hero__content">
          <div className="hero__badge">
            <span>🌟</span> Registration Now Open
          </div>
          <h1 className="hero__title">
            2026 Children Vacation
            <br />
            <span className="hero__title-accent">Sports Program</span>
          </h1>
          <p className="hero__subtitle">
            An epic vacation of sports, friendship, and memories. Choose from
            exciting programs designed for children aged 4–19. Professional
            coaches, safe environment, unstoppable fun.
          </p>
          <div className="hero__cta">
            <Link to="/register" className="btn btn--primary btn--lg">
              Register Your Child
            </Link>
            <a href="#programs" className="btn btn--outline btn--lg">
              View Programs
            </a>
          </div>
          <div className="hero__stats">
            <div className="stat">
              <span>7</span> Sports
            </div>
            <div className="stat">
              <span>300+</span> Spots
            </div>
            <div className="stat">
              <span>4–19</span> Ages
            </div>
            <div className="stat">
              <span>8</span> Weeks
            </div>
          </div>
        </div>
      </section>

      {/* ── Programs ──────────────────────────────────────── */}
      <section className="programs section" id="programs">
        <div className="container">
          <div className="section-header">
            <h2>Choose Your Program</h2>
            <p>
              Every program is led by qualified coaches focused on
              skill-building, teamwork, and fun.
            </p>
          </div>
          <div className="programs__grid">
            {PROGRAMS.map((prog) => (
              <div className="program-card card card--hover" key={prog.value}>
                <div className="program-card__emoji">{prog.emoji}</div>
                <h3>{prog.label}</h3>
                <div className="program-card__meta">
                  <span>🎂 Ages {prog.ages}</span>
                  <span>👥 {prog.spots} spots</span>
                </div>
                <Link
                  to={`/register?program=${encodeURIComponent(prog.value)}`}
                  className="btn btn--primary btn--sm btn--full"
                >
                  Register for {prog.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section
        className="how section"
        style={{ background: "var(--clr-surface-2)" }}
      >
        <div className="container">
          <div class="section-header">
            <h2>How Registration Works</h2>
            <p>Simple, fast, and fully digital — from sign-up to check-in.</p>
          </div>
          <div className="steps">
            {[
              {
                icon: "📝",
                n: "01",
                title: "Fill the Form",
                desc: "Complete our online registration form with your child's and your details.",
              },
              {
                icon: "💳",
                n: "02",
                title: "Make Payment",
                desc: "Follow the payment instructions shown after registration. Bank transfer, mobile money or Coupon.",
              },
              {
                icon: "📲",
                n: "03",
                title: "Get Your QR Code",
                desc: "Receive a unique QR code tied to your child's registration.",
              },
              {
                icon: "✅",
                n: "04",
                title: "Show Up & Play!",
                desc: "Present the QR code at check-in. Staff will scan and mark attendance instantly.",
              },
            ].map((step) => (
              <div className="step" key={step.n}>
                <div className="step__number">{step.n}</div>
                <div className="step__icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="container cta-banner__inner">
          <div>
            <h2>Ready to register?</h2>
            <p>Spots are limited — secure your child's place today!</p>
          </div>
          <Link to="/register" className="btn btn--primary btn--lg">
            Start Registration →
          </Link>
        </div>
      </section>
    </div>
  );
}
