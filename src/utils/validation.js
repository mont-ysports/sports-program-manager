/**
 * validation.js — Client-side form validation rules
 *
 * Mirror these rules in the Apps Script server-side validator
 * for defense-in-depth.
 */

// ── Field validators ───────────────────────────────────────────────────────

export const required = (value) => {
  if (value === null || value === undefined) return "This field is required.";
  if (typeof value === "string" && value.trim() === "")
    return "This field is required.";
  return null;
};

export const minLength = (min) => (value) => {
  if (!value) return null; // let required() handle blank
  if (value.trim().length < min) return `Must be at least ${min} characters.`;
  return null;
};

export const maxLength = (max) => (value) => {
  if (!value) return null;
  if (value.trim().length > max) return `Cannot exceed ${max} characters.`;
  return null;
};

export const isEmail = (value) => {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? null : "Please enter a valid email address.";
};

export const isPhone = (value) => {
  if (!value) return null;
  const cleaned = value.replace(/[\s\-().+]/g, "");
  if (!/^\d{7,15}$/.test(cleaned)) return "Please enter a valid phone number.";
  return null;
};

export const startsWithPrefix = (prefix) => (value) => {
  if (!value) return null;
  const cleaned = value.replace(/[\s\-().+]/g, "");
  if (!cleaned.startsWith(prefix)) {
    return "Number must start with " + prefix + " (Liberian country code).";
  }
  return null;
};

export const isDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Please enter a valid date.";
  return null;
};

export const isAgeInRange = (minAge, maxAge) => (value) => {
  if (!value) return null;
  const today = new Date();
  const birth = new Date(value);
  const age =
    today.getFullYear() -
    birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
      ? 1
      : 0);
  if (age < minAge || age > maxAge) {
    return `Child must be between ${minAge} and ${maxAge} years old to register.`;
  }
  return null;
};

export const oneOf = (options) => (value) => {
  if (!value) return null;
  return options.includes(value)
    ? null
    : `Must be one of: ${options.join(", ")}.`;
};

// ── Compose validators ─────────────────────────────────────────────────────

/**
 * Run multiple validators on a single field value.
 * Returns the first error found, or null.
 */
export function validate(value, validators = []) {
  for (const fn of validators) {
    const error = fn(value);
    if (error) return error;
  }
  return null;
}

// ── Full registration form schema ──────────────────────────────────────────

/**
 * Validate the entire registration form object.
 * @param {Object} data — form field values
 * @returns {Object} { isValid: boolean, errors: { [field]: string } }
 */
export function validateRegistrationForm(data) {
  const errors = {};

  const checks = {
    // Child info
    childFirstName: [required, minLength(2), maxLength(50)],
    childLastName: [required, minLength(2), maxLength(50)],
    dateOfBirth: [required, isDate, isAgeInRange(4, 19)],
    gender: [
      required,
      oneOf(["Male", "Female", "Non-binary", "Prefer not to say"]),
    ],
    program: [
      (v) =>
        !Array.isArray(v) || v.length === 0
          ? "Please select at least one program."
          : null,
    ],
    childPhoto: [
      (v) => (!v ? "Please upload or take a photo of the child." : null),
    ],
    hardSkill: [required],
    softSkill: [required],

    // Parent / guardian
    parentFirstName: [required, minLength(2), maxLength(50)],
    parentLastName: [required, minLength(2), maxLength(50)],
    parentEmail: [required, isEmail],
    parentPhone: [required, isPhone],
    whatsappNumber: [required, isPhone, startsWithPrefix("231")],
    relationship: [required, oneOf(["Mother", "Father", "Guardian", "Other"])],
    parentPhoto: [
      (v) =>
        !v ? "Please upload or take a photo of the parent/guardian." : null,
    ],
    pastParticipant: [required, oneOf(["Yes", "No"])],
    willingToVolunteer: [required, oneOf(["Yes", "No"])],

    // Emergency contact
    emergencyName: [required, minLength(2), maxLength(100)],
    emergencyPhone: [required, isPhone],
    emergencyRelation: [required, minLength(2), maxLength(50)],

    // Agreements
    medicalConsent: [
      (v) => (v !== true ? "You must provide medical consent." : null),
    ],
    photoConsent: [required],
    termsAccepted: [
      (v) => (v !== true ? "You must accept the terms and conditions." : null),
    ],
  };

  Object.entries(checks).forEach(([field, validators]) => {
    const error = validate(data[field], validators);
    if (error) errors[field] = error;
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
