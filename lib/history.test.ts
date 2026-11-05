import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseHistory, shouldSaveFinishedSession, weakestCategory, type QuizHistoryEntry } from "./history";
import { pickQuizWords, questionCountForCategory } from "./quiz";
import type { WordEntry } from "./types";

const oldEntry = {
  finishedAt: "2026-10-01T00:00:00.000Z",
  questionCount: 10,
  correctCount: 7,
  incorrectCount: 3,
  giveUpCount: 0,
  difficulties: ["easy", "medium"],
  categoryCount: 23,
};

function entry(partial: Partial<QuizHistoryEntry> & Pick<QuizHistoryEntry, "finishedAt">): QuizHistoryEntry {
  return {
    questionCount: 10,
    correctCount: 5,
    incorrectCount: 5,
    giveUpCount: 0,
    difficulties: ["easy", "medium", "hard"],
    categoryCount: 1,
    ...partial,
  };
}

describe("parseHistory", () => {
  it("returns nothing for empty, malformed, or non-array data", () => {
    assert.deepEqual(parseHistory(""), []);
    assert.deepEqual(parseHistory("not json"), []);
    assert.deepEqual(parseHistory("null"), []);
    assert.deepEqual(parseHistory("{}"), []);
    assert.deepEqual(parseHistory(JSON.stringify([{ ...oldEntry, finishedAt: "yesterday" }])), []);
  });

  it("keeps old entries that have no per-category counts", () => {
    const parsed = parseHistory(JSON.stringify([oldEntry, { ...oldEntry, categories: "bad" }]));
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].categories, undefined);
    assert.equal(parsed[1].categories, undefined);
  });

  it("keeps valid category counts and drops broken ones", () => {
    const parsed = parseHistory(
      JSON.stringify([
        {
          ...oldEntry,
          categories: {
            network: { correct: 1, incorrect: 4, giveUp: 0 },
            broken: { correct: -1, incorrect: 1, giveUp: 0 },
            empty: { correct: 0, incorrect: 0, giveUp: 0 },
          },
        },
      ])
    );
    assert.deepEqual(parsed[0].categories, {
      network: { correct: 1, incorrect: 4, giveUp: 0 },
    });
  });
});

describe("weakestCategory", () => {
  it("ignores categories with fewer than 5 answers", () => {
    const result = weakestCategory([
      entry({
        finishedAt: "2026-11-01T00:00:00.000Z",
        categories: { network: { correct: 0, incorrect: 2, giveUp: 0 } },
      }),
    ]);
    assert.equal(result, null);
  });

  it("picks the lowest accuracy among categories with enough answers", () => {
    const result = weakestCategory([
      entry({
        finishedAt: "2026-11-02T00:00:00.000Z",
        categories: {
          network: { correct: 4, incorrect: 1, giveUp: 0 },
          legal: { correct: 1, incorrect: 3, giveUp: 1 },
        },
      }),
      entry({
        finishedAt: "2026-11-01T00:00:00.000Z",
        categories: { legal: { correct: 0, incorrect: 1, giveUp: 0 } },
      }),
    ]);
    assert.deepEqual(result, { categoryId: "legal", name: "法務" });
  });

  it("returns nothing when history has only the old format", () => {
    assert.equal(weakestCategory([entry({ finishedAt: "2026-11-01T00:00:00.000Z" })]), null);
  });
});

const sampleWord: WordEntry = {
  id: "w1",
  term: "TCP",
  aliases: [],
  question: "転送を確かめる通信の約束事",
  hint: "ティー",
  explanation: "Transmission Control Protocol",
  categoryId: "network",
  difficulty: "easy",
};

describe("questionCountForCategory", () => {
  it("uses the smaller of the chosen count and the words left in that category", () => {
    assert.equal(questionCountForCategory(10, 28), 10);
    assert.equal(questionCountForCategory(10, 8), 8);
    assert.equal(questionCountForCategory(10, 0), 0);
  });
});

describe("starting with no words", () => {
  it("does not build a quiz when the pool or the count is empty", () => {
    assert.equal(pickQuizWords([], 10).length, 0);
    assert.equal(pickQuizWords([sampleWord], 0).length, 0);
  });
});

describe("shouldSaveFinishedSession", () => {
  it("skips a session nobody answered and a mistake-only retry", () => {
    assert.equal(shouldSaveFinishedSession(0, false), false);
    assert.equal(shouldSaveFinishedSession(10, true), false);
    assert.equal(shouldSaveFinishedSession(10, false), true);
  });
});
