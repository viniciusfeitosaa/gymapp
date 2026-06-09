import { useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { StudentBrandPersonal } from '../components/StudentBrandMark';
import { brandThemeToCssVars, resolveBrandTheme, type BrandTheme } from '../lib/brandTheme';

type PersonalTrainerFromApi = StudentBrandPersonal & { id?: string; phone?: string };

/** Sincroniza logo/nome/cores do personal e expõe dados de marca para a visão do aluno. */
export function useStudentBrand() {
  const { user, userType, updateUser } = useAuth();

  const personal: StudentBrandPersonal | null = useMemo(() => {
    if (!user?.personalTrainer?.name) return null;
    return {
      name: user.personalTrainer.name,
      logoUrl: user.personalTrainer.logoUrl,
      brandPrimaryColor: user.personalTrainer.brandPrimaryColor,
      brandSecondaryColor: user.personalTrainer.brandSecondaryColor,
    };
  }, [user?.personalTrainer]);

  const theme: BrandTheme = useMemo(
    () => resolveBrandTheme(personal?.brandPrimaryColor, personal?.brandSecondaryColor),
    [personal?.brandPrimaryColor, personal?.brandSecondaryColor]
  );

  const themeStyle = useMemo(() => brandThemeToCssVars(theme), [theme]);

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
          const cur = user?.personalTrainer;
          const changed =
            cur?.name !== pt.name ||
            cur?.logoUrl !== (pt.logoUrl ?? undefined) ||
            cur?.brandPrimaryColor !== (pt.brandPrimaryColor ?? undefined) ||
            cur?.brandSecondaryColor !== (pt.brandSecondaryColor ?? undefined);
          if (changed) {
            updateUser({
              personalTrainer: {
                id: pt.id ?? cur?.id ?? '',
                name: pt.name,
                phone: pt.phone ?? cur?.phone,
                logoUrl: pt.logoUrl,
                brandPrimaryColor: pt.brandPrimaryColor,
                brandSecondaryColor: pt.brandSecondaryColor,
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

  return {
    personal,
    theme,
    themeStyle,
    brandName: personal?.name ?? 'Meu Personal',
  };
}
