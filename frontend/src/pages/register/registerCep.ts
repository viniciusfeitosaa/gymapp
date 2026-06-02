export const formatCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

export const fetchAddressByCep = async (
  cep: string
): Promise<{ logradouro?: string; bairro?: string } | null> => {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return { logradouro: data.logradouro || '', bairro: data.bairro || '' };
  } catch {
    return null;
  }
};
