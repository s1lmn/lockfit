import type { LanguagePreference } from '../types/lockfit';
import type { SupportedLanguage } from './translations';

export const localeByLanguage: Record<SupportedLanguage, string> = {
  en: 'en-US', ru: 'ru-RU', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR',
  zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', hi: 'hi-IN', ar: 'ar-SA',
};

const supported = new Set<SupportedLanguage>(Object.keys(localeByLanguage) as SupportedLanguage[]);

export function resolveLanguage(
  preference: LanguagePreference,
  deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale,
): SupportedLanguage {
  if (preference !== 'system') return preference;
  const deviceLanguage = deviceLocale.split(/[-_]/)[0]?.toLowerCase() as SupportedLanguage;
  return supported.has(deviceLanguage) ? deviceLanguage : 'en';
}
