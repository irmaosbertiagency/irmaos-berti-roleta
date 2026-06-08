// Distribuição da roleta — 10 fatias no total:
//   100 Diamantes (4x) · 200 Diamantes (3x) · 500 Diamantes (2x) · 1000 Diamantes (1x)
// Como cada fatia é um slot físico da roleta, sortear um índice uniforme (0..9)
// já reproduz exatamente essa probabilidade. As fatias são intercaladas para
// que prêmios iguais não fiquem todos colados.
export const SLOTS: number[] = [100, 200, 500, 100, 1000, 100, 200, 500, 100, 200];

export function diamondsLabel(amount: number): string {
  return `${amount.toLocaleString("pt-BR")} Diamantes`;
}

export type Participant = {
  nome: string;
  tiktok: string; // sempre normalizado começando com "@"
  prizeIndex: number;
  diamonds: number;
  prize: string; // ex.: "200 Diamantes"
  createdAt: number; // epoch em ms
};

export function normalizeTiktok(raw: string): string {
  const handle = raw.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase();
  return "@" + handle;
}
