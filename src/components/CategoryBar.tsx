/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CATEGORIES_LIST, CategoryItem } from '../data/categories';
import { Layers, Flame, ChevronRight } from 'lucide-react';

interface CategoryBarProps {
  selectedCategoryId: string;
  onSelectCategory: (category: CategoryItem) => void;
  koreanOnly: boolean;
  onToggleKoreanOnly: (val: boolean) => void;
  adultOnly: boolean;
  onToggleAdultOnly: (val: boolean) => void;
}

export function CategoryBar({
  selectedCategoryId,
  onSelectCategory,
  koreanOnly,
  onToggleKoreanOnly,
  adultOnly,
  onToggleAdultOnly,
}: CategoryBarProps) {
  return (
    <div className="space-y-3">
      {/* Quick Filter Header & Fast Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 flex-shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-bold text-white">
              <span className="sm:hidden">카테고리</span>
              <span className="hidden sm:inline">카테고리 & 분류</span>
            </h3>
          </div>
        </div>

        {/* Quick Toggles: Korean Only & 19+ Adult Only (Badges on mobile, full text on computer) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Korean Only Toggle */}
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
            <span className="hidden sm:inline">한국어</span>
            {koreanOnly && <span className="rounded-full bg-rose-800 px-1 text-[9px]">ON</span>}
          </button>

          {/* 19+ Adult Toggle */}
          <button
            onClick={() => onToggleAdultOnly(!adultOnly)}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-black transition-all ${
              adultOnly
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-400/40 animate-pulse'
                : 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
            }`}
            title="19+ 성인 만화만 보기"
          >
            <span>🔞</span>
            <span className="hidden sm:inline">19+ 성인</span>
            {adultOnly && <span className="rounded-full bg-red-800 px-1 text-[9px]">ON</span>}
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scroll / Carousel */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-1">
        {CATEGORIES_LIST.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const isAdultTab = cat.id === 'adult';

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                isSelected
                  ? isAdultTab
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/40'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : isAdultTab
                  ? 'border border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/40'
                  : 'border border-white/5 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.name}</span>
              {isAdultTab && (
                <span className="rounded-md bg-red-600/80 px-1.5 py-0.2 text-[10px] font-black text-white">
                  19
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
