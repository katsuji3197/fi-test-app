"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, MAJOR_CATEGORY_ORDER } from "@/lib/categories";
import { ALL_WORDS } from "@/lib/words";
import type { Difficulty, QuizSettings } from "@/lib/types";
import { DIFFICULTY_LABELS, buildQuestionCountOptions, filterWords } from "@/lib/quiz";
import Button, { focusRing } from "./ui/Button";

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
    if ((categoryCounts.get(id) ?? 0) === 0) return;
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
  const sliderIndex = Math.max(0, questionCountOptions.indexOf(questionCount));
  const canDecrease = sliderIndex > 0;
  const canIncrease =
    questionCountOptions.length > 0 &&
    sliderIndex < questionCountOptions.length - 1;

  function stepQuestionCount(direction: -1 | 1) {
    const next = questionCountOptions[sliderIndex + direction];
    if (next !== undefined) setSelectedCount(next);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600">
          基本情報技術者試験 対策
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          単語暗記トレーニング
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          出題数・難易度・分野を選んで、自由記述で用語を答えましょう。
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">出題数</h2>
          <p className="mt-1 text-sm text-slate-600">
            現在の条件で出題できる単語は{" "}
            <span className="font-semibold text-indigo-600">{filteredCount}語</span>
            です。スライダー、または左右のボタンで調整できます（10問刻み。最後の1ステップだけ端数になることがあります）。
          </p>
          {questionCountOptions.length > 0 ? (
            <div className="mt-5">
              <div className="flex items-center justify-center gap-3 sm:gap-5">
                <button
                  type="button"
                  onClick={() => stepQuestionCount(-1)}
                  disabled={!canDecrease}
                  aria-label="出題数を減らす"
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl leading-none font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:shadow-none sm:size-12 ${focusRing}`}
                >
                  −
                </button>
                <p className="min-w-24 text-center" aria-live="polite">
                  <span className="text-3xl font-bold tabular-nums text-indigo-600">
                    {questionCount}
                  </span>
                  <span className="ml-1 text-lg font-semibold text-indigo-600">問</span>
                </p>
                <button
                  type="button"
                  onClick={() => stepQuestionCount(1)}
                  disabled={!canIncrease}
                  aria-label="出題数を増やす"
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl leading-none font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:shadow-none sm:size-12 ${focusRing}`}
                >
                  +
                </button>
              </div>
              {questionCountOptions.length > 1 ? (
                <input
                  type="range"
                  min={0}
                  max={questionCountOptions.length - 1}
                  step={1}
                  value={sliderIndex}
                  onChange={(e) =>
                    setSelectedCount(questionCountOptions[Number(e.target.value)])
                  }
                  className="question-count-slider mt-4 w-full"
                  aria-valuemin={questionCountOptions[0]}
                  aria-valuemax={
                    questionCountOptions[questionCountOptions.length - 1]
                  }
                  aria-valuenow={questionCount}
                  aria-valuetext={`${questionCount}問`}
                  aria-label="出題数"
                />
              ) : (
                <div className="mt-4 h-2 rounded-full bg-indigo-100" aria-hidden />
              )}
              <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-500">
                <span>{questionCountOptions[0]}問</span>
                <span>
                  {questionCountOptions[questionCountOptions.length - 1]}問
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-rose-600">
              出題可能な単語がありません。難易度・出題範囲の選択を見直してください。
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">難易度</h2>
          <p className="mt-1 text-sm text-slate-600">
            出題する問題の難易度を選択してください（複数選択可）。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_DIFFICULTIES.map((d) => {
              const selected = difficulties.has(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleDifficulty(d)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${focusRing} ${
                    selected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {selected && <span aria-hidden>✓</span>}
                  {DIFFICULTY_LABELS[d]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                出題範囲（シラバス中分類）
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                学習したい分野を選んでください。
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="md" onClick={selectAllCategories}>
                すべて選択
              </Button>
              <Button variant="secondary" size="md" onClick={clearAllCategories}>
                すべて解除
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {MAJOR_CATEGORY_ORDER.map((major) => {
              const groupCategories = CATEGORIES.filter(
                (c) => c.majorCategoryId === major.id
              );
              const groupIds = groupCategories.map((c) => c.id);
              const selectedCount = groupIds.filter((id) => categoryIds.has(id)).length;
              const allSelected = selectedCount === groupIds.length;

              return (
                <details key={major.id} className="group rounded-xl border border-slate-200">
                  <summary
                    className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2 [&::-webkit-details-marker]:hidden ${focusRing}`}
                  >
                    <span className="text-sm font-semibold text-slate-800">{major.name}</span>
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      {selectedCount}/{groupIds.length} 選択中
                      <svg
                        aria-hidden
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-4 text-slate-500 motion-safe:transition-transform group-open:rotate-180"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-3 pb-3">
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => toggleMajorGroup(groupIds, allSelected)}
                        className={`min-h-11 px-2 text-xs font-medium text-indigo-700 hover:text-indigo-800 ${focusRing}`}
                      >
                        {allSelected ? "全解除" : "全選択"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {groupCategories.map((category) => {
                        const count = categoryCounts.get(category.id) ?? 0;
                        const checked = categoryIds.has(category.id);
                        const empty = count === 0;
                        return (
                          <label
                            key={category.id}
                            className={`flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              empty ? "cursor-not-allowed" : "cursor-pointer"
                            } ${
                              checked
                                ? "border-indigo-200 bg-indigo-50/70 text-slate-800"
                                : "border-slate-200 bg-white text-slate-600"
                            } ${empty ? "opacity-60" : ""}`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={empty}
                                onChange={() => toggleCategory(category.id)}
                                className={`size-4 accent-indigo-600 ${focusRing}`}
                              />
                              {category.name}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-slate-600">
                              {empty ? "この難易度では0語" : `${count}語`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </div>

      {/* 開始ボタンが画面外に出るときは下端へ固定する。収まる高さでは通常の位置のまま */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-slate-200 bg-slate-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0">
        <Button
          size="lg"
          disabled={!canStart}
          onClick={() => onStart({ difficulties, categoryIds, questionCount })}
          className="w-full"
        >
          {canStart ? `${questionCount}問で学習を始める` : "条件を選択してください"}
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        全{ALL_WORDS.length}語収録 ・ IPA基本情報技術者試験シラバス準拠
      </p>
    </div>
  );
}
