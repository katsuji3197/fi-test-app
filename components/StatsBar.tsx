import type { QuizStats } from "@/lib/types";

interface StatsBarProps {
  stats: QuizStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const items = [
    {
      label: "正答(自由記述)",
      value: stats.correctFree,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    },
    {
      label: "正答(選択肢)",
      value: stats.correctChoice,
      className: "bg-teal-50 text-teal-700 ring-teal-600/20",
    },
    {
      label: "不正解",
      value: stats.incorrect,
      className: "bg-rose-50 text-rose-700 ring-rose-600/20",
    },
    {
      label: "ギブアップ",
      value: stats.giveUp,
      className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-inset ${item.className}`}
        >
          <span>{item.label}</span>
          <span className="text-base font-bold tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
