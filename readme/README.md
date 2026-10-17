# KetikCepat — Tes Kecepatan Mengetik Bahasa Indonesia

Aplikasi web modern, presisi, dan responsif untuk mengukur kecepatan serta akurasi mengetik dalam bahasa Indonesia dengan standar internasional (5 karakter per kata, termasuk spasi pemisah).

---

## 📁 Struktur Direktori & Organisasi File

Setiap komponen aplikasi telah diorganisir ke dalam foldernya masing-masing untuk kemudahan pengelolaan dan pemeliharaan:

```text
TYPINGTOP/
├── css/
│   └── style.css            # Desain antarmuka, tema Gelap & Terang, responsif
├── js/
│   └── app.js               # Mesin pengetikan, penghitungan WPM, audio, grafik
├── readme/
│   └── README.md            # Dokumentasi lengkap & panduan teknis aplikasi
├── data/
│   └── typing_results.json  # Penyimpanan data persisten lokal backend
├── index.html               # Halaman utama aplikasi (HTML5 semantik & aksesibel)
├── server.js                # Server backend Express & API endpoint
├── package.json             # Konfigurasi dependensi Node.js
└── README.md                # Tautan ringkas dokumentasi proyek
```

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini dirancang fleksibel dan dapat dijalankan dengan beberapa metode:

### 1. Menggunakan Visual Studio Code Live Server (Rekomendasi Frontend)
1. Buka folder proyek ini di VS Code.
2. Klik kanan pada file [index.html](file:///c:/Users/Keith%20Matthew%20Handra/Downloads/VSCODE/'Hello%20World'/VS.CODE/TYPINGTOP/index.html).
3. Pilih **"Open with Live Server"**.
4. Aplikasi akan otomatis terbuka di browser pada alamat `http://127.0.0.1:5500`.

### 2. Menggunakan Server Node.js (Fullstack + API Persistence)
1. Pastikan dependensi telah terinstal:
   ```bash
   npm install
   ```
2. Jalankan server:
   ```bash
   npm start
   ```
3. Buka browser dan akses: `http://localhost:3000`.

---

## ⚙️ Formula Metrik Pengetikan

KetikCepat menerapkan standar industri pengetikan untuk menjamin akurasi hasil:

1. **WPM Bersih (Net WPM)**:
   $$\text{Net WPM} = \max\left(0, \frac{\text{Karakter Benar} / 5}{\text{Waktu (menit)}}\right)$$
2. **WPM Kotor (Gross/Raw WPM)**:
   $$\text{Gross WPM} = \max\left(0, \frac{\text{Total Keystrokes} / 5}{\text{Waktu (menit)}}\right)$$
3. **Akurasi (%)**:
   $$\text{Akurasi} = \frac{\text{Total Keystrokes} - \text{Total Kesalahan}}{\text{Total Keystrokes}} \times 100\%$$

*Catatan*:
- Spasi pemisah kata dihitung sebagai 1 keystroke valid jika kata sebelumnya diketik dengan benar.
- Menghapus karakter salah dengan Backspace memperbaiki teks aktif di layar, namun riwayat kesalahan pengetikan tetap dicatat secara akurat agar persentase akurasi mencerminkan performa mengetik yang sebenarnya.

---

## ⌨️ Pintasan Keyboard (Shortcuts)

| Tombol | Fungsi |
|---|---|
| <kbd>Tab</kbd> | Mulai ulang tes dengan kata-kata baru |
| <kbd>Enter</kbd> | Main lagi langsung dari layar hasil |
| <kbd>Esc</kbd> | Batalkan tes berjalan / tutup dialog konfirmasi |
| <kbd>Ctrl</kbd> + <kbd>Backspace</kbd> | Hapus seluruh kata yang sedang aktif diketik |

---

## 🛠️ Fitur Unggulan

- **Mesin Suara Mekanikal**: Menggunakan Web Audio API berbasis osilator sintesis real-time tanpa file audio eksternal.
- **Grafik Interaktif Canvas**: Menampilkan grafik kecepatan (WPM per detik) dengan resolusi tinggi (High-DPI / Retina support).
- **Manajemen Riwayat & Best Stats**: Penyimpanan otomatis di `localStorage` dengan penanganan error aman serta sinkronisasi opsional ke API server.
- **Tema Terang & Gelap**: Kontras tinggi, nyaman di mata, dan preferensi tersimpan otomatis.
