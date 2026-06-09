import { Trans, useTranslation } from 'react-i18next';
import { APPLE_STANDARD_EULA_URL, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../lib/legalUrls';

type Props = {
  className?: string;
};

export function SubscriptionLegalDisclosure({ className = '' }: Props) {
  const { t } = useTranslation();

  return (
    <div className={`text-xs text-dark-500 space-y-2 ${className}`}>
      <p>
        <Trans i18nKey="legal.disclosure" components={{ strong: <strong className="text-dark-700" /> }} />
      </p>
      <p>{t('legal.cancelHow')}</p>
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        <a
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 font-semibold hover:underline"
        >
          {t('legal.privacy')}
        </a>
        <span className="text-dark-300">·</span>
        <a
          href={TERMS_OF_USE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 font-semibold hover:underline"
        >
          {t('legal.terms')}
        </a>
        <span className="text-dark-300">·</span>
        <a
          href={APPLE_STANDARD_EULA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 font-semibold hover:underline"
        >
          {t('legal.eula')}
        </a>
      </p>
    </div>
  );
}
