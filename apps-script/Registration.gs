/**
 * Registration.gs — Registration CRUD handlers
 *
 * Depends on helpers defined in Code.gs.
 */

// ── Column headers for the Registrations sheet ────────────────────────────
// Must match exactly what setupSheets() creates.

var REG_HEADERS = [
  'registrationId',
  'registrationTimestamp',
  'childFirstName',
  'childLastName',
  'dateOfBirth',
  'gender',
  'program',
  'computerTrack',
  'hardSkill',
  'softSkill',
  'shirtSize',
  'allergies',
  'medicalNotes',
  'parentFirstName',
  'parentLastName',
  'relationship',
  'parentEmail',
  'parentPhone',
  'whatsappNumber',
  'parentAddress',
  'pastParticipant',
  'pastParticipantYears',
  'willingToVolunteer',
  'volunteerHow',
  'emergencyName',
  'emergencyPhone',
  'emergencyRelation',
  'medicalConsent',
  'photoConsent',
  'termsAccepted',
  'howDidYouHear',
  'paymentStatus',
  'checkInTime',
  'childPhotoUrl',
  'parentPhotoUrl',
  'notes',
];

// ── Server-side validation ─────────────────────────────────────────────────

function _validateRegistration(data) {
  var errors = [];

  function req(field, label) {
    if (!data[field] || String(data[field]).trim() === '') {
      errors.push(label + ' is required.');
    }
  }

  function email(field, label) {
    if (data[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[field])) {
      errors.push(label + ' must be a valid email address.');
    }
  }

  function phone(field, label) {
    if (data[field]) {
      var cleaned = String(data[field]).replace(/[\s\-().+]/g, '');
      if (!/^\d{7,15}$/.test(cleaned)) {
        errors.push(label + ' must be a valid phone number.');
      }
    }
  }

  function ageRange(field, label, minAge, maxAge) {
    if (data[field]) {
      var today = new Date();
      var dob = new Date(data[field]);
      if (isNaN(dob.getTime())) {
        errors.push(label + ' must be a valid date.');
        return;
      }
      var age = today.getFullYear() - dob.getFullYear()
        - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      if (age < minAge || age > maxAge) {
        errors.push(label + ': child must be between ' + minAge + ' and ' + maxAge + ' years old.');
      }
    }
  }

  // Required fields
  req('childFirstName',   'Child first name');
  req('childLastName',    'Child last name');
  req('dateOfBirth',      'Date of birth');
  req('gender',           'Gender');
  // Program: accept array with at least one item, or non-empty string
  var programVal = data['program'];
  if (Array.isArray(programVal)) {
    if (programVal.length === 0) errors.push('At least one program must be selected.');
  } else if (!programVal || String(programVal).trim() === '') {
    errors.push('Program is required.');
  }
  req('hardSkill',        'Hard skill');
  req('softSkill',        'Soft skill');
  req('parentFirstName',  'Parent first name');
  req('parentLastName',   'Parent last name');
  req('parentEmail',      'Parent email');
  req('parentPhone',      'Parent phone');
  req('whatsappNumber',   'WhatsApp number');
  // Validate 231 prefix
  if (data['whatsappNumber'] && !String(data['whatsappNumber']).replace(/[\s\-().+]/g,'').startsWith('231')) {
    errors.push('WhatsApp number must start with 231 (Liberian country code).');
  }
  req('relationship',     'Relationship');
  req('pastParticipant',    'Past participant answer');
  req('willingToVolunteer', 'Volunteer answer');
  req('emergencyName',    'Emergency contact name');
  req('emergencyPhone',   'Emergency contact phone');
  req('emergencyRelation','Emergency contact relationship');

  // Format checks
  email('parentEmail', 'Parent email');
  phone('parentPhone', 'Parent phone');
  phone('emergencyPhone', 'Emergency phone');
  ageRange('dateOfBirth', 'Date of birth', 4, 17);

  // Consent checks
  if (data['medicalConsent'] !== true && data['medicalConsent'] !== 'true') {
    errors.push('Medical consent is required.');
  }
  if (data['termsAccepted'] !== true && data['termsAccepted'] !== 'true') {
    errors.push('Terms and conditions must be accepted.');
  }

  return errors;
}

// ── Handler: Register a new participant ───────────────────────────────────

function handleRegisterParticipant(data) {
  // 1. Pre-process: split pipe-separated program array sent from frontend
  if (data['program'] && typeof data['program'] === 'string' && data['program'].indexOf('||') !== -1) {
    data['program'] = data['program'].split('||').map(function(s) { return s.trim(); }).filter(Boolean);
  } else if (data['program'] && typeof data['program'] === 'string') {
    // Single program sent as plain string — wrap in array for consistency
    data['program'] = [data['program'].trim()];
  }

  // 1. Server-side validation
  var errors = _validateRegistration(data);
  if (errors.length > 0) {
    return _errorResponse('Validation failed: ' + errors.join(' | '));
  }

  // 2. Check for duplicate (same child name + DOB + program)
  var existing = _sheetToObjects(SHEET_REGISTRATIONS);
  var duplicate = existing.find(function(r) {
    return (
      String(r.childFirstName).toLowerCase() === String(data.childFirstName).toLowerCase() &&
      String(r.childLastName).toLowerCase()  === String(data.childLastName).toLowerCase() &&
      String(r.dateOfBirth)   === String(data.dateOfBirth) &&
      String(r.program)       === (Array.isArray(data.program) ? data.program.join(', ') : String(data.program)) &&
      String(r.paymentStatus) !== 'Cancelled'
    );
  });

  if (duplicate) {
    return _errorResponse(
      'A registration already exists for ' + data.childFirstName + ' ' + data.childLastName +
      ' in the ' + data.program + ' program (ID: ' + duplicate.registrationId + ').'
    );
  }

  // 3. Generate registration ID (with lock to prevent race conditions)
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var registrationId;
  try {
    registrationId = _nextRegistrationId();
  } finally {
    lock.releaseLock();
  }

  // 4. Build the row in header order
  var timestamp = new Date().toISOString();
  var rowValues = REG_HEADERS.map(function(h) {
    switch (h) {
      case 'registrationId':        return registrationId;
      case 'program':               return Array.isArray(data[h]) ? data[h].join(', ') : String(data[h] || '');
      case 'registrationTimestamp': return timestamp;
      case 'paymentStatus':         return 'Pending';
      case 'checkInTime':           return '';
      case 'notes':                 return '';
      case 'medicalConsent':        return data[h] === true || data[h] === 'true' ? 'TRUE' : 'FALSE';
      case 'termsAccepted':         return data[h] === true || data[h] === 'true' ? 'TRUE' : 'FALSE';
      default:                      return data[h] !== undefined ? String(data[h]) : '';
    }
  });

  // 5. Append row to sheet
  var sheet = _getSheet(SHEET_REGISTRATIONS);
  sheet.appendRow(rowValues);

  // 6. Trigger confirmation email (non-blocking)
  try {
    _sendConfirmationEmail(data, registrationId);
  } catch (emailErr) {
    // Log but don't fail the registration
    console.error('Email send failed:', emailErr.message);
  }

  // 7. Return success with registration details
  return _successResponse({
    registrationId:   registrationId,
    childFirstName:   data.childFirstName,
    childLastName:    data.childLastName,
    program:          Array.isArray(data.program) ? data.program.join(', ') : String(data.program || ''),
    parentEmail:      data.parentEmail,
    dateOfBirth:      data.dateOfBirth,
    registrationTimestamp: timestamp,
    paymentStatus:    'Pending',
  });
}

// ── Handler: Get a single registration by ID ──────────────────────────────

function handleGetRegistration(params) {
  var id = (params.registrationId || '').trim().toUpperCase();
  if (!id) return _errorResponse('registrationId is required.');

  var found = _findRow(SHEET_REGISTRATIONS, 'registrationId', id);
  if (!found) return _errorResponse('Registration not found: ' + id, 404);

  // Remove sensitive server-only fields before returning
  var safe = Object.assign({}, found.rowData);
  delete safe.notes; // internal staff notes

  return _successResponse(safe);
}

// ── Handler: Get registrations by parent email ────────────────────────────

function handleGetByEmail(params) {
  var email = (params.email || '').trim().toLowerCase();
  if (!email) return _errorResponse('email is required.');

  var all = _sheetToObjects(SHEET_REGISTRATIONS);
  var matches = all.filter(function(r) {
    return String(r.parentEmail).toLowerCase() === email;
  }).map(function(r) {
    var safe = Object.assign({}, r);
    delete safe.notes;
    return safe;
  });

  return _successResponse({ registrations: matches, count: matches.length });
}

// ── Handler: Get all registrations (staff) ────────────────────────────────

function handleGetAllRegistrations(params) {
  var all = _sheetToObjects(SHEET_REGISTRATIONS);

  // Optional filters
  if (params.program) {
    all = all.filter(function(r) { return r.program === params.program; });
  }
  if (params.status) {
    all = all.filter(function(r) {
      return String(r.paymentStatus).toLowerCase() === params.status.toLowerCase();
    });
  }

  return _successResponse({ registrations: all, count: all.length });
}

// ── Handler: Get roster for a specific program ────────────────────────────

function handleGetProgramRoster(params) {
  var program = (params.program || '').trim();
  if (!program) return _errorResponse('program is required.');

  var all = _sheetToObjects(SHEET_REGISTRATIONS);
  var roster = all.filter(function(r) {
    return r.program === program && r.paymentStatus !== 'Cancelled';
  });

  return _successResponse({ program: program, roster: roster, count: roster.length });
}

// ── Handler: Get summary statistics ───────────────────────────────────────

function handleGetStats(params) {
  var all = _sheetToObjects(SHEET_REGISTRATIONS);

  var total    = all.length;
  var paid     = all.filter(function(r) { return r.paymentStatus === 'Paid' || r.paymentStatus === 'Waived'; }).length;
  var pending  = all.filter(function(r) { return !r.paymentStatus || r.paymentStatus === 'Pending'; }).length;

  // Checked in today
  var today = new Date().toDateString();
  var checkedIn = all.filter(function(r) {
    if (!r.checkInTime) return false;
    return new Date(r.checkInTime).toDateString() === today;
  }).length;

  // By program
  var byProgram = {};
  all.forEach(function(r) {
    if (r.program) {
      byProgram[r.program] = (byProgram[r.program] || 0) + 1;
    }
  });

  return _successResponse({
    total: total,
    paid: paid,
    pending: pending,
    checkedIn: checkedIn,
    byProgram: byProgram,
  });
}

// ── Confirmation email helper ─────────────────────────────────────────────

function _sendConfirmationEmail(data, registrationId) {
  var to = data.parentEmail;
  if (!to) return;

  var appUrl = _getConfig('APP_URL') || 'https://your-app.onrender.com';
  var paymentAmount = _getConfig('PAYMENT_AMOUNT') || '75';
  var paymentInstructions = _getConfig('PAYMENT_INSTRUCTIONS') || 'Please make payment via bank transfer.';

  var subject = '🎉 Registration Confirmed — ' + data.childFirstName + ' | ' + registrationId;
  var body = [
    'Dear ' + data.parentFirstName + ',',
    '',
    'Great news! ' + data.childFirstName + ' ' + data.childLastName + ' has been successfully registered for the 2026 Children Vacation Sports Program.',
    '',
    '── Registration Details ──',
    'Registration ID : ' + registrationId,
    'Program         : ' + data.program,
    'Date of Birth   : ' + data.dateOfBirth,
    'Status          : Pending Payment',
    '',
    '── Payment Instructions ──',
    'Amount Due: $' + paymentAmount + ' USD',
    '',
    paymentInstructions,
    '',
    'IMPORTANT: Please use your Registration ID (' + registrationId + ') as the payment reference.',
    '',
    '── Your QR Code ──',
    'View your registration, download your QR code, and track payment status at:',
    appUrl + '/dashboard',
    '',
    '── Emergency Contact on File ──',
    data.emergencyName + ' — ' + data.emergencyPhone + ' (' + data.emergencyRelation + ')',
    '',
    'If you have any questions, please reply to this email.',
    '',
    'See you on the field!',
    'The 2026 Sports Program Team',
  ].join('\n');

  MailApp.sendEmail({ to: to, subject: subject, body: body });
}

// ── Handler: Upload photo to Google Drive ─────────────────────────────────

/**
 * Stores photos in two Drive folders:
 *   "Sports Program 2026 — Participant Photos"
 *   "Sports Program 2026 — Parent Photos"
 *
 * The folder IDs are auto-created on first use and cached in the Config sheet.
 * After upload, the Drive file URL is saved back to the registration row.
 */
function handleUploadPhoto(params) {
  var registrationId = (params.registrationId || '').trim().toUpperCase();
  var photoType      = (params.photoType || '').trim().toLowerCase(); // 'child' | 'parent'
  var base64         = (params.base64 || '').trim();
  var fileName       = (params.fileName || 'photo.jpg').trim();

  if (!registrationId) return _errorResponse('registrationId is required.');
  if (!photoType)      return _errorResponse('photoType is required.');
  if (!base64)         return _errorResponse('base64 image data is required.');

  // Get or create the appropriate Drive folder
  var folderConfigKey = photoType === 'child'
    ? 'DRIVE_FOLDER_PARTICIPANTS'
    : 'DRIVE_FOLDER_PARENTS';

  var folderId = _getConfig(folderConfigKey);
  var folder;

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      folder = null; // folder was deleted — recreate
    }
  }

  if (!folder) {
    var folderName = photoType === 'child'
      ? 'Sports Program 2026 — Participant Photos'
      : 'Sports Program 2026 — Parent Photos';
    folder = DriveApp.createFolder(folderName);
    // Cache the folder ID in Config sheet
    _setConfig(folderConfigKey, folder.getId());
  }

  // Decode base64 and create file
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64),
    'image/jpeg',
    registrationId + '_' + photoType + '_' + fileName
  );

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var fileUrl = file.getUrl();

  // Save URL back to registration row
  var sheet    = _getSheet(SHEET_REGISTRATIONS);
  var found    = _findRow(SHEET_REGISTRATIONS, 'registrationId', registrationId);
  if (found) {
    var colName = photoType === 'child' ? 'childPhotoUrl' : 'parentPhotoUrl';
    try {
      var colIdx = _colIndex(sheet, colName);
      sheet.getRange(found.rowIndex, colIdx).setValue(fileUrl);
    } catch (e) {
      // Column may not exist yet — log and continue
      console.warn('Could not save photo URL to sheet:', e.message);
    }
  }

  return _successResponse({
    registrationId: registrationId,
    photoType:      photoType,
    fileUrl:        fileUrl,
  });
}

// ── Config write helper ───────────────────────────────────────────────────

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
    // Key not found — append new row
    sheet.appendRow([key, value, 'Auto-generated — do not edit']);
  } catch (e) {
    console.error('_setConfig failed:', e.message);
  }
}
