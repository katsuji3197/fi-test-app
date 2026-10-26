"use client";

import { useCallback, useState } from "react";
import type { AnsweredRecord, QuizSettings, QuizStats, WordEntry } from "@/lib/types";
import { ALL_WORDS } from "@/lib/words";
import { filterWords, pickQuizWords } from "@/lib/quiz";
import { saveHistoryEntry } from "@/lib/history";
import SetupScreen from "./SetupScreen";
import QuizScreen from "./QuizScreen";
import ResultScreen from "./ResultScreen";

type Screen = "setup" | "quiz" | "result";

interface RunState {
  settings: QuizSettings;
  sourcePool: WordEntry[];
  quizWords: WordEntry[];
  isRetry: boolean;
}

export default function QuizApp() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [run, setRun] = useState<RunState | null>(null);
  const [resultData, setResultData] = useState<{
    stats: QuizStats;
    history: AnsweredRecord[];
  } | null>(null);
  // key を変えて QuizScreen を強制的に再マウントし、内部状態をリセットする
  const [runKey, setRunKey] = useState(0);

  const startWithSettings = useCallback((settings: QuizSettings) => {
    const sourcePool = filterWords(ALL_WORDS, settings.difficulties, settings.categoryIds);
    const quizWords = pickQuizWords(sourcePool, settings.questionCount);
    setRun({ settings, sourcePool, quizWords, isRetry: false });
    setRunKey((k) => k + 1);
    setScreen("quiz");
  }, []);

  const handleFinish = useCallback((stats: QuizStats, history: AnsweredRecord[]) => {
    if (run && !run.isRetry) {
      saveHistoryEntry({
        finishedAt: new Date().toISOString(),
        questionCount: history.length,
        correctCount: stats.correctFree + stats.correctChoice,
        incorrectCount: stats.incorrect,
        giveUpCount: stats.giveUp,
        difficulties: [...run.settings.difficulties],
        categoryCount: run.settings.categoryIds.size,
      });
    }
    setResultData({ stats, history });
    setScreen("result");
  }, [run]);

  const handleBackToSetup = useCallback(() => {
    setScreen("setup");
  }, []);

  const handleRetryMistakes = useCallback((words: WordEntry[]) => {
    if (!run || words.length === 0) return;
    setRun({ ...run, quizWords: pickQuizWords(words, words.length), isRetry: true });
    setRunKey((k) => k + 1);
    setScreen("quiz");
  }, [run]);

  const handleRestartSame = useCallback(() => {
    if (!run) return;
    startWithSettings(run.settings);
  }, [run, startWithSettings]);

  return (
    <div className="min-h-full">
      {screen === "setup" && <SetupScreen onStart={startWithSettings} />}
      {screen === "quiz" && run && (
        <QuizScreen
          key={runKey}
          words={run.quizWords}
          sourcePool={run.sourcePool}
          onFinish={handleFinish}
          onAbort={handleBackToSetup}
        />
      )}
      {screen === "result" && resultData && (
        <ResultScreen
          stats={resultData.stats}
          history={resultData.history}
          onRestartSame={handleRestartSame}
          onRetryMistakes={handleRetryMistakes}
          onBackToSetup={handleBackToSetup}
          isRetry={run?.isRetry ?? false}
        />
      )}
    </div>
  );
}
