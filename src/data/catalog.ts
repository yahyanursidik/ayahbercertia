import type { Catalog, Video } from '../lib/videos';
import { byNewest } from '../lib/videos';
import mock from './videos.mock.json';

// Sementara memakai data contoh. Setelah sinkronisasi YouTube tersedia,
// ganti sumber ini dengan manifest hasil sync (mis. ./videos.json).
const catalog = mock as Catalog;

export const isMockCatalog = catalog.isMock;

/** Semua video yang punya halaman detail, termasuk yang sudah tidak tersedia. */
export const allVideos: Video[] = [...catalog.videos].sort(byNewest);

/** Video yang tampil di katalog: publik dan bisa di-embed. */
export const publicVideos: Video[] = allVideos.filter((v) => v.embeddable && v.status !== 'unavailable');

export const childVideos = publicVideos.filter((v) => v.audience === 'child');
export const fatherVideos = publicVideos.filter((v) => v.audience === 'father');
