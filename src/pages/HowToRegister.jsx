import React from "react";
import { Link } from "react-router-dom";
import { PROGRAMS } from "../utils/helpers.js";
import "./HowToRegister.css";

export default function HowToRegister() {
  const programName =
    import.meta.env.VITE_PROGRAM_NAME ||
    "2026 Children Vacation Sports Program";
  const contactEmail =
    import.meta.env.VITE_PROGRAM_CONTACT_EMAIL || "sports@yourorg.com";
  const contactPhone = import.meta.env.VITE_PROGRAM_CONTACT_PHONE || "";
  const appUrl = window.location.origin;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="htr-page">
      {/* ── Print / Back bar (hidden when printing) ───────── */}
      <div className="htr-toolbar no-print">
        <Link to="/" className="btn btn--ghost btn--sm">
          ← Back to Home
        </Link>
        <button className="btn btn--primary btn--sm" onClick={handlePrint}>
          🖨 Print / Save as PDF
        </button>
      </div>

      {/* ── Printable content ─────────────────────────────── */}
      <div className="htr-print-area">
        {/* Header */}
        <div className="htr-header">
          <div className="htr-header__logo">🏅</div>
          <div className="htr-header__text">
            <h1>{programName}</h1>
            <p className="htr-header__sub">Parent Registration Guide</p>
          </div>
          <div className="htr-header__year">2026</div>
        </div>

        <div className="htr-divider" />

        {/* Intro */}
        <p className="htr-intro">
          Welcome! This guide will walk you through how to register your child
          for our program. Registration is done entirely online — no forms to
          print or drop off. Follow the steps below to secure your child's spot.
        </p>

        {/* Steps */}
        <div className="htr-steps">
          <div className="htr-step">
            <div className="htr-step__num">1</div>
            <div className="htr-step__content">
              <h3>Visit the Registration Website</h3>
              <p>Open your phone or computer browser and go to:</p>
              <div className="htr-url">{appUrl}/register</div>
              <p className="htr-tip">
                💡 <strong>Tip:</strong> You can also scan the QR code at the
                bottom of this page to go directly to the registration form.
              </p>
            </div>
          </div>

          <div className="htr-step">
            <div className="htr-step__num">2</div>
            <div className="htr-step__content">
              <h3>Step 1 — Child's Information</h3>
              <p>Fill in your child's details:</p>
              <ul>
                <li>
                  📸 <strong>Child's photo</strong> — taken with camera or
                  uploaded from your phone (white background, shoulders up, ears
                  visible). This is used for the membership card.
                </li>
                <li>Full name, date of birth, and gender</li>
                <li>
                  <strong>Program</strong> — select one or more:{" "}
                  {PROGRAMS.map(
                    (p) => `${p.emoji} ${p.label} ($${p.price})`,
                  ).join(", ")}
                </li>
                <li>Computer Track (if Computer is selected)</li>
                <li>Hard Skill and Soft Skill selections</li>
                <li>T-shirt size, allergies, and any medical notes</li>
              </ul>
            </div>
          </div>

          <div className="htr-step">
            <div className="htr-step__num">3</div>
            <div className="htr-step__content">
              <h3>Step 2 — Parent / Guardian Information</h3>
              <p>Fill in your own details:</p>
              <ul>
                <li>
                  📸 <strong>Your photo</strong> — for your membership card
                </li>
                <li>Full name, relationship to child, email address</li>
                <li>
                  Phone number and <strong>WhatsApp number</strong> (must start
                  with 231)
                </li>
                <li>
                  Whether you were a past participant and if you'd like to
                  volunteer
                </li>
              </ul>
            </div>
          </div>

          <div className="htr-step">
            <div className="htr-step__num">4</div>
            <div className="htr-step__content">
              <h3>Step 3 — Emergency Contact</h3>
              <p>
                Provide a different person we can contact in case of an
                emergency — someone other than the registering parent/guardian.
                Include their full name, phone number, and relationship to the
                child.
              </p>
            </div>
          </div>

          <div className="htr-step">
            <div className="htr-step__num">5</div>
            <div className="htr-step__content">
              <h3>Step 4 — Consents & Agreements</h3>
              <p>Read and agree to the following:</p>
              <ul>
                <li>Photo &amp; video consent for program use</li>
                <li>Medical consent for emergency treatment</li>
                <li>Program terms and conditions</li>
              </ul>
              <p>
                Then click <strong>"Complete Registration"</strong> to submit.
              </p>
            </div>
          </div>

          <div className="htr-step">
            <div className="htr-step__num">6</div>
            <div className="htr-step__content">
              <h3>Registration Complete — Get Your QR Code</h3>
              <p>
                After submitting you will see a confirmation page with your
                <strong> Registration ID</strong> and a <strong>QR code</strong>
                . A confirmation email will also be sent to your email address.
              </p>
              <ul>
                <li>Download or print your QR code</li>
                <li>Save your Registration ID — you'll need it for payment</li>
                <li>
                  If you received a <strong>coupon code</strong>, see Step 7
                  below to redeem it
                </li>
              </ul>
            </div>
          </div>

          <div className="htr-step htr-step--highlight">
            <div className="htr-step__num htr-step__num--coupon">7</div>
            <div className="htr-step__content">
              <h3>🎟️ Have a Coupon Code? Redeem It!</h3>
              <p>
                If you received a coupon code from us, you can use it to confirm
                your registration instantly.
              </p>
              <ul>
                <li>
                  On the <strong>Registration Complete</strong> page, look for
                  the <em>"Have a coupon code?"</em> field — it appears right
                  below the Amount Due
                </li>
                <li>
                  Type your coupon code exactly as given (e.g.{" "}
                  <strong>CAMP2026FREE</strong>) and tap <strong>Apply</strong>
                </li>
                <li>
                  If the code is valid, your status changes to{" "}
                  <strong>🎟️ Coupon Redeemed</strong> instantly
                </li>
                <li>
                  A <strong>Join WhatsApp Group</strong> button will appear —
                  tap it to join the parents group
                </li>
                <li>A confirmation email will be sent to you automatically</li>
              </ul>
              <div className="htr-coupon-note">
                ⚠️ <strong>Note:</strong> Each coupon code can only be used once
                and is non-transferable. If your code doesn't work, please
                contact us for assistance.
              </div>
            </div>
          </div>

          <div className="htr-step">
            <div className="htr-step__num">8</div>
            <div className="htr-step__content">
              <h3>Make Payment</h3>
              <p>Program fees are:</p>
              <div className="htr-fees">
                {PROGRAMS.map((p) => (
                  <div key={p.value} className="htr-fee-row">
                    <span>
                      {p.emoji} {p.label}
                    </span>
                    <span>${p.price}.00 USD</span>
                  </div>
                ))}
                <div className="htr-fee-row htr-fee-row--note">
                  <span>Multiple programs</span>
                  <span>Costs are added together</span>
                </div>
              </div>
              <p style={{ marginTop: 8 }}>
                Use your <strong>Registration ID</strong> as the payment
                reference. Your status will be updated to <em>Confirmed</em>{" "}
                once payment is verified.
              </p>
            </div>
          </div>

          <div className="htr-step">
            <div className="htr-step__num">9</div>
            <div className="htr-step__content">
              <h3>Check In on Program Day</h3>
              <p>
                On the first day of the program, present your{" "}
                <strong>QR code</strong>
                to a staff member at the entrance. They will scan it to mark
                your child as present. A WhatsApp notification will be sent to
                you when your child is checked in.
              </p>
            </div>
          </div>
        </div>

        <div className="htr-divider" />

        {/* Tips box */}
        <div className="htr-tips">
          <h3>📌 Important Tips</h3>
          <div className="htr-tips__grid">
            <div>✅ Register early — spots are limited</div>
            <div>✅ Use a valid email — confirmation will be sent there</div>
            <div>
              ✅ WhatsApp number must start with <strong>231</strong>
            </div>
            <div>✅ Photos must have a white/light background</div>
            <div>✅ Save or print your QR code after registration</div>
            <div>✅ Use your Registration ID as payment reference</div>
          </div>
        </div>

        <div className="htr-divider" />

        {/* Check registration status */}
        <div className="htr-dashboard">
          <h3>🔍 Check Your Registration Status Anytime</h3>
          <p>
            Visit <strong>{appUrl}/dashboard</strong> and enter your
            Registration ID or email address to view your registration details,
            payment status, and download your QR code at any time.
          </p>
        </div>

        <div className="htr-divider" />

        {/* Footer */}
        <div className="htr-footer">
          <div className="htr-footer__contact">
            <strong>Need Help?</strong>
            {contactEmail && <span>📧 {contactEmail}</span>}
            {contactPhone && <span>📞 {contactPhone}</span>}
          </div>
          <div className="htr-footer__url">
            <strong>Register at:</strong>
            <span>{appUrl}/register</span>
          </div>
          <div className="htr-footer__copy">
            © 2026 {programName}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
