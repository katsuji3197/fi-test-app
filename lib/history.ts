import type { Difficulty } from "./types";

/** 壊れた古いデータと区別するためのキー。中身の形を変えたら数字を上げる */
export const HISTORY_STORAGE_KEY = "fi-test-app.history.v1";

const MAX_ENTRIES = 20;
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const CHANGE_EVENT = "fi-history-change";

function notifyHistoryChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeHistory(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readHistorySnapshot(): string {
  try {
    return window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export type QuizHistoryEntry = {
  finishedAt: string;
  questionCount: number;
  correctCount: number;
  incorrectCount: number;
  giveUpCount: number;
  difficulties: Difficulty[];
  categoryCount: number;
};

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);
}

function isEntry(value: unknown): value is QuizHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.finishedAt === "string" &&
    Number.isFinite(entry.questionCount) &&
    Number.isFinite(entry.correctCount) &&
    Number.isFinite(entry.incorrectCount) &&
    Number.isFinite(entry.giveUpCount) &&
    Number.isFinite(entry.categoryCount) &&
    Array.isArray(entry.difficulties) &&
    entry.difficulties.every(isDifficulty)
  );
}

export function parseHistory(raw: string): QuizHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function loadHistory(): QuizHistoryEntry[] {
  try {
    return parseHistory(readHistorySnapshot());
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: QuizHistoryEntry): boolean {
  try {
    const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
    notifyHistoryChange();
    return true;
  } catch {
    return false;
  }
}

export function clearHistory(): boolean {
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    notifyHistoryChange();
    return true;
  } catch {
    return false;
  }
}
