import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '#/components/ui/chart';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import type { StrapiFast } from '#/lib/services/fasts';

type RangeOption = {
  label: string;
  days: 7 | 14 | 30 | 90 | 365 | 0;
};

const RANGES: RangeOption[] = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 0 },
];

const chartConfig = {
  hours: {
    label: 'Hours fasted',
    color: 'var(--ink)',
  },
} satisfies ChartConfig;

type ChartPoint = {
  date: number;
  hours: number;
  cancelled: boolean;
  targetHours: number | null;
};

function toChartPoints(fasts: StrapiFast[]): ChartPoint[] {
  return fasts
    .filter((f) => f.endedAt != null && !f.cancelled)
    .map((f) => {
      const startMs = new Date(f.startedAt).getTime();
      const endMs = new Date(f.endedAt as string).getTime();
      const hours = (endMs - startMs) / (60 * 60 * 1000);
      return {
        date: endMs,
        hours: Number(hours.toFixed(2)),
        cancelled: f.cancelled,
        targetHours: f.targetHours,
      };
    })
    .sort((a, b) => a.date - b.date);
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

// Warm milestone palette matched to the existing WhtrChart reference-line tone.
const MILESTONE_COLOR = {
  m16: '#7cb069',
  m24: '#e6b94a',
  m36: '#c55a42',
} as const;

export function FastChart({ fasts }: Readonly<{ fasts: StrapiFast[] }>) {
  const [days, setDays] = useState<RangeOption['days']>(30);

  const data = useMemo(() => {
    const all = toChartPoints(fasts);
    if (days === 0) return all;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return all.filter((p) => p.date >= cutoff);
  }, [fasts, days]);

  return (
    <Card className="rise-in rounded-2xl border border-(--line) bg-card p-0 shadow-none">
      <CardContent className="grid gap-4 px-5 py-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              type="button"
              size="sm"
              variant={r.days === days ? 'default' : 'outline'}
              onClick={() => setDays(r.days)}
              className="h-7 rounded-full px-3 text-xs"
            >
              {r.label}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? 'fast' : 'fasts'}
          </span>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">
              No completed fasts in this range.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a longer window or start a fast.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <LineChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={(v) => dateFormatter.format(new Date(v))}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                domain={[0, 36]}
                ticks={[0, 8, 16, 24, 36]}
                tickFormatter={(v) => `${v}h`}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={36}
              />
              <ReferenceLine
                y={16}
                stroke={MILESTONE_COLOR.m16}
                strokeDasharray="4 4"
                label={{ value: '16h', position: 'insideRight', fontSize: 10, fill: MILESTONE_COLOR.m16 }}
              />
              <ReferenceLine
                y={24}
                stroke={MILESTONE_COLOR.m24}
                strokeDasharray="4 4"
                label={{ value: '24h', position: 'insideRight', fontSize: 10, fill: MILESTONE_COLOR.m24 }}
              />
              <ReferenceLine
                y={36}
                stroke={MILESTONE_COLOR.m36}
                strokeDasharray="4 4"
                label={{ value: '36h', position: 'insideRight', fontSize: 10, fill: MILESTONE_COLOR.m36 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const ts = payload?.[0]?.payload?.date as number | undefined;
                      return ts ? dateFormatter.format(new Date(ts)) : '';
                    }}
                    formatter={(value, _name, item) => {
                      const p = item.payload as ChartPoint;
                      const label = p.targetHours
                        ? `${(value as number).toFixed(1)}h (target ${p.targetHours}h)`
                        : `${(value as number).toFixed(1)}h`;
                      return [label, 'Fast'];
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload, index } = props as {
                    cx: number;
                    cy: number;
                    payload: ChartPoint;
                    index: number;
                  };
                  const fill =
                    payload.hours >= 36
                      ? MILESTONE_COLOR.m36
                      : payload.hours >= 24
                        ? MILESTONE_COLOR.m24
                        : payload.hours >= 16
                          ? MILESTONE_COLOR.m16
                          : 'var(--ink-muted)';
                  return (
                    <Dot
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={fill}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
