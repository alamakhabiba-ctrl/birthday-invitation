// ==========================================================
// 0. KONFIGURASI GOOGLE APPS SCRIPT
// Ganti 'PASTE_URL_HERE' dengan URL Web App Apps Script kamu
// ==========================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzc_Utes7u-hHcSiFnXujl3xkqUynVC-5DLL0zRQGPWTuZ4lwF-9LLXQwfCOQB75AS1Hw/exec';

let guestInviteCode = '';

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
function submitRSVP(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById('btn-submit-rsvp');
    const alertMsg = document.getElementById('rsvp-alert');

    btnSubmit.innerText = 'Sending...';
    btnSubmit.disabled = true;

    const formData = new URLSearchParams();
    formData.append('inviteCode', guestInviteCode || 'GENERAL');
    formData.append('name', document.getElementById('form-name').value);
    formData.append('attendance', document.getElementById('form-attendance').value);
    formData.append('guestCount', document.getElementById('form-count').value);
    formData.append('wishes', document.getElementById('form-wishes').value);

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        alertMsg.innerText = 'Terima kasih, konfirmasi kehadiran berhasil terkirim!';
        alertMsg.classList.remove('hidden');
        document.getElementById('rsvp-form').reset();
    })
    .catch(() => {
        alertMsg.innerText = 'Gagal mengirim RSVP. Silakan coba lagi.';
        alertMsg.classList.remove('hidden');
    })
    .finally(() => {
        btnSubmit.innerText = 'Kirim RSVP';
        btnSubmit.disabled = false;
    });
}
