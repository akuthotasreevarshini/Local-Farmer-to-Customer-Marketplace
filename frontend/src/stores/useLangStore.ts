import { create } from 'zustand';

export type SupportedLanguage = 'en' | 'te';

const STORAGE_KEY = 'farmconnect_lang';

function getInitialLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'te') return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing in some browsers)
  }
  return 'en';
}

interface LangState {
  language: SupportedLanguage;

  setLanguage: (language: SupportedLanguage) => void;
}

export const useLangStore = create<LangState>()((set) => ({
  language: getInitialLanguage(),

  setLanguage: (language) => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // fall back to session-only if localStorage is unavailable
    }
    set({ language });
  },
}));
