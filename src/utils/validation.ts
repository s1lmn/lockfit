import type { BlockedApp, LanguagePreference, ThemeName } from '../types/lockfit';

const packageNamePattern = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supportedLanguages = new Set<LanguagePreference>([
  'system', 'en', 'ru', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'hi', 'ar',
]);

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !emailPattern.test(email)) {
    throw new Error('Введи корректный адрес электронной почты.');
  }
  return email;
}

export function validatePassword(value: string): string {
  if (value.length < 8) {
    throw new Error('Пароль должен содержать не меньше 8 символов.');
  }
  if (value.length > 128) {
    throw new Error('Пароль не должен быть длиннее 128 символов.');
  }
  return value;
}

export function normalizeNickname(value: string): string {
  const nickname = value.trim().replace(/\s+/g, ' ');
  if (nickname.length < 2 || nickname.length > 32) {
    throw new Error('Никнейм должен содержать от 2 до 32 символов.');
  }
  return nickname;
}

export function isValidPackageName(value: string): boolean {
  return value.length <= 255 && packageNamePattern.test(value);
}

export function normalizeBlockedApps(apps: BlockedApp[]): BlockedApp[] {
  const unique = new Map<string, BlockedApp>();
  for (const app of apps.slice(0, 100)) {
    if (!isValidPackageName(app.packageName)) continue;
    const appName = app.appName.trim().slice(0, 100) || app.packageName;
    unique.set(app.packageName, {
      packageName: app.packageName,
      appName,
      dailyLimitMinutes: coerceInteger(app.dailyLimitMinutes, 5, 1_440, 30),
    });
  }
  return [...unique.values()];
}

export function coerceInteger(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function normalizeTheme(value: unknown): ThemeName {
  return value === 'midnight' ? 'midnight' : 'sand';
}

export function normalizeLanguage(value: unknown): LanguagePreference {
  return typeof value === 'string' && supportedLanguages.has(value as LanguagePreference)
    ? (value as LanguagePreference)
    : 'system';
}
