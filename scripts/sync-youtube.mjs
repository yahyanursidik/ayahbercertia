#!/usr/bin/env node
// Sinkronisasi video publik channel YouTube → src/data/videos.json
// Spesifikasi: ayahbercerita-design/03-YOUTUBE-INTEGRATION.md
//
// - Dengan YOUTUBE_API_KEY: YouTube Data API v3 (lengkap: durasi, status, embeddable, semua halaman upload).
// - Tanpa key: feed RSS publik channel (maks. 15 video terbaru) + cek oEmbed untuk status embed.
// - Gagal/tidak lengkap → cache terakhir tidak disentuh dan proses keluar dengan kode 1.
// - Tidak ada perubahan → file tidak ditulis (workflow tidak membuat commit/deploy).

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { parseTitle, slugify } from '../src/lib/youtube-title.js';

const ROOT = new URL('../', import.meta.url);
const CONFIG_PATH = new URL('src/data/youtube.config.json', ROOT);
const OUT_PATH = new URL('src/data/videos.json', ROOT);
const EDITORIAL_DIR = new URL('src/data/editorial/', ROOT);
const API_BASE = 'https://www.googleapis.com/youtube/v3/';
const API_KEY = process.env.YOUTUBE_API_KEY?.trim() || null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const redact = (url) => String(url).replace(/([?&]key=)[^&]+/, '$1***');

async function fetchWithRetry(url, { attempts = 3, okStatuses = [] } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    if (i) await sleep(1000 * 2 ** i);
    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'accept-language': 'id,en' } });
    } catch (error) {
      lastError = error;
      continue;
    }
    if (res.ok || okStatuses.includes(res.status)) return res;
    lastError = new Error(`HTTP ${res.status} untuk ${redact(url)}`);
    // Hanya 429 dan 5xx yang layak diulang.
    if (res.status !== 429 && res.status < 500) break;
  }
  throw lastError;
}

// ---------- YouTube Data API v3 ----------

async function api(endpoint, params) {
  const url = new URL(endpoint, API_BASE);
  for (const [k, v] of Object.entries({ ...params, key: API_KEY })) url.searchParams.set(k, String(v));
  return (await fetchWithRetry(url)).json();
}

async function playlistVideoIds(playlistId) {
  const ids = [];
  let pageToken;
  do {
    const data = await api('playlistItems', { part: 'contentDetails', playlistId, maxResults: 50, ...(pageToken && { pageToken }) });
    for (const item of data.items ?? []) ids.push(item.contentDetails.videoId);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return ids;
}

function parseIsoDuration(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '');
  if (!m) return null;
  const [, d = 0, h = 0, min = 0, s = 0] = m.map((x) => Number(x ?? 0));
  return ((d * 24 + h) * 60 + min) * 60 + s;
}

/** Shorts dikenali dari URL /shorts/ yang menjawab 200 (video biasa dialihkan). */
async function isShortUrl(id) {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    return res.status === 200;
  } catch {
    return null;
  }
}

async function fromApi(config, cache) {
  const ch = await api('channels', { part: 'contentDetails', id: config.channelId });
  const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`Channel ${config.channelId} tidak ditemukan atau tidak punya playlist uploads.`);

  const uploadIds = await playlistVideoIds(uploads);
  // Video yang dulu ada tetapi hilang dari uploads ikut dicek agar statusnya terkonfirmasi.
  const lookupIds = [...new Set([...uploadIds, ...cache.videos.map((v) => v.id)])];

  const details = new Map();
  for (let i = 0; i < lookupIds.length; i += 50) {
    const batch = lookupIds.slice(i, i + 50);
    const data = await api('videos', { part: 'snippet,contentDetails,status', id: batch.join(','), maxResults: 50 });
    for (const item of data.items ?? []) details.set(item.id, item);
  }

  const playlistMembers = {};
  for (const playlistId of Object.keys(config.mapping.playlists ?? {})) {
    playlistMembers[playlistId] = new Set(await playlistVideoIds(playlistId));
  }

  const prevById = new Map(cache.videos.map((v) => [v.id, v]));
  const raws = [];
  const gone = [];
  for (const id of lookupIds) {
    const item = details.get(id);
    const publicOk =
      item && item.status?.privacyStatus === 'public' && item.status?.uploadStatus === 'processed' && item.status?.embeddable === true;
    if (!publicOk) {
      if (prevById.has(id)) gone.push(id);
      continue;
    }
    const t = item.snippet.thumbnails ?? {};
    const thumb = t.maxres ?? t.standard ?? t.high ?? t.medium ?? t.default ?? null;
    const isShort = prevById.get(id)?.isShort ?? (await isShortUrl(id));
    raws.push({
      id,
      title: item.snippet.title,
      description: item.snippet.description ?? '',
      publishedAt: item.snippet.publishedAt,
      durationSeconds: parseIsoDuration(item.contentDetails?.duration),
      thumbnailUrl: thumb?.url ?? null,
      youtubeUrl: isShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      isShort: isShort ?? false,
      embeddable: true,
    });
  }
  return { source: 'youtube-api', raws, gone, keepMissing: false, playlistMembers };
}

// ---------- RSS + oEmbed (tanpa API key) ----------

function decodeXml(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseFeed(xml) {
  if (!/<feed[\s>]/.test(xml)) throw new Error('Respons RSS bukan feed Atom yang valid.');
  const tag = (block, name) => {
    const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(block);
    return m ? decodeXml(m[1]).trim() : '';
  };
  const attr = (block, name, attribute) => {
    const m = new RegExp(`<${name}\\s[^>]*${attribute}="([^"]*)"`).exec(block);
    return m ? decodeXml(m[1]) : null;
  };
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: tag(e, 'yt:videoId'),
    title: tag(e, 'media:title') || tag(e, 'title'),
    description: tag(e, 'media:description'),
    publishedAt: new Date(tag(e, 'published')).toISOString(),
    thumbnailUrl: attr(e, 'media:thumbnail', 'url'),
    link: attr(e, 'link', 'href') ?? '',
  }));
}

/** oEmbed: 200 = publik & bisa di-embed, 401/403 = embed dimatikan, 404 = privat/dihapus, null = tidak pasti. */
async function oembedStatus(id) {
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
    const res = await fetchWithRetry(url, { okStatuses: [401, 403, 404] });
    return { 200: 'ok', 401: 'no-embed', 403: 'no-embed', 404: 'gone' }[res.status] ?? null;
  } catch {
    return null;
  }
}

async function fromRss(config, cache) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.channelId}`;
  const entries = parseFeed(await (await fetchWithRetry(feedUrl)).text());

  const playlistMembers = {};
  for (const playlistId of Object.keys(config.mapping.playlists ?? {})) {
    const xml = await (await fetchWithRetry(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`)).text();
    playlistMembers[playlistId] = new Set(parseFeed(xml).map((e) => e.id));
  }

  const prevById = new Map(cache.videos.map((v) => [v.id, v]));
  const raws = [];
  for (const e of entries) {
    const status = await oembedStatus(e.id);
    if (status === 'gone' || status === 'no-embed') continue;
    const prev = prevById.get(e.id);
    raws.push({
      id: e.id,
      title: e.title,
      description: e.description,
      publishedAt: e.publishedAt,
      // RSS tidak memuat durasi; pertahankan nilai lama bila pernah diketahui dari API.
      durationSeconds: prev?.durationSeconds ?? null,
      thumbnailUrl: e.thumbnailUrl,
      youtubeUrl: e.link || `https://www.youtube.com/watch?v=${e.id}`,
      isShort: e.link.includes('/shorts/'),
      embeddable: true,
    });
  }

  // Feed hanya memuat ~15 video terbaru: video lama di cache dipertahankan,
  // kecuali oEmbed memastikan video sudah privat/dihapus atau embed dimatikan.
  const inFeed = new Set(raws.map((r) => r.id));
  const gone = [];
  for (const prev of cache.videos) {
    if (inFeed.has(prev.id) || prev.status === 'unavailable') continue;
    const status = await oembedStatus(prev.id);
    if (status === 'gone' || status === 'no-embed') gone.push(prev.id);
  }

  return { source: 'youtube-rss', raws, gone, keepMissing: true, playlistMembers };
}

// ---------- Normalisasi & penggabungan ----------

function classify(raw, mapping, playlistMembers) {
  const rules = [];
  const playlistIds = [];
  if (mapping.videos?.[raw.id]) rules.push(mapping.videos[raw.id]);
  for (const [playlistId, rule] of Object.entries(mapping.playlists ?? {})) {
    if (playlistMembers[playlistId]?.has(raw.id)) {
      rules.push(rule);
      playlistIds.push(playlistId);
    }
  }
  const tags = new Set([...raw.description.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1].toLowerCase()));
  for (const [tag, rule] of Object.entries(mapping.hashtags ?? {})) {
    if (tags.has(tag.toLowerCase())) rules.push(rule);
  }
  return {
    audience: rules.find((r) => r.audience)?.audience ?? null,
    topics: [...new Set(rules.flatMap((r) => r.topics ?? []))],
    playlistIds,
  };
}

async function readEditorial(id) {
  try {
    return JSON.parse(await readFile(new URL(`${id}.json`, EDITORIAL_DIR), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`Editorial ${id}.json tidak valid: ${error.message}`);
  }
}

function validate(video) {
  const problems = [];
  if (!/^[\w-]{11}$/.test(video.id)) problems.push('id');
  if (!video.title?.trim()) problems.push('title');
  if (!video.slug) problems.push('slug');
  if (!Number.isFinite(Date.parse(video.publishedAt))) problems.push('publishedAt');
  if (video.thumbnailUrl !== null && !/^https:\/\//.test(video.thumbnailUrl)) problems.push('thumbnailUrl');
  if (!['child', 'father', null].includes(video.audience)) problems.push('audience');
  if (video.durationSeconds !== null && !(video.durationSeconds >= 0)) problems.push('durationSeconds');
  if (problems.length) throw new Error(`Data video ${video.id} tidak valid: ${problems.join(', ')}`);
}

async function loadCache() {
  try {
    const data = JSON.parse(await readFile(OUT_PATH, 'utf8'));
    if (!Array.isArray(data.videos)) throw new Error('field videos bukan array');
    return data;
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`⚠ Cache lama tidak terbaca (${error.message}); mulai dari kosong.`);
    return { videos: [] };
  }
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const cache = await loadCache();
  const prevById = new Map(cache.videos.map((v) => [v.id, v]));

  const result = API_KEY ? await fromApi(config, cache) : await fromRss(config, cache);
  console.log(`Sumber: ${result.source} · ${result.raws.length} video publik ditemukan`);

  const videos = [];
  const seen = new Set();
  for (const raw of result.raws) {
    if (seen.has(raw.id)) continue;
    seen.add(raw.id);
    const prev = prevById.get(raw.id);
    const { audience, topics, playlistIds } = classify(raw, config.mapping, result.playlistMembers);
    const video = {
      id: raw.id,
      // Slug dipertahankan berdasarkan ID agar URL stabil walau judul berubah.
      slug: prev?.slug ?? [slugify(parseTitle(raw.title).title), raw.id].filter(Boolean).join('-'),
      title: raw.title,
      description: raw.description,
      publishedAt: new Date(raw.publishedAt).toISOString(),
      durationSeconds: raw.durationSeconds,
      thumbnailUrl: raw.thumbnailUrl,
      youtubeUrl: raw.youtubeUrl,
      isShort: raw.isShort,
      audience,
      topics,
      playlistIds,
      embeddable: raw.embeddable,
      status: 'public',
      editorial: await readEditorial(raw.id),
    };
    validate(video);
    videos.push(video);
  }

  const gone = new Set(result.gone);
  for (const prev of cache.videos) {
    if (seen.has(prev.id)) continue;
    if (gone.has(prev.id) || prev.status === 'unavailable') {
      // Tetap disimpan agar /video/[slug] bisa menampilkan pesan "tidak tersedia".
      videos.push({ ...prev, status: 'unavailable' });
    } else if (result.keepMissing) {
      videos.push(prev);
    } else {
      videos.push({ ...prev, status: 'unavailable' });
    }
  }

  videos.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id));

  if (JSON.stringify(videos) === JSON.stringify(cache.videos)) {
    console.log('Tidak ada perubahan; videos.json tidak ditulis.');
    return;
  }

  const output = {
    isMock: false,
    source: result.source,
    channelId: config.channelId,
    lastSyncedAt: new Date().toISOString(),
    total: videos.filter((v) => v.status !== 'unavailable').length,
    videos,
  };
  // Tulis atomik: file sementara lalu rename, agar build tidak membaca file setengah jadi.
  await mkdir(new URL('.', OUT_PATH), { recursive: true });
  const tmp = new URL('videos.json.tmp', OUT_PATH);
  await writeFile(tmp, `${JSON.stringify(output, null, 2)}\n`);
  await rename(tmp, OUT_PATH);
  console.log(`✓ videos.json diperbarui: ${output.total} video publik, ${videos.length - output.total} tidak tersedia.`);
}

main().catch((error) => {
  console.error(`✗ Sinkronisasi gagal, cache terakhir dipertahankan: ${redact(error.message)}`);
  process.exitCode = 1;
});
