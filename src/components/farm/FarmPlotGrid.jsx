import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import FarmPlantCard from './FarmPlantCard';
import { Search, Droplet, Sparkles, BookOpen, Layers, Filter } from 'lucide-react';

export default function FarmPlotGrid({
  plants = [],
  onSelectPlant,
  onQuickWater,
  waterCount = 0,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'thirsty' | 'mature' | 'seedling'

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const thirsty = plants.filter((p) => p.isOverdue).length;
    const mature = plants.filter((p) => p.stage === 'sapling' || p.stage === 'golden').length;
    const seedling = plants.filter((p) => p.stage === 'seed' || p.stage === 'sprout').length;
    return { all: plants.length, thirsty, mature, seedling };
  }, [plants]);

  // Filter and search
  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      // Tab filter
      if (activeTab === 'thirsty' && !p.isOverdue) return false;
      if (activeTab === 'mature' && p.stage !== 'sapling' && p.stage !== 'golden') return false;
      if (activeTab === 'seedling' && p.stage !== 'seed' && p.stage !== 'sprout') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchHanzi = p.hanzi?.toLowerCase().includes(query);
        const matchPinyin = p.pinyin?.toLowerCase().includes(query);
        const matchMeaning = p.meaning?.toLowerCase().includes(query);
        return matchHanzi || matchPinyin || matchMeaning;
      }

      return true;
    });
  }, [plants, activeTab, searchQuery]);

  return (
    <div className="w-full space-y-4">
      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-stone-900/70 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {/* Tab All */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700/60'
            }`}
          >
            Tất cả ({tabCounts.all})
          </button>

          {/* Tab Thirsty */}
          <button
            type="button"
            onClick={() => setActiveTab('thirsty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'thirsty'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700/60'
            }`}
          >
            <Droplet size={13} className={tabCounts.thirsty > 0 ? 'fill-current text-sky-400' : ''} />
            <span>Cần tưới ({tabCounts.thirsty})</span>
          </button>

          {/* Tab Mature */}
          <button
            type="button"
            onClick={() => setActiveTab('mature')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'mature'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700/60'
            }`}
          >
            <Sparkles size={13} />
            <span>Ra hoa & Cổ thụ ({tabCounts.mature})</span>
          </button>

          {/* Tab Seedling */}
          <button
            type="button"
            onClick={() => setActiveTab('seedling')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'seedling'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700/60'
            }`}
          >
            <span>🌱 Mầm non ({tabCounts.seedling})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm cây theo chữ, pinyin..."
            className="w-full bg-stone-800/90 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Plots */}
      {filteredPlants.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredPlants.map((plant) => (
            <FarmPlantCard
              key={plant.id}
              plant={plant}
              onSelect={onSelectPlant}
              onQuickWater={onQuickWater}
              waterCount={waterCount}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full bg-stone-900/50 border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
          {plants.length === 0 ? (
            /* First time empty garden */
            <>
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-3xl flex items-center justify-center mb-3">
                🌱
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Nông trại đang chờ hạt giống đầu tiên của bạn!
              </h3>
              <p className="text-xs text-stone-400 max-w-md mt-1.5 leading-relaxed">
                Khi bạn bắt đầu học một bộ thẻ flashcard, các từ vựng sẽ tự động nảy mầm và sinh trưởng trong khu vườn này.
              </p>
              <Link
                to="/decks"
                className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <BookOpen size={15} />
                <span>Khám phá bộ thẻ từ vựng ngay</span>
              </Link>
            </>
          ) : (
            /* No search or filter match */
            <>
              <div className="w-14 h-14 rounded-2xl bg-stone-800 text-2xl flex items-center justify-center mb-3">
                🔍
              </div>
              <h3 className="text-sm font-bold text-white font-sans">
                Không tìm thấy cây nào phù hợp
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Thử đổi từ khóa tìm kiếm hoặc chọn lại tab "Tất cả".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="mt-3 text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
