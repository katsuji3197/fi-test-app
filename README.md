# 基本情報技術者試験 単語暗記トレーニング

IPA「基本情報技術者試験」のシラバス(中分類)に対応した用語を、自由記述形式で学習できるクイズアプリです。

## 主な機能

- 自由記述形式での出題(わからない場合は4択・ヒント・ギブアップも利用可能)
- 難易度選択(やさしい / ふつう / むずかしい)
- シラバスの中分類(23分類)ごとに出題範囲を選択可能
- 10問刻みで出題数を事前に設定可能
- 正解時に必ず解説を表示(略語は正式名称・日本語訳も併記)
- 正答数(自由記述 / 選択肢使用)・不正解数・ギブアップ数をリアルタイムに表示
- 約500語を収録(`data/words/` 配下に中分類ごとのJSONとして格納)

## セットアップ

パッケージ管理には [pnpm](https://pnpm.io/) を使用しています。

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開くとアプリが表示されます。

## ディレクトリ構成(抜粋)

```
app/                 Next.js App Router のエントリポイント
components/          クイズ画面などのUIコンポーネント
lib/                 型定義・シラバス中分類定義・出題ロジック
data/words/*.json    中分類ごとの単語データ(問題文・ヒント・解説など)
scripts/validate-words.mjs  単語データの件数・重複・スキーマを検証するスクリプト
```

## 単語データの検証

`data/words/` 配下のJSONを追加・修正した場合は、以下のスクリプトで件数や重複、スキーマ不整合を確認できます。

```bash
node scripts/validate-words.mjs
```

## 技術スタック

- [Next.js](https://nextjs.org) (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
