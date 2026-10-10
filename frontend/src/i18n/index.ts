import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import te from './te.json';
import hi from './hi.json';

const STORAGE_KEY = 'farmconnect_lang';

function getInitialLang(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'te' || v === 'hi') return v;
  } catch { /* private mode */ }
  return 'en';
}

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      te: { translation: te },
      hi: { translation: hi },
    },
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export function setAppLanguage(lang: string) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  void i18next.changeLanguage(lang);
}

export default i18next;
