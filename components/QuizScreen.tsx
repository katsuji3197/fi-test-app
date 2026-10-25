"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { AnsweredRecord, QuizStats, WordEntry } from "@/lib/types";
import { getCategoryById } from "@/lib/categories";
import {
  DIFFICULTY_BADGE_CLASSES,
  DIFFICULTY_LABELS,
  generateChoices,
  normalizeAnswer,
} from "@/lib/quiz";
import { createInitialSessionState, quizReducer } from "@/lib/quizReducer";
import StatsBar from "./StatsBar";
import Button, { focusRing } from "./ui/Button";

interface QuizScreenProps {
  words: WordEntry[];
  sourcePool: WordEntry[];
  onFinish: (stats: QuizStats, history: AnsweredRecord[]) => void;
  onAbort: () => void;
}

const ANSWER_MODES = [
  { mode: "free" as const, label: "自由記述" },
  { mode: "choice" as const, label: "4択" },
];

function choiceIndexFromKey(event: KeyboardEvent): number | null {
  if (event.key >= "1" && event.key <= "4") return Number(event.key) - 1;
  const numpad = /^Numpad([1-4])$/.exec(event.code);
  return numpad ? Number(numpad[1]) - 1 : null;
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
  const [confirmAbort, setConfirmAbort] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const abortButtonRef = useRef<HTMLButtonElement>(null);
  const wasAbortOpenRef = useRef(false);
  const modeRefs = useRef<Partial<Record<"free" | "choice", HTMLButtonElement | null>>>({});
  // 1〜4 の直後の Enter が、effect の再購読より先に届いても選択を見失わないようにする
  const selectedChoiceRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.finished) {
      onFinish(state.stats, state.history);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished]);

  useEffect(() => {
    const q = state.questionStates[state.currentIndex];
    if (q?.status === "answering" && q.answerMode === "free") {
      inputRef.current?.focus();
    }
    // 回答確定で入力欄が消えるとフォーカスが body に落ち、Enter で次へ進めなくなる
    if (q?.status === "resolved") {
      nextButtonRef.current?.focus();
    }
  }, [state.currentIndex, state.questionStates]);

  useEffect(() => {
    if (confirmAbort) {
      continueRef.current?.focus();
    } else if (wasAbortOpenRef.current) {
      // 続ける / Esc / 背景クリックのあと、開いたボタンへ戻す。
      // focusVisible はキーボード操作のリングを残すため（DOM 型には未収録）
      abortButtonRef.current?.focus({ focusVisible: true } as FocusOptions);
    }
    wasAbortOpenRef.current = confirmAbort;
  }, [confirmAbort]);

  useEffect(() => {
    selectedChoiceRef.current =
      state.questionStates[state.currentIndex]?.selectedChoice ?? null;

    function onKeyDown(event: KeyboardEvent) {
      if (confirmAbort) return;
      const question = state.questionStates[state.currentIndex];
      if (!question || question.status !== "answering" || question.answerMode !== "choice") {
        return;
      }
      const choices = question.choices;
      if (!choices) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const index = choiceIndexFromKey(event);
      if (index !== null) {
        const choice = choices[index];
        if (!choice) return;
        event.preventDefault();
        selectedChoiceRef.current = choice;
        dispatch({ type: "SELECT_CHOICE", choice });
        return;
      }

      if (event.key !== "Enter" || !selectedChoiceRef.current) return;
      if (target instanceof HTMLButtonElement) {
        // 選択肢以外（radio・ナビ・ヒント等）はボタン本来の Enter に任せる
        if (!target.hasAttribute("data-choice")) return;
        // まだ選ばれていない選択肢の Enter は「選択」だけにする
        if (target.getAttribute("aria-pressed") !== "true") return;
      }
      event.preventDefault();
      dispatch({ type: "SUBMIT_CHOICE" });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmAbort, state]);

  if (state.finished || words.length === 0) {
    return null;
  }

  const currentWord = state.words[state.currentIndex];
  const category = getCategoryById(currentWord.categoryId);
  const isLastQuestion = state.currentIndex + 1 >= state.words.length;
  const question = state.questionStates[state.currentIndex];
  const isAnswering = question.status === "answering";
  const canGoPrev = state.currentIndex > 0;
  const canGoNext =
    state.currentIndex < state.visitedMaxIndex ||
    (state.currentIndex === state.visitedMaxIndex && !isAnswering);

  function handleSubmitFreeText(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "SUBMIT_FREE_TEXT" });
  }

  function handleSubmitChoice(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "SUBMIT_CHOICE" });
  }

  function handleSelectAnswerMode(mode: "free" | "choice") {
    // すでに有効な回答方法をもう一度押しても、選んだ選択肢を消さない
    if (mode === question.answerMode) return;
    if (mode === "choice") {
      const choices = question.choices ?? generateChoices(currentWord, sourcePool);
      dispatch({ type: "SET_ANSWER_MODE", mode: "choice", choices });
      return;
    }
    dispatch({ type: "SET_ANSWER_MODE", mode: "free" });
  }

  function handleModeKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = question.answerMode === "free" ? "choice" : "free";
    handleSelectAnswerMode(next);
    requestAnimationFrame(() => modeRefs.current[next]?.focus());
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setConfirmAbort(false);
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const frontierQuestion = state.questionStates[state.visitedMaxIndex];
  const progressPercent = Math.round(
    ((state.visitedMaxIndex + (frontierQuestion?.status === "resolved" ? 1 : 0)) /
      state.words.length) *
      100
  );

  const outcomeMeta = {
    correct: {
      label: "正解！",
      className: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-800",
    },
    incorrect: {
      label: "不正解",
      className: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-rose-600/20 dark:ring-rose-800",
    },
    giveup: {
      label: "ギブアップ",
      className: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 ring-amber-600/20 dark:ring-amber-800",
    },
  } as const;

  const showCorrectEffect =
    state.pendingCorrectEffectIndex === state.currentIndex &&
    question.outcome === "correct";
  const showIncorrectShake =
    state.pendingIncorrectShakeIndex === state.currentIndex &&
    question.outcome === "incorrect";

  const navButtonClass = `flex size-11 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${focusRing}`;

  return (
    <>
      {showCorrectEffect && (
        <div
          key={state.currentIndex}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          aria-hidden
        >
          <div className="correct-effect-circle flex h-44 w-44 items-center justify-center rounded-full bg-emerald-500 shadow-lg dark:bg-emerald-950 dark:shadow-none sm:h-52 sm:w-52">
            <span className="text-3xl font-bold text-white dark:text-emerald-300 sm:text-4xl">正解！</span>
          </div>
        </div>
      )}

      {confirmAbort && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center dark:bg-slate-950/60"
          onClick={() => setConfirmAbort(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="abort-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-800 p-5 shadow-lg dark:shadow-none"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleDialogKeyDown}
          >
            <h2 id="abort-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              学習を中断しますか？
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              設定画面に戻ります。この回の結果は残りません。
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                ref={continueRef}
                size="lg"
                className="w-full flex-1"
                onClick={() => setConfirmAbort(false)}
              >
                続ける
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full flex-1"
                onClick={onAbort}
              >
                中断する
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => dispatch({ type: "PREV_QUESTION" })}
              disabled={!canGoPrev}
              aria-label="前の問題を表示"
              className={navButtonClass}
            >
              <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <p className="min-w-[8.5rem] text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
              第 {state.currentIndex + 1} 問 / 全 {state.words.length} 問
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: "NAV_NEXT" })}
              disabled={!canGoNext}
              aria-label="次の問題を表示"
              className={navButtonClass}
            >
              <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <Button
            ref={abortButtonRef}
            variant="ghost"
            size="md"
            className="shrink-0 px-2 text-xs"
            onClick={() => setConfirmAbort(true)}
          >
            学習を中断する
          </Button>
        </div>

        <div
          role="progressbar"
          aria-label="進捗"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-valuetext={`${progressPercent}%`}
          className="mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        >
          <div
            className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 motion-safe:transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-200 dark:ring-slate-500">
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

          <p className="text-lg font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
            {currentWord.question}
          </p>

          {isAnswering && (
            <div className="mt-6">
              <div
                role="radiogroup"
                aria-label="回答方法"
                className="flex rounded-lg border border-slate-200 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 p-1"
                onKeyDown={handleModeKeyDown}
              >
                {ANSWER_MODES.map(({ mode, label }) => {
                  const isActive = question.answerMode === mode;
                  return (
                    <button
                      key={mode}
                      ref={(node) => {
                        modeRefs.current[mode] = node;
                      }}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => handleSelectAnswerMode(mode)}
                      className={`min-h-11 flex-1 rounded-md px-4 text-sm font-semibold transition-colors ${focusRing} ${
                        isActive
                          ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-500"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"
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
                    aria-label="回答"
                    className={`min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 ${focusRing}`}
                  />
                  <Button type="submit" disabled={!question.freeTextValue.trim()}>
                    回答する
                  </Button>
                </form>
              ) : (
                question.choices && (
                  <form onSubmit={handleSubmitChoice} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {question.choices.map((choice, index) => {
                        const isSelected = question.selectedChoice === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            data-choice=""
                            aria-pressed={isSelected}
                            onClick={() => dispatch({ type: "SELECT_CHOICE", choice })}
                            className={`min-h-12 rounded-lg border px-4 py-3 text-left text-base font-medium transition-colors ${focusRing} ${
                              isSelected
                                ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 ring-2 ring-indigo-200 dark:ring-indigo-700"
                                : "border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                            }`}
                          >
                            <span className="mr-2 text-slate-500 dark:text-slate-400 tabular-nums">{index + 1}.</span>
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                    <Button type="submit" disabled={!question.selectedChoice} className="w-full">
                      回答する
                    </Button>
                  </form>
                )
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "TOGGLE_HINT" })}
                  className={`min-h-11 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 text-sm font-semibold text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900 ${focusRing}`}
                >
                  {question.hintVisible ? "ヒントを閉じる" : "ヒントを見る"}
                </button>
                <Button variant="secondary" onClick={() => dispatch({ type: "GIVE_UP" })}>
                  ギブアップ
                </Button>
              </div>

              {question.hintVisible && (
                <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 ring-1 ring-inset ring-amber-200 dark:ring-amber-800">
                  <span className="font-semibold">ヒント：</span>
                  {currentWord.hint}
                </div>
              )}
            </div>
          )}

          {!isAnswering && question.outcome && (
            <div className="mt-6 space-y-4">
              <div
                role="status"
                className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-4 py-3 ring-1 ring-inset ${
                  outcomeMeta[question.outcome].className
                } ${showIncorrectShake ? "incorrect-shake" : ""}`}
              >
                <span className="text-sm font-bold">{outcomeMeta[question.outcome].label}</span>
                {question.method === "free" && question.userAnswerText && (
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    あなたの回答：{question.userAnswerText}
                  </span>
                )}
              </div>

              {question.method === "choice" && question.choices && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="選択肢の結果">
                  {question.choices.map((choice) => {
                    const isCorrect =
                      normalizeAnswer(choice) === normalizeAnswer(currentWord.term);
                    const isMine =
                      question.selectedChoice != null &&
                      normalizeAnswer(question.selectedChoice) === normalizeAnswer(choice);
                    const isWrongPick = isMine && !isCorrect;
                    return (
                      <div
                        key={choice}
                        className={`flex min-h-12 items-center justify-between gap-2 rounded-lg border px-4 py-3 text-base font-medium ${
                          isCorrect
                            ? "border-emerald-500 dark:border-emerald-300 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200"
                            : isWrongPick
                              ? "border-rose-400 dark:border-rose-300 bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200"
                              : "border-slate-200 dark:border-slate-500 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span>{choice}</span>
                        {isCorrect && (
                          <span className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            ✓<span className="sr-only">正解</span>
                          </span>
                        )}
                        {isWrongPick && (
                          <span className="shrink-0 text-sm font-bold text-rose-700 dark:text-rose-300">
                            ✗<span className="sr-only">あなたの回答</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {question.method === "choice" ? (
                currentWord.aliases.length > 0 && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-800 px-4 py-3.5">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      別解：{currentWord.aliases.join(" / ")}
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-800 px-4 py-3.5">
                  <p className="text-sm text-slate-600 dark:text-slate-300">正解</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{currentWord.term}</p>
                  {currentWord.aliases.length > 0 && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      別解：{currentWord.aliases.join(" / ")}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 px-4 py-3.5 ring-1 ring-inset ring-indigo-100 dark:ring-indigo-800">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">解説</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {currentWord.explanation}
                </p>
              </div>

              <Button
                ref={nextButtonRef}
                size="lg"
                onClick={() => dispatch({ type: "NEXT_QUESTION" })}
                className="w-full"
              >
                {isLastQuestion ? "結果を見る" : "次の問題へ"}
              </Button>
            </div>
          )}
        </div>

        {/* 集計は問題文より下に置き、回答そのものを先に見せる */}
        <div className="mt-10">
          <StatsBar stats={state.stats} />
        </div>
      </div>
    </>
  );
}
