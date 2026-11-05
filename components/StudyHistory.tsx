"use client";

import { useSyncExternalStore } from "react";
import { ALL_CATEGORY_IDS } from "@/lib/categories";
import { DIFFICULTY_LABELS } from "@/lib/quiz";
import {
  clearHistory,
  parseHistory,
  readHistorySnapshot,
  subscribeHistory,
  weakestCategory,
  type QuizHistoryEntry,
} from "@/lib/history";
import { focusRing } from "./ui/Button";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatConditions(entry: QuizHistoryEntry): string {
  const difficulty =
    entry.difficulties.length === 3
      ? "全難易度"
      : entry.difficulties.map((d) => DIFFICULTY_LABELS[d]).join("・");
  const scope =
    entry.categoryCount >= ALL_CATEGORY_IDS.length ? "全分野" : `${entry.categoryCount}分野`;
  return `${difficulty}・${scope}`;
}

interface StudyHistoryProps {
  hasWords?: (categoryId: string) => boolean;
  onRetryCategory?: (categoryId: string) => void;
}

export default function StudyHistory({ hasWords, onRetryCategory }: StudyHistoryProps) {
  const raw = useSyncExternalStore(subscribeHistory, readHistorySnapshot, () => "");
  const entries = parseHistory(raw);

  function handleClear() {
    clearHistory();
  }

  if (entries.length === 0) return null;

  const weakest = weakestCategory(entries);
  const retry =
    weakest && (!hasWords || hasWords(weakest.categoryId)) ? weakest : null;

  return (
    <section className="mt-8" aria-labelledby="study-history-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="study-history-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          この端末の記録
        </h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className={`min-h-11 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 ${focusRing}`}
          >
            記録を消す
          </button>
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {entries.map((entry, index) => {
          const accuracy =
            entry.questionCount > 0
              ? Math.round((entry.correctCount / entry.questionCount) * 100)
              : 0;
          return (
            <li
              key={`${entry.finishedAt}-${index}`}
              className="flex items-baseline justify-between gap-3 text-sm text-slate-600 dark:text-slate-300"
            >
              <span>
                {formatWhen(entry.finishedAt)}
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {formatConditions(entry)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {entry.correctCount}/{entry.questionCount}問
                <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">{accuracy}%</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="min-h-11">
        <button
          type="button"
          aria-hidden={retry ? undefined : true}
          tabIndex={retry ? 0 : -1}
          disabled={!retry}
          onClick={() => {
            if (retry) onRetryCategory?.(retry.categoryId);
          }}
          className={`inline-flex min-h-11 w-full max-w-full flex-wrap items-center text-left text-sm font-semibold text-indigo-700 underline decoration-indigo-400 underline-offset-4 transition-opacity duration-500 ease-out motion-reduce:transition-none dark:text-indigo-300 dark:decoration-indigo-500 ${focusRing} ${
            retry ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <span className="inline-block">{retry ? retry.name : "分野"}</span>
          <span className="inline-block">をもう一度</span>
        </button>
      </div>
    </section>
  );
}
