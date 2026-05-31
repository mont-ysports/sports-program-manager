/**
 * Code.gs — 2026 Children Vacation Sports Program
 * Google Apps Script Web App — Entry Point
 *
 * Deploy as: Execute as: Me | Who has access: Anyone
 */

var SPREADSHEET_ID       = '';
var SHEET_REGISTRATIONS  = 'Registrations';
var SHEET_CHECKINS       = 'CheckIns';
var SHEET_CONFIG         = 'Config';
var CHECKIN_PIN_CONFIG_KEY = 'CHECKIN_PIN';
var REG_ID_PREFIX        = 'SP-2026-';
var REG_ID_PADDING       = 4;

// ── Response helpers ──────────────────────────────────────────────────────

function _jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function _errorResponse(message) {
  return _jsonResponse({ status: 'error', message: message });
}

function _successResponse(data) {
  return _jsonResponse(Object.assign({ status: 'ok' }, data));
}

// ── Spreadsheet helpers ───────────────────────────────────────────────────

function _getSpreadsheet() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function _getSheet(name) {
  var sheet = _getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found. Run setupSheets() first.');
  return sheet;
}

function _sheetToObjects(sheetName) {
  var sheet = _getSheet(sheetName);
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function _colIndex(sheet, headerName) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = headers.indexOf(headerName);
  if (idx === -1) throw new Error('Column "' + headerName + '" not found.');
  return idx + 1;
}

function _findRow(sheetName, columnName, value) {
  var sheet = _getSheet(sheetName);
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var colIdx  = headers.indexOf(columnName);
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

function _nextRegistrationId() {
  var sheet   = _getSheet(SHEET_REGISTRATIONS);
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

function _getConfig(key) {
  try {
    var data = _getSheet(SHEET_CONFIG).getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) return String(data[i][1]).trim();
    }
  } catch(e) {}
  return null;
}

function _setConfig(key, value) {
  try {
    var sheet = _getSheet(SHEET_CONFIG);
    var data  = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        return;
      }
    }
    sheet.appendRow([key, value, 'Auto-generated']);
  } catch(e) {
    console.error('_setConfig failed:', e.message);
  }
}

// ── doGet — handles all standard GET requests ─────────────────────────────

function doGet(e) {
  try {
    var p      = e.parameter || {};
    var action = p.action || '';
    switch (action) {
      case 'getRegistration':     return handleGetRegistration(p);
      case 'getByEmail':          return handleGetByEmail(p);
      case 'getAllRegistrations':  return handleGetAllRegistrations(p);
      case 'getProgramRoster':    return handleGetProgramRoster(p);
      case 'getStats':            return handleGetStats(p);
      case 'registerParticipant': return handleRegisterParticipant(p);
      case 'checkIn':             return handleCheckIn(p);
      case 'updatePaymentStatus': return handleUpdatePaymentStatus(p);
      case 'redeemCoupon':        return handleRedeemCoupon(p);
      default: return _errorResponse('Unknown action: ' + action);
    }
  } catch(err) {
    return _errorResponse('Server error: ' + err.message);
  }
}

// ── doPost — handles POST requests (used for large payloads like photos) ──

function doPost(e) {
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || '';
    switch (action) {
      case 'uploadPhoto':         return handleUploadPhoto(body);
      case 'registerParticipant': return handleRegisterParticipant(body);
      case 'checkIn':             return handleCheckIn(body);
      case 'updatePaymentStatus': return handleUpdatePaymentStatus(body);
      case 'redeemCoupon':        return handleRedeemCoupon(body);
      default:
        // Fallback: merge body into params and try doGet
        e.parameter = Object.assign({}, e.parameter || {}, body);
        return doGet(e);
    }
  } catch(err) {
    return _errorResponse('Server error: ' + err.message);
  }
}
