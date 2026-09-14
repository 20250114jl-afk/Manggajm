/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Manga {
  id: string;
  image: string;
  title: string;
  author?: string;
  update?: string;
  view?: string;
  latestChapter?: string;
  status?: string;
  genres?: string[];
  hasKorean?: boolean;
  koreanTitle?: string;
  originalLanguage?: string;
  isOriginalKorean?: boolean;
  contentRating?: 'safe' | 'suggestive' | 'erotica' | 'pornographic' | string;
  isAdult?: boolean;
  publicationDemographic?: string;
}

export interface LatestRelease {
  id: string;
  thumbnail: string;
  title: string;
  chapters: string[];
}

export interface Chapter {
  chapterID: string;
  chapterTitle: string;
  language?: string; // 'ko' | 'en' | string
  chapterNum?: string;
  publishAt?: string;
}

export interface MangaDetail {
  id?: string;
  image?: string;
  title: string;
  koreanTitle?: string;
  hasKorean?: boolean;
  alternativeTitles: string[];
  authors: string[];
  status: string;
  genres: string[];
  rating: string;
  contentRating?: string;
  isAdult?: boolean;
  summary: string;
  hasKoreanSummary?: boolean;
  chapters: Chapter[];
}

export interface RecentlyViewedItem {
  id: string;
  title: string;
  image: string;
  author?: string;
  lastViewedAt: number;
  lastChapterId?: string;
  lastChapterTitle?: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  image: string;
  author?: string;
  addedAt: number;
  latestChapter?: string;
  genres?: string[];
}

export interface ChapterImage {
  id: number;
  img: string;
}

export interface ChapterImagesResponse {
  mangaID: string;
  chapterID: string;
  images: ChapterImage[];
}

export interface PageBookmark {
  id: string;
  mangaId: string;
  mangaTitle?: string;
  chapterId: string;
  chapterTitle?: string;
  pageIndex: number; // 1-based index (e.g. 1, 2, 3...)
  imageUrl?: string;
  createdAt: number;
  note?: string;
}
