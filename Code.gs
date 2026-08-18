// ==========================================================
// GOOGLE APPS SCRIPT
// Sweet Seventeen Invitation
//
// SHEET 1: Guests
// A = inviteCode
// B = name
// C = status
// D = openedAt
//
// SHEET 2: RSVP
// A = timestamp
// B = inviteCode
// C = name
// D = attendance
// E = guestCount
// F = wishes
// ==========================================================


// ==========================================================
// 1. GET REQUEST
//
// Digunakan untuk:
// ?code=TM-001
// → mengambil nama tamu
//
// ?code=TM-001&action=opened
// → mencatat bahwa undangan sudah dibuka
// ==========================================================

// ID spreadsheet jika Apps Script berdiri sendiri (bukan container-bound).
// Ganti dengan ID spreadsheet Anda (di URL antara `/d/` dan `/edit`).
const SPREADSHEET_ID = '1UPPj3qOEcyb2kcp0HCOaPdluwlkh5DwKWiXS6Fb_zl8';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doGet(e) {

  try {

    Logger.log('[doGet] Request diterima');
    Logger.log('[doGet] Parameters:', e.parameter);

    // Pastikan parameter tersedia
    const code = e && e.parameter
      ? e.parameter.code
      : null;

    const action = e && e.parameter
      ? e.parameter.action
      : null;

    Logger.log('[doGet] Code:', code);
    Logger.log('[doGet] Action:', action);


    // ------------------------------------------------------
    // DIAGNOSE: list semua sheet
    // ?action=sheets → menampilkan semua nama sheet
    // (hanya untuk debugging, hapus setelah selesai)
    // ------------------------------------------------------

    if (action === 'sheets') {
      const sheets = getSpreadsheet()
        .getSheets()
        .map(s => s.getName());
      return jsonResponse({
        success: true,
        sheets: sheets,
        spreadsheetId: SPREADSHEET_ID
      });
    }


    // ------------------------------------------------------
    // Kalau tidak ada inviteCode
    // ------------------------------------------------------

    if (!code) {
      Logger.log('[doGet] Code tidak ditemukan');
      return jsonResponse({
        success: false,
        message: 'inviteCode tidak ditemukan'
      });
    }


    // ------------------------------------------------------
    // Cari tamu berdasarkan inviteCode
    // ------------------------------------------------------

    const sheet = getSpreadsheet()
      .getSheetByName('Guests');

    if (!sheet) {
      Logger.log('[doGet] Sheet Guests tidak ditemukan');
      return jsonResponse({
        success: false,
        message: 'Sheet Guests tidak ditemukan'
      });
    }

    Logger.log('[doGet] Sheet Guests ditemukan');

    const data = sheet.getDataRange().getValues();
    Logger.log('[doGet] Data rows:', data.length);

    let guestRow = -1;
    let guestName = '';


    // Mulai dari baris 2 karena baris 1 adalah header
    for (let i = 1; i < data.length; i++) {

      const rowCode = String(data[i][0]).trim();

      if (rowCode === String(code).trim()) {

        guestRow = i + 1;
        guestName = String(data[i][1]).trim();

        Logger.log('[doGet] Guest ditemukan:', guestName, 'di baris', guestRow);

        break;
      }
    }


    // ------------------------------------------------------
    // Kalau kode tamu tidak ditemukan
    // ------------------------------------------------------

    if (guestRow === -1) {

      Logger.log('[doGet] Kode undangan tidak ditemukan:', code);
      return jsonResponse({
        success: false,
        message: 'Kode undangan tidak ditemukan'
      });

    }


    // ------------------------------------------------------
    // ACTION: OPENED
    //
    // Ketika tamu menekan Open Invitation
    // ------------------------------------------------------

    if (action === 'opened') {

      Logger.log('[doGet] Updating status untuk:', code);

      // Kolom C = status
      sheet.getRange(guestRow, 3)
        .setValue('Sudah Dibuka');


      // Kolom D = openedAt
      sheet.getRange(guestRow, 4)
        .setValue(new Date());

      Logger.log('[doGet] Status berhasil diupdate');

      return jsonResponse({
        success: true,
        message: 'Status undangan berhasil diperbarui',
        inviteCode: code,
        guestName: guestName
      });

    }


    // ------------------------------------------------------
    // GET DATA TAMU
    //
    // Jika hanya ?code=TM-001
    // ------------------------------------------------------

    Logger.log('[doGet] Returning guest data');

    return jsonResponse({
      success: true,
      guestName: guestName,
      inviteCode: code
    });


  } catch (error) {

    Logger.log('[doGet] ERROR:', error.toString());
    return jsonResponse({
      success: false,
      message: error.toString()
    });

  }

}


// ==========================================================
// 2. POST REQUEST
//
// Digunakan untuk mengirim RSVP.
//
// Data yang dikirim dari website:
//
// inviteCode
// name
// attendance
// guestCount
// wishes
// ==========================================================

function doPost(e) {

  try {

    Logger.log('[doPost] POST request diterima');
    Logger.log('[doPost] Parameters:', e.parameter);


    // Pastikan request memiliki parameter
    if (!e || !e.parameter) {

      Logger.log('[doPost] Parameter kosong');
      return jsonResponse({
        success: false,
        message: 'Data RSVP tidak ditemukan'
      });

    }


    // ------------------------------------------------------
    // Ambil data dari website
    // ------------------------------------------------------

    const inviteCode = String(
      e.parameter.inviteCode || ''
    ).trim();

    const name = String(
      e.parameter.name || ''
    ).trim();

    const attendance = String(
      e.parameter.attendance || ''
    ).trim();

    const guestCount = String(
      e.parameter.guestCount || ''
    ).trim();

    const wishes = String(
      e.parameter.wishes || ''
    ).trim();

    Logger.log('[doPost] Data diterima:', {
      inviteCode: inviteCode,
      name: name,
      attendance: attendance,
      guestCount: guestCount,
      wishes: wishes
    });


    // ------------------------------------------------------
    // Validasi
    // ------------------------------------------------------

    if (!name) {

      Logger.log('[doPost] Validasi gagal: nama kosong');
      return jsonResponse({
        success: false,
        message: 'Nama belum diisi'
      });

    }

    if (!attendance) {

      Logger.log('[doPost] Validasi gagal: attendance kosong');
      return jsonResponse({
        success: false,
        message: 'Konfirmasi kehadiran belum dipilih'
      });

    }


    // ------------------------------------------------------
    // Ambil Sheet RSVP
    // ------------------------------------------------------

    Logger.log('[doPost] Mencari sheet RSVP');

    const sheet = getSpreadsheet()
      .getSheetByName('RSVP');


    if (!sheet) {

      Logger.log('[doPost] Sheet RSVP tidak ditemukan');
      return jsonResponse({
        success: false,
        message: 'Sheet RSVP tidak ditemukan'
      });

    }

    Logger.log('[doPost] Sheet RSVP ditemukan');


    // ------------------------------------------------------
    // Tambahkan data ke baris berikutnya
    //
    // A = timestamp
    // B = inviteCode
    // C = name
    // D = attendance
    // E = guestCount
    // F = wishes
    // ------------------------------------------------------

    const rowData = [
      new Date(),
      inviteCode,
      name,
      attendance,
      guestCount,
      wishes
    ];

    Logger.log('[doPost] Menambahkan row:', rowData);

    sheet.appendRow(rowData);

    Logger.log('[doPost] Row berhasil ditambahkan');


    // ------------------------------------------------------
    // Berhasil
    // ------------------------------------------------------

    return jsonResponse({
      success: true,
      message: 'RSVP berhasil disimpan'
    });


  } catch (error) {

    Logger.log('[doPost] ERROR:', error.toString());
    Logger.log('[doPost] Stack:', error.stack);

    return jsonResponse({
      success: false,
      message: error.toString()
    });

  }

}


// ==========================================================
// 3. JSON RESPONSE
//
// Membuat response yang bisa dibaca oleh script.js
// ==========================================================

function jsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}
