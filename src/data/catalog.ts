import type { Catalog, Video } from '../lib/videos';
import { byNewest } from '../lib/videos';
import mock from './videos.mock.json';

// Sumber utama: videos.json hasil `npm run sync` (scripts/sync-youtube.mjs).
// Data contoh hanya dipakai bila file itu belum ada, atau saat USE_MOCK_CATALOG=1 untuk meninjau desain.
const synced = Object.values(import.meta.glob<Catalog>('./videos.json', { eager: true, import: 'default' }))[0];
const useMock = import.meta.env.USE_MOCK_CATALOG === '1' || !synced;
const catalog = useMock ? (mock as Catalog) : synced;

export const isMockCatalog = catalog.isMock;

/** Semua video yang punya halaman detail, termasuk yang sudah tidak tersedia. */
export const allVideos: Video[] = [...catalog.videos].sort(byNewest);

/** Video yang tampil di katalog: publik dan bisa di-embed. */
export const publicVideos: Video[] = allVideos.filter((v) => v.embeddable && v.status !== 'unavailable');

export const childVideos = publicVideos.filter((v) => v.audience === 'child');
export const fatherVideos = publicVideos.filter((v) => v.audience === 'father');
