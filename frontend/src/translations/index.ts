'use client';

import { useMemo } from 'react';
import { usePreferences } from '@/store';
import { EN_DICTIONARY, type TranslationKey } from './en';
import { SI_DICTIONARY } from './si';
import { TA_DICTIONARY } from './ta';
import type { LanguageCode } from './types';

export * from './types';
export * from './en';
export * from './si';
export * from './ta';

export function getLanguageCode(language?: string): LanguageCode {
  if (!language) return 'en';
  const lower = language.toLowerCase();
  if (lower.includes('sinhala') || lower === 'si') return 'si';
  if (lower.includes('tamil') || lower === 'ta') return 'ta';
  return 'en';
}

export function getLocale(language?: string): string {
  if (!language) return 'en-US';
  const lower = language.toLowerCase();
  if (lower.includes('sinhala') || lower === 'si') return 'si-LK';
  if (lower.includes('tamil') || lower === 'ta') return 'ta-LK';
  if (lower.includes('uk')) return 'en-GB';
  return 'en-US';
}

function findCaseInsensitive(dict: Record<string, string>, target: string): string | undefined {
  const lower = target.toLowerCase();
  for (const [k, v] of Object.entries(dict)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

export function translate(
  key: string,
  language?: string,
  params?: Record<string, string | number>
): string {
  if (!key) return '';
  const langCode = getLanguageCode(language);
  const trimmed = key.trim();

  let translation: string | undefined;

  if (langCode === 'si') {
    translation =
      SI_DICTIONARY[trimmed as TranslationKey] ??
      findCaseInsensitive(SI_DICTIONARY as Record<string, string>, trimmed);
  } else if (langCode === 'ta') {
    translation =
      TA_DICTIONARY[trimmed as TranslationKey] ??
      findCaseInsensitive(TA_DICTIONARY as Record<string, string>, trimmed);
  }

  // Untranslated keys fall back to English dictionary, then original key
  if (!translation) {
    translation =
      EN_DICTIONARY[trimmed as TranslationKey] ??
      findCaseInsensitive(EN_DICTIONARY as Record<string, string>, trimmed) ??
      trimmed;
  }

  // Preserve leading and trailing whitespace
  const leading = key.match(/^\s*/)?.[0] || '';
  const trailing = key.match(/\s*$/)?.[0] || '';
  let finalResult = `${leading}${translation}${trailing}`;

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      finalResult = finalResult.replaceAll(`{${pKey}}`, String(pVal));
    }
  }

  return finalResult;
}

export function formatNumber(
  value: number,
  language?: string,
  options?: Intl.NumberFormatOptions
): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  value: Date | string | undefined,
  language?: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  const locale = getLocale(language);
  return d.toLocaleDateString(locale, options);
}

export function formatTime(
  value: Date | string | undefined,
  language?: string,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  const locale = getLocale(language);
  return d.toLocaleTimeString(locale, options);
}

export interface TranslationHook {
  (key: string, params?: Record<string, string | number>): string;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | string | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: Date | string | undefined, options?: Intl.DateTimeFormatOptions) => string;
  language: string;
  locale: string;
}

export function useT(): TranslationHook {
  const preferences = usePreferences();
  const language = preferences.language || 'English (US)';

  // Built once per language, so `t` and the formatters keep their identity between renders.
  return useMemo<TranslationHook>(() => {
    const t = (key: string, params?: Record<string, string | number>) => translate(key, language, params);
    return Object.assign(t, {
      t,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, language, options),
      formatDate: (value: Date | string | undefined, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, language, options),
      formatTime: (value: Date | string | undefined, options?: Intl.DateTimeFormatOptions) =>
        formatTime(value, language, options),
      language,
      locale: getLocale(language),
    });
  }, [language]);
}
