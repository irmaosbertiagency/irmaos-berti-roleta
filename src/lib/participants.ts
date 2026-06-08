import { createServerFn } from "@tanstack/react-start";
import {
  SLOTS,
  diamondsLabel,
  normalizeTiktok,
  type Participant,
} from "./diamonds";

// ---------------------------------------------------------------------------
// Persistência server-side.
// Em `vite dev` o servidor roda em Node, então gravamos num arquivo JSON.
// Isso torna os registros globais (todos veem a mesma lista) e o limite de
// "1 participação por @" à prova de burla pelo lado do cliente.
//
// OBS p/ deploy em Cloudflare Workers: o filesystem não persiste lá — ao
// publicar, trocar readAll/writeAll por Cloudflare KV ou D1.
// ---------------------------------------------------------------------------

const DATA_DIR = ".data";
const DATA_FILE = ".data/participants.json";

async function readAll(): Promise<Participant[]> {
  try {
    const fs = await import("node:fs/promises");
    const buf = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(buf);
    return Array.isArray(parsed) ? (parsed as Participant[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(list: Participant[]): Promise<void> {
  const fs = await import("node:fs/promises");
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

export type RegisterResult =
  | { ok: true; entry: Participant }
  | { ok: false; reason: "duplicate"; entry: Participant };

export const registerParticipant = createServerFn({ method: "POST" })
  .validator((input: { nome: string; tiktok: string }) => {
    const nome = String(input?.nome ?? "").trim();
    const tiktok = normalizeTiktok(String(input?.tiktok ?? ""));
    if (nome.length < 2) throw new Error("Nome inválido");
    if (tiktok.length < 3) throw new Error("@ do TikTok inválido");
    return { nome, tiktok };
  })
  .handler(async ({ data }): Promise<RegisterResult> => {
    const list = await readAll();

    const existing = list.find((p) => p.tiktok === data.tiktok);
    if (existing) {
      return { ok: false, reason: "duplicate", entry: existing };
    }

    const prizeIndex = Math.floor(Math.random() * SLOTS.length);
    const diamonds = SLOTS[prizeIndex];
    const entry: Participant = {
      nome: data.nome,
      tiktok: data.tiktok,
      prizeIndex,
      diamonds,
      prize: diamondsLabel(diamonds),
      createdAt: Date.now(),
    };

    list.unshift(entry);
    await writeAll(list);
    return { ok: true, entry };
  });

export const listParticipants = createServerFn({ method: "GET" }).handler(
  async (): Promise<Participant[]> => {
    return await readAll();
  },
);
