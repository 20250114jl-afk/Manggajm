/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Sparkles, Compass, Bookmark, RefreshCw, ChevronRight } from 'lucide-react';
import { Manga, BookmarkItem } from '../types';
import { MangaCard } from './MangaCard';
import { getGenreLabel } from './SearchFilterControls';

interface RecommendationSectionProps {
  recommendations: Manga[];
  topGenres: { name: string; count: number; label: string }[];
  bookmarkCount: number;
  loading: boolean;
  onRefresh: () => void;
  onSelectManga: (id: string) => void;
  onOpenLibrary: () => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark?: (manga: Manga) => void;
}

export function RecommendationSection({
  recommendations,
  topGenres,
  bookmarkCount,
  loading,
  onRefresh,
  onSelectManga,
  onOpenLibrary,
  isBookmarked,
  onToggleBookmark,
}: RecommendationSectionProps) {
  return (
    <section className="space-y-4">
      {/* Header with Title and Genre Flavor Tags */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              나를 위한 추천
              <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-xs font-semibold">
                AI 취향 분석
              </span>
            </h2>
          </div>

          <p className="text-xs text-zinc-400">
            {bookmarkCount > 0 ? (
              topGenres.length > 0 ? (
                <span>
                  내 서재의{' '}
                  <span className="font-semibold text-purple-300">
                    {topGenres.map((g) => g.label).join(', ')}
                  </span>{' '}
                  선호 장르를 분석하여 발견한 맞춤 작품들입니다.
                </span>
              ) : (
                <span>내 서재의 즐겨찾기 작품들을 기반으로 유사한 만화를 엄선했습니다.</span>
              )
            ) : (
              <span>서재에 만화를 북마크하면 취향에 맞춘 정교한 추천을 받을 수 있습니다.</span>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {bookmarkCount > 0 && (
            <button
              onClick={onOpenLibrary}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Bookmark className="h-3.5 w-3.5 text-blue-400" />
              <span>내 서재 ({bookmarkCount})</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50"
            title="추천 만화 새로고침"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>새로운 추천</span>
          </button>
        </div>
      </div>

      {/* Top Analyzed Genre Badges */}
      {topGenres.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-medium text-zinc-500">분석된 선호 장르:</span>
          {topGenres.map((g) => (
            <span
              key={g.name}
              className="inline-flex items-center gap-1 rounded-lg bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-200 shadow-sm"
            >
              <span>{g.label}</span>
              <span className="rounded-full bg-purple-800/60 px-1.5 py-0.1 text-[10px] text-purple-300">
                {g.count}편
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Recommendations Carousel or Grid */}
      {loading && recommendations.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-900/60" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recommendations.slice(0, 12).map((manga) => (
            <MangaCard
              key={manga.id}
              manga={manga}
              onClick={onSelectManga}
              isBookmarked={isBookmarked(manga.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-8 text-center space-y-3">
          <Compass className="h-10 w-10 text-purple-400/60" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-300">맞춤 추천 만화를 준비하고 있습니다</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              내 서재에 좋아하는 만화를 추가해보세요. 장르와 키워드를 실시간 분석하여 추천해 드립니다.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
