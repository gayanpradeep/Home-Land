"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_INK, SEQUENTIAL_BLUE } from "@/lib/chart-colors";

interface PerformanceBarChartProps {
  data: { name: string; averageRating: number; totalRatings: number }[];
}

export function PerformanceBarChart({ data }: PerformanceBarChartProps) {
  const sorted = [...data].sort((a, b) => b.averageRating - a.averageRating);

  return (
    <div style={{ height: Math.max(220, sorted.length * 40) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid horizontal={false} stroke={CHART_INK.gridline} />
          <XAxis
            type="number"
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            axisLine={{ stroke: CHART_INK.baseline }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 12, fill: CHART_INK.secondary }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: CHART_INK.gridline, opacity: 0.4 }}
            formatter={(value) => [Number(value).toFixed(2), "Avg. rating"]}
            contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_INK.gridline}`, fontSize: 13 }}
          />
          <Bar
            dataKey="averageRating"
            fill={SEQUENTIAL_BLUE[500]}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
