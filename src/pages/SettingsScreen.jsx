import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { updateProfile } from '../features/auth/authSlice';
import { Sun, Moon, Camera, Check, ShieldAlert, Loader2, Globe } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const predefinedAvatarSeeds = ['Felix', 'Chloe', 'Buddy', 'Buster', 'Coco', 'Angel'];

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const _error = useSelector((state) => state.auth.error);
  const { t } = useTranslation();

  // 1. Dark Mode State and Logic
  const { classicTheme, setClassicTheme } = useTheme();
  const isDark = classicTheme === 'dark';
  const setIsDark = (val) => {
    const nextVal = typeof val === 'function' ? val(isDark) : val;
    setClassicTheme(nextVal ? 'dark' : 'light');
  };

  // 2. Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
    age: user?.age || '',
    nativeLanguage: user?.nativeLanguage || 'vi',
  });

  // Keep profileData in sync if user state updates from redux
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        avatarUrl: user.avatarUrl || '',
        age: user.age || '',
        nativeLanguage: user.nativeLanguage || 'vi',
      });
      if (user.nativeLanguage) {
        i18n.changeLanguage(user.nativeLanguage === 'en' ? 'en' : 'vi');
      }
    }
  }, [user]);

  // 3. Password Form State
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    setAvatarBroken(false);
  }, [profileData.avatarUrl]);

  const handleLanguageSelect = async (code) => {
    setProfileData((prev) => ({ ...prev, nativeLanguage: code }));
    i18n.changeLanguage(code);
    try {
      await dispatch(
        updateProfile({
          id: user.id,
          data: {
            nativeLanguage: code,
          },
        })
      ).unwrap();
    } catch (err) {
      console.error('Failed to auto-save native language:', err);
    }
  };

  // Handle file upload via API → Supabase Storage
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setAvatarMsg('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg('Ảnh không được vượt quá 2MB!');
      return;
    }

    setAvatarUploading(true);
    setAvatarMsg('Đang tải ảnh lên...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { avatarUrl } = res.data;
      setProfileData((prev) => ({ ...prev, avatarUrl }));
      setAvatarMsg('✅ Tải ảnh lên thành công!');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi tải ảnh lên!';
      setAvatarMsg(`${msg}`);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await dispatch(
        updateProfile({
          id: user.id,
          data: {
            name: profileData.name,
            avatarUrl: profileData.avatarUrl,
            age: profileData.age ? Number(profileData.age) : null,
            nativeLanguage: profileData.nativeLanguage,
          },
        })
      ).unwrap();
      i18n.changeLanguage(profileData.nativeLanguage === 'en' ? 'en' : 'vi');
      setProfileMsg(t('settings.profile_success'));
    } catch (err) {
      console.error(err);
      setProfileMsg('Cập nhật thất bại. Vui lòng thử lại.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordMsg('Mật khẩu xác nhận không trùng khớp!');
      return;
    }
    try {
      await dispatch(
        updateProfile({
          id: user.id,
          data: {
            password: passwordData.password,
          },
        })
      ).unwrap();
      setPasswordMsg('Thay đổi mật khẩu thành công!');
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setPasswordMsg('Đổi mật khẩu thất bại. Vui lòng thử lại.');
    }
  };

  const languageOptions = [
    { code: 'vi', name: t('settings.vietnamese'), flag: '🇻🇳' },
    { code: 'en', name: t('settings.english'), flag: '🇬🇧' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 p-6">

      {/* Page Title */}
      <div className="pb-4 border-b border-hairline dark:border-divider-dark">
        <h1 className="text-2xl font-extrabold text-ink dark:text-on-dark font-display tracking-tight">
          {t('settings.title')}
        </h1>
      </div>

      {/* Section 1: Tài khoản */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
          {t('settings.account')}
        </h2>
        <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-md divide-y divide-hairline dark:divide-divider-dark shadow-sm px-6 transition-colors">
          <div className="py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink dark:text-on-dark">{t('settings.email')}</span>
            <span className="text-sm text-body dark:text-on-dark-mute font-medium">{user?.email || 'Chưa thiết lập'}</span>
          </div>
          <div className="py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink dark:text-on-dark">{t('settings.account_type')}</span>
            <span className="inline-flex items-center px-3 py-1 bg-surface-bone dark:bg-surface-dark text-ink dark:text-on-dark text-xs font-bold rounded-full border border-hairline dark:border-divider-dark">
              {user?.role === 'ADMIN' ? t('common.admin') : t('common.student')}
            </span>
          </div>
        </div>
      </div>

      {/* Section: Ngôn ngữ mẹ (Native Language) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
          {t('settings.native_language')}
        </h2>
        <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-md shadow-sm p-6 transition-colors space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
              <Globe size={20} />
            </div>
            <div>
              <span className="text-sm font-semibold text-ink dark:text-on-dark block">
                {t('settings.native_language')}
              </span>
              <span className="text-xs text-mute dark:text-on-dark-mute mt-0.5 block leading-relaxed">
                {t('settings.native_language_desc')}
              </span>
            </div>
          </div>

          {/* 2 Language Option Cards (vi and en) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {languageOptions.map((item) => {
              const isSelected = profileData.nativeLanguage === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleLanguageSelect(item.code)}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30 shadow-sm'
                      : 'border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/80 text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{item.flag}</span>
                    <div>
                      <span className="text-sm font-bold block">{item.name}</span>
                      <span className="text-[11px] text-mute dark:text-on-dark-mute block font-mono uppercase tracking-wider mt-0.5">{item.code}</span>
                    </div>
                  </div>
                  {isSelected && <Check size={20} className="text-primary shrink-0 ml-2 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Giao diện (Sun/Moon switch) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
          {t('settings.appearance')}
        </h2>
        <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-md shadow-sm px-6 transition-colors">
          <div className="py-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-ink dark:text-on-dark block">{t('settings.dark_mode')}</span>
              <span className="text-xs text-mute dark:text-on-dark-mute mt-0.5 block">{t('settings.dark_mode_desc')}</span>
            </div>

            {/* Custom Sun/Moon Switch */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="relative inline-flex h-9 w-18 items-center rounded-full bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark transition-colors cursor-pointer select-none outline-none focus:outline-none shrink-0"
              title={isDark ? "Chuyển sang Chế độ sáng" : "Chuyển sang Chế độ tối"}
            >
              {/* Sun Icon */}
              <span className="absolute left-2.5 text-amber-500 z-10 pointer-events-none select-none">
                <Sun size={14} className={isDark ? 'opacity-30 transition-opacity' : 'opacity-100 transition-opacity'} />
              </span>

              {/* Toggle slider button */}
              <span
                className={`inline-block h-6.5 w-6.5 transform rounded-full bg-white dark:bg-primary shadow-sm transition-transform duration-300 ease-in-out ${isDark ? 'translate-x-10' : 'translate-x-1'
                  }`}
              />

              {/* Moon Icon */}
              <span className="absolute right-2.5 text-primary z-10 pointer-events-none select-none">
                <Moon size={14} className={isDark ? 'opacity-100 transition-opacity' : 'opacity-30 transition-opacity'} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Thông tin cá nhân (Avatar + Form) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
          {t('settings.profile_info')}
        </h2>
        <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-md shadow-sm px-6 py-4 transition-colors">

          {/* Avatar Management Area */}
          <div className="py-6 flex flex-col items-center gap-4 border-b border-hairline dark:border-divider-dark">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full overflow-hidden bg-surface-bone dark:bg-surface-dark border-4 border-surface-card dark:border-surface-dark ring-2 ring-hairline dark:ring-divider-dark shadow-sm">
                {profileData.avatarUrl && !avatarBroken ? (
                  <img src={profileData.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" onError={() => setAvatarBroken(true)} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary text-white font-extrabold text-3xl select-none">
                    {profileData.name ? profileData.name.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                id="avatar-file-input"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              {/* Camera Hover Overlay */}
              <label
                htmlFor="avatar-file-input"
                className={`absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold gap-1 ${avatarUploading ? 'pointer-events-none' : 'cursor-pointer'}`}
              >
                {avatarUploading ? (
                  <Loader2 size={20} className="text-white/90 animate-spin" />
                ) : (
                  <Camera size={20} className="text-white/90" />
                )}
                <span className="text-white/90">{avatarUploading ? t('common.loading') : t('settings.upload_image')}</span>
              </label>
            </div>

            {/* Avatar status message */}
            {avatarMsg && (
              <p className={`text-xs font-semibold ${avatarMsg.startsWith('✅') ? 'text-emerald-600 dark:text-emerald-400' : avatarMsg.startsWith('❌') ? 'text-red-500' : 'text-mute'}`}>
                {avatarMsg}
              </p>
            )}

            {/* Quick Predefined Avatar Selector Gallery */}
            <div className="space-y-2.5 text-center w-full max-w-sm">
              <span className="text-[10px] font-black text-mute dark:text-on-dark-mute uppercase tracking-wider block">
                {t('settings.avatar')}
              </span>
              <div className="flex justify-center gap-2 flex-wrap">
                {predefinedAvatarSeeds.map((seed) => {
                  const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                  const isSelected = profileData.avatarUrl === url;
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setProfileData((prev) => ({ ...prev, avatarUrl: url }))}
                      className={`h-9 w-9 rounded-full overflow-hidden bg-white border-2 hover:scale-105 active:scale-95 transition-all cursor-pointer relative select-none ${isSelected ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-hairline dark:border-divider-dark'
                        }`}
                    >
                      <img src={url} alt={`Avatar ${seed}`} className="h-full w-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-white">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Text Profile Form */}
          <form onSubmit={handleProfileSubmit} className="divide-y divide-hairline dark:divide-divider-dark mt-4">
            <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-sm font-semibold text-ink dark:text-on-dark">{t('settings.display_name')}</span>
              <div className="w-full sm:max-w-md">
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                />
              </div>
            </div>

            <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-sm font-semibold text-ink dark:text-on-dark">{t('settings.age')}</span>
              <div className="w-full sm:max-w-md">
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                />
              </div>
            </div>

            <div className="py-4 flex items-center justify-between gap-4">
              {profileMsg ? (
                <span className={`text-xs font-semibold ${profileMsg.includes('thành công') || profileMsg.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                  {profileMsg}
                </span>
              ) : <div />}
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-sm font-bold rounded-full transition-all cursor-pointer hover:shadow active:scale-[0.98]"
              >
                {isLoading ? t('common.saving') : t('settings.save_profile')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Section 4: Mật khẩu (LOCAL accounts only) */}
      {user?.authProvider === 'LOCAL' ? (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-mute dark:text-on-dark-mute uppercase tracking-wider">
            {t('settings.password_section')}
          </h2>
          <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-md shadow-sm px-6 py-2 transition-colors">
            <form onSubmit={handlePasswordSubmit} className="divide-y divide-hairline dark:divide-divider-dark">
              <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span className="text-sm font-semibold text-ink dark:text-on-dark">{t('settings.new_password')}</span>
                <div className="w-full sm:max-w-md">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                  />
                </div>
              </div>

              <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span className="text-sm font-semibold text-ink dark:text-on-dark">{t('settings.confirm_password')}</span>
                <div className="w-full sm:max-w-md">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-ink dark:text-on-dark"
                  />
                </div>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                {passwordMsg ? (
                  <span className={`text-xs font-semibold ${passwordMsg.includes('thành công') || passwordMsg.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                    {passwordMsg}
                  </span>
                ) : <div />}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-deep disabled:bg-stone text-white text-sm font-bold rounded-full transition-all cursor-pointer hover:shadow active:scale-[0.98]"
                >
                  {isLoading ? t('common.saving') : t('settings.change_password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Alert user that they log in via Google and security is managed by Google */
        <div className="rounded-md bg-surface-bone dark:bg-surface-dark/40 border border-hairline dark:border-divider-dark p-5 flex items-start gap-4">
          <ShieldAlert className="text-primary shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-ink dark:text-on-dark font-display tracking-tight">Đăng nhập thông qua Google</h4>
            <p className="text-xs text-body dark:text-on-dark-mute mt-1 leading-relaxed">
              Tài khoản này được xác thực và bảo mật thông qua Google. Mật khẩu và tuỳ chọn bảo mật liên quan được quản lý trực tiếp bởi nhà cung cấp tài khoản Google của bạn.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
