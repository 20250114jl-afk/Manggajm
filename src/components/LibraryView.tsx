/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, BookmarkCheck, ArrowLeft, Trash2, BookOpen, Clock, Search } from 'lucide-react';
import { BookmarkItem } from '../types';

interface LibraryViewProps {
  key?: string | number;
  bookmarks: BookmarkItem[];
  readChaptersMap: Record<string, string[]>;
  onSelectManga: (mangaId: string) => void;
  onRemoveBookmark: (mangaId: string) => void;
  onGoHome: () => void;
}

type SortOption = 'latest' | 'title';

export function LibraryView({
  bookmarks,
  readChaptersMap,
  onSelectManga,
  onRemoveBookmark,
  onGoHome,
}: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  const filteredBookmarks = bookmarks
    .filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'latest') return b.addedAt - a.addedAt;
      return a.title.localeCompare(b.title);
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <button
            onClick={onGoHome}
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>홈으로 돌아가기</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Bookmark className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">내 서재</h1>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                  {bookmarks.length}작품
                </span>
              </div>
              <p className="text-xs text-zinc-400">즐겨찾기로 보관한 만화와 읽기 진행 상황을 한눈에 확인하세요.</p>
            </div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        {bookmarks.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="서재 내 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900/90 py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex rounded-lg bg-zinc-900 p-1 border border-white/5 text-xs">
              <button
                onClick={() => setSortBy('latest')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  sortBy === 'latest' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                최근 추가순
              </button>
              <button
                onClick={() => setSortBy('title')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  sortBy === 'title' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                이름순
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bookmarks Grid or Empty State */}
      {bookmarks.length === 0 ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/30 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-500 mb-4 shadow-inner">
            <Bookmark className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">내 서재가 비어 있습니다</h3>
          <p className="max-w-sm text-xs text-zinc-400 leading-relaxed mb-6">
            마음에 드는 만화 상세 페이지나 카드에서 북마크 아이콘을 누르면 이곳에 저장되어 빠르게 찾아볼 수 있습니다.
          </p>
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
            <span>인기 만화 둘러보기</span>
          </button>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-zinc-400">"{searchQuery}"에 일치하는 보관 만화가 없습니다.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-blue-400 hover:underline"
          >
            검색어 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredBookmarks.map((manga) => {
            const readCount = (readChaptersMap[manga.id] || []).length;
            return (
              <motion.div
                key={manga.id}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-lg hover:border-blue-500/40 hover:shadow-2xl transition-all"
              >
                {/* Image Container */}
                <div
                  className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-zinc-950"
                  onClick={() => onSelectManga(manga.id)}
                >
                  <img
                    src={manga.image}
                    alt={manga.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />

                  {/* Bookmark Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBookmark(manga.id);
                    }}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/70 text-blue-400 shadow-md backdrop-blur-md hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    title="서재에서 제거"
                  >
                    <BookmarkCheck className="h-4 w-4 fill-current" />
                  </button>

                  {/* Reading Progress Tag */}
                  {readCount > 0 ? (
                    <div className="absolute bottom-2 left-2 rounded-md bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      {readCount}화 읽음
                    </div>
                  ) : (
                    <div className="absolute bottom-2 left-2 rounded-md bg-zinc-800/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                      미열람
                    </div>
                  )}
                </div>

                {/* Info */}
                <div
                  className="flex flex-1 flex-col justify-between p-3 cursor-pointer"
                  onClick={() => onSelectManga(manga.id)}
                >
                  <div>
                    <h3 className="line-clamp-2 text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {manga.title}
                    </h3>
                    {manga.author && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">{manga.author}</p>
                    )}
                    {manga.genres && manga.genres.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {manga.genres.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            className="rounded bg-zinc-800/90 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 border border-white/5"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(manga.addedAt).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(manga.id);
                      }}
                      className="text-zinc-500 hover:text-red-400"
                      title="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
