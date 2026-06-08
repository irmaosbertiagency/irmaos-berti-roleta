import { useEffect, useMemo, useRef, useState } from "react";

export type Prize = {
  label: string;
  sub?: string;
  rare?: boolean;
};

type Props = {
  prizes: Prize[];
  spinning: boolean;
  targetIndex: number | null;
  onSpinEnd: (index: number) => void;
  onSpinClick: () => void;
  disabled?: boolean;
};

export default function PrizeWheel({
  prizes,
  spinning,
  targetIndex,
  onSpinEnd,
  onSpinClick,
  disabled,
}: Props) {
  const [rotation, setRotation] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickRef = useRef<number>(0);

  const segAngle = 360 / prizes.length;

  useEffect(() => {
    if (!spinning || targetIndex == null) return;
    const base = 360 * 6; // 6 full turns
    const targetAngle = 360 - targetIndex * segAngle - segAngle / 2;
    const current = rotation % 360;
    const delta = base + ((targetAngle - current + 360) % 360);
    const next = rotation + delta;
    setRotation(next);

    // ticking sound
    const duration = 5200;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const speed = 1 - p * p; // decelerate
      const interval = 40 + p * 220;
      if (t - tickRef.current > interval && speed > 0.02) {
        tickRef.current = t;
        playTick();
      }
      if (p < 1) raf = requestAnimationFrame(tick);
      else onSpinEnd(targetIndex);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, targetIndex]);

  const playTick = () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1200;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      /* noop */
    }
  };

  const segments = useMemo(() => {
    const r = 200;
    const cx = 220;
    const cy = 220;
    return prizes.map((p, i) => {
      const startA = (i * segAngle - 90) * (Math.PI / 180);
      const endA = ((i + 1) * segAngle - 90) * (Math.PI / 180);
      const x1 = cx + r * Math.cos(startA);
      const y1 = cy + r * Math.sin(startA);
      const x2 = cx + r * Math.cos(endA);
      const y2 = cy + r * Math.sin(endA);
      const large = segAngle > 180 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      const isPink = i % 3 === 0;
      const isBlack = i % 3 === 1;
      const fill = isPink
        ? "url(#pinkGrad)"
        : isBlack
        ? "oklch(0.14 0.01 320)"
        : "oklch(0.99 0.005 320)";
      const textColor = isBlack ? "#fff" : isPink ? "#fff" : "oklch(0.14 0.01 320)";
      // radial orientation: rotate around center so text reads from inside to rim
      const rot = (i + 0.5) * segAngle;
      return { d, fill, textColor, cx, cy, rot, prize: p, isPink };
    });
  }, [prizes, segAngle]);

  return (
    <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center">
      {/* outer glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 animate-pulse-glow rounded-full" />

      {/* pointer */}
      <div className="absolute left-1/2 top-[-6px] z-20 -translate-x-1/2">
        <div className="relative">
          <div
            className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[28px] border-l-transparent border-r-transparent"
            style={{
              borderTopColor: "oklch(0.66 0.31 358)",
              filter: "drop-shadow(0 0 12px oklch(0.66 0.31 358 / 0.9))",
            }}
          />
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-neon" />
        </div>
      </div>

      <div className="relative aspect-square w-full">
        {/* ring */}
        <div className="absolute inset-0 rounded-full border-[6px] border-primary/30 shadow-neon" />
        <div className="absolute inset-2 rounded-full border border-primary/40" />

        <svg
          viewBox="0 0 440 440"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 5.2s cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
            filter: spinning ? "blur(0.3px)" : "none",
          }}
        >
          <defs>
            <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.78 0.25 355)" />
              <stop offset="100%" stopColor="oklch(0.58 0.31 358)" />
            </linearGradient>
            <filter id="rareGlow">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {segments.map((s, i) => (
            <g key={i}>
              <path d={s.d} fill={s.fill} stroke="oklch(0.66 0.31 358 / 0.6)" strokeWidth="1.5" />
              <g
                transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}
              >
                {(() => {
                  const lines = wrapText(s.prize.label, 9).slice(0, 3);
                  if (s.prize.rare) lines.push("★");
                  // center the text block along the spoke, with safe margins from rim and hub
                  const centerR = 145;
                  const step = 12;
                  const totalH = (lines.length - 1) * step;
                  return lines.map((line, li) => {
                    const y = s.cy - centerR - totalH / 2 + li * step;
                    return (
                      <text
                        key={li}
                        x={s.cx}
                        y={y}
                        textAnchor="middle"
                        fill={s.textColor}
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="Inter, sans-serif"
                        letterSpacing="0.3"
                      >
                        {line.toUpperCase()}
                      </text>
                    );
                  });
                })()}
              </g>
            </g>
          ))}
          {/* small lights around edge */}
          {Array.from({ length: prizes.length }).map((_, i) => {
            const a = (i * segAngle - 90) * (Math.PI / 180);
            const cx = 220 + 198 * Math.cos(a);
            const cy = 220 + 198 * Math.sin(a);
            return <circle key={i} cx={cx} cy={cy} r="3" fill="oklch(0.66 0.31 358)" opacity="0.9" />;
          })}
        </svg>

        {/* center button */}
        <button
          type="button"
          onClick={onSpinClick}
          disabled={disabled || spinning}
          className="group absolute left-1/2 top-1/2 z-10 flex h-28 w-28 sm:h-32 sm:w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-neon text-primary-foreground shadow-neon transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-neon animate-pulse-glow" />
          <div className="absolute inset-1.5 rounded-full border border-white/40" />
          <span className="relative font-editorial text-2xl sm:text-3xl tracking-tight">
            {spinning ? "..." : "GIRAR"}
          </span>
        </button>
      </div>
    </div>
  );
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxLen) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur += " " + w;
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 3);
}