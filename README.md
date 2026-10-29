# Ayah Bercerita — Website

Landing page `ayahbercerita.my.id`, dibangun dengan **Astro 7.4** + **Tailwind CSS 4** (statis/SSG).
Brief desain ada di [`ayahbercerita-design/`](ayahbercerita-design/README.md).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # typecheck
npm run build    # output ke dist/
```

## Struktur

```
src/
├── pages/            index (beranda), video/index (katalog), video/[slug] (detail),
│                     cerita-anak, catatan-ayah, tentang, privasi, 404
├── layouts/          BaseLayout.astro (SEO, OG, canonical, noindex, skip link)
├── components/       Header, MobileMenu, Hero, TopicChips, VideoCard, VideoGrid, FilterBar,
│                     YouTubePlayer, EditorialActivity, AudienceFeature, AfterWatching,
│                     AboutBrief, YouTubeCta, PageHeader, TopicLinks, MockNotice, Footer
├── data/
│   ├── videos.mock.json   DATA CONTOH (isMock: true) — bukan dari YouTube
│   ├── catalog.ts         sumber katalog yang dipakai halaman
│   └── site.ts            nama, tagline, navigasi, URL channel
├── lib/videos.ts     skema video ternormalisasi + helper
└── styles/global.css design tokens (@theme)
```

## Placeholder yang masih perlu diganti

- **Data video**: `src/data/videos.mock.json` berisi judul/durasi/tanggal fiktif. Selama `isMock: true`,
  halaman menampilkan label "Data contoh". Ganti dengan manifest hasil sync YouTube.
- **Thumbnail**: belum ada; kartu memakai ilustrasi benda (`ObjectArt.astro`) sebagai fallback.
- **Channel YouTube**: isi `PUBLIC_YOUTUBE_CHANNEL_URL` di `.env` (lihat `.env.example`).
  Selama kosong, CTA menampilkan "Channel resmi sedang disiapkan".
- **Logo**: header memakai wordmark teks "AB" sampai logo resmi tersedia.
- **Video tidak tersedia**: `mock-langit` sengaja diberi `status: "unavailable"` untuk menguji tampilan
  video yang dihapus (keluar dari katalog, halaman detail menampilkan pesan).
- **Modul editorial** (tujuan belajar, pertanyaan, aktivitas, sumber, usia) hanya tampil bila
  `editorial.reviewed === true`. Semua data contoh `editorial: null`, jadi modul ini tersembunyi.
- **SEO**: selama katalog berisi data contoh, halaman detail diberi `noindex`, dan JSON-LD `VideoObject`
  tidak dibuat. Keduanya aktif otomatis untuk data asli yang lengkap.
- **Kontak publik** di `/privasi` dan `/tentang` belum ada.

## Katalog `/video`

Pencarian dan filter berjalan di sisi klien atas data yang sudah dirender (tanpa memanggil API).
State dibagikan lewat query string: `?q=…&audience=child|father&topic=…&sort=oldest`.
