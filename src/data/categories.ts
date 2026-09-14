/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CategoryItem {
  id: string;
  name: string;
  englishKey?: string; // MangaDex tag or search term
  icon: string;
  description: string;
  isAdult?: boolean;
  color: string;
}

export const CATEGORIES_LIST: CategoryItem[] = [
  {
    id: 'all',
    name: '전체',
    icon: '✨',
    description: '모든 장르의 인기/최신 만화',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'manhwa',
    name: '웹툰 / 한국 만화',
    englishKey: 'manhwa',
    icon: '🇰🇷',
    description: '한국 오리지널 웹툰 및 한국어 번역 만화',
    color: 'from-rose-600 to-red-600',
  },
  {
    id: 'adult',
    name: '19+ 성인',
    icon: '🔞',
    description: '청소년 관람불가 성인 로맨스/드라마',
    isAdult: true,
    color: 'from-red-600 to-rose-700',
  },
  {
    id: 'action',
    name: '액션/배틀',
    englishKey: 'action',
    icon: '⚔️',
    description: '박진감 넘치는 액션과 배틀 명작',
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'romance',
    name: '로맨스/순정',
    englishKey: 'romance',
    icon: '💖',
    description: '설레는 사랑 이야기와 달달한 순정',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'fantasy',
    name: '판타지/이세계',
    englishKey: 'fantasy',
    icon: '🪄',
    description: '마법, 드래곤, 이세계 전생 판타지',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'comedy',
    name: '코미디/개그',
    englishKey: 'comedy',
    icon: '😆',
    description: '빵 터지는 일상 개그와 유쾌한 만화',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    id: 'drama',
    name: '드라마/감동',
    englishKey: 'drama',
    icon: '🎭',
    description: '깊은 여운과 탄탄한 스토리라인',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'slice of life',
    name: '일상/힐링',
    englishKey: 'slice of life',
    icon: '☕',
    description: '마음이 편안해지는 따뜻한 일상물',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'horror',
    name: '공포/호러',
    englishKey: 'horror',
    icon: '👻',
    description: '오싹한 공포와 기괴한 괴담',
    color: 'from-zinc-600 to-zinc-800',
  },
  {
    id: 'mystery',
    name: '미스터리/추리',
    englishKey: 'mystery',
    icon: '🔍',
    description: '숨막히는 반전과 치밀한 두뇌 싸움',
    color: 'from-violet-600 to-purple-800',
  },
  {
    id: 'sports',
    name: '스포츠/열혈',
    englishKey: 'sports',
    icon: '⚽',
    description: '땀방울과 승리의 감동 스토리',
    color: 'from-lime-500 to-green-600',
  },
  {
    id: 'sci-fi',
    name: 'SF/미래',
    englishKey: 'sci-fi',
    icon: '🚀',
    description: '우주, 사이버펑크, 인공지능 세계',
    color: 'from-sky-500 to-blue-700',
  },
  {
    id: 'historical',
    name: '시대/역사',
    englishKey: 'historical',
    icon: '🏯',
    description: '역사물, 무협, 시대극 대작',
    color: 'from-stone-500 to-amber-800',
  },
];
