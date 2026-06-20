import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { statsApi } from '../services/statsApi';
import { fetchSummary } from '../features/stats/statsSlice';
import { 
  ArrowLeft, Coins, Flame, TrendingUp, HelpCircle, 
  Loader2, Droplet, Trash2, Volume2, PenTool 
} from 'lucide-react';
import { speakChinese } from '../utils/tts';

export default function GardenScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.stats.summary);
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [hoveredPlant, setHoveredPlant] = useState(null);
  const [floatingCoins, setFloatingCoins] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load ALL garden plants
  const fetchGarden = async () => {
    try {
      setLoading(true);
      const res = await statsApi.getGardenState(420, true); // all = true
      setGarden(res.data);
    } catch (err) {
      console.error('Failed to fetch garden:', err);
      showMsg('Không thể tải khu vườn của bạn.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarden();
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
      await fetchGarden();
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

  // Alternate checkered colors for PvZ meadow look
  const getGrassTileStyle = (row, col) => {
    const isEven = (row + col) % 2 === 0;
    return isEven
      ? 'bg-[#1b431c] border-t border-l border-[#2e6d30]/20'
      : 'bg-[#133215] border-t border-l border-[#214f24]/20';
  };

  // Group plants into 5 columns grid rows
  const columns = 5;
  const totalTiles = Math.max(25, Math.ceil(plants.length / columns) * columns + columns); // Min 5 rows of 5
  const rows = totalTiles / columns;

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#0a0b10] rounded-3xl overflow-hidden p-4 sm:p-6 text-white border border-white/5 flex flex-col relative select-none font-sans">
      
      {/* CSS Keyframes injected for plants sway & animations */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes goldGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(245,158,11,0.5)) drop-shadow(0 0 10px rgba(245,158,11,0.3)); }
          50% { filter: drop-shadow(0 0 8px rgba(245,158,11,0.7)) drop-shadow(0 0 18px rgba(245,158,11,0.5)); }
        }
        @keyframes floatCoin {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-40px) scale(1.1); opacity: 0; }
        }
        .animate-sway {
          animation: sway 3s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .animate-goldGlow {
          animation: goldGlow 2.5s ease-in-out infinite;
        }
        .animate-float-coin {
          animation: floatCoin 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* Floating Coins layer */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          className="absolute z-50 pointer-events-none animate-float-coin flex items-center gap-1 text-sm font-black text-yellow-400 bg-yellow-950/95 border border-yellow-500/40 px-2 py-1 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"
          style={{
            left: `${coin.x}%`,
            top: `${coin.y}%`
          }}
        >
          <Coins size={12} className="fill-current animate-bounce" />
          <span>+ Xu ChongZi</span>
        </div>
      ))}

      {/* Message Notifications */}
      {message.text && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 text-xs font-bold py-2 px-5 rounded-full border shadow-lg animate-pulse ${
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

      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer shadow-sm"
            title="Quay lại Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              🌻 Khu Vườn Từ Vựng ChongZi (PvZ Style)
            </h1>
            <p className="text-xs text-white/50">Mỗi từ vựng bạn học sẽ mọc thành một loài cây PvZ. Hãy học từ mới để gieo hạt, ôn tập để dọn cỏ và tưới nước!</p>
          </div>
        </div>

        {/* Info & Stats Capsule */}
        <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md w-fit">
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-500" title="Chuỗi ngày học">
            <Flame size={14} className="fill-current" />
            <span>{summary?.streak || 0} ngày</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1 text-xs font-semibold text-yellow-400" title="Số Xu của bạn">
            <Coins size={14} className="fill-current" />
            <span>{summary?.coins || 0} Xu</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          
          {/* Legend summaries */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
            <span className="bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 text-yellow-400" title="Cây cổ thụ (interval >= 30 ngày)">
              🌳 {goldenTreesCount}
            </span>
            <span className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400" title="Cây con">
              🌿 {saplingsCount}
            </span>
            <span className="bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 text-green-400" title="Mầm non">
              🌱 {sproutsCount}
            </span>
            <span className="bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-amber-500" title="Hạt giống">
              🟤 {seedsCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. PvZ Lawn Control Bar */}
      <div className="bg-[#12131a]/80 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 text-green-400 p-2.5 rounded-xl border border-green-500/20">
            🌳
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Tổng số cây đã trồng: {plants.length} cây</h4>
            <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">
              Cây vàng tạo xu hàng ngày. {overdueCount > 0 ? `Cảnh báo: Có ${overdueCount} cỏ dại cần dọn dẹp!` : 'Vườn đang rất sạch sẽ.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {/* Action: Water / Weed */}
          <button
            onClick={() => navigate('/study')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm cursor-pointer ${
              overdueCount > 0
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/35 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
            }`}
          >
            {overdueCount > 0 ? (
              <>
                <Trash2 size={14} className="text-rose-400 animate-bounce" />
                <span>Dọn cỏ úa ({overdueCount})</span>
              </>
            ) : (
              <>
                <Droplet size={14} className="text-sky-400" />
                <span>Tưới nước học tập</span>
              </>
            )}
          </button>

          {/* Action: Harvest */}
          <button
            onClick={handleHarvest}
            disabled={!canHarvest || harvesting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
              canHarvest
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-bounce'
                : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
            }`}
          >
            {harvesting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Coins size={14} className={canHarvest ? 'fill-current' : ''} />
            )}
            <span>Thu hoạch {harvestReward > 0 ? `(+${harvestReward} Xu)` : ''}</span>
          </button>
        </div>
      </div>

      {/* 3. Infinite Plants vs Zombies Checkered Lawn Patches */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-2 rounded-2xl border border-white/5 shadow-2xl relative bg-gradient-to-b from-[#0d0e12] to-[#08090b]">
        
        {/* Sky Background visual at top */}
        <div className="h-6 w-full bg-gradient-to-b from-indigo-950/20 to-transparent absolute top-0 pointer-events-none" />

        {/* Grass Grid container */}
        <div className="grid grid-cols-5 gap-0.5 p-0.5 min-h-[500px]">
          {Array.from({ length: totalTiles }).map((_, tileIndex) => {
            const row = Math.floor(tileIndex / columns);
            const col = tileIndex % columns;
            const plant = plants[tileIndex];

            // Render Empty Grass Tile
            if (!plant) {
              return (
                <div 
                  key={`empty-${tileIndex}`}
                  className={`relative flex flex-col items-center justify-center min-h-[140px] aspect-square rounded transition-all duration-300 hover:brightness-105 group/tile ${getGrassTileStyle(row, col)}`}
                >
                  {/* Subtle planting plot placeholder with outline and sprout symbol */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-white/10 group-hover/tile:text-white/40 transition-colors duration-300">
                    <svg viewBox="0 0 60 60" className="w-10 h-10 opacity-30 group-hover/tile:opacity-80 transition-all duration-300">
                      <ellipse cx="30" cy="45" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                      <path d="M 30 45 L 30 35 M 30 35 Q 26 31 28 27 M 30 35 Q 34 32 32 28" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span className="text-[8px] font-sans font-bold opacity-0 group-hover/tile:opacity-60 transition-opacity mt-1 select-none text-center leading-tight">
                      Gieo hạt mới<br/>khi học từ mới
                    </span>
                  </div>
                  
                  {/* Subtle weed animation placeholder occasionally */}
                  {row % 3 === 0 && col % 4 === 1 && (
                    <div className="absolute bottom-2 opacity-10 select-none">🌿</div>
                  )}
                </div>
              );
            }

            // Render Grass Tile with Plant
            const { hanzi, pinyin, meaning, stage, isOverdue, interval } = plant;
            const leafColorMain = isOverdue ? '#7c2d12' : '#166534';
            const leafColorLight = isOverdue ? '#b45309' : '#22c55e';

            return (
              <div
                key={plant.id}
                className={`relative flex flex-col items-center justify-between py-3 min-h-[140px] aspect-square rounded transition-all duration-300 cursor-pointer hover:brightness-110 hover:-translate-y-1 ${getGrassTileStyle(row, col)}`}
                onMouseEnter={() => setHoveredPlant({ ...plant, row, col })}
                onMouseLeave={() => setHoveredPlant(null)}
              >
                {/* Visual Plant graphics */}
                <div className="w-full flex-1 flex items-center justify-center relative mt-3">
                  
                  {/* 1. SEED */}
                  {stage === 'seed' && (
                    <svg viewBox="0 0 60 60" className="w-12 h-12">
                      <ellipse cx="30" cy="50" rx="14" ry="4" fill="#451a03" opacity="0.6" />
                      <ellipse cx="30" cy="46" rx="5" ry="3" fill="#78350f" stroke="#451a03" strokeWidth="0.5" />
                      <path d="M 31 46 Q 34 40 32 36" stroke="#86efac" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}

                  {/* 2. SPROUT */}
                  {stage === 'sprout' && (
                    <svg viewBox="0 0 60 60" className="w-16 h-16 animate-sway">
                      <ellipse cx="30" cy="50" rx="16" ry="4.5" fill="#3f1c06" opacity="0.5" />
                      <path d="M 30 50 Q 26 40 29 30" stroke={isOverdue ? '#854d0e' : '#4ade80'} strokeWidth="3" fill="none" />
                      <path d="M 29 30 Q 21 26 19 32 Q 24 33 29 30" fill={leafColorMain} />
                      <path d="M 29 30 Q 37 25 40 31 Q 35 34 29 30" fill={leafColorLight} />
                    </svg>
                  )}

                  {/* 3. SAPLING */}
                  {stage === 'sapling' && (
                    <svg viewBox="0 0 70 70" className="w-20 h-20 animate-sway">
                      <ellipse cx="35" cy="60" rx="20" ry="5.5" fill="#3f1c06" opacity="0.5" />
                      <path d="M 35 60 L 34 48 Q 32 36 35 24" stroke="#5c2e0b" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                      <circle cx="27" cy="24" r="11" fill={leafColorMain} opacity="0.9" />
                      <circle cx="43" cy="26" r="11" fill={isOverdue ? '#a16207' : '#15803d'} opacity="0.9" />
                      <circle cx="35" cy="15" r="14" fill={leafColorLight} opacity="0.95" />
                    </svg>
                  )}

                  {/* 4. GOLDEN TREE */}
                  {stage === 'golden' && (
                    <svg viewBox="0 0 80 80" className="w-24 h-24 animate-sway animate-goldGlow">
                      <ellipse cx="40" cy="68" rx="24" ry="6.5" fill="#381a04" opacity="0.5" />
                      <path d="M 40 68 L 38 52 Q 36 36 40 22" stroke="#854d0e" strokeWidth="6" fill="none" strokeLinecap="round" />
                      <path d="M 38 46 Q 28 36 24 40" stroke="#854d0e" strokeWidth="3" fill="none" strokeLinecap="round" />
                      <path d="M 39 38 Q 49 28 53 32" stroke="#854d0e" strokeWidth="3" fill="none" strokeLinecap="round" />
                      <circle cx="26" cy="26" r="15" fill={isOverdue ? '#a16207' : '#f59e0b'} opacity="0.9" />
                      <circle cx="54" cy="28" r="15" fill={isOverdue ? '#78350f' : '#b45309'} opacity="0.9" />
                      <circle cx="40" cy="15" r="20" fill={isOverdue ? '#d97706' : '#fbbf24'} opacity="0.95" />
                    </svg>
                  )}

                  {/* Withered Overdue Visual overlay icon */}
                  {isOverdue && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-0.5 text-[8px] font-black border border-white/20 shadow">
                      🍂 Héo
                    </div>
                  )}
                </div>

                {/* Plant Name Board (PvZ Style) */}
                <div className="bg-[#5c2e0b]/90 border border-[#3e1f07] text-white/95 px-2.5 py-0.5 rounded shadow text-center max-w-[85%] font-serif font-black text-sm relative z-10 select-none tracking-wider">
                  {hanzi}
                </div>

                {/* Hover Seed Packet / Card Tooltip inside tile */}
                {hoveredPlant?.id === plant.id && (
                  <div
                    className="absolute z-40 bg-[#2b1604]/95 border-2 border-[#ffba08] shadow-[0_0_20px_rgba(0,0,0,0.85)] p-4 rounded-xl text-left w-56 space-y-3 pointer-events-auto"
                    style={{
                      bottom: row === 0 ? 'auto' : '85%',
                      top: row === 0 ? '85%' : 'auto',
                      left: col >= 4 ? 'auto' : '50%',
                      right: col >= 4 ? '10%' : 'auto',
                      transform: col >= 4 ? 'none' : 'translateX(-50%)',
                      backgroundImage: 'linear-gradient(to bottom, rgba(43, 22, 4, 0.95), rgba(28, 14, 2, 0.98))'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* PvZ Pack Header */}
                    <div className="flex justify-between items-center border-b border-[#a16207] pb-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-yellow-400 font-serif leading-none">{hanzi}</span>
                        <span className="text-[10px] text-orange-400 font-mono font-bold">{pinyin}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-[#ff6b00]/20 text-[#ff8e3c] rounded border border-[#ff6b00]/30 font-mono">
                        {stage === 'seed'
                          ? 'Hạt'
                          : stage === 'sprout'
                          ? 'Mầm'
                          : stage === 'sapling'
                          ? 'Cây con'
                          : 'Cổ thụ'}
                      </span>
                    </div>

                    {/* Content body */}
                    <div className="text-[11px] space-y-1.5 text-orange-100">
                      <p className="font-semibold text-white/90 leading-relaxed line-clamp-3">
                        <span className="text-orange-400 font-bold block mb-0.5">Nghĩa Việt:</span>
                        {meaning}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-1 text-[9px] text-orange-200/60 pt-2 border-t border-[#a16207]/30">
                        <div>
                          <span className="block">Giãn cách:</span>
                          <strong className="text-white font-mono">{interval} ngày</strong>
                        </div>
                        <div>
                          <span className="block">Tình trạng:</span>
                          <strong className={isOverdue ? 'text-rose-400 animate-pulse' : 'text-green-400'}>
                            {isOverdue ? 'Khô héo (Cần ôn)' : 'Tươi tốt'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions at bottom of packet */}
                    <div className="flex gap-2 pt-2.5 border-t border-[#a16207]/40 justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleSpeak(e, hanzi)}
                        className="flex items-center gap-1 text-[9px] bg-yellow-500/10 border border-yellow-500/35 hover:bg-yellow-500/25 text-yellow-400 px-2 py-1 rounded font-mono font-bold cursor-pointer transition-colors"
                        title="Nghe giọng chuẩn"
                      >
                        <Volume2 size={10} />
                        <span>Đọc</span>
                      </button>
                      <Link
                        to={`/write?word=${encodeURIComponent(hanzi)}`}
                        className="flex items-center gap-1 text-[9px] bg-orange-500/10 border border-orange-500/35 hover:bg-orange-500/25 text-orange-400 px-2 py-1 rounded font-mono font-bold cursor-pointer transition-colors"
                        title="Tập viết từ này"
                      >
                        <PenTool size={10} />
                        <span>Viết</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
