import { getCategoryById } from "./categories";
import type { Difficulty, QuestionOutcome } from "./types";

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

export type CategoryResult = {
  correct: number;
  incorrect: number;
  giveUp: number;
};

export type QuizHistoryEntry = {
  finishedAt: string;
  questionCount: number;
  correctCount: number;
  incorrectCount: number;
  giveUpCount: number;
  difficulties: Difficulty[];
  categoryCount: number;
  /** 無い場合は古い記録。分野別のやり直し対象にはしない */
  categories?: Record<string, CategoryResult>;
};

/** 1〜2問だと正答率が偶然で決まるので、5問以上の分野だけを比べる */
export const MIN_CATEGORY_ANSWERS = 5;

export type WeakestCategory = {
  categoryId: string;
  name: string;
};

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function readCategories(value: unknown): Record<string, CategoryResult> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const categories: Record<string, CategoryResult> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!id || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const counts = raw as Record<string, unknown>;
    if (!isCount(counts.correct) || !isCount(counts.incorrect) || !isCount(counts.giveUp)) {
      continue;
    }
    if (counts.correct + counts.incorrect + counts.giveUp === 0) continue;
    categories[id] = {
      correct: counts.correct,
      incorrect: counts.incorrect,
      giveUp: counts.giveUp,
    };
  }
  return Object.keys(categories).length > 0 ? categories : undefined;
}

function isEntry(value: unknown): value is QuizHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.finishedAt === "string" &&
    !Number.isNaN(Date.parse(entry.finishedAt)) &&
    Number.isFinite(entry.questionCount) &&
    Number.isFinite(entry.correctCount) &&
    Number.isFinite(entry.incorrectCount) &&
    Number.isFinite(entry.giveUpCount) &&
    Number.isFinite(entry.categoryCount) &&
    Array.isArray(entry.difficulties) &&
    entry.difficulties.every(isDifficulty)
  );
}

export function categoryResults(
  records: { word: { categoryId: string }; outcome: QuestionOutcome }[]
): Record<string, CategoryResult> {
  const categories: Record<string, CategoryResult> = {};
  for (const record of records) {
    const id = record.word.categoryId;
    const bucket = categories[id] ?? { correct: 0, incorrect: 0, giveUp: 0 };
    if (record.outcome === "correct") bucket.correct += 1;
    else if (record.outcome === "incorrect") bucket.incorrect += 1;
    else bucket.giveUp += 1;
    categories[id] = bucket;
  }
  return categories;
}

export function parseHistory(raw: string): QuizHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries: QuizHistoryEntry[] = [];
    for (const item of parsed) {
      if (!isEntry(item)) continue;
      const categories = readCategories(item.categories);
      entries.push(categories ? { ...item, categories } : { ...item, categories: undefined });
      if (entries.length >= MAX_ENTRIES) break;
    }
    return entries;
  } catch {
    return [];
  }
}

export function weakestCategory(entries: QuizHistoryEntry[]): WeakestCategory | null {
  const totals = new Map<string, { correct: number; total: number; latest: number }>();
  entries.forEach((entry, index) => {
    if (!entry.categories) return;
    const recency = entries.length - index;
    for (const [id, counts] of Object.entries(entry.categories)) {
      const total = counts.correct + counts.incorrect + counts.giveUp;
      if (total <= 0) continue;
      const current = totals.get(id) ?? { correct: 0, total: 0, latest: 0 };
      current.correct += counts.correct;
      current.total += total;
      current.latest = Math.max(current.latest, recency);
      totals.set(id, current);
    }
  });

  let selected: { id: string; accuracy: number; total: number; latest: number } | null = null;
  for (const [id, stat] of totals) {
    if (stat.total < MIN_CATEGORY_ANSWERS) continue;
    if (!getCategoryById(id)) continue;
    const accuracy = stat.correct / stat.total;
    const better =
      !selected ||
      accuracy < selected.accuracy ||
      (accuracy === selected.accuracy && stat.total > selected.total) ||
      (accuracy === selected.accuracy &&
        stat.total === selected.total &&
        stat.latest > selected.latest);
    if (better) selected = { id, accuracy, total: stat.total, latest: stat.latest };
  }
  if (!selected) return null;
  const category = getCategoryById(selected.id);
  return category ? { categoryId: category.id, name: category.name } : null;
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
