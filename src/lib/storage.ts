/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RecentlyViewedItem, BookmarkItem, PageBookmark } from '../types';

const STORAGE_KEYS = {
  RECENTLY_VIEWED: 'manga_recently_viewed_v1',
  READ_CHAPTERS: 'manga_read_chapters_v1',
  BOOKMARKS: 'manga_bookmarks_v1',
  PAGE_BOOKMARKS: 'manga_page_bookmarks_v1',
} as const;

// Helper to safely read from localStorage
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage:`, e);
    return fallback;
  }
}

// Helper to safely write to localStorage
function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write ${key} to localStorage:`, e);
  }
}

/* ================= 최근 본 만화 (Recently Viewed) ================= */

export function getRecentlyViewed(): RecentlyViewedItem[] {
  return safeGet<RecentlyViewedItem[]>(STORAGE_KEYS.RECENTLY_VIEWED, []);
}

export function saveRecentlyViewed(
  item: Omit<RecentlyViewedItem, 'lastViewedAt'> & { lastViewedAt?: number }
): RecentlyViewedItem[] {
  const current = getRecentlyViewed();
  const existing = current.find((m) => m.id === item.id);

  const updatedItem: RecentlyViewedItem = {
    id: item.id,
    title: item.title,
    image: item.image || existing?.image || '',
    author: item.author || existing?.author,
    lastViewedAt: Date.now(),
    lastChapterId: item.lastChapterId || existing?.lastChapterId,
    lastChapterTitle: item.lastChapterTitle || existing?.lastChapterTitle,
  };

  // Remove existing and prepend to top (max 20)
  const filtered = current.filter((m) => m.id !== item.id);
  const nextList = [updatedItem, ...filtered].slice(0, 20);
  safeSet(STORAGE_KEYS.RECENTLY_VIEWED, nextList);
  return nextList;
}

export function updateRecentlyViewedChapter(
  mangaId: string,
  chapterId: string,
  chapterTitle?: string
): RecentlyViewedItem[] {
  const current = getRecentlyViewed();
  const index = current.findIndex((m) => m.id === mangaId);
  if (index !== -1) {
    current[index] = {
      ...current[index],
      lastChapterId: chapterId,
      lastChapterTitle: chapterTitle || current[index].lastChapterTitle,
      lastViewedAt: Date.now(),
    };
    // Move to front
    const [item] = current.splice(index, 1);
    const nextList = [item, ...current];
    safeSet(STORAGE_KEYS.RECENTLY_VIEWED, nextList);
    return nextList;
  }
  return current;
}

export function removeRecentlyViewed(id: string): RecentlyViewedItem[] {
  const current = getRecentlyViewed();
  const nextList = current.filter((m) => m.id !== id);
  safeSet(STORAGE_KEYS.RECENTLY_VIEWED, nextList);
  return nextList;
}

export function clearRecentlyViewed(): void {
  safeSet(STORAGE_KEYS.RECENTLY_VIEWED, []);
}

/* ================= 읽은 챕터 (Read Chapters Tracking) ================= */

type ReadChaptersMap = Record<string, string[]>; // { [mangaId]: chapterId[] }

export function getReadChaptersMap(): ReadChaptersMap {
  return safeGet<ReadChaptersMap>(STORAGE_KEYS.READ_CHAPTERS, {});
}

export function getReadChaptersForManga(mangaId: string): string[] {
  const map = getReadChaptersMap();
  return map[mangaId] || [];
}

export function isChapterRead(mangaId: string, chapterId: string): boolean {
  const chapters = getReadChaptersForManga(mangaId);
  return chapters.includes(chapterId);
}

export function markChapterRead(
  mangaId: string,
  chapterId: string,
  read: boolean = true
): string[] {
  const map = getReadChaptersMap();
  const currentChapters = map[mangaId] || [];
  let updatedChapters: string[];

  if (read) {
    if (!currentChapters.includes(chapterId)) {
      updatedChapters = [...currentChapters, chapterId];
    } else {
      updatedChapters = currentChapters;
    }
  } else {
    updatedChapters = currentChapters.filter((id) => id !== chapterId);
  }

  map[mangaId] = updatedChapters;
  safeSet(STORAGE_KEYS.READ_CHAPTERS, map);
  return updatedChapters;
}

export function toggleChapterRead(mangaId: string, chapterId: string): boolean {
  const read = isChapterRead(mangaId, chapterId);
  markChapterRead(mangaId, chapterId, !read);
  return !read;
}

export function markAllChaptersRead(
  mangaId: string,
  allChapterIds: string[],
  read: boolean = true
): string[] {
  const map = getReadChaptersMap();
  const updatedChapters = read ? Array.from(new Set([...(map[mangaId] || []), ...allChapterIds])) : [];
  map[mangaId] = updatedChapters;
  safeSet(STORAGE_KEYS.READ_CHAPTERS, map);
  return updatedChapters;
}

/* ================= 즐겨찾기 / 내 서재 (Bookmarks / Library) ================= */

export function getBookmarks(): BookmarkItem[] {
  return safeGet<BookmarkItem[]>(STORAGE_KEYS.BOOKMARKS, []);
}

export function isBookmarked(id: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.id === id);
}

export function toggleBookmark(
  item: Omit<BookmarkItem, 'addedAt'> & { addedAt?: number }
): { bookmarked: boolean; list: BookmarkItem[] } {
  const current = getBookmarks();
  const exists = current.some((b) => b.id === item.id);

  if (exists) {
    const nextList = current.filter((b) => b.id !== item.id);
    safeSet(STORAGE_KEYS.BOOKMARKS, nextList);
    return { bookmarked: false, list: nextList };
  } else {
    const newItem: BookmarkItem = {
      id: item.id,
      title: item.title,
      image: item.image,
      author: item.author,
      latestChapter: item.latestChapter,
      genres: item.genres,
      addedAt: Date.now(),
    };
    const nextList = [newItem, ...current];
    safeSet(STORAGE_KEYS.BOOKMARKS, nextList);
    return { bookmarked: true, list: nextList };
  }
}

export function updateBookmarkGenres(id: string, genres: string[]): BookmarkItem[] {
  const current = getBookmarks();
  const index = current.findIndex((b) => b.id === id);
  if (index !== -1 && genres && genres.length > 0) {
    current[index] = {
      ...current[index],
      genres: Array.from(new Set([...(current[index].genres || []), ...genres]))
    };
    safeSet(STORAGE_KEYS.BOOKMARKS, current);
    return [...current];
  }
  return current;
}

export function removeBookmark(id: string): BookmarkItem[] {
  const current = getBookmarks();
  const nextList = current.filter((b) => b.id !== id);
  safeSet(STORAGE_KEYS.BOOKMARKS, nextList);
  return nextList;
}

/* ================= 뷰어 페이지 책갈피 (Reader Page Bookmarks) ================= */

export function getPageBookmarks(mangaId?: string): PageBookmark[] {
  const all = safeGet<PageBookmark[]>(STORAGE_KEYS.PAGE_BOOKMARKS, []);
  if (mangaId) {
    return all.filter((b) => b.mangaId === mangaId);
  }
  return all;
}

export function isPageBookmarked(mangaId: string, chapterId: string, pageIndex: number): boolean {
  const all = getPageBookmarks();
  return all.some(
    (b) => b.mangaId === mangaId && b.chapterId === chapterId && b.pageIndex === pageIndex
  );
}

export function savePageBookmark(
  item: Omit<PageBookmark, 'id' | 'createdAt'> & { id?: string; createdAt?: number }
): PageBookmark[] {
  const all = getPageBookmarks();
  const generatedId = item.id || `${item.mangaId}_${item.chapterId}_p${item.pageIndex}`;
  
  // Check if bookmark for this exact page already exists
  const existingIndex = all.findIndex(
    (b) => b.id === generatedId || (b.mangaId === item.mangaId && b.chapterId === item.chapterId && b.pageIndex === item.pageIndex)
  );

  const newBookmark: PageBookmark = {
    id: generatedId,
    mangaId: item.mangaId,
    mangaTitle: item.mangaTitle,
    chapterId: item.chapterId,
    chapterTitle: item.chapterTitle,
    pageIndex: item.pageIndex,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt || Date.now(),
    note: item.note,
  };

  let updatedList: PageBookmark[];
  if (existingIndex !== -1) {
    updatedList = [...all];
    updatedList[existingIndex] = { ...updatedList[existingIndex], ...newBookmark };
  } else {
    updatedList = [newBookmark, ...all];
  }

  safeSet(STORAGE_KEYS.PAGE_BOOKMARKS, updatedList);
  return updatedList;
}

export function removePageBookmark(id: string): PageBookmark[] {
  const all = getPageBookmarks();
  const updatedList = all.filter((b) => b.id !== id);
  safeSet(STORAGE_KEYS.PAGE_BOOKMARKS, updatedList);
  return updatedList;
}

export function removePageBookmarkByPosition(mangaId: string, chapterId: string, pageIndex: number): PageBookmark[] {
  const all = getPageBookmarks();
  const updatedList = all.filter(
    (b) => !(b.mangaId === mangaId && b.chapterId === chapterId && b.pageIndex === pageIndex)
  );
  safeSet(STORAGE_KEYS.PAGE_BOOKMARKS, updatedList);
  return updatedList;
}

export function togglePageBookmark(
  item: Omit<PageBookmark, 'id' | 'createdAt'>
): { bookmarked: boolean; list: PageBookmark[] } {
  const isMarked = isPageBookmarked(item.mangaId, item.chapterId, item.pageIndex);
  if (isMarked) {
    const list = removePageBookmarkByPosition(item.mangaId, item.chapterId, item.pageIndex);
    return { bookmarked: false, list };
  } else {
    const list = savePageBookmark(item);
    return { bookmarked: true, list };
  }
}
