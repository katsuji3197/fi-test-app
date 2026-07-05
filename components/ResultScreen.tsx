"use client";

import type { AnsweredRecord, QuizStats } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import StatsBar from "./StatsBar";

interface ResultScreenProps {
  stats: QuizStats;
  history: AnsweredRecord[];
  onRestartSame: () => void;
  onBackToSetup: () => void;
}

const OUTCOME_LABEL: Record<AnsweredRecord["outcome"], string> = {
  correct: "正解",
  incorrect: "不正解",
  giveup: "ギブアップ",
};

const OUTCOME_DOT: Record<AnsweredRecord["outcome"], string> = {
  correct: "bg-emerald-500",
  incorrect: "bg-rose-500",
  giveup: "bg-amber-500",
};

export default function ResultScreen({
  stats,
  history,
  onRestartSame,
  onBackToSetup,
}: ResultScreenProps) {
  const total = history.length;
  const totalCorrect = stats.correctFree + stats.correctChoice;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
  const reviewItems = history.filter((h) => h.outcome !== "correct");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-6 text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600">
          お疲れさまでした
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          結果発表
        </h1>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">正答率(自由記述・選択肢の合計)</p>
        <p className="mt-1 text-5xl font-bold text-indigo-600">{accuracy}%</p>
        <p className="mt-1 text-sm text-slate-400">
          全{total}問中 {totalCorrect}問正解
        </p>

        <div className="mt-6">
          <StatsBar stats={stats} />
        </div>
      </div>

      {reviewItems.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            復習リスト(不正解・ギブアップした問題)
          </h2>
          <ul className="space-y-3">
            {reviewItems.map((item, index) => {
              const category = getCategoryById(item.word.categoryId);
              return (
                <li
                  key={`${item.word.id}-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span
                      className={`inline-block size-1.5 rounded-full ${OUTCOME_DOT[item.outcome]}`}
                    />
                    <span className="font-medium text-slate-500">
                      {OUTCOME_LABEL[item.outcome]}
                    </span>
                    <span>・{category?.name ?? item.word.categoryId}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{item.word.question}</p>
                  <p className="mt-1.5 text-base font-bold text-slate-900">
                    正解: {item.word.term}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {item.word.explanation}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestartSame}
          className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          同じ条件でもう一度
        </button>
        <button
          type="button"
          onClick={onBackToSetup}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          設定を変更する
        </button>
      </div>
    </div>
  );
}
