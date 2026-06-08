import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, RefreshCw, Download, Gem } from "lucide-react";
import { listParticipants, supabaseConfigured } from "@/lib/api";
import type { Participant } from "@/lib/diamonds";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({
    meta: [{ title: "Admin — Roleta Irmãos Berti" }],
  }),
});

// Senha do painel. Em produção, defina VITE_ADMIN_PASSWORD (ver .env.example).
const ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || "BertiAdmin2026";

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);

  const [rows, setRows] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = () => {
    setLoading(true);
    listParticipants()
      .then((r) => {
        setRows(r);
        setNow(Date.now());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwdError(false);
    } else {
      setPwdError(true);
    }
  };

  const exportCsv = () => {
    const header = ["Nome", "@TikTok", "Diamantes", "Premio", "Data/Hora"];
    const lines = rows.map((p) =>
      [
        p.nome,
        p.tiktok,
        String(p.diamonds),
        p.prize,
        new Date(p.createdAt).toLocaleString("pt-BR"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roleta-participantes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-2xl border border-primary/20 bg-background/95 p-8 shadow-neon backdrop-blur-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-neon shadow-neon">
            <Lock className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-center font-editorial text-2xl">Painel Admin</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Registros da roleta Irmãos Berti
          </p>
          <div className="mt-6 space-y-1">
            <Label htmlFor="pwd" className="text-xs font-semibold uppercase tracking-wider">
              Senha
            </Label>
            <Input
              id="pwd"
              type="password"
              value={pwd}
              onChange={(e) => {
                setPwd(e.target.value);
                setPwdError(false);
              }}
              placeholder="••••••••"
              className="h-11 rounded-xl"
            />
            {pwdError && <p className="text-xs text-destructive">Senha incorreta.</p>}
          </div>
          <Button
            type="submit"
            className="mt-4 h-12 w-full rounded-xl bg-gradient-neon font-bold text-primary-foreground shadow-neon"
          >
            ENTRAR
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-3xl tracking-tight">Participantes</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {rows.length} {rows.length === 1 ? "registro" : "registros"}
            {!supabaseConfigured && " · modo local (Supabase não configurado)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={load}
            disabled={loading}
            variant="outline"
            className="h-10 rounded-xl"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            onClick={exportCsv}
            disabled={!rows.length}
            className="h-10 rounded-xl bg-gradient-neon text-primary-foreground shadow-neon"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">@TikTok</th>
              <th className="px-5 py-3">Prêmio</th>
              <th className="px-5 py-3">Data / Hora</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  {loading ? "Carregando..." : "Nenhum participante ainda."}
                </td>
              </tr>
            ) : (
              rows.map((p, i) => (
                <tr
                  key={`${p.tiktok}-${p.createdAt}`}
                  className="border-t border-border/40 hover:bg-primary/5"
                >
                  <td className="px-5 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-3 font-semibold">{p.nome}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.tiktok}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                      <Gem className="h-3.5 w-3.5" />
                      {p.prize}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Última atualização: {new Date(now).toLocaleString("pt-BR")}
      </p>
    </main>
  );
}
