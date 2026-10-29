# Product Requirements — Ayah Bercerita

**Versi:** 1.0 · **Tanggal:** 29 Oktober 2026 · **Domain:** `ayahbercerita.my.id` · **Status:** Brief implementasi

## 1. Ringkasan
Ayah Bercerita adalah rumah digital untuk video edukasi singkat yang menggabungkan (a) cerita untuk anak dan kegiatan ayah–anak, serta (b) refleksi khusus ayah tentang pendidikan dan pengasuhan. Video utama dipublikasikan pada YouTube dan dimunculkan otomatis pada website melalui sinkronisasi metadata, tanpa pengisian video satu per satu.

**Brand promise:** Cerita kecil, ilmu baru, kebersamaan yang bermakna.

## 2. Tujuan pengguna
1. Orang tua menemukan video sesuai usia, tema, dan kebutuhan.
2. Anak menonton dengan pendampingan dan terdorong mengamati, bertanya, atau mencoba.
3. Ayah menemukan refleksi praktis, bukan ceramah panjang.
4. Pengunjung dapat menonton di website atau membuka video resmi di YouTube.

## 3. Persona
- **Ayah sibuk (25–45 tahun):** mencari video ±1 menit dan satu ide interaksi untuk hari ini.
- **Keluarga dengan anak 4–10 tahun:** mencari video bertema agama, sains, adab, sosial, atau aktivitas; perkembangan tidak dibatasi usia secara kaku.
- **Pendidik/pendamping:** membutuhkan topik dan pertanyaan pemantik yang mudah digunakan.

## 4. Editorial channel
**Jalur 1 — Cerita untuk Kita:** tauhid, ibadah, adab, kisah sahih, sains, alam, sosial-emosi, numerasi, aktivitas.
**Jalur 2 — Catatan Ayah:** perkembangan anak, respons pengasuhan, komunikasi, disiplin responsif, pendidikan Islam, refleksi dan tazkiyatun nafs.

Aturan: verifikasi dalil/hadis, akurasi ilmiah, bahasa natural, tidak mendiagnosis dari satu perilaku, dan aktivitas aman. Pertanyaan/aktivitas tambahan **hanya** ditampilkan jika sudah disunting oleh tim editorial.

## 5. Ruang lingkup MVP
### In scope
- Beranda dengan hero, jalur audiens, topik, video terbaru, CTA YouTube.
- Katalog `/video`: pencarian judul, filter audiens dan topik, sort terbaru, pagination/load more.
- `/cerita-anak` dan `/catatan-ayah`: landing playlist berdasarkan audiens.
- `/video/[slug]`: YouTube embed atas interaksi, judul, deskripsi, metadata, video terkait.
- `/tentang`, `/privasi`, halaman 404.
- Sinkronisasi video publik otomatis dan fallback cache terakhir.
- Metadata editorial opsional dalam berkas Markdown/JSON.
- SEO, sitemap, OpenGraph, responsif, aksesibilitas dasar, analytics ringan.

### Out of scope
Login, akun anak, komentar internal, CMS, database relasional, upload file video, AI recommendation engine, pembayaran, gamifikasi.

## 6. Sitemap
```
/
├── /video
│   └── /video/[slug]
├── /cerita-anak
├── /catatan-ayah
├── /tentang
├── /privasi
└── /404
```
Navigasi utama: Beranda · Jelajahi Video · Cerita Anak · Catatan Ayah · Tentang. CTA eksternal: YouTube.

## 7. User journeys
**Penemuan cepat:** Beranda → pilih Sains → daftar tersaring → detail → tonton → ajak anak mencoba.
**Refleksi ayah:** Beranda → Catatan Ayah → lihat tema → pilih video → satu tindakan reflektif.
**Penelusuran:** /video → cari judul → filter Anak/Ayah → detail video → video terkait.
**Publikasi:** uploader mempublikasikan video di YouTube → sync job → cache diperbarui → build/deploy → video muncul otomatis.

## 8. Non-functional requirements
- Mobile-first; interaksi sentuh setidaknya sekitar 44 × 44 px.
- Tidak memutar video otomatis; iframe hanya dimuat setelah klik.
- API key YouTube tetap di server/CI, tidak masuk ke client bundle.
- Aksesibilitas keyboard dan kontras warna WCAG AA untuk teks penting.
- Server tidak menyimpan salinan file video YouTube.
- Jika sinkronisasi gagal, website tetap memakai katalog sukses terakhir.
- Kategori yang tidak diketahui diberi label netral, bukan dibuat-buat.

## 9. Acceptance criteria
- Halaman beranda, katalog, detail, dan halaman tematik berfungsi pada ponsel serta desktop.
- Video publik terbaru terbit setelah sync + deployment sukses, tanpa edit manual.
- Katalog tidak kosong ketika API gagal sementara jika cache sukses ada.
- Playlist YouTube menentukan jalur/kategori; metadata manual boleh melengkapi.
- Slug stabil dan unik; video dihapus ditangani dengan status tidak tersedia.
- Search/filter bekerja tanpa memanggil API pada tiap ketikan.
- Tidak ada konten pedagogis fiktif.

## 10. Fase
**Fase 1:** desain komponen + mock data + shell navigasi.
**Fase 2:** sinkronisasi YouTube + cache JSON + halaman video.
**Fase 3:** enrich metadata editorial, SEO, quality checks.
**Fase 4:** rilis dan evaluasi pengukuran (retensi, search terms, klik YouTube, umpan balik keluarga).

## 11. Keputusan tertunda
- URL/ID channel YouTube yang belum dibuat.
- Logo final dan aset SVG resmi.
- Platform hosting final (Netlify, Cloudflare Pages, atau Vercel).
- Playlist definitif dan editorial metadata episode awal.
