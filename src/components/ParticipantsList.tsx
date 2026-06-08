import { Gem } from "lucide-react";
import type { Participant } from "@/lib/diamonds";

function timeAgo(from: number, now: number): string {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  if (s < 10) return "agora mesmo";
  if (s < 60) return `há ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "há 1 dia";
  return `há ${d} dias`;
}

export default function ParticipantsList({
  participants,
  now,
}: {
  participants: Participant[];
  now: number;
}) {
  return (
    <section className="mx-auto mt-16 max-w-3xl px-6">
      <div className="mb-5 text-center">
        <h3 className="font-editorial text-2xl sm:text-3xl tracking-tight text-foreground">
          Quem já girou
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {participants.length}{" "}
          {participants.length === 1 ? "participante" : "participantes"}
        </p>
      </div>

      {participants.length === 0 ? (
        <p className="rounded-2xl border border-border/60 bg-background/40 py-10 text-center text-sm text-muted-foreground">
          Ninguém girou ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm">
          {/* header */}
          <div className="hidden grid-cols-[1.4fr_1.2fr_1fr_0.9fr] gap-2 border-b border-border/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <span>Nome</span>
            <span>@TikTok</span>
            <span>Prêmio</span>
            <span className="text-right">Participou</span>
          </div>

          <ul className="divide-y divide-border/40">
            {participants.map((p, i) => (
              <li
                key={`${p.tiktok}-${p.createdAt}-${i}`}
                className="grid grid-cols-2 gap-x-2 gap-y-1 px-5 py-3 text-sm sm:grid-cols-[1.4fr_1.2fr_1fr_0.9fr] sm:items-center sm:gap-2"
              >
                <span className="truncate font-semibold text-foreground">{p.nome}</span>
                <span className="truncate text-muted-foreground">{p.tiktok}</span>
                <span className="flex items-center gap-1.5 font-semibold text-primary">
                  <Gem className="h-3.5 w-3.5 shrink-0" />
                  {p.prize}
                </span>
                <span className="text-right text-xs text-muted-foreground sm:text-sm">
                  {timeAgo(p.createdAt, now)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
