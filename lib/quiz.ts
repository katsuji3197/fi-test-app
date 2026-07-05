import type { Difficulty, WordEntry } from "./types";

/** 表記ゆれを吸収するための正規化(全角/半角統一・大文字小文字統一・空白/中黒除去) */
export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s　]/g, "")
    .replace(/[・･·]/g, "")
    .replace(/[ー−―‐]/g, "-")
    .trim();
}

/** 自由記述の回答が正解(term またはaliasesのいずれか)と一致するか判定する */
export function isAnswerCorrect(input: string, word: WordEntry): boolean {
  const normalizedInput = normalizeAnswer(input);
  if (!normalizedInput) return false;
  const candidates = [word.term, ...word.aliases];
  return candidates.some((candidate) => normalizeAnswer(candidate) === normalizedInput);
}

/** Fisher-Yatesシャッフル(非破壊) */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 4択の選択肢を生成する。可能な限り同じ中分類から誤答(ダミー)を選び、
 * 不足する場合は出題プール全体から補う。
 */
export function generateChoices(word: WordEntry, pool: WordEntry[]): string[] {
  const isSameTerm = (candidateTerm: string) =>
    normalizeAnswer(candidateTerm) === normalizeAnswer(word.term);

  const sameCategory = pool.filter(
    (w) => w.categoryId === word.categoryId && !isSameTerm(w.term)
  );
  const others = pool.filter(
    (w) => w.categoryId !== word.categoryId && !isSameTerm(w.term)
  );

  const distractors: string[] = [];
  const usedTerms = new Set<string>();

  for (const candidate of shuffle(sameCategory)) {
    if (distractors.length >= 3) break;
    const normalized = normalizeAnswer(candidate.term);
    if (usedTerms.has(normalized)) continue;
    usedTerms.add(normalized);
    distractors.push(candidate.term);
  }

  if (distractors.length < 3) {
    for (const candidate of shuffle(others)) {
      if (distractors.length >= 3) break;
      const normalized = normalizeAnswer(candidate.term);
      if (usedTerms.has(normalized)) continue;
      usedTerms.add(normalized);
      distractors.push(candidate.term);
    }
  }

  return shuffle([word.term, ...distractors]);
}

/** 難易度・中分類での絞り込みに合致する単語一覧を取得する */
export function filterWords(
  allWords: WordEntry[],
  difficulties: Set<Difficulty>,
  categoryIds: Set<string>
): WordEntry[] {
  return allWords.filter(
    (w) => difficulties.has(w.difficulty) && categoryIds.has(w.categoryId)
  );
}

/**
 * 出題数の選択肢を10問刻みで生成する。
 * 利用可能な単語数を超えない範囲で 10, 20, 30... と刻み、
 * 端数がある場合は最後に「全問(availableCount問)」を追加する。
 */
export function buildQuestionCountOptions(availableCount: number): number[] {
  if (availableCount <= 0) return [];
  if (availableCount < 10) return [availableCount];

  const options: number[] = [];
  for (let n = 10; n <= availableCount; n += 10) {
    options.push(n);
  }
  if (options[options.length - 1] !== availableCount) {
    options.push(availableCount);
  }
  return options;
}

/** 出題する単語をランダムに指定数だけ抽出する */
export function pickQuizWords(pool: WordEntry[], count: number): WordEntry[] {
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "やさしい",
  medium: "ふつう",
  hard: "むずかしい",
};

export const DIFFICULTY_BADGE_CLASSES: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  medium: "bg-amber-100 text-amber-700 ring-amber-600/20",
  hard: "bg-rose-100 text-rose-700 ring-rose-600/20",
};
