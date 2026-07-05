"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, MAJOR_CATEGORY_ORDER } from "@/lib/categories";
import { ALL_WORDS } from "@/lib/words";
import type { Difficulty, QuizSettings } from "@/lib/types";
import { DIFFICULTY_LABELS, buildQuestionCountOptions, filterWords } from "@/lib/quiz";

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface SetupScreenProps {
  onStart: (settings: QuizSettings) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(
    new Set(ALL_DIFFICULTIES)
  );
  const [categoryIds, setCategoryIds] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.id))
  );
  const [selectedCount, setSelectedCount] = useState<number>(10);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const category of CATEGORIES) {
      const count = ALL_WORDS.filter(
        (w) => w.categoryId === category.id && difficulties.has(w.difficulty)
      ).length;
      counts.set(category.id, count);
    }
    return counts;
  }, [difficulties]);

  const filteredCount = useMemo(
    () => filterWords(ALL_WORDS, difficulties, categoryIds).length,
    [difficulties, categoryIds]
  );

  const questionCountOptions = useMemo(
    () => buildQuestionCountOptions(filteredCount),
    [filteredCount]
  );

  // 選択範囲の変更で選択肢が変わった場合は、レンダー中に有効な値へ補正する
  // (setState をエフェクト内で呼ばないようにするため、派生値として計算する)
  const questionCount = questionCountOptions.includes(selectedCount)
    ? selectedCount
    : questionCountOptions[questionCountOptions.length - 1] ?? 0;

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) {
        if (next.size === 1) return prev;
        next.delete(d);
      } else {
        next.add(d);
      }
      return next;
    });
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMajorGroup(groupCategoryIds: string[], allSelected: boolean) {
    setCategoryIds((prev) => {
      const next = new Set(prev);
      for (const id of groupCategoryIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function selectAllCategories() {
    setCategoryIds(new Set(CATEGORIES.map((c) => c.id)));
  }

  function clearAllCategories() {
    setCategoryIds(new Set());
  }

  const canStart = filteredCount > 0 && questionCount > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600">
          基本情報技術者試験 対策
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          単語暗記トレーニング
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          シラバスの中分類・難易度・出題数を選んで、自由記述で用語を答えましょう。
        </p>
      </header>

      <div className="space-y-6">
        {/* 難易度 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">難易度</h2>
          <p className="mt-1 text-xs text-slate-500">
            出題する問題の難易度を選択してください(複数選択可)。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_DIFFICULTIES.map((d) => {
              const selected = difficulties.has(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDifficulty(d)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              );
            })}
          </div>
        </section>

        {/* 出題範囲(中分類) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                出題範囲(シラバス中分類)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                学習したい分野を中分類単位で選択してください。
              </p>
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllCategories}
                className="rounded-md border border-slate-300 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
              >
                すべて選択
              </button>
              <button
                type="button"
                onClick={clearAllCategories}
                className="rounded-md border border-slate-300 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
              >
                すべて解除
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {MAJOR_CATEGORY_ORDER.map((major) => {
              const groupCategories = CATEGORIES.filter(
                (c) => c.majorCategoryId === major.id
              );
              const groupIds = groupCategories.map((c) => c.id);
              const allSelected = groupIds.every((id) => categoryIds.has(id));

              return (
                <div key={major.id}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {major.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleMajorGroup(groupIds, allSelected)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {allSelected ? "全解除" : "全選択"}
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {groupCategories.map((category) => {
                      const count = categoryCounts.get(category.id) ?? 0;
                      const checked = categoryIds.has(category.id);
                      return (
                        <label
                          key={category.id}
                          className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? "border-indigo-200 bg-indigo-50/70 text-slate-800"
                              : "border-slate-200 bg-white text-slate-500"
                          } ${count === 0 ? "opacity-50" : ""}`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(category.id)}
                              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            {category.name}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-slate-400">
                            {count}語
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 出題数 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">出題数</h2>
          <p className="mt-1 text-xs text-slate-500">
            現在の条件で出題できる単語は{" "}
            <span className="font-semibold text-indigo-600">{filteredCount}語</span>{" "}
            です。10問刻みで出題数を選べます。
          </p>
          {questionCountOptions.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {questionCountOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelectedCount(n)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium tabular-nums transition-colors ${
                    questionCount === n
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {n}問
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-rose-500">
              出題可能な単語がありません。難易度・出題範囲の選択を見直してください。
            </p>
          )}
        </section>
      </div>

      <div className="mt-8">
        <button
          type="button"
          disabled={!canStart}
          onClick={() =>
            onStart({ difficulties, categoryIds, questionCount })
          }
          className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {canStart ? `${questionCount}問で学習を始める` : "条件を選択してください"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        全{ALL_WORDS.length}語収録 ・ IPA基本情報技術者試験シラバス準拠
      </p>
    </div>
  );
}
