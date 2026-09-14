/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { History, BookOpen, Clock, Trash2, X, Play } from 'lucide-react';
import { RecentlyViewedItem } from '../types';

interface RecentlyViewedSectionProps {
  items: RecentlyViewedItem[];
  onSelectManga: (mangaId: string) => void;
  onContinueChapter?: (mangaId: string, chapterId: string) => void;
  onRemoveItem: (mangaId: string) => void;
  onClearAll: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export function RecentlyViewedSection({
  items,
  onSelectManga,
  onContinueChapter,
  onRemoveItem,
  onClearAll,
}: RecentlyViewedSectionProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">최근 본 만화</h2>
        </div>
        <p className="text-xs text-zinc-400">
          최근에 열람하거나 감상한 만화가 이곳에 자동으로 기록되어 언제든 바로 이어볼 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <History className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">최근 본 만화</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                {items.length}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClearAll}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors"
          title="최근 본 기록 전체 삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>기록 비우기</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide pt-1">
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -3 }}
            className="group relative flex min-w-[240px] max-w-[280px] flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-zinc-900/70 p-3 shadow-md hover:border-blue-500/30 hover:bg-zinc-900 transition-all"
            onClick={() => onSelectManga(item.id)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[3/4] w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-950 shadow-inner">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-700">
                  <BookOpen className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="ml-3 flex flex-1 flex-col justify-between py-0.5 overflow-hidden">
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-200 transition-all"
                    title="목록에서 삭제"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {item.lastChapterTitle ? (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 line-clamp-1">
                      <BookOpen className="h-2.5 w-2.5 flex-shrink-0" />
                      <span className="truncate">{item.lastChapterTitle}</span>
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-zinc-500">열람 기록 있음</p>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  <span>{formatTimeAgo(item.lastViewedAt)}</span>
                </div>

                {item.lastChapterId && onContinueChapter ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onContinueChapter(item.id, item.lastChapterId!);
                    }}
                    className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" />
                    <span>이어보기</span>
                  </button>
                ) : (
                  <span className="font-medium text-zinc-400 group-hover:text-zinc-200">
                    상세보기 →
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
