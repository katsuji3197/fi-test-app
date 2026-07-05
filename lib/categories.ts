import type { Category } from "./types";

/**
 * 基本情報技術者試験 シラバス Ver.9系 準拠の中分類一覧。
 * 出題数の重み(テクノロジ系 41/60, マネジメント系 7/60, ストラテジ系 12/60)を
 * 意識して単語の収録目標数を配分している(合計目標: 500語)。
 */
export const CATEGORIES: Category[] = [
  { id: "fundamentals", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 1, name: "基礎理論", categoryNumber: 1 },
  { id: "algorithm", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 1, name: "アルゴリズムとプログラミング", categoryNumber: 2 },
  { id: "computer-components", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 2, name: "コンピュータ構成要素", categoryNumber: 3 },
  { id: "system-components", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 2, name: "システム構成要素", categoryNumber: 4 },
  { id: "software", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 2, name: "ソフトウェア", categoryNumber: 5 },
  { id: "hardware", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 2, name: "ハードウェア", categoryNumber: 6 },
  { id: "user-interface", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 3, name: "ユーザーインタフェース", categoryNumber: 7 },
  { id: "media", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 3, name: "情報メディア", categoryNumber: 8 },
  { id: "database", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 3, name: "データベース", categoryNumber: 9 },
  { id: "network", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 3, name: "ネットワーク", categoryNumber: 10 },
  { id: "security", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 3, name: "セキュリティ", categoryNumber: 11 },
  { id: "development", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 4, name: "システム開発技術", categoryNumber: 12 },
  { id: "dev-management", majorCategoryId: "technology", majorCategoryName: "テクノロジ系", majorCategoryNumber: 4, name: "ソフトウェア開発管理技術", categoryNumber: 13 },
  { id: "project-management", majorCategoryId: "management", majorCategoryName: "マネジメント系", majorCategoryNumber: 5, name: "プロジェクトマネジメント", categoryNumber: 14 },
  { id: "service-management", majorCategoryId: "management", majorCategoryName: "マネジメント系", majorCategoryNumber: 6, name: "サービスマネジメント", categoryNumber: 15 },
  { id: "audit", majorCategoryId: "management", majorCategoryName: "マネジメント系", majorCategoryNumber: 6, name: "システム監査", categoryNumber: 16 },
  { id: "system-strategy", majorCategoryId: "strategy", majorCategoryName: "ストラテジ系", majorCategoryNumber: 7, name: "システム戦略", categoryNumber: 17 },
  { id: "system-planning", majorCategoryId: "strategy", majorCategoryName: "ストラテジ系", majorCategoryNumber: 7, name: "システム企画", categoryNumber: 18 },
  { id: "business-strategy", majorCategoryId: "strategy", majorCategoryName: "ストラテジ系", majorCategoryNumber: 8, name: "経営戦略マネジメント", categoryNumber: 19 },
  { id: "tech-strategy", majorCategoryId: "strategy", majorCategoryName: "ストラテジ系", majorCategoryNumber: 8, name: "技術戦略マネジメント", categoryNumber: 20 },
  { id: "business-industry", majorCategoryId: "strategy", majorCategoryName: "ストラテジ系", majorCategoryNumber: 8, name: "ビジネスインダストリ", categoryNumber: 21 },
  { id: "corporate-activity", majorCategoryId: "strategy", majorCategoryName: "ストラテジ系", majorCategoryNumber: 9, name: "企業活動", categoryNumber: 22 },
  { id: "legal", majorCategoryId: "strategy", majorCategoryName: "ストラテジ系", majorCategoryNumber: 9, name: "法務", categoryNumber: 23 },
];

export const MAJOR_CATEGORY_ORDER: { id: Category["majorCategoryId"]; name: string }[] = [
  { id: "technology", name: "テクノロジ系" },
  { id: "management", name: "マネジメント系" },
  { id: "strategy", name: "ストラテジ系" },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
