# 🏅 2026 Children Vacation Sports Program

### Registration & Management Platform

A production-ready, full-stack sports camp registration system.  
**Frontend:** React + Vite (hosted on Render)  
**Backend / Database:** Google Sheets + Google Apps Script Web App

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Prerequisites](#3-prerequisites)
4. [Step 1 — Create & Configure the Google Sheet](#4-step-1--create--configure-the-google-sheet)
5. [Step 2 — Set Up Google Apps Script](#5-step-2--set-up-google-apps-script)
6. [Step 3 — Deploy the Apps Script Web App](#6-step-3--deploy-the-apps-script-web-app)
7. [Step 4 — Run the Frontend Locally](#7-step-4--run-the-frontend-locally)
8. [Step 5 — Deploy to Render](#8-step-5--deploy-to-render)
9. [Step 6 — Post-Deployment Configuration](#9-step-6--post-deployment-configuration)
10. [Feature Reference](#10-feature-reference)
11. [Staff Portal Usage](#11-staff-portal-usage)
12. [Check-In Station Usage](#12-check-in-station-usage)
13. [Customization Guide](#13-customization-guide)
14. [Troubleshooting](#14-troubleshooting)
15. [Security Notes](#15-security-notes)

---

## 1. Architecture Overview

```
Parent/Child Browser
        │
        ▼
  React Frontend          ← Hosted on Render (free tier)
  (Vite, React Router)
        │
        │  HTTPS fetch (GET/POST)
        ▼
Google Apps Script        ← Serverless API layer
   Web App (doGet/doPost)
        │
        │  Sheets API (server-side)
        ▼
    Google Sheets         ← Database + admin spreadsheet
  (Registrations, CheckIns, Config tabs)
```

**Data flow — Registration:**

1. Parent fills the multi-step form → client-side validation
2. React calls Apps Script Web App via POST
3. Apps Script validates server-side, writes row to Sheets, sends confirmation email
4. Apps Script returns `registrationId` to frontend
5. Frontend generates QR code client-side from the ID and shows the confirmation page

**Data flow — Check-in:**

1. Staff opens `/checkin`, enters PIN
2. Parent scans QR code (or staff types ID manually) → URL auto-populates the field
3. Frontend calls Apps Script `checkIn` action
4. Apps Script writes `checkInTime` to the Sheets row and logs to CheckIns tab
5. Staff sees green success screen

---

## 2. Project Structure

```
sports-program/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Navbar + footer shell
│   │   └── Layout.css
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── Register.jsx        # Multi-step registration form
│   │   ├── Confirmation.jsx    # Post-registration + QR code
│   │   ├── ParentDashboard.jsx # Parent registration lookup
│   │   ├── CheckIn.jsx         # Staff QR scan / check-in
│   │   ├── StaffLogin.jsx      # Staff auth
│   │   ├── StaffPortal.jsx     # Staff management portal
│   │   └── NotFound.jsx
│   ├── hooks/
│   │   └── useStaffAuth.jsx    # Auth context + PIN helpers
│   ├── utils/
│   │   ├── api.js              # All Apps Script API calls
│   │   ├── validation.js       # Form validation rules
│   │   ├── qrcode.js           # QR generation + print/download
│   │   └── helpers.js          # Dates, colors, constants
│   ├── styles/
│   │   └── global.css          # Design system + utilities
│   ├── App.jsx                 # Router + layout
│   └── main.jsx                # Entry point
├── apps-script/
│   ├── Code.gs                 # Web App entry + CORS + dispatch
│   ├── Registration.gs         # CRUD handlers for registrations
│   ├── CheckIn.gs              # Check-in + payment handlers
│   ├── Setup.gs                # One-time sheet setup utility
│   └── appsscript.json         # Apps Script manifest
├── .env.example                # Environment variable template
├── render.yaml                 # Render.com deployment config
├── vite.config.js
├── package.json
└── README.md                   ← You are here
```

---

## 3. Prerequisites

Before starting, make sure you have:

- [ ] A **Google account** (to create the Sheet and Apps Script)
- [ ] **Node.js 18+** installed locally ([nodejs.org](https://nodejs.org))
- [ ] **npm** (comes with Node)
- [ ] A **GitHub account** (to connect to Render)
- [ ] A **Render account** ([render.com](https://render.com) — free tier is sufficient)
- [ ] A code editor (VS Code recommended)

---

## 4. Step 1 — Create & Configure the Google Sheet

### 1.1 Create a new Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and click **+ Blank**
2. Name it: `2026 Sports Program — Registrations`
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_THE_SPREADSHEET_ID/edit
   ```
   Save this ID — you'll need it in Step 2.

### 1.2 Run the automated sheet setup (via Apps Script)

The `Setup.gs` script will create all tabs with correct headers and formatting automatically. Follow Step 2 first, then come back to run `setupSheets()`.

### 1.3 Sheet tabs that will be created

| Tab Name        | Purpose                                      |
| --------------- | -------------------------------------------- |
| `Registrations` | One row per registration — the main database |
| `CheckIns`      | Audit log of every check-in scan             |
| `Config`        | Key/value settings (PIN, payment info, etc.) |

---

## 5. Step 2 — Set Up Google Apps Script

### 2.1 Open Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. The Apps Script editor opens — you'll see a default `Code.gs` file

### 2.2 Add all script files

You need to create **4 files** in the Apps Script editor. For each:

- Click the **+** button next to "Files"
- Select **Script**
- Name it exactly as shown, then paste the full contents

| File name         | Source file                   |
| ----------------- | ----------------------------- |
| `Code.gs`         | `apps-script/Code.gs`         |
| `Registration.gs` | `apps-script/Registration.gs` |
| `CheckIn.gs`      | `apps-script/CheckIn.gs`      |
| `Setup.gs`        | `apps-script/Setup.gs`        |

> **Tip:** Replace the default empty `Code.gs` with the contents of `apps-script/Code.gs`.

### 2.3 Configure the Spreadsheet ID (optional)

In `Code.gs`, find line:

```javascript
var SPREADSHEET_ID = "";
```

If the script is **bound to the same spreadsheet** (you opened Apps Script from within the Sheet), leave this blank — the script uses `getActiveSpreadsheet()` automatically.

If you want to connect to a **different spreadsheet**, paste its ID here:

```javascript
var SPREADSHEET_ID = "your_spreadsheet_id_here";
```

### 2.4 Run the one-time sheet setup

1. In the Apps Script editor, select `setupSheets` from the function dropdown (top toolbar)
2. Click **▶ Run**
3. You'll be asked to **grant permissions** — click "Review permissions", choose your account, then "Allow"
4. A dialog will confirm: _"✅ Setup complete!"_
5. Return to your Google Sheet — you'll now see 3 tabs: `Registrations`, `CheckIns`, `Config`

### 2.5 Update the Config tab

In the `Config` tab of your spreadsheet, update these values:

| Key                    | Value to set                                               |
| ---------------------- | ---------------------------------------------------------- |
| `CHECKIN_PIN`          | A 4–8 digit PIN for the check-in station (default: `1234`) |
| `PAYMENT_AMOUNT`       | Registration fee in USD (default: `75`)                    |
| `PAYMENT_INSTRUCTIONS` | Your bank transfer details (full text shown to parents)    |
| `APP_URL`              | Your Render URL (fill this in after Step 5)                |
| `PROGRAM_EMAIL`        | Your contact email address                                 |

---

## 6. Step 3 — Deploy the Apps Script Web App

### 3.1 Deploy

1. In the Apps Script editor, click **Deploy → New deployment**
2. Click the ⚙️ gear icon next to "Select type" → choose **Web app**
3. Fill in:
   - **Description:** `v1.0 — Initial deployment`
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone` (required for the frontend to call it — no auth header needed)
4. Click **Deploy**
5. Click **Authorize access** → grant permissions when prompted

### 3.2 Copy the Web App URL

After deploying, you'll see a URL like:

```
https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXX/exec
```

**Copy this URL** — this is your `VITE_APPS_SCRIPT_URL`. You'll need it in the next step.

> ⚠️ **Important:** Every time you edit the script and want changes to go live, you must create a **new deployment** (Deploy → New deployment). Editing and saving the script does **not** update the live Web App URL automatically. Use "Manage deployments" to create a new version.

### 3.3 Test the endpoint

Paste the URL into your browser with `?action=getStats` appended:

```
https://script.google.com/macros/s/YOUR_ID/exec?action=getStats
```

You should see a JSON response like:

```json
{
  "status": "ok",
  "total": 0,
  "paid": 0,
  "pending": 0,
  "checkedIn": 0,
  "byProgram": {}
}
```

If you see this, the API is working correctly.

---

## 7. Step 4 — Run the Frontend Locally

### 7.1 Install dependencies

```bash
cd sports-program
npm install
```

### 7.2 Create your environment file

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
# Required
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Staff portal password (default dev password is "staff2026")
# For production, generate a SHA-256 hash — see Security Notes section
VITE_STAFF_PASSWORD_HASH=

# Check-in PIN (must match what's in your Config sheet)
VITE_CHECKIN_PIN=1822

# Program branding
VITE_PROGRAM_NAME=2026 Children Vacation Sports Program
VITE_PROGRAM_CONTACT_EMAIL=sports@yourorg.com
VITE_PROGRAM_CONTACT_PHONE=+231 777 592214
VITE_PAYMENT_INSTRUCTIONS=Make payment via bank transfer to Account: 1234567890. Use your Registration ID as reference.
VITE_PAYMENT_AMOUNT_USD=75
```

### 7.3 Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7.4 Test the full flow locally

1. **Registration:** Go to `/register`, fill the 4-step form, submit
2. **Confirmation:** You're redirected to `/confirmation/SP-2026-XXXX` — check your QR code loads
3. **Parent Dashboard:** Go to `/dashboard`, enter your Registration ID or email
4. **Staff Login:** Go to `/staff/login`, password: `staff2026` (dev default)
5. **Staff Portal:** View registrations, update payment status
6. **Check-In:** Go to `/checkin`, PIN: `1234`, enter a registration ID, click "Confirm Check-In"

---

## 8. Step 5 — Deploy to Render

### 8.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — 2026 Sports Program"
git remote add origin https://github.com/YOUR_USERNAME/sports-program-2026.git
git push -u origin main
```

### 8.2 Create a Render static site

1. Log in to [render.com](https://render.com)
2. Click **New → Static Site**
3. Connect your GitHub account and select the `sports-program-2026` repository
4. Render will auto-detect the `render.yaml` — confirm the settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Click **Create Static Site**

### 8.3 Set environment variables in Render

In your Render service dashboard → **Environment**:

| Key                          | Value                                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| `VITE_APPS_SCRIPT_URL`       | Your Apps Script Web App URL from Step 3.2                            |
| `VITE_STAFF_PASSWORD_HASH`   | Your SHA-256 hash (see Security Notes) or leave blank for dev default |
| `VITE_CHECKIN_PIN`           | Your check-in PIN (must match Config sheet)                           |
| `VITE_PROGRAM_NAME`          | `2026 Children Vacation Sports Program`                               |
| `VITE_PROGRAM_CONTACT_EMAIL` | Your contact email                                                    |
| `VITE_PROGRAM_CONTACT_PHONE` | Your contact phone                                                    |
| `VITE_PAYMENT_INSTRUCTIONS`  | Full payment instructions text                                        |
| `VITE_PAYMENT_AMOUNT_USD`    | `75`                                                                  |

Click **Save Changes** — Render will automatically redeploy.

### 8.4 Verify the deployment

1. Wait 2–3 minutes for the build to complete
2. Visit your Render URL (e.g. `https://sports-program-2026.onrender.com`)
3. Test the full registration flow end-to-end
4. Check your Google Sheet — a new row should appear in `Registrations`

---

## 9. Step 6 — Post-Deployment Configuration

### 9.1 Update APP_URL in the Config sheet

Go to your Google Sheet → `Config` tab → update `APP_URL` with your Render URL:

```
https://sports-program-2026.onrender.com
```

This is used in confirmation emails so parents receive the correct dashboard link.

### 9.2 Redeploy the Apps Script if needed

If you made any changes to the `.gs` files after initial setup:

1. Apps Script editor → **Deploy → Manage deployments**
2. Click **Edit** (pencil icon) on your deployment
3. Change **Version** to **New version**
4. Click **Deploy**

### 9.3 Share check-in access with staff

- Give staff the URL: `https://your-app.onrender.com/checkin`
- Provide them the check-in PIN (set in Config sheet)
- For the Staff Portal, share: `https://your-app.onrender.com/staff/login`
- Provide the staff password you configured

---

## 10. Feature Reference

### Registration Form (`/register`)

- 4-step form with progress indicator
- Client-side validation on every field with live error display
- Server-side validation in Apps Script as a second layer
- Duplicate detection (same child + DOB + program)
- Automatic Registration ID generation (SP-2026-XXXX format)
- Confirmation email sent to parent on successful registration

### QR Code (`/confirmation/:id`)

- Generated client-side using the `qrcode` npm library
- Encodes the URL: `https://your-app.onrender.com/checkin?id=SP-2026-XXXX`
- Download as PNG or print directly from the browser
- Also accessible from the Parent Dashboard

### Parent Dashboard (`/dashboard`)

- Look up registration by ID **or** by parent email
- Shows payment status, check-in time, program details
- Toggle QR code display + download/print options
- No login required — accessible by anyone with the correct ID or email

### Check-In Station (`/checkin`)

- PIN-gated access (stored in Config sheet)
- Auto-populates Registration ID when a parent scans their QR code with a phone camera (opens URL with `?id=` param)
- Manual ID entry fallback
- Shows full participant details including allergies/medical notes
- Writes `checkInTime` to the Sheets row and logs to the CheckIns audit tab
- Handles already-checked-in participants gracefully

### Staff Portal (`/staff`)

- Password-protected login (session persists for 8 hours)
- **Overview tab:** Live stats (total, paid, pending, checked-in today) + per-program breakdown bar chart
- **All Registrations tab:** Searchable, filterable table of every registration with inline payment status updates
- **Program Roster tab:** Per-program participant list with check-in status, shirt size, and medical notes

---

## 11. Staff Portal Usage

### Logging in

- URL: `/staff/login`
- Default dev password: `staff2026`
- For production: see Security Notes for setting a proper password hash

### Updating payment status

In the **All Registrations** tab, find the participant row and use the dropdown in the **Actions** column to change their status to:

- `Pending` — awaiting payment
- `Paid` — payment received and confirmed
- `Waived` — fee waived (scholarship/staff child)
- `Cancelled` — registration cancelled

Clicking the dropdown immediately saves to Sheets and sends a payment confirmation email if status is set to `Paid`.

### Searching registrations

Use the search box to find by:

- Child's first or last name
- Registration ID
- Parent email
- Parent phone number

Combine with the Program and Status dropdowns for more specific filtering.

---

## 12. Check-In Station Usage

### Option A — QR Code scan (recommended)

1. Parent opens the Confirmation page or Parent Dashboard on their phone
2. Parent shows the QR code on screen to a staff member
3. Staff opens their phone camera and scans the QR code
4. The check-in page opens automatically with the ID pre-filled
5. Staff verifies the participant details and taps **Confirm Check-In**

### Option B — Manual ID entry

1. Parent provides their Registration ID (printed or from email)
2. Staff types the ID into the input box and clicks **Look Up**
3. Verify details, click **Confirm Check-In**

### Medical alerts

If a participant has allergies or medical notes, these appear highlighted in **red** on the check-in card so staff can act immediately.

---

## 13. Customization Guide

### Change the program list

Edit `src/utils/helpers.js` → the `PROGRAMS` array. Each entry:

```javascript
{ value: 'Football', label: 'Football', emoji: '⚽', ages: '6–17', spots: 30 }
```

The `value` field must match exactly what's stored in Google Sheets.

### Change the registration fee

1. Update `VITE_PAYMENT_AMOUNT_USD` in your `.env` and Render env vars
2. Update `PAYMENT_AMOUNT` in the Config sheet

### Update payment instructions

1. Edit the `PAYMENT_INSTRUCTIONS` value in your `.env` and Render env vars
2. Update `PAYMENT_INSTRUCTIONS` in the Config sheet (used in emails)

### Change colors / branding

Edit `src/styles/global.css` → the `:root` CSS variables at the top of the file.
Key variables:

```css
--clr-primary: #ff5722; /* Main orange */
--clr-secondary: #1565c0; /* Blue */
--clr-accent: #ffd600; /* Yellow */
```

### Change the program name

Update `VITE_PROGRAM_NAME` in `.env` and Render environment variables.

### Add a new sheet action

1. Add a new `case` in `doGet()` or `doPost()` in `Code.gs`
2. Write the handler function in `Registration.gs` or a new `.gs` file
3. Add a corresponding API call in `src/utils/api.js`

---

## 14. Troubleshooting

### "Apps Script URL not configured"

Your `.env` file is missing `VITE_APPS_SCRIPT_URL` or it still contains `YOUR_DEPLOYMENT_ID`. Follow Step 3.

### Registration submits but nothing appears in Sheets

1. Check the Apps Script execution logs: **Apps Script editor → Executions** (left sidebar)
2. Verify the Web App is deployed as **"Anyone"** access
3. Try the test URL in your browser: `your-script-url?action=getStats`

### CORS errors in browser console

Re-deploy the Apps Script Web App (Step 3.2). Apps Script handles CORS automatically on new deployments.

### QR code won't scan

- Make sure the QR code image is large enough (at least 150×150px on screen)
- Ensure the `APP_URL` in Config sheet matches your live Render URL exactly
- Try downloading the QR code and scanning the downloaded image

### "Sheet not found" error

Run `setupSheets()` from the Apps Script editor (Step 2.4).

### Staff portal shows "no data"

1. Check you're on the correct tab in the Staff Portal
2. Click **🔄 Refresh**
3. Verify your Apps Script URL is correct in environment variables
4. Check the Executions log in Apps Script for errors

### Emails not sending

- Apps Script must have `gmail.send` scope — re-run `setupSheets()` and grant all permissions
- Check the `parentEmail` field is valid and non-empty in the Sheets row
- Review the Executions log for email errors

### Build fails on Render

- Ensure `Node.js version` in Render settings is **18** or higher
- Check that all `VITE_*` environment variables are set in Render's environment panel
- The build command must be: `npm install && npm run build`

---

## 15. Security Notes

### Staff portal password

The default password `staff2026` is for **development only**. Before going live:

1. Choose a strong password
2. Generate its SHA-256 hash in your browser console:
   ```javascript
   const buf = await crypto.subtle.digest(
     "SHA-256",
     new TextEncoder().encode("YourNewPassword"),
   );
   console.log(
     [...new Uint8Array(buf)]
       .map((b) => b.toString(16).padStart(2, "0"))
       .join(""),
   );
   ```
3. Copy the 64-character hex string
4. Set it as `VITE_STAFF_PASSWORD_HASH` in Render's environment variables

### Check-in PIN

Change the default `1234` in the **Config sheet** before launching. This PIN gates the check-in station.

### Apps Script access

The Web App is deployed as `Anyone` (anonymous) so the frontend can call it without OAuth. This means **anyone with the URL can call your API**. This is acceptable for a sports camp because:

- All writes require valid data and pass server-side validation
- Reads return only non-sensitive participant data
- The staff password and check-in PIN provide additional access control on sensitive actions

For higher-security deployments, you could add an API key header check in `doGet`/`doPost`.

### Google Sheets data

The spreadsheet is only accessible to your Google account (and anyone you explicitly share it with). Staff accessing the portal see data through the Apps Script layer — they never get direct Sheets access.

### Environment variables

Never commit your `.env` file to version control. It is listed in `.gitignore`. All secrets are set via Render's environment panel.

---

## Quick Reference — URLs

| Page                      | URL                 |
| ------------------------- | ------------------- |
| Home                      | `/`                 |
| Register                  | `/register`         |
| Registration confirmation | `/confirmation/:id` |
| Parent dashboard          | `/dashboard`        |
| Check-in station          | `/checkin`          |
| Staff login               | `/staff/login`      |
| Staff portal              | `/staff`            |

---

## License

This project is provided for organizational use. Customize freely for your program.
