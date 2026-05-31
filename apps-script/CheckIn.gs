/**
 * CheckIn.gs — Check-in and payment status handlers
 *
 * Depends on helpers in Code.gs.
 */

// ── Handler: Check in a participant ───────────────────────────────────────

function handleCheckIn(data) {
  var registrationId = (data.registrationId || "").trim().toUpperCase();
  var staffPin = (data.staffPin || "").trim();

  // 1. Validate inputs
  if (!registrationId) return _errorResponse("registrationId is required.");

  // 2. Verify check-in PIN
  var expectedPin = _getConfig(CHECKIN_PIN_CONFIG_KEY) || "1822";
  if (staffPin !== expectedPin) {
    return _errorResponse("Invalid check-in PIN.");
  }

  // 3. Look up registration
  var sheet = _getSheet(SHEET_REGISTRATIONS);
  var found = _findRow(SHEET_REGISTRATIONS, "registrationId", registrationId);
  if (!found) {
    return _errorResponse("Registration not found: " + registrationId, 404);
  }

  var reg = found.rowData;

  // 4. Check if already checked in
  if (reg.checkInTime && String(reg.checkInTime).trim() !== "") {
    return _successResponse({
      alreadyCheckedIn: true,
      registrationId: registrationId,
      childFirstName: reg.childFirstName,
      childLastName: reg.childLastName,
      program: reg.program,
      checkInTime: reg.checkInTime,
      message:
        reg.childFirstName + " was already checked in at " + reg.checkInTime,
    });
  }

  // 5. Write check-in timestamp
  var checkInTime = new Date().toISOString();
  var checkInColIdx = _colIndex(sheet, "checkInTime");
  sheet.getRange(found.rowIndex, checkInColIdx).setValue(checkInTime);

  // 6. Write audit log entry
  try {
    _logCheckIn(registrationId, reg, checkInTime);
  } catch (logErr) {
    console.error("CheckIn log failed:", logErr.message);
  }

  return _successResponse({
    alreadyCheckedIn: false,
    registrationId: registrationId,
    childFirstName: reg.childFirstName,
    childLastName: reg.childLastName,
    program: reg.program,
    checkInTime: checkInTime,
    paymentStatus: reg.paymentStatus,
  });
}

// ── Handler: Update payment status ────────────────────────────────────────

function handleUpdatePaymentStatus(data) {
  var registrationId = (data.registrationId || "").trim().toUpperCase();
  var status = (data.status || "").trim();

  if (!registrationId) return _errorResponse("registrationId is required.");

  var validStatuses = ["Pending", "Paid", "Waived", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return _errorResponse(
      "Invalid status. Must be one of: " + validStatuses.join(", "),
    );
  }

  var sheet = _getSheet(SHEET_REGISTRATIONS);
  var found = _findRow(SHEET_REGISTRATIONS, "registrationId", registrationId);
  if (!found) {
    return _errorResponse("Registration not found: " + registrationId, 404);
  }

  var paymentColIdx = _colIndex(sheet, "paymentStatus");
  sheet.getRange(found.rowIndex, paymentColIdx).setValue(status);

  // If paid, send a payment confirmation email (non-blocking)
  if (status === "Paid") {
    try {
      _sendPaymentConfirmationEmail(found.rowData, registrationId);
    } catch (e) {
      console.error("Payment email failed:", e.message);
    }
  }

  return _successResponse({
    registrationId: registrationId,
    paymentStatus: status,
    updated: true,
  });
}

// ── Audit log helper ──────────────────────────────────────────────────────

function _logCheckIn(registrationId, reg, checkInTime) {
  var sheet = _getSheet(SHEET_CHECKINS);

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "timestamp",
      "registrationId",
      "childName",
      "program",
      "parentPhone",
      "paymentStatus",
      "checkInTime",
    ]);
  }

  sheet.appendRow([
    new Date().toISOString(),
    registrationId,
    reg.childFirstName + " " + reg.childLastName,
    reg.program,
    reg.parentPhone,
    reg.paymentStatus || "Pending",
    checkInTime,
  ]);
}

// ── Payment confirmation email ─────────────────────────────────────────────

function _sendPaymentConfirmationEmail(reg, registrationId) {
  if (!reg.parentEmail) return;

  var appUrl = _getConfig("APP_URL") || "https://your-app.onrender.com";

  var subject =
    "✅ Payment Confirmed — " + reg.childFirstName + " | " + registrationId;
  var body = [
    "Dear " + reg.parentFirstName + ",",
    "",
    "Your payment has been confirmed! " +
      reg.childFirstName +
      " is fully registered for the 2026 Children Vacation Sports Program.",
    "",
    "── Confirmed Registration ──",
    "Registration ID : " + registrationId,
    "Child           : " + reg.childFirstName + " " + reg.childLastName,
    "Program         : " + reg.program,
    "Payment Status  : ✅ Paid",
    "",
    "Don't forget to bring your QR code on the program start date!",
    "Download it at: " + appUrl + "/dashboard",
    "",
    "See you on the field!",
    "The 2026 Sports Program Team",
  ].join("\n");

  MailApp.sendEmail({ to: reg.parentEmail, subject: subject, body: body });
}
