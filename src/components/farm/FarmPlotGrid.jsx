import React, { useState, useMemo, useEffect, useRef } from 'react';
import FarmPlantCard from './FarmPlantCard';
import FarmPagination from './FarmPagination';
import { Search, Droplet, Sparkles, Award, Filter } from 'lucide-react';

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
      {/* Controls Bar - Single Unified Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-surface-card dark:bg-surface-card border border-hairline dark:border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xs transition-colors">
        {/* Left: Deck Picker + Status Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Deck Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-mute text-xs font-medium flex items-center gap-1">
              <Filter size={13} className="text-primary" />
              <span>Bộ thẻ:</span>
            </span>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 text-ink dark:text-on-dark text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary cursor-pointer max-w-[190px] sm:max-w-[220px] truncate"
            >
              <option value="all">Tất cả bộ thẻ ({plants.length} cây)</option>
              {decks.filter((d) => d.totalPlants > 0).map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.title} ({d.totalPlants} cây)
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-hairline dark:bg-white/10 hidden sm:block mx-0.5" />

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              Tất cả ({tabCounts.all})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('thirsty')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'thirsty'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              <Droplet size={12} className={tabCounts.thirsty > 0 ? 'fill-current' : ''} />
              <span>Cần tưới ({tabCounts.thirsty})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seedling')}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'seedling'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              <span>🌱 Mầm non ({tabCounts.seedling})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mature')}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'mature'
                  ? 'bg-pink-700 text-white shadow-xs'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              <Sparkles size={12} />
              <span>Đơm hoa ({tabCounts.mature})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('golden')}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'golden'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-surface-bone dark:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark'
              }`}
            >
              <Award size={12} />
              <span>Cổ thụ ({tabCounts.golden})</span>
            </button>
          </div>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full lg:w-56 xl:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo chữ Hán, pinyin, nghĩa..."
            className="w-full bg-surface-bone dark:bg-white/5 border border-hairline dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink dark:text-on-dark placeholder:text-mute focus:outline-none focus:border-primary transition-colors"
          />
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
