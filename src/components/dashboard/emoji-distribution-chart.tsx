"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RATING_EMOJIS, RATING_LABELS, type RatingScore } from "@/types/models";
import { RATING_SCORE_COLOR, CHART_INK } from "@/lib/chart-colors";

interface EmojiDistributionChartProps {
  data: { score: number; count: number }[];
}

export function EmojiDistributionChart({ data }: EmojiDistributionChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: `${RATING_EMOJIS[d.score as RatingScore]} ${RATING_LABELS[d.score as RatingScore]}`,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            axisLine={{ stroke: CHART_INK.baseline }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: CHART_INK.gridline, opacity: 0.4 }}
            contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_INK.gridline}`, fontSize: 13 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {chartData.map((entry) => (
              <Cell key={entry.score} fill={RATING_SCORE_COLOR[entry.score]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
