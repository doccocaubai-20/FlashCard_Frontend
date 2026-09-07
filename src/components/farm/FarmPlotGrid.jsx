import React, { useState, useMemo, useEffect, useRef } from 'react';
import FarmPlantCard from './FarmPlantCard';
import FarmPagination from './FarmPagination';
import { Search, Droplet, Sparkles, Award, Filter, ArrowUpDown } from 'lucide-react';

const normalizeSearchText = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function FarmPlotGrid({
  plants = [],
  decks = [],
  onSelectPlant,
  onQuickWater,
  waterCount = 0,
  initialDeckId = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'thirsty' | 'mature' | 'golden' | 'seedling'
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeckId ? String(initialDeckId) : 'all');
  const [sortBy, setSortBy] = useState('overdueFirst'); // 'overdueFirst' | 'goldenFirst' | 'growthAsc' | 'hanzi'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const gridTopRef = useRef(null);

  // Sync initial deck filter if passed
  useEffect(() => {
    if (initialDeckId !== null && initialDeckId !== undefined) {
      setSelectedDeckId(String(initialDeckId));
    }
  }, [initialDeckId]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, selectedDeckId, sortBy, pageSize]);

  // Tab counts based on plants filtered by deck (if deck is selected)
  const tabCounts = useMemo(() => {
    const scopedPlants = selectedDeckId === 'all'
      ? plants
      : plants.filter((p) => String(p.deckId) === selectedDeckId);

    const thirsty = scopedPlants.filter((p) => p.isOverdue).length;
    const mature = scopedPlants.filter((p) => p.stage === 'sapling').length;
    const golden = scopedPlants.filter((p) => p.stage === 'golden').length;
    const seedling = scopedPlants.filter((p) => p.stage === 'seed' || p.stage === 'sprout').length;

    return { all: scopedPlants.length, thirsty, mature, golden, seedling };
  }, [plants, selectedDeckId]);

  // Filter and sort
  const filteredAndSortedPlants = useMemo(() => {
    let result = plants.filter((p) => {
      // Deck filter (only apply if a specific deck was selected and plant has deckId)
      if (selectedDeckId !== 'all') {
        if (p.deckId !== undefined && String(p.deckId) !== selectedDeckId) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === 'thirsty' && !p.isOverdue) return false;
      if (activeTab === 'mature' && p.stage !== 'sapling') return false;
      if (activeTab === 'golden' && p.stage !== 'golden') return false;
      if (activeTab === 'seedling' && p.stage !== 'seed' && p.stage !== 'sprout') return false;

      // Intelligent Normalized Search
      if (searchQuery.trim()) {
        const rawQ = searchQuery.toLowerCase().trim();
        const normQ = normalizeSearchText(searchQuery);
        // Strips trailing Telex tone character if user is mid-typing (e.g., 'xiw' -> 'xi')
        const telexCleanQ = normQ.replace(/[wsfrxj]$/, '');

        const h = p.hanzi?.toLowerCase() || '';
        const normPinyin = normalizeSearchText(p.pinyin);
        const normMeaning = normalizeSearchText(p.meaning);

        const matchHanzi = h.includes(rawQ) || h.includes(normQ);
        const matchPinyin =
          p.pinyin?.toLowerCase().includes(rawQ) ||
          normPinyin.includes(normQ) ||
          (telexCleanQ.length >= 2 && normPinyin.includes(telexCleanQ));
        const matchMeaning =
          normMeaning.includes(normQ) ||
          (telexCleanQ.length >= 2 && normMeaning.includes(telexCleanQ));

        if (!matchHanzi && !matchPinyin && !matchMeaning) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'overdueFirst') {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return b.growthPercentage - a.growthPercentage;
      }
      if (sortBy === 'goldenFirst') {
        if (a.stage === 'golden' && b.stage !== 'golden') return -1;
        if (a.stage !== 'golden' && b.stage === 'golden') return 1;
        return b.growthPercentage - a.growthPercentage;
      }
      if (sortBy === 'growthAsc') {
        return a.growthPercentage - b.growthPercentage;
      }
      if (sortBy === 'hanzi') {
        return (a.pinyin || a.hanzi).localeCompare(b.pinyin || b.hanzi);
      }
      return 0;
    });

    return result;
  }, [plants, selectedDeckId, activeTab, searchQuery, sortBy]);

  // Paginated slice
  const paginatedPlants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedPlants.slice(start, start + pageSize);
  }, [filteredAndSortedPlants, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={gridTopRef} className="w-full space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 bg-white/90 dark:bg-stone-900/80 border border-stone-200/90 dark:border-white/10 rounded-2xl p-3.5 backdrop-blur-xl shadow-sm">
        {/* Row 1: Filters & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-700/60'
              }`}
            >
              Tất cả ({tabCounts.all})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('thirsty')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'thirsty'
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-700/60'
              }`}
            >
              <Droplet size={13} className={tabCounts.thirsty > 0 ? 'fill-current text-sky-500 dark:text-cyan-300' : ''} />
              <span>Cần tưới ({tabCounts.thirsty})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seedling')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'seedling'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-700/60'
              }`}
            >
              <span>🌱 Mầm non ({tabCounts.seedling})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mature')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'mature'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-700/60'
              }`}
            >
              <Sparkles size={13} />
              <span>Đơm hoa ({tabCounts.mature})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('golden')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'golden'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-700/60'
              }`}
            >
              <Award size={13} />
              <span>Cổ thụ ({tabCounts.golden})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chữ Hán, pinyin, nghĩa..."
              className="w-full bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Row 2: Secondary Filters (Deck Picker & Sort By) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-stone-200/70 dark:border-white/5 text-xs">
          {/* Deck Dropdown (Only show specific decks if they have genuine plants) */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 dark:text-stone-400 text-[11px] font-medium flex items-center gap-1">
              <Filter size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Bộ thẻ:</span>
            </span>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="bg-stone-100/90 dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[240px] truncate"
            >
              <option value="all">Tất cả bộ thẻ ({plants.length} cây)</option>
              {decks.filter((d) => d.totalPlants > 0).map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.title} ({d.totalPlants} cây)
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 dark:text-stone-400 text-[11px] font-medium flex items-center gap-1">
              <ArrowUpDown size={12} className="text-amber-500 dark:text-amber-400" />
              <span>Sắp xếp:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-stone-100/90 dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="overdueFirst">Cần tưới nước trước 💧</option>
              <option value="goldenFirst">Cổ thụ hoàng kim 👑</option>
              <option value="growthAsc">Mới gieo mầm 🌱</option>
              <option value="hanzi">Bảng chữ cái A - Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Plant Cards */}
      {paginatedPlants.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {paginatedPlants.map((plant) => (
              <FarmPlantCard
                key={plant.id}
                plant={plant}
                onSelect={onSelectPlant}
                onQuickWater={onQuickWater}
                waterCount={waterCount}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <FarmPagination
            currentPage={currentPage}
            totalItems={filteredAndSortedPlants.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : (
        /* Empty State */
        <div className="w-full bg-white/80 dark:bg-stone-900/50 border border-stone-200/90 dark:border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-stone-800 text-3xl flex items-center justify-center mb-3">
            🔍
          </div>
          <h3 className="text-sm font-bold text-stone-800 dark:text-white">Không tìm thấy cây nào phù hợp</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Thử đổi từ khóa tìm kiếm (tiếng Việt hoặc Pinyin), chọn lại bộ thẻ hoặc chuyển sang tab "Tất cả".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
              setSelectedDeckId('all');
            }}
            className="mt-3.5 px-4 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-500/25 transition-colors cursor-pointer"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
