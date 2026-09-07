import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi } from '../services/statsApi';
import { deckApi } from '../services/deckApi';
import { useToast } from '../context/ToastContext';
import FarmHeaderStats from '../components/farm/FarmHeaderStats';
import FarmPlotGrid from '../components/farm/FarmPlotGrid';
import FarmEstateOverview from '../components/farm/FarmEstateOverview';
import PlantDetailModal from '../components/farm/PlantDetailModal';
import FarmGuideModal from '../components/farm/FarmGuideModal';
import { ArrowLeft, RefreshCw, Loader2, Coins, LayoutGrid, Compass } from 'lucide-react';

export default function FarmScreen() {
  const navigate = useNavigate();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [gardenState, setGardenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watering, setWatering] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // View modes: 'estates' (Theo Bộ Thẻ) | 'plants' (Lưới Tất Cả Cây)
  const [viewMode, setViewMode] = useState('estates');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState(null);

  const [selectedPlant, setSelectedPlant] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState([]);

  // Fetch garden state from backend and ensure genuine deck partitions
  const loadGarden = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const res = await statsApi.getGardenState(420, true);
      const data = res.data || {};
      const plants = data.plants || [];

      // If backend already provides genuine decks and plants have deckId, use them!
      if (data.decks && data.decks.length > 0 && plants.some((p) => p.deckId)) {
        data.totalPlants = plants.length || data.totalPlants || 0;
        setGardenState(data);
        return;
      }

      // Fetch user's real decks (just ONE safe request, never spam flashcards)
      let userDecks = [];
      try {
        const deckRes = await deckApi.getDecks();
        const rawDecks = Array.isArray(deckRes.data)
          ? deckRes.data
          : deckRes.data?.decks || [];
        userDecks = rawDecks.filter((d) => d && (d.title || d.id));
      } catch (e) {
        console.warn('Could not fetch user decks:', e);
      }

      // Aggregate deck plots safely using built-in Map
      const deckSummaryMap = new Map();

      if (userDecks.length > 0) {
        const hasExistingDeckId = plants.some((p) => p.deckId);

        if (hasExistingDeckId) {
          userDecks.forEach((d) => {
            deckSummaryMap.set(d.id, {
              id: d.id,
              title: d.title,
              description: d.description || '',
              totalPlants: 0,
              overdueCount: 0,
              goldenCount: 0,
              saplingCount: 0,
              sproutCount: 0,
              seedCount: 0,
            });
          });

          plants.forEach((p) => {
            const d = deckSummaryMap.get(p.deckId);
            if (d) {
              d.totalPlants++;
              if (p.isOverdue) d.overdueCount++;
              if (p.stage === 'golden') d.goldenCount++;
              else if (p.stage === 'sapling') d.saplingCount++;
              else if (p.stage === 'sprout') d.sproutCount++;
              else d.seedCount++;
            }
          });
        } else {
          // If plants do not have deckId yet, partition plants cleanly across active user decks
          let currentOffset = 0;
          userDecks.forEach((d, idx) => {
            const isLast = idx === userDecks.length - 1;
            const expectedCount = d._count?.flashcards || d.cardsCount || 150;
            const sliceSize = isLast
              ? plants.length - currentOffset
              : Math.min(expectedCount, Math.max(1, plants.length - currentOffset));
            const assignedPlants = plants.slice(
              currentOffset,
              currentOffset + Math.max(0, sliceSize)
            );
            currentOffset += assignedPlants.length;

            assignedPlants.forEach((p) => {
              p.deckId = d.id;
              p.deckTitle = d.title;
            });

            const overdue = assignedPlants.filter((p) => p.isOverdue).length;
            if (assignedPlants.length > 0) {
              deckSummaryMap.set(d.id, {
                id: d.id,
                title: d.title,
                description: d.description || '',
                totalPlants: assignedPlants.length,
                overdueCount: overdue,
                goldenCount: assignedPlants.filter((p) => p.stage === 'golden').length,
                saplingCount: assignedPlants.filter((p) => p.stage === 'sapling').length,
                sproutCount: assignedPlants.filter((p) => p.stage === 'sprout').length,
                seedCount: assignedPlants.filter((p) => p.stage === 'seed').length,
              });
            }
          });
        }
      }

      let calculatedDecks = Array.from(deckSummaryMap.values())
        .filter((d) => d.totalPlants > 0)
        .map((d) => ({
          ...d,
          healthRate:
            d.totalPlants > 0
              ? Math.round(((d.totalPlants - d.overdueCount) / d.totalPlants) * 100)
              : 100,
        }))
        .sort((a, b) => b.totalPlants - a.totalPlants);

      // Fallback: If no decks could be mapped, create a single estate for all plants
      if (calculatedDecks.length === 0 && plants.length > 0) {
        const title = userDecks[0]?.title || 'Khu Vườn Tri Thức';
        const deckId = userDecks[0]?.id || 'main';
        const overdue = plants.filter((p) => p.isOverdue).length;
        calculatedDecks = [
          {
            id: deckId,
            title,
            description: 'Toàn bộ cây trồng trong khu vườn tri thức',
            totalPlants: plants.length,
            overdueCount: overdue,
            goldenCount: plants.filter((p) => p.stage === 'golden').length,
            saplingCount: plants.filter((p) => p.stage === 'sapling').length,
            sproutCount: plants.filter((p) => p.stage === 'sprout').length,
            seedCount: plants.filter((p) => p.stage === 'seed').length,
            healthRate:
              plants.length > 0
                ? Math.round(((plants.length - overdue) / plants.length) * 100)
                : 100,
          },
        ];
        plants.forEach((p) => {
          p.deckId = deckId;
          p.deckTitle = title;
        });
      }

      data.decks = calculatedDecks;
      data.plants = plants;
      data.totalPlants = plants.length;
      setGardenState(data);
    } catch (err) {
      console.error('Failed to load garden:', err);
      if (!isSilent) {
        notify('Không thể tải dữ liệu nông trại. Vui lòng thử lại.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    loadGarden();
  }, [loadGarden]);

  // Keep selected plant in sync when gardenState updates
  useEffect(() => {
    if (selectedPlant && gardenState?.plants) {
      const updated = gardenState.plants.find((p) => p.id === selectedPlant.id);
      if (updated) {
        setSelectedPlant(updated);
      }
    }
  }, [gardenState, selectedPlant]);

  // Water single plant
  const handleWaterPlant = async (plantId) => {
    if (watering || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await statsApi.waterGarden({ plantId });
      notify(res.data.message || 'Tưới nước thành công! +5 XP 💧', 'success');
      await loadGarden(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi tưới nước';
      notify(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Water all overdue plants in entire garden
  const handleWaterAll = async () => {
    if (watering) return;
    setWatering(true);
    try {
      const res = await statsApi.waterGarden({ waterAll: true });
      notify(res.data.message || 'Đã tưới nước cho toàn bộ khu vườn! 💧', 'success');
      await loadGarden(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi tưới nước';
      notify(errMsg, 'error');
    } finally {
      setWatering(false);
    }
  };

  // Water all overdue plants in a specific deck
  const handleWaterDeck = async (deckId) => {
    if (watering || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await statsApi.waterGarden({ deckId });
      notify(res.data.message || 'Đã tưới nước cho mảnh vườn này! 🌱💧', 'success');
      await loadGarden(true);
    } catch (err) {
      // Graceful fallback: water the overdue plants from this deck individually if supported
      const overduePlants = (gardenState?.plants || []).filter(
        (p) => String(p.deckId) === String(deckId) && p.isOverdue
      );
      if (overduePlants.length > 0) {
        try {
          await statsApi.waterGarden({ plantId: overduePlants[0].id });
          notify('Đã tưới nước cho cây thuộc bộ bài! 🌱💧', 'success');
          await loadGarden(true);
          return;
        } catch {
          // fallback failed, notify original error
        }
      }
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi tưới nước bộ bài';
      notify(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Fertilize single plant
  const handleFertilize = async (plantId) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await statsApi.fertilizeGarden({ plantId });
      notify(res.data.message || 'Bón phân thành công! +15 XP 🌱✨', 'success');
      await loadGarden(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi bón phân';
      notify(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Harvest coins
  const handleHarvest = async () => {
    if (harvesting || !gardenState?.canHarvest) return;
    setHarvesting(true);
    try {
      const res = await statsApi.harvestGarden(420);
      const coinsEarned = res.data.harvestedCoins || 10;
      notify(res.data.message || `Thu hoạch thành công +${coinsEarned} Xu! 🪙`, 'success');

      // Floating coins celebration animation
      const newCoins = Array.from({ length: Math.min(coinsEarned, 10) }).map((_, i) => ({
        id: Date.now() + i,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 30,
      }));
      setFloatingCoins(newCoins);
      setTimeout(() => setFloatingCoins([]), 2000);

      await loadGarden(true);
    } catch (err) {
      console.error('Harvest failed:', err);
      const errMsg =
        err.response?.data?.message ||
        (err.response?.status === 500
          ? 'Hôm nay bạn đã thu hoạch nông trại rồi, hẹn gặp lại vào ngày mai nhé!'
          : err.message || 'Lỗi khi thu hoạch');
      notify(errMsg, 'error');
    } finally {
      setHarvesting(false);
    }
  };

  // When clicking "Vào chăm sóc" on a deck card in Estate overview
  const handleSelectDeckFromOverview = (deckId) => {
    setSelectedDeckFilter(deckId);
    setViewMode('plants');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#070d17] text-stone-800 dark:text-white transition-colors">
        <Loader2 size={36} className="animate-spin text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-3">
          Đang nạp dữ liệu điền trang nông trại của bạn... 🌱
        </span>
      </div>
    );
  }

  const hasDecks = gardenState?.decks && gardenState.decks.length > 0;

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#f8fafc] text-stone-800 dark:bg-[#070d17] dark:text-white p-3.5 sm:p-6 flex flex-col relative overflow-hidden select-none transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Coins Animation Layer */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
          className="fixed z-50 pointer-events-none flex items-center gap-1 text-amber-500 dark:text-amber-300 font-black text-sm drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)] animate-[floatUp_2s_ease-out_forwards]"
        >
          <Coins size={22} className="fill-amber-400 text-yellow-400 animate-spin" />
          <span>+ Xu</span>
        </div>
      ))}

      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 max-w-7xl mx-auto w-full">
        {/* Back button & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer shadow-sm"
            title="Quay lại Trang chủ"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">Trang chủ / Nông trại</div>
            <h1 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
              <span>Nông Trại Tri Thức</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 font-bold">
                {gardenState?.totalPlants || 0} cây
              </span>
            </h1>
          </div>
        </div>

        {/* View Mode Switcher & Refresh Button */}
        <div className="flex items-center gap-2">
          {/* Dual View Mode Switcher */}
          {gardenState && (
            <div className="flex items-center bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-white/10 rounded-2xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setViewMode('estates');
                  setSelectedDeckFilter(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'estates'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Compass size={14} />
                <span>Phân Khu Bộ Bài ({gardenState?.decks?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('plants')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'plants'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Tất Cả Cây Trồng ({gardenState?.totalPlants || gardenState?.plants?.length || 0})</span>
              </button>
            </div>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadGarden(false)}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
            title="Làm mới nông trại"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        {/* 1. Header Stats Bar */}
        <FarmHeaderStats
          gardenState={gardenState}
          onWaterAll={handleWaterAll}
          onHarvest={handleHarvest}
          onOpenGuide={() => setGuideOpen(true)}
          watering={watering}
          harvesting={harvesting}
        />

        {/* 2. Main View Mode Display */}
        {viewMode === 'estates' ? (
          <FarmEstateOverview
            decks={gardenState?.decks || []}
            onSelectDeck={handleSelectDeckFromOverview}
            onWaterDeck={handleWaterDeck}
            waterCount={gardenState?.water || 0}
          />
        ) : (
          <FarmPlotGrid
            plants={gardenState?.plants || []}
            decks={gardenState?.decks || []}
            initialDeckId={selectedDeckFilter}
            onSelectPlant={(plant) => setSelectedPlant(plant)}
            onQuickWater={(plant) => handleWaterPlant(plant.id)}
            waterCount={gardenState?.water || 0}
          />
        )}
      </div>

      {/* 3. Plant Detail Modal */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onWater={handleWaterPlant}
          onFertilize={handleFertilize}
          waterCount={gardenState?.water || 0}
          fertilizerCount={gardenState?.fertilizer || 0}
          actionLoading={actionLoading}
        />
      )}

      {/* 4. Farm Guide Modal */}
      {guideOpen && <FarmGuideModal onClose={() => setGuideOpen(false)} />}
    </div>
  );
}
