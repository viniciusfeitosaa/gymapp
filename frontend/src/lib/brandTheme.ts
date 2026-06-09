import type { CSSProperties } from 'react';

export type BrandTheme = {
  primary: string;
  secondary: string;
};

export const DEFAULT_BRAND_THEME: BrandTheme = {
  primary: '#f97316',
  secondary: '#ea580c',
};

export const BRAND_PRESETS: { id: string; label: string; primary: string; secondary: string }[] = [
  { id: 'orange', label: 'Laranja', primary: '#f97316', secondary: '#ea580c' },
  { id: 'blue', label: 'Azul', primary: '#2563eb', secondary: '#1d4ed8' },
  { id: 'green', label: 'Verde', primary: '#16a34a', secondary: '#15803d' },
  { id: 'purple', label: 'Roxo', primary: '#9333ea', secondary: '#7e22ce' },
  { id: 'red', label: 'Vermelho', primary: '#dc2626', secondary: '#b91c1c' },
  { id: 'teal', label: 'Turquesa', primary: '#0d9488', secondary: '#0f766e' },
];

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

export function resolveBrandTheme(
  primary?: string | null,
  secondary?: string | null
): BrandTheme {
  const p = primary?.trim();
  const s = secondary?.trim();
  if (p && s && isValidHexColor(p) && isValidHexColor(s)) {
    return { primary: p.toLowerCase(), secondary: s.toLowerCase() };
  }
  if (p && isValidHexColor(p)) {
    return { primary: p.toLowerCase(), secondary: DEFAULT_BRAND_THEME.secondary };
  }
  return { ...DEFAULT_BRAND_THEME };
}

export function brandThemeToCssVars(theme: BrandTheme): CSSProperties {
  return {
    '--student-brand-primary': theme.primary,
    '--student-brand-secondary': theme.secondary,
  } as CSSProperties;
}
