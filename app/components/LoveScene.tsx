"use client";

import Image from "next/image";
import { useEffect, useRef, useMemo } from "react";
import { LocationReporter } from "./LocationReporter";

export type LoveCopy = {
  tag: string;
  title: string;
  /** 展示用，如 2022年10月1日 */
  meetDate: string;
  /** 计算用，ISO 日期 YYYY-MM-DD（本地日历） */
  meetAt: string;
  meetPlace: string;
  /** public 目录下路径，如 /小青.jpg */
  photo: string;
  photoAlt: string;
  /** 称呼，如 最爱的小青 */
  herName: string;
  paragraphs: string[];
  signature: string;
  date: string;
};

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) {
    return new Date(Number.NaN);
  }
  return new Date(y, m - 1, d);
}

/** 优先 meetAt，否则从 meetDate（如 2022年10月1日）解析，均为本地日历 */
function resolveMeetStart(copy: LoveCopy): Date {
  if (copy.meetAt) {
    const fromIso = parseLocalDate(copy.meetAt);
    if (!Number.isNaN(fromIso.getTime())) return fromIso;
  }
  const m = copy.meetDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return parseLocalDate("2022-10-01");
}

function getKnowingDuration(copy: LoveCopy, now = new Date()) {
  const start = resolveMeetStart(copy);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (Number.isNaN(start.getTime()) || end < start) {
    return { calendar: "—", totalDays: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} 年`);
  if (months > 0) parts.push(`${months} 个月`);
  if (days > 0 || parts.length === 0) parts.push(`${days} 天`);

  const totalDays =
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  return { calendar: parts.join(" "), totalDays };
}

type HeartParticle = {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  hue: number;
  phase: number;
};

type Spark = {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
};

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  opacity: number,
  hue: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size / 24, size / 24);
  ctx.translate(-12, -12);
  ctx.fillStyle = `hsla(${hue}, 85%, 65%, ${opacity})`;
  ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${opacity * 0.6})`;
  ctx.shadowBlur = size * 0.15;
  ctx.fill(new Path2D(HEART_PATH));
  ctx.restore();
}

function spawnHeart(w: number, h: number): HeartParticle {
  return {
    x: Math.random() * w,
    y: h + Math.random() * 40,
    size: 8 + Math.random() * 18,
    speedY: 0.4 + Math.random() * 1.2,
    speedX: (Math.random() - 0.5) * 0.4,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    opacity: 0.15 + Math.random() * 0.55,
    hue: 330 + Math.random() * 40,
    phase: Math.random() * Math.PI * 2,
  };
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let hearts: HeartParticle[] = [];
    let sparks: Spark[] = [];
    const maxHearts = reducedMotion ? 12 : 28;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hearts = Array.from({ length: maxHearts }, () => spawnHeart(w, h));
      hearts.forEach((p) => {
        p.y = Math.random() * h;
      });
    };

    resize();
    window.addEventListener("resize", resize);

    let lastSpark = 0;
    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      if (!reducedMotion && t - lastSpark > 180) {
        lastSpark = t;
        if (sparks.length < 40) {
          sparks.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.85,
            life: 0,
            maxLife: 40 + Math.random() * 50,
            size: 1 + Math.random() * 2.5,
          });
        }
      }

      for (const p of hearts) {
        if (!reducedMotion) {
          p.y -= p.speedY;
          p.x += p.speedX + Math.sin(t / 400 + p.phase) * 0.15;
          p.rotation += p.rotSpeed;
          if (p.y < -30) {
            Object.assign(p, spawnHeart(w, h));
          }
        }
        drawHeart(ctx, p.x, p.y, p.size, p.rotation, p.opacity, p.hue);
      }

      sparks = sparks.filter((s) => {
        s.life += 1;
        const prog = s.life / s.maxLife;
        if (prog >= 1) return false;
        const alpha = Math.sin(prog * Math.PI) * 0.9;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = `rgba(251, 113, 133, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        return true;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden
    />
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function LoveScene({ copy }: { copy: LoveCopy }) {
  const knowing = useMemo(
    () => getKnowingDuration(copy),
    [copy.meetAt, copy.meetDate],
  );

  const staggerDelays = useMemo(
    () => copy.paragraphs.map((_, i) => 900 + i * 180),
    [copy.paragraphs],
  );

  return (
    <div className="relative min-h-dvh overflow-hidden px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <LocationReporter label={copy.herName} source="home" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#0f0612]" aria-hidden />
      <div
        className="love-aurora pointer-events-none absolute inset-0 z-0 opacity-90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 animate-mesh-drift bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.35)_0%,transparent_45%),radial-gradient(circle_at_80%_20%,rgba(167,139,250,0.35)_0%,transparent_40%),radial-gradient(circle_at_50%_50%,rgba(251,113,133,0.2)_0%,transparent_50%)]"
        aria-hidden
      />

      <ParticleCanvas />

      <div className="pointer-events-none absolute left-1/2 top-1/3 z-[2] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/20 blur-[80px] animate-glow-breathe" />
      <div className="pointer-events-none absolute bottom-1/4 right-0 z-[2] h-48 w-48 translate-x-1/4 rounded-full bg-violet-500/25 blur-[70px] animate-glow-breathe [animation-delay:-2s]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top))-max(1.5rem,env(safe-area-inset-bottom)))] max-w-md flex-col items-center justify-center">
        <div className="love-card-enter w-full">
          <div className="relative overflow-hidden rounded-[1.75rem] p-[2px]">
            <div
              className="absolute inset-[-50%] animate-border-spin bg-[conic-gradient(from_0deg,#fb7185,#e879f9,#818cf8,#fb7185)] opacity-80"
              aria-hidden
            />
            <article className="love-shimmer relative overflow-hidden rounded-[1.68rem] border border-white/20 bg-white/10 p-8 shadow-[0_0_60px_rgba(236,72,153,0.25)] backdrop-blur-xl">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"
                aria-hidden
              />

              <p
                className="love-fade-up text-center text-xs font-medium tracking-[0.4em] text-rose-200/90"
                style={{ animationDelay: "200ms" }}
              >
                {copy.tag}
              </p>

              <div
                className="love-fade-up relative mx-auto mt-5 flex justify-center"
                style={{ animationDelay: "320ms" }}
              >
                <div className="relative h-[8.75rem] w-[8.75rem]">
                  <span
                    className="absolute -inset-3 rounded-full bg-rose-500/30 blur-2xl animate-glow-breathe"
                    aria-hidden
                  />
                  <div className="absolute inset-0 overflow-hidden rounded-full p-[2px]">
                    <div
                      className="absolute inset-[-50%] animate-border-spin bg-[conic-gradient(from_0deg,#fb7185,#f9a8d4,#e879f9,#fb7185)] opacity-90"
                      aria-hidden
                    />
                  </div>
                  <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white/35 bg-white/10 shadow-[0_0_40px_rgba(244,114,182,0.45)] ring-2 ring-rose-200/20">
                    <Image
                      src={copy.photo}
                      alt={copy.photoAlt}
                      width={280}
                      height={280}
                      sizes="140px"
                      className="h-full w-full object-cover object-center"
                      priority
                    />
                    <div
                      className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-rose-950/35 via-transparent to-white/10"
                      aria-hidden
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-rose-500/90 shadow-lg backdrop-blur-sm">
                    <HeartIcon className="h-4 w-4 text-white drop-shadow-sm" />
                  </span>
                </div>
              </div>

              <p
                className="love-fade-up mt-4 text-center text-lg font-semibold tracking-[0.12em] text-rose-100 drop-shadow-[0_0_16px_rgba(251,113,133,0.35)]"
                style={{ animationDelay: "400ms" }}
              >
                {copy.herName}
              </p>

              <h1
                className="love-fade-up mt-4 text-center text-2xl font-bold tracking-wide text-rose-50 drop-shadow-[0_0_24px_rgba(251,113,133,0.45)]"
                style={{ animationDelay: "480ms" }}
              >
                {copy.title}
              </h1>

              <p
                className="love-fade-up mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-rose-100/85"
                style={{ animationDelay: "620ms" }}
              >
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-sm">
                  相识 {copy.meetDate}
                </span>
                <span className="text-rose-200/50" aria-hidden>
                  ·
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-sm">
                  {copy.meetPlace}
                </span>
              </p>

              <p
                className="mt-3 min-h-[2.75rem] text-center text-sm text-rose-50"
                suppressHydrationWarning
              >
                我们已经相识{" "}
                <span className="font-semibold text-rose-200">
                  {knowing.calendar}
                </span>
                <span className="mt-1 block text-xs text-rose-200/70">
                  相识第 {knowing.totalDays} 天
                </span>
              </p>

              <div className="mt-6 space-y-4 text-base leading-relaxed text-rose-50/90">
                {copy.paragraphs.map((text, i) => (
                  <p
                    key={i}
                    className="love-fade-up"
                    style={{ animationDelay: `${staggerDelays[i]}ms` }}
                  >
                    {text}
                  </p>
                ))}
              </div>

              <footer
                className="love-fade-up mt-8 border-t border-white/15 pt-6 text-center"
                style={{
                  animationDelay: `${900 + copy.paragraphs.length * 180 + 120}ms`,
                }}
              >
                <p className="text-sm font-medium text-rose-200">
                  {copy.signature}
                </p>
                <p className="mt-2 text-xs text-rose-200/60">{copy.date}</p>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
