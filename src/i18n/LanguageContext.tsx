import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const STORAGE_KEY = 'extension_user_language';

function getInitialLanguage(): Language {
  // Check localStorage if in browser mode
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {}

  // Auto-detect browser language
  const browserLang = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase();
  return browserLang.startsWith('pt') ? 'pt' : 'en';
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Load language from chrome.storage on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const saved = result[STORAGE_KEY];
        if (saved === 'pt' || saved === 'en') {
          setLanguageState(saved);
        }
      });

      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
        if (changes[STORAGE_KEY]) {
          const newLang = changes[STORAGE_KEY].newValue;
          if (newLang === 'pt' || newLang === 'en') {
            setLanguageState(newLang);
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: lang });
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = translations[language] || translations.pt;
      const val = (dict as Record<string, string>)[key];
      if (val !== undefined) return val;

      // Fallback to Portuguese if missing in English
      const ptVal = (translations.pt as Record<string, string>)[key];
      if (ptVal !== undefined) return ptVal;

      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useTranslation() {
  const { t, language, setLanguage } = useContext(LanguageContext);
  return { t, language, setLanguage };
}
