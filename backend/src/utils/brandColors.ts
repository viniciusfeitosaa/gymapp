const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function normalizeBrandColor(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!HEX_COLOR.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

export function validateBrandColorField(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  const normalized = normalizeBrandColor(value);
  if (!normalized) {
    throw new Error(`${fieldName} deve ser um hex válido (ex.: #f97316).`);
  }
  return normalized;
}
