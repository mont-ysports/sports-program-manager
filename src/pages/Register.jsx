import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { validateRegistrationForm } from "../utils/validation.js";
import { submitRegistration } from "../utils/api.js";
import {
  PROGRAMS,
  COMPUTER_TRACKS,
  HARD_SKILLS,
  SOFT_SKILLS,
} from "../utils/helpers.js";
import PhotoUpload from "../components/PhotoUpload.jsx";
import "./Register.css";

// ── Form initial state ─────────────────────────────────────
const INITIAL_STATE = {
  childFirstName: "",
  childLastName: "",
  dateOfBirth: "",
  gender: "",
  program: [],
  shirtSize: "",
  swimAbility: "",
  childPhoto: null,
  parentPhoto: null,
  medicalNotes: "",
  allergies: "",
  parentFirstName: "",
  parentLastName: "",
  relationship: "",
  parentEmail: "",
  parentPhone: "",
  whatsappNumber: "",
  parentAddress: "",
  pastParticipant: "",
  pastParticipantYears: "",
  willingToVolunteer: "",
  volunteerHow: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  medicalConsent: false,
  photoConsent: "",
  termsAccepted: false,
  howDidYouHear: "",
  computerTrack: "",
  hardSkill: "",
  softSkill: "",
};

const STEPS = [
  { id: "child", title: "Child's Info", icon: "👧" },
  { id: "parent", title: "Parent/Guardian", icon: "👨‍👩‍👧" },
  { id: "emergency", title: "Emergency", icon: "🚨" },
  { id: "agreements", title: "Agreements", icon: "✅" },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_STATE,
    program: searchParams.get("program") ? [searchParams.get("program")] : [],
  }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    const { errors: errs } = validateRegistrationForm(formData);
    setErrors(errs);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((d) => ({
      ...d,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[name];
        return next;
      });
    }
  }

  function validateCurrentStep() {
    const { errors: allErrors } = validateRegistrationForm(formData);
    const stepFields = getStepFields(step);
    const stepErrors = {};
    stepFields.forEach((f) => {
      if (allErrors[f]) stepErrors[f] = allErrors[f];
    });
    const newTouched = {};
    stepFields.forEach((f) => (newTouched[f] = true));
    setTouched((t) => ({ ...t, ...newTouched }));
    setErrors((e) => ({ ...e, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  }

  function nextStep() {
    if (validateCurrentStep()) setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { isValid, errors: allErrors } = validateRegistrationForm(formData);
    if (!isValid) {
      setErrors(allErrors);
      const allTouched = {};
      Object.keys(INITIAL_STATE).forEach((k) => (allTouched[k] = true));
      setTouched(allTouched);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await submitRegistration(formData);
      navigate(`/confirmation/${result.registrationId}`, { state: result });
    } catch (err) {
      setSubmitError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function inputProps(name) {
    return {
      id: name,
      name,
      value: formData[name],
      onChange: handleChange,
      onBlur: () => handleBlur(name),
      className: `form-input${touched[name] && errors[name] ? " error" : ""}`,
      "aria-invalid": !!(touched[name] && errors[name]),
    };
  }

  function selectProps(name) {
    return {
      ...inputProps(name),
      className: `form-select${touched[name] && errors[name] ? " error" : ""}`,
    };
  }

  return (
    <div className="register page-enter">
      <div className="container container--narrow">
        <div className="register__header">
          <h1>Register Your Child</h1>
          <p>
            Complete all steps below to secure your spot in the 2026 Sports
            Program.
          </p>
        </div>

        <div
          className="register__steps"
          role="list"
          aria-label="Registration steps"
        >
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`step-indicator ${i < step ? "done" : i === step ? "active" : "pending"}`}
              role="listitem"
              aria-current={i === step ? "step" : undefined}
            >
              <div className="step-indicator__dot">
                {i < step ? "✓" : s.icon}
              </div>
              <span className="step-indicator__label">{s.title}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card register__card">
            {/* ── Step 0 — Child info ── */}
            {step === 0 && (
              <div className="form-step">
                <h2 className="form-step__title">👧 Child's Information</h2>

                <PhotoUpload
                  label="Child's Photo"
                  hint="This photo will be used for the membership card."
                  value={formData.childPhoto}
                  onChange={(photo) =>
                    setFormData((d) => ({ ...d, childPhoto: photo }))
                  }
                  error={touched.childPhoto && errors.childPhoto}
                  required
                />

                <div className="form-row">
                  <Field
                    name="childFirstName"
                    label="First Name"
                    required
                    touched={touched}
                    errors={errors}
                  >
                    <input
                      type="text"
                      {...inputProps("childFirstName")}
                      placeholder="e.g. Emma"
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field
                    name="childLastName"
                    label="Last Name"
                    required
                    touched={touched}
                    errors={errors}
                  >
                    <input
                      type="text"
                      {...inputProps("childLastName")}
                      placeholder="e.g. Johnson"
                      autoComplete="family-name"
                    />
                  </Field>
                </div>

                <div className="form-row">
                  <Field
                    name="dateOfBirth"
                    label="Date of Birth"
                    required
                    hint="Child must be 4–17 years old"
                    touched={touched}
                    errors={errors}
                  >
                    <input
                      type="date"
                      {...inputProps("dateOfBirth")}
                      max={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() - 4),
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                      min={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() - 20),
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                    />
                  </Field>
                  <Field
                    name="gender"
                    label="Gender"
                    required
                    touched={touched}
                    errors={errors}
                  >
                    <select {...selectProps("gender")}>
                      <option value="">Select gender…</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </Field>
                </div>

                <div className="form-group">
                  <span className="form-label">
                    Program{" "}
                    <span className="required" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <p className="form-hint" style={{ marginBottom: 8 }}>
                    You may select more than one program.
                  </p>
                  <div className="checkbox-group">
                    {PROGRAMS.map((p) => (
                      <label
                        key={p.value}
                        className={`checkbox-option ${formData.program.includes(p.value) ? "checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          name="program"
                          value={p.value}
                          checked={formData.program.includes(p.value)}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = e.target.checked
                              ? [...formData.program, val]
                              : formData.program.filter((v) => v !== val);
                            setFormData((d) => ({ ...d, program: next }));
                            if (errors.program)
                              setErrors((err) => {
                                const n = { ...err };
                                delete n.program;
                                return n;
                              });
                          }}
                        />
                        <span className="checkbox-option__emoji">
                          {p.emoji}
                        </span>
                        <span className="checkbox-option__text">
                          <strong>{p.label}</strong>
                          <small>Ages {p.ages}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {touched.program && errors.program && (
                    <span className="form-error" role="alert">
                      {errors.program}
                    </span>
                  )}
                </div>

                {formData.program.includes("Computer") && (
                  <Field
                    name="computerTrack"
                    label="Computer Track"
                    required
                    touched={touched}
                    errors={errors}
                  >
                    <select {...selectProps("computerTrack")}>
                      <option value="">Select a track…</option>
                      {COMPUTER_TRACKS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <Field
                  name="hardSkill"
                  label="Hard Skill"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <select {...selectProps("hardSkill")}>
                    <option value="">Select a hard skill…</option>
                    {HARD_SKILLS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.emoji} {s.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  name="softSkill"
                  label="Soft Skill"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <select {...selectProps("softSkill")}>
                    <option value="">Select a soft skill…</option>
                    {SOFT_SKILLS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.emoji} {s.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="form-row">
                  <Field
                    name="shirtSize"
                    label="T-Shirt Size"
                    touched={touched}
                    errors={errors}
                  >
                    <select {...selectProps("shirtSize")}>
                      <option value="">Select size…</option>
                      <option>XS (2–4 yrs)</option>
                      <option>S (5–6 yrs)</option>
                      <option>M (7–8 yrs)</option>
                      <option>L (9–11 yrs)</option>
                      <option>XL (12–14 yrs)</option>
                      <option>XXL (15–17 yrs)</option>
                    </select>
                  </Field>
                </div>

                <Field
                  name="allergies"
                  label="Known Allergies"
                  hint="Enter 'None' if none known"
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="text"
                    {...inputProps("allergies")}
                    placeholder="e.g. Peanuts, Penicillin, None"
                  />
                </Field>

                <Field
                  name="medicalNotes"
                  label="Medical / Special Notes"
                  hint="Any conditions, medications, or special needs staff should know about"
                  touched={touched}
                  errors={errors}
                >
                  <textarea
                    {...inputProps("medicalNotes")}
                    className="form-textarea"
                    placeholder="e.g. Uses an inhaler for asthma."
                    rows={3}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 1 — Parent info ── */}
            {step === 1 && (
              <div className="form-step">
                <h2 className="form-step__title">
                  👨‍👩‍👧 Parent / Guardian Information
                </h2>

                <PhotoUpload
                  label="Parent / Guardian Photo"
                  hint="This photo will be used for the membership card."
                  value={formData.parentPhoto}
                  onChange={(photo) =>
                    setFormData((d) => ({ ...d, parentPhoto: photo }))
                  }
                  error={touched.parentPhoto && errors.parentPhoto}
                  required
                />

                <div className="form-row">
                  <Field
                    name="parentFirstName"
                    label="First Name"
                    required
                    touched={touched}
                    errors={errors}
                  >
                    <input
                      type="text"
                      {...inputProps("parentFirstName")}
                      placeholder="Your first name"
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field
                    name="parentLastName"
                    label="Last Name"
                    required
                    touched={touched}
                    errors={errors}
                  >
                    <input
                      type="text"
                      {...inputProps("parentLastName")}
                      placeholder="Your last name"
                      autoComplete="family-name"
                    />
                  </Field>
                </div>

                <Field
                  name="relationship"
                  label="Relationship to Child"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <select {...selectProps("relationship")}>
                    <option value="">Select…</option>
                    <option>Mother</option>
                    <option>Father</option>
                    <option>Guardian</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field
                  name="parentEmail"
                  label="Email Address"
                  required
                  hint="Confirmation and QR code will be sent here"
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="email"
                    {...inputProps("parentEmail")}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>

                <Field
                  name="parentPhone"
                  label="Phone Number"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="tel"
                    {...inputProps("parentPhone")}
                    placeholder="077XXXXXX/088XXXXXX"
                    autoComplete="tel"
                  />
                </Field>

                <Field
                  name="whatsappNumber"
                  label="WhatsApp Number"
                  required
                  hint="This will be used to send Check-In notifications"
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="tel"
                    {...inputProps("whatsappNumber")}
                    placeholder="231XXXXXXXX"
                    autoComplete="tel"
                  />
                </Field>

                <Field
                  name="parentAddress"
                  label="Home Address"
                  hint="Optional — for mailing purposes"
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="text"
                    {...inputProps("parentAddress")}
                    placeholder="12 Street, City, County"
                    autoComplete="street-address"
                  />
                </Field>

                <hr className="divider" />

                <Field
                  name="pastParticipant"
                  label="Were you ever a participant of our vacation program in the past?"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <select {...selectProps("pastParticipant")}>
                    <option value="">Select…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>

                {formData.pastParticipant === "Yes" && (
                  <Field
                    name="pastParticipantYears"
                    label="Which year(s)?"
                    touched={touched}
                    errors={errors}
                    hint="e.g. 2022, 2023"
                  >
                    <input
                      type="text"
                      {...inputProps("pastParticipantYears")}
                      placeholder="e.g. 2022, 2023"
                    />
                  </Field>
                )}

                <Field
                  name="willingToVolunteer"
                  label="Are you willing to volunteer during the program?"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <select {...selectProps("willingToVolunteer")}>
                    <option value="">Select…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>

                {formData.willingToVolunteer === "Yes" && (
                  <Field
                    name="volunteerHow"
                    label="How would you like to volunteer?"
                    touched={touched}
                    errors={errors}
                    hint="e.g. Coaching, Registration desk, First aid"
                  >
                    <textarea
                      {...inputProps("volunteerHow")}
                      className="form-textarea"
                      placeholder="Describe how you would like to help…"
                      rows={3}
                    />
                  </Field>
                )}
              </div>
            )}

            {/* ── Step 2 — Emergency contact ── */}
            {step === 2 && (
              <div className="form-step">
                <h2 className="form-step__title">🚨 Emergency Contact</h2>
                <p className="form-step__desc">
                  Please provide someone we can contact if we cannot reach you
                  during the program. This person must be different from the
                  registering parent/guardian.
                </p>

                <Field
                  name="emergencyName"
                  label="Full Name"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="text"
                    {...inputProps("emergencyName")}
                    placeholder="e.g. Sarah Johnson"
                  />
                </Field>

                <Field
                  name="emergencyPhone"
                  label="Phone Number"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="tel"
                    {...inputProps("emergencyPhone")}
                    placeholder="077XXXXXX/088XXXXXX"
                  />
                </Field>

                <Field
                  name="emergencyRelation"
                  label="Relationship to Child"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <input
                    type="text"
                    {...inputProps("emergencyRelation")}
                    placeholder="e.g. Aunt, Grandparent, Family Friend"
                  />
                </Field>
              </div>
            )}

            {/* ── Step 3 — Agreements ── */}
            {step === 3 && (
              <div className="form-step">
                <h2 className="form-step__title">✅ Consents & Agreements</h2>

                <Field
                  name="photoConsent"
                  label="Photo & Video Consent"
                  required
                  touched={touched}
                  errors={errors}
                >
                  <select {...selectProps("photoConsent")}>
                    <option value="">Select…</option>
                    <option value="Yes">
                      Yes — I consent to photos/videos for program use
                    </option>
                    <option value="No">
                      No — I do not consent to photos/videos
                    </option>
                    <option value="Social media OK">
                      Yes — including social media posting
                    </option>
                  </select>
                </Field>

                <Field
                  name="howDidYouHear"
                  label="How did you hear about us?"
                  hint="Optional"
                  touched={touched}
                  errors={errors}
                >
                  <select {...selectProps("howDidYouHear")}>
                    <option value="">Select…</option>
                    <option>Friend or Family</option>
                    <option>Social Media</option>
                    <option>Flyer / Poster</option>
                    <option>School</option>
                    <option>Church / Community Group</option>
                    <option>Previous participant</option>
                    <option>Other</option>
                  </select>
                </Field>

                <hr className="divider" />

                <div
                  className={`consent-check ${touched.medicalConsent && errors.medicalConsent ? "error" : ""}`}
                >
                  <label className="consent-check__label">
                    <input
                      type="checkbox"
                      name="medicalConsent"
                      checked={formData.medicalConsent}
                      onChange={handleChange}
                      onBlur={() => handleBlur("medicalConsent")}
                    />
                    <span>
                      <strong>Medical Consent</strong> — I authorize the program
                      staff to seek emergency medical treatment for my child if
                      I cannot be reached. I confirm that all medical
                      information provided is accurate and complete.{" "}
                      <span className="required">*</span>
                    </span>
                  </label>
                  {touched.medicalConsent && errors.medicalConsent && (
                    <span className="form-error">{errors.medicalConsent}</span>
                  )}
                </div>

                <div
                  className={`consent-check ${touched.termsAccepted && errors.termsAccepted ? "error" : ""}`}
                >
                  <label className="consent-check__label">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      onBlur={() => handleBlur("termsAccepted")}
                    />
                    <span>
                      <strong>Terms & Conditions</strong> — I agree that my
                      child will participate in sports activities at their own
                      risk, subject to standard safety protocols. Refunds are
                      available up to 14 days before program start. I have read
                      and agree to all program rules and codes of conduct.{" "}
                      <span className="required">*</span>
                    </span>
                  </label>
                  {touched.termsAccepted && errors.termsAccepted && (
                    <span className="form-error">{errors.termsAccepted}</span>
                  )}
                </div>

                {submitError && (
                  <div className="alert alert--error" role="alert">
                    <span>⚠️</span>
                    <div>
                      <strong>Registration failed</strong>
                      <p>{submitError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="register__nav">
              {step > 0 && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={prevStep}
                  disabled={submitting}
                >
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={nextStep}
                >
                  Next: {STEPS[step + 1].title} →
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn--primary btn--lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner spinner--sm" /> Submitting…
                    </>
                  ) : (
                    "🎉 Complete Registration"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="register__login-hint">
          Already registered?{" "}
          <Link to="/dashboard">Check your registration status →</Link>
        </p>
      </div>
    </div>
  );
}

// ── Field component — defined outside Register to prevent focus loss ───────

function Field({
  name,
  label,
  required: req,
  children,
  hint,
  touched,
  errors,
}) {
  const showError = touched[name] && errors[name];
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}{" "}
        {req && (
          <span className="required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !showError && <span className="form-hint">{hint}</span>}
      {showError && (
        <span className="form-error" role="alert">
          {errors[name]}
        </span>
      )}
    </div>
  );
}

// ── Helper: which fields belong to each step ──────────────────────────────

function getStepFields(stepIndex) {
  const steps = [
    [
      "childFirstName",
      "childLastName",
      "dateOfBirth",
      "gender",
      "program",
      "hardSkill",
      "softSkill",
      "childPhoto",
    ],
    [
      "parentFirstName",
      "parentLastName",
      "relationship",
      "parentEmail",
      "parentPhone",
      "whatsappNumber",
      "pastParticipant",
      "willingToVolunteer",
      "parentPhoto",
    ],
    ["emergencyName", "emergencyPhone", "emergencyRelation"],
    ["medicalConsent", "photoConsent", "termsAccepted"],
  ];
  return steps[stepIndex] || [];
}
