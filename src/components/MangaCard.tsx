/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Eye, Clock, User, Bookmark } from 'lucide-react';
import { Manga } from '../types';

interface MangaCardProps {
  key?: string | number;
  manga: Manga;
  onClick: (id: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (manga: Manga) => void;
}

export function MangaCard({ manga, onClick, isBookmarked, onToggleBookmark }: MangaCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-zinc-900 shadow-lg transition-all hover:shadow-2xl border border-white/5 hover:border-blue-500/30"
      onClick={() => onClick(manga.id)}
    >
      <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-950">
        <img
          src={manga.image}
          alt={manga.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

      {/* Bookmark quick button */}
      {onToggleBookmark && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(manga);
          }}
          className={`absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all ${
            isBookmarked
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-zinc-950/60 text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-950 hover:text-white'
          }`}
          title={isBookmarked ? '즐겨찾기 해제' : '내 서재에 추가'}
        >
          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
          {manga.koreanTitle || manga.title}
        </h3>
        {manga.koreanTitle && manga.koreanTitle !== manga.title && (
          <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-400">
            {manga.title}
          </p>
        )}

        {/* Classification genre words - visible on computer/desktop, hidden on mobile for clutter-free readability */}
        {manga.genres && manga.genres.length > 0 && (
          <div className="mt-1.5 hidden sm:flex flex-wrap gap-1">
            {manga.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="rounded bg-zinc-800/90 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300 border border-white/5"
              >
                {g}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[10px] text-zinc-400">
          {manga.author && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="line-clamp-1">{manga.author}</span>
            </div>
          )}
          {manga.view && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{manga.view}</span>
            </div>
          )}
          {manga.update && (
            <div className="flex items-center gap-1 text-blue-400">
              <Clock className="h-3 w-3" />
              <span>{manga.update}</span>
            </div>
          )}
        </div>
      </div>

      {/* Top right badges: Mobile shows compact badge icon, Desktop includes text */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
        {manga.isAdult && (
          <div 
            className="rounded-md bg-red-600/95 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-black text-white shadow-md border border-red-400/40"
            title="19+ 성인 만화"
          >
            <span>🔞</span>
            <span className="hidden sm:inline ml-0.5">19+</span>
          </div>
        )}
        {manga.isOriginalKorean && (
          <div 
            className="rounded-md bg-rose-700/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-black text-white shadow-md border border-rose-400/30"
            title="한국 오리지널 웹툰"
          >
            <span>🇰🇷</span>
            <span className="hidden sm:inline ml-0.5">웹툰</span>
          </div>
        )}
        {manga.hasKorean && !manga.isOriginalKorean && (
          <div 
            className="rounded-md bg-rose-600/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-black text-white shadow-md"
            title="한국어 번역본 제공"
          >
            <span>🇰🇷</span>
            <span className="hidden sm:inline ml-0.5">한국어</span>
          </div>
        )}
        {manga.latestChapter && (
          <div className="rounded-md bg-blue-600/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-lg">
            {manga.latestChapter}
          </div>
        )}
        {manga.status && manga.status !== 'unknown' && (
          <div className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-md shadow ${
            manga.status === 'completed'
              ? 'bg-emerald-600/90 text-white'
              : manga.status === 'ongoing'
              ? 'bg-zinc-800/90 text-zinc-300 border border-white/10'
              : 'bg-amber-600/90 text-white'
          }`}>
            <span className="sm:hidden">
              {manga.status === 'completed' ? '완결' : manga.status === 'ongoing' ? '연재' : manga.status}
            </span>
            <span className="hidden sm:inline">
              {manga.status === 'completed' ? '완결' : manga.status === 'ongoing' ? '연재 중' : manga.status}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
