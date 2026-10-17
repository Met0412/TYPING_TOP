// ============================================
// KetikCepat — js/app.js
// Production-Ready Indonesian Typing Test Engine
// ============================================

// ── Kata-kata Bahasa Indonesia (200+ kata umum dan variasi) ──
const KATA = [
    "yang","untuk","pada","para","namun","menurut","antara","dia","dua","seperti",
    "jika","sehingga","kembali","dan","tidak","ini","karena","kepada","oleh","saat",
    "harus","sementara","setelah","belum","kami","sekitar","bagi","serta","dari","itu",
    "dengan","akan","juga","bisa","ada","mereka","sudah","saya","terhadap","secara",
    "agar","lain","anda","begitu","mengapa","kenapa","kapan","siapa","bagaimana","dalam",
    "sebuah","tahun","orang","atau","hari","menjadi","masih","baru","satu","waktu",
    "banyak","besar","hal","sama","selalu","hingga","sekarang","bukan","hanya","saja",
    "telah","mungkin","bahkan","tapi","apakah","dapat","membuat","sebagai","bahwa","sangat",
    "ketika","tentang","kemudian","paling","sendiri","pernah","terus","tempat","setiap",
    "jalan","makan","minum","tidur","bangun","kerja","belajar","baca","tulis",
    "rumah","sekolah","pasar","kantor","buku","meja","kursi","pintu","jendela","kaca",
    "dunia","hidup","negara","air","tanah","api","langit","bulan","matahari","bintang",
    "anak","ibu","ayah","teman","guru","murid","cinta","hati","pikiran","jiwa",
    "kota","desa","sungai","gunung","laut","pantai","hujan","angin","awan","pagi",
    "siang","malam","sore","minggu","musim","warna","putih","hitam","merah",
    "kuning","hijau","biru","berat","ringan","tinggi","rendah","cepat","lambat","dekat",
    "jauh","kanan","kiri","atas","bawah","depan","belakang","luar","masuk","keluar",
    "datang","pergi","pulang","ambil","beri","tahu","lihat","dengar","rasa","buat",
    "jadi","kata","bicara","tutur","jawab","tanya","cari","temukan","simpan","buka",
    "tutup","mulai","akhir","awal","proses","hasil","nilai","angka","huruf","kalimat",
    "pesan","kirim","terima","undang","hadir","absen","benar","salah","baik","buruk",
    "senang","sedih","marah","takut","berani","kuat","lemah","bosan","semangat","harap"
];

// ── SVGs ──
const SUN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const MOON_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

// ── State Variables ──
let testMode        = 'time';   // 'time' or 'words'
let duration        = 30;       // active duration in seconds
let wordLimit       = 25;       // active word count in words mode
let timeLeft        = 30;
let intervalId      = null;
let running         = false;
let startTime       = null;     // timestamp when typing started
let wordList        = [];
let wIdx            = 0;        // current word index
let lIdx            = 0;        // current letter index in active word

// Precise Keystroke Metrics (International Standard)
let netCorrectChars = 0;        // currently correct letters standing + correct spaces
let totalKeystrokes = 0;        // total printable keystrokes attempted (raw characters typed)
let totalErrors     = 0;        // total error keystrokes committed (corrected + uncorrected)
let wpmRecords      = [];       // WPM records sampled every second

// Settings State
let soundEnabled       = true;
let punctuationEnabled = false;
let numbersEnabled     = false;

// Audio Context for synthesized mechanical keystroke sounds
let audioCtx = null;

// ── DOM References ──
const $timer       = document.getElementById('timer');
const $progressBar = document.getElementById('progress-bar');
const $area        = document.getElementById('typing-area');
const $input       = document.getElementById('hidden-input');

const $secTest     = document.getElementById('sec-test');
const $secResult   = document.getElementById('sec-result');
const $secHistory  = document.getElementById('sec-history');

// Result Screen DOM refs
const $outWpm          = document.getElementById('out-wpm');
const $outGrossWpm     = document.getElementById('out-gross-wpm');
const $outAcc          = document.getElementById('out-acc');
const $outTime         = document.getElementById('out-time');
const $outTotalChars   = document.getElementById('out-total-chars');
const $outCorrectChars = document.getElementById('out-correct-chars');
const $outErrorChars   = document.getElementById('out-error-chars');
const $outTotalWords   = document.getElementById('out-total-words');

// History & Aggregate Stats DOM refs
const $tblBody     = document.getElementById('tbl-body');
const $emptyMsg    = document.getElementById('empty-history');
const $tblHistory  = document.getElementById('tbl-history');
const $bestWpm     = document.getElementById('best-wpm');
const $bestAcc     = document.getElementById('best-acc');
const $totalTests  = document.getElementById('total-tests');

// Control Buttons
const $btnTheme     = document.getElementById('btn-theme');
const $modalConfirm = document.getElementById('modal-confirm');

// ── Synthesizer Mechanical Keyboard Click Audio ──
function playClickSound() {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const now = audioCtx.currentTime;

        // Transient clack (triangle oscillator)
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(1100 + Math.random() * 300, now);
        clickGain.gain.setValueAtTime(0.05, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.03);

        // Body thock (sine oscillator)
        const thockOsc = audioCtx.createOscillator();
        const thockGain = audioCtx.createGain();
        thockOsc.type = 'sine';
        thockOsc.frequency.setValueAtTime(160 + Math.random() * 20, now);
        thockGain.gain.setValueAtTime(0.08, now);
        thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        thockOsc.connect(thockGain);
        thockGain.connect(audioCtx.destination);
        thockOsc.start(now);
        thockOsc.stop(now + 0.07);
    } catch {
        // Silently tolerate audio hardware restrictions
    }
}

// ── Word Generation ──
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickWords(n) {
    let pool = [];
    while (pool.length < n) {
        pool = pool.concat(shuffle(KATA));
    }
    let selected = pool.slice(0, n);

    if (numbersEnabled) {
        selected = selected.map(w => {
            if (Math.random() < 0.15) {
                return Math.floor(Math.random() * 100).toString();
            }
            return w;
        });
    }

    if (punctuationEnabled) {
        const puncts = ['.', ',', '?', '!'];
        selected = selected.map(w => {
            if (Math.random() < 0.15) {
                const p = puncts[Math.floor(Math.random() * puncts.length)];
                return w + p;
            }
            if (Math.random() < 0.08) {
                return w.charAt(0).toUpperCase() + w.slice(1);
            }
            return w;
        });
    }

    return selected;
}

// ── Append words dynamically to DOM ──
function appendWordsToDOM(words, startIndex) {
    const fragment = document.createDocumentFragment();
    words.forEach((word, idx) => {
        const wi = startIndex + idx;
        const wEl = document.createElement('span');
        wEl.className = 'word' + (wi === 0 ? ' current' : '');
        wEl.dataset.idx = wi;

        for (let li = 0; li < word.length; li++) {
            const s = document.createElement('span');
            s.className = 'letter' + (wi === 0 && li === 0 ? ' current' : '');
            s.textContent = word[li];
            wEl.appendChild(s);
        }
        fragment.appendChild(wEl);
    });
    $area.appendChild(fragment);
}

// ── Render Words from scratch ──
function renderWords() {
    $area.innerHTML = '';
    $area.scrollTop = 0;
    appendWordsToDOM(wordList, 0);
}

// ── Update active typing cursor indicator ──
function refreshCurrent() {
    const oldCurrent = $area.querySelector('.letter.current');
    if (oldCurrent) {
        oldCurrent.classList.remove('current');
    }

    const wordEl = $area.querySelector(`.word[data-idx="${wIdx}"]`);
    if (!wordEl) return;

    const letters = wordEl.querySelectorAll('.letter');
    if (lIdx < letters.length) {
        letters[lIdx].classList.add('current');
    }
}

// ── Layout-Safe Smooth Auto Scroll ──
function autoScroll() {
    const wordEl = $area.querySelector(`.word[data-idx="${wIdx}"]`);
    if (!wordEl) return;

    // Relative offset of the current word inside $area
    const wordRelativeTop = wordEl.offsetTop - $area.offsetTop;
    const computedLineHeight = parseFloat(getComputedStyle($area).lineHeight) || 40;

    // When typing reaches the 2nd line, keep the active line centered
    if (wordRelativeTop > computedLineHeight * 1.2) {
        $area.scrollTop = wordRelativeTop - computedLineHeight;
    } else {
        $area.scrollTop = 0;
    }
}

// ── Live Stats update ──
function updateLiveStats() {
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    const currentWpm = elapsed > 0.5 ? Math.max(0, Math.round((netCorrectChars / 5) / (elapsed / 60))) : 0;
    const currentAcc = totalKeystrokes > 0 ? Math.max(0, Math.round(((totalKeystrokes - totalErrors) / totalKeystrokes) * 100)) : 100;
    
    const $liveWpm = document.getElementById('live-wpm');
    const $liveAcc = document.getElementById('live-acc');
    if ($liveWpm) $liveWpm.textContent = `${currentWpm} WPM`;
    if ($liveAcc) $liveAcc.textContent = `${currentAcc}% ACC`;
}

// ── Timer & Clock Lifecycle ──
function startClock() {
    if (running) return;
    running = true;
    wpmRecords = [];
    startTime = Date.now();

    if (testMode === 'time') {
        $progressBar.style.transition = 'none';
        $progressBar.style.transform = 'scaleX(1)';
        void $progressBar.offsetHeight; // force reflow
        $progressBar.style.transition = `transform ${duration}s linear`;
        $progressBar.style.transform = 'scaleX(0)';

        intervalId = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeLeft = Math.max(0, duration - elapsed);
            $timer.textContent = timeLeft;

            if (elapsed > 0) {
                const currentWpm = Math.max(0, Math.round((netCorrectChars / 5) / (elapsed / 60)));
                wpmRecords.push(currentWpm);
            }
            if (timeLeft <= 0) {
                finish();
            }
        }, 1000);
    } else {
        $progressBar.style.transition = 'transform 0.15s ease-out';
        $progressBar.style.transform = 'scaleX(0)';

        intervalId = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0) {
                const currentWpm = Math.max(0, Math.round((netCorrectChars / 5) / (elapsed / 60)));
                wpmRecords.push(currentWpm);
            }
        }, 1000);
    }
}

// ── Draw high-DPI line chart on results screen ──
function drawChart() {
    const canvas = document.getElementById('chart-wpm');
    if (!canvas || !canvas.parentNode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.parentNode.getBoundingClientRect();
    const width = Math.max(rect.width - 32, 280);
    const height = 200;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (wpmRecords.length === 0) {
        ctx.restore();
        return;
    }
    
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = Math.max(10, width - paddingLeft - paddingRight);
    const chartHeight = Math.max(10, height - paddingTop - paddingBottom);
    
    const maxWpm = Math.max(...wpmRecords, 10);
    const minWpm = 0;
    const maxSec = wpmRecords.length;
    const divisor = Math.max(1, maxSec - 1);
    
    const computedStyle = getComputedStyle(document.body);
    const accentColor = computedStyle.getPropertyValue('--accent').trim() || '#e2b714';
    const textDim = computedStyle.getPropertyValue('--text-dim').trim() || '#5d5f63';
    const gridColor = computedStyle.getPropertyValue('--bg-tertiary').trim() || '#383a40';
    
    // Draw Grid Lines (Horizontal WPM values)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = '10px var(--font-ui)';
    ctx.fillStyle = textDim;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const gridRows = 4;
    for (let i = 0; i <= gridRows; i++) {
        const yVal = Math.round(minWpm + (maxWpm - minWpm) * (i / gridRows));
        const y = paddingTop + chartHeight - (i / gridRows) * chartHeight;
        
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();
        
        ctx.fillText(String(yVal), paddingLeft - 8, y);
    }
    
    // Draw Time Labels (Vertical Time ticks)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const gridCols = Math.min(maxSec, 8);
    for (let i = 0; i < gridCols; i++) {
        const secIdx = gridCols === 1 ? 0 : Math.floor((i / (gridCols - 1)) * (maxSec - 1));
        const secVal = secIdx + 1;
        const x = paddingLeft + (secIdx / divisor) * chartWidth;
        
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, paddingTop + chartHeight);
        ctx.stroke();
        
        ctx.fillText(secVal + 's', x, paddingTop + chartHeight + 6);
    }
    
    // Convert WPM plot to coordinates
    const points = wpmRecords.map((wpm, idx) => {
        const x = maxSec === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (idx / divisor) * chartWidth;
        const y = paddingTop + chartHeight - (wpm / maxWpm) * chartHeight;
        return { x, y };
    });
    
    // Fill Area under line (Gradient)
    ctx.beginPath();
    ctx.moveTo(points[0].x, paddingTop + chartHeight);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, paddingTop + chartHeight);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    gradient.addColorStop(0, 'rgba(226, 183, 20, 0.25)');
    gradient.addColorStop(1, 'rgba(226, 183, 20, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw WPM line
    ctx.beginPath();
    points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Draw Dots on data points
    ctx.fillStyle = accentColor;
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

// ── Test Completion ──
function finish() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    running = false;

    $progressBar.style.transition = 'none';
    $progressBar.style.transform = 'scaleX(0)';

    const rawElapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    const elapsedSeconds = Math.max(1, testMode === 'time' ? duration : rawElapsed);
    const mins = elapsedSeconds / 60;

    let netWpm = Math.round((netCorrectChars / 5) / mins);
    if (isNaN(netWpm) || !isFinite(netWpm) || netWpm < 0) netWpm = 0;

    let grossWpm = Math.round((totalKeystrokes / 5) / mins);
    if (isNaN(grossWpm) || !isFinite(grossWpm) || grossWpm < 0) grossWpm = 0;

    let acc = totalKeystrokes > 0 ? ((totalKeystrokes - totalErrors) / totalKeystrokes) * 100 : 100;
    acc = Math.max(0, Math.min(100, Math.round(acc)));

    // Update Result Panel
    $outWpm.textContent = String(netWpm);
    if ($outGrossWpm) $outGrossWpm.textContent = String(grossWpm);
    $outAcc.textContent = `${acc}%`;

    if ($outTime) $outTime.textContent = `${Math.round(elapsedSeconds)}s`;
    if ($outTotalChars) $outTotalChars.textContent = String(totalKeystrokes);
    if ($outCorrectChars) $outCorrectChars.textContent = String(netCorrectChars);
    if ($outErrorChars) $outErrorChars.textContent = String(totalErrors);
    if ($outTotalWords) $outTotalWords.textContent = String(Math.round(totalKeystrokes / 5));

    saveHistory(netWpm, acc, Math.round(elapsedSeconds), grossWpm);

    show('result');
    setTimeout(drawChart, 60);
}

// ── Reset Test ──
function reset() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    running = false;
    wIdx = 0;
    lIdx = 0;
    netCorrectChars = 0;
    totalKeystrokes = 0;
    totalErrors = 0;
    wpmRecords = [];
    startTime = null;

    if (testMode === 'time') {
        timeLeft = duration;
        $timer.textContent = String(timeLeft);
        $progressBar.style.transition = 'none';
        $progressBar.style.transform = 'scaleX(1)';
    } else {
        $timer.textContent = `0/${wordLimit}`;
        $progressBar.style.transition = 'none';
        $progressBar.style.transform = 'scaleX(0)';
    }

    // Reset Live Stats
    const $liveWpm = document.getElementById('live-wpm');
    const $liveAcc = document.getElementById('live-acc');
    if ($liveWpm) $liveWpm.textContent = '0 WPM';
    if ($liveAcc) $liveAcc.textContent = '100% ACC';

    const count = testMode === 'time' ? 100 : wordLimit;
    wordList = pickWords(count);
    renderWords();
    show('test');
    
    if ($input) {
        $input.value = '';
        $input.focus();
    }
}

// ── Toggle View ──
function show(name) {
    $secTest.classList.toggle('hidden', name !== 'test');
    $secResult.classList.toggle('hidden', name !== 'result');
    $secHistory.classList.toggle('hidden', name !== 'history');
}

// ── Keydown Event Handler ──
function onKey(e) {
    // Only capture keys when test view is active and modal is closed
    if ($secTest.classList.contains('hidden')) return;
    if (!$modalConfirm.classList.contains('hidden')) return;

    // Check Ctrl + Backspace to clear active word
    if ((e.ctrlKey || e.altKey || e.metaKey) && e.key === 'Backspace') {
        e.preventDefault();
        const wordEl = $area.querySelector(`.word[data-idx="${wIdx}"]`);
        if (!wordEl) return;
        
        const letters = wordEl.querySelectorAll('.letter');
        letters.forEach(letter => {
            if (letter.classList.contains('extra')) {
                letter.remove();
            } else {
                if (letter.classList.contains('correct')) netCorrectChars--;
                letter.classList.remove('correct', 'incorrect');
            }
        });
        lIdx = 0;
        refreshCurrent();
        updateLiveStats();
        return;
    }

    // Ignore other modifier combinations
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key;

    // Filter non-printable keys (except Backspace)
    if (key !== 'Backspace' && (key.length !== 1)) return;
    if (key === ' ') e.preventDefault();

    startClock();
    playClickSound();

    const wordEl = $area.querySelector(`.word[data-idx="${wIdx}"]`);
    if (!wordEl) return;

    // ── Backspace ──
    if (key === 'Backspace') {
        if (lIdx > 0) {
            lIdx--;
            const letters = wordEl.querySelectorAll('.letter');
            const target = letters[lIdx];
            if (!target) return;

            if (target.classList.contains('extra')) {
                target.remove();
            } else {
                if (target.classList.contains('correct')) {
                    netCorrectChars--;
                }
                target.classList.remove('correct', 'incorrect');
            }
            refreshCurrent();
            updateLiveStats();
        }
        return;
    }

    // ── Spacebar (Word delimiter) ──
    if (key === ' ') {
        // Disallow space if no characters have been typed yet in this word
        if (lIdx === 0) return;

        totalKeystrokes++;

        const letters = wordEl.querySelectorAll('.letter');
        const hasError = Array.from(letters).some(l =>
            !l.classList.contains('correct') || l.classList.contains('extra')
        );
        const isIncomplete = lIdx < letters.length;

        if (hasError || isIncomplete) {
            wordEl.classList.add('typed-error');
            totalErrors++; // Space on incorrect or incomplete word counts as error
        } else {
            // Space pressed after flawless word counts as a correct keystroke
            netCorrectChars++;
        }

        wordEl.classList.remove('current');
        wIdx++;
        lIdx = 0;

        // In time mode, continuously append words if nearing the buffer limit
        if (testMode === 'time' && wIdx >= wordList.length - 20) {
            const moreWords = pickWords(40);
            const oldLength = wordList.length;
            wordList = wordList.concat(moreWords);
            appendWordsToDOM(moreWords, oldLength);
        }

        if (testMode === 'words') {
            $timer.textContent = `${wIdx}/${wordLimit}`;
            $progressBar.style.transform = `scaleX(${Math.min(1, wIdx / wordLimit)})`;
        }

        const nextWord = $area.querySelector(`.word[data-idx="${wIdx}"]`);
        if (!nextWord || (testMode === 'words' && wIdx >= wordLimit)) {
            finish();
            return;
        }

        nextWord.classList.add('current');
        refreshCurrent();
        autoScroll();
        updateLiveStats();
        return;
    }

    // ── Regular Character Typing ──
    totalKeystrokes++;
    const letters = wordEl.querySelectorAll('.letter');

    if (lIdx < letters.length) {
        const target = letters[lIdx];
        if (key === target.textContent) {
            target.classList.add('correct');
            netCorrectChars++;
        } else {
            target.classList.add('incorrect');
            totalErrors++;
        }
        lIdx++;
    } else {
        // Typing extra characters beyond the word length
        const extra = document.createElement('span');
        extra.className = 'letter incorrect extra';
        extra.textContent = key;
        wordEl.appendChild(extra);
        lIdx++;
        totalErrors++;
    }

    refreshCurrent();
    updateLiveStats();
}

// ── Safe LocalStorage & History Management ──
function getStoredHistory() {
    try {
        const raw = localStorage.getItem('ketikcepat_history');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveHistory(wpm, acc, dur, grossWpm = 0) {
    const list = getStoredHistory();
    const newEntry = {
        date: new Date().toLocaleString('id-ID', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
        wpm: Number(wpm) || 0,
        acc: Number(acc) || 0,
        dur: Number(dur) || 0
    };
    list.unshift(newEntry);
    if (list.length > 100) list.length = 100;

    try {
        localStorage.setItem('ketikcepat_history', JSON.stringify(list));
    } catch (e) {
        console.warn('LocalStorage save failed:', e);
    }

    // Asynchronous background sync to server database if available
    try {
        fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clean_wpm: wpm,
                raw_wpm: grossWpm || wpm,
                accuracy: acc,
                correct_chars: netCorrectChars,
                incorrect_chars: totalErrors,
                duration: dur,
                word_count: Math.round(totalKeystrokes / 5)
            })
        }).catch(() => {
            // Gracefully ignore network errors when running static/offline
        });
    } catch {
        // Offline environment safe
    }

    renderHistory();
}

function renderHistory() {
    const list = getStoredHistory();
    $tblBody.innerHTML = '';

    if (list.length === 0) {
        $tblHistory.classList.add('hidden');
        $emptyMsg.classList.remove('hidden');
        
        $bestWpm.textContent = '0';
        $bestAcc.textContent = '0%';
        $totalTests.textContent = '0';
        return;
    }

    $tblHistory.classList.remove('hidden');
    $emptyMsg.classList.add('hidden');

    let maxWpm = 0;
    let maxAcc = 0;

    const fragment = document.createDocumentFragment();
    list.forEach(item => {
        const itemWpm = Number(item.wpm) || 0;
        const itemAcc = Number(item.acc) || 0;
        const itemDur = Number(item.dur) || 0;
        const itemDate = String(item.date || '-');

        if (itemWpm > maxWpm) maxWpm = itemWpm;
        if (itemAcc > maxAcc) maxAcc = itemAcc;

        const tr = document.createElement('tr');
        
        const tdDate = document.createElement('td');
        tdDate.textContent = itemDate;

        const tdWpm = document.createElement('td');
        tdWpm.className = 'wpm-cell';
        tdWpm.textContent = String(itemWpm);

        const tdAcc = document.createElement('td');
        tdAcc.textContent = `${itemAcc}%`;

        const tdDur = document.createElement('td');
        tdDur.textContent = `${itemDur} detik`;

        tr.appendChild(tdDate);
        tr.appendChild(tdWpm);
        tr.appendChild(tdAcc);
        tr.appendChild(tdDur);

        fragment.appendChild(tr);
    });

    $tblBody.appendChild(fragment);

    $bestWpm.textContent = String(maxWpm);
    $bestAcc.textContent = `${maxAcc}%`;
    $totalTests.textContent = String(list.length);
}

// ── Global Keyboard Shortcuts ──
function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Tab = Quick Restart
        if (e.key === 'Tab') {
            if (!$secTest.classList.contains('hidden')) {
                e.preventDefault();
                reset();
            }
        }
        // Enter = Play Again from result screen
        else if (e.key === 'Enter') {
            if (!$secResult.classList.contains('hidden')) {
                e.preventDefault();
                reset();
            }
        }
        // Esc = Cancel / reset running test or close modals
        else if (e.key === 'Escape') {
            if (!$modalConfirm.classList.contains('hidden')) {
                $modalConfirm.classList.add('hidden');
            } else if (running) {
                e.preventDefault();
                reset();
            }
        }
    });
}

// ── Theme Management ──
function initTheme() {
    let savedTheme = 'dark';
    try {
        savedTheme = localStorage.getItem('ketikcepat_theme') || 'dark';
    } catch {
        savedTheme = 'dark';
    }

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        $btnTheme.innerHTML = SUN_ICON;
    } else {
        document.body.classList.remove('light-mode');
        $btnTheme.innerHTML = MOON_ICON;
    }

    $btnTheme.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-mode');
        try {
            localStorage.setItem('ketikcepat_theme', isLight ? 'light' : 'dark');
        } catch {
            // Ignore
        }
        $btnTheme.innerHTML = isLight ? SUN_ICON : MOON_ICON;

        if (!$secResult.classList.contains('hidden')) {
            drawChart();
        }
    });
}

// ── Share Result Handler ──
function setupShare() {
    const $btnShare = document.getElementById('btn-share');
    if (!$btnShare) return;

    $btnShare.addEventListener('click', () => {
        const modeLabel   = testMode === 'time' ? `${duration} detik` : `${wordLimit} kata`;
        const wpm         = $outWpm ? $outWpm.textContent : '0';
        const grossWpm    = $outGrossWpm ? $outGrossWpm.textContent : '-';
        const acc         = $outAcc ? $outAcc.textContent : '0%';
        const time        = $outTime ? $outTime.textContent : '-';
        const benar       = $outCorrectChars ? $outCorrectChars.textContent : '-';
        const salah       = $outErrorChars ? $outErrorChars.textContent : '-';
        const totalChar   = $outTotalChars ? $outTotalChars.textContent : '-';

        const shareText = [
            '━━━━━━━━━━━━━━━━━━━━',
            '  KetikCepat — Hasil Tes Mengetik',
            '━━━━━━━━━━━━━━━━━━━━',
            `  Mode         : ${modeLabel}`,
            `  WPM Bersih   : ${wpm}`,
            `  WPM Kotor    : ${grossWpm}`,
            `  Akurasi      : ${acc}`,
            `  Waktu        : ${time}`,
            `  Benar / Salah: ${benar} / ${salah} (dari ${totalChar} karakter)`,
            '━━━━━━━━━━━━━━━━━━━━',
        ].join('\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    const $label = $btnShare.querySelector('.share-label');
                    if ($label) {
                        const originalLabel = $label.textContent;
                        $label.textContent = 'Tersalin!';
                        $btnShare.classList.add('copied');
                        setTimeout(() => {
                            $label.textContent = originalLabel;
                            $btnShare.classList.remove('copied');
                        }, 2000);
                    }
                })
                .catch(() => {
                    alert('Gagal menyalin otomatis — silakan salin teks hasil secara manual.');
                });
        }
    });
}

// ── Settings Loader ──
function loadSettings() {
    try {
        soundEnabled = localStorage.getItem('ketikcepat_sound') !== 'false';
        punctuationEnabled = localStorage.getItem('ketikcepat_punc') === 'true';
        numbersEnabled = localStorage.getItem('ketikcepat_num') === 'true';
    } catch {
        soundEnabled = true;
        punctuationEnabled = false;
        numbersEnabled = false;
    }

    const $btnSound = document.getElementById('btn-sound');
    if ($btnSound) {
        $btnSound.classList.toggle('active', soundEnabled);
        $btnSound.setAttribute('aria-pressed', String(soundEnabled));
    }

    const $btnPunc = document.getElementById('btn-punctuation');
    if ($btnPunc) {
        $btnPunc.classList.toggle('active', punctuationEnabled);
        $btnPunc.setAttribute('aria-pressed', String(punctuationEnabled));
    }

    const $btnNum = document.getElementById('btn-numbers');
    if ($btnNum) {
        $btnNum.classList.toggle('active', numbersEnabled);
        $btnNum.setAttribute('aria-pressed', String(numbersEnabled));
    }
}

// ── Modal Handlers ──
function setupModal() {
    const $btnClear = document.getElementById('btn-clear-history');
    const $btnCancel = document.getElementById('btn-confirm-cancel');
    const $btnOk = document.getElementById('btn-confirm-ok');
    const $overlay = document.getElementById('confirm-overlay');

    if ($btnClear) {
        $btnClear.addEventListener('click', () => {
            $modalConfirm.classList.remove('hidden');
        });
    }

    const hideModal = () => $modalConfirm.classList.add('hidden');

    if ($btnCancel) $btnCancel.addEventListener('click', hideModal);
    if ($overlay) $overlay.addEventListener('click', hideModal);

    if ($btnOk) {
        $btnOk.addEventListener('click', () => {
            try {
                localStorage.removeItem('ketikcepat_history');
            } catch {
                // Ignore
            }
            try {
                fetch('/api/results', { method: 'DELETE' }).catch(() => {});
            } catch {
                // Ignore
            }
            renderHistory();
            hideModal();
        });
    }
}

// ── Event Bindings ──
function setupEvents() {
    // Mode selector click handler
    document.querySelectorAll('#mode-selector .mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#mode-selector .mode-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            testMode = btn.dataset.mode;
            
            const timeOptions = document.getElementById('time-options');
            const wordOptions = document.getElementById('word-options');
            
            if (testMode === 'time') {
                if (timeOptions) timeOptions.classList.remove('hidden');
                if (wordOptions) wordOptions.classList.add('hidden');
            } else {
                if (timeOptions) timeOptions.classList.add('hidden');
                if (wordOptions) wordOptions.classList.remove('hidden');
            }
            reset();
        });
    });

    // Time option select handler
    document.querySelectorAll('#time-options .opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#time-options .opt-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            duration = parseInt(btn.dataset.val, 10) || 30;
            reset();
        });
    });

    // Word option select handler
    document.querySelectorAll('#word-options .opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#word-options .opt-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            wordLimit = parseInt(btn.dataset.val, 10) || 25;
            reset();
        });
    });

    // Toggle punctuation
    const $btnPunc = document.getElementById('btn-punctuation');
    if ($btnPunc) {
        $btnPunc.addEventListener('click', () => {
            punctuationEnabled = $btnPunc.classList.toggle('active');
            $btnPunc.setAttribute('aria-pressed', String(punctuationEnabled));
            try {
                localStorage.setItem('ketikcepat_punc', punctuationEnabled);
            } catch {}
            reset();
        });
    }

    // Toggle numbers
    const $btnNum = document.getElementById('btn-numbers');
    if ($btnNum) {
        $btnNum.addEventListener('click', () => {
            numbersEnabled = $btnNum.classList.toggle('active');
            $btnNum.setAttribute('aria-pressed', String(numbersEnabled));
            try {
                localStorage.setItem('ketikcepat_num', numbersEnabled);
            } catch {}
            reset();
        });
    }

    // Toggle sound
    const $btnSound = document.getElementById('btn-sound');
    if ($btnSound) {
        $btnSound.addEventListener('click', () => {
            soundEnabled = $btnSound.classList.toggle('active');
            $btnSound.setAttribute('aria-pressed', String(soundEnabled));
            try {
                localStorage.setItem('ketikcepat_sound', soundEnabled);
            } catch {}
        });
    }

    // Restart and Play Again buttons
    const $btnRestart = document.getElementById('btn-restart');
    if ($btnRestart) $btnRestart.addEventListener('click', reset);

    const $btnNext = document.getElementById('btn-next');
    if ($btnNext) $btnNext.addEventListener('click', reset);

    // Show history
    const $btnHistory = document.getElementById('btn-history');
    if ($btnHistory) {
        $btnHistory.addEventListener('click', () => {
            reset();
            renderHistory();
            show('history');
        });
    }

    // Close history
    const $btnCloseHist = document.getElementById('btn-close-history');
    if ($btnCloseHist) {
        $btnCloseHist.addEventListener('click', () => {
            if (running || timeLeft === duration) {
                show('test');
                if ($input) $input.focus();
            } else {
                show('result');
            }
        });
    }

    // Window resize handler for responsive chart rendering
    window.addEventListener('resize', () => {
        if (!$secResult.classList.contains('hidden')) {
            drawChart();
        }
    });
}

// ── Application Initialization ──
function init() {
    document.addEventListener('keydown', onKey);
    if ($area && $input) {
        $area.addEventListener('click', () => $input.focus());
    }

    setupEvents();
    initTheme();
    loadSettings();
    setupShortcuts();
    setupShare();
    setupModal();
    
    reset();
    renderHistory();
}

document.addEventListener('DOMContentLoaded', init);
