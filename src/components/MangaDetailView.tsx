/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen, 
  Star, 
  Info, 
  List, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  Circle, 
  CheckCheck,
  RotateCcw,
  Clock,
  Trash2,
  ArrowRight,
  Sparkles,
  Languages
} from 'lucide-react';
import { api } from '../lib/api';
import { Chapter, MangaDetail, PageBookmark } from '../types';
import { getPageBookmarks, removePageBookmark } from '../lib/storage';

interface MangaDetailViewProps {
  key?: string | number;
  mangaId: string;
  isBookmarked: boolean;
  onToggleBookmark: (detail: MangaDetail) => void;
  readChapterIds: string[];
  onToggleChapterRead: (chapterId: string) => void;
  onMarkAllChaptersRead: (chapterIds: string[], read: boolean) => void;
  onBack: () => void;
  onSelectChapter: (chapterId: string, chapterTitle?: string, chapters?: Chapter[], initialPageIndex?: number) => void;
  onDetailLoaded?: (detail: MangaDetail) => void;
}

export function MangaDetailView({
  mangaId,
  isBookmarked,
  onToggleBookmark,
  readChapterIds,
  onToggleChapterRead,
  onMarkAllChaptersRead,
  onBack,
  onSelectChapter,
  onDetailLoaded,
}: MangaDetailViewProps) {
  const [detail, setDetail] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'ko' | 'en'>('ko');
  const [translatingSynopsis, setTranslatingSynopsis] = useState(false);
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await api.getChapterInfo(mangaId);
        setDetail(data);
        // If Korean chapters exist, default filter to Korean ('ko')
        if (data.chapters.some((c) => c.language === 'ko')) {
          setSelectedLanguage('ko');
        } else {
          setSelectedLanguage('all');
        }
        if (onDetailLoaded) {
          onDetailLoaded(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [mangaId]);

  async function handleTranslateSynopsis() {
    if (!detail?.summary || translatingSynopsis) return;
    try {
      setTranslatingSynopsis(true);
      const res = await api.translateToKorean(detail.summary, 'synopsis');
      if (res.translatedText) {
        setTranslatedSynopsis(res.translatedText);
      }
    } catch (e) {
      console.error('Failed to translate synopsis:', e);
    } finally {
      setTranslatingSynopsis(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs text-zinc-500">작품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const totalChapters = detail.chapters.length;
  const readCount = detail.chapters.filter((c) => readChapterIds.includes(c.chapterID)).length;
  const progressPercent = totalChapters > 0 ? Math.round((readCount / totalChapters) * 100) : 0;
  const allRead = totalChapters > 0 && readCount === totalChapters;

  const koreanChapterCount = detail.chapters.filter((c) => c.language === 'ko').length;
  const englishChapterCount = detail.chapters.filter((c) => c.language === 'en').length;

  const filteredChapters = detail.chapters.filter((c) => {
    if (selectedLanguage === 'all') return true;
    return c.language === selectedLanguage;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-20"
    >
      {/* Top navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>돌아가기</span>
        </button>

        {/* Bookmark action button */}
        <button
          onClick={() => onToggleBookmark(detail)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            isBookmarked
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500'
              : 'border border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          {isBookmarked ? (
            <>
              <BookmarkCheck className="h-4 w-4 fill-current" />
              <span>내 서재에 보관 중</span>
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              <span>즐겨찾기 추가</span>
            </>
          )}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Left Column: Cover & Meta Info */}
        <div className="space-y-6">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl border border-white/10">
            {detail.image ? (
              <img
                src={detail.image}
                alt={detail.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-700">
                <BookOpen className="h-20 w-20" />
              </div>
            )}

            {/* Quick First/Continue Reading Button over Cover */}
            {totalChapters > 0 && (
              <div className="absolute inset-x-4 bottom-4">
                <button
                  onClick={() => {
                    // Prioritize Korean chapters if available
                    const targetPool = (selectedLanguage === 'ko' || detail.chapters.some(c => c.language === 'ko'))
                      ? detail.chapters.filter(c => c.language === 'ko')
                      : detail.chapters;

                    const effectiveList = targetPool.length > 0 ? targetPool : detail.chapters;
                    const firstUnread = effectiveList.find((c) => !readChapterIds.includes(c.chapterID));
                    const targetChapter = firstUnread || effectiveList[effectiveList.length - 1] || effectiveList[0];
                    if (targetChapter) {
                      onSelectChapter(targetChapter.chapterID, targetChapter.chapterTitle, detail.chapters);
                    }
                  }}
                  className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xl backdrop-blur-md hover:bg-blue-500 transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{readCount > 0 ? '이어서 읽기' : '첫 화 읽기'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl bg-zinc-900/80 p-6 border border-white/5">
            <div className="flex items-center gap-2 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-bold text-sm">{detail.rating}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">연재 상태</span>
              <p className="text-sm font-medium text-white">{detail.status || '연재 중'}</p>
            </div>
            {detail.genres && detail.genres.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">장르</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detail.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-300 border border-white/5"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Title, Synopsis, Reading Progress & Chapter List */}
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {detail.isAdult && (
                <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-black text-white shadow-sm border border-red-400/40">
                  🔞 19세 이상 성인
                </span>
              )}
              {detail.hasKorean && (
                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-black text-white shadow-sm">
                  🇰🇷 한국어 번역 지원
                </span>
              )}
              {koreanChapterCount > 0 && (
                <span className="rounded-md bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 text-xs font-bold text-rose-300">
                  한국어 챕터 {koreanChapterCount}개
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {detail.title}
            </h1>
            {detail.koreanTitle && detail.koreanTitle !== detail.title && (
              <p className="mt-1 text-sm font-semibold text-rose-300">
                한국어 제목: {detail.koreanTitle}
              </p>
            )}
            {detail.authors && detail.authors.length > 0 && (
              <p className="mt-2 text-sm font-medium text-zinc-400">
                작가: {detail.authors.join(', ')}
              </p>
            )}
          </div>

          {/* Synopsis */}
          <div className="space-y-3 rounded-2xl bg-zinc-900/40 p-5 border border-white/5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Info className="h-4 w-4 text-blue-400" />
                <span>줄거리</span>
                {translatedSynopsis && (
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                    ✨ AI 한국어 번역됨
                  </span>
                )}
              </div>

              {/* AI Korean Translation Trigger */}
              {(!detail.hasKoreanSummary || !/[가-힣]/.test(detail.summary)) && (
                <button
                  onClick={handleTranslateSynopsis}
                  disabled={translatingSynopsis}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-600/15 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-600/25 transition-all disabled:opacity-50"
                  title="Gemini AI로 줄거리를 한국어로 번역합니다"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${translatingSynopsis ? 'animate-spin' : 'text-purple-400'}`} />
                  <span>{translatingSynopsis ? '한국어로 번역 중...' : '✨ AI 한국어 번역'}</span>
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 whitespace-pre-line line-clamp-6 hover:line-clamp-none transition-all">
              {translatedSynopsis || detail.summary}
            </p>
          </div>

          {/* Reading Progress Tracker Bar */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">독서 진행률</span>
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-400">
                    {progressPercent}%
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  총 {totalChapters}화 중 <span className="font-semibold text-emerald-400">{readCount}화</span> 완료
                </p>
              </div>

              {/* Mark All as Read / Unread */}
              {totalChapters > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allIds = detail.chapters.map((c) => c.chapterID);
                      onMarkAllChaptersRead(allIds, !allRead);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    {allRead ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                        <span>전체 안 읽음 처리</span>
                      </>
                    ) : (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>전체 읽음 표시</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <List className="h-5 w-5 text-blue-400" />
                <span>챕터 목록</span>
                <span className="text-xs font-normal text-zinc-500">({filteredChapters.length}개)</span>
              </div>

              {/* Language Selector for Chapters */}
              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 p-1">
                <button
                  onClick={() => setSelectedLanguage('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    selectedLanguage === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  전체 ({detail.chapters.length})
                </button>
                {koreanChapterCount > 0 && (
                  <button
                    onClick={() => setSelectedLanguage('ko')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      selectedLanguage === 'ko'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    <span>🇰🇷 한국어</span>
                    <span className="rounded-full bg-rose-950 px-1.5 py-0.2 text-[10px] text-rose-200">
                      {koreanChapterCount}
                    </span>
                  </button>
                )}
                {englishChapterCount > 0 && (
                  <button
                    onClick={() => setSelectedLanguage('en')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedLanguage === 'en'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 영어 ({englishChapterCount})
                  </button>
                )}
              </div>
            </div>

            {filteredChapters.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-8 text-center text-zinc-500">
                선택한 언어의 챕터가 없습니다.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredChapters.map((chapter) => {
                  const isRead = readChapterIds.includes(chapter.chapterID);
                  const isKorean = chapter.language === 'ko';
                  return (
                    <div
                      key={chapter.chapterID}
                      className={`group relative flex items-center justify-between rounded-xl p-3.5 transition-all border ${
                        isRead
                          ? 'border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-emerald-500/50'
                          : isKorean
                          ? 'border-rose-500/30 bg-rose-950/15 hover:bg-rose-950/25 hover:border-rose-500/50'
                          : 'border-white/5 bg-zinc-900 hover:bg-zinc-800 hover:border-white/20'
                      }`}
                    >
                      {/* Chapter Title & Click to Read */}
                      <button
                        onClick={() => onSelectChapter(chapter.chapterID, chapter.chapterTitle, detail.chapters)}
                        className="flex flex-1 items-center gap-2.5 overflow-hidden text-left"
                      >
                        <BookOpen
                          className={`h-4 w-4 flex-shrink-0 transition-colors ${
                            isRead
                              ? 'text-emerald-400'
                              : isKorean
                              ? 'text-rose-400 group-hover:text-rose-300'
                              : 'text-zinc-500 group-hover:text-blue-400'
                          }`}
                        />
                        <span
                          className={`line-clamp-1 text-xs font-semibold transition-colors ${
                            isRead
                              ? 'text-zinc-400 group-hover:text-zinc-200'
                              : isKorean
                              ? 'text-rose-100 font-bold group-hover:text-white'
                              : 'text-zinc-200 group-hover:text-white'
                          }`}
                        >
                          {chapter.chapterTitle}
                        </span>
                      </button>

                      {/* Read Status Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleChapterRead(chapter.chapterID);
                        }}
                        className={`ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                          isRead
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                            : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                        }`}
                        title={isRead ? '읽음 표시 해제' : '읽음으로 표시'}
                      >
                        {isRead ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500/20" />
                            <span>읽음</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-3.5 w-3.5" />
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">미열람</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
