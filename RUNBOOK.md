# Ceria Kids Story — produksi Shorts harian

Panduan untuk sesi terjadwal harian. Ikuti urutannya. Bahasa video: Indonesia, untuk anak 2–6 tahun.

## 0. Persiapan
- Repo ini berisi proyek Remotion (`src/`), contoh lengkap `src/tooth/` (video sikat gigi), `topics.json`, dan skrip.
- `npm ci`. Chrome untuk render: `--browser-executable` ke chrome-headless-shell yang terpasang (cari di `/opt/pw-browsers`), karena unduhan Chrome Remotion diblokir.
- Font: `public/fredoka-latin-*.woff2` (sudah ada).

## 1. Pilih topik
- Ambil item pertama dari `topics.json > queue`. Jika antrean kosong, tambahkan 7 topik baru (kebiasaan baik/kesehatan/sopan santun anak, aman, positif) lalu ambil yang pertama.

## 2. Buat video (pola yang sama dengan `src/tooth/`)
Struktur 4 adegan, 14 detik, 1080×1920, 30 fps:
1. **Masalah**: tokoh utama sedih + judul pertanyaan besar.
2. **Penyebab**: tokoh/situasi lucu yang bikin masalah.
3. **Aksi**: anak (karakter orisinal channel: anak perempuan rambut cepol dua, kaos oranye) melakukan kebiasaan baiknya.
4. **Bahagia**: tokoh senang + ajakan besar (pesan topik).
- Tulis lirik orisinal 4 baris × 8 suku kata; buat `src/<slug>/song.json` (salin bentuk `src/cuci-tangan/song.json`) dan sintesis musik dengan pola `scripts/synth_cuci_tangan.py` (melodi baru, efek suara sesuai adegan) → `public/<slug>_music.wav`.
- **Vokal anak bernyanyi (wajib sejak 18 Nov 2026):** suara anak SINTETIS (bukan rekaman/kloning suara orang sungguhan).
  - `apt-get install -y espeak-ng` dan `pip install --break-system-packages pyworld scipy` (pasang tiap sesi).
  - `python3 scripts/sing.py src/<slug>/song.json public/<slug>_vocal.wav` — tiap suku kata diucapkan espeak-ng (Indonesia), nada dikunci ke melodi `notes`, formant dinaikkan agar terdengar seperti anak kecil.
  - Tulis suku kata sesuai bunyi bahasa Indonesia (mis. `"nyum"`, bukan singkatan); hindari angka/simbol di `syll`.
  - Gabungkan: `ffmpeg -i public/<slug>_music.wav -i public/<slug>_vocal.wav -filter_complex "[0:a]volume=0.55[m];[1:a]volume=0.9[v];[m][v]amix=inputs=2:normalize=0,alimiter=limit=0.89[o]" -map "[o]" public/<slug>_song.wav`, lalu pakai `<slug>_song.wav` di `<Audio>`.
  - Cek nada vokal: ukur f0 per nada (pyworld.harvest), median selisih < 0,5 semitone dan tidak ada nada yang hilang. Jika espeak-ng tidak bisa dipasang, berhenti dan laporkan (jangan unggah tanpa vokal).
- Buat komponen `src/<slug>/Video.tsx` dengan karakter SVG orisinal, daftarkan di `src/Root.tsx`.
- Aturan isi: tidak ada karakter/merek berhak cipta, tidak ada lirik lagu orang lain, tidak ada wajah orang asli, pesan aman untuk anak.

## 3. Periksa sebelum render penuh
- Render still pada 4 frame kunci, lihat hasilnya; perbaiki tumpang tindih teks/karakter.
- Render: `npx remotion render <Id> out/<tanggal>-<slug>.mp4 --codec=h264 --crf=20`. Target ≤ 15 MB.
- Cek audio (`volumedetect`, max sekitar −1 dB; vokal harus terdengar jelas di atas musik) dan beberapa frame dari MP4 jadi.
- Deskripsi YouTube: tambahkan baris "Suara nyanyian dibuat secara sintetis." (transparansi konten buatan).

## 4. Simpan ke repo
- Salin MP4 ke `videos/<tanggal>-<slug>.mp4`, commit + push (repo publik, agar halaman YouTube Studio bisa mengunduhnya lewat raw.githubusercontent.com).

## 5. Upload ke YouTube (browser bawaan, akun channel Ceria Kids Story)
1. Buka `https://studio.youtube.com`, klik **Upload video**.
2. Jalankan `scripts/inject-upload.js` lewat javascript_tool (ganti `__VIDEO_URL__` dengan URL raw GitHub dan `__FILE_NAME__`). Jangan klik "Pilih file".
3. Riset kata kunci dulu: buka `youtube.com/results?search_query=lagu+<topik>` dan baca judul video teratas; ketik `lagu <topik>`, `kartun <topik>` di kotak cari YouTube dan catat saran pencariannya.
4. Isi dengan KETIKAN keyboard sungguhan (computer type). `execCommand`/mengubah DOM lewat JS TIDAK tersimpan oleh formulir Studio. JANGAN tekan Escape di dialog upload (menutupnya); jangan pakai tagar di judul (memicu saran otomatis). Verifikasi dengan memuat ulang halaman edit setelah Simpan.
   - Judul: mulai dengan kata kunci yang paling dicari, contoh `Lagu Sikat Gigi untuk Anak 🦷 Gigi Menangis Diserang Kuman! | Kartun Gigi | Lagu Anak Balita` (≤ 100 karakter).
   - Deskripsi: kalimat pertama memuat kata kunci utama; sebut "balita, PAUD, TK"; lirik; tips untuk Ayah & Bunda; ajakan subscribe; tagar `#lagu<topik> #laguanak #kartunanak #laguanakbalita #animasianak #shorts`.
   - Tag (Tampilkan lebih banyak → Tag): 15–18 tag dari riset (mis. "lagu <topik> untuk anak", "lagu <topik> untuk anak tk", "kartun <topik>", "lagu anak balita terbaru <tahun>", "lagu anak paud"), ketik dipisah koma lalu Enter.
   - Bahasa video & bahasa judul: Indonesia. Kategori: Pendidikan.
   - Playlist: **Lagu Anak Kebiasaan Baik 🎵 Ceria Kids Story** (sudah ada).
   - Audiens: **Ya, dibuat untuk Anak-Anak**.
5. Visibilitas: **Jadwalkan** pada jam tayang di bawah (zona Asia/Jakarta). Jangan publikasikan langsung.

## 6. Jam tayang
- Senin–Jumat: **17.00 WIB** (setelah pulang sekolah/kerja, waktu anak menonton bersama orang tua).
- Sabtu–Minggu: **09.00 WIB**.
- Mulai bulan kedua: buka Studio → Analytics → Audiens → "Kapan penonton Anda ada di YouTube". Jika sudah ada data, pakai jam tersibuk ±1 jam dan catat perubahan di sini.

## 7. Laporan
- Pindahkan topik ke `done` (tanggal, judul, link, jam tayang), commit + push.
- Kirim ringkasan singkat ke pemilik: judul, link, jam tayang terjadwal, dan pengingat bahwa video bisa dicek/dibatalkan di Studio sebelum jam tayang.
- Jika ada langkah gagal (render, push, upload, browser offline), jangan mengakali; laporkan langkah yang gagal dan berhenti.
