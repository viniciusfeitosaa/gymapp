/** Indica se já passou o dia de pagamento no mês atual (apenas referência visual). */
export function isPaymentLikelyOverdue(paymentDueDay?: number | null): boolean {
  if (paymentDueDay == null || paymentDueDay < 1 || paymentDueDay > 31) return false;
  return new Date().getDate() > paymentDueDay;
}

export function formatPaymentDueDay(paymentDueDay?: number | null): string | null {
  if (paymentDueDay == null || paymentDueDay < 1 || paymentDueDay > 31) return null;
  return `Dia ${paymentDueDay}`;
}
