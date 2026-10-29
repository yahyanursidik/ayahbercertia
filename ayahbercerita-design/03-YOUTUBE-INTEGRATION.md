# YouTube Auto-Sync — Technical Specification

## 1. Architecture
**MVP:** Astro SSG + YouTube Data API v3 + GitHub Actions + versioned JSON manifest + build/deploy. No CMS/database. Channel belum dibuat, sehingga semua ID adalah placeholder.

## 2. Source of truth
- `YOUTUBE_CHANNEL_ID`: channel resmi.
- `channels.list(part=contentDetails, id=...)` → `relatedPlaylists.uploads`.
- `playlistItems.list(part=snippet,contentDetails,playlistId=uploads,maxResults=50,pageToken=...)` → video IDs.
- `videos.list(part=snippet,contentDetails,status, id=comma-separated batch)` → duration, publish date, thumbnails, embeddable/public status.
- `playlists.list`/`playlistItems.list` untuk playlist kurasi jalur & tema yang disetujui.

**Catatan:** Status detail API, playlist membership dan keterlihatan konten perlu diperiksa. Video unlisted, private, scheduled, atau yang tak dapat di-embed tidak dimasukkan sebagai video publik otomatis. Hindari dependensi fitur API yang belum terverifikasi.

## 3. Normalized schema
```json
{
  "id": "YOUTUBE_VIDEO_ID",
  "slug": "kenapa-hujan-turun-YOUTUBE_VIDEO_ID",
  "title": "Kenapa Hujan Turun?",
  "description": "Deskripsi resmi dari YouTube",
  "publishedAt": "2026-10-29T10:00:00Z",
  "durationSeconds": 59,
  "thumbnailUrl": "URL_ASLI_DARI_YOUTUBE",
  "youtubeUrl": "https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID",
  "audience": "child",
  "topics": ["sains"],
  "playlistIds": ["PLAYLIST_ID"],
  "embeddable": true,
  "editorial": null
}
```
URL thumbnail disalin persis dari API; jangan membangun URL thumbnail dari tebakan. `audience` dan `topics` berasal dari pemetaan playlist atau metadata lokal, bukan dikarang dari judul.

## 4. Metadata editorial opsional
`src/data/editorial/<video-id>.md` atau JSON: tujuan belajar, usia, pertanyaan, aktivitas, sumber yang telah diverifikasi, review status. Jika tidak ada, sembunyikan modul editorial; bukan generate dengan AI saat halaman diakses.

## 5. Sync algorithm
1. Muat cache terakhir dan config playlist.
2. Ambil metadata channel dan daftar upload secara paginated.
3. Batch detail video dan verifikasi publik + embed.
4. Ambil playlist kategori untuk pemetaan; validasi tak ada duplikasi IDs.
5. Merge editorial lokal, preserve slug berdasarkan video ID.
6. Validasi seluruh skema dan hasil: jika respons API gagal/tidak lengkap, jangan timpa cache sehat.
7. Tulis JSON atomik, catat `lastSyncedAt` dan total video.
8. Commit perubahan dan trigger deploy/build. Jika tidak berubah, jangan deploy ulang.

## 6. Schedule
Cron GitHub Actions 1–3 jam dengan manual dispatch. Jadwal tidak menjamin eksekusi tepat pada menitnya; website akan menyusul setelah sync dan deploy sukses. Opsi webhook PubSubHubbub dapat dipertimbangkan nanti jika butuh latency rendah, tetapi tambah kompleksitas dan tetap perlu verifikasi status/video detail.

## 7. Security & failure modes
- API key di GitHub Actions Secrets.
- Limit pemanggilan, retry dengan exponential backoff secukupnya.
- Cache terakhir saat timeout/429/quota exhausted.
- Log dan alert untuk job gagal berulang.
- Jangan simpan video/audio YouTube pada hosting website.
- Embed hanya saat klik; siapkan tombol membuka sumber langsung.
- Sinkronisasi video yang dihapus/unpublished: tandai tidak tersedia pada detail dan hapus dari katalog setelah status terkonfirmasi.

## 8. SEO and policy
Pakai judul/description yang masuk akal, canonical, VideoObject hanya dengan data real, dan label video yang sesuai. Ikuti Terms of Service YouTube dan ketentuan embed/API; kebijakan privasi menjelaskan bahwa pemutar pihak ketiga dapat memproses data saat dibuka. Jangan menjanjikan privasi yang tidak dapat diverifikasi.

## 9. Testing
- Channel kosong.
- Playlist belum dibuat.
- 1 video dan >50 video (pagination).
- Video duplikat dalam beberapa playlist.
- Status privat / terhapus / tidak embeddable.
- Invalid API key / quota exhausted.
- Audio/video vertikal dan thumbnail tidak tersedia.
- Slug conflict, judul berubah, tanggal berubah.
- Cache corrupted (restore last-known-good).
