import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const WEEKDAY_VALUES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type WeekdayValue = (typeof WEEKDAY_VALUES)[number];

export function useWeekdayOptions(withShort = false) {
  const { t, i18n } = useTranslation();

  return useMemo(
    () =>
      WEEKDAY_VALUES.map((value) => ({
        value,
        label: t(`days.${value}`),
        ...(withShort ? { short: t(`days.${value}Short`) } : {}),
      })),
    [t, i18n.language, withShort]
  );
}

export function useWeekdayLabelMap() {
  const { t, i18n } = useTranslation();

  return useMemo(
    () =>
      Object.fromEntries(WEEKDAY_VALUES.map((value) => [value, t(`days.${value}`)])) as Record<
        WeekdayValue,
        string
      >,
    [t, i18n.language]
  );
}

export function useWeekdayShortMap() {
  const { t, i18n } = useTranslation();

  return useMemo(
    () =>
      Object.fromEntries(
        WEEKDAY_VALUES.map((value) => [value, t(`days.${value}Short`)])
      ) as Record<WeekdayValue, string>,
    [t, i18n.language]
  );
}
