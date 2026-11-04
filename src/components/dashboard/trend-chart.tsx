"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_INK, SEQUENTIAL_BLUE } from "@/lib/chart-colors";

interface TrendChartProps {
  data: { date: string; value: number }[];
  valueFormatter?: (value: number) => string;
}

export function TrendChart({ data, valueFormatter }: TrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: CHART_INK.muted }}
            axisLine={{ stroke: CHART_INK.baseline }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(value) => (valueFormatter ? valueFormatter(Number(value)) : value)}
            contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_INK.gridline}`, fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={SEQUENTIAL_BLUE[500]}
            strokeWidth={2}
            dot={{ r: 3, fill: SEQUENTIAL_BLUE[500], strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
