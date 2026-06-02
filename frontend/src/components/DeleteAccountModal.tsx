import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { api } from '../services/api';

const CONFIRMATION_PHRASE = 'EXCLUIR';

type DeleteAccountModalProps = {
  userType: 'personal' | 'student';
  userEmail?: string;
  onClose: () => void;
  onDeleted: () => void;
};

type Step = 1 | 2 | 3 | 4;

export function DeleteAccountModal({
  userType,
  userEmail,
  onClose,
  onDeleted,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [phrase, setPhrase] = useState('');
  const [secret, setSecret] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isPersonal = userType === 'personal';
  const phraseOk = phrase.trim().toUpperCase() === CONFIRMATION_PHRASE;
  const secretOk = secret.trim().length >= (isPersonal ? 1 : 5);
  const canSubmit = phraseOk && secretOk && acknowledged && !deleting;

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      const endpoint = isPersonal ? '/personal/me/account' : '/students/me/account';
      const body = isPersonal
        ? { password: secret, confirmation: CONFIRMATION_PHRASE }
        : { accessCode: secret.trim().toUpperCase(), confirmation: CONFIRMATION_PHRASE };

      await api.delete(endpoint, { data: body });
      onDeleted();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Não foi possível excluir a conta. Tente novamente.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-strong max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
        role="dialog"
        aria-labelledby="delete-account-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-5 border-b border-dark-100">
          <h3 id="delete-account-title" className="text-lg font-display font-bold text-dark-900">
            Excluir conta
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="p-2 rounded-lg text-dark-500 hover:bg-dark-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs text-dark-500">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`flex-1 h-1 rounded-full ${step >= n ? 'bg-red-500' : 'bg-dark-200'}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </p>
          )}

          {step === 1 && (
            <>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <p className="text-dark-700 text-sm text-center">
                Esta ação é <strong>permanente e irreversível</strong>.
              </p>
              <ul className="text-sm text-dark-600 space-y-2 list-disc pl-5">
                {isPersonal ? (
                  <>
                    <li>Sua conta de personal trainer será removida</li>
                    <li>Todos os seus alunos serão excluídos</li>
                    <li>Fichas de treino, mensagens e históricos serão apagados</li>
                  </>
                ) : (
                  <>
                    <li>Seu perfil de aluno será removido</li>
                    <li>Seu histórico de treinos e evolução será apagado</li>
                    <li>Você precisará de um novo cadastro para voltar a usar o app</li>
                  </>
                )}
              </ul>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-700 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-dark-700 text-sm">
                Para confirmar, digite <strong className="text-red-600">{CONFIRMATION_PHRASE}</strong> no campo
                abaixo:
              </p>
              <input
                type="text"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                autoComplete="off"
                className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900 uppercase tracking-wider text-center font-semibold"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-700 font-medium text-sm"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!phraseOk}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-dark-700 text-sm">
                {isPersonal
                  ? 'Digite sua senha para confirmar sua identidade:'
                  : 'Digite seu código de acesso (5 caracteres):'}
              </p>
              {isPersonal && userEmail && (
                <p className="text-xs text-dark-500">Conta: {userEmail}</p>
              )}
              <input
                type={isPersonal ? 'password' : 'text'}
                value={secret}
                onChange={(e) =>
                  setSecret(isPersonal ? e.target.value : e.target.value.toUpperCase())
                }
                placeholder={isPersonal ? 'Sua senha' : 'Ex: A1234'}
                maxLength={isPersonal ? undefined : 5}
                autoComplete={isPersonal ? 'current-password' : 'off'}
                className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-700 font-medium text-sm"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!secretOk}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 rounded border-dark-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-dark-700">
                  Entendo que todos os meus dados serão apagados permanentemente e não poderei recuperar
                  esta conta.
                </span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-dark-200 text-dark-700 font-medium text-sm"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Excluir permanentemente'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
