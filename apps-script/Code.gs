/**
 * Code.gs — 2026 Children Vacation Sports Program
 * Google Apps Script Web App
 *
 * Deploy as:  Execute as: Me | Who has access: Anyone
 *
 * This file is the entry point. All HTTP requests arrive here
 * and are dispatched to the appropriate handler module.
 *
 * ── Sheet tabs used ──────────────────────────────────────────
 *  "Registrations"  — one row per registration
 *  "CheckIns"       — audit log of every check-in event
 *  "Config"         — key/value pairs (check-in PIN, payment amount, etc.)
 * ─────────────────────────────────────────────────────────────
 */

// ── Configuration ─────────────────────────────────────────────────────────

var SPREADSHEET_ID = ''; // Leave blank to use the spreadsheet this script is bound to

var SHEET_REGISTRATIONS = 'Registrations';
var SHEET_CHECKINS      = 'CheckIns';
var SHEET_CONFIG        = 'Config';

var CHECKIN_PIN_CONFIG_KEY = 'CHECKIN_PIN';

// Registration ID prefix and zero-padding width
var REG_ID_PREFIX = 'SP-2026-';
var REG_ID_PADDING = 4; // e.g. SP-2026-0001

// ── CORS Headers ──────────────────────────────────────────────────────────

function _corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function _jsonResponse(data, code) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function _errorResponse(message, code) {
  return _jsonResponse({ status: 'error', message: message }, code || 400);
}

function _successResponse(data) {
  return _jsonResponse(Object.assign({ status: 'ok' }, data));
}

// ── Sheet helpers ─────────────────────────────────────────────────────────

function _getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function _getSheet(name) {
  var ss = _getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet "' + name + '" not found. Run setupSheets() first.');
  }
  return sheet;
}

/**
 * Return all rows from a sheet as an array of objects keyed by header row.
 */
function _sheetToObjects(sheetName) {
  var sheet = _getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

/**
 * Return column index (0-based) for a header name in a sheet.
 */
function _colIndex(sheet, headerName) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = headers.indexOf(headerName);
  if (idx === -1) throw new Error('Column "' + headerName + '" not found.');
  return idx + 1; // 1-based
}

/**
 * Find a row by matching a column value. Returns { rowIndex, rowData } or null.
 * rowIndex is 1-based (spreadsheet row number).
 */
function _findRow(sheetName, columnName, value) {
  var sheet = _getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var colIdx = headers.indexOf(columnName);
  if (colIdx === -1) return null;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]).trim() === String(value).trim()) {
      var obj = {};
      headers.forEach(function(h, j) { obj[h] = data[i][j]; });
      return { rowIndex: i + 1, rowData: obj };
    }
  }
  return null;
}

/**
 * Generate the next registration ID by reading the current max.
 */
function _nextRegistrationId() {
  var sheet = _getSheet(SHEET_REGISTRATIONS);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return REG_ID_PREFIX + _pad(1, REG_ID_PADDING);

  var colIdx = _colIndex(sheet, 'registrationId');
  var ids = sheet.getRange(2, colIdx, lastRow - 1, 1).getValues()
    .map(function(r) { return String(r[0]); })
    .filter(function(id) { return id.startsWith(REG_ID_PREFIX); })
    .map(function(id) { return parseInt(id.replace(REG_ID_PREFIX, ''), 10) || 0; });

  var maxNum = ids.length > 0 ? Math.max.apply(null, ids) : 0;
  return REG_ID_PREFIX + _pad(maxNum + 1, REG_ID_PADDING);
}

function _pad(n, width) {
  var s = String(n);
  while (s.length < width) s = '0' + s;
  return s;
}

// ── Config helpers ────────────────────────────────────────────────────────

function _getConfig(key) {
  try {
    var sheet = _getSheet(SHEET_CONFIG);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) return String(data[i][1]).trim();
    }
  } catch (e) {}
  return null;
}

// ── doGet — handle GET requests ───────────────────────────────────────────

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action || '';

    switch (action) {
      case 'getRegistration':
        return handleGetRegistration(params);
      case 'getByEmail':
        return handleGetByEmail(params);
      case 'getAllRegistrations':
        return handleGetAllRegistrations(params);
      case 'getProgramRoster':
        return handleGetProgramRoster(params);
      case 'getStats':
        return handleGetStats(params);
      case 'registerParticipant':
        return handleRegisterParticipant(params);
      case 'checkIn':
        return handleCheckIn(params);
      case 'updatePaymentStatus':
        return handleUpdatePaymentStatus(params);
      case 'redeemCoupon':
        return handleRedeemCoupon(params);
      default:
        return _errorResponse('Unknown action: ' + action);
    }
  } catch (err) {
    return _errorResponse('Server error: ' + err.message);
  }
}

// ── doPost — handle POST requests ─────────────────────────────────────────

function doPost(e) {
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || '';

    switch (action) {
      case 'registerParticipant':
        return handleRegisterParticipant(body);
      case 'checkIn':
        return handleCheckIn(body);
      case 'updatePaymentStatus':
        return handleUpdatePaymentStatus(body);
      default:
        return _errorResponse('Unknown action: ' + action);
    }
  } catch (err) {
    return _errorResponse('Server error: ' + err.message);
  }
}
