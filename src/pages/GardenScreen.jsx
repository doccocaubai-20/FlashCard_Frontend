import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { statsApi } from '../services/statsApi';
import { fetchSummary } from '../features/stats/statsSlice';
import { 
  ArrowLeft, Coins, Flame, Droplet, Trash2, Volume2, PenTool,
  Award, Calendar, Gift, BookOpen, AlertCircle, Loader2
} from 'lucide-react';
import { speakChinese } from '../utils/tts';

// 3D Grass Land Patch background rendering for Cells
function renderLandPatchBackground(row, col, isSelected, isEmpty, isOverdue) {
  const isEven = (row + col) % 2 === 0;
  
  const grassGradId = `grassGrad-${row}-${col}`;
  const dirtGradId = `dirtGrad-${row}-${col}`;
  const soilGradId = `soilGrad-${row}-${col}`;

  return (
    <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none overflow-visible">
      <defs>
        {/* Grass gradient for checkered look */}
        <linearGradient id={grassGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isEven ? (
            <>
              <stop offset="0%" stopColor="#1e4d2b" />
              <stop offset="50%" stopColor="#2d6a3f" />
              <stop offset="100%" stopColor="#1b4d32" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#143c22" />
              <stop offset="50%" stopColor="#1d4d29" />
              <stop offset="100%" stopColor="#102f1a" />
            </>
          )}
        </linearGradient>

        {/* 3D Dirt edge gradient */}
        <linearGradient id={dirtGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5c2e0b" />
          <stop offset="100%" stopColor="#271003" />
        </linearGradient>

        {/* Central soil radial gradient */}
        <radialGradient id={soilGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1c0d02" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#2c1401" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 3D block drop shadow */}
      <rect x="10" y="26" width="140" height="124" rx="20" fill="#010308" opacity="0.75" filter="blur(6px)" />

      {/* Dirt Side/Bottom (3D block thickness) */}
      <path 
        d="M 12 75 Q 12 125 28 125 L 132 125 Q 148 125 148 75 L 148 112 Q 148 136 132 136 L 28 136 Q 12 136 12 112 Z" 
        fill={`url(#${dirtGradId})`} 
      />
      {/* Dirt cracks and textures for premium look */}
      <path d="M 22 116 Q 40 123 80 119 Q 120 123 138 116" stroke="#3d1d04" strokeWidth="2.5" fill="none" opacity="0.6" />
      <path d="M 38 125 Q 80 128 122 125" stroke="#1c0d02" strokeWidth="2" fill="none" opacity="0.8" />

      {/* Tiny pebbles at base */}
      <circle cx="34" cy="122" r="3.5" fill="#4b5563" />
      <circle cx="126" cy="123" r="4" fill="#374151" />
      <circle cx="131" cy="126" r="2" fill="#4b5563" />

      {/* Top Grass Surface Card Plate */}
      <rect 
        x="12" 
        y="14" 
        width="136" 
        height="104" 
        rx="18" 
        fill={`url(#${grassGradId})`} 
        stroke={isSelected ? "#eab308" : isEven ? "#387a4c" : "#245e35"} 
        strokeWidth={isSelected ? "3" : "1.5"} 
        filter={isSelected ? "drop-shadow(0 0 4px rgba(234,179,8,0.6))" : "none"}
      />

      {/* Central planting soil details */}
      {!isEmpty ? (
        <>
          <ellipse cx="80" cy="74" rx="44" ry="19" fill={`url(#${soilGradId})`} />
          <ellipse cx="80" cy="74" rx="32" ry="12" fill="#2c1401" opacity="0.75" />
        </>
      ) : (
        /* Sprout/Planted placeholder */
        <g opacity="0.12" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3,3" fill="none">
          <ellipse cx="80" cy="74" rx="20" ry="8" />
          <path d="M 80 74 L 80 62 Q 76 56 78 50 M 80 62 Q 85 58 83 52" />
        </g>
      )}

      {/* Little grass blades on top face */}
      <path d="M 26 42 Q 22 32 20 35 Q 24 38 26 42" fill="#4ade80" opacity="0.5" />
      <path d="M 26 42 Q 29 30 31 33 Q 29 38 26 42" fill="#22c55e" opacity="0.6" />
      
      <path d="M 134 82 Q 138 72 140 75 Q 135 78 134 82" fill="#4ade80" opacity="0.5" />

      {/* Tiny flowers to mimic PvZ environment */}
      {isEven && !isOverdue && (
        <>
          <circle cx="112" cy="34" r="1.5" fill="#ffffff" />
          <circle cx="110.5" cy="32.5" r="1.2" fill="#ffffff" />
          <circle cx="113.5" cy="32.5" r="1.2" fill="#ffffff" />
          <circle cx="110.5" cy="35.5" r="1.2" fill="#ffffff" />
          <circle cx="113.5" cy="35.5" r="1.2" fill="#ffffff" />
          <circle cx="112" cy="34" r="0.6" fill="#fbbf24" />
        </>
      )}
      {!isEven && isOverdue && (
        <>
          {/* Wilted brown leaf particle */}
          <path d="M 115 32 Q 112 36 109 33" stroke="#b45309" strokeWidth="1" fill="none" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

export default function GardenScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.stats.summary);
  const [garden, setGarden] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [hoveredPlant, setHoveredPlant] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [floatingCoins, setFloatingCoins] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [almanacOpen, setAlmanacOpen] = useState(false);

  // Load garden details & quests
  const fetchGardenAndQuests = async () => {
    try {
      setLoading(true);
      const [gardenRes, questsRes] = await Promise.all([
        statsApi.getGardenState(420, true), // all = true
        statsApi.getQuests(420)
      ]);
      setGarden(gardenRes.data);
      setQuests(questsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch garden/quests:', err);
      showMsg('Không thể tải khu vườn tri thức.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGardenAndQuests();
  }, [summary]);

  const showMsg = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleHarvest = async () => {
    if (!garden?.canHarvest || harvesting) return;
    setHarvesting(true);
    try {
      const res = await statsApi.harvestGarden();
      const reward = res.data.harvestedCoins;
      showMsg(`Thu hoạch thành công! Bạn nhận được +${reward} Xu ChongZi! 🪙`, 'success');
      
      // Spawn floating coins
      const newCoins = Array.from({ length: Math.min(reward, 8) }).map((_, i) => ({
        id: Date.now() + i,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40
      }));
      setFloatingCoins(newCoins);
      setTimeout(() => setFloatingCoins([]), 1800);

      dispatch(fetchSummary());
      await fetchGardenAndQuests();
    } catch (err) {
      console.error(err);
      showMsg(err.response?.data?.message || 'Có lỗi xảy ra khi thu hoạch.', 'error');
    } finally {
      setHarvesting(false);
    }
  };

  const handleSpeak = (e, char) => {
    e.stopPropagation();
    speakChinese(char);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] w-full flex flex-col justify-center items-center bg-[#0a0b10] text-white">
        <Loader2 size={40} className="animate-spin text-primary" />
        <span className="text-sm text-white/50 mt-4 font-semibold">Đang chuẩn bị bãi cỏ Zen của bạn...</span>
      </div>
    );
  }

  const {
    seedsCount = 0,
    sproutsCount = 0,
    saplingsCount = 0,
    goldenTreesCount = 0,
    overdueCount = 0,
    plants = [],
    canHarvest = false,
    harvestReward = 0
  } = garden || {};


  const columns = 5;
  // Ensure we have a clean grid matching the plants length, min 15 cells (3 rows)
  const totalTiles = Math.max(15, Math.ceil(plants.length / columns) * columns);

  // Garden level logic based on user stats XP
  const xp = summary?.xp || 0;
  const currentLevel = Math.floor(xp / 1000) + 1;
  const levelProgress = (xp % 1000) / 10; // Percentage out of 1000 XP
  
  const getLevelTitle = (lvl) => {
    if (lvl <= 3) return 'Lính mới gieo hạt';
    if (lvl <= 7) return 'Người làm vườn chăm chỉ';
    if (lvl <= 15) return 'Bậc thầy thảo mộc';
    return 'Huyền thoại nông gia';
  };

  // Calculation of garden health progress bar
  const gardenProgress = plants.length > 0 
    ? Math.max(0, Math.min(100, Math.round(((plants.length - overdueCount) / plants.length) * 100))) 
    : 100;

  // Plant stage icon definitions
  const getPlantGraphic = (plant, index, large = false) => {
    const { stage, isOverdue, id } = plant;
    const sizeClass = large ? "w-28 h-28" : "w-16 h-16";
    const leafColorMain = isOverdue ? '#854d0e' : '#166534';
    const leafColorLight = isOverdue ? '#b45309' : '#22c55e';
    const leafColorMid = isOverdue ? '#a16207' : '#15803d';

    // 1. SEED
    if (stage === 'seed') {
      return (
        <svg viewBox="0 0 60 60" className={`${sizeClass} animate-sway`}>
          <ellipse cx="30" cy="50" rx="14" ry="4" fill="#451a03" opacity="0.6" />
          <ellipse cx="30" cy="46" rx="5" ry="3" fill="#78350f" stroke="#451a03" strokeWidth="0.5" />
          <path d="M 31 46 Q 34 40 32 36" stroke="#86efac" strokeWidth="1.5" fill="none" />
        </svg>
      );
    }

    // 2. SPROUT
    if (stage === 'sprout') {
      return (
        <svg viewBox="0 0 60 60" className={`${sizeClass} animate-sway`}>
          <ellipse cx="30" cy="50" rx="16" ry="4.5" fill="#3f1c06" opacity="0.5" />
          <path d="M 30 50 Q 26 40 29 30" stroke={isOverdue ? '#854d0e' : '#4ade80'} strokeWidth="3" fill="none" />
          <path d="M 29 30 Q 21 26 19 32 Q 24 33 29 30" fill={leafColorMain} />
          <path d="M 29 30 Q 37 25 40 31 Q 35 34 29 30" fill={leafColorLight} />
        </svg>
      );
    }

    // 3. SAPLING (Variations: Box pot, Flower, Standard Sapling)
    if (stage === 'sapling') {
      const variant = index % 3;
      if (variant === 0) {
        // Wooden Box Pot Sprout
        return (
          <svg viewBox="0 0 70 70" className={`${sizeClass} animate-sway`}>
            {/* Box base */}
            <rect x="22" y="44" width="26" height="20" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <line x1="22" y1="52" x2="48" y2="52" stroke="#451a03" strokeWidth="1" />
            {/* Plant */}
            <path d="M 35 44 Q 35 30 31 24" stroke={isOverdue ? '#b45309' : '#22c55e'} strokeWidth="3.5" fill="none" />
            <path d="M 31 24 Q 24 20 22 26 Q 27 28 31 24" fill={leafColorMain} />
            <path d="M 31 24 Q 38 20 40 25 Q 36 28 31 24" fill={leafColorLight} />
          </svg>
        );
      } else if (variant === 1) {
        // Purple Flower (Ra hoa)
        return (
          <svg viewBox="0 0 70 70" className={`${sizeClass} animate-sway`}>
            <ellipse cx="35" cy="62" rx="16" ry="4" fill="#1c1917" opacity="0.4" />
            <path d="M 35 60 L 35 35" stroke={isOverdue ? '#854d0e' : '#15803d'} strokeWidth="3" />
            <path d="M 35 48 Q 28 44 26 48" fill={leafColorMain} />
            {/* Flower Petals */}
            <circle cx="35" cy="30" r="14" fill={isOverdue ? '#78350f' : '#7c3aed'} opacity="0.85" />
            <circle cx="27" cy="27" r="8" fill={isOverdue ? '#854d0e' : '#8b5cf6'} />
            <circle cx="43" cy="27" r="8" fill={isOverdue ? '#854d0e' : '#8b5cf6'} />
            <circle cx="27" cy="35" r="8" fill={isOverdue ? '#854d0e' : '#8b5cf6'} />
            <circle cx="43" cy="35" r="8" fill={isOverdue ? '#854d0e' : '#8b5cf6'} />
            <circle cx="35" cy="20" r="8" fill={isOverdue ? '#854d0e' : '#8b5cf6'} />
            <circle cx="35" cy="40" r="8" fill={isOverdue ? '#854d0e' : '#8b5cf6'} />
            {/* Center core */}
            <circle cx="35" cy="30" r="6" fill="#f59e0b" />
          </svg>
        );
      } else {
        // Standard Sapling
        return (
          <svg viewBox="0 0 70 70" className={`${sizeClass} animate-sway`}>
            <ellipse cx="35" cy="60" rx="20" ry="5.5" fill="#3f1c06" opacity="0.5" />
            <path d="M 35 60 L 34 48 Q 32 36 35 24" stroke="#5c2e0b" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <circle cx="27" cy="24" r="11" fill={leafColorMain} opacity="0.9" />
            <circle cx="43" cy="26" r="11" fill={isOverdue ? '#a16207' : '#15803d'} opacity="0.9" />
            <circle cx="35" cy="15" r="14" fill={leafColorLight} opacity="0.95" />
          </svg>
        );
      }
    }

    // 4. GOLDEN (Variations: Chest plant, Pet basket, Plus tree, Golden tree)
    if (stage === 'golden') {
      const variant = index % 4;
      if (variant === 0) {
        // Treasure Chest Plant (Treasure plant)
        return (
          <svg viewBox="0 0 80 80" className={`${sizeClass} animate-sway`}>
            <ellipse cx="40" cy="68" rx="24" ry="6.5" fill="#381a04" opacity="0.5" />
            {/* Trunk */}
            <path d="M 40 68 L 38 48 Q 36 36 40 22" stroke="#854d0e" strokeWidth="5.5" fill="none" />
            {/* Golden Canopy */}
            <circle cx="26" cy="22" r="13" fill={isOverdue ? '#78350f' : '#f59e0b'} opacity="0.9" />
            <circle cx="54" cy="24" r="13" fill={isOverdue ? '#a16207' : '#b45309'} opacity="0.9" />
            <circle cx="40" cy="12" r="17" fill={isOverdue ? '#d97706' : '#fbbf24'} opacity="0.95" />
            {/* Golden Chest at base */}
            <rect x="26" y="52" width="28" height="18" rx="3" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <rect x="26" y="52" width="28" height="6" fill="#b45309" />
            <circle cx="40" cy="58" r="2.5" fill="#fef08a" />
          </svg>
        );
      } else if (variant === 1) {
        // Sprout Pet in Basket (Babies)
        return (
          <svg viewBox="0 0 80 80" className={`${sizeClass} animate-sway`}>
            <ellipse cx="40" cy="68" rx="20" ry="5" fill="#1c1917" opacity="0.3" />
            {/* Basket */}
            <path d="M 24 50 L 56 50 L 50 70 L 30 70 Z" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
            <line x1="28" y1="56" x2="52" y2="56" stroke="#b45309" strokeWidth="1" />
            <line x1="29" y1="62" x2="51" y2="62" stroke="#b45309" strokeWidth="1" />
            {/* Sprout Creature Head */}
            <circle cx="40" cy="42" r="15" fill={isOverdue ? '#854d0e' : '#86efac'} />
            <circle cx="34" cy="40" r="2" fill="#000" />
            <circle cx="46" cy="40" r="2" fill="#000" />
            {/* Blush */}
            <circle cx="31" cy="44" r="2" fill="#f43f5e" opacity="0.6" />
            <circle cx="49" cy="44" r="2" fill="#f43f5e" opacity="0.6" />
            {/* Smile */}
            <path d="M 37 46 Q 40 49 43 46" stroke="#000" strokeWidth="1" fill="none" />
            {/* Head leaf */}
            <path d="M 40 27 Q 44 18 41 12 Q 37 18 40 27" fill={isOverdue ? '#b45309' : '#22c55e'} />
            <path d="M 40 27 Q 35 19 33 15 Q 35 22 40 27" fill={isOverdue ? '#7c2d12' : '#166534'} />
          </svg>
        );
      } else if (variant === 2) {
        // Mature Tree with Floating Plus (Exp Booster)
        return (
          <svg viewBox="0 0 80 80" className={`${sizeClass} animate-sway`}>
            <ellipse cx="40" cy="68" rx="24" ry="6.5" fill="#381a04" opacity="0.5" />
            <path d="M 40 68 L 38 52 Q 36 36 40 22" stroke="#5c2e0b" strokeWidth="5" fill="none" strokeLinecap="round" />
            <circle cx="28" cy="28" r="14" fill={leafColorMain} opacity="0.9" />
            <circle cx="52" cy="30" r="14" fill={leafColorMid} opacity="0.9" />
            <circle cx="40" cy="18" r="18" fill={leafColorLight} opacity="0.95" />
            {/* Floating Plus Orb */}
            <g className="animate-pulse">
              <circle cx="56" cy="18" r="7.5" fill="#f59e0b" opacity="0.85" filter="url(#goldGlow)" />
              <line x1="56" y1="14" x2="56" y2="22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <line x1="52" y1="18" x2="60" y2="18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        );
      } else {
        // Standard Golden Tree
        return (
          <svg viewBox="0 0 80 80" className={`${sizeClass} animate-sway animate-goldGlow`}>
            <ellipse cx="40" cy="68" rx="24" ry="6.5" fill="#381a04" opacity="0.5" />
            <path d="M 40 68 L 38 52 Q 36 36 40 22" stroke="#854d0e" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 38 46 Q 28 36 24 40" stroke="#854d0e" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 39 38 Q 49 28 53 32" stroke="#854d0e" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="26" cy="26" r="15" fill={isOverdue ? '#a16207' : '#f59e0b'} opacity="0.9" />
            <circle cx="54" cy="28" r="15" fill={isOverdue ? '#78350f' : '#b45309'} opacity="0.9" />
            <circle cx="40" cy="15" r="20" fill={isOverdue ? '#d97706' : '#fbbf24'} opacity="0.95" />
          </svg>
        );
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#030614] rounded-3xl overflow-hidden p-4 sm:p-6 text-white border border-white/5 flex flex-col relative select-none font-sans bg-radial-[circle_at_center,_rgba(8,16,40,0.4)_0%,_rgba(3,6,20,0.85)_100%]">
      
      {/* Background Starry Glow & keyframes */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes goldGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(245,158,11,0.4)) drop-shadow(0 0 10px rgba(245,158,11,0.25)); }
          50% { filter: drop-shadow(0 0 8px rgba(245,158,11,0.65)) drop-shadow(0 0 18px rgba(245,158,11,0.45)); }
        }
        @keyframes floatCoin {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-40px) scale(1.1); opacity: 0; }
        }
        .animate-sway {
          animation: sway 4s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .animate-goldGlow {
          animation: goldGlow 3s ease-in-out infinite;
        }
        .animate-float-coin {
          animation: floatCoin 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* Floating Coins layer */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          className="absolute z-50 pointer-events-none animate-float-coin flex items-center gap-1.5 text-xs font-black text-yellow-400 bg-yellow-950/95 border border-yellow-500/40 px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"
          style={{
            left: `${coin.x}%`,
            top: `${coin.y}%`
          }}
        >
          <Coins size={11} className="fill-current animate-bounce" />
          <span>+ Xu ChongZi</span>
        </div>
      ))}

      {/* Message Notifications */}
      {message.text && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 text-xs font-bold py-2.5 px-6 rounded-full border shadow-2xl animate-bounce ${
            message.type === 'success'
              ? 'bg-green-950/95 border-green-500/50 text-green-400'
              : message.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-400'
              : 'bg-blue-950/95 border-blue-500/50 text-blue-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 1. Header Toolbar (Mukcup Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer shadow-md"
            title="Quay lại Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
              Khu Vườn Từ Vựng ChongZi <span className="text-xl">🍃</span>
            </h1>
            <p className="text-xs text-white/50 font-medium">Mỗi từ vựng là một mầm xanh, chăm sóc mỗi ngày để nở hoa tri thức. ✨</p>
          </div>
        </div>

        {/* Info & Stats Capsules (5 Items like Mockup) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/3 border border-white/5 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl w-fit">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-amber-500" title="Chuỗi ngày học">
            <Calendar size={13} className="text-amber-500" />
            <span>{summary?.streak || 0} ngày</span>
            <span className="text-[9px] text-white/30 font-normal ml-0.5">Chuỗi ngày</span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-yellow-400" title="Số Xu ChongZi">
            <Coins size={13} className="fill-current" />
            <span>{summary?.coins || 0} Xu</span>
          </div>

          {/* Water */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-sky-400" title="Lượng Nước sạch">
            <Droplet size={13} className="fill-current animate-pulse" />
            <span>{summary?.water ?? 35}</span>
            <span className="text-[9px] text-white/30 font-normal ml-0.5">Nước</span>
          </div>

          {/* Fertilizer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-emerald-400" title="Bao Phân bón">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>{summary?.fertilizer ?? 55}</span>
            <span className="text-[9px] text-white/30 font-normal ml-0.5">Phân bón</span>
          </div>

          {/* Harvest Points */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-rose-400" title="Điểm thu hoạch">
            <Award size={13} />
            <span>{summary?.harvestPoints ?? 170}</span>
            <span className="text-[9px] text-white/30 font-normal ml-0.5">Điểm thu hoạch</span>
          </div>
        </div>
      </div>

      {/* 2. PvZ Garden Overview Panel (Mockup Style) */}
      <div className="bg-[#0b1026]/90 border border-white/10 rounded-3xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center mb-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Total Trees Card (Left) */}
        <div className="lg:col-span-3 flex items-center gap-4 bg-white/3 border border-white/5 p-3 rounded-2xl">
          {/* Tree 3D graphic wrapper */}
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-950 to-green-900 border border-green-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <svg viewBox="0 0 80 80" className="w-12 h-12 animate-sway">
              <ellipse cx="40" cy="68" rx="20" ry="5.5" fill="#3f1c06" opacity="0.5" />
              <path d="M 40 68 L 38 52 Q 36 36 40 22" stroke="#854d0e" strokeWidth="4.5" fill="none" />
              <circle cx="28" cy="28" r="12" fill="#166534" />
              <circle cx="52" cy="30" r="12" fill="#15803d" />
              <circle cx="40" cy="18" r="15" fill="#22c55e" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] text-white/40 font-bold block uppercase tracking-wider">Tổng số cây đã trồng</span>
            <h2 className="text-2xl font-black text-white leading-tight flex items-baseline gap-1 mt-0.5">
              {plants.length} <span className="text-xs text-green-400 font-semibold">🌱 cây</span>
            </h2>
          </div>
        </div>

        {/* Garden Health & Weed Stats (Middle) */}
        <div className="lg:col-span-5 flex flex-col justify-center gap-2">
          {/* Warning Banner */}
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 text-xs">
            <AlertCircle size={15} className="text-yellow-400 animate-pulse" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-yellow-400 font-bold">Cỏ dại đang xuất hiện!</strong>
              <p className="text-white/60">Có {overdueCount} cỏ dại cần dọn dẹp để khu vườn phát triển tốt.</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-white/50 font-bold">
              <span>Tiến độ khu vườn</span>
              <span className="text-green-400">{gardenProgress}%</span>
            </div>
            <div className="h-3 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${gardenProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons (Right) */}
        <div className="lg:col-span-4 flex items-center gap-3 w-full justify-end">
          {/* Weed Cleanup Shortcut */}
          <button
            onClick={() => navigate('/study')}
            className={`flex-1 max-w-[200px] h-12 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border shadow-lg cursor-pointer ${
              overdueCount > 0
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/35 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
            }`}
          >
            <Trash2 size={15} className={overdueCount > 0 ? 'text-rose-400 animate-bounce' : 'text-white/60'} />
            <span>Dọn cỏ dại ({overdueCount})</span>
          </button>

          {/* Harvest Reward */}
          <button
            onClick={handleHarvest}
            disabled={!canHarvest || harvesting}
            className={`flex-1 max-w-[200px] h-12 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              canHarvest
                ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
            }`}
          >
            {harvesting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <SproutIcon className="w-4 h-4" />
            )}
            <span>Thu hoạch {harvestReward > 0 ? `(+${harvestReward})` : ''}</span>
          </button>
        </div>
      </div>

      {/* 3. Split Layout: Grassy lawn grid vs Sidebar widgets */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 items-start">
        
        {/* Left: Checkboard Grass Cards Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-2 rounded-3xl border border-white/5 shadow-2xl relative bg-gradient-to-b from-[#060814] to-[#04050d] p-3">
            
            {/* Sky Background visual at top */}
            <div className="h-6 w-full bg-gradient-to-b from-indigo-950/20 to-transparent absolute top-0 pointer-events-none" />

            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: totalTiles }).map((_, tileIndex) => {
                const row = Math.floor(tileIndex / columns);
                const col = tileIndex % columns;
                const plant = plants[tileIndex];

                // 1. Empty Grassy Plot Card
                if (!plant) {
                  return (
                    <div 
                      key={`empty-${tileIndex}`}
                      className="relative flex flex-col items-center justify-center min-h-[145px] aspect-square bg-transparent rounded-2xl transition-all duration-300 hover:brightness-105 group/tile overflow-visible"
                    >
                      {/* 3D Grass Land Background */}
                      {renderLandPatchBackground(row, col, false, true, false)}

                      {/* Plot Outline and sprout placeholder */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-white/10 group-hover/tile:text-white/30 transition-all duration-300 z-10">
                        <span className="text-[9px] font-sans font-black opacity-30 group-hover/tile:opacity-75 transition-opacity mt-12 select-none text-center leading-tight text-emerald-200">
                          Đất trống
                        </span>
                      </div>
                    </div>
                  );
                }

                // 2. Plant Grassy Card
                const { id, hanzi, isOverdue } = plant;
                const isSelected = selectedPlant?.id === id;

                return (
                  <div
                    key={id}
                    onClick={() => {
                      setSelectedPlant(plant);
                      setAlmanacOpen(true);
                    }}
                    className={`relative flex flex-col items-center justify-between p-2 min-h-[145px] aspect-square bg-transparent rounded-2xl transition-all duration-300 cursor-pointer hover:scale-[1.04] group/plant overflow-visible ${
                      isSelected ? 'z-10 scale-[1.02]' : ''
                    }`}
                  >
                    {/* 3D Grass Land Background */}
                    {renderLandPatchBackground(row, col, isSelected, false, isOverdue)}

                    {/* Visual Plant graphic */}
                    <div className="w-full flex-1 flex items-center justify-center relative mt-1 pb-4 z-10">
                      {getPlantGraphic(plant, tileIndex)}

                      {/* Overdue/Withered Pill Badge */}
                      {isOverdue && (
                        <div className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white rounded-full px-2 py-0.5 text-[8px] font-black border border-white/20 shadow animate-pulse z-20">
                          Héo
                        </div>
                      )}
                    </div>

                    {/* Plant Wood Tag Name Board */}
                    <div className="absolute bottom-1 bg-gradient-to-b from-[#5c2e0b] to-[#3a1a03] border-2 border-[#2b1604] text-orange-100 px-3 py-0.5 rounded-md shadow-[0_3px_5px_rgba(0,0,0,0.6)] text-center max-w-[85%] font-serif font-black text-xs z-10 select-none tracking-wider group-hover/plant:from-[#733d0f] group-hover/plant:to-[#4a2608] transition-all">
                      {hanzi}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Sidebar Widgets (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          
          {/* Widget 1: Daily Tasks (Mockup Style) */}
          <div className="bg-[#0b1026]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <h3 className="text-xs font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                📋 Nhiệm vụ mỗi ngày
              </h3>
              <button 
                onClick={fetchGardenAndQuests} 
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
                title="Làm mới nhiệm vụ"
              >
                🔄
              </button>
            </div>
            
            {quests.length > 0 ? (
              <div className="space-y-3">
                {quests.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <div className="flex justify-between items-start text-[11px] font-semibold text-white/80">
                      <div className="flex items-center gap-1.5 pr-2">
                        {q.questType === 'STUDY_CARDS' && <Droplet size={12} className="text-sky-400" />}
                        {q.questType === 'PLAY_GAME' && <Trash2 size={12} className="text-rose-400" />}
                        {q.questType === 'SPEAK_PRACTICE' && <SproutIcon className="w-3 h-3 text-green-400" />}
                        {q.questType !== 'STUDY_CARDS' && q.questType !== 'PLAY_GAME' && q.questType !== 'SPEAK_PRACTICE' && <BookOpen size={12} className="text-yellow-400" />}
                        <span className="truncate max-w-[150px]" title={q.description}>{q.title}</span>
                      </div>
                      <span className="text-[10px] text-white/40">{q.progress}/{q.target}</span>
                    </div>
                    {/* Progress Bar container */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden p-px">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            q.completed ? 'bg-green-400' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-yellow-400 shrink-0">+{q.coinReward} Xu</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[10px] text-white/40 font-medium">
                Nhiệm vụ đã hoàn thành hoặc chưa được kích hoạt.
              </div>
            )}
          </div>

          {/* Widget 2: Garden Level (Mockup Style) */}
          <div className="bg-[#0b1026]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center gap-4">
            {/* Level Medal Badge */}
            <div className="w-14 h-14 bg-gradient-to-tr from-yellow-500 to-amber-400 rounded-full border-4 border-amber-950 flex flex-col items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="text-[9px] font-black text-amber-950 leading-none">LV</span>
              <span className="text-xl font-black text-amber-950 leading-none mt-0.5">{currentLevel}</span>
            </div>
            
            {/* XP progress bar */}
            <div className="flex-1 space-y-1.5">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 justify-between">
                  <span>Cấp vườn</span>
                  <Gift size={12} className="text-amber-400 cursor-pointer animate-bounce" title="Nhận quà cấp độ" />
                </h4>
                <p className="text-[9px] text-white/50">{getLevelTitle(currentLevel)}</p>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-px">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] text-white/40 font-bold">
                  <span>Tiến độ cấp</span>
                  <span>{xp % 1000} / 1000 XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 3: Legend / Chú giải giai đoạn */}
          <div className="bg-[#0b1026]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-black text-white tracking-wide uppercase border-b border-white/5 pb-2 mb-2.5">
              📖 Chú giải giai đoạn
            </h3>
            
            {/* Horizontal Stage Icons */}
            <div className="grid grid-cols-6 gap-1 text-[8px] text-center text-white/60 font-medium">
              <div className="space-y-1">
                <span className="block text-[14px]">🟤</span>
                <span>Hạt giống</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[14px]">🌱</span>
                <span>Mầm non</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[14px]">🌿</span>
                <span>Cây nhỏ</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[14px]">🌸</span>
                <span>Ra hoa</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[14px]">🌳</span>
                <span>Trưởng thành</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[14px]">✨</span>
                <span>Đặc biệt</span>
              </div>
            </div>
          </div>

          {/* Widget 4: Gardening Quote (Mockup Style) */}
          <div className="bg-[#0b1026]/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm mt-1">
            {/* Mini watering can visual wrapper */}
            <div className="w-10 h-10 bg-sky-950/40 rounded-xl flex items-center justify-center shrink-0 border border-sky-500/20 text-sky-400">
              💧
            </div>
            <p className="text-[10px] font-semibold text-sky-200/80 leading-relaxed italic font-serif">
              "Kiến thức hôm nay sẽ là khu vườn tươi tốt của ngày mai." ❤
            </p>
          </div>

        </div>
      </div>

      {/* 4. Thematic PVZ Almanac Modal (Bách Khoa Thảo Mộc) on Click */}
      {almanacOpen && selectedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          
          {/* Main Book-themed Container */}
          <div className="bg-[#24150b] border-4 border-[#854d0e] rounded-3xl p-6 max-w-2xl w-full shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col md:flex-row gap-6 relative overflow-hidden animate-[slideUp_0.25s_ease-out_forwards]"
               style={{
                 backgroundImage: 'linear-gradient(to bottom, rgba(43, 22, 4, 0.98), rgba(28, 14, 2, 0.99))'
               }}>
            
            {/* Close Button top-right */}
            <button
              onClick={() => { setAlmanacOpen(false); setSelectedPlant(null); }}
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 text-white cursor-pointer text-sm font-black transition-colors"
            >
              ✕
            </button>

            {/* Left page: Large Swaying Animated Preview (PvZ Style) */}
            <div className="flex-1 bg-black/45 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center h-64 md:h-auto min-h-[220px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.06)_0%,_transparent_70%)] pointer-events-none" />
              
              {/* Massive sway plant graphic */}
              <div className="scale-125 mb-4">
                {getPlantGraphic(selectedPlant, 0, true)}
              </div>

              {/* Overdue/Weed indicator */}
              {selectedPlant.isOverdue && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white rounded-full px-2.5 py-0.5 text-[9px] font-black border border-white/20 shadow">
                  🍂 Cần ôn tập gấp
                </div>
              )}
            </div>

            {/* Right page: Profile details, pinyin, actions */}
            <div className="flex-1 flex flex-col justify-between gap-4">
              
              {/* Header */}
              <div className="border-b border-[#a16207]/45 pb-3">
                <span className="text-[9px] font-sans font-black text-orange-400/70 uppercase tracking-widest block">
                  Sách Bách Khoa Thảo Mộc
                </span>
                <h3 className="text-lg font-black text-white font-serif mt-0.5">📖 HỒ SƠ THẢO MỘC</h3>
              </div>

              {/* Character Board */}
              <div className="text-center md:text-left">
                <span className="text-4xl font-black text-yellow-400 font-serif leading-none tracking-wider">{selectedPlant.hanzi}</span>
                <span className="text-base text-orange-400 font-mono font-bold block mt-1">{selectedPlant.pinyin}</span>
              </div>

              {/* Meaning block */}
              <div className="bg-black/35 rounded-2xl p-4 border border-[#a16207]/20 flex-1 min-h-[80px]">
                <span className="text-[9px] font-sans font-bold text-orange-400/80 block mb-1">NGHĨA VIỆT:</span>
                <p className="text-xs font-semibold text-orange-100 leading-relaxed font-sans max-h-[100px] overflow-y-auto pr-1">
                  {selectedPlant.meaning}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-[10px] bg-black/15 p-3.5 rounded-2xl border border-white/5 font-sans">
                <div className="space-y-0.5">
                  <span className="text-white/40 block text-[8px] tracking-wide">GIAI ĐOẠN:</span>
                  <strong className="text-orange-200">
                    {selectedPlant.stage === 'seed'
                      ? '🟤 Hạt giống'
                      : selectedPlant.stage === 'sprout'
                      ? '🌱 Mầm non'
                      : selectedPlant.stage === 'sapling'
                      ? '🌿 Cây nhỏ/Ra hoa'
                      : '🌳 Cổ thụ hoàng kim'}
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-white/40 block text-[8px] tracking-wide">GIÃN CÁCH SRS:</span>
                  <strong className="text-orange-200">{selectedPlant.interval} ngày</strong>
                </div>
                <div className="space-y-0.5 col-span-2 pt-2 border-t border-white/5">
                  <span className="text-white/40 block text-[8px] tracking-wide">TÌNH TRẠNG SỨC KHỎE:</span>
                  <strong className={selectedPlant.isOverdue ? 'text-rose-400 animate-pulse' : 'text-green-400'}>
                    {selectedPlant.isOverdue ? 'Khô héo (Cần ôn tập gấp để tưới)' : 'Tươi tốt (Rất khỏe mạnh)'}
                  </strong>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, selectedPlant.hanzi)}
                  className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/35 hover:bg-yellow-500/25 text-yellow-400 text-xs font-bold cursor-pointer transition-all"
                >
                  <Volume2 size={14} />
                  <span>Đọc âm</span>
                </button>
                <Link
                  to={`/write?word=${encodeURIComponent(selectedPlant.hanzi)}`}
                  className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500/10 border border-orange-500/35 hover:bg-orange-500/25 text-orange-400 text-xs font-bold cursor-pointer transition-all"
                >
                  <PenTool size={14} />
                  <span>Tập viết</span>
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Sprout Icon helper component
function SproutIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M10 20v-5a4 4 0 0 1 4-4h1" />
      <path d="M12 11a4 4 0 0 1-4-4v-1" />
      <path d="M8 6h1" />
      <path d="M16 11h1" />
    </svg>
  );
}
