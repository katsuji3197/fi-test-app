"use client";

import { useEffect, useReducer, useRef } from "react";
import type { AnsweredRecord, QuizStats, WordEntry } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import {
  DIFFICULTY_BADGE_CLASSES,
  DIFFICULTY_LABELS,
  generateChoices,
} from "@/lib/quiz";
import { createInitialSessionState, quizReducer } from "@/lib/quizReducer";
import StatsBar from "./StatsBar";

interface QuizScreenProps {
  words: WordEntry[];
  sourcePool: WordEntry[];
  onFinish: (stats: QuizStats, history: AnsweredRecord[]) => void;
  onAbort: () => void;
}

export default function QuizScreen({
  words,
  sourcePool,
  onFinish,
  onAbort,
}: QuizScreenProps) {
  const [state, dispatch] = useReducer(
    quizReducer,
    words,
    createInitialSessionState
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.finished) {
      onFinish(state.stats, state.history);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished]);

  useEffect(() => {
    if (state.question.status === "answering" && state.question.answerMode === "free") {
      inputRef.current?.focus();
    }
  }, [state.currentIndex, state.question.status, state.question.answerMode]);

  if (state.finished || words.length === 0) {
    return null;
  }

  const currentWord = state.words[state.currentIndex];
  const category = getCategoryById(currentWord.categoryId);
  const isLastQuestion = state.currentIndex + 1 >= state.words.length;
  const { question } = state;
  const isAnswering = question.status === "answering";

  function handleSubmitFreeText(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "SUBMIT_FREE_TEXT" });
  }

  function handleSubmitChoice(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "SUBMIT_CHOICE" });
  }

  function handleSelectAnswerMode(mode: "free" | "choice") {
    if (mode === "choice") {
      const choices =
        question.choices ?? generateChoices(currentWord, sourcePool);
      dispatch({ type: "SET_ANSWER_MODE", mode: "choice", choices });
      return;
    }
    dispatch({ type: "SET_ANSWER_MODE", mode: "free" });
  }

  function handleAbort() {
    if (window.confirm("学習を中断して設定画面に戻りますか？(記録は保存されません)")) {
      onAbort();
    }
  }

  const progressPercent = Math.round(
    ((state.currentIndex + (isAnswering ? 0 : 1)) / state.words.length) * 100
  );

  const outcomeMeta = {
    correct: {
      label: "正解！",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    },
    incorrect: {
      label: "不正解",
      className: "bg-rose-50 text-rose-700 ring-rose-600/20",
    },
    giveup: {
      label: "ギブアップ",
      className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
  } as const;

  const isCorrect = !isAnswering && question.outcome === "correct";

  return (
    <>
      {isCorrect && (
        <div
          key={state.currentIndex}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          aria-hidden
        >
          <div className="correct-effect-circle flex h-44 w-44 items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-500/40 sm:h-52 sm:w-52">
            <span className="text-3xl font-bold text-white sm:text-4xl">
              正解！
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">
          第 {state.currentIndex + 1} 問 / 全 {state.words.length} 問
        </p>
        <button
          type="button"
          onClick={handleAbort}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          学習を中断する
        </button>
      </div>

      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mb-5">
        <StatsBar stats={state.stats} />
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
            {category?.name ?? currentWord.categoryId}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
              DIFFICULTY_BADGE_CLASSES[currentWord.difficulty]
            }`}
          >
            {DIFFICULTY_LABELS[currentWord.difficulty]}
          </span>
        </div>

        <p className="text-lg font-semibold leading-relaxed text-slate-900">
          {currentWord.question}
        </p>

        {isAnswering && (
          <div className="mt-6">
            <div
              role="tablist"
              aria-label="回答方法"
              className="flex rounded-lg border border-slate-200 bg-slate-100 p-1"
            >
              {(
                [
                  { mode: "free" as const, label: "自由記述" },
                  { mode: "choice" as const, label: "4択" },
                ] as const
              ).map(({ mode, label }) => {
                const isActive = question.answerMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelectAnswerMode(mode)}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {question.answerMode === "free" ? (
              <form onSubmit={handleSubmitFreeText} className="mt-4 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={question.freeTextValue}
                  onChange={(e) =>
                    dispatch({ type: "UPDATE_FREE_TEXT", text: e.target.value })
                  }
                  placeholder="用語を入力して回答"
                  className="min-w-0 flex-1 rounded-lg border bg-white border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  disabled={!question.freeTextValue.trim()}
                  className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  回答する
                </button>
              </form>
            ) : (
              question.choices && (
                <form onSubmit={handleSubmitChoice} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {question.choices.map((choice) => {
                      const isSelected = question.selectedChoice === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            dispatch({ type: "SELECT_CHOICE", choice })
                          }
                          className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200"
                              : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50"
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="submit"
                    disabled={!question.selectedChoice}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    回答する
                  </button>
                </form>
              )
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_HINT" })}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
              >
                {question.hintVisible ? "ヒントを閉じる" : "ヒントを見る"}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "GIVE_UP" })}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                ギブアップ
              </button>
            </div>

            {question.hintVisible && (
              <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                <span className="font-semibold">ヒント：</span>
                {currentWord.hint}
              </div>
            )}
          </div>
        )}

        {!isAnswering && question.outcome && (
          <div className="mt-6 space-y-4">
            <div
              className={`flex items-center justify-between rounded-lg px-4 py-3 ring-1 ring-inset ${
                outcomeMeta[question.outcome].className
              }`}
            >
              <span className="text-sm font-bold">
                {outcomeMeta[question.outcome].label}
              </span>
              <span className="text-sm text-slate-600">
                {question.method === "free" && question.userAnswerText && (
                  <>あなたの回答：{question.userAnswerText}</>
                )}
                {question.method === "choice" && question.selectedChoice && (
                  <>選択した回答：{question.selectedChoice}</>
                )}
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
              <p className="text-sm text-slate-500">正解</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">
                {currentWord.term}
              </p>
              {currentWord.aliases.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  別解: {currentWord.aliases.join(" / ")}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-indigo-50 px-4 py-3.5 ring-1 ring-inset ring-indigo-100">
              <p className="text-sm font-semibold text-indigo-700">解説</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {currentWord.explanation}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dispatch({ type: "NEXT_QUESTION" })}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              {isLastQuestion ? "結果を見る" : "次の問題へ"}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
