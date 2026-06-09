/** Ex.: "Vinicius Alves Feitosa" → "Vinicius Alves Personal" */
export function formatPersonalBrandName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Meu Personal';
  if (parts.length === 1) return `${parts[0]} Personal`;
  return `${parts[0]} ${parts[1]} Personal`;
}
