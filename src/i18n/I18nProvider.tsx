import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import type { LanguagePreference } from '../types/lockfit';
import { localeByLanguage, resolveLanguage } from './locale';
import { translations, type SupportedLanguage, type TranslationKey } from './translations';

type Parameters = Record<string, string | number>;

type I18nContextValue = {
  language: SupportedLanguage;
  locale: string;
  t: (key: TranslationKey, parameters?: Parameters) => string;
  formatNumber: (value: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, preference }: PropsWithChildren<{ preference: LanguagePreference }>) {
  const value = useMemo<I18nContextValue>(() => {
    const language = resolveLanguage(preference);
    const locale = localeByLanguage[language];
    const t = (key: TranslationKey, parameters: Parameters = {}) => {
      const template = translations[language][key] ?? translations.en[key] ?? key;
      return Object.entries(parameters).reduce(
        (result, [name, parameter]) => result.replaceAll(`{${name}}`, String(parameter)),
        template,
      );
    };
    return { language, locale, t, formatNumber: (value) => value.toLocaleString(locale) };
  }, [preference]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
