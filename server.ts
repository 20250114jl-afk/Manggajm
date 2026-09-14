import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const MANGADEX_BASE = "https://api.mangadex.org";

  app.use(express.json());

  // Gemini AI client (lazy-loaded for translation)
  let aiClient: GoogleGenAI | null = null;
  const translationCache = new Map<string, string>();

  function getAi() {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return aiClient;
  }

  // Helper: Get cover URL from MangaDex relationships
  const getCoverUrl = (manga: any) => {
    const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
    if (!cover || !cover.attributes?.fileName) return "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80";
    return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`;
  };

  // Helper: Get author name from MangaDex relationships
  const getAuthorName = (manga: any) => {
    const author = manga.relationships?.find((r: any) => r.type === "author" || r.type === "artist");
    return author?.attributes?.name || "작가 미상";
  };

  // Helper: Extract Korean title if available, else English or first available title
  const getMangaTitles = (manga: any) => {
    const altTitles = manga.attributes?.altTitles || [];
    let koreanTitle: string | undefined = undefined;

    // 1. Direct Korean title attribute
    if (manga.attributes?.title?.ko) {
      koreanTitle = manga.attributes.title.ko;
    }

    // 2. Check all primary title values for Hangul
    if (!koreanTitle && manga.attributes?.title) {
      const titles = Object.values(manga.attributes.title) as string[];
      for (const t of titles) {
        if (typeof t === "string" && /[가-힣]/.test(t)) {
          koreanTitle = t;
          break;
        }
      }
    }

    // 3. Search altTitles for ko key or Hangul
    if (!koreanTitle) {
      for (const alt of altTitles) {
        if (alt.ko) {
          koreanTitle = alt.ko;
          break;
        }
        for (const [key, val] of Object.entries(alt)) {
          if (typeof val === "string" && (key === "ko" || key === "ko-ro" || /[가-힣]/.test(val))) {
            koreanTitle = val;
            break;
          }
        }
        if (koreanTitle) break;
      }
    }

    const enTitle = manga.attributes?.title?.en;
    const firstTitle = Object.values(manga.attributes?.title || {})[0] as string | undefined;
    
    // Main display title: Prioritize Korean if available, then English, then primary title
    const displayTitle = koreanTitle || enTitle || firstTitle || "제목 미상";

    // Check if manga has Korean translation among available languages or is original Korean
    const availableLangs = manga.attributes?.availableTranslatedLanguages || [];
    const isOriginalKorean = manga.attributes?.originalLanguage === "ko";
    const hasKorean = availableLangs.includes("ko") || isOriginalKorean;

    const contentRating = manga.attributes?.contentRating || "safe";
    const isAdult = contentRating === "erotica" || contentRating === "pornographic";

    return {
      title: displayTitle,
      koreanTitle,
      hasKorean,
      originalLanguage: manga.attributes?.originalLanguage,
      isOriginalKorean,
      contentRating,
      isAdult,
      publicationDemographic: manga.attributes?.publicationDemographic
    };
  };

  // Genre tag UUID map for popular categories
  const GENRE_TAG_IDS: Record<string, string> = {
    "action": "391b0423-d847-456f-aff0-8b0cfc03066b",
    "romance": "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
    "comedy": "4d32cc48-9f00-4cca-9b5a-a839f0764984",
    "fantasy": "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
    "drama": "b9af3a63-f058-46de-a9a0-e0c13906197a",
    "slice of life": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
    "isekai": "ace04997-f6bd-436e-b261-779182193d3d",
    "mystery": "ee968100-4191-4968-93d3-f82d72be7e46",
    "horror": "cdad7e68-1419-41dd-bdce-27753074a640",
    "sci-fi": "256c8bd9-4904-4360-bf4f-508a76d67183",
    "thriller": "07251805-a27e-4d59-b488-f0bfbec15168",
    "sports": "69964a64-2f90-4d33-beeb-f3ed2875eb4c",
    "historical": "33771934-028e-4cb3-8744-691e866a923e",
    "psychological": "3b60b75c-a2d7-4860-ab56-05f391bb889c",
    "boys' love": "5920b825-4181-4a17-beeb-9918b0ff7a30",
    "girls' love": "a3c67850-4684-404e-9b7f-c69850ee5da6",
    "mecha": "50880a9d-5440-4732-9afb-8f457127e836",
    "superhero": "7064a261-a137-4d3a-8848-2d385de3a99c",
    "crime": "5ca48985-9a9d-4bd8-be29-80dc0303db72",
    "tragedy": "f8f62932-27da-4fe4-8ee1-6779a8c5edba",
    "webtoon": "3e2b8dae-350e-4ab8-a8ce-016e844b9f0d",
    "manhwa": "3e2b8dae-350e-4ab8-a8ce-016e844b9f0d"
  };

  // AI Translation API using Gemini
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, type = "synopsis" } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const trimmed = text.trim();

      // If text already has predominantly Korean characters, return as-is
      const hangulMatches = trimmed.match(/[가-힣]/g) || [];
      if (hangulMatches.length > trimmed.length * 0.4) {
        return res.json({ translatedText: trimmed, source: "original_korean" });
      }

      // Check cache
      if (translationCache.has(trimmed)) {
        return res.json({ translatedText: translationCache.get(trimmed), source: "cache" });
      }

      const ai = getAi();
      if (!ai) {
        return res.json({ 
          translatedText: trimmed, 
          notice: "GEMINI_API_KEY가 설정되지 않아 원문으로 표시됩니다." 
        });
      }

      const prompt = `당신은 웹툰 및 만화 전문 번역가입니다. 아래 만화의 ${type === "synopsis" ? "줄거리 소개" : "텍스트"}를 자연스럽고 몰입감 넘치는 한국어로 번역해주세요. 만화의 뉘앙스를 살리되, 문맥을 어색하지 않게 다듬어 주세요. 번역문 외에 다른 부연 설명이나 마크다운 따옴표 등은 붙이지 마세요.\n\n[원문]:\n${trimmed}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      const translated = response.text?.trim() || trimmed;
      translationCache.set(trimmed, translated);

      res.json({ translatedText: translated, source: "gemini" });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed", fallback: req.body.text });
    }
  });

  // Proxy endpoints mapped to MangaDex
  app.get("/api/search", async (req, res) => {
    try {
      const { query = "", page = 1, koreanOnly, category, adultOnly } = req.query;
      const offset = (Number(page) - 1) * 30;

      let url = `${MANGADEX_BASE}/manga?limit=40&offset=${offset}&includes[]=cover_art&includes[]=author&order[relevance]=desc`;

      if (query && String(query).trim()) {
        url += `&title=${encodeURIComponent(String(query).trim())}`;
      } else {
        url += `&order[followedCount]=desc`;
      }

      if (koreanOnly === "true") {
        url += `&availableTranslatedLanguage[]=ko`;
      }

      // Content rating (Adult / 19+ handling)
      if (adultOnly === "true") {
        url += `&contentRating[]=erotica&contentRating[]=pornographic`;
      } else {
        url += `&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
      }

      // Category / Genre tag filtering
      if (category && typeof category === "string") {
        const catLower = category.toLowerCase().trim();
        if (catLower === "manhwa" || catLower === "webtoon") {
          url += `&originalLanguage[]=ko`;
        } else {
          const tagUuid = GENRE_TAG_IDS[catLower];
          if (tagUuid) {
            url += `&includedTags[]=${tagUuid}`;
          }
        }
      }

      const response = await fetch(url);
      const data = await response.json();
      
      const mapped = (data.data || []).map((m: any) => {
        const titleMeta = getMangaTitles(m);
        return {
          id: m.id,
          image: getCoverUrl(m),
          title: titleMeta.title,
          koreanTitle: titleMeta.koreanTitle,
          hasKorean: titleMeta.hasKorean,
          originalLanguage: titleMeta.originalLanguage,
          contentRating: titleMeta.contentRating,
          isAdult: titleMeta.isAdult,
          publicationDemographic: titleMeta.publicationDemographic,
          author: getAuthorName(m),
          update: new Date(m.attributes.updatedAt).toLocaleDateString("ko-KR"),
          view: "N/A",
          latestChapter: m.attributes.lastChapter ? `${m.attributes.lastChapter}화` : "연재 중",
          status: m.attributes.status || "unknown",
          genres: (m.attributes.tags || [])
            .filter((t: any) => t.attributes?.group === "genre" || t.attributes?.name?.en)
            .map((t: any) => t.attributes?.name?.en)
            .filter(Boolean)
        };
      });
      
      res.json(mapped);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to fetch search results" });
    }
  });

  app.get("/api/chapter-info", async (req, res) => {
    try {
      const { id } = req.query;
      // Fetch manga details
      const mangaRes = await fetch(`${MANGADEX_BASE}/manga/${id}?includes[]=author&includes[]=cover_art`);
      const mangaData = await mangaRes.json();
      const m = mangaData.data;

      // Fetch chapters: Fetch both Korean (ko) and English (en) so users get maximum availability
      const chaptersRes = await fetch(
        `${MANGADEX_BASE}/manga/${id}/feed?limit=150&order[chapter]=desc&translatedLanguage[]=ko&translatedLanguage[]=en`
      );
      const chaptersData = await chaptersRes.json();

      const titleMeta = getMangaTitles(m);
      const rawChapters = chaptersData.data || [];

      // Sort chapters: Korean chapters prioritized, then by chapter number descending
      const formattedChapters = rawChapters.map((c: any) => {
        const lang = c.attributes.translatedLanguage;
        const chNum = c.attributes.chapter;
        const rawTitle = c.attributes.title;

        let displayChapterTitle = "";
        const langTag = lang === "ko" ? "🇰🇷 한국어" : "🇺🇸 EN";

        if (chNum) {
          displayChapterTitle = `[${langTag}] 제 ${chNum}화${rawTitle ? ` - ${rawTitle}` : ""}`;
        } else {
          displayChapterTitle = `[${langTag}] ${rawTitle || "단편/특별편"}`;
        }

        return {
          chapterID: c.id,
          chapterTitle: displayChapterTitle,
          language: lang,
          chapterNum: chNum || "0",
          publishAt: c.attributes.publishAt
        };
      });

      // Sort: Korean chapters first, then by chapter number descending
      formattedChapters.sort((a: any, b: any) => {
        if (a.language === "ko" && b.language !== "ko") return -1;
        if (a.language !== "ko" && b.language === "ko") return 1;
        return parseFloat(b.chapterNum || "0") - parseFloat(a.chapterNum || "0");
      });

      const altList = (m.attributes?.altTitles || []).map((t: any) => Object.values(t)[0] as string);

      const rawSummary = m.attributes?.description?.ko || 
                         m.attributes?.description?.en || 
                         Object.values(m.attributes?.description || {})[0] || 
                         "줄거리 정보가 등록되어 있지 않습니다.";
      const hasKoreanSummary = Boolean(m.attributes?.description?.ko || /[가-힣]/.test(rawSummary));

      const mapped = {
        id: m.id,
        image: getCoverUrl(m),
        title: titleMeta.title,
        koreanTitle: titleMeta.koreanTitle,
        hasKorean: titleMeta.hasKorean || formattedChapters.some((c: any) => c.language === "ko"),
        alternativeTitles: altList,
        authors: (m.relationships || []).filter((r: any) => r.type === "author" || r.type === "artist").map((r: any) => r.attributes?.name).filter(Boolean),
        status: m.attributes.status,
        genres: (m.attributes.tags || []).filter((t: any) => t.attributes.group === "genre").map((t: any) => t.attributes.name.en),
        rating: "N/A",
        contentRating: titleMeta.contentRating,
        isAdult: titleMeta.isAdult,
        summary: rawSummary,
        hasKoreanSummary: hasKoreanSummary,
        chapters: formattedChapters
      };
      
      res.json(mapped);
    } catch (error) {
      console.error("Chapter info error:", error);
      res.status(500).json({ error: "Failed to fetch chapter info" });
    }
  });

  app.get("/api/fetch-chapter/:id/:chapterID", async (req, res) => {
    try {
      const { chapterID } = req.params;
      const response = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterID}`);
      const data = await response.json();
      
      const baseUrl = data.baseUrl;
      const hash = data.chapter.hash;
      const images = data.chapter.data.map((fileName: string, index: number) => ({
        id: index + 1,
        img: `${baseUrl}/data/${hash}/${fileName}`
      }));
      
      res.json({
        mangaID: req.params.id,
        chapterID: chapterID,
        images: images
      });
    } catch (error) {
      console.error("Fetch chapter images error:", error);
      res.status(500).json({ error: "Failed to fetch chapter images" });
    }
  });

  app.get("/api/latest-release", async (req, res) => {
    try {
      const { koreanOnly = "true" } = req.query;
      
      let langParam = "translatedLanguage[]=ko";
      if (koreanOnly !== "true") {
        langParam += "&translatedLanguage[]=en";
      }

      // Fetch latest released chapters
      const response = await fetch(`${MANGADEX_BASE}/chapter?limit=36&order[readableAt]=desc&${langParam}&includes[]=manga`);
      const data = await response.json();
      
      const mangaMap = new Map();
      const mangaIdsToFetch: string[] = [];

      for (const c of (data.data || [])) {
        const mangaRel = c.relationships.find((r: any) => r.type === "manga");
        if (!mangaRel) continue;

        const lang = c.attributes.translatedLanguage;
        const langTag = lang === "ko" ? "🇰🇷 한국어" : "🇺🇸 EN";
        const chNumber = c.attributes.chapter ? `제 ${c.attributes.chapter}화` : "최신화";
        const chEntry = `[${langTag}] ${chNumber}`;

        if (!mangaMap.has(mangaRel.id)) {
          mangaIdsToFetch.push(mangaRel.id);
          const rawTitle = mangaRel.attributes?.title?.en || Object.values(mangaRel.attributes?.title || {})[0] || "작품명 미상";
          
          mangaMap.set(mangaRel.id, {
            id: mangaRel.id,
            thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
            title: rawTitle,
            chapters: [chEntry]
          });
        } else {
          const existing = mangaMap.get(mangaRel.id);
          if (existing.chapters.length < 3 && !existing.chapters.includes(chEntry)) {
            existing.chapters.push(chEntry);
          }
        }
      }

      // Batch fetch covers and Korean titles for these manga
      if (mangaIdsToFetch.length > 0) {
        try {
          const idsQuery = mangaIdsToFetch.slice(0, 20).map(id => `ids[]=${id}`).join("&");
          const mangaDetailsRes = await fetch(`${MANGADEX_BASE}/manga?${idsQuery}&includes[]=cover_art&limit=20`);
          const mangaDetailsData = await mangaDetailsRes.json();

          for (const m of (mangaDetailsData.data || [])) {
            if (mangaMap.has(m.id)) {
              const item = mangaMap.get(m.id);
              const titleMeta = getMangaTitles(m);
              item.title = titleMeta.title;
              item.thumbnail = getCoverUrl(m);
            }
          }
        } catch (e) {
          console.warn("Could not enrich latest release covers:", e);
        }
      }
      
      res.json(Array.from(mangaMap.values()));
    } catch (error) {
      console.error("Latest release error:", error);
      res.status(500).json({ error: "Failed to fetch latest releases" });
    }
  });

  app.get("/api/latest-manga", async (req, res) => {
    try {
      const { page = 1, koreanOnly, category, adultOnly } = req.query;
      const offset = (Number(page) - 1) * 24;
      let url = `${MANGADEX_BASE}/manga?limit=24&offset=${offset}&includes[]=cover_art&includes[]=author&order[updatedAt]=desc`;
      
      if (koreanOnly === "true") {
        url += `&availableTranslatedLanguage[]=ko`;
      }

      if (adultOnly === "true") {
        url += `&contentRating[]=erotica&contentRating[]=pornographic`;
      } else {
        url += `&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
      }

      if (category && typeof category === "string") {
        const catLower = category.toLowerCase().trim();
        if (catLower === "manhwa" || catLower === "webtoon") {
          url += `&originalLanguage[]=ko`;
        } else {
          const tagUuid = GENRE_TAG_IDS[catLower];
          if (tagUuid) {
            url += `&includedTags[]=${tagUuid}`;
          }
        }
      }

      const response = await fetch(url);
      const data = await response.json();
      
      const mapped = (data.data || []).map((m: any) => {
        const titleMeta = getMangaTitles(m);
        return {
          id: m.id,
          image: getCoverUrl(m),
          title: titleMeta.title,
          koreanTitle: titleMeta.koreanTitle,
          hasKorean: titleMeta.hasKorean,
          originalLanguage: titleMeta.originalLanguage,
          contentRating: titleMeta.contentRating,
          isAdult: titleMeta.isAdult,
          publicationDemographic: titleMeta.publicationDemographic,
          author: getAuthorName(m),
          update: new Date(m.attributes.updatedAt).toLocaleDateString("ko-KR"),
          view: "N/A",
          latestChapter: m.attributes.lastChapter ? `${m.attributes.lastChapter}화` : "연재 중",
          status: m.attributes.status || "unknown",
          genres: (m.attributes.tags || [])
            .filter((t: any) => t.attributes?.group === "genre" || t.attributes?.name?.en)
            .map((t: any) => t.attributes?.name?.en)
            .filter(Boolean)
        };
      });
      
      res.json(mapped);
    } catch (error) {
      console.error("Latest manga error:", error);
      res.status(500).json({ error: "Failed to fetch latest manga" });
    }
  });

  // Recommendations endpoint based on user's preferred genres / tags
  app.get("/api/recommendations", async (req, res) => {
    try {
      const { genres, excludeIds = "", koreanOnly, adultOnly } = req.query;
      const genreList = typeof genres === "string" 
        ? genres.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean)
        : [];
      const excludedSet = new Set(
        typeof excludeIds === "string" ? excludeIds.split(",").map((id) => id.trim()).filter(Boolean) : []
      );

      // Collect MangaDex tag UUIDs for the requested genres
      const tagUuids: string[] = [];
      for (const g of genreList) {
        if (GENRE_TAG_IDS[g]) {
          tagUuids.push(GENRE_TAG_IDS[g]);
        }
      }

      let url = `${MANGADEX_BASE}/manga?limit=30&includes[]=cover_art&includes[]=author`;

      if (tagUuids.length > 0) {
        tagUuids.slice(0, 3).forEach((uuid) => {
          url += `&includedTags[]=${uuid}`;
        });
        url += `&order[followedCount]=desc`;
      } else {
        url += `&order[followedCount]=desc`;
      }

      if (koreanOnly === "true") {
        url += `&availableTranslatedLanguage[]=ko`;
      }

      if (adultOnly === "true") {
        url += `&contentRating[]=erotica&contentRating[]=pornographic`;
      } else {
        url += `&contentRating[]=safe&contentRating[]=suggestive`;
      }

      const response = await fetch(url);
      const data = await response.json();

      const mapped = (data.data || [])
        .filter((m: any) => !excludedSet.has(m.id))
        .slice(0, 16)
        .map((m: any) => {
          const titleMeta = getMangaTitles(m);
          return {
            id: m.id,
            image: getCoverUrl(m),
            title: titleMeta.title,
            koreanTitle: titleMeta.koreanTitle,
            hasKorean: titleMeta.hasKorean,
            originalLanguage: titleMeta.originalLanguage,
            contentRating: titleMeta.contentRating,
            isAdult: titleMeta.isAdult,
            publicationDemographic: titleMeta.publicationDemographic,
            author: getAuthorName(m),
            update: new Date(m.attributes.updatedAt).toLocaleDateString("ko-KR"),
            view: "N/A",
            latestChapter: m.attributes.lastChapter ? `${m.attributes.lastChapter}화` : "연재 중",
            status: m.attributes.status || "unknown",
            genres: (m.attributes.tags || [])
              .filter((t: any) => t.attributes?.group === "genre" || t.attributes?.name?.en)
              .map((t: any) => t.attributes?.name?.en)
              .filter(Boolean)
          };
        });

      res.json(mapped);
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

