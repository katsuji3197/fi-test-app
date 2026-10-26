"use client";

import type { AnsweredRecord, QuizStats, WordEntry } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import StatsBar from "./StatsBar";
import Button from "./ui/Button";

function resultMessage(accuracy: number, mistakeCount: number): string {
  if (mistakeCount === 0) return "全問正解です。";
  if (accuracy >= 80) return "よくできました。間違えた問題だけ、もう一度。";
  if (accuracy >= 50) return "半分は押さえられています。復習リストを見返しましょう。";
  return "復習リストから、間違えた用語を固めましょう。";
}

interface ResultScreenProps {
  stats: QuizStats;
  history: AnsweredRecord[];
  onRestartSame: () => void;
  onRetryMistakes: (words: WordEntry[]) => void;
  onBackToSetup: () => void;
  isRetry?: boolean;
}

const OUTCOME_LABEL: Record<AnsweredRecord["outcome"], string> = {
  correct: "正解",
  incorrect: "不正解",
  giveup: "ギブアップ",
};

const OUTCOME_DOT: Record<AnsweredRecord["outcome"], string> = {
  correct: "bg-emerald-500 dark:bg-emerald-400",
  incorrect: "bg-rose-500 dark:bg-rose-400",
  giveup: "bg-amber-500 dark:bg-amber-400",
};

export default function ResultScreen({
  stats,
  history,
  onRestartSame,
  onRetryMistakes,
  onBackToSetup,
  isRetry = false,
}: ResultScreenProps) {
  const total = history.length;
  const totalCorrect = stats.correctFree + stats.correctChoice;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
  const reviewItems = history.filter((h) => h.outcome !== "correct");
  const againLabel = isRetry ? "最初の条件で新しく出題" : "同じ条件でもう一度";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-6 text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-300">
          お疲れさまでした
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
          結果発表
        </h1>
      </header>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-800 p-6 text-center shadow-sm dark:shadow-none">
        <p className="text-sm text-slate-600 dark:text-slate-300">正答率（自由記述・選択肢の合計）</p>
        <p className="mt-1 text-5xl font-bold text-indigo-600 dark:text-indigo-300">{accuracy}%</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          全{total}問中 {totalCorrect}問正解
        </p>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{resultMessage(accuracy, reviewItems.length)}</p>

        <div className="mt-6">
          <StatsBar stats={stats} />
        </div>
      </div>

      {reviewItems.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            復習リスト（不正解・ギブアップした問題）
          </h2>
          <ul className="space-y-3">
            {reviewItems.map((item, index) => {
              const category = getCategoryById(item.word.categoryId);
              return (
                <li
                  key={`${item.word.id}-${index}`}
                  className="rounded-xl border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-800 p-4 shadow-sm dark:shadow-none"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span
                      className={`inline-block size-1.5 rounded-full ${OUTCOME_DOT[item.outcome]}`}
                    />
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      {OUTCOME_LABEL[item.outcome]}
                    </span>
                    <span>・{category?.name ?? item.word.categoryId}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{item.word.question}</p>
                  <p className="mt-1.5 text-base font-bold text-slate-900 dark:text-slate-100">
                    正解：{item.word.term}
                  </p>
                  {item.userAnswer && (
                    <p className="mt-0.5 text-sm text-rose-700 dark:text-rose-300">
                      あなたの回答：{item.userAnswer}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.word.explanation}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {reviewItems.length > 0 ? (
          <Button
            size="lg"
            className="w-full"
            onClick={() => onRetryMistakes(reviewItems.map((item) => item.word))}
          >
            間違えた{reviewItems.length}問だけ解き直す
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={onRestartSame}>
            {againLabel}
          </Button>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          {reviewItems.length > 0 && (
            <Button variant="secondary" size="lg" className="w-full flex-1" onClick={onRestartSame}>
              {againLabel}
            </Button>
          )}
          <Button variant="secondary" size="lg" className="w-full flex-1" onClick={onBackToSetup}>
            設定を変更する
          </Button>
        </div>
      </div>
    </div>
  );
}
