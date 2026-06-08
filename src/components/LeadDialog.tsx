import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const schema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(80),
  tiktok: z.string().trim().min(2, "@ do TikTok inválido").max(40),
});

export type Lead = z.infer<typeof schema>;

export type SubmitResult = { ok: boolean; message?: string };

export default function LeadDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (lead: Lead) => Promise<SubmitResult | void> | SubmitResult | void;
}) {
  const [values, setValues] = useState<Lead>({ nome: "", tiktok: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Lead, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof Lead) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerError(null);
    setValues((v) => ({ ...v, [k]: e.target.value }));
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(values);
    if (!r.success) {
      const errs: Partial<Record<keyof Lead, string>> = {};
      for (const issue of r.error.issues) {
        errs[issue.path[0] as keyof Lead] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(r.data);
      if (res && !res.ok) {
        setServerError(res.message ?? "Não foi possível girar. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-primary/20 bg-background/95 backdrop-blur-xl shadow-neon">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-neon shadow-neon">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center font-editorial text-2xl">
            Antes de girar
          </DialogTitle>
          <DialogDescription className="text-center">
            Conte pra gente quem você é. Seus Diamantes te esperam do outro lado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="mt-2 space-y-3">
          {(
            [
              { k: "nome", label: "Nome completo", ph: "Como podemos te chamar?" },
              { k: "tiktok", label: "@ do TikTok", ph: "@seuuser" },
            ] as const
          ).map((f) => (
            <div key={f.k} className="space-y-1">
              <Label htmlFor={f.k} className="text-xs font-semibold uppercase tracking-wider">
                {f.label}
              </Label>
              <Input
                id={f.k}
                value={values[f.k]}
                onChange={set(f.k)}
                placeholder={f.ph}
                autoComplete="off"
                className="h-11 rounded-xl border-border bg-background focus-visible:ring-primary"
              />
              {errors[f.k] && <p className="text-xs text-destructive">{errors[f.k]}</p>}
            </div>
          ))}

          {serverError && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-xs font-medium text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-gradient-neon text-base font-bold tracking-wide text-primary-foreground shadow-neon hover:opacity-95 disabled:opacity-70"
          >
            {submitting ? "GIRANDO..." : "DESBLOQUEAR ROLETA"}
          </Button>
          <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            1 participação por @ · sem spam
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
