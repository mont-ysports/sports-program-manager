/**
 * helpers.js — Shared utility functions
 */

/**
 * Format a date string to a human-friendly display format.
 * @param {string} dateStr — ISO or spreadsheet date string
 * @returns {string} e.g. "June 15, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a timestamp to date + time.
 * @param {string} ts
 * @returns {string} e.g. "June 15, 2026 at 9:30 AM"
 */
export function formatDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Calculate age from a date-of-birth string.
 * @param {string} dobStr
 * @returns {number}
 */
export function calculateAge(dobStr) {
  if (!dobStr) return 0;
  const today = new Date();
  const dob = new Date(dobStr);
  const age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  return beforeBirthday ? age - 1 : age;
}

/**
 * Capitalize the first letter of each word.
 */
export function titleCase(str) {
  if (!str) return "";
  return str.replace(
    /\w\S*/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

/**
 * Mask an email address for privacy display.
 * e.g. "parent@example.com" → "p*****t@example.com"
 */
export function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

/**
 * Return a colour variable name for a program badge.
 */
export const PROGRAM_COLORS = {
  Basketball: { bg: "#FFF3E0", text: "#E65100" },
  Computer: { bg: "#E3F2FD", text: "#0D47A1" },
  Music: { bg: "#F3E5F5", text: "#4A148C" },
};

export function getProgramColor(program) {
  return PROGRAM_COLORS[program] || { bg: "#F5F5F5", text: "#424242" };
}

/**
 * Copy text to clipboard with fallback.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

/**
 * Debounce a function.
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * List of programs offered.
 */
export const PROGRAMS = [
  {
    value: "Basketball",
    label: "Basketball",
    emoji: "🏀",
    ages: "4–19",
    spots: 300,
    price: 75,
  },
  {
    value: "Computer",
    label: "Computer",
    emoji: "💻",
    ages: "4–19",
    spots: 150,
    price: 65,
  },
  {
    value: "Music",
    label: "Music",
    emoji: "🎵",
    ages: "4–19",
    spots: 25,
    price: 65,
  },
];

/**
 * Calculate total cost for an array of selected program values.
 * @param {string[]} selectedPrograms
 * @returns {number} total in USD
 */
export function calculateTotalCost(selectedPrograms) {
  if (!Array.isArray(selectedPrograms) || selectedPrograms.length === 0)
    return 0;
  return selectedPrograms.reduce((total, val) => {
    const prog = PROGRAMS.find((p) => p.value === val);
    return total + (prog ? prog.price : 0);
  }, 0);
}

/**
 * Sub-tracks for the Computer program.
 */
export const COMPUTER_TRACKS = [
  {
    value: "Introduction to Computer",
    label: "Introduction to Computer",
  },
  {
    value: "Creative Design & Digital Arts",
    label: "Creative Design & Digital Arts (Graphic Design & Photo Editing)",
  },
  {
    value: "Coding & Game Development",
    label: "Coding & Game Development (Intro to HTML, Visual Block Coding)",
  },
  {
    value: "Data, Analytics & Practical Tech",
    label:
      "Data, Analytics & Practical Tech (Advanced Spreadsheet, Chart, Digital Presentation, Infographics)",
  },
  {
    value: "Future Tech & Automation",
    label:
      "Future Tech & Automation (Intro to AI, Prompt Engineering, Cyber Safety Basics)",
  },
];

/**
 * Payment amount from env (or default).
 */
// Payment amount is now calculated dynamically per selected programs — see calculateTotalCost()

/**
 * Truncate a string to a given length with ellipsis.
 */
export function truncate(str, len = 40) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len - 1) + "…" : str;
}

/**
 * Hard Skills options.
 */
export const HARD_SKILLS = [
  { value: "Baking", label: "Baking", emoji: "🍞" },
  { value: "Tailoring", label: "Tailoring", emoji: "🧵" },
  { value: "Cosmetology", label: "Cosmetology", emoji: "💄" },
  { value: "Beads Craft", label: "Beads Craft", emoji: "📿" },
  { value: "Creative Art", label: "Creative Art", emoji: "🎨" },
];
/**
 * Soft Skills options.
 */
export const SOFT_SKILLS = [
  { value: "Customer Service", label: "Customer Service", emoji: "🤝" },
  { value: "Entrepreneurship", label: "Entrepreneurship", emoji: "💼" },
  { value: "Civic Education", label: "Civic Education", emoji: "🏛️" },
  { value: "Peace Building", label: "Peace Building", emoji: "☮️" },
  { value: "Advocacy", label: "Advocacy", emoji: "📢" },
];
