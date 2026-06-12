import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import PrizeWheel, { type Prize } from "@/components/PrizeWheel";
import LeadDialog, { type Lead, type SubmitResult } from "@/components/LeadDialog";
import WinModal from "@/components/WinModal";
import ParticipantsList from "@/components/ParticipantsList";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import bertiLogo from "@/assets/berti-logo.png";
import { SLOTS, diamondsLabel, type Participant } from "@/lib/diamonds";
import { spin, listParticipants } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Irmãos Berti — Gire a roleta e ganhe Diamantes no TikTok" },
      {
        name: "description",
        content:
          "Roleta premium da Irmãos Berti: gire e ganhe Diamantes. 1 participação por @ do TikTok.",
      },
    ],
  }),
});

// Roleta com 10 fatias de Diamantes (ver distribuição em src/lib/diamonds.ts).
const PRIZES: Prize[] = SLOTS.map((d) => ({
  label: diamondsLabel(d),
  rare: d >= 500,
}));

// WhatsApp da agência (número temporário de recebimento).
const AGENCY_WHATSAPP = "5515996711645";

function Index() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [winOpen, setWinOpen] = useState(false);
  const [wonEntry, setWonEntry] = useState<Participant | null>(null);
  const [done, setDone] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const reload = () => {
    listParticipants()
      .then(setParticipants)
      .catch(() => {});
  };

  useEffect(() => {
    reload();
    // mantém os tempos relativos vivos e busca novos registros
    const id = setInterval(() => {
      setNow(Date.now());
      reload();
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const handleSpinClick = () => {
    if (done || spinning) return;
    setLeadOpen(true);
  };

  const onLead = async (l: Lead): Promise<SubmitResult> => {
    const res = await spin(l.nome, l.tiktok);

    if (!res.ok) {
      return {
        ok: false,
        message: `Esse @ já girou a roleta e ganhou ${res.entry.prize}. Cada participante pode girar apenas uma vez.`,
      };
    }

    setLeadOpen(false);
    setWonEntry(res.entry);
    setTarget(res.entry.prizeIndex);
    setTimeout(() => setSpinning(true), 250);
    return { ok: true };
  };

  const onSpinEnd = () => {
    setSpinning(false);
    setDone(true);
    setTimeout(() => {
      setWinOpen(true);
      fireConfetti();
      reload();
    }, 400);
  };

  const fireConfetti = () => {
    const colors = ["#ff0080", "#ff66b3", "#ffffff", "#1a1a1a"];
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors });
    setTimeout(
      () => confetti({ particleCount: 80, spread: 100, angle: 60, origin: { x: 0, y: 0.6 }, colors }),
      250,
    );
    setTimeout(
      () => confetti({ particleCount: 80, spread: 100, angle: 120, origin: { x: 1, y: 0.6 }, colors }),
      400,
    );
  };

  const onRedeem = () => {
    if (!wonEntry) return;
    const dataHora = new Date(wonEntry.createdAt).toLocaleString("pt-BR");
    const msg = encodeURIComponent(
      `🎉 Nova participação na Roleta Irmãos Berti!\n\n` +
        `👤 Nome: ${wonEntry.nome}\n` +
        `🎵 TikTok: ${wonEntry.tiktok}\n` +
        `💎 Prêmio: ${wonEntry.prize}\n` +
        `🕒 Data: ${dataHora}`,
    );
    window.open(`https://wa.me/${AGENCY_WHATSAPP}?text=${msg}`, "_blank", "noopener");
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ambient particles */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-primary/60 animate-float"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 6) * 0.6}s`,
              filter: "blur(0.5px)",
              boxShadow: "0 0 10px oklch(0.66 0.31 358 / 0.8)",
            }}
          />
        ))}
      </div>

      {/* hero */}
      <section className="mx-auto max-w-5xl px-6 pt-10 text-center">
        <img
          src={bertiLogo}
          alt="Irmãos Berti"
          className="mx-auto h-16 sm:h-20 md:h-24 w-auto object-contain"
        />

        <h2 className="mx-auto mt-10 max-w-3xl font-editorial text-3xl sm:text-5xl md:text-6xl leading-[1.02] tracking-tight">
          Gire a roleta e ganhe <span className="text-primary">Diamantes</span> no TikTok
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm sm:text-base text-muted-foreground">
          100, 200, 500 ou 1000 Diamantes esperam por você. Cada creator pode girar uma única vez.
        </p>
      </section>

      {/* wheel */}
      <section className="relative mx-auto mt-12 max-w-3xl px-6 pb-8">
        <PrizeWheel
          prizes={PRIZES}
          spinning={spinning}
          targetIndex={target}
          onSpinClick={handleSpinClick}
          onSpinEnd={onSpinEnd}
          disabled={done}
        />
        <div className="mt-8 flex flex-col items-center gap-3">
          {!done && !spinning && (
            <Button
              onClick={() => setLeadOpen(true)}
              className="h-12 rounded-full bg-foreground px-8 text-sm font-bold uppercase tracking-[0.2em] text-background hover:opacity-90"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Quero girar agora
            </Button>
          )}
          {done && wonEntry && (
            <p className="text-center text-sm text-muted-foreground">
              Você ganhou{" "}
              <span className="font-semibold text-primary">{wonEntry.prize}</span> 🎉
            </p>
          )}
        </div>
      </section>

      {/* registros */}
      <ParticipantsList participants={participants} now={now} />

      <div className="pb-16" />

      <footer className="border-t border-border/60 py-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Irmãos Berti Agency ® 2026 — Todos os direitos reservados
        </p>
      </footer>

      <LeadDialog open={leadOpen} onOpenChange={setLeadOpen} onSubmit={onLead} />
      <WinModal open={winOpen} onOpenChange={setWinOpen} entry={wonEntry} onRedeem={onRedeem} />
    </main>
  );
}
