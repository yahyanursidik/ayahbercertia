// Skema video ternormalisasi — 03-YOUTUBE-INTEGRATION.md §3
import { parseTitle } from './youtube-title.js';

export type Audience = 'child' | 'father';

/** Modul editorial opsional — hanya ditampilkan bila sudah disunting tim (reviewed: true). */
export interface Editorial {
  reviewed: boolean;
  /** Rentang usia hanya diisi bila dikurasi, tidak ditebak dari YouTube. */
  ageRange?: string;
  learningGoals?: string[];
  questions?: string[];
  activity?: { title: string; steps: string[]; safetyNote?: string };
  sources?: { label: string; url?: string }[];
}

export interface Video {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  /** null bila sumbernya tidak memuat durasi (mis. feed RSS). */
  durationSeconds: number | null;
  /** Disalin persis dari YouTube API; null jika tidak tersedia. */
  thumbnailUrl: string | null;
  /** null selama channel belum tersambung (data contoh). */
  youtubeUrl: string | null;
  /** Video vertikal YouTube Shorts; thumbnail 4:3/16:9-nya perlu di-crop ke tengah. */
  isShort?: boolean;
  /** null = belum terpetakan ke playlist/hashtag mana pun → label netral. */
  audience: Audience | null;
  topics: string[];
  playlistIds: string[];
  embeddable: boolean;
  /** 'unavailable' = video dihapus/privat; detail tetap ada dengan pesan, tetapi keluar dari katalog. */
  status?: 'public' | 'unavailable';
  editorial: Editorial | null;
}

export interface Catalog {
  /** true = data contoh untuk keperluan desain, bukan hasil sinkronisasi YouTube. */
  isMock: boolean;
  source?: 'youtube-api' | 'youtube-rss';
  lastSyncedAt: string | null;
  videos: Video[];
}

export const audienceLabel: Record<Audience, string> = {
  child: 'Cerita untuk Kita',
  father: 'Catatan Ayah',
};

export const audiencePath: Record<Audience, string> = {
  child: '/cerita-anak',
  father: '/catatan-ayah',
};

/** Judul tampilan tanpa awalan "Judul:" dan akhiran "| Ayah Bercerita #001". */
export function displayTitle(video: Pick<Video, 'title'>): string {
  return parseTitle(video.title).title;
}

export function episodeNumber(video: Pick<Video, 'title'>): number | null {
  return parseTitle(video.title).episode;
}

/** Deskripsi tanpa baris yang hanya berisi hashtag atau tautan ke situs ini sendiri. */
export function cleanDescription(description: string): string {
  return description
    .split('\n')
    .filter((line) => !/^\s*(#[\p{L}\p{N}_]+\s*)+$/u.test(line) && !/^\W*ayahbercerita\.my\.id\/?\s*$/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface Topic {
  slug: string;
  label: string;
  audience: Audience;
}

export const topics: Topic[] = [
  { slug: 'tauhid', label: 'Tauhid', audience: 'child' },
  { slug: 'sains', label: 'Sains', audience: 'child' },
  { slug: 'adab', label: 'Adab', audience: 'child' },
  { slug: 'kisah', label: 'Kisah', audience: 'child' },
  { slug: 'aktivitas', label: 'Aktivitas', audience: 'child' },
  { slug: 'sosial-emosi', label: 'Sosial-Emosi', audience: 'child' },
  { slug: 'komunikasi', label: 'Komunikasi', audience: 'father' },
  { slug: 'emosi', label: 'Emosi', audience: 'father' },
  { slug: 'disiplin', label: 'Disiplin', audience: 'father' },
  { slug: 'refleksi', label: 'Refleksi', audience: 'father' },
  { slug: 'fitrah', label: 'Fitrah', audience: 'father' },
  { slug: 'pendidikan-islam', label: 'Pendidikan Islam', audience: 'father' },
];

/** Kategori yang tidak dikenal diberi label netral, bukan dikarang. */
export function topicLabel(slug: string | undefined): string {
  return topics.find((t) => t.slug === slug)?.label ?? 'Umum';
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(
    new Date(iso),
  );
}

/** Label kartu: "Cerita untuk Kita · Sains", atau hanya topik bila audiens belum terpetakan. */
export function videoMeta(video: Video): string {
  const parts = [video.audience ? audienceLabel[video.audience] : null, video.topics[0] ? topicLabel(video.topics[0]) : null];
  return parts.filter(Boolean).join(' · ') || 'Video';
}

/** Durasi ISO 8601 untuk JSON-LD VideoObject. */
export function isoDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `PT${m ? `${m}M` : ''}${s}S`;
}

export function byNewest(a: Video, b: Video): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

/** Video terkait: audiens sama, topik yang sama didahulukan, lalu terbaru. */
export function relatedVideos(video: Video, pool: Video[], limit = 3): Video[] {
  const shares = (v: Video) => v.topics.some((t) => video.topics.includes(t));
  return pool
    .filter((v) => v.id !== video.id)
    .sort((a, b) => {
      const score = (v: Video) => (v.audience === video.audience ? 2 : 0) + (shares(v) ? 1 : 0);
      return score(b) - score(a) || byNewest(a, b);
    })
    .slice(0, limit);
}
