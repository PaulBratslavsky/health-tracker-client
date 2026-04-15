import { useEffect, useState } from 'react';
import { MAX_FAST_HOURS } from '#/lib/validations/fast';

type Props = {
  startedAt: string;
  targetHours: number | null;
  onAutoClamp: () => void;
};

const MILESTONES = [16, 24, 36] as const;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FastTimer({ startedAt, targetHours, onAutoClamp }: Readonly<Props>) {
  const startMs = new Date(startedAt).getTime();
  // Initialize to startMs so SSR and first client render agree on elapsed = 0.
  // The real clock only starts ticking after mount, avoiding hydration mismatch.
  const [now, setNow] = useState(startMs);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsedMs = now - startMs;
  const capMs = MAX_FAST_HOURS * 60 * 60 * 1000;

  // Safety: if the client-side clock passes 36h, trigger auto-end.
  // Server also enforces this on update — this is just the UX side.
  const hasExceededCap = elapsedMs >= capMs;
  useEffect(() => {
    if (hasExceededCap) onAutoClamp();
  }, [hasExceededCap, onAutoClamp]);

  const displayMs = Math.min(elapsedMs, capMs);
  const elapsedHours = displayMs / (60 * 60 * 1000);

  // Progress ring. If user picked a target, the ring fills toward that.
  // If no target, it fills toward the 36h cap so the ring still communicates
  // progress against the safety ceiling.
  const ringMax = targetHours ?? MAX_FAST_HOURS;
  const progress = Math.min(1, elapsedHours / ringMax);

  const size = 260;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display-title text-[3rem] leading-none tabular-nums text-(--ink)">
          {formatElapsed(displayMs)}
        </span>
        <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-(--ink-muted)">
          {targetHours ? `of ${targetHours}h target` : 'no target'}
        </span>
        <div className="mt-4 flex items-center gap-3">
          {MILESTONES.map((mark) => {
            const reached = elapsedHours >= mark;
            return (
              <div
                key={mark}
                className={`flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider ${
                  reached ? 'text-(--ink)' : 'text-(--ink-muted)'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    reached ? 'bg-(--accent)' : 'bg-(--line-strong)'
                  }`}
                />
                {mark}h
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
