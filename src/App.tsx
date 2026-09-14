/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useTransition, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { MangaCard } from './components/MangaCard';
import { MangaDetailView } from './components/MangaDetailView';
import { ReaderView } from './components/ReaderView';
import { RecentlyViewedSection } from './components/RecentlyViewedSection';
import { LibraryView } from './components/LibraryView';
import { RecommendationSection } from './components/RecommendationSection';
import { SearchFilterControls, StatusFilterOption, getGenreLabel } from './components/SearchFilterControls';
import { CategoryBar } from './components/CategoryBar';
import { CategoryExplorerModal } from './components/CategoryExplorerModal';
import { CategoryItem, CATEGORIES_LIST } from './data/categories';
import { api } from './lib/api';
import { Manga, LatestRelease, MangaDetail, RecentlyViewedItem, BookmarkItem, Chapter } from './types';
import { TrendingUp, Sparkles, AlertCircle, FilterX } from 'lucide-react';
import {
  getRecentlyViewed,
  saveRecentlyViewed,
  updateRecentlyViewedChapter,
  removeRecentlyViewed,
  clearRecentlyViewed,
  getReadChaptersMap,
  toggleChapterRead,
  markChapterRead,
  markAllChaptersRead,
  getBookmarks,
  toggleBookmark,
  updateBookmarkGenres,
  removeBookmark,
} from './lib/storage';

type ViewState = 
  | { type: 'home' }
  | { type: 'library' }
  | { type: 'search'; query: string }
  | { type: 'detail'; mangaId: string; initialTitle?: string; initialImage?: string }
  | { 
      type: 'read'; 
      mangaId: string; 
      chapterId: string; 
      chapterTitle?: string; 
      mangaTitle?: string;
      chapters?: Chapter[];
      initialPageIndex?: number;
    };

export default function App() {
  const [view, setView] = useState<ViewState>({ type: 'home' });
  const [searchQuery, setSearchQuery] = useState('');
  const [latestManga, setLatestManga] = useState<Manga[]>([]);
  const [latestReleases, setLatestReleases] = useState<LatestRelease[]>([]);
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Search filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [koreanOnly, setKoreanOnly] = useState<boolean>(true);
  const [adultOnly, setAdultOnly] = useState<boolean>(false);

  // Category selection state (for Home & Browse)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Home view filters
  const [homeKoreanOnly, setHomeKoreanOnly] = useState<boolean>(true);
  const [homeAdultOnly, setHomeAdultOnly] = useState<boolean>(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(false);

  // Local storage state
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [readChaptersMap, setReadChaptersMap] = useState<Record<string, string[]>>({});

  // Top genres derived from bookmarks
  const topGenres = useMemo(() => {
    const genreCountMap: Record<string, number> = {};
    for (const b of bookmarks) {
      if (b.genres && Array.isArray(b.genres)) {
        for (const g of b.genres) {
          genreCountMap[g] = (genreCountMap[g] || 0) + 1;
        }
      }
    }
    return Object.entries(genreCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        label: getGenreLabel(name),
      }));
  }, [bookmarks]);

  // Load recommendations based on user library bookmarks
  const loadRecommendations = useCallback(
    async (
      currentBookmarks: BookmarkItem[] = bookmarks,
      filterKorean: boolean = homeKoreanOnly,
      filterAdult: boolean = homeAdultOnly
    ) => {
      try {
        setRecommendationsLoading(true);

        // Aggregate unique genres from bookmarks
        const genreFreq: Record<string, number> = {};
        for (const b of currentBookmarks) {
          if (b.genres && Array.isArray(b.genres)) {
            for (const g of b.genres) {
              genreFreq[g] = (genreFreq[g] || 0) + 1;
            }
          }
        }

        // Pick top genres (up to 4)
        const selectedGenres = Object.entries(genreFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([genre]) => genre);

        const excludeIds = currentBookmarks.map((b) => b.id);

        const recs = await api.getRecommendations(
          selectedGenres,
          excludeIds,
          filterKorean,
          filterAdult
        );

        setRecommendations(recs);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setRecommendationsLoading(false);
      }
    },
    [bookmarks, homeKoreanOnly, homeAdultOnly]
  );

  // Initialize storage data on mount
  useEffect(() => {
    const initialBookmarks = getBookmarks();
    setRecentlyViewed(getRecentlyViewed());
    setBookmarks(initialBookmarks);
    setReadChaptersMap(getReadChaptersMap());
    loadHomeData(true, false, 'all');
    loadRecommendations(initialBookmarks, true, false);
  }, []);

  async function loadHomeData(
    filterKorean: boolean = homeKoreanOnly,
    filterAdult: boolean = homeAdultOnly,
    catId: string = selectedCategory
  ) {
    try {
      setLoading(true);
      setError(null);

      // Resolve category key for MangaDex
      const foundCat = CATEGORIES_LIST.find((c) => c.id === catId);
      const isCatAdult = foundCat?.isAdult || filterAdult;
      const categoryParam = foundCat?.englishKey;

      const [mangaData, releaseData] = await Promise.all([
        api.getLatestManga(1, filterKorean, categoryParam, isCatAdult),
        api.getLatestRelease(filterKorean)
      ]);
      setLatestManga(mangaData);
      setLatestReleases(releaseData);
    } catch (err) {
      console.error(err);
      setError('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleHomeKorean(enabled: boolean) {
    setHomeKoreanOnly(enabled);
    await Promise.all([
      loadHomeData(enabled, homeAdultOnly, selectedCategory),
      loadRecommendations(bookmarks, enabled, homeAdultOnly)
    ]);
  }

  async function handleToggleHomeAdult(enabled: boolean) {
    setHomeAdultOnly(enabled);
    await Promise.all([
      loadHomeData(homeKoreanOnly, enabled, selectedCategory),
      loadRecommendations(bookmarks, homeKoreanOnly, enabled)
    ]);
  }

  async function handleSelectCategory(cat: CategoryItem) {
    setSelectedCategory(cat.id);
    const newAdultState = cat.isAdult ? true : homeAdultOnly;
    if (cat.isAdult) {
      setHomeAdultOnly(true);
    }
    await loadHomeData(homeKoreanOnly, newAdultState, cat.id);
  }

  async function handleSearch(
    query: string,
    filterKorean: boolean = koreanOnly,
    filterAdult: boolean = adultOnly
  ) {
    setSearchQuery(query);
    if (!query.trim()) {
      setView({ type: 'home' });
      return;
    }

    // Reset status & genre on new search
    setStatusFilter('all');
    setGenreFilter('all');

    startTransition(async () => {
      try {
        setLoading(true);
        setView({ type: 'search', query });
        const results = await api.search(query, 1, filterKorean, undefined, filterAdult);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
        setError('검색 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    });
  }

  // Filtered search results based on status, genre, koreanOnly, and adultOnly
  const filteredSearchResults = useMemo(() => {
    return searchResults.filter((manga) => {
      // 0. Korean only filter (client-side guarantee)
      if (koreanOnly && !manga.hasKorean) {
        return false;
      }

      // 1. Adult filter
      if (adultOnly && !manga.isAdult) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const s = manga.status?.toLowerCase();
        if (statusFilter === 'ongoing' && s !== 'ongoing') return false;
        if (statusFilter === 'completed' && s !== 'completed') return false;
        if (statusFilter === 'hiatus' && s !== 'hiatus') return false;
      }

      // 3. Genre Filter
      if (genreFilter !== 'all') {
        if (!manga.genres || !manga.genres.some((g) => g.toLowerCase() === genreFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [searchResults, statusFilter, genreFilter, koreanOnly, adultOnly]);

  const navigateToDetail = useCallback((
    mangaId: string,
    meta?: { title?: string; image?: string; author?: string }
  ) => {
    // If we have meta info, add to recently viewed immediately
    if (meta?.title) {
      const updated = saveRecentlyViewed({
        id: mangaId,
        title: meta.title,
        image: meta.image || '',
        author: meta.author,
      });
      setRecentlyViewed(updated);
    }

    setView({ 
      type: 'detail', 
      mangaId, 
      initialTitle: meta?.title, 
      initialImage: meta?.image 
    });
    window.scrollTo(0, 0);
  }, []);

  const navigateToRead = useCallback((
    mangaId: string, 
    chapterId: string, 
    chapterTitle?: string,
    mangaTitle?: string,
    chapters?: Chapter[],
    initialPageIndex?: number
  ) => {
    // Mark chapter as read
    markChapterRead(mangaId, chapterId, true);
    setReadChaptersMap(getReadChaptersMap());

    // Update recently viewed last chapter
    const updatedRecent = updateRecentlyViewedChapter(mangaId, chapterId, chapterTitle);
    setRecentlyViewed(updatedRecent);

    setView({ 
      type: 'read', 
      mangaId, 
      chapterId, 
      chapterTitle, 
      mangaTitle, 
      chapters, 
      initialPageIndex 
    });
  }, []);

  const navigateHome = useCallback(() => {
    setView({ type: 'home' });
    setSearchQuery('');
    window.scrollTo(0, 0);
  }, []);

  const navigateLibrary = useCallback(() => {
    setView({ type: 'library' });
    setSearchQuery('');
    window.scrollTo(0, 0);
  }, []);

  // Bookmark handlers
  const handleToggleBookmark = useCallback((manga: { id: string; title: string; image: string; author?: string; latestChapter?: string; genres?: string[] }) => {
    const { list } = toggleBookmark(manga);
    setBookmarks(list);
    loadRecommendations(list, homeKoreanOnly, homeAdultOnly);
  }, [loadRecommendations, homeKoreanOnly, homeAdultOnly]);

  const handleRemoveBookmark = useCallback((mangaId: string) => {
    const updated = removeBookmark(mangaId);
    setBookmarks(updated);
    loadRecommendations(updated, homeKoreanOnly, homeAdultOnly);
  }, [loadRecommendations, homeKoreanOnly, homeAdultOnly]);

  const isMangaBookmarked = useCallback((mangaId: string) => {
    return bookmarks.some((b) => b.id === mangaId);
  }, [bookmarks]);

  // Read chapters handlers
  const handleToggleChapterRead = useCallback((mangaId: string, chapterId: string) => {
    toggleChapterRead(mangaId, chapterId);
    setReadChaptersMap(getReadChaptersMap());
  }, []);

  const handleMarkAllChaptersRead = useCallback((mangaId: string, chapterIds: string[], read: boolean) => {
    markAllChaptersRead(mangaId, chapterIds, read);
    setReadChaptersMap(getReadChaptersMap());
  }, []);

  // Recently viewed handlers
  const handleRemoveRecentlyViewed = useCallback((mangaId: string) => {
    const updated = removeRecentlyViewed(mangaId);
    setRecentlyViewed(updated);
  }, []);

  const handleClearRecentlyViewed = useCallback(() => {
    clearRecentlyViewed();
    setRecentlyViewed([]);
  }, []);

  const handleDetailLoaded = useCallback((detail: MangaDetail) => {
    if (detail.id && detail.title) {
      const updated = saveRecentlyViewed({
        id: detail.id,
        title: detail.title,
        image: detail.image || '',
        author: detail.authors?.[0],
      });
      setRecentlyViewed(updated);

      // If this manga is already in bookmarks, enrich its genres if available
      if (detail.genres && detail.genres.length > 0) {
        const enriched = updateBookmarkGenres(detail.id, detail.genres);
        setBookmarks(enriched);
      }
    }
  }, []);

  const activeTab = view.type === 'home' ? 'home' : view.type === 'library' ? 'library' : 'other';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-blue-500/30 selection:text-blue-200">
      <Navbar 
        onSearch={handleSearch} 
        onHome={navigateHome}
        onOpenLibrary={navigateLibrary}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        activeTab={activeTab}
        currentQuery={searchQuery}
        bookmarkCount={bookmarks.length}
      />

      {/* Category Explorer Full Modal */}
      <CategoryExplorerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        selectedCategoryId={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-400 border border-red-500/20"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* HOME VIEW */}
          {view.type === 'home' && (
            <motion.section
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Category & Classification Bar (Top of Home) */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 shadow-xl backdrop-blur-md">
                <CategoryBar
                  selectedCategoryId={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  koreanOnly={homeKoreanOnly}
                  onToggleKoreanOnly={handleToggleHomeKorean}
                  adultOnly={homeAdultOnly}
                  onToggleAdultOnly={handleToggleHomeAdult}
                />
              </div>

              {/* 1. RECENTLY VIEWED COMPONENT (HOME TOPMOST) */}
              <RecentlyViewedSection
                items={recentlyViewed}
                onSelectManga={(id) => navigateToDetail(id)}
                onContinueChapter={(mangaId, chapterId) => {
                  const recentItem = recentlyViewed.find((i) => i.id === mangaId);
                  navigateToRead(mangaId, chapterId, recentItem?.lastChapterTitle, recentItem?.title);
                }}
                onRemoveItem={handleRemoveRecentlyViewed}
                onClearAll={handleClearRecentlyViewed}
              />

              {/* 2. PERSONALIZED RECOMMENDATIONS (나를 위한 추천) */}
              <RecommendationSection
                recommendations={recommendations}
                topGenres={topGenres}
                bookmarkCount={bookmarks.length}
                loading={recommendationsLoading}
                onRefresh={() => loadRecommendations(bookmarks, homeKoreanOnly, homeAdultOnly)}
                onSelectManga={(id) => navigateToDetail(id)}
                onOpenLibrary={navigateLibrary}
                isBookmarked={isMangaBookmarked}
                onToggleBookmark={(manga) => handleToggleBookmark({
                  id: manga.id,
                  title: manga.title,
                  image: manga.image,
                  author: manga.author,
                  latestChapter: manga.latestChapter,
                  genres: manga.genres,
                })}
              />

              {/* 3. LATEST RELEASES */}
              {latestReleases.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-2xl font-bold tracking-tight text-white">최신 연재</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {latestReleases.map((release) => (
                      <div 
                        key={release.id}
                        onClick={() => navigateToDetail(release.id, { title: release.title, image: release.thumbnail })}
                        className="group flex min-w-[200px] max-w-[220px] cursor-pointer flex-col gap-2 rounded-xl bg-zinc-900/50 p-3 transition-all hover:bg-zinc-900 hover:scale-[1.02] border border-white/5"
                      >
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-zinc-950">
                          <img 
                            src={release.thumbnail} 
                            alt={release.title} 
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="line-clamp-1 text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {release.title}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {release.chapters.slice(0, 2).map((chap) => (
                            <span key={chap} className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                              {chap}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. LATEST MANGA UPDATES */}
              <div>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                    <h2 className="text-2xl font-bold tracking-tight text-white">최신 업데이트</h2>
                  </div>

                  {/* Home Korean Only Filter Toggle */}
                  <button
                    onClick={() => handleToggleHomeKorean(!homeKoreanOnly)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      homeKoreanOnly
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-400/40'
                        : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                    }`}
                  >
                    <span>🇰🇷 한국어 번역 지원만 보기</span>
                    {homeKoreanOnly && (
                      <span className="rounded-full bg-rose-700 px-1.5 py-0.2 text-[10px] text-white">
                        적용 중
                      </span>
                    )}
                  </button>
                </div>
                
                {loading && latestManga.length === 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-900/60" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {latestManga.map((manga) => (
                      <MangaCard 
                        key={manga.id} 
                        manga={manga} 
                        onClick={(id) => navigateToDetail(id, { title: manga.title, image: manga.image, author: manga.author })}
                        isBookmarked={isMangaBookmarked(manga.id)}
                        onToggleBookmark={() => handleToggleBookmark({
                          id: manga.id,
                          title: manga.title,
                          image: manga.image,
                          author: manga.author,
                          latestChapter: manga.latestChapter,
                          genres: manga.genres,
                        })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* MY LIBRARY VIEW */}
          {view.type === 'library' && (
            <LibraryView
              key="library"
              bookmarks={bookmarks}
              readChaptersMap={readChaptersMap}
              onSelectManga={(id) => navigateToDetail(id)}
              onRemoveBookmark={handleRemoveBookmark}
              onGoHome={navigateHome}
            />
          )}

          {/* SEARCH VIEW */}
          {view.type === 'search' && (
            <motion.section
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-blue-500" />
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    <span className="text-blue-500">"{view.query}"</span> 검색 결과
                  </h2>
                </div>
              </div>

              {/* Search Filter Controls: Genre, Publication Status & Adult Filter */}
              {!loading && searchResults.length > 0 && (
                <SearchFilterControls
                  results={searchResults}
                  selectedStatus={statusFilter}
                  selectedGenre={genreFilter}
                  koreanOnly={koreanOnly}
                  adultOnly={adultOnly}
                  onStatusChange={setStatusFilter}
                  onGenreChange={setGenreFilter}
                  onToggleKoreanOnly={(val) => setKoreanOnly(val)}
                  onToggleAdultOnly={(val) => setAdultOnly(val)}
                  onResetFilters={() => {
                    setStatusFilter('all');
                    setGenreFilter('all');
                    setKoreanOnly(false);
                    setAdultOnly(false);
                  }}
                  filteredCount={filteredSearchResults.length}
                />
              )}

              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-900/60" />
                  ))}
                </div>
              ) : filteredSearchResults.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredSearchResults.map((manga) => (
                    <MangaCard 
                      key={manga.id} 
                      manga={manga} 
                      onClick={(id) => navigateToDetail(id, { title: manga.title, image: manga.image, author: manga.author })}
                      isBookmarked={isMangaBookmarked(manga.id)}
                      onToggleBookmark={() => handleToggleBookmark({
                        id: manga.id,
                        title: manga.title,
                        image: manga.image,
                        author: manga.author,
                        latestChapter: manga.latestChapter,
                        genres: manga.genres,
                      })}
                    />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex h-[35vh] flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/30 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 mb-3">
                    <FilterX className="h-6 w-6" />
                  </div>
                  <p className="text-base font-bold text-white">필터 조건에 맞는 작품이 없습니다.</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    선택하신 연재 상태 또는 장르 필터를 완화하거나 초기화해 보세요.
                  </p>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setGenreFilter('all');
                    }}
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    필터 조건 초기화
                  </button>
                </div>
              ) : (
                <div className="flex h-[40vh] flex-col items-center justify-center text-center">
                  <p className="text-lg font-medium text-zinc-400">검색 결과가 없습니다.</p>
                  <p className="text-sm text-zinc-600 mt-1">다른 키워드나 영어 제목으로 검색해 보세요.</p>
                </div>
              )}
            </motion.section>
          )}

          {/* MANGA DETAIL VIEW */}
          {view.type === 'detail' && (
            <MangaDetailView
              key={`detail-${view.mangaId}`}
              mangaId={view.mangaId}
              isBookmarked={isMangaBookmarked(view.mangaId)}
              onToggleBookmark={(detail) => handleToggleBookmark({
                id: view.mangaId,
                title: detail.title,
                image: detail.image || view.initialImage || '',
                author: detail.authors?.[0],
                latestChapter: detail.chapters?.[0]?.chapterTitle,
                genres: detail.genres,
              })}
              readChapterIds={readChaptersMap[view.mangaId] || []}
              onToggleChapterRead={(chapterId) => handleToggleChapterRead(view.mangaId, chapterId)}
              onMarkAllChaptersRead={(chapterIds, read) => handleMarkAllChaptersRead(view.mangaId, chapterIds, read)}
              onBack={navigateHome}
              onSelectChapter={(chapterId, chapterTitle, chapters, initialPageIndex) => 
                navigateToRead(view.mangaId, chapterId, chapterTitle, view.initialTitle, chapters, initialPageIndex)
              }
              onDetailLoaded={handleDetailLoaded}
            />
          )}

          {/* CHAPTER READER VIEW */}
          {view.type === 'read' && (
            <ReaderView
              key={`read-${view.mangaId}-${view.chapterId}`}
              mangaId={view.mangaId}
              chapterId={view.chapterId}
              chapterTitle={view.chapterTitle}
              mangaTitle={view.mangaTitle}
              chapters={view.chapters}
              initialPageIndex={view.initialPageIndex}
              onBack={() => setView({ type: 'detail', mangaId: view.mangaId })}
              onNavigateChapter={(newChapterId, newChapterTitle, updatedChapters, newPageIndex) => {
                navigateToRead(
                  view.mangaId,
                  newChapterId,
                  newChapterTitle,
                  view.mangaTitle,
                  updatedChapters || view.chapters,
                  newPageIndex
                );
              }}
              onMarkRead={(chapId) => {
                markChapterRead(view.mangaId, chapId, true);
                setReadChaptersMap(getReadChaptersMap());
              }}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-white/5 bg-zinc-950 px-4 py-12">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-medium text-zinc-500">
            © 2026 만화 리더. 모든 권리는 해당 저작권자에게 있습니다.
          </p>
          <p className="mt-2 text-[10px] text-zinc-600 uppercase tracking-widest">
            최근 본 만화, 읽음 표시 및 내 서재 북마크 기능이 지원됩니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
