import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gem, Sparkles } from "lucide-react";
import type { Participant } from "@/lib/diamonds";

export default function WinModal({
  open,
  onOpenChange,
  entry,
  onRedeem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: Participant | null;
  onRedeem: () => void;
}) {
  if (!entry) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border-primary/30 bg-background/95 p-0 backdrop-blur-2xl shadow-neon">
        <div className="relative px-8 py-10 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-60"
               style={{ background: "radial-gradient(circle at 50% 30%, oklch(0.78 0.25 355 / 0.4), transparent 70%)" }} />

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon shadow-neon animate-pulse-glow">
            <Gem className="h-7 w-7 text-primary-foreground" />
          </div>

          <p className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            <Sparkles className="h-3 w-3" /> Você ganhou <Sparkles className="h-3 w-3" />
          </p>

          <h2 className="font-editorial text-5xl sm:text-6xl leading-[1.05] tracking-tight text-foreground">
            {entry.diamonds.toLocaleString("pt-BR")}
          </h2>
          <p className="mt-1 text-lg font-semibold uppercase tracking-[0.3em] text-primary">
            Diamantes
          </p>

          <div className="mx-auto my-6 h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <p className="mb-6 text-sm text-muted-foreground">
            Parabéns, <span className="font-semibold text-foreground">{entry.nome}</span>! Toque abaixo
            para enviar seus dados à equipe Irmãos Berti pelo WhatsApp e resgatar seus Diamantes.
          </p>

          <Button
            onClick={onRedeem}
            className="h-12 w-full rounded-xl bg-gradient-neon text-base font-bold tracking-wider text-primary-foreground shadow-neon hover:opacity-95"
          >
            ENVIAR NO WHATSAPP E RESGATAR
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="mt-3 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
