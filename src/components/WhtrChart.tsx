import { useState, useTransition, useMemo } from 'react';
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
import { getMyMeasurements } from '#/data/server-functions/posts';
import type { MeasurementPoint } from '#/lib/services/posts';
import { bandFor, computeWhtr, type WhtrBand } from '#/lib/whtr';

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

// Warmer, desaturated variants matched to the app palette.
const BAND_COLOR: Record<WhtrBand, string> = {
  green: '#7cb069',
  yellow: '#e6b94a',
  red: '#c55a42',
};

const chartConfig = {
  whtr: {
    label: 'WHtR',
    color: 'var(--ink)',
  },
} satisfies ChartConfig;

type ChartPoint = {
  date: number; // ms epoch (sortable, formattable)
  whtr: number;
  band: WhtrBand;
  waistCm: number;
  heightCm: number;
};

function toChartPoints(measurements: MeasurementPoint[]): ChartPoint[] {
  return measurements.map((m) => {
    const whtr = computeWhtr(m.waistCm, m.heightSnapshotCm);
    return {
      date: new Date(m.createdAt).getTime(),
      whtr: Number(whtr.toFixed(3)),
      band: bandFor(whtr),
      waistCm: m.waistCm,
      heightCm: m.heightSnapshotCm,
    };
  });
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export function WhtrChart({
  initialMeasurements,
  initialDays,
}: {
  initialMeasurements: MeasurementPoint[];
  initialDays: number;
}) {
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [days, setDays] = useState<RangeOption['days']>(
    (initialDays as RangeOption['days']) ?? 30,
  );
  const [isPending, startTransition] = useTransition();

  const data = useMemo(() => toChartPoints(measurements), [measurements]);

  const handleRangeChange = (newDays: RangeOption['days']) => {
    if (newDays === days) return;
    setDays(newDays);
    startTransition(async () => {
      const next = await getMyMeasurements({ data: { days: newDays } });
      setMeasurements(next);
    });
  };

  return (
    <Card className="rise-in rounded-2xl border border-[var(--line)] bg-[var(--card)] p-0 shadow-none">
      <CardContent className="grid gap-4 px-5 py-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              type="button"
              size="sm"
              variant={r.days === days ? 'default' : 'outline'}
              onClick={() => handleRangeChange(r.days)}
              disabled={isPending}
              className="h-7 rounded-full px-3 text-xs"
            >
              {r.label}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? 'measurement' : 'measurements'}
          </span>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">No measurements in this range.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a longer window or post a new check-in.
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
                domain={[0.3, 0.8]}
                ticks={[0.3, 0.4, 0.5, 0.6, 0.7, 0.8]}
                tickFormatter={(v) => v.toFixed(2).replace(/^0/, '')}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={36}
              />
              <ReferenceLine
                y={0.5}
                stroke={BAND_COLOR.green}
                strokeDasharray="4 4"
                label={{ value: '0.50', position: 'insideRight', fontSize: 10, fill: BAND_COLOR.green }}
              />
              <ReferenceLine
                y={0.6}
                stroke={BAND_COLOR.red}
                strokeDasharray="4 4"
                label={{ value: '0.60', position: 'insideRight', fontSize: 10, fill: BAND_COLOR.red }}
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
                      return [
                        `${(value as number).toFixed(2)} (waist ${p.waistCm}cm)`,
                        'WHtR',
                      ];
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="whtr"
                stroke="var(--color-whtr)"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload, index } = props as {
                    cx: number;
                    cy: number;
                    payload: ChartPoint;
                    index: number;
                  };
                  return (
                    <Dot
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={BAND_COLOR[payload.band]}
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
