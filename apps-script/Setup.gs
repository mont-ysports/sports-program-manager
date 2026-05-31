/**
 * Setup.gs — One-time setup functions
 *
 * Run setupSheets() once from the Apps Script editor to create all required
 * sheet tabs with correct headers, formatting, and sample config values.
 *
 * HOW TO RUN:
 *   1. Open this project in the Apps Script editor
 *   2. Select "setupSheets" from the function dropdown
 *   3. Click ▶ Run
 *   4. Grant permissions when prompted
 */

function setupSheets() {
  var ss = _getSpreadsheet();
  Logger.log("Setting up sheets in: " + ss.getName());

  _setupRegistrationsSheet(ss);
  _setupCheckInsSheet(ss);
  _setupConfigSheet(ss);

  Logger.log("✅ Setup complete! All sheets are ready.");
  SpreadsheetApp.getUi().alert(
    "✅ Setup complete!\n\nAll required sheets have been created:\n• Registrations\n• CheckIns\n• Config\n\nYou can now deploy the Web App.",
  );
}

// ── Registrations sheet ───────────────────────────────────────────────────

function _setupRegistrationsSheet(ss) {
  var name = SHEET_REGISTRATIONS;
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

  // Clear and set headers
  sheet.clearContents();
  var headers = [
    "registrationId",
    "registrationTimestamp",
    "childFirstName",
    "childLastName",
    "dateOfBirth",
    "gender",
    "program",
    "computerTrack",
    "hardSkill",
    "softSkill",
    "shirtSize",
    "allergies",
    "medicalNotes",
    "parentFirstName",
    "parentLastName",
    "relationship",
    "parentEmail",
    "parentPhone",
    "whatsappNumber",
    "parentAddress",
    "pastParticipant",
    "pastParticipantYears",
    "willingToVolunteer",
    "volunteerHow",
    "emergencyName",
    "emergencyPhone",
    "emergencyRelation",
    "medicalConsent",
    "photoConsent",
    "termsAccepted",
    "howDidYouHear",
    "paymentStatus",
    "checkInTime",
    "childPhotoUrl",
    "parentPhotoUrl",
    "notes",
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Freeze header row
  sheet.setFrozenRows(1);

  // Style header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground("#FF5722")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10);

  // Set column widths for readability
  var widths = {
    1: 120, // registrationId
    2: 160, // registrationTimestamp
    3: 120, // childFirstName
    4: 120, // childLastName
    5: 110, // dateOfBirth
    6: 80, // gender
    7: 120, // program
    8: 280, // computerTrack
    9: 140, // hardSkill
    10: 160, // softSkill
    11: 90, // shirtSize
    12: 150, // allergies
    13: 200, // medicalNotes
    14: 120, // parentFirstName
    15: 120, // parentLastName
    16: 100, // relationship
    17: 180, // parentEmail
    18: 130, // parentPhone
    19: 200, // parentAddress
    20: 150, // emergencyName
    21: 130, // emergencyPhone
    22: 140, // emergencyRelation
    23: 100, // medicalConsent
    24: 120, // photoConsent
    25: 100, // termsAccepted
    26: 140, // howDidYouHear
    27: 120, // paymentStatus
    28: 160, // checkInTime
    29: 200, // notes
  };

  Object.keys(widths).forEach(function (col) {
    sheet.setColumnWidth(parseInt(col), widths[col]);
  });

  // Alternating row colors via banding
  try {
    var banding = sheet.getBandings();
    banding.forEach(function (b) {
      b.remove();
    });
    sheet
      .getRange("A2:AA1000")
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  } catch (e) {
    /* ignore if banding not supported */
  }

  // Data validation for paymentStatus column (col 25)
  var paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pending", "Paid", "Waived", "Cancelled"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 27, 998, 1).setDataValidation(paymentRule);

  Logger.log("  ✓ " + name + " sheet configured");
}

// ── CheckIns sheet ────────────────────────────────────────────────────────

function _setupCheckInsSheet(ss) {
  var name = SHEET_CHECKINS;
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

  sheet.clearContents();
  var headers = [
    "timestamp",
    "registrationId",
    "childName",
    "program",
    "parentPhone",
    "paymentStatus",
    "checkInTime",
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground("#1565C0")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10);

  [120, 140, 180, 120, 130, 120, 160].forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });

  Logger.log("  ✓ " + name + " sheet configured");
}

// ── Config sheet ──────────────────────────────────────────────────────────

function _setupConfigSheet(ss) {
  var name = SHEET_CONFIG;
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, 3).setValues([["Key", "Value", "Description"]]);
  sheet.setFrozenRows(1);

  var headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange
    .setBackground("#424242")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold");

  var defaults = [
    [
      "CHECKIN_PIN",
      "1234",
      "PIN required by staff to use the check-in station",
    ],
    ["PAYMENT_AMOUNT", "75", "Registration fee in USD"],
    [
      "PAYMENT_INSTRUCTIONS",
      "Make payment via bank transfer to Account: 1234567890. Use your Registration ID as reference.",
      "Payment instructions shown to parents",
    ],
    [
      "APP_URL",
      "https://your-app.onrender.com",
      "Deployed frontend URL (used in emails)",
    ],
    ["PROGRAM_EMAIL", "sports@yourorg.com", "Contact email shown to parents"],
  ];

  sheet.getRange(2, 1, defaults.length, 3).setValues(defaults);
  sheet.setColumnWidths(1, 3, [200, 400, 350]);

  Logger.log("  ✓ " + name + " sheet configured");
}

// ── Utility: Test the Web App locally ─────────────────────────────────────

/**
 * testGetStats — run this from the editor to verify the getStats endpoint
 */
function testGetStats() {
  var result = handleGetStats({});
  Logger.log(result.getContent());
}

/**
 * testRegister — inserts a sample registration to verify the sheet write
 */
function testRegister() {
  var sampleData = {
    action: "registerParticipant",
    childFirstName: "Test",
    childLastName: "Child",
    dateOfBirth: "2015-06-01",
    gender: "Male",
    program: "Football",
    shirtSize: "M (7–8 yrs)",
    allergies: "None",
    medicalNotes: "",
    parentFirstName: "Test",
    parentLastName: "Parent",
    relationship: "Mother",
    parentEmail: "test@example.com",
    parentPhone: "+1 (555) 000-0000",
    parentAddress: "123 Test Street",
    emergencyName: "Emergency Person",
    emergencyPhone: "+1 555 111 1111",
    emergencyRelation: "Aunt",
    medicalConsent: true,
    photoConsent: "Yes",
    termsAccepted: true,
    howDidYouHear: "Friend or Family",
  };

  var result = handleRegisterParticipant(sampleData);
  Logger.log(result.getContent());
}

/**
 * clearTestData — removes rows where childFirstName is "Test"
 * Run this after testRegister() to clean up.
 */
function clearTestData() {
  var sheet = _getSheet(SHEET_REGISTRATIONS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) {
    return String(h).trim();
  });
  var fnIdx = headers.indexOf("childFirstName");

  // Iterate from bottom to avoid row-shift issues
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][fnIdx]).trim() === "Test") {
      sheet.deleteRow(i + 1);
    }
  }
  Logger.log("Test rows cleared.");
}
