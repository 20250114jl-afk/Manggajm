/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Bookmark, 
  X, 
  Trash2, 
  ArrowRight, 
  Clock, 
  Plus, 
  Check, 
  BookOpen, 
  Edit3,
  BookmarkCheck
} from 'lucide-react';
import { PageBookmark } from '../types';

interface ReaderBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaTitle?: string;
  currentChapterId: string;
  currentChapterTitle?: string;
  currentPage: number;
  isCurrentPageBookmarked: boolean;
  bookmarks: PageBookmark[];
  onSelectBookmark: (bookmark: PageBookmark) => void;
  onAddCurrentPageBookmark: () => void;
  onDeleteBookmark: (id: string) => void;
  onUpdateBookmarkNote?: (id: string, note: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function ReaderBookmarksModal({
  isOpen,
  onClose,
  mangaTitle,
  currentChapterId,
  currentChapterTitle,
  currentPage,
  isCurrentPageBookmarked,
  bookmarks,
  onSelectBookmark,
  onAddCurrentPageBookmark,
  onDeleteBookmark,
  onUpdateBookmarkNote,
}: ReaderBookmarksModalProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'chapter'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  if (!isOpen) return null;

  const filteredBookmarks = filterMode === 'chapter'
    ? bookmarks.filter((b) => b.chapterId === currentChapterId)
    : bookmarks;

  const currentChapterBookmarksCount = bookmarks.filter((b) => b.chapterId === currentChapterId).length;

  const handleStartEdit = (b: PageBookmark) => {
    setEditingId(b.id);
    setEditNoteText(b.note || '');
  };

  const handleSaveNote = (id: string) => {
    if (onUpdateBookmarkNote) {
      onUpdateBookmarkNote(id, editNoteText.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="flex h-[85vh] max-h-[640px] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bookmark className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>책갈피 목록</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {bookmarks.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 line-clamp-1 max-w-[280px]">
                {mangaTitle || '이 만화에서 저장한 지점'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            title="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Add Current Page Action */}
        <div className="border-b border-white/5 bg-zinc-950/30 p-3.5 px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                현재 감상 중인 위치
              </span>
              <p className="text-xs font-bold text-zinc-200 truncate">
                {currentChapterTitle ? `${currentChapterTitle} • ` : ''}{currentPage}페이지
              </p>
            </div>

            <button
              onClick={onAddCurrentPageBookmark}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isCurrentPageBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                  : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-95'
              }`}
            >
              {isCurrentPageBookmarked ? (
                <>
                  <BookmarkCheck className="h-4 w-4" />
                  <span>책갈피 해제</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>현재 페이지 저장</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        {bookmarks.length > 0 && (
          <div className="flex border-b border-white/5 bg-zinc-950/20 px-5 pt-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
                filterMode === 'all'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              전체 책갈피 ({bookmarks.length})
            </button>
            <button
              onClick={() => setFilterMode('chapter')}
              className={`border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
                filterMode === 'chapter'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              현재 챕터 ({currentChapterBookmarksCount})
            </button>
          </div>
        )}

        {/* Bookmark List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredBookmarks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-zinc-600 mb-3 border border-white/5">
                <Bookmark className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">
                {filterMode === 'chapter' ? '현재 챕터에 저장된 책갈피가 없습니다' : '저장된 책갈피가 없습니다'}
              </p>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs leading-relaxed">
                읽기 화면에서 각 페이지 모서리의 🔖 아이콘이나 상단의 책갈피 버튼을 누르면 이 목록에 기록되어 언제든 바로 돌아올 수 있습니다.
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => {
              const isCurrentChapter = bookmark.chapterId === currentChapterId;
              const isCurrent = isCurrentChapter && bookmark.pageIndex === currentPage;

              return (
                <div
                  key={bookmark.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                    isCurrent
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-white/5 bg-zinc-950/40 hover:border-white/15 hover:bg-zinc-950/70'
                  }`}
                >
                  {/* Left: Thumbnail & Page Number */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800 border border-white/10">
                      {bookmark.imageUrl ? (
                        <img
                          src={bookmark.imageUrl}
                          alt={`Page ${bookmark.pageIndex}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 py-0.5 text-center text-[9px] font-bold text-amber-300">
                        p.{bookmark.pageIndex}
                      </div>
                    </div>

                    {/* Middle Info */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">
                          {bookmark.chapterTitle || `Chapter ${bookmark.chapterId}`}
                        </span>
                        {isCurrent && (
                          <span className="rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                            현재 위치
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="font-semibold text-amber-400">
                          {bookmark.pageIndex}페이지
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(bookmark.createdAt)}
                        </span>
                      </div>

                      {/* Note / Memo */}
                      {editingId === bookmark.id ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            placeholder="메모 입력..."
                            maxLength={40}
                            className="h-6 rounded bg-zinc-800 px-2 text-[11px] text-white outline-none border border-white/20 focus:border-amber-400"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveNote(bookmark.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveNote(bookmark.id)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-zinc-950 hover:bg-amber-400"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 group/note pt-0.5">
                          {bookmark.note ? (
                            <span className="text-zinc-300 italic line-clamp-1">"{bookmark.note}"</span>
                          ) : (
                            <span className="text-zinc-600 text-[10px] hidden group-hover:inline">메모 없음</span>
                          )}
                          <button
                            onClick={() => handleStartEdit(bookmark)}
                            className="text-zinc-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="메모 편집"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        onSelectBookmark(bookmark);
                        onClose();
                      }}
                      className="flex items-center gap-1 rounded-xl bg-blue-600/90 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm active:scale-95"
                      title="이 책갈피 위치로 이동"
                    >
                      <span>이동</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteBookmark(bookmark.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      title="책갈피 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-zinc-950/80 px-5 py-3 text-center text-[11px] text-zinc-500">
          책갈피를 클릭하면 해당 챕터와 페이지 위치로 즉시 스크롤됩니다.
        </div>
      </div>
    </div>
  );
}
