# Ayah Bercerita — Website

Website `ayahbercerita.my.id`, dibangun dengan **Astro 7.4** + **Tailwind CSS 4** (statis/SSG).
Video diambil otomatis dari channel YouTube [@ayahberceritabersama](https://www.youtube.com/@ayahberceritabersama).
Brief desain ada di [`ayahbercerita-design/`](ayahbercerita-design/README.md).

## Menjalankan

```bash
npm install
npm run sync     # ambil video terbaru dari channel → src/data/videos.json
npm run dev      # http://localhost:4321
npm run check    # typecheck
npm run build    # output ke dist/
```

## Sinkronisasi YouTube otomatis

Workflow [`.github/workflows/sync-youtube.yml`](.github/workflows/sync-youtube.yml) berjalan **tiap 2 jam**
(bisa juga dijalankan manual dari tab *Actions* → *Sinkronisasi video YouTube* → *Run workflow*):

1. `scripts/sync-youtube.mjs` mengambil video publik channel.
2. Jika ada perubahan, website dibuild untuk validasi, lalu `src/data/videos.json` di-commit ke `main`.
3. Hosting yang tersambung ke repo (Netlify/Cloudflare Pages/Vercel) men-deploy otomatis dari push itu.

Jika tidak ada video baru, tidak ada commit dan tidak ada deploy. Jika sinkronisasi gagal (jaringan, kuota,
key salah), job ditandai gagal dan `videos.json` terakhir tetap dipakai.

**Dua mode sumber data:**

| | Tanpa API key (default) | Dengan secret `YOUTUBE_API_KEY` |
|---|---|---|
| Sumber | Feed RSS publik channel + cek oEmbed | YouTube Data API v3 |
| Jumlah video | 15 terbaru per sinkronisasi (video lama tetap tersimpan) | Semua upload |
| Durasi | Tidak tersedia (badge durasi disembunyikan) | Ada |
| Video dihapus/privat | Terdeteksi lewat oEmbed | Terdeteksi lewat status API |

Untuk mode API: buat key YouTube Data API v3 di Google Cloud Console, lalu simpan di GitHub
*Settings → Secrets and variables → Actions* sebagai `YOUTUBE_API_KEY`.

**Jalur & topik** (Cerita untuk Kita / Catatan Ayah, Sains, Adab, …) ditentukan oleh
[`src/data/youtube.config.json`](src/data/youtube.config.json), dengan prioritas:
`videos` (per ID video) → `playlists` (per ID playlist YouTube) → `hashtags` di deskripsi video
(mis. `#SainsAnak` → anak, sains). Video tanpa kecocokan tetap tampil dengan label netral.

**Judul**: awalan `Judul:` dan akhiran `| Ayah Bercerita #001` dirapikan saat ditampilkan; nomor episode
diambil dari akhiran itu. Slug URL dibuat sekali per video ID dan tidak berubah walau judul diedit.

**Modul editorial** (tujuan belajar, pertanyaan, aktivitas, sumber, usia): buat
`src/data/editorial/<ID-video>.json` dengan `"reviewed": true` (bentuknya lihat tipe `Editorial` di
`src/lib/videos.ts`). Tanpa file itu, modul disembunyikan.

## Struktur

```
scripts/sync-youtube.mjs   sinkronisasi YouTube (API atau RSS), tulis atomik, last-known-good
src/
├── pages/            index (beranda), video/index (katalog), video/[slug] (detail),
│                     cerita-anak, catatan-ayah, tentang, privasi, 404
├── layouts/          BaseLayout.astro (SEO, OG, canonical, noindex, skip link)
├── components/       Header, MobileMenu, Hero, TopicChips, VideoCard, VideoGrid, FilterBar,
│                     YouTubePlayer, EditorialActivity, AudienceFeature, AfterWatching,
│                     AboutBrief, YouTubeCta, PageHeader, TopicLinks, MockNotice, Footer
├── data/
│   ├── videos.json         katalog hasil sync (jangan diedit manual)
│   ├── youtube.config.json channel ID + aturan pemetaan jalur/topik
│   ├── videos.mock.json    DATA CONTOH untuk meninjau desain (USE_MOCK_CATALOG=1)
│   ├── catalog.ts          sumber katalog yang dipakai halaman
│   └── site.ts             nama, tagline, navigasi, URL channel
├── lib/videos.ts     skema video + helper; lib/youtube-title.js dipakai bersama script sync
└── styles/global.css design tokens (@theme)
```

## Katalog `/video`

Pencarian dan filter berjalan di sisi klien atas data yang sudah dirender (tanpa memanggil API).
State dibagikan lewat query string: `?q=…&audience=child|father&topic=…&sort=oldest`.

## Yang masih perlu disiapkan

- **Hosting**: belum dipilih. Sambungkan repo ini ke Netlify/Cloudflare Pages/Vercel (build `npm run build`,
  output `dist`) agar setiap commit sinkronisasi ter-deploy otomatis.
- **Logo**: header memakai wordmark teks "AB" sampai logo resmi tersedia.
- **Kontak publik** di `/privasi` dan `/tentang` belum ada.
