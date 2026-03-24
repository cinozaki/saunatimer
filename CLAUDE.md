# Sauna Timer

## Overview
Vue 3 + Vue CLI 5 で構築されたサウナ用アナログ時計アプリ。

## Tech Stack
- Vue 3.5 (Options API)
- Vue CLI 5 / Webpack
- SCSS (scoped)
- normalize.css

## Commands
- `npm run serve` — 開発サーバー起動 (port 3003)
- `npm run build` — プロダクションビルド (`dist/` に出力)
- `npm run lint` — ESLint 実行

## Project Structure
```
src/
  main.js              — アプリのエントリーポイント
  App.vue              — ルートコンポーネント (背景はCSSグラデーション)
  components/
    SaunaTimer.vue     — 時計コンポーネント (秒針・分針のリアルタイム描画)
  assets/
    logo.png
```

## Notes
- 背景のレンガ模様は画像ではなくCSSグラデーションで実装
- SaunaTimer は `setInterval` (100ms) で針を更新、`beforeUnmount` でクリア
