/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Manga, LatestRelease, MangaDetail, ChapterImagesResponse } from '../types';

export const api = {
  async search(
    query: string,
    page: number = 1,
    koreanOnly: boolean = false,
    category?: string,
    adultOnly: boolean = false
  ): Promise<Manga[]> {
    let url = `/api/search?query=${encodeURIComponent(query)}&page=${page}`;
    if (koreanOnly) url += '&koreanOnly=true';
    if (adultOnly) url += '&adultOnly=true';
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getLatestRelease(koreanOnly: boolean = true): Promise<LatestRelease[]> {
    const res = await fetch(`/api/latest-release?koreanOnly=${koreanOnly ? 'true' : 'false'}`);
    if (!res.ok) throw new Error('Failed to fetch latest releases');
    return res.json();
  },

  async translateToKorean(text: string, type: 'synopsis' | 'title' | 'summary' = 'synopsis'): Promise<{ translatedText: string; source?: string; notice?: string }> {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
    });
    if (!res.ok) throw new Error('Failed to translate');
    return res.json();
  },

  async getLatestManga(
    page: number = 1,
    koreanOnly: boolean = false,
    category?: string,
    adultOnly: boolean = false
  ): Promise<Manga[]> {
    let url = `/api/latest-manga?page=${page}`;
    if (koreanOnly) url += '&koreanOnly=true';
    if (adultOnly) url += '&adultOnly=true';
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch latest manga');
    return res.json();
  },

  async getChapterInfo(id: string): Promise<MangaDetail> {
    const res = await fetch(`/api/chapter-info?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch chapter info');
    return res.json();
  },

  async fetchChapterImages(id: string, chapterID: string): Promise<ChapterImagesResponse> {
    const res = await fetch(`/api/fetch-chapter/${encodeURIComponent(id)}/${encodeURIComponent(chapterID)}`);
    if (!res.ok) throw new Error('Failed to fetch chapter images');
    return res.json();
  },

  async getRecommendations(
    genres: string[] = [],
    excludeIds: string[] = [],
    koreanOnly: boolean = false,
    adultOnly: boolean = false
  ): Promise<Manga[]> {
    let url = `/api/recommendations?genres=${encodeURIComponent(genres.join(','))}&excludeIds=${encodeURIComponent(excludeIds.join(','))}`;
    if (koreanOnly) url += '&koreanOnly=true';
    if (adultOnly) url += '&adultOnly=true';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  }
};
