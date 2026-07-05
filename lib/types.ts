/**
 * 基本情報技術者試験 単語学習アプリのデータ型定義
 */

export type Difficulty = "easy" | "medium" | "hard";

export type MajorCategoryId = "technology" | "management" | "strategy";

/** シラバスの中分類 */
export interface Category {
  /** カテゴリの一意なID */
  id: string;
  /** 大分類ID */
  majorCategoryId: MajorCategoryId;
  /** 大分類名(表示用) */
  majorCategoryName: string;
  /** 大分類の通し番号(シラバス準拠) */
  majorCategoryNumber: number;
  /** 中分類名(表示用) */
  name: string;
  /** 中分類の通し番号(シラバス準拠) */
  categoryNumber: number;
}

/** 単語(問題)エントリ */
export interface WordEntry {
  /** 一意なID (例: "security-014") */
  id: string;
  /** 所属する中分類ID */
  categoryId: string;
  /** 難易度 */
  difficulty: Difficulty;
  /** 正答となる用語 (略語の場合は略語表記) */
  term: string;
  /** 許容される別解表記 (略語の正式名称、日本語訳、表記ゆれなど) */
  aliases: string[];
  /** 用語を伏せた問題文(説明文) */
  question: string;
  /** ヒント文 */
  hint: string;
  /** 解説文。略語は正式名称(英語表記+日本語訳)を必ず併記する */
  explanation: string;
}

/** 出題設定 */
export interface QuizSettings {
  difficulties: Set<Difficulty>;
  categoryIds: Set<string>;
  questionCount: number;
}

/** 解答方法 */
export type AnswerMethod = "free" | "choice";

/** 1問ごとの結果 */
export type QuestionOutcome = "correct" | "incorrect" | "giveup";

/** 解答済み問題の記録 */
export interface AnsweredRecord {
  word: WordEntry;
  outcome: QuestionOutcome;
  method: AnswerMethod | null;
  userAnswer: string | null;
}

/** クイズ全体の集計 */
export interface QuizStats {
  correctFree: number;
  correctChoice: number;
  incorrect: number;
  giveUp: number;
}

export function createEmptyStats(): QuizStats {
  return { correctFree: 0, correctChoice: 0, incorrect: 0, giveUp: 0 };
}
