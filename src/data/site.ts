export const site = {
  name: 'Ayah Bercerita',
  domain: 'ayahbercerita.my.id',
  tagline: 'Cerita kecil, ilmu baru, kebersamaan yang bermakna.',
  description:
    'Video edukasi singkat untuk anak dan catatan pengasuhan untuk para ayah: tauhid, sains, adab, kisah, dan aktivitas yang bisa dilakukan bersama.',
  /** Kosong sampai channel YouTube resmi dibuat. */
  youtubeUrl: (import.meta.env.PUBLIC_YOUTUBE_CHANNEL_URL as string | undefined) || null,
};

export const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/video', label: 'Jelajahi Video' },
  { href: '/cerita-anak', label: 'Cerita Anak' },
  { href: '/catatan-ayah', label: 'Catatan Ayah' },
  { href: '/tentang', label: 'Tentang' },
];
