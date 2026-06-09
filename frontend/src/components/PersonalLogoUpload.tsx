import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { resizeImageFile } from '../lib/resizeImageFile';
import { resolveAssetUrl } from '../lib/resolveAssetUrl';
import type { User } from '../types';

type Props = {
  user: User | null;
  onUpdated: (data: Partial<User>) => void;
};

export function PersonalLogoUpload({ user, onUpdated }: Props) {
  const { t } = useTranslation();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  const logoSrc = resolveAssetUrl(user?.logoUrl);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setError(t('personal.logo.invalidType'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError(t('personal.logo.tooLarge'));
      return;
    }

    setUploading(true);
    try {
      const logo = await resizeImageFile(file);
      const res = await api.post<User>('/personal/me/logo', { logo });
      onUpdated(res.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(
        apiErr.response?.data?.error ||
          (err instanceof Error ? err.message : t('personal.logo.uploadError'))
      );
    } finally {
      setUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setError('');
    setRemoving(true);
    try {
      const res = await api.delete<User>('/personal/me/logo');
      onUpdated(res.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || t('personal.logo.removeError'));
    } finally {
      setRemoving(false);
    }
  };

  const openGallery = () => {
    if (uploading || removing) return;
    galleryInputRef.current?.click();
  };

  return (
    <div className="rounded-xl border border-dark-100 bg-dark-50/40 p-4 md:p-5">
      <h4 className="text-base font-display font-bold text-dark-900 mb-1">{t('personal.logo.title')}</h4>
      <p className="text-sm text-dark-500 mb-4">{t('personal.logo.subtitle')}</p>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-dashed border-dark-200 bg-white flex items-center justify-center overflow-hidden shadow-soft">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={t('personal.logo.alt')}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-dark-300 gap-1">
                <Camera className="w-8 h-8" />
                <span className="text-[10px] font-medium">{t('personal.logo.empty')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading || removing}
            onClick={openGallery}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-accent text-white text-sm font-semibold shadow-medium hover:opacity-95 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            {logoSrc ? t('personal.logo.changeLogo') : t('personal.logo.chooseGallery')}
          </button>
          {logoSrc && (
            <button
              type="button"
              disabled={uploading || removing}
              onClick={handleRemove}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {t('personal.logo.removeLogo')}
            </button>
          )}
          <p className="text-xs text-dark-400">{t('personal.logo.iosHint')}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
