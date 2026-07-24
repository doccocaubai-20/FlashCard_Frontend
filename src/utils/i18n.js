// Simple & Lightweight UI Internationalization (i18n) Utility
const translations = {
  vi: {
    // Menu Sidebar
    'overview': 'Tổng quan',
    'study_practice': 'Học & Ôn luyện',
    'reference_tools': 'Tra cứu & Công cụ',
    'system': 'Hệ thống',
    'admin_group': 'Quản trị (Admin)',

    'nav_dashboard': 'Dashboard',
    'nav_decks': 'Bộ bài',
    'nav_garden': 'Vườn từ vựng',
    'nav_leaderboard': 'Bảng xếp hạng',
    'nav_study_hub': 'Khu học tập HSK',
    'nav_game_arcade': 'Đấu trường game',
    'nav_hsk_exams': 'Luyện đề HSK',
    'nav_ai_chat': 'AI Chatbot',
    'nav_reference_hub': 'Tra cứu & Thư viện',
    'nav_settings': 'Cài đặt',
    'nav_admin': 'Admin CMS',
    'logout': 'Đăng xuất',
    'student_role': 'Học viên',
    'admin_role': 'Quản trị viên',

    // Settings Page
    'settings_title': 'Cài đặt',
    'account_section': 'Tài khoản',
    'email_address': 'Địa chỉ email',
    'account_type': 'Loại tài khoản',
    'native_language_section': 'Ngôn ngữ mẹ (Native Language)',
    'native_language_desc': 'Chọn ngôn ngữ mẹ để ứng dụng và AI hỗ trợ giải nghĩa, dịch thuật phù hợp nhất với bạn.',
    'appearance_section': 'Giao diện',
    'dark_mode': 'Chế độ tối (Dark Mode)',
    'dark_mode_desc': 'Chuyển đổi giữa giao diện sáng và tối giúp bảo vệ mắt khi học.',
    'profile_info_section': 'Thông tin cá nhân',
    'display_name': 'Tên hiển thị',
    'avatar_seed': 'Ảnh đại diện (Avatar)',
    'upload_avatar': 'Tải ảnh lên',
    'age': 'Tuổi',
    'save_profile_btn': 'Lưu thông tin cá nhân',
    'password_section': 'Đổi mật khẩu',
    'new_password': 'Mật khẩu mới',
    'confirm_password': 'Xác nhận mật khẩu mới',
    'change_password_btn': 'Đổi mật khẩu',
  },
  en: {
    // Menu Sidebar
    'overview': 'Overview',
    'study_practice': 'Study & Practice',
    'reference_tools': 'Search & Tools',
    'system': 'System',
    'admin_group': 'Administration',

    'nav_dashboard': 'Dashboard',
    'nav_decks': 'Decks',
    'nav_garden': 'Vocabulary Garden',
    'nav_leaderboard': 'Leaderboard',
    'nav_study_hub': 'HSK Study Hub',
    'nav_game_arcade': 'Game Arcade',
    'nav_hsk_exams': 'HSK Exams',
    'nav_ai_chat': 'AI Chatbot',
    'nav_reference_hub': 'Dictionary & Library',
    'nav_settings': 'Settings',
    'nav_admin': 'Admin CMS',
    'logout': 'Log out',
    'student_role': 'Student',
    'admin_role': 'Administrator',

    // Settings Page
    'settings_title': 'Settings',
    'account_section': 'Account',
    'email_address': 'Email Address',
    'account_type': 'Account Type',
    'native_language_section': 'Native Language',
    'native_language_desc': 'Select your native language so the app and AI can provide explanations and translations tailored for you.',
    'appearance_section': 'Appearance',
    'dark_mode': 'Dark Mode',
    'dark_mode_desc': 'Switch between light and dark themes to reduce eye strain.',
    'profile_info_section': 'Profile Information',
    'display_name': 'Display Name',
    'avatar_seed': 'Avatar',
    'upload_avatar': 'Upload Image',
    'age': 'Age',
    'save_profile_btn': 'Save Profile',
    'password_section': 'Change Password',
    'new_password': 'New Password',
    'confirm_password': 'Confirm New Password',
    'change_password_btn': 'Change Password',
  }
};

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese', flag: '🇻🇳' },
  { code: 'en', name: 'English', englishName: 'English', flag: '🇬🇧' },
  { code: 'zh', name: '中文 (Chinese)', englishName: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Japanese)', englishName: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', englishName: 'Korean', flag: '🇰🇷' },
  { code: 'fr', name: 'Français (French)', englishName: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', englishName: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Español (Spanish)', englishName: 'Spanish', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский (Russian)', englishName: 'Russian', flag: '🇷🇺' },
];

export function t(key, lang = 'vi') {
  const currentLang = translations[lang] ? lang : 'vi';
  return translations[currentLang][key] || translations['vi'][key] || key;
}
