/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Home, Bookmark, BookOpen, Layers } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onHome: () => void;
  onOpenLibrary: () => void;
  onOpenCategories?: () => void;
  activeTab: 'home' | 'library' | 'other';
  currentQuery: string;
  bookmarkCount: number;
}

export function Navbar({
  onSearch,
  onHome,
  onOpenLibrary,
  onOpenCategories,
  activeTab,
  currentQuery,
  bookmarkCount,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 gap-2 sm:gap-4">
        {/* Brand */}
        <button 
          onClick={onHome}
          className="flex items-center gap-2 text-lg sm:text-xl font-black tracking-tight text-white transition-opacity hover:opacity-85 flex-shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="hidden xs:inline sm:inline">만화 리더</span>
        </button>

        {/* Search Bar */}
        <div className="relative flex flex-1 max-w-md mx-2">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="만화 제목, 작가 검색..."
            value={currentQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-full border border-white/5 bg-zinc-900/90 py-2 pl-9 pr-4 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
          />
        </div>

        {/* Navigation Actions: Home, Categories & My Library */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button 
            onClick={onHome}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            }`}
            title="홈 화면"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">홈</span>
          </button>

          {onOpenCategories && (
            <button
              onClick={onOpenCategories}
              className="flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-all"
              title="카테고리 및 분류"
            >
              <div className="relative flex items-center">
                <Layers className="h-4 w-4 text-blue-400" />
                {/* Mobile subtle badge indicator */}
                <span className="sm:hidden absolute -top-1 -right-1 flex h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-zinc-950" />
              </div>
              <span className="hidden sm:inline">분류</span>
            </button>
          )}

          <button 
            onClick={onOpenLibrary}
            className={`relative flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            }`}
            title="내 서재 (북마크)"
          >
            <Bookmark className={`h-4 w-4 ${activeTab === 'library' ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">내 서재</span>
            {bookmarkCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'library'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {bookmarkCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
