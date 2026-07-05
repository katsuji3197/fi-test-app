import type {
  AnsweredRecord,
  AnswerMethod,
  QuestionOutcome,
  QuizStats,
  WordEntry,
} from "./types";
import { createEmptyStats } from "./types";
import { isAnswerCorrect, normalizeAnswer } from "./quiz";

export interface CurrentQuestionState {
  status: "answering" | "resolved";
  hintVisible: boolean;
  choices: string[] | null;
  freeTextValue: string;
  outcome: QuestionOutcome | null;
  method: AnswerMethod | null;
  selectedChoice: string | null;
  userAnswerText: string | null;
}

export interface QuizSessionState {
  words: WordEntry[];
  currentIndex: number;
  stats: QuizStats;
  history: AnsweredRecord[];
  question: CurrentQuestionState;
  finished: boolean;
}

function freshQuestionState(): CurrentQuestionState {
  return {
    status: "answering",
    hintVisible: false,
    choices: null,
    freeTextValue: "",
    outcome: null,
    method: null,
    selectedChoice: null,
    userAnswerText: null,
  };
}

export function createInitialSessionState(words: WordEntry[]): QuizSessionState {
  return {
    words,
    currentIndex: 0,
    stats: createEmptyStats(),
    history: [],
    question: freshQuestionState(),
    finished: words.length === 0,
  };
}

export type QuizAction =
  | { type: "UPDATE_FREE_TEXT"; text: string }
  | { type: "SUBMIT_FREE_TEXT" }
  | { type: "SHOW_HINT" }
  | { type: "SHOW_CHOICES"; choices: string[] }
  | { type: "SELECT_CHOICE"; choice: string }
  | { type: "GIVE_UP" }
  | { type: "NEXT_QUESTION" };

function resolve(
  state: QuizSessionState,
  outcome: QuestionOutcome,
  method: AnswerMethod | null,
  userAnswerText: string | null,
  extra: Partial<CurrentQuestionState> = {}
): QuizSessionState {
  const currentWord = state.words[state.currentIndex];
  const nextStats: QuizStats = { ...state.stats };
  if (outcome === "correct" && method === "free") nextStats.correctFree += 1;
  if (outcome === "correct" && method === "choice") nextStats.correctChoice += 1;
  if (outcome === "incorrect") nextStats.incorrect += 1;
  if (outcome === "giveup") nextStats.giveUp += 1;

  const record: AnsweredRecord = {
    word: currentWord,
    outcome,
    method,
    userAnswer: userAnswerText,
  };

  return {
    ...state,
    stats: nextStats,
    history: [...state.history, record],
    question: {
      ...state.question,
      ...extra,
      status: "resolved",
      outcome,
      method,
      userAnswerText,
    },
  };
}

export function quizReducer(
  state: QuizSessionState,
  action: QuizAction
): QuizSessionState {
  if (state.finished) return state;
  const currentWord = state.words[state.currentIndex];

  switch (action.type) {
    case "UPDATE_FREE_TEXT": {
      if (state.question.status !== "answering") return state;
      return { ...state, question: { ...state.question, freeTextValue: action.text } };
    }
    case "SUBMIT_FREE_TEXT": {
      if (state.question.status !== "answering") return state;
      const text = state.question.freeTextValue.trim();
      if (!text) return state;
      const correct = isAnswerCorrect(text, currentWord);
      return resolve(state, correct ? "correct" : "incorrect", "free", text);
    }
    case "SHOW_HINT": {
      if (state.question.status !== "answering") return state;
      return { ...state, question: { ...state.question, hintVisible: true } };
    }
    case "SHOW_CHOICES": {
      if (state.question.status !== "answering" || state.question.choices) return state;
      return { ...state, question: { ...state.question, choices: action.choices } };
    }
    case "SELECT_CHOICE": {
      if (state.question.status !== "answering") return state;
      const correct =
        normalizeAnswer(action.choice) === normalizeAnswer(currentWord.term);
      return resolve(state, correct ? "correct" : "incorrect", "choice", action.choice, {
        selectedChoice: action.choice,
      });
    }
    case "GIVE_UP": {
      if (state.question.status !== "answering") return state;
      return resolve(state, "giveup", null, null);
    }
    case "NEXT_QUESTION": {
      if (state.question.status !== "resolved") return state;
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.words.length) {
        return { ...state, finished: true };
      }
      return { ...state, currentIndex: nextIndex, question: freshQuestionState() };
    }
    default:
      return state;
  }
}
