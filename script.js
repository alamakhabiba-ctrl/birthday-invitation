// ==========================================================
// 0. KONFIGURASI GOOGLE APPS SCRIPT
// Ganti 'PASTE_URL_HERE' dengan URL Web App Apps Script kamu
// ==========================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzb1mqwk7BxoYBiiZTbS9ewWB9HBUiWrjcCX2p3rRkBCqXh6RjN6XINAQJCk2HaFK80ZQ/exec';

let guestInviteCode = '';

// ==========================================================
// TEST CONNECTION (bisa di-call dari console)
// Ketik: testConnection() di console untuk test
// ==========================================================
function testConnection() {
    console.log('[TEST] Testing Apps Script connection...');
    console.log('[TEST] URL:', APPS_SCRIPT_URL);
    
    // Test GET request
    fetch(APPS_SCRIPT_URL + '?code=TEST')
        .then(res => res.json())
        .then(data => {
            console.log('[TEST] GET response:', data);
            alert('✅ Connection OK!\n\nResponse:\n' + JSON.stringify(data, null, 2));
        })
        .catch(error => {
            console.error('[TEST] GET error:', error);
            alert('❌ Connection FAILED!\n\nError: ' + error.message);
        });
}

// ==========================================================
// 1. DOMCONTENTLOADED — AMBIL NAMA TAMU BERDASARKAN ?code=
// GET 1: ?code=KODE            → mengembalikan guestName
// GET 2: ?code=KODE&action=opened → update status "Sudah Dibuka"
// ==========================================================
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    console.log('[Invitation] URL search params:', window.location.search);
    console.log('[Invitation] Invite Code from URL:', code);

    if (code && APPS_SCRIPT_URL !== 'PASTE_URL_HERE') {
        const fetchUrl = `${APPS_SCRIPT_URL}?code=${encodeURIComponent(code)}`;
        console.log('[Invitation] Fetching Apps Script URL:', fetchUrl);

        fetch(fetchUrl)
            .then(res => res.json())
            .then(data => {
                console.log('[Invitation] Apps Script response:', data);

                const guestName = data?.guestName || data?.name || data?.nama || data?.guest_name || data?.result?.guestName || data?.result?.name;
                const inviteCode = data?.inviteCode || data?.invite_code || data?.code || data?.result?.inviteCode || code;

                if (guestName) {
                    console.log('[Invitation] guestName found:', guestName);
                    document.getElementById('guest-name').innerText = guestName;
                    guestInviteCode = inviteCode;
                    console.log('[Invitation] guestInviteCode saved:', guestInviteCode);
                } else {
                    console.warn('[Invitation] guestName not found in response, using fallback label');
                    document.getElementById('guest-name').innerText = 'Tamu Spesial';
                }
            })
            .catch(error => {
                console.error('[Invitation] Error fetching guest data:', error);
                document.getElementById('guest-name').innerText = 'Tamu Spesial';
            });
    } else {
        document.getElementById('guest-name').innerText = 'Tamu Spesial';
    }

    startCountdown();
});

// ==========================================================
// 2. TOMBOL OPEN INVITATION
//    - Putar musik latar
//    - Catat status "Sudah Dibuka" ke Google Sheet
//    - Fade out cover → tampilkan konten utama + bottom nav
// ==========================================================
function openInvitation() {
    const cover = document.getElementById('cover-page');
    const mainContent = document.getElementById('main-content');
    const music = document.getElementById('bg-music');

    music.play().catch(e => console.log("Audio autoplay prevented"));

    // Catat status "Sudah Dibuka" (Apps Script memproses parameter action=opened)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && APPS_SCRIPT_URL !== 'PASTE_URL_HERE') {
        fetch(`${APPS_SCRIPT_URL}?code=${encodeURIComponent(code)}&action=opened`)
            .catch(() => {});
    }

    // Transisi fade out halaman cover
    cover.style.opacity = '0';
    cover.style.visibility = 'hidden';

    setTimeout(() => {
        mainContent.classList.remove('hidden');
    }, 500);
}

// ==========================================================
// 3. NAVIGASI HALAMAN (SPA)
// ==========================================================
function switchPage(pageId, element) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    document.getElementById(`page-${pageId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });

    if (element) {
        element.classList.add('active');
    }
}

// ==========================================================
// 4. COUNTDOWN TIMER — TARGET: 05 SEPTEMBER 2026, 15:00 WIB
// ==========================================================
function startCountdown() {
    const targetDate = new Date(2026, 8, 5, 15, 0, 0).getTime(); // 05 September 2026, 15:00 WIB

    const updateCountdown = () => {
        const now = new Date().getTime();
        const difference = targetDate - now;
        const pad = n => String(n).padStart(2, '0');

        if (difference > 0) {
            document.getElementById('days').innerText = pad(Math.floor(difference / (1000 * 60 * 60 * 24)));
            document.getElementById('hours').innerText = pad(Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
            document.getElementById('minutes').innerText = pad(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)));
            document.getElementById('seconds').innerText = pad(Math.floor((difference % (1000 * 60)) / 1000));
        } else {
            document.getElementById('days').innerText = '00';
            document.getElementById('hours').innerText = '00';
            document.getElementById('minutes').innerText = '00';
            document.getElementById('seconds').innerText = '00';
        }
    };

    updateCountdown(); // tampil langsung tanpa menunggu 1 detik
    setInterval(updateCountdown, 1000);
}

// ==========================================================
// 5. COPY NO REKENING (navigator.clipboard + fallback)
// ==========================================================
function copyRekening() {
    const accNo = document.getElementById('account-no').innerText;

    const fallbackCopy = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            alert("Nomor rekening berhasil disalin!");
        } catch (e) {
            alert("Gagal menyalin. Silakan salin manual: " + text);
        }
        document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(accNo)
            .then(() => alert("Nomor rekening berhasil disalin!"))
            .catch(() => fallbackCopy(accNo));
    } else {
        fallbackCopy(accNo);
    }
}

// ==========================================================
// 6. SUBMIT RSVP KE GOOGLE SHEETS (POST)
//    Body: inviteCode, name, attendance, guestCount, wishes
// ==========================================================

function showThanksPage() {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    const thanksPage = document.getElementById('page-thanks');

    if (thanksPage) {
        thanksPage.classList.remove('hidden');
    }

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
}


// ==========================================================
// SUBMIT RSVP
// ==========================================================

async function submitRSVP(event) {

    // Mencegah halaman reload
    if (event) {
        event.preventDefault();
    }

    const btnSubmit =
        document.getElementById('btn-submit-rsvp');

    const alertMsg =
        document.getElementById('rsvp-alert');

    const rsvpForm =
        document.getElementById('rsvp-form');


    // ------------------------------------------------------
    // Pastikan elemen tersedia
    // ------------------------------------------------------

    if (!btnSubmit || !alertMsg || !rsvpForm) {

        console.error(
            '[RSVP] Elemen form RSVP tidak ditemukan.'
        );

        return;
    }


    // ------------------------------------------------------
    // Ambil kode tamu dari URL
    //
    // Contoh:
    // ?code=TM-001
    // ------------------------------------------------------

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const urlInviteCode =
        (urlParams.get('code') || '').trim();


    // ------------------------------------------------------
    // Tentukan invite code
    //
    // Prioritas:
    // 1. guestInviteCode
    // 2. code dari URL
    // 3. GENERAL
    // ------------------------------------------------------

    const inviteCode =
        (
            guestInviteCode ||
            urlInviteCode ||
            'GENERAL'
        ).trim();


    // ------------------------------------------------------
    // Ambil data form
    // ------------------------------------------------------

    const name =
        document.getElementById('form-name')
            ?.value
            .trim() || '';

    const attendance =
        document.getElementById('form-attendance')
            ?.value
            .trim() || '';

    const guestCount =
        document.getElementById('form-count')
            ?.value
            .trim() || '';

    const wishes =
        document.getElementById('form-wishes')
            ?.value
            .trim() || '';


    // ------------------------------------------------------
    // Validasi nama
    // ------------------------------------------------------

    if (!name) {

        alertMsg.innerText =
            'Silakan isi nama terlebih dahulu.';

        alertMsg.classList.remove('hidden');

        return;
    }


    // ------------------------------------------------------
    // Validasi kehadiran
    // ------------------------------------------------------

    if (!attendance) {

        alertMsg.innerText =
            'Silakan pilih konfirmasi kehadiran.';

        alertMsg.classList.remove('hidden');

        return;
    }


    // ------------------------------------------------------
    // Status tombol
    // ------------------------------------------------------

    btnSubmit.innerText =
        'Mengirim...';

    btnSubmit.disabled = true;

    alertMsg.classList.add('hidden');


    // ------------------------------------------------------
    // Data yang akan dikirim
    // ------------------------------------------------------

    const formData =
        new URLSearchParams();


    formData.append(
        'inviteCode',
        inviteCode
    );

    formData.append(
        'name',
        name
    );

    formData.append(
        'attendance',
        attendance
    );

    formData.append(
        'guestCount',
        guestCount
    );

    formData.append(
        'wishes',
        wishes
    );


    // ------------------------------------------------------
    // Debug
    // ------------------------------------------------------

    console.log(
        '[RSVP] Data yang dikirim:',
        {
            inviteCode: inviteCode,
            name: name,
            attendance: attendance,
            guestCount: guestCount,
            wishes: wishes
        }
    );


    // ------------------------------------------------------
    // Timeout 15 detik
    // ------------------------------------------------------

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(() => {

            controller.abort();

        }, 15000);


    try {

        // --------------------------------------------------
        // Kirim ke Google Apps Script
        // --------------------------------------------------

        const response =
            await fetch(
                APPS_SCRIPT_URL,
                {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                }
            );


        clearTimeout(timeoutId);


        console.log(
            '[RSVP] HTTP status:',
            response.status
        );


        // --------------------------------------------------
        // Cek HTTP response
        // --------------------------------------------------

        if (!response.ok) {

            throw new Error(
                `Server mengembalikan HTTP ${response.status}`
            );

        }


        // --------------------------------------------------
        // Baca response JSON dari Code.gs
        // --------------------------------------------------

        const data =
            await response.json();


        console.log(
            '[RSVP] Response Apps Script:',
            data
        );


        // --------------------------------------------------
        // CEK HASIL SEBENARNYA
        //
        // Code.gs mengembalikan:
        //
        // success: true
        //
        // jika berhasil.
        // --------------------------------------------------

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                'RSVP tidak berhasil disimpan.'
            );

        }


        // --------------------------------------------------
        // RSVP BERHASIL DISIMPAN
        // --------------------------------------------------

        console.log(
            `[RSVP] Berhasil disimpan untuk ${inviteCode}`
        );


        // Reset form
        rsvpForm.reset();


        // Tampilkan halaman terima kasih
        showThanksPage();


    } catch (error) {

        clearTimeout(timeoutId);


        console.error(
            '[RSVP] Gagal mengirim:',
            error
        );


        // --------------------------------------------------
        // Timeout
        // --------------------------------------------------

        if (
            error.name === 'AbortError'
        ) {

            alertMsg.innerText =
                'Koneksi timeout. Data belum dikonfirmasi tersimpan. Silakan coba lagi.';


        // --------------------------------------------------
        // Response bukan JSON
        // --------------------------------------------------

        } else if (
            error instanceof SyntaxError
        ) {

            alertMsg.innerText =
                'Response dari Google Apps Script tidak dapat dibaca. Periksa deployment Web App /exec.';


        // --------------------------------------------------
        // Error lainnya
        // --------------------------------------------------

        } else {

            alertMsg.innerText =
                'Gagal menyimpan RSVP: ' +
                (
                    error.message ||
                    'Silakan coba lagi.'
                );

        }


        alertMsg.classList.remove(
            'hidden'
        );


    } finally {

        // --------------------------------------------------
        // Aktifkan kembali tombol
        // --------------------------------------------------

        btnSubmit.innerText =
            'Kirim';

        btnSubmit.disabled =
            false;

    }
}