import React from 'react';

/**
 * FarmPlantGraphic - Render graphic for 4 growth stages of knowledge plants:
 * - seed: Mầm hạt nhú lên từ ụ đất
 * - sprout: Cây non 2 lá xanh mướt đu đưa
 * - sapling: Cây tán tròn nở hoa tươi tắn
 * - golden: Đại cổ thụ hoàng kim quả vàng lấp lánh
 */
export default function FarmPlantGraphic({ stage = 'seed', isOverdue = false, size = 'md' }) {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Colors based on health
  const leafColor = isOverdue ? '#b45309' : '#10b981';
  const leafLight = isOverdue ? '#d97706' : '#34d399';
  const leafDark = isOverdue ? '#78350f' : '#059669';

  // 1. SEED STAGE (Mầm đất)
  if (stage === 'seed') {
    return (
      <div className={`${currentSize} flex items-center justify-center relative select-none`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Mound of cozy fertile soil */}
          <ellipse cx="50" cy="78" rx="36" ry="14" fill="#582f0e" opacity="0.9" />
          <ellipse cx="50" cy="76" rx="30" ry="10" fill="#7f4f24" />
          <ellipse cx="50" cy="75" rx="22" ry="7" fill="#936639" opacity="0.6" />
          
          {/* Small pebbles */}
          <circle cx="28" cy="80" r="3" fill="#6c757d" opacity="0.7" />
          <circle cx="72" cy="79" r="2.5" fill="#adb5bd" opacity="0.7" />
          <circle cx="62" cy="83" r="2" fill="#495057" opacity="0.7" />

          {/* Seed shell */}
          <ellipse cx="50" cy="72" rx="7" ry="5" fill="#4a2810" />

          {/* Cute tiny green shoot sprouting upwards */}
          <path
            d="M 50 72 Q 48 58 43 50 Q 40 45 42 42 Q 46 42 48 50 Q 50 60 50 72 Z"
            fill={leafLight}
          />
          <path
            d="M 48 55 Q 56 48 60 50 Q 61 53 58 56 Q 53 58 48 58 Z"
            fill={leafColor}
          />

          {/* Dewdrop sparkle */}
          {!isOverdue && (
            <circle cx="43" cy="44" r="2" fill="#ffffff" opacity="0.9" className="animate-pulse" />
          )}
        </svg>
      </div>
    );
  }

  // 2. SPROUT STAGE (Cây mầm 2 lá)
  if (stage === 'sprout') {
    return (
      <div className={`${currentSize} flex items-center justify-center relative select-none`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Soil base */}
          <ellipse cx="50" cy="82" rx="34" ry="11" fill="#582f0e" opacity="0.8" />
          <ellipse cx="50" cy="80" rx="26" ry="7" fill="#7f4f24" />

          {/* Plant Stem */}
          <path
            d="M 50 80 Q 48 60 50 42"
            stroke={leafDark}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Left Leaf */}
          <path
            d="M 50 60 C 35 55 25 45 28 35 C 38 32 46 45 50 56 Z"
            fill={leafLight}
            stroke={leafDark}
            strokeWidth="1.5"
          />

          {/* Right Leaf */}
          <path
            d="M 50 52 C 65 46 74 36 71 27 C 60 25 53 38 50 48 Z"
            fill={leafColor}
            stroke={leafDark}
            strokeWidth="1.5"
          />

          {/* Center tiny bud */}
          <circle cx="50" cy="40" r="3.5" fill="#a7f3d0" />
        </svg>
      </div>
    );
  }

  // 3. SAPLING STAGE (Cây đơm hoa tươi tắn)
  if (stage === 'sapling') {
    return (
      <div className={`${currentSize} flex items-center justify-center relative select-none`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          {/* Soil base */}
          <ellipse cx="50" cy="84" rx="36" ry="11" fill="#582f0e" opacity="0.85" />
          <ellipse cx="50" cy="82" rx="28" ry="7" fill="#7f4f24" />

          {/* Tree Trunk */}
          <path
            d="M 50 82 L 50 52 Q 43 45 38 40 M 50 52 Q 56 46 62 38"
            stroke="#78350f"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Foliage Puffs */}
          <circle cx="36" cy="40" r="16" fill={leafDark} opacity="0.9" />
          <circle cx="64" cy="42" r="16" fill={leafDark} opacity="0.9" />
          <circle cx="50" cy="30" r="21" fill={leafColor} />
          <circle cx="43" cy="24" r="12" fill={leafLight} opacity="0.75" />

          {/* Cute Flowers / Blossoms */}
          {!isOverdue ? (
            <>
              {/* Flower 1 */}
              <g transform="translate(36, 30)">
                <circle cx="0" cy="-4" r="3" fill="#fbcfe8" />
                <circle cx="4" cy="0" r="3" fill="#fbcfe8" />
                <circle cx="0" cy="4" r="3" fill="#fbcfe8" />
                <circle cx="-4" cy="0" r="3" fill="#fbcfe8" />
                <circle cx="0" cy="0" r="2.5" fill="#f59e0b" />
              </g>

              {/* Flower 2 */}
              <g transform="translate(60, 32)">
                <circle cx="0" cy="-3.5" r="2.8" fill="#fef08a" />
                <circle cx="3.5" cy="0" r="2.8" fill="#fef08a" />
                <circle cx="0" cy="3.5" r="2.8" fill="#fef08a" />
                <circle cx="-3.5" cy="0" r="2.8" fill="#fef08a" />
                <circle cx="0" cy="0" r="2" fill="#d97706" />
              </g>
            </>
          ) : (
            /* Withered leaf falling */
            <path d="M 62 48 Q 66 54 60 56 Q 58 52 62 48 Z" fill="#b45309" />
          )}
        </svg>
      </div>
    );
  }

  // 4. GOLDEN MASTER STAGE (Đại cổ thụ hoàng kim)
  return (
    <div className={`${currentSize} flex items-center justify-center relative select-none`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        {/* Soft Golden Aura */}
        <circle cx="50" cy="40" r="38" fill="#fbbf24" opacity="0.2" className="animate-pulse" />

        {/* Soil Base */}
        <ellipse cx="50" cy="85" rx="38" ry="11" fill="#451a03" opacity="0.9" />
        <ellipse cx="50" cy="83" rx="30" ry="7" fill="#78350f" />

        {/* Sturdy Wood Trunk with roots */}
        <path
          d="M 50 83 C 48 65 42 55 50 38 M 50 54 Q 38 46 32 36 M 50 52 Q 62 45 68 38"
          stroke="#92400e"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Golden Canopy Clouds */}
        <circle cx="32" cy="36" r="17" fill={isOverdue ? '#92400e' : '#d97706'} opacity="0.95" />
        <circle cx="68" cy="38" r="17" fill={isOverdue ? '#78350f' : '#b45309'} opacity="0.95" />
        <circle cx="50" cy="25" r="22" fill={isOverdue ? '#b45309' : '#f59e0b'} />
        <circle cx="43" cy="18" r="14" fill={isOverdue ? '#d97706' : '#fde047'} opacity="0.85" />

        {/* Shimmering Golden Coin Fruits */}
        {!isOverdue && (
          <>
            {/* Fruit 1 */}
            <g transform="translate(36, 26)">
              <circle cx="0" cy="0" r="5" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
              <rect x="-1.5" y="-1.5" width="3" height="3" fill="#d97706" />
            </g>

            {/* Fruit 2 */}
            <g transform="translate(62, 28)">
              <circle cx="0" cy="0" r="4.5" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
              <rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="#d97706" />
            </g>

            {/* Fruit 3 */}
            <g transform="translate(48, 14)">
              <circle cx="0" cy="0" r="4" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
              <rect x="-1" y="-1" width="2" height="2" fill="#d97706" />
            </g>

            {/* Little Treasure Chest at base */}
            <rect x="60" y="74" width="16" height="11" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="1" />
            <rect x="60" y="74" width="16" height="4" fill="#b45309" />
            <circle cx="68" cy="79" r="1.5" fill="#fef08a" />
          </>
        )}
      </svg>
    </div>
  );
}
