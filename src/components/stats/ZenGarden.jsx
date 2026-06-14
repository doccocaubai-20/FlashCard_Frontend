import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsApi } from '../../services/statsApi';
import { Sparkles, Flame, Droplet, Trash2, Coins, HelpCircle, Loader2 } from 'lucide-react';

export default function ZenGarden({ summary, onHarvestSuccess }) {
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [hoveredPlant, setHoveredPlant] = useState(null);
  const [floatingCoins, setFloatingCoins] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Predefined landscape coordinates for up to 11 plants (depth sorted by Y coordinate)
  const coords = [
    { x: 80, y: 160 },   // Row 1 (Back)
    { x: 180, y: 170 },
    { x: 310, y: 175 },
    { x: 410, y: 165 },
    { x: 120, y: 205 },  // Row 2 (Mid)
    { x: 250, y: 210 },
    { x: 370, y: 200 },
    { x: 70, y: 250 },   // Row 3 (Front)
    { x: 210, y: 255 },
    { x: 330, y: 260 },
    { x: 430, y: 250 }
  ];

  // Load garden details
  const fetchGarden = async () => {
    try {
      setLoading(true);
      const res = await statsApi.getGardenState();
      setGarden(res.data);
    } catch (err) {
      console.error('Failed to fetch garden state:', err);
      showMsg('Không thể tải dữ liệu khu vườn.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarden();
  }, [summary]); // Refresh garden when stats update

  const showMsg = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Harvest Coins Action
  const handleHarvest = async () => {
    if (!garden?.canHarvest || harvesting) return;
    setHarvesting(true);
    try {
      const res = await statsApi.harvestGarden();
      const reward = res.data.harvestedCoins;
      showMsg(`Thu hoạch thành công! Bạn nhận được +${reward} Xu ChongZi! 🪙`, 'success');
      
      // Spawn floating coins at random coordinates in the garden
      const newCoins = Array.from({ length: Math.min(reward, 8) }).map((_, i) => ({
        id: Date.now() + i,
        x: 150 + Math.random() * 200,
        y: 120 + Math.random() * 80
      }));
      setFloatingCoins(newCoins);
      setTimeout(() => setFloatingCoins([]), 1800);

      // Trigger callback to refresh stats (balance, etc.) in parent component
      if (onHarvestSuccess) {
        onHarvestSuccess();
      }
      
      // Reload garden state
      await fetchGarden();
    } catch (err) {
      console.error(err);
      showMsg(err.response?.data?.message || 'Có lỗi xảy ra khi thu hoạch.', 'error');
    } finally {
      setHarvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[320px] w-full flex flex-col justify-center items-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="text-xs text-white/50 mt-3 font-semibold">Đang chăm sóc khu vườn của bạn...</span>
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

  // Assign slot coordinates to plants
  const mappedPlants = plants.map((plant, index) => {
    const coord = coords[index % coords.length];
    return {
      ...plant,
      x: coord.x,
      y: coord.y
    };
  });

  // Dynamic weeds (Cỏ dại): place them in unused coordinates or random places if overdueCount > 0
  const weedCoordinates = [];
  if (overdueCount > 0) {
    // Generate up to 6 weeds at coords not taken by plants
    const weedCount = Math.min(6, Math.ceil(overdueCount / 2));
    const startIdx = mappedPlants.length;
    for (let i = 0; i < weedCount; i++) {
      const coord = coords[(startIdx + i * 2) % coords.length];
      // Offset slightly to prevent exact overlaps
      weedCoordinates.push({
        x: coord.x + (i % 2 === 0 ? 15 : -15),
        y: coord.y + 5
      });
    }
  }

  // Group all elements to render together and sort by Y coordinate for proper depth sorting (2.5D overlapping)
  const renderList = [
    ...mappedPlants.map(p => ({ ...p, isPlant: true })),
    ...weedCoordinates.map((w, idx) => ({ ...w, isWeed: true, id: `weed-${idx}` }))
  ].sort((a, b) => a.y - b.y);

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between shadow-lg relative select-none">
      
      {/* Garden Header & Stats Capsule */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3 mb-3">
        <div>
          <span className="text-[10px] font-sans font-bold text-white/50 uppercase tracking-widest block">
            GAME HÓA SRS MEMORY
          </span>
          <h3 className="text-xs font-bold text-white mt-0.5">Khu vườn Zen Từ vựng</h3>
        </div>

        {/* Small legend summary counts */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-white/70">
          <span className="flex items-center gap-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20" title="Cây cổ thụ hoàng kim (Ghi nhớ vĩnh viễn)">
            🌳 <span className="text-yellow-400">{goldenTreesCount}</span>
          </span>
          <span className="flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20" title="Cây con (Ghi nhớ trung hạn)">
            🌿 <span className="text-emerald-400">{saplingsCount}</span>
          </span>
          <span className="flex items-center gap-0.5 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20" title="Mầm non (Đang học)">
            🌱 <span className="text-green-400">{sproutsCount}</span>
          </span>
          <span className="flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title="Hạt giống (Mới/Quên)">
            🟤 <span className="text-amber-500">{seedsCount}</span>
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-0.5 bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse" title="Cỏ dại (Thẻ cần ôn tập quá hạn)">
              🌾 <span>{overdueCount} cỏ</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Visual SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#090a0f] to-[#12131a] border border-white/5 h-[240px]">
        {/* Floating Clouds Background */}
        <div className="absolute top-4 left-0 w-full overflow-hidden pointer-events-none opacity-20">
          <svg className="w-full h-10">
            <path d="M -50 15 Q -30 5 -10 15 T 30 15 T 70 10 T 110 15 L 110 30 L -50 30 Z" fill="#94a3b8" className="animate-[floatCloud_45s_linear_infinite]" />
            <path d="M 200 20 Q 220 10 240 20 T 280 20 T 320 15 T 360 20 L 360 30 L 200 30 Z" fill="#94a3b8" className="animate-[floatCloud_30s_linear_infinite]" style={{ animationDelay: '-15s' }} />
          </svg>
        </div>

        {/* SVG Canvas drawing landscape */}
        <svg viewBox="0 0 500 320" className="w-full h-full">
          {/* Neon Starry Filter & Gradients */}
          <defs>
            <radialGradient id="skyGrad" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.8" />
            </radialGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="witheredFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feColorMatrix type="matrix" values="0.6 0.2 0.2 0 0  0.2 0.5 0.2 0 0  0.2 0.2 0.3 0 0  0 0 0 1 0" />
            </filter>
          </defs>

          {/* Sky Rect */}
          <rect width="500" height="320" fill="url(#skyGrad)" />

          {/* Star circles */}
          <circle cx="45" cy="35" r="1" fill="#fff" opacity="0.6" />
          <circle cx="125" cy="20" r="1.5" fill="#fff" opacity="0.8" className="animate-pulse" />
          <circle cx="230" cy="40" r="1" fill="#fff" opacity="0.4" />
          <circle cx="340" cy="25" r="1" fill="#fff" opacity="0.7" />
          <circle cx="415" cy="50" r="1.5" fill="#fff" opacity="0.9" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="475" cy="30" r="1" fill="#fff" opacity="0.5" />

          {/* Grassy Hills / Ground Layers (2.5D Depth) */}
          {/* Back Hill */}
          <path d="M 0 200 Q 120 160 250 195 T 500 185 L 500 320 L 0 320 Z" fill="#142c23" opacity="0.7" />
          {/* Mid Hill */}
          <path d="M 0 230 Q 180 190 340 235 T 500 220 L 500 320 L 0 320 Z" fill="#113a29" opacity="0.8" />
          {/* Front Hill */}
          <path d="M 0 270 Q 150 230 310 275 T 500 255 L 500 320 L 0 320 Z" fill="#114e32" />

          {/* Render Plants and Weeds dynamically in sorted Y order */}
          {renderList.map((item) => {
            const { x, y } = item;

            // Render Weeds
            if (item.isWeed) {
              return (
                <g key={item.id}>
                  {/* Weed blades */}
                  <path
                    d={`M ${x} ${y} Q ${x - 6} ${y - 12} ${x - 10} ${y - 10} M ${x} ${y} Q ${x - 2} ${y - 15} ${x - 3} ${y - 15} M ${x} ${y} Q ${x + 6} ${y - 10} ${x + 8} ${y - 8}`}
                    stroke="#a16207"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  {/* Dry flower stem */}
                  <line x1={x} y1={y} x2={x+2} y2={y-18} stroke="#854d0e" strokeWidth="1" />
                  <circle cx={x+2} cy={y-18} r="1.5" fill="#78350f" />
                </g>
              );
            }

            // Render Plants
            const isOverdue = item.isOverdue;
            
            // Overdue plants color override (withered dry shades)
            const leafColorMain = isOverdue ? '#854d0e' : '#15803d';
            const leafColorMid = isOverdue ? '#a16207' : '#22c55e';
            const leafColorLight = isOverdue ? '#d97706' : '#4ade80';

            return (
              <g
                key={item.id}
                className="cursor-pointer group/plant transition-transform hover:scale-105"
                onMouseEnter={() => setHoveredPlant(item)}
                onMouseLeave={() => setHoveredPlant(null)}
              >
                {/* 1. SEED STAGE */}
                {item.stage === 'seed' && (
                  <g>
                    {/* Dirt Mound */}
                    <ellipse cx={x} cy={y} rx="12" ry="3.5" fill="#542e0c" opacity="0.9" />
                    {/* Seed Shell */}
                    <ellipse cx={x - 1} cy={y - 1.5} rx="3.5" ry="2" fill="#78350f" stroke="#451a03" strokeWidth="0.5" />
                    {/* Tiny green crack sprout */}
                    <path d={`M ${x + 1} ${y - 1} Q ${x + 4} ${y - 6} ${x + 2} ${y - 8}`} stroke="#86efac" strokeWidth="1.2" fill="none" />
                  </g>
                )}

                {/* 2. SPROUT STAGE */}
                {item.stage === 'sprout' && (
                  <g>
                    {/* Dirt Mound */}
                    <ellipse cx={x} cy={y} rx="14" ry="4" fill="#451a03" opacity="0.8" />
                    {/* Curved stem */}
                    <path
                      d={`M ${x} ${y} Q ${x - 3} ${y - 8} ${x - 1} ${y - 16}`}
                      stroke={isOverdue ? '#854d0e' : '#4ade80'}
                      strokeWidth="2"
                      fill="none"
                      className="origin-bottom group-hover/plant:animate-[sway_1s_ease-in-out_infinite]"
                    />
                    {/* Left leaf */}
                    <path d={`M ${x - 1} ${y - 16} Q ${x - 7} ${y - 19} ${x - 9} ${y - 13} Q ${x - 4} ${y - 12} ${x - 1} ${y - 16}`} fill={leafColorMain} />
                    {/* Right leaf */}
                    <path d={`M ${x - 1} ${y - 16} Q ${x + 5} ${y - 21} ${x + 8} ${y - 16} Q ${x + 3} ${y - 13} ${x - 1} ${y - 16}`} fill={leafColorLight} />
                  </g>
                )}

                {/* 3. SAPLING STAGE */}
                {item.stage === 'sapling' && (
                  <g>
                    {/* Dirt Mound */}
                    <ellipse cx={x} cy={y} rx="18" ry="4.5" fill="#451a03" opacity="0.7" />
                    {/* Tree trunk */}
                    <path d={`M ${x} ${y} L ${x - 1} ${y - 8} Q ${x - 2} ${y - 18} ${x} ${y - 28}`} stroke="#5c2e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
                    {/* Leaf crowns */}
                    <circle cx={x - 6} cy={y - 28} r="8" fill={leafColorMain} opacity="0.9" />
                    <circle cx={x + 7} cy={y - 30} r="8" fill={leafColorMid} opacity="0.9" />
                    <circle cx={x} cy={y - 37} r="10" fill={leafColorLight} opacity="0.95" />
                  </g>
                )}

                {/* 4. GOLDEN TREE STAGE */}
                {item.stage === 'golden' && (
                  <g>
                    {/* Dirt Mound */}
                    <ellipse cx={x} cy={y} rx="22" ry="5" fill="#381a04" opacity="0.7" />
                    {/* Strong trunk */}
                    <path d={`M ${x} ${y} L ${x - 1.5} L ${x - 2} ${y - 15} Q ${x - 3} ${y - 26} ${x} ${y - 38}`} stroke="#854d0e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    {/* Branches */}
                    <path d={`M ${x - 2} ${y - 18} Q ${x - 9} ${y - 28} ${x - 12} ${y - 25}`} stroke="#854d0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    <path d={`M ${x - 1} ${y - 25} Q ${x + 8} ${y - 33} ${x + 11} ${y - 30}`} stroke="#854d0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    {/* Golden canopy foliage (using filters for soft glowing effect) */}
                    <circle cx={x - 9} cy={y - 35} r="11" fill={isOverdue ? '#78350f' : '#b45309'} opacity="0.9" filter="url(#goldGlow)" />
                    <circle cx={x + 10} cy={y - 38} r="11" fill={isOverdue ? '#a16207' : '#f59e0b'} opacity="0.9" filter="url(#goldGlow)" />
                    <circle cx={x} cy={y - 48} r="15" fill={isOverdue ? '#d97706' : '#fbbf24'} opacity="0.95" filter="url(#goldGlow)" className="animate-[pulseGlow_3s_ease-in-out_infinite]" />
                  </g>
                )}

                {/* Character Float Label */}
                <text
                  x={x}
                  y={item.stage === 'seed' ? y - 13 : item.stage === 'sprout' ? y - 24 : item.stage === 'sapling' ? y - 46 : y - 62}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="900"
                  fontFamily="'Noto Serif SC', 'Lora', serif"
                  style={{
                    filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.95))',
                    letterSpacing: '0.05em'
                  }}
                  className="opacity-95 select-none font-bold"
                >
                  {item.hanzi}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Overdue/Weeds alert Banner overlay */}
        {overdueCount > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-rose-950/80 border border-rose-800/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <Trash2 size={12} className="text-rose-400 animate-bounce" />
            <span className="text-[9px] font-bold text-rose-300">
              Vườn có {overdueCount} cỏ dại! Hãy ôn tập thẻ đến hạn để làm sạch.
            </span>
          </div>
        )}

        {/* Floating Coin animation layer */}
        {floatingCoins.map((coin) => (
          <div
            key={coin.id}
            className="absolute z-10 pointer-events-none animate-float-coin flex items-center gap-0.5 text-xs font-black text-yellow-400 bg-yellow-950/90 border border-yellow-500/40 px-1.5 py-0.5 rounded-full"
            style={{
              left: `${(coin.x / 500) * 100}%`,
              top: `${(coin.y / 320) * 100}%`
            }}
          >
            <Coins size={10} className="fill-current" />
            <span>+ Xu ChongZi</span>
          </div>
        ))}

        {/* Message notification banner inside garden screen */}
        {message.text && (
          <div
            className={`absolute top-2.5 left-1/2 -translate-x-1/2 z-20 text-[10px] font-bold py-1 px-3 rounded-full border shadow-md animate-[pulse_2s_infinite] ${
              message.type === 'success'
                ? 'bg-green-950/90 border-green-500/40 text-green-400'
                : message.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-400'
                : 'bg-blue-950/90 border-blue-500/40 text-blue-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Hover Glassmorphic Plant Tooltip */}
        {hoveredPlant && (
          <div
            className="absolute z-30 bg-black/80 border border-white/10 backdrop-blur-md px-3 py-2.5 rounded-xl text-left shadow-xl pointer-events-none w-44 space-y-1.5"
            style={{
              left: `${Math.min(62, Math.max(2, (hoveredPlant.x - 88) / 500 * 100))}%`,
              top: `${Math.min(50, Math.max(2, (hoveredPlant.y - 120) / 320 * 100))}%`
            }}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-1">
              <span className="text-sm font-black text-white font-serif">{hoveredPlant.hanzi}</span>
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 bg-white/10 rounded">
                {hoveredPlant.stage === 'seed'
                  ? 'Hạt giống'
                  : hoveredPlant.stage === 'sprout'
                  ? 'Mầm non'
                  : hoveredPlant.stage === 'sapling'
                  ? 'Cây con'
                  : 'Cổ thụ'}
              </span>
            </div>
            <div className="text-[10px] space-y-0.5">
              <p className="text-yellow-400 font-bold font-mono">{hoveredPlant.pinyin}</p>
              <p className="text-white/80 font-medium truncate">{hoveredPlant.meaning}</p>
              <div className="flex justify-between items-center text-[8px] text-white/50 pt-1 mt-1 border-t border-white/5">
                <span>Khoảng cách:</span>
                <span className="font-mono font-bold text-white/80">{hoveredPlant.interval} ngày</span>
              </div>
              <div className="flex justify-between items-center text-[8px] text-white/50">
                <span>Trạng thái:</span>
                <span className={`font-bold ${hoveredPlant.isOverdue ? 'text-rose-400' : 'text-green-400'}`}>
                  {hoveredPlant.isOverdue ? 'Héo úa (Quá hạn)' : 'Khỏe mạnh'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Garden Action Panel (Footer Controls) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-3.5 pt-3.5 border-t border-white/5">
        
        {/* Helper info text */}
        <div className="text-[10px] text-white/50 pr-4 leading-relaxed">
          <span className="font-bold text-white/70 block">Mẹo làm vườn:</span>
          Tưới cây bằng cách ôn tập thẻ SRS hàng ngày. Cây hoàng kim (giãn cách &ge; 30 ngày) sẽ tạo ra xu mỗi ngày!
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Water/Weed study shortcut */}
          <button
            onClick={() => navigate('/study')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer ${
              overdueCount > 0
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/5'
            }`}
            title="Đi tới trang ôn bài để dọn cỏ và tưới cây"
          >
            {overdueCount > 0 ? (
              <>
                <Trash2 size={13} className="text-rose-400" />
                <span>Dọn cỏ ({overdueCount})</span>
              </>
            ) : (
              <>
                <Droplet size={13} className="text-sky-400" />
                <span>Tưới nước</span>
              </>
            )}
          </button>

          {/* Harvest Coin Button */}
          <button
            onClick={handleHarvest}
            disabled={!canHarvest || harvesting}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
              canHarvest
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce'
                : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
            }`}
            title={
              goldenTreesCount === 0
                ? 'Bạn chưa có cây cổ thụ hoàng kim nào'
                : !canHarvest
                ? 'Đã thu hoạch hôm nay. Hãy quay lại ngày mai!'
                : 'Thu hoạch xu ChongZi ngay!'
            }
          >
            {harvesting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Coins size={13} className={canHarvest ? 'fill-current' : ''} />
            )}
            <span>Thu hoạch {harvestReward > 0 ? `(+${harvestReward})` : ''}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
