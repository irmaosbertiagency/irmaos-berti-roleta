import { SLOTS, diamondsLabel, type Participant } from "./diamonds";

// ---------------------------------------------------------------------------
// Camada de dados da roleta.
//
// PRODUÇÃO (Netlify): fala direto com o Supabase pelo navegador.
//   - dedup + sorteio acontecem na função spin_roleta() do banco (à prova de
//     burla). Ver supabase/schema.sql.
//   - configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ver .env.example).
//
// DEV / PREVIEW: se o Supabase não estiver configurado, cai no backend local
//   baseado em arquivo (src/lib/participants.ts) para a tela continuar
//   funcionando enquanto você ainda não plugou o Supabase.
// ---------------------------------------------------------------------------

// Valores do Supabase. O ideal é vir das variáveis VITE_* (Netlify), mas
// mantemos os valores públicos do projeto como padrão para o site funcionar
// mesmo que as variáveis não sejam aplicadas no build.
// (URL e chave "anon" são públicas por design — ficam visíveis no front de
// qualquer forma; a escrita é protegida pela função spin_roleta no banco.)
const SUPA_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://qqvhwdnrfbzkfwejiunt.supabase.co";
const SUPA_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdmh3ZG5yZmJ6a2Z3ZWppdW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzgzOTgsImV4cCI6MjA5NjUxNDM5OH0.4r9bZKLPPbE2c046lj7-A2PAlVvQs1KIukp6x3_MJ-w";

export const supabaseConfigured = Boolean(SUPA_URL && SUPA_KEY);

export type SpinResult =
  | { ok: true; entry: Participant }
  | { ok: false; reason: "duplicate"; entry: Participant };

function supaHeaders(): Record<string, string> {
  return {
    apikey: SUPA_KEY as string,
    Authorization: `Bearer ${SUPA_KEY as string}`,
    "Content-Type": "application/json",
  };
}

// Normaliza qualquer linha vinda do Supabase para o tipo Participant do app.
// O rótulo do prêmio é sempre recomputado em JS para garantir formatação pt-BR
// consistente ("1.000 Diamantes"), independente do que veio do banco.
function rowToParticipant(r: Record<string, unknown>): Participant {
  const diamonds = Number(r.diamonds);
  const rawIdx = r.prize_index;
  const prizeIndex =
    typeof rawIdx === "number" && rawIdx >= 0 ? rawIdx : SLOTS.indexOf(diamonds);
  return {
    nome: String(r.nome ?? ""),
    tiktok: String(r.tiktok ?? ""),
    diamonds,
    prize: diamondsLabel(diamonds),
    prizeIndex,
    createdAt: r.created_at ? new Date(String(r.created_at)).getTime() : Date.now(),
  };
}

export async function spin(nome: string, tiktok: string): Promise<SpinResult> {
  if (supabaseConfigured) {
    const res = await fetch(`${SUPA_URL}/rest/v1/rpc/spin_roleta`, {
      method: "POST",
      headers: supaHeaders(),
      body: JSON.stringify({ p_nome: nome, p_tiktok: tiktok }),
    });
    if (!res.ok) {
      throw new Error(`Supabase spin_roleta ${res.status}: ${await res.text()}`);
    }
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    const row = Array.isArray(rows) ? rows[0] : (rows as Record<string, unknown>);
    const entry = rowToParticipant(row);
    if (row?.status === "duplicate") {
      return { ok: false, reason: "duplicate", entry };
    }
    return { ok: true, entry };
  }

  // ---- fallback de desenvolvimento ----
  if (import.meta.env.DEV) {
    const { registerParticipant } = await import("./participants");
    return (await registerParticipant({ data: { nome, tiktok } })) as SpinResult;
  }

  throw new Error(
    "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
  );
}

export async function listParticipants(): Promise<Participant[]> {
  if (supabaseConfigured) {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/participants?select=nome,tiktok,diamonds,prize,created_at&order=created_at.desc`,
      { headers: supaHeaders() },
    );
    if (!res.ok) {
      throw new Error(`Supabase list ${res.status}`);
    }
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map(rowToParticipant);
  }

  if (import.meta.env.DEV) {
    const { listParticipants: localList } = await import("./participants");
    return await localList();
  }

  return [];
}

export async function deleteParticipant(
  tiktok: string,
  password: string,
): Promise<void> {
  if (supabaseConfigured) {
    const res = await fetch(`${SUPA_URL}/rest/v1/rpc/admin_delete`, {
      method: "POST",
      headers: supaHeaders(),
      body: JSON.stringify({ p_password: password, p_tiktok: tiktok }),
    });
    if (!res.ok) {
      throw new Error(`admin_delete ${res.status}: ${await res.text()}`);
    }
    return;
  }
  if (import.meta.env.DEV) {
    const { deleteParticipant: localDel } = await import("./participants");
    await localDel({ data: { tiktok } });
  }
}

export async function clearAllParticipants(password: string): Promise<void> {
  if (supabaseConfigured) {
    const res = await fetch(`${SUPA_URL}/rest/v1/rpc/admin_clear_all`, {
      method: "POST",
      headers: supaHeaders(),
      body: JSON.stringify({ p_password: password }),
    });
    if (!res.ok) {
      throw new Error(`admin_clear_all ${res.status}: ${await res.text()}`);
    }
    return;
  }
  if (import.meta.env.DEV) {
    const { clearAllParticipants: localClear } = await import("./participants");
    await localClear();
  }
}
