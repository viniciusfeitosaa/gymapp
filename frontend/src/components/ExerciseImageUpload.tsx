import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { resizeImageFile } from '../lib/resizeImageFile';
import { resolveAssetUrl } from '../lib/resolveAssetUrl';

type Props = {
  imageUrl?: string;
  onChange: (url: string) => void;
};

export function ExerciseImageUpload({ imageUrl, onChange }: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const previewSrc = resolveAssetUrl(imageUrl) || imageUrl || null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setError(t('personal.exercise.imageInvalidType'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError(t('personal.exercise.imageTooLarge'));
      return;
    }

    setUploading(true);
    try {
      const image = await resizeImageFile(file, 800, 0.82);
      const res = await api.post<{ imageUrl: string }>('/workouts/exercise-image', { image });
      onChange(res.data.imageUrl);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(
        apiErr.response?.data?.error ||
          (err instanceof Error ? err.message : t('personal.exercise.imageUploadError'))
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openPicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setError('');
    onChange('');
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-dark-700 mb-2">
        {t('personal.exercise.imagePhoto')}
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="shrink-0 mx-auto sm:mx-0">
          <div className="w-full sm:w-36 h-28 rounded-xl border-2 border-dashed border-dark-200 bg-dark-50 flex items-center justify-center overflow-hidden">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={t('personal.exercise.imagePhoto')}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImagePlus className="w-8 h-8 text-dark-300" />
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={openPicker}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-accent text-white text-sm font-semibold shadow-medium hover:opacity-95 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {previewSrc ? t('personal.exercise.changeImage') : t('personal.exercise.chooseImage')}
          </button>
          {previewSrc && (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemove}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {t('personal.exercise.removeImage')}
            </button>
          )}
          <p className="text-xs text-dark-500">{t('personal.exercise.imageHint')}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
