import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { statsApi } from '../services/statsApi';
import { useToast } from '../context/ToastContext';
import FarmHeaderStats from '../components/farm/FarmHeaderStats';
import FarmPlotGrid from '../components/farm/FarmPlotGrid';
import PlantDetailModal from '../components/farm/PlantDetailModal';
import FarmGuideModal from '../components/farm/FarmGuideModal';
import { ArrowLeft, RefreshCw, Loader2, Coins } from 'lucide-react';

export default function FarmScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const [gardenState, setGardenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watering, setWatering] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedPlant, setSelectedPlant] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState([]);

  // Fetch garden state from backend
  const loadGarden = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const res = await statsApi.getGardenState(420, true);
      setGardenState(res.data);
    } catch (err) {
      console.error('Failed to load garden:', err);
      if (!isSilent) {
        addToast('Không thể tải dữ liệu nông trại. Vui lòng thử lại.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

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
      addToast(res.data.message || 'Tưới nước thành công! +5 XP 💧', 'success');
      await loadGarden(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi tưới nước';
      addToast(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Water all overdue plants
  const handleWaterAll = async () => {
    if (watering) return;
    setWatering(true);
    try {
      const res = await statsApi.waterGarden({ waterAll: true });
      addToast(res.data.message || 'Đã tưới nước cho khu vườn! 💧', 'success');
      await loadGarden(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi tưới nước';
      addToast(errMsg, 'error');
    } finally {
      setWatering(false);
    }
  };

  // Fertilize single plant
  const handleFertilize = async (plantId) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await statsApi.fertilizeGarden({ plantId });
      addToast(res.data.message || 'Bón phân thành công! +15 XP 🌱✨', 'success');
      await loadGarden(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi bón phân';
      addToast(errMsg, 'error');
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
      addToast(res.data.message || `Thu hoạch thành công +${coinsEarned} Xu! 🪙`, 'success');

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
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi thu hoạch';
      addToast(errMsg, 'error');
    } finally {
      setHarvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-[#070b14] text-white">
        <Loader2 size={36} className="animate-spin text-emerald-400" />
        <span className="text-xs font-semibold text-stone-400 mt-3">
          Đang chuẩn bị luống đất nông trại của bạn... 🌱
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#070b14] text-white p-3.5 sm:p-6 flex flex-col relative overflow-hidden select-none">
      {/* Floating Coins Animation Layer */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
          className="fixed z-50 pointer-events-none flex items-center gap-1 text-amber-300 font-black text-sm drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)] animate-[floatUp_2s_ease-out_forwards]"
        >
          <Coins size={22} className="fill-amber-400 text-yellow-300 animate-spin" />
          <span>+ Xu</span>
        </div>
      ))}

      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 border border-white/10 hover:bg-stone-800 text-stone-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Quay lại Trang chủ"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-xs font-semibold text-stone-400">Trang chủ / Nông trại</span>
        </div>

        <button
          type="button"
          onClick={() => loadGarden(false)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-white/10 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
          title="Làm mới nông trại"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-5 max-w-7xl mx-auto w-full">
        {/* 1. Header Stats Bar */}
        <FarmHeaderStats
          gardenState={gardenState}
          onWaterAll={handleWaterAll}
          onHarvest={handleHarvest}
          onOpenGuide={() => setGuideOpen(true)}
          watering={watering}
          harvesting={harvesting}
        />

        {/* 2. Farm Plots Grid */}
        <FarmPlotGrid
          plants={gardenState?.plants || []}
          onSelectPlant={(plant) => setSelectedPlant(plant)}
          onQuickWater={(plant) => handleWaterPlant(plant.id)}
          waterCount={gardenState?.water || 0}
        />
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
