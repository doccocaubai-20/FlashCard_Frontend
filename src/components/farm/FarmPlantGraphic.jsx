import React from 'react';

/**
 * FarmPlantGraphic - Đồ họa tươi tắn, rực rỡ cho 4 giai đoạn sinh trưởng:
 * - seed: Hạt mầm ngọc lục bảo nhú lên từ ụ đất sinh thái mầu mỡ với giọt sương mai.
 * - sprout: Chồi non 2 lá xanh mướt đu đưa, tràn đầy sức sống.
 * - sapling: Cây đơm hoa tươi tắn rực rỡ sắc xuân (hoa anh đào/hoa trà hồng phấn).
 * - golden: Đại cổ thụ hoàng kim tỏa ánh hào quang ấm áp, treo đồng xu vàng may mắn.
 *
 * Trạng thái khát nước (isOverdue):
 * Giữ trọn nét sinh động của cây (không biến thành que củi khô héo!),
 * nghiêng nhẹ đáng yêu kèm bong bóng nước nảy mầm (💭 💧) phát sáng mời gọi tưới nước.
 */
export default function FarmPlantGraphic({ stage = 'seed', isOverdue = false, size = 'md' }) {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Render Thirsty Thought Bubble
  const ThirstyBubble = () => (
    <div className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center animate-bounce pointer-events-none">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-sky-400/50 rounded-full blur-sm animate-pulse" />
        <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 via-cyan-400 to-blue-300 border-2 border-white flex items-center justify-center shadow-lg shadow-sky-500/50">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white text-white drop-shadow-sm">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-cyan-300 border border-white" />
        <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
      </div>
    </div>
  );

  // 1. SEED STAGE
  if (stage === 'seed') {
    return (
      <div className={`${currentSize} flex items-center justify-center relative select-none group`}>
        {isOverdue && <ThirstyBubble />}
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full drop-shadow-[0_8px_16px_rgba(16,185,129,0.25)] transition-transform duration-300 ${
            isOverdue ? 'rotate-[-3deg]' : 'group-hover:scale-105'
          }`}
        >
          <defs>
            <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a3525" />
              <stop offset="100%" stopColor="#2c1d11" />
            </linearGradient>
            <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="sproutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="85" rx="36" ry="9" fill="#000000" opacity="0.35" />
          <ellipse cx="50" cy="80" rx="34" ry="12" fill="url(#soilGrad)" />
          <ellipse cx="50" cy="77" rx="27" ry="8" fill="#5c4028" opacity="0.8" />
          <ellipse cx="36" cy="78" rx="7" ry="3" fill="url(#grassGrad)" opacity="0.85" />
          <ellipse cx="64" cy="79" rx="8" ry="3.5" fill="url(#grassGrad)" opacity="0.85" />

          <path
            d="M 44 76 C 44 70 56 70 56 76 C 56 80 44 80 44 76 Z"
            fill="#78350f"
            stroke="#92400e"
            strokeWidth="1.5"
          />

          <path
            d="M 50 74 Q 48 60 44 50 Q 40 43 45 40 Q 52 40 50 50 Q 49 62 50 74 Z"
            fill="url(#sproutGrad)"
            stroke="#047857"
            strokeWidth="1.2"
          />

          <path
            d="M 46 54 C 36 50 32 40 38 36 C 46 36 49 46 47 54 Z"
            fill="#a7f3d0"
            stroke="#059669"
            strokeWidth="1"
          />

          <path
            d="M 49 50 C 58 46 64 38 60 33 C 52 33 49 43 49 50 Z"
            fill="#34d399"
            stroke="#059669"
            strokeWidth="1"
          />

          <circle cx="44" cy="38" r="2.2" fill="#ffffff" opacity="0.95" />
          <circle cx="58" cy="35" r="1.5" fill="#ffffff" opacity="0.8" />
        </svg>
      </div>
    );
  }

  // 2. SPROUT STAGE
  if (stage === 'sprout') {
    return (
      <div className={`${currentSize} flex items-center justify-center relative select-none group`}>
        {isOverdue && <ThirstyBubble />}
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)] transition-transform duration-300 ${
            isOverdue ? 'rotate-[-4deg]' : 'group-hover:scale-105'
          }`}
        >
          <defs>
            <linearGradient id="stemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="leafGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="leafGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          <ellipse cx="50" cy="85" rx="35" ry="9" fill="#000000" opacity="0.3" />
          <ellipse cx="50" cy="81" rx="32" ry="10" fill="#382313" />
          <ellipse cx="50" cy="78" rx="24" ry="6" fill="#52351d" />

          <path d="M 30 80 Q 32 74 36 78 Q 40 73 45 78 Q 55 73 60 78 Q 65 74 70 80" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          <path
            d="M 50 78 Q 47 58 50 38"
            stroke="url(#stemGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          <path
            d="M 49 55 C 30 50 18 36 24 24 C 36 22 46 38 49 50 Z"
            fill="url(#leafGradLeft)"
            stroke="#047857"
            strokeWidth="1.5"
          />
          <path d="M 48 51 Q 34 38 27 27" stroke="#065f46" strokeWidth="1" fill="none" opacity="0.6" />

          <path
            d="M 50 48 C 68 44 80 30 75 20 C 62 18 54 32 50 44 Z"
            fill="url(#leafGradRight)"
            stroke="#047857"
            strokeWidth="1.5"
          />
          <path d="M 50 45 Q 64 34 72 23" stroke="#065f46" strokeWidth="1" fill="none" opacity="0.6" />

          <circle cx="50" cy="35" r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="50" cy="35" r="2.5" fill="#fde047" />

          <circle cx="27" cy="27" r="2.5" fill="#ffffff" opacity="0.9" />
          <circle cx="71" cy="24" r="2" fill="#ffffff" opacity="0.9" />
        </svg>
      </div>
    );
  }

  // 3. SAPLING STAGE
  if (stage === 'sapling') {
    return (
      <div className={`${currentSize} flex items-center justify-center relative select-none group`}>
        {isOverdue && <ThirstyBubble />}
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full drop-shadow-[0_12px_24px_rgba(244,114,182,0.25)] transition-transform duration-300 ${
            isOverdue ? 'rotate-[-3deg]' : 'group-hover:scale-105'
          }`}
        >
          <defs>
            <linearGradient id="woodTrunk" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="50%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#582506" />
            </linearGradient>
            <radialGradient id="foliageGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </radialGradient>
          </defs>

          <ellipse cx="50" cy="86" rx="36" ry="9" fill="#000000" opacity="0.35" />
          <ellipse cx="50" cy="83" rx="30" ry="9" fill="#3a2211" />
          <ellipse cx="50" cy="80" rx="22" ry="5" fill="#583419" />

          <path
            d="M 50 82 L 50 54 Q 40 46 34 40 M 50 54 Q 60 47 66 38 M 50 62 Q 54 56 60 52"
            stroke="url(#woodTrunk)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />

          <circle cx="34" cy="42" r="17" fill="#047857" opacity="0.95" />
          <circle cx="66" cy="43" r="17" fill="#047857" opacity="0.95" />
          <circle cx="50" cy="30" r="23" fill="url(#foliageGlow)" />
          <circle cx="40" cy="24" r="14" fill="#34d399" opacity="0.6" />

          {/* Sakura Blossoms */}
          <g transform="translate(35, 30)">
            <circle cx="0" cy="-4" r="3.2" fill="#fbcfe8" />
            <circle cx="4" cy="0" r="3.2" fill="#fbcfe8" />
            <circle cx="0" cy="4" r="3.2" fill="#fbcfe8" />
            <circle cx="-4" cy="0" r="3.2" fill="#fbcfe8" />
            <circle cx="0" cy="0" r="2.8" fill="#f43f5e" />
            <circle cx="0" cy="0" r="1.5" fill="#fef08a" />
          </g>

          <g transform="translate(63, 33)">
            <circle cx="0" cy="-3.8" r="3" fill="#fde68a" />
            <circle cx="3.8" cy="0" r="3" fill="#fde68a" />
            <circle cx="0" cy="3.8" r="3" fill="#fde68a" />
            <circle cx="-3.8" cy="0" r="3" fill="#fde68a" />
            <circle cx="0" cy="0" r="2.6" fill="#f59e0b" />
            <circle cx="0" cy="0" r="1.3" fill="#fff" />
          </g>

          <g transform="translate(49, 18)">
            <circle cx="0" cy="-3.5" r="2.8" fill="#fbcfe8" />
            <circle cx="3.5" cy="0" r="2.8" fill="#fbcfe8" />
            <circle cx="0" cy="3.5" r="2.8" fill="#fbcfe8" />
            <circle cx="-3.5" cy="0" r="2.8" fill="#fbcfe8" />
            <circle cx="0" cy="0" r="2.4" fill="#fb7185" />
          </g>

          <circle cx="42" cy="18" r="1.8" fill="#ffffff" opacity="0.9" />
          <circle cx="58" cy="22" r="1.5" fill="#ffffff" opacity="0.9" />
        </svg>
      </div>
    );
  }

  // 4. GOLDEN MASTER TREE
  return (
    <div className={`${currentSize} flex items-center justify-center relative select-none group`}>
      {isOverdue && <ThirstyBubble />}
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full drop-shadow-[0_14px_30px_rgba(245,158,11,0.35)] transition-transform duration-300 ${
          isOverdue ? 'rotate-[-3deg]' : 'group-hover:scale-105'
        }`}
      >
        <defs>
          <radialGradient id="sunAura" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="goldenFoliage" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="royalTrunk" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#582506" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="35" r="38" fill="url(#sunAura)" />

        <ellipse cx="50" cy="87" rx="38" ry="9" fill="#000000" opacity="0.4" />
        <ellipse cx="50" cy="83" rx="32" ry="9" fill="#3d210b" />
        <ellipse cx="50" cy="80" rx="24" ry="5" fill="#663813" />

        <path
          d="M 50 83 C 48 64 42 54 50 36 M 50 56 Q 37 47 30 36 M 50 53 Q 63 46 70 38 M 38 82 Q 45 78 50 82 Q 55 78 62 82"
          stroke="url(#royalTrunk)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        <circle cx="30" cy="35" r="18" fill="#b45309" opacity="0.9" />
        <circle cx="70" cy="37" r="18" fill="#b45309" opacity="0.9" />
        <circle cx="50" cy="24" r="24" fill="url(#goldenFoliage)" />
        <circle cx="42" cy="16" r="15" fill="#fef08a" opacity="0.75" />

        <g transform="translate(34, 25)">
          <circle cx="0" cy="0" r="5.2" fill="#fde047" stroke="#d97706" strokeWidth="1.2" />
          <rect x="-1.8" y="-1.8" width="3.6" height="3.6" fill="#b45309" rx="0.5" />
          <line x1="0" y1="-8" x2="0" y2="-5.2" stroke="#d97706" strokeWidth="1" />
        </g>

        <g transform="translate(65, 27)">
          <circle cx="0" cy="0" r="4.8" fill="#fde047" stroke="#d97706" strokeWidth="1.2" />
          <rect x="-1.6" y="-1.6" width="3.2" height="3.2" fill="#b45309" rx="0.5" />
          <line x1="0" y1="-8" x2="0" y2="-4.8" stroke="#d97706" strokeWidth="1" />
        </g>

        <g transform="translate(50, 11)">
          <circle cx="0" cy="2" r="3" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
          <circle cx="0" cy="-2" r="2.2" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
          <circle cx="0" cy="0" r="1.5" fill="#f59e0b" />
        </g>

        <path d="M 22 20 Q 24 22 26 22 Q 24 22 22 24 Q 22 22 20 22 Q 22 22 22 20 Z" fill="#ffffff" />
        <path d="M 76 18 Q 78 20 80 20 Q 78 20 76 22 Q 76 20 74 20 Q 76 20 76 18 Z" fill="#ffffff" />
        <circle cx="48" cy="38" r="1.5" fill="#ffffff" opacity="0.9" />
      </svg>
    </div>
  );
}
