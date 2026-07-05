#!/usr/bin/env node
// 生成された単語データ(data/words/*.json)のスキーマ・件数・重複を検証するスクリプト。
// 使い方: node scripts/validate-words.mjs

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wordsDir = path.join(__dirname, "..", "data", "words");

const EXPECTED_COUNTS = {
  fundamentals: 28,
  algorithm: 33,
  "computer-components": 25,
  "system-components": 18,
  software: 20,
  hardware: 15,
  "user-interface": 12,
  media: 12,
  database: 32,
  network: 35,
  security: 37,
  development: 25,
  "dev-management": 15,
  "project-management": 22,
  "service-management": 18,
  audit: 14,
  "system-strategy": 16,
  "system-planning": 14,
  "business-strategy": 22,
  "tech-strategy": 14,
  "business-industry": 25,
  "corporate-activity": 25,
  legal: 23,
};

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const REQUIRED_FIELDS = [
  "id",
  "categoryId",
  "difficulty",
  "term",
  "aliases",
  "question",
  "hint",
  "explanation",
];

let totalCount = 0;
let hasError = false;
const allTermsGlobal = new Map(); // normalizedTerm -> [ids]
const idSet = new Set();

function normalize(s) {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

const files = readdirSync(wordsDir).filter((f) => f.endsWith(".json"));

for (const categoryId of Object.keys(EXPECTED_COUNTS)) {
  const file = `${categoryId}.json`;
  const filePath = path.join(wordsDir, file);
  if (!files.includes(file)) {
    console.error(`[ERROR] ファイルが存在しません: ${file}`);
    hasError = true;
    continue;
  }

  let data;
  try {
    const raw = readFileSync(filePath, "utf-8");
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`[ERROR] ${file}: JSONパースエラー - ${e.message}`);
    hasError = true;
    continue;
  }

  if (!Array.isArray(data)) {
    console.error(`[ERROR] ${file}: トップレベルが配列ではありません`);
    hasError = true;
    continue;
  }

  const expected = EXPECTED_COUNTS[categoryId];
  const actual = data.length;
  totalCount += actual;
  const diff = actual - expected;
  const countStatus =
    Math.abs(diff) === 0 ? "OK" : Math.abs(diff) <= 2 ? "WARN" : "ERROR";
  console.log(
    `${countStatus === "OK" ? "✓" : countStatus === "WARN" ? "△" : "✗"} ${file}: ${actual}語 (目標${expected}語, 差分${diff >= 0 ? "+" : ""}${diff})`
  );
  if (countStatus === "ERROR") hasError = true;

  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  const localTerms = new Set();

  data.forEach((entry, i) => {
    const label = `${file}[${i}]`;
    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) {
        console.error(`  [ERROR] ${label}: フィールド "${field}" がありません`);
        hasError = true;
      }
    }
    if (entry.categoryId !== categoryId) {
      console.error(
        `  [ERROR] ${label}: categoryIdが不一致 (期待:${categoryId}, 実際:${entry.categoryId})`
      );
      hasError = true;
    }
    if (!DIFFICULTIES.has(entry.difficulty)) {
      console.error(`  [ERROR] ${label}: difficultyが不正 (${entry.difficulty})`);
      hasError = true;
    } else {
      difficultyCounts[entry.difficulty] += 1;
    }
    if (entry.id) {
      if (idSet.has(entry.id)) {
        console.error(`  [ERROR] ${label}: id重複 (${entry.id})`);
        hasError = true;
      }
      idSet.add(entry.id);
    }
    if (!Array.isArray(entry.aliases)) {
      console.error(`  [ERROR] ${label}: aliasesが配列ではありません`);
      hasError = true;
    }
    if (typeof entry.term === "string") {
      const norm = normalize(entry.term);
      if (localTerms.has(norm)) {
        console.error(`  [ERROR] ${label}: 同一ファイル内でterm重複 (${entry.term})`);
        hasError = true;
      }
      localTerms.add(norm);

      if (!allTermsGlobal.has(norm)) allTermsGlobal.set(norm, []);
      allTermsGlobal.get(norm).push(entry.id);
    }
    if (typeof entry.question === "string" && entry.term && entry.question.includes(entry.term)) {
      console.warn(`  [WARN] ${label}: questionに答え(${entry.term})が含まれている可能性`);
    }
  });

  console.log(
    `    難易度内訳: easy=${difficultyCounts.easy}, medium=${difficultyCounts.medium}, hard=${difficultyCounts.hard}`
  );
}

console.log(`\n合計語数: ${totalCount} / 目標500語`);

const globalDuplicates = [...allTermsGlobal.entries()].filter(([, ids]) => ids.length > 1);
if (globalDuplicates.length > 0) {
  console.log(`\n[INFO] カテゴリ横断でのterm重複候補 (${globalDuplicates.length}件):`);
  for (const [term, ids] of globalDuplicates) {
    console.log(`  - ${term}: ${ids.join(", ")}`);
  }
}

if (hasError) {
  console.error("\n検証の結果、修正が必要な問題があります。");
  process.exit(1);
} else {
  console.log("\n検証OK: 重大な問題は見つかりませんでした。");
}
