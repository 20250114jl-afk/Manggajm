/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  RotateCcw,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { Chapter, ChapterImagesResponse, PageBookmark } from '../types';
import { 
  getPageBookmarks, 
  togglePageBookmark, 
  removePageBookmark, 
  savePageBookmark 
} from '../lib/storage';
import { ReaderBookmarksModal } from './ReaderBookmarksModal';

interface ReaderViewProps {
  key?: string | number;
  mangaId: string;
  chapterId: string;
  chapterTitle?: string;
  mangaTitle?: string;
  chapters?: Chapter[];
  initialPageIndex?: number;
  onBack: () => void;
  onNavigateChapter?: (chapterId: string, chapterTitle?: string, chapters?: Chapter[], pageIndex?: number) => void;
  onMarkRead?: (chapterId: string) => void;
}

export function ReaderView({
  mangaId,
  chapterId,
  chapterTitle,
  mangaTitle,
  chapters,
  initialPageIndex,
  onBack,
  onNavigateChapter,
  onMarkRead,
}: ReaderViewProps) {
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const [currentChapterTitle, setCurrentChapterTitle] = useState(chapterTitle);
  const [chapterList, setChapterList] = useState<Chapter[]>(chapters || []);
  const [data, setData] = useState<ChapterImagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Bookmark & Page reading state
  const [bookmarks, setBookmarks] = useState<PageBookmark[]>(() => getPageBookmarks(mangaId));
  const [visiblePageIndex, setVisiblePageIndex] = useState<number>(initialPageIndex || 1);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [highlightedPageIndex, setHighlightedPageIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const targetScrollPageRef = useRef<number | null>(initialPageIndex || null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync props when changed externally
  useEffect(() => {
    setCurrentChapterId(chapterId);
    if (chapterTitle) {
      setCurrentChapterTitle(chapterTitle);
    }
  }, [chapterId, chapterTitle]);

  useEffect(() => {
    if (chapters && chapters.length > 0) {
      setChapterList(chapters);
    }
  }, [chapters]);

  useEffect(() => {
    if (initialPageIndex) {
      targetScrollPageRef.current = initialPageIndex;
    }
  }, [initialPageIndex]);

  // If chapter list is not supplied (e.g. opened from recently viewed), fetch it in background
  useEffect(() => {
    if (chapterList.length > 0) return;
    let active = true;

    async function fetchChapters() {
      try {
        const res = await api.getChapterInfo(mangaId);
        if (active && res?.chapters && res.chapters.length > 0) {
          setChapterList(res.chapters);
        }
      } catch (e) {
        console.error('Failed to load chapter list for reader navigation:', e);
      }
    }

    fetchChapters();
    return () => {
      active = false;
    };
  }, [mangaId, chapterList.length]);

  // Load chapter images
  const loadImages = useCallback(async (cId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.fetchChapterImages(mangaId, cId);
      setData(res);
      if (onMarkRead) {
        onMarkRead(cId);
      }
    } catch (err) {
      console.error(err);
      setError('챕터 이미지를 불러오지 못했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [mangaId, onMarkRead]);

  useEffect(() => {
    loadImages(currentChapterId);
  }, [currentChapterId, loadImages]);

  // Toast Helper
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Smooth scroll to a specific page
  const scrollToPage = useCallback((pageIndex: number, highlight: boolean = true) => {
    setTimeout(() => {
      const el = document.getElementById(`reader-page-${pageIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setVisiblePageIndex(pageIndex);
        if (highlight) {
          setHighlightedPageIndex(pageIndex);
          setTimeout(() => {
            setHighlightedPageIndex((prev) => (prev === pageIndex ? null : prev));
          }, 2500);
        }
      }
    }, 150);
  }, []);

  // Handle scrolling to pending target page after images loaded
  useEffect(() => {
    if (!loading && data && data.images.length > 0 && targetScrollPageRef.current) {
      const target = targetScrollPageRef.current;
      targetScrollPageRef.current = null;
      scrollToPage(target, true);
    }
  }, [loading, data, scrollToPage]);

  // Scroll listener to update visible page index
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !data?.images || data.images.length === 0) return;
    const container = scrollRef.current;
    const containerTop = container.scrollTop;
    const triggerOffset = containerTop + 160; // 160px from top of viewport

    let activePage = 1;
    for (let i = 1; i <= data.images.length; i++) {
      const el = document.getElementById(`reader-page-${i}`);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (top <= triggerOffset && bottom >= containerTop) {
          activePage = i;
          break;
        } else if (top > triggerOffset) {
          break;
        }
        activePage = i;
      }
    }
    setVisiblePageIndex(activePage);
  }, [data]);

  // Compute ordered chapters and identify previous/next
  const { prevChapter, nextChapter, currentIndex, totalChaptersCount } = useMemo(() => {
    if (!chapterList || chapterList.length === 0) {
      return { prevChapter: null, nextChapter: null, currentIndex: -1, totalChaptersCount: 0 };
    }

    // Find current chapter metadata to match language if available
    const currObj = chapterList.find((c) => c.chapterID === currentChapterId);
    const targetLang = currObj?.language;

    // Filter by same language if available
    let candidates = chapterList;
    if (targetLang) {
      const sameLang = chapterList.filter((c) => c.language === targetLang);
      if (sameLang.some((c) => c.chapterID === currentChapterId)) {
        candidates = sameLang;
      }
    }

    // Sort ascending by chapter sequence (Chapter 1 -> 2 -> 3...)
    const sorted = [...candidates].sort((a, b) => {
      const numA = parseFloat(a.chapterNum ?? '');
      const numB = parseFloat(b.chapterNum ?? '');
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      if (a.publishAt && b.publishAt) {
        const diff = new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime();
        if (diff !== 0) return diff;
      }
      return 0;
    });

    const idx = sorted.findIndex((c) => c.chapterID === currentChapterId);
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

    return {
      prevChapter: prev,
      nextChapter: next,
      currentIndex: idx,
      totalChaptersCount: sorted.length,
    };
  }, [chapterList, currentChapterId]);

  // Handler to switch chapter
  const handleSelectChapter = useCallback((targetChapter: Chapter, targetPage?: number) => {
    setCurrentChapterId(targetChapter.chapterID);
    setCurrentChapterTitle(targetChapter.chapterTitle);
    if (targetPage) {
      targetScrollPageRef.current = targetPage;
    } else {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      setVisiblePageIndex(1);
    }
    if (onNavigateChapter) {
      onNavigateChapter(targetChapter.chapterID, targetChapter.chapterTitle, chapterList, targetPage);
    }
  }, [onNavigateChapter, chapterList]);

  // Bookmark actions
  const isCurrentPageBookmarked = useMemo(() => {
    return bookmarks.some(
      (b) => b.chapterId === currentChapterId && b.pageIndex === visiblePageIndex
    );
  }, [bookmarks, currentChapterId, visiblePageIndex]);

  const handleToggleBookmark = useCallback((pageIndex: number, imgUrl?: string) => {
    const targetImage = imgUrl || data?.images[pageIndex - 1]?.img;
    const result = togglePageBookmark({
      mangaId,
      mangaTitle,
      chapterId: currentChapterId,
      chapterTitle: currentChapterTitle,
      pageIndex,
      imageUrl: targetImage,
    });

    setBookmarks(getPageBookmarks(mangaId));
    if (result.bookmarked) {
      showToast(`🔖 ${pageIndex}페이지가 책갈피에 저장되었습니다.`);
    } else {
      showToast(`${pageIndex}페이지 책갈피가 해제되었습니다.`);
    }
  }, [mangaId, mangaTitle, currentChapterId, currentChapterTitle, data, showToast]);

  const handleDeleteBookmark = useCallback((id: string) => {
    removePageBookmark(id);
    setBookmarks(getPageBookmarks(mangaId));
    showToast('책갈피가 삭제되었습니다.');
  }, [mangaId, showToast]);

  const handleUpdateBookmarkNote = useCallback((id: string, note: string) => {
    const current = bookmarks.find((b) => b.id === id);
    if (current) {
      savePageBookmark({ ...current, note });
      setBookmarks(getPageBookmarks(mangaId));
      showToast('메모가 저장되었습니다.');
    }
  }, [bookmarks, mangaId, showToast]);

  const handleSelectBookmark = useCallback((bookmark: PageBookmark) => {
    if (bookmark.chapterId === currentChapterId) {
      // In same chapter: scroll to page directly
      scrollToPage(bookmark.pageIndex, true);
      showToast(`🔖 ${bookmark.pageIndex}페이지 책갈피로 이동했습니다.`);
    } else {
      // In different chapter: switch chapter and set target scroll page
      const foundChapter = chapterList.find((c) => c.chapterID === bookmark.chapterId);
      if (foundChapter) {
        handleSelectChapter(foundChapter, bookmark.pageIndex);
      } else {
        // Direct jump using ID
        setCurrentChapterId(bookmark.chapterId);
        setCurrentChapterTitle(bookmark.chapterTitle);
        targetScrollPageRef.current = bookmark.pageIndex;
        if (onNavigateChapter) {
          onNavigateChapter(bookmark.chapterId, bookmark.chapterTitle, chapterList, bookmark.pageIndex);
        }
      }
      showToast(`🔖 ${bookmark.chapterTitle || '해당 챕터'} ${bookmark.pageIndex}페이지로 이동 중...`);
    }
  }, [currentChapterId, scrollToPage, showToast, chapterList, handleSelectChapter, onNavigateChapter]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const displayTitle = currentChapterTitle || (data ? `Chapter ${data.chapterID}` : '챕터 로딩 중...');
  const totalPages = data?.images?.length || 0;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 overflow-hidden select-none">
      {/* Top Bar with Chapter Title, Navigation Arrows & Bookmarks */}
      <div className="flex h-14 items-center justify-between border-b border-white/5 bg-zinc-950/95 px-2.5 sm:px-4 backdrop-blur-md z-10">
        {/* Left: Back button & Manga Title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onBack}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            title="상세 페이지로 돌아가기"
            aria-label="목록으로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          {mangaTitle && (
            <div className="hidden lg:flex flex-col max-w-[140px] xl:max-w-[200px]">
              <span className="text-[10px] uppercase font-bold text-zinc-500">작품</span>
              <span className="text-xs font-semibold text-zinc-300 truncate" title={mangaTitle}>
                {mangaTitle}
              </span>
            </div>
          )}
        </div>

        {/* Center: Previous Arrow + Chapter Title & Page Indicator + Next Arrow */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {/* Previous Chapter Button */}
          <button
            onClick={() => prevChapter && handleSelectChapter(prevChapter)}
            disabled={!prevChapter || loading}
            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all ${
              prevChapter && !loading
                ? 'bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white active:scale-90 border border-white/5'
                : 'text-zinc-600 opacity-25 cursor-not-allowed'
            }`}
            title={prevChapter ? `이전 챕터: ${prevChapter.chapterTitle}` : '첫 번째 챕터입니다'}
            aria-label="이전 챕터로 이동"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Current Chapter Info */}
          <div className="flex flex-col items-center justify-center px-1 sm:px-3 text-center min-w-0 max-w-[140px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-sm">
            <h2
              className="text-xs sm:text-sm font-bold text-white line-clamp-1 truncate"
              title={displayTitle}
            >
              {displayTitle}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              {chapterList.find((c) => c.chapterID === currentChapterId)?.language === 'ko' && (
                <span className="rounded bg-rose-950/80 border border-rose-500/40 px-1 py-0.2 text-[9px] font-bold text-rose-300">
                  🇰🇷 한국어
                </span>
              )}
              {totalPages > 0 ? (
                <span className="text-amber-400 font-semibold">
                  p.{visiblePageIndex} / {totalPages}
                </span>
              ) : null}
              {currentIndex >= 0 && totalChaptersCount > 0 && (
                <span className="text-zinc-500 hidden sm:inline">
                  • {currentIndex + 1}/{totalChaptersCount}화
                </span>
              )}
            </div>
          </div>

          {/* Next Chapter Button */}
          <button
            onClick={() => nextChapter && handleSelectChapter(nextChapter)}
            disabled={!nextChapter || loading}
            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all ${
              nextChapter && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30 active:scale-90'
                : 'bg-white/5 text-zinc-600 opacity-25 cursor-not-allowed'
            }`}
            title={nextChapter ? `다음 챕터: ${nextChapter.chapterTitle}` : '마지막 챕터입니다'}
            aria-label="다음 챕터로 이동"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Right: Quick Bookmark, Bookmark List Modal, Read Badge, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Quick Bookmark Toggle for Current Page */}
          {totalPages > 0 && (
            <button
              onClick={() => handleToggleBookmark(visiblePageIndex)}
              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all active:scale-90 ${
                isCurrentPageBookmarked
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
              title={
                isCurrentPageBookmarked
                  ? `현재 ${visiblePageIndex}페이지 책갈피 해제`
                  : `현재 ${visiblePageIndex}페이지 책갈피 저장`
              }
              aria-label="현재 페이지 책갈피"
            >
              <Bookmark className={`h-4 w-4 ${isCurrentPageBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}

          {/* Open Bookmarks Drawer / Modal */}
          <button
            onClick={() => setIsBookmarksModalOpen(true)}
            className={`relative flex h-8 items-center gap-1.5 rounded-xl px-2 sm:px-2.5 text-xs font-bold transition-all active:scale-95 ${
              bookmarks.length > 0
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
            title="책갈피 목록 열기"
            aria-label="책갈피 목록"
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">책갈피</span>
            {bookmarks.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-zinc-950">
                {bookmarks.length}
              </span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            title={isFullscreen ? '전체화면 종료' : '전체화면'}
            aria-label="전체화면"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[130] flex items-center gap-2 rounded-full bg-zinc-900/95 px-4 py-2 text-xs font-semibold text-white shadow-2xl border border-amber-500/30 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <Bookmark className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth bg-black p-2 sm:p-4 select-text"
      >
        {loading ? (
          <div className="flex h-[75vh] flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-zinc-400 font-medium">챕터 이미지를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center px-4">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <p className="text-sm font-semibold text-zinc-200">{error}</p>
            <button
              onClick={() => loadImages(currentChapterId)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/25"
            >
              <RotateCcw className="h-4 w-4" />
              <span>다시 시도</span>
            </button>
          </div>
        ) : data && data.images && data.images.length > 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {data.images.map((image, index) => {
              const pageNumber = index + 1;
              const isMarked = bookmarks.some(
                (b) => b.chapterId === currentChapterId && b.pageIndex === pageNumber
              );
              const isHighlighted = highlightedPageIndex === pageNumber;

              return (
                <div
                  key={image.id || pageNumber}
                  id={`reader-page-${pageNumber}`}
                  className={`group/page relative w-full rounded-sm transition-all duration-500 ${
                    isHighlighted ? 'ring-4 ring-amber-400 shadow-2xl shadow-amber-500/30' : ''
                  }`}
                >
                  {/* Floating Bookmark Button on Top-Right Corner of each page */}
                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleBookmark(pageNumber, image.img)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 ${
                        isMarked
                          ? 'bg-amber-500 text-zinc-950 shadow-amber-500/40 ring-2 ring-amber-300'
                          : 'bg-zinc-950/75 text-zinc-300 opacity-75 group-hover/page:opacity-100 hover:bg-zinc-900 hover:text-white border border-white/10'
                      }`}
                      title={isMarked ? '책갈피 삭제' : '이 페이지 책갈피 저장'}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${isMarked ? 'fill-zinc-950' : ''}`} />
                      <span>p.{pageNumber}</span>
                      {isMarked && <span className="hidden xs:inline">책갈피</span>}
                    </button>
                  </div>

                  {/* Highlight Landing Ribbon Badge */}
                  {isHighlighted && (
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-zinc-950 shadow-xl animate-bounce">
                      <Bookmark className="h-3.5 w-3.5 fill-zinc-950" />
                      <span>책갈피 지점</span>
                    </div>
                  )}

                  <img
                    src={image.img}
                    alt={`Page ${pageNumber}`}
                    referrerPolicy="no-referrer"
                    className="w-full shadow-2xl block"
                    loading={pageNumber <= 3 ? 'eager' : 'lazy'}
                  />
                </div>
              );
            })}
            
            {/* End of chapter footer with immediate next/prev actions */}
            <div className="mt-12 flex flex-col items-center gap-4 pb-24 text-center">
              <div className="h-px w-24 bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>이 챕터를 모두 읽었습니다!</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {prevChapter && (
                  <button
                    onClick={() => handleSelectChapter(prevChapter)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>이전 챕터</span>
                  </button>
                )}
                
                {nextChapter ? (
                  <button
                    onClick={() => handleSelectChapter(nextChapter)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>다음 챕터 계속 읽기</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-blue-500 transition-all"
                  >
                    <span>목록으로 돌아가기</span>
                  </button>
                )}

                {nextChapter && (
                  <button
                    onClick={onBack}
                    className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    목록으로
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[60vh] flex-col items-center justify-center text-center text-zinc-400">
            <p className="text-sm">표시할 이미지가 없습니다.</p>
            <button
              onClick={onBack}
              className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
            >
              목록으로 돌아가기
            </button>
          </div>
        )}
      </div>

      {/* Bookmarks List Modal */}
      <ReaderBookmarksModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        mangaTitle={mangaTitle}
        currentChapterId={currentChapterId}
        currentChapterTitle={currentChapterTitle}
        currentPage={visiblePageIndex}
        isCurrentPageBookmarked={isCurrentPageBookmarked}
        bookmarks={bookmarks}
        onSelectBookmark={handleSelectBookmark}
        onAddCurrentPageBookmark={() => handleToggleBookmark(visiblePageIndex)}
        onDeleteBookmark={handleDeleteBookmark}
        onUpdateBookmarkNote={handleUpdateBookmarkNote}
      />
    </div>
  );
}
