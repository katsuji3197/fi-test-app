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
  answerMode: "free" | "choice";
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
  visitedMaxIndex: number;
  stats: QuizStats;
  history: AnsweredRecord[];
  questionStates: CurrentQuestionState[];
  finished: boolean;
  pendingCorrectEffectIndex: number | null;
}

function freshQuestionState(): CurrentQuestionState {
  return {
    status: "answering",
    answerMode: "free",
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
    visitedMaxIndex: 0,
    stats: createEmptyStats(),
    history: [],
    questionStates: words.map(() => freshQuestionState()),
    finished: words.length === 0,
    pendingCorrectEffectIndex: null,
  };
}

export type QuizAction =
  | { type: "UPDATE_FREE_TEXT"; text: string }
  | { type: "SUBMIT_FREE_TEXT" }
  | { type: "TOGGLE_HINT" }
  | { type: "SET_ANSWER_MODE"; mode: "free" | "choice"; choices?: string[] }
  | { type: "SELECT_CHOICE"; choice: string }
  | { type: "SUBMIT_CHOICE" }
  | { type: "GIVE_UP" }
  | { type: "NEXT_QUESTION" }
  | { type: "PREV_QUESTION" }
  | { type: "NAV_NEXT" };

function updateCurrentQuestion(
  state: QuizSessionState,
  updater: (question: CurrentQuestionState) => CurrentQuestionState
): QuizSessionState {
  const questionStates = [...state.questionStates];
  questionStates[state.currentIndex] = updater(
    state.questionStates[state.currentIndex]
  );
  return { ...state, questionStates };
}

function resolve(
  state: QuizSessionState,
  outcome: QuestionOutcome,
  method: AnswerMethod | null,
  userAnswerText: string | null,
  extra: Partial<CurrentQuestionState> = {}
): QuizSessionState {
  const currentWord = state.words[state.currentIndex];
  const currentQuestion = state.questionStates[state.currentIndex];
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

  const questionStates = [...state.questionStates];
  questionStates[state.currentIndex] = {
    ...currentQuestion,
    ...extra,
    status: "resolved",
    outcome,
    method,
    userAnswerText,
  };

  return {
    ...state,
    stats: nextStats,
    history: [...state.history, record],
    questionStates,
    pendingCorrectEffectIndex:
      outcome === "correct" ? state.currentIndex : null,
  };
}

function advanceFromResolved(state: QuizSessionState): QuizSessionState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.words.length) {
    return { ...state, finished: true, pendingCorrectEffectIndex: null };
  }
  return {
    ...state,
    currentIndex: nextIndex,
    visitedMaxIndex: nextIndex,
    pendingCorrectEffectIndex: null,
  };
}

export function quizReducer(
  state: QuizSessionState,
  action: QuizAction
): QuizSessionState {
  if (state.finished) return state;
  const currentWord = state.words[state.currentIndex];
  const question = state.questionStates[state.currentIndex];

  switch (action.type) {
    case "UPDATE_FREE_TEXT": {
      if (question.status !== "answering") return state;
      return updateCurrentQuestion(state, (q) => ({
        ...q,
        freeTextValue: action.text,
      }));
    }
    case "SUBMIT_FREE_TEXT": {
      if (question.status !== "answering") return state;
      const text = question.freeTextValue.trim();
      if (!text) return state;
      const correct = isAnswerCorrect(text, currentWord);
      return resolve(state, correct ? "correct" : "incorrect", "free", text);
    }
    case "TOGGLE_HINT": {
      if (question.status !== "answering") return state;
      return updateCurrentQuestion(state, (q) => ({
        ...q,
        hintVisible: !q.hintVisible,
      }));
    }
    case "SET_ANSWER_MODE": {
      if (question.status !== "answering") return state;
      const choices =
        action.mode === "choice"
          ? (action.choices ?? question.choices)
          : question.choices;
      if (action.mode === "choice" && !choices) return state;
      return updateCurrentQuestion(state, (q) => ({
        ...q,
        answerMode: action.mode,
        choices,
        selectedChoice: null,
      }));
    }
    case "SELECT_CHOICE": {
      if (question.status !== "answering") return state;
      if (question.answerMode !== "choice") return state;
      return updateCurrentQuestion(state, (q) => ({
        ...q,
        selectedChoice: action.choice,
      }));
    }
    case "SUBMIT_CHOICE": {
      if (question.status !== "answering") return state;
      const choice = question.selectedChoice;
      if (!choice) return state;
      const correct =
        normalizeAnswer(choice) === normalizeAnswer(currentWord.term);
      return resolve(state, correct ? "correct" : "incorrect", "choice", choice, {
        selectedChoice: choice,
      });
    }
    case "GIVE_UP": {
      if (question.status !== "answering") return state;
      return resolve(state, "giveup", null, null);
    }
    case "NEXT_QUESTION": {
      if (question.status !== "resolved") return state;
      return advanceFromResolved(state);
    }
    case "PREV_QUESTION": {
      if (state.currentIndex === 0) return state;
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        pendingCorrectEffectIndex: null,
      };
    }
    case "NAV_NEXT": {
      if (state.currentIndex < state.visitedMaxIndex) {
        return {
          ...state,
          currentIndex: state.currentIndex + 1,
          pendingCorrectEffectIndex: null,
        };
      }
      if (question.status !== "resolved") return state;
      return advanceFromResolved(state);
    }
    default:
      return state;
  }
}
