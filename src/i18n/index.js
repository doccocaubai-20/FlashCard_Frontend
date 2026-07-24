import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';
import en from './locales/en.json';

const savedUser = localStorage.getItem('user');
let initialLang = 'vi';
try {
  if (savedUser) {
    const parsed = JSON.parse(savedUser);
    if (parsed && parsed.nativeLanguage) {
      initialLang = parsed.nativeLanguage === 'en' ? 'en' : 'vi';
    }
  }
} catch (e) {
  console.error('Failed to parse user language:', e);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React handles escaping
    },
  });

export default i18n;
