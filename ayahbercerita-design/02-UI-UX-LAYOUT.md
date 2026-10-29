# UI/UX Layout Specification — Ayah Bercerita

## 1. Desain produk
Mood: hangat, tenang, natural, pedagogis, tidak ramai, anti AI-slop. Jangan gunakan ilustrasi manusia/hewan, ornamen bulan-bintang/kaligrafi, efek glow, gradient berlebihan, atau objek tidak terkait konteks. Visual dibuat dari benda nyata, sains, lingkungan rumah, dan bentuk editorial minimal.

## 2. Design tokens
| Token | Value | Kegunaan |
|---|---|---|
| `--forest` | `#28594E` | brand, heading, primary CTA |
| `--sage` | `#83A998` | aksen anak / surface |
| `--cream` | `#F5F0E5` | dasar hangat |
| `--amber` | `#D7A05A` | pemantik dan highlight minimal |
| `--slate` | `#475E70` | aksen Catatan Ayah |
| `--ink` | `#21352F` | teks utama |
| `--surface` | `#FFFFFF` | kartu |
| `--muted` | `#64716D` | keterangan |

Tipografi: `Plus Jakarta Sans` atau `Nunito Sans` heading; `Inter` atau `Plus Jakarta Sans` body. Font fallback sistem boleh digunakan. Body 16–18px, line-height 1.55–1.7; hero 32–60px; heading section 24–36px. Border radius 12–20px. Shadow sangat halus; sebagian besar kartu cukup border. Container max 1200px. Grid spacing 8px base.

## 3. Struktur beranda
1. **Header sticky:** logo dan nama, menu, YouTube subscribe CTA; hamburger pada mobile.
2. **Hero split:** eyebrow “Rumah cerita keluarga”, heading manfaat yang kuat, paragraf 2–3 baris, tombol “Jelajahi Cerita” dan “Untuk Para Ayah”, ilustrasi benda edukatif tanpa figur manusia.
3. **Pilih topik:** navigasi chip/tile Tauhid, Sains, Adab, Kisah, Aktivitas, Sosial-Emosi.
4. **Video terbaru:** 3 kartu portrait desktop, 2 kartu mobile; link semua.
5. **Dua jalur:** dua panel dengan aksen Sage (anak) dan Slate (ayah), CTA spesifik.
6. **Video pilihan:** row Cerita untuk Kita dan Catatan Ayah, maksimal 4 masing-masing.
7. **Setelah menonton:** tiga tahap Amati → Bicarakan → Coba; tidak menyerupai tugas berat.
8. **Tentang singkat:** visi dan prinsip akurasi konten.
9. **CTA YouTube & footer:** subscribe, tautan kebijakan, copyright.

### Wireframe desktop
```
┌─────────────────────────────────────────────────────────────────────────┐
│ LOGO       Beranda  Jelajahi  Cerita Anak  Catatan Ayah  Tentang   YT  │
├─────────────────────────────────────────────────────────────────────────┤
│ HERO COPY, CTA (50%)              │ ILUSTRASI EDUKATIF (50%)           │
├─────────────────────────────────────────────────────────────────────────┤
│ TOPIK: [Tauhid] [Sains] [Adab] [Kisah] [Aktivitas] [Sosial]           │
├─────────────────────────────────────────────────────────────────────────┤
│ CERITA TERBARU                         [VIDEO] [VIDEO] [VIDEO]          │
├─────────────────────────────────────────────────────────────────────────┤
│ CERITA UNTUK KITA (panel 50%)      │ CATATAN AYAH (panel 50%)          │
├─────────────────────────────────────────────────────────────────────────┤
│ VIDEO ANAK: [V] [V] [V] [V]                                            │
│ REFLEKSI AYAH: [V] [V] [V] [V]                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ AMATI  →  BICARAKAN  →  COBA    │ TENTANG KAMI                        │
├─────────────────────────────────────────────────────────────────────────┤
│ FOOTER, PRIVASI, YOUTUBE                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile
- Header compact; menu dalam drawer/dropdown keyboard accessible.
- Hero 1 kolom; copy lebih dahulu, ilustrasi sesudahnya.
- Topik berupa chip horizontal wrap atau scroll; selalu terlihat label.
- Video grid 2 kolom dengan ruang title 2 baris; tidak memaksa subtitle panjang.
- Panel jalur konten ditumpuk, aksi selalu jelas.
- Tidak ada carousel autoplay.

## 4. `/video` — Katalog
Urutan: heading + intro → search input → tab Semua/Anak/Ayah → chip topik → filter/sort → result count → grid → Load More. Search client-side dari JSON yang sudah dipublikasikan; pertimbangkan indexing jika katalog sangat besar. State pencarian dan filter dibagikan lewat query string bila mudah (`?q=...&audience=...&topic=...`).

### Card video
Poster portrait 9:16 dari thumbnail YouTube bila tersedia; label kategori pada kartu, durasi, judul maksimal 2 baris, tanggal atau serial. Semua kartu punya link semantik; indikator focus terlihat. Perlu fallback gambar jika thumbnail hilang.

## 5. `/cerita-anak`
Hero “Cerita yang mengajak anak bertanya dan mencoba”. Pilih usia (3–5, 6–8, 9–12 jika dikurasi), topik, video pilihan, aktivitas keluarga. Metadata usia hanya ditampilkan ketika dikurasi; tidak ditebak dari YouTube.

## 6. `/catatan-ayah`
Hero lebih tenang “Menjadi ayah adalah perjalanan belajar”. Filter tema (komunikasi, emosi, disiplin, refleksi, fitrah, pendidikan Islam), daftar terbaru, catatan tindakan sederhana; hindari klaim konseling klinis atau diagnosis.

## 7. `/video/[slug]`
Breadcrumb → judul → metadata (audience, playlist, durasi) → YouTube player click-to-load (9:16 visual within responsive viewport) → ringkasan asli → opsional tujuan belajar yang sudah dikurasi → pertanyaan/refleksi → aktivitas aman → sumber terverifikasi → tombol buka YouTube → 3 video terkait. Jika video ditarik, tampilkan pesan tidak tersedia dan rekomendasi valid.

## 8. `/tentang`
Misi brand, pendekatan pendidikan dua jalur, prinsip editorial agama dan sains, akurasi, cara memakai video sebagai percakapan keluarga, tautan kanal dan kontak publik jika sudah tersedia. Tidak perlu menampilkan profil pribadi bila belum ditentukan.

## 9. States & interaksi
- Loading katalog: skeleton sederhana yang stabil.
- Empty: “Belum ada video untuk pilihan ini”; tombol reset filter.
- Sync API gagal: tidak muncul kepada visitor jika cache sehat; tampilkan status sistem di log saja.
- Iframe gagal: link “Tonton langsung di YouTube”.
- Link eksternal ditandai dengan ikon eksternal jika diperlukan.
- A11y: semantic headings, aria-expanded untuk menu, accessible forms, `prefers-reduced-motion`, alt gambar deskriptif.

## 10. SEO dan metadata
Judul spesifik per halaman; Open Graph image; canonical; sitemap; JSON-LD VideoObject hanya untuk metadata aktual yang valid. Robots memperbolehkan halaman publik. Jangan mengarang transcript atau tanggal video.

## 11. Hubungan desain dan brand
Logo asli ditambahkan nanti pada header, favicon, footer, dan end-card. Jangan gunakan logo AI yang belum dipilih sebagai aset resmi. Layout harus tetap rapi dengan wordmark teks sebagai placeholder.
