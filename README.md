# ZAIN.NET — Skripsi Jadi Artikel • Scrib Article AI Lokal

Aplikasi GitHub Pages statis untuk membaca file skripsi `.docx` dan menyusun draft artikel ilmiah **secara ekstraktif** tanpa API token.

## Pola artikel yang ditanamkan
Versi ini dibuat berdasarkan pasangan contoh yang diberikan pengguna: `SKRIPSI_YUNUS.docx` → `Artikel_Moh. Andi Yunus.docx`.
Pola default **Mirip Contoh Anda** menargetkan kira-kira:
- Abstrak: ±350 kata, diambil utuh dari skripsi
- Pendahuluan: ±750 kata dari Konteks/Latar Belakang
- Metode Penelitian: ±400 kata, prioritas Pendekatan/Jenis, Kehadiran, Lokasi, Sumber/Pengumpulan/Analisis Data
- Pembahasan: ±1.200 kata, memprioritaskan bagian Pembahasan dan subtopik/fokus penelitian
- Kesimpulan + Saran: ±500 kata
- Daftar Pustaka: ±15 referensi paling relevan

## Scrib Article AI Lokal
Bukan LLM cloud dan bukan API Gemini/OpenAI. Mesin lokal melakukan:
1. Membaca seluruh XML DOCX.
2. Deteksi judul, penulis, prodi, universitas dan struktur BAB.
3. TF-IDF sederhana untuk kata kunci seluruh skripsi.
4. Scoring paragraf berdasarkan relevansi, posisi, panjang, kata temuan/metode, dan konteks section.
5. Ekstraksi teks asli (bukan menulis ulang).
6. Membuat DOCX baru dari blok XML sumber agar format kaya/footnote pada blok terpilih dapat dipertahankan sebanyak mungkin.

## Privasi
Semua proses berlangsung di browser. Tidak ada API token dan isi skripsi tidak dikirim ke server aplikasi.

## Batasan penting
- Hasil adalah **draft artikel** dan tetap perlu review manusia.
- Struktur skripsi yang sangat tidak lazim dapat memerlukan penyesuaian manual.
- Sistem tidak mengarang hasil penelitian yang tidak ada di skripsi.
- Karena ekstraktif, kesalahan yang memang sudah ada pada teks skripsi dapat ikut terbawa dan perlu diperiksa.

## GitHub Pages
Tidak butuh npm/Vite/backend. Upload semua file di folder ini langsung ke root repository GitHub.
