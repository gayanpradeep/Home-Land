import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  tone?: "default" | "good" | "critical";
}

export function StatTile({ label, value, tone = "default" }: StatTileProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          tone === "good" && "text-[#0ca30c]",
          tone === "critical" && "text-[#d03b3b]",
          tone === "default" && "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
