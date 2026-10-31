// Dipakai bersama oleh website dan scripts/sync-youtube.mjs (karena itu file JS, bukan TS).

/**
 * Merapikan judul YouTube untuk tampilan: membuang awalan "Judul:", hashtag di akhir judul, dan akhiran
 * "| Ayah Bercerita #001" (nomor episode dikembalikan terpisah). Isi judul tidak diubah.
 * @param {string} raw
 * @returns {{ title: string, episode: number | null }}
 */
export function parseTitle(raw) {
  let title = raw.replace(/^\s*judul\s*:\s*/i, '');
  let episode = null;
  // Akhiran episode dibaca dulu: "#001" juga cocok dengan pola hashtag di bawah.
  const suffix = title.match(/\s*[|｜]\s*Ayah Bercerita\s*(?:#\s*(\d+))?\s*$/i);
  if (suffix) {
    episode = suffix[1] ? Number(suffix[1]) : null;
    title = title.slice(0, suffix.index);
  }
  title = title.replace(/(\s+#[\p{L}\p{N}_]+)+\s*$/u, '').trim();
  return { title: title || raw.trim(), episode };
}

/**
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}
