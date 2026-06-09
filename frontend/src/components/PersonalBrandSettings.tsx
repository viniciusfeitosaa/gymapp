import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Loader2, Palette, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import {
  BRAND_PRESETS,
  DEFAULT_BRAND_THEME,
  isValidHexColor,
  resolveBrandTheme,
  type BrandTheme,
} from '../lib/brandTheme';
import { StudentViewPreview } from './StudentViewPreview';
import type { User } from '../types';

type Props = {
  user: User | null;
  onUpdated: (data: Partial<User>) => void;
};

export function PersonalBrandSettings({ user, onUpdated }: Props) {
  const { t } = useTranslation();
  const savedTheme = resolveBrandTheme(user?.brandPrimaryColor, user?.brandSecondaryColor);
  const [primary, setPrimary] = useState(savedTheme.primary);
  const [secondary, setSecondary] = useState(savedTheme.secondary);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const theme = resolveBrandTheme(user?.brandPrimaryColor, user?.brandSecondaryColor);
    setPrimary(theme.primary);
    setSecondary(theme.secondary);
  }, [user?.brandPrimaryColor, user?.brandSecondaryColor]);

  const draftTheme: BrandTheme = { primary, secondary };
  const isDirty =
    primary !== savedTheme.primary || secondary !== savedTheme.secondary;

  const handleSave = async () => {
    setError('');
    if (!isValidHexColor(primary) || !isValidHexColor(secondary)) {
      setError(t('personal.brand.invalidHex'));
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch<User>('/personal/me/brand', {
        brandPrimaryColor: primary,
        brandSecondaryColor: secondary,
      });
      onUpdated(res.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || t('personal.brand.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await api.patch<User>('/personal/me/brand', {
        brandPrimaryColor: null,
        brandSecondaryColor: null,
      });
      onUpdated(res.data);
      setPrimary(DEFAULT_BRAND_THEME.primary);
      setSecondary(DEFAULT_BRAND_THEME.secondary);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || t('personal.brand.resetError'));
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: (typeof BRAND_PRESETS)[number]) => {
    setPrimary(preset.primary);
    setSecondary(preset.secondary);
  };

  return (
    <>
      <div className="rounded-xl border border-dark-100 bg-dark-50/40 p-4 md:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <h4 className="text-base font-display font-bold text-dark-900">{t('personal.brand.title')}</h4>
            <p className="text-sm text-dark-500 mt-0.5">{t('personal.brand.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-sm font-medium text-dark-700 mb-1.5 block">{t('personal.brand.primaryColor')}</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="w-12 h-12 rounded-lg border border-dark-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 rounded-lg border border-dark-200 px-3 py-2 text-sm font-mono uppercase"
                maxLength={7}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-dark-700 mb-1.5 block">{t('personal.brand.secondaryColor')}</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="w-12 h-12 rounded-lg border border-dark-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="flex-1 rounded-lg border border-dark-200 px-3 py-2 text-sm font-mono uppercase"
                maxLength={7}
              />
            </div>
          </label>
        </div>

        <div
          className="h-10 rounded-xl mb-4 shadow-soft"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
          aria-hidden
        />

        <p className="text-xs text-dark-500 mb-2">{t('personal.brand.suggestedPalettes')}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {BRAND_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-dark-200 bg-white text-xs font-medium text-dark-700 hover:border-dark-300"
            >
              <span
                className="w-4 h-4 rounded-full border border-dark-100"
                style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
              />
              {t(`personal.brand.presets.${preset.id}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 bg-white text-dark-800 text-sm font-semibold hover:bg-dark-50"
          >
            <Eye className="w-4 h-4" />
            {t('personal.brand.previewStudent')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-accent text-white text-sm font-semibold shadow-medium hover:opacity-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t('personal.brand.saveColors')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 text-dark-600 text-sm font-semibold hover:bg-dark-50 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {t('personal.brand.resetDefault')}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {showPreview && user?.name && (
        <StudentViewPreview
          personalName={user.name}
          logoUrl={user.logoUrl}
          theme={draftTheme}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
