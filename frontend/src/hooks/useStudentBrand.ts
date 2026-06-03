import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { StudentBrandPersonal } from '../components/StudentBrandMark';

type PersonalTrainerFromApi = StudentBrandPersonal & { id?: string; phone?: string };

/** Sincroniza logo/nome do personal e expõe dados de marca para a visão do aluno. */
export function useStudentBrand() {
  const { user, userType, updateUser } = useAuth();

  const personal: StudentBrandPersonal | null =
    user?.personalTrainer?.name
      ? {
          name: user.personalTrainer.name,
          logoUrl: user.personalTrainer.logoUrl,
        }
      : null;

  useEffect(() => {
    if (userType !== 'student' || !user?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ student?: { personalTrainer?: PersonalTrainerFromApi } }>(
          '/students/me/profile'
        );
        const pt = res.data?.student?.personalTrainer;
        if (!cancelled && pt?.name) {
          const nextLogo = pt.logoUrl ?? undefined;
          const cur = user?.personalTrainer;
          if (cur?.name !== pt.name || cur?.logoUrl !== nextLogo) {
            updateUser({
              personalTrainer: {
                id: pt.id ?? cur?.id ?? '',
                name: pt.name,
                phone: pt.phone ?? cur?.phone,
                logoUrl: nextLogo,
              },
            });
          }
        }
      } catch {
        // mantém dados do login
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userType, user?.id]);

  useEffect(() => {
    if (userType !== 'student' || !personal?.name) return;
    document.title = `${personal.name} — Treinos`;
    return () => {
      document.title = 'Gym Code - Sistema para Personal Trainers';
    };
  }, [userType, personal?.name]);

  return { personal, brandName: personal?.name ?? 'Meu Personal' };
}
