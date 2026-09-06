/**
 * ChongZi Level & Scholar Path System (Hệ thống Cấp độ & 3 Đạo Lộ Danh Hiệu)
 *
 * All paths share the exact same mathematical EXP curve so progress and level numbers
 * remain identical across all themes and screens.
 */

export const SCHOLAR_PATHS = {
  imperial: {
    id: 'imperial',
    name: 'Khoa Cử Bảng Vàng',
    icon: '📜',
    symbol: 'Bảng Vàng',
    description: 'Hành trình sĩ tử vượt vũ môn: từ Đồng Sinh vỡ lòng đến Trạng Nguyên và Văn Thánh tối cao.',
    concept: 'Nho gia cổ phong',
  },
  chongzi: {
    id: 'chongzi',
    name: 'Tiến Hóa Trùng Tử',
    icon: '🐛',
    symbol: 'Linh Trùng',
    description: 'Hành trình chú sâu nhỏ gặm nhấm từng nét chữ Hán, dệt kén, hóa bướm và phi thăng thành Long Thánh.',
    concept: 'Tiến hóa linh thú',
  },
  cultivation: {
    id: 'cultivation',
    name: 'Tu Chân Luyện Chữ',
    icon: '⚔️',
    symbol: 'Đạo Cảnh',
    description: 'Con đường tu tiên luyện chữ: ngưng tụ nét bút từ Luyện Khí, Trúc Cơ cho đến Thánh Nhân đại đạo.',
    concept: 'Tiên hiệp kỳ ảo',
  },
};

export const SCHOLAR_TIERS = [
  {
    tier: 1,
    minLevel: 1,
    maxLevel: 4,
    icon: '🪵',
    colorClasses: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    ringColor: 'ring-emerald-500/30',
    progressBg: 'bg-emerald-500',
    titles: {
      imperial: 'Đồng Sinh',
      chongzi: 'Ấu Trùng',
      cultivation: 'Luyện Khí Kỳ',
    },
    subtitles: {
      imperial: 'Sĩ tử vỡ lòng',
      chongzi: 'Sâu con gặm chữ',
      cultivation: 'Ngưng tụ nét bút',
    },
  },
  {
    tier: 2,
    minLevel: 5,
    maxLevel: 9,
    icon: '🥉',
    colorClasses: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    ringColor: 'ring-teal-500/30',
    progressBg: 'bg-teal-500',
    titles: {
      imperial: 'Tú Tài',
      chongzi: 'Tằm Tơ',
      cultivation: 'Trúc Cơ Kỳ',
    },
    subtitles: {
      imperial: 'Khảo khóa sơ cấp',
      chongzi: 'Dệt kén từ vựng',
      cultivation: 'Vững nền Hán tự',
    },
  },
  {
    tier: 3,
    minLevel: 10,
    maxLevel: 19,
    icon: '🥈',
    colorClasses: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    ringColor: 'ring-blue-500/30',
    progressBg: 'bg-blue-500',
    titles: {
      imperial: 'Cử Nhân',
      chongzi: 'Hóa Kén',
      cultivation: 'Kim Đan Kỳ',
    },
    subtitles: {
      imperial: 'Đỗ kỳ thi Hương',
      chongzi: 'Tích tụ nội hàm',
      cultivation: 'Đan điền kết chữ',
    },
  },
  {
    tier: 4,
    minLevel: 20,
    maxLevel: 34,
    icon: '🥇',
    colorClasses: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    ringColor: 'ring-purple-500/30',
    progressBg: 'bg-purple-500',
    titles: {
      imperial: 'Tiến Sĩ',
      chongzi: 'Bướm Ngọc',
      cultivation: 'Nguyên Anh Kỳ',
    },
    subtitles: {
      imperial: 'Đỗ kỳ thi Hội',
      chongzi: 'Điệp vũ phiêu du',
      cultivation: 'Xuất khiếu văn phong',
    },
  },
  {
    tier: 5,
    minLevel: 35,
    maxLevel: 49,
    icon: '💎',
    colorClasses: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    ringColor: 'ring-amber-500/30',
    progressBg: 'bg-amber-500',
    titles: {
      imperial: 'Thám Hoa',
      chongzi: 'Kỳ Lân',
      cultivation: 'Hóa Thần Kỳ',
    },
    subtitles: {
      imperial: 'Tam khôi đình thí',
      chongzi: 'Linh thú tường thụy',
      cultivation: 'Thần niệm thông tỏ',
    },
  },
  {
    tier: 6,
    minLevel: 50,
    maxLevel: 74,
    icon: '🔥',
    colorClasses: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    ringColor: 'ring-rose-500/30',
    progressBg: 'bg-rose-500',
    titles: {
      imperial: 'Trạng Nguyên',
      chongzi: 'Thần Long',
      cultivation: 'Độ Kiếp Phi Thăng',
    },
    subtitles: {
      imperial: 'Đỉnh cao bảng vàng',
      chongzi: 'Chân long xuất thế',
      cultivation: 'Tiên nhân giáng trần',
    },
  },
  {
    tier: 7,
    minLevel: 75,
    maxLevel: 9999,
    icon: '👑',
    colorClasses: 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-rose-500/20 text-amber-600 dark:text-amber-300 border-amber-400/40 shadow-xs shadow-amber-500/10',
    ringColor: 'ring-amber-400/40',
    progressBg: 'bg-gradient-to-r from-amber-500 to-rose-500',
    titles: {
      imperial: 'Văn Thánh',
      chongzi: 'Long Thánh',
      cultivation: 'Thánh Nhân',
    },
    subtitles: {
      imperial: 'Vạn thế sư biểu',
      chongzi: 'Thánh long vĩnh hằng',
      cultivation: 'Đại đạo quy nhất',
    },
  },
];

/**
 * Total XP required to reach a specific level L (L >= 1)
 * Formula: XP(L) = 50 * (L - 1)^2 + 100 * (L - 1)
 */
export function getXpForLevel(level) {
  if (level <= 1) return 0;
  const n = level - 1;
  return 50 * n * n + 100 * n;
}

/**
 * Calculate user level from total XP
 * Inverse formula: L = floor(sqrt(1 + XP / 50))
 */
export function calculateLevel(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.floor(Math.sqrt(1 + safeXp / 50)));
}

/**
 * Return the active tier for a given level
 */
export function getTierForLevel(level) {
  const safeLevel = Math.max(1, level);
  const found = SCHOLAR_TIERS.find((t) => safeLevel >= t.minLevel && safeLevel <= t.maxLevel);
  return found || SCHOLAR_TIERS[SCHOLAR_TIERS.length - 1];
}

/**
 * Comprehensive Level Data object for any screen
 */
export function getLevelData(xp, pathId = 'imperial') {
  const safePath = SCHOLAR_PATHS[pathId] ? pathId : 'imperial';
  const safeXp = Math.max(0, Number(xp) || 0);
  const level = calculateLevel(safeXp);
  const tier = getTierForLevel(level);

  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpInLevel = safeXp - currentLevelXp;
  const xpRequiredForNext = nextLevelXp - currentLevelXp;
  const progressPercent = xpRequiredForNext > 0
    ? Math.min(100, Math.max(0, Math.round((xpInLevel / xpRequiredForNext) * 100)))
    : 100;

  const title = tier.titles[safePath] || tier.titles.imperial;
  const subtitle = tier.subtitles[safePath] || tier.subtitles.imperial;
  const pathInfo = SCHOLAR_PATHS[safePath];

  // Next tier preview (if not top tier)
  const nextTier = SCHOLAR_TIERS.find((t) => t.tier === tier.tier + 1);
  const nextTitle = nextTier ? nextTier.titles[safePath] : null;
  const nextTierLevel = nextTier ? nextTier.minLevel : null;

  return {
    level,
    xp: safeXp,
    tier: tier.tier,
    tierData: tier,
    title,
    subtitle,
    pathId: safePath,
    pathName: pathInfo.name,
    pathIcon: pathInfo.icon,
    icon: tier.icon,
    colorClasses: tier.colorClasses,
    ringColor: tier.ringColor,
    progressBg: tier.progressBg,
    currentLevelXp,
    nextLevelXp,
    xpInLevel,
    xpRequiredForNext,
    progressPercent,
    nextTitle,
    nextTierLevel,
  };
}

const STORAGE_PATH_KEY = 'chongzi_scholar_path';

export function getSavedScholarPath(fallback = 'imperial') {
  try {
    const saved = localStorage.getItem(STORAGE_PATH_KEY);
    if (saved && SCHOLAR_PATHS[saved]) {
      return saved;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function setSavedScholarPath(pathId) {
  if (SCHOLAR_PATHS[pathId]) {
    try {
      localStorage.setItem(STORAGE_PATH_KEY, pathId);
    } catch {
      // ignore
    }
  }
}
