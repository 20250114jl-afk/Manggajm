/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CATEGORIES_LIST, CategoryItem } from '../data/categories';
import { Layers, Flame, Sparkles, ChevronRight, ShieldAlert } from 'lucide-react';

interface CategoryExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategoryId: string;
  onSelectCategory: (category: CategoryItem) => void;
}

export function CategoryExplorerModal({
  isOpen,
  onClose,
  selectedCategoryId,
  onSelectCategory,
}: CategoryExplorerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">전체 카테고리 및 분류 탐색</h2>
              <p className="text-xs text-zinc-400">원하는 장르나 분류를 선택하여 취향에 맞는 만화를 찾아보세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 19+ Warning Notice banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-xs text-red-300">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-bold text-red-200">19+ 성인 분류 안내</p>
            <p className="mt-0.5 text-zinc-400">
              성인 분류에는 성인 취향의 로맨스, 드라마, 에로티카 작품이 포함되어 있습니다.
            </p>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES_LIST.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const isAdult = cat.isAdult;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
                className={`group relative flex items-center gap-4 rounded-2xl p-4 text-left transition-all border ${
                  isSelected
                    ? isAdult
                      ? 'border-red-500 bg-red-950/40 shadow-lg shadow-red-600/20'
                      : 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-600/20'
                    : isAdult
                    ? 'border-red-500/30 bg-zinc-900/40 hover:bg-red-950/30 hover:border-red-500/60'
                    : 'border-white/5 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/15'
                }`}
              >
                {/* Icon box */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl flex-shrink-0 bg-gradient-to-br ${cat.color} text-white shadow-md`}
                >
                  {cat.icon}
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors truncate">
                      {cat.name}
                    </span>
                    {isAdult && (
                      <span className="rounded bg-red-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                        19+
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-1">
                    {cat.description}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
