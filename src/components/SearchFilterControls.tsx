/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Filter, RotateCcw, Check, ChevronDown, ChevronUp, Sparkles, BookOpen, Clock } from 'lucide-react';
import { Manga } from '../types';

export type StatusFilterOption = 'all' | 'ongoing' | 'completed' | 'hiatus';

export const GENRE_KOREAN_NAMES: Record<string, string> = {
  'Action': '액션',
  'Romance': '로맨스',
  'Fantasy': '판타지',
  'Comedy': '코미디',
  'Drama': '드라마',
  'Adventure': '모험',
  'Sci-Fi': 'SF',
  'Mystery': '미스터리',
  'Slice of Life': '일상',
  'Supernatural': '초자연',
  'Horror': '공포',
  'Sports': '스포츠',
  'Thriller': '스릴러',
  'Psychological': '심리',
  'Historical': '역사/시대',
  'Isekai': '이세계',
  'Martial Arts': '무협',
  'School Life': '학원',
  'Magic': '마법',
  'Shounen': '소년',
  'Shoujo': '순정',
  'Seinen': '청년',
  'Josei': '여성',
  'Tragedy': '비극',
  'Crime': '범죄',
  'Post-Apocalyptic': '아포칼립스',
  'Mecha': '메카닉',
  'Music': '음악',
  'Food': '요리/음식',
};

export function getGenreLabel(englishName: string): string {
  return GENRE_KOREAN_NAMES[englishName] || englishName;
}

interface SearchFilterControlsProps {
  results: Manga[];
  selectedStatus: StatusFilterOption;
  selectedGenre: string; // 'all' or genre name
  koreanOnly: boolean;
  adultOnly?: boolean;
  onStatusChange: (status: StatusFilterOption) => void;
  onGenreChange: (genre: string) => void;
  onToggleKoreanOnly: (koreanOnly: boolean) => void;
  onToggleAdultOnly?: (adultOnly: boolean) => void;
  onResetFilters: () => void;
  filteredCount: number;
}

export function SearchFilterControls({
  results,
  selectedStatus,
  selectedGenre,
  koreanOnly,
  adultOnly = false,
  onStatusChange,
  onGenreChange,
  onToggleKoreanOnly,
  onToggleAdultOnly,
  onResetFilters,
  filteredCount,
}: SearchFilterControlsProps) {
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Count how many results have Korean translations
  const koreanCount = useMemo(() => {
    return results.filter((m) => m.hasKorean).length;
  }, [results]);

  // Count how many results are 19+ Adult
  const adultCount = useMemo(() => {
    return results.filter((m) => m.isAdult).length;
  }, [results]);

  // Calculate status counts based on current genre, korean, and adult filter
  const statusCounts = useMemo(() => {
    let baseList = selectedGenre === 'all'
      ? results
      : results.filter((m) => m.genres?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));

    if (koreanOnly) {
      baseList = baseList.filter((m) => m.hasKorean);
    }
    if (adultOnly) {
      baseList = baseList.filter((m) => m.isAdult);
    }

    const counts: Record<StatusFilterOption, number> = {
      all: baseList.length,
      ongoing: 0,
      completed: 0,
      hiatus: 0,
    };

    for (const item of baseList) {
      const s = item.status?.toLowerCase();
      if (s === 'ongoing') counts.ongoing++;
      else if (s === 'completed') counts.completed++;
      else if (s === 'hiatus') counts.hiatus++;
    }

    return counts;
  }, [results, selectedGenre, koreanOnly, adultOnly]);

  // Extract all distinct genres from search results with counts
  const availableGenres = useMemo(() => {
    let baseList = selectedStatus === 'all'
      ? results
      : results.filter((m) => {
          const s = m.status?.toLowerCase();
          if (selectedStatus === 'ongoing') return s === 'ongoing';
          if (selectedStatus === 'completed') return s === 'completed';
          if (selectedStatus === 'hiatus') return s === 'hiatus';
          return true;
        });

    if (koreanOnly) {
      baseList = baseList.filter((m) => m.hasKorean);
    }
    if (adultOnly) {
      baseList = baseList.filter((m) => m.isAdult);
    }

    const genreMap = new Map<string, number>();
    for (const item of baseList) {
      if (item.genres && Array.isArray(item.genres)) {
        for (const g of item.genres) {
          genreMap.set(g, (genreMap.get(g) || 0) + 1);
        }
      }
    }

    // Sort by count descending, then alphabetically
    return Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count, label: getGenreLabel(name) }));
  }, [results, selectedStatus, koreanOnly, adultOnly]);

  const isFilterActive = selectedStatus !== 'all' || selectedGenre !== 'all' || koreanOnly || adultOnly;

  // Number of genres to show initially before expanding
  const visibleGenres = showAllGenres ? availableGenres : availableGenres.slice(0, 10);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Header: Title, Active Filter Badge & Reset Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">상세 필터링</h3>
          </div>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
            {filteredCount} / {results.length}작품
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Korean Only Toggle */}
          <button
            onClick={() => onToggleKoreanOnly(!koreanOnly)}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
              koreanOnly
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-400/40'
                : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
            }`}
            title="한국어 번역본만 보기"
          >
            <span>🇰🇷</span>
            <span className="hidden sm:inline">한국어 번역만</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                koreanOnly ? 'bg-rose-700 text-white' : 'bg-rose-950 text-rose-300'
              }`}
            >
              {koreanCount}
            </span>
          </button>

          {/* Quick 19+ Adult Toggle */}
          {onToggleAdultOnly && (
            <button
              onClick={() => onToggleAdultOnly(!adultOnly)}
              className={`flex items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-black transition-all ${
                adultOnly
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-400/40'
                  : 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
              }`}
              title="19+ 성인 만화만 보기"
            >
              <span>🔞</span>
              <span className="hidden sm:inline">19+ 성인만</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  adultOnly ? 'bg-red-700 text-white' : 'bg-red-950 text-red-300'
                }`}
              >
                {adultCount}
              </span>
            </button>
          )}

          {isFilterActive && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3 text-zinc-400" />
              <span>필터 초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Status Filter (연재 상태: 전체, 연재 중, 완결, 휴재) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            연재 상태
          </span>
          {selectedStatus !== 'all' && (
            <span className="text-[11px] font-medium text-blue-400">
              {selectedStatus === 'ongoing' ? '연재 중 선택됨' : selectedStatus === 'completed' ? '완결 선택됨' : '휴재 선택됨'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* All */}
          <button
            onClick={() => onStatusChange('all')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'border border-white/5 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {selectedStatus === 'all' && <Check className="h-3 w-3" />}
            <span>전체</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedStatus === 'all' ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {statusCounts.all}
            </span>
          </button>

          {/* Ongoing */}
          <button
            onClick={() => onStatusChange('ongoing')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedStatus === 'ongoing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'border border-white/5 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {selectedStatus === 'ongoing' && <Check className="h-3 w-3" />}
            <span>연재 중</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedStatus === 'ongoing' ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {statusCounts.ongoing}
            </span>
          </button>

          {/* Completed */}
          <button
            onClick={() => onStatusChange('completed')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedStatus === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'border border-white/5 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {selectedStatus === 'completed' && <Check className="h-3 w-3" />}
            <span>완결</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedStatus === 'completed' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {statusCounts.completed}
            </span>
          </button>

          {/* Hiatus (only show if any match) */}
          {statusCounts.hiatus > 0 && (
            <button
              onClick={() => onStatusChange('hiatus')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedStatus === 'hiatus'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                  : 'border border-white/5 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {selectedStatus === 'hiatus' && <Check className="h-3 w-3" />}
              <span>휴재</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedStatus === 'hiatus' ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {statusCounts.hiatus}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Genre Filter (장르별 필터링) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
            장르
          </span>
          {selectedGenre !== 'all' && (
            <span className="text-[11px] font-medium text-blue-400">
              {getGenreLabel(selectedGenre)} ({selectedGenre}) 선택됨
            </span>
          )}
        </div>

        {availableGenres.length === 0 ? (
          <p className="text-xs text-zinc-500">선택된 상태에 해당하는 장르 정보가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {/* All Genres */}
              <button
                onClick={() => onGenreChange('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedGenre === 'all'
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                    : 'border border-white/5 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                전체 장르
              </button>

              {/* Individual Genres */}
              {visibleGenres.map((genre) => {
                const isSelected = selectedGenre.toLowerCase() === genre.name.toLowerCase();
                return (
                  <button
                    key={genre.name}
                    onClick={() => onGenreChange(isSelected ? 'all' : genre.name)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                        : 'border border-white/5 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span>{genre.label}</span>
                    {genre.label !== genre.name && (
                      <span className="text-[10px] opacity-60">({genre.name})</span>
                    )}
                    <span
                      className={`rounded px-1 py-0.2 text-[9px] ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      {genre.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Expand / Collapse More Genres */}
            {availableGenres.length > 10 && (
              <button
                onClick={() => setShowAllGenres(!showAllGenres)}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors pt-1"
              >
                {showAllGenres ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    <span>장르 접기</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    <span>외 {availableGenres.length - 10}개 장르 더보기</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Summary Bar (if any filter is selected) */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs text-zinc-400">
          <span className="text-[11px] text-zinc-500">적용된 필터:</span>
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-400">
              상태: {selectedStatus === 'ongoing' ? '연재 중' : selectedStatus === 'completed' ? '완결' : '휴재'}
              <button
                onClick={() => onStatusChange('all')}
                className="hover:text-white"
                title="상태 필터 해제"
              >
                ✕
              </button>
            </span>
          )}
          {koreanOnly && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-400">
              🇰🇷 한국어 번역만
              <button
                onClick={() => onToggleKoreanOnly(false)}
                className="hover:text-white"
                title="한국어 필터 해제"
              >
                ✕
              </button>
            </span>
          )}
          {adultOnly && onToggleAdultOnly && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
              🔞 19+ 성인만
              <button
                onClick={() => onToggleAdultOnly(false)}
                className="hover:text-white"
                title="성인 필터 해제"
              >
                ✕
              </button>
            </span>
          )}
          {selectedGenre !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-400">
              장르: {getGenreLabel(selectedGenre)}
              <button
                onClick={() => onGenreChange('all')}
                className="hover:text-white"
                title="장르 필터 해제"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
