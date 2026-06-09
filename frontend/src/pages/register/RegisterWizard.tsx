import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import RegisterWizardShell from './RegisterWizardShell';
import {
  createInitialFormData,
  progressIndex,
  type RegisterFormData,
  type RegisterStep,
} from './registerTypes';
import { validateAccess, validateIdentity } from './registerValidation';
import { fetchAddressByCep } from './registerCep';
import WelcomeStep from './steps/WelcomeStep';
import IdentityStep from './steps/IdentityStep';
import AccessStep from './steps/AccessStep';
import AddressStep from './steps/AddressStep';
import CelebrationStep from './steps/CelebrationStep';

const STEP_ORDER: RegisterStep[] = ['welcome', 'identity', 'access', 'address', 'celebration'];

function prevStep(step: RegisterStep): RegisterStep {
  const i = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.max(i - 1, 0)];
}

export default function RegisterWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<RegisterStep>('welcome');
  const [formData, setFormData] = useState<RegisterFormData>(createInitialFormData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [slideDir, setSlideDir] = useState<'forward' | 'back'>('forward');

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animClass = reducedMotion
    ? ''
    : slideDir === 'forward'
      ? 'animate-register-slide-forward'
      : 'animate-register-slide-back';

  const goForward = useCallback((next: RegisterStep) => {
    setSlideDir('forward');
    setStep(next);
  }, []);

  const goBack = useCallback(() => {
    setError('');
    setSlideDir('back');
    setStep((s) => prevStep(s));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCepBlur = async () => {
    const digits = formData.postalCode.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await fetchAddressByCep(digits);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro ?? prev.address,
          province: data.bairro ?? prev.province,
        }));
      }
    } finally {
      setCepLoading(false);
    }
  };

  const submitRegistration = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/personal/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        cref: formData.cref || undefined,
        address: formData.address.trim() || undefined,
        addressNumber: formData.addressNumber.trim() || undefined,
        complement: formData.complement.trim() || undefined,
        province: formData.province.trim() || undefined,
        postalCode: formData.postalCode.replace(/\D/g, '') || undefined,
      });
      goForward('celebration');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        t('register.errorDefault');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimary = () => {
    setError('');

    if (step === 'welcome') {
      goForward('identity');
      return;
    }

    if (step === 'identity') {
      const err = validateIdentity(formData);
      if (err) {
        setError(err);
        return;
      }
      goForward('access');
      return;
    }

    if (step === 'access') {
      const err = validateAccess(formData);
      if (err) {
        setError(err);
        return;
      }
      goForward('address');
      return;
    }

    if (step === 'address') {
      void submitRegistration();
      return;
    }

    if (step === 'celebration') {
      navigate('/login');
    }
  };

  const primaryLabel =
    step === 'welcome'
      ? t('register.start')
      : step === 'address'
        ? t('register.createAccount')
        : step === 'celebration'
          ? t('register.enterApp')
          : t('register.continue');

  const showBack = step !== 'welcome' && step !== 'celebration';
  const showLoginLink = step !== 'welcome' && step !== 'celebration';

  let stepContent: React.ReactNode;
  switch (step) {
    case 'welcome':
      stepContent = <WelcomeStep />;
      break;
    case 'identity':
      stepContent = <IdentityStep formData={formData} onChange={handleChange} />;
      break;
    case 'access':
      stepContent = <AccessStep formData={formData} onChange={handleChange} />;
      break;
    case 'address':
      stepContent = (
        <AddressStep
          formData={formData}
          onChange={handleChange}
          onPostalCodeChange={(digits) =>
            setFormData((prev) => ({ ...prev, postalCode: digits }))
          }
          onCepBlur={handleCepBlur}
          cepLoading={cepLoading}
        />
      );
      break;
    case 'celebration':
      stepContent = <CelebrationStep name={formData.name} />;
      break;
    default:
      stepContent = null;
  }

  return (
    <RegisterWizardShell
      step={step}
      progress={progressIndex(step)}
      error={error}
      loading={loading}
      primaryLabel={primaryLabel}
      showBack={showBack}
      showLoginLink={showLoginLink}
      onBack={goBack}
      onPrimary={handlePrimary}
      animClass={animClass}
    >
      {stepContent}
    </RegisterWizardShell>
  );
}
