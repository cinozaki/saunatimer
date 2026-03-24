# Sauna Timer

## Overview
Three.js + WebGL で構築された 3D サウナ室タイマーアプリ。
ポモドーロタイマー機能付き。BREAK 中はチルスペース（水風呂 + 外気浴）に遷移。

## Tech Stack
- Vanilla JS + Vite
- Three.js (WebGL)

## Commands
- `npm run dev` — 開発サーバー起動 (port 3003)
- `npm run build` — プロダクションビルド (`dist/` に出力)
- `npm run preview` — ビルド結果をプレビュー

## Project Structure
```
src/
  main.js              — エントリーポイント (シーン構築・アニメーションループ)
  sauna-room.js        — サウナ室の壁・床・天井・ライティング構築
  wood-texture.js      — プロシージャル木目テクスチャ生成
  clock-texture.js     — Canvas で時計盤を描画し CanvasTexture として提供
  camera-controller.js — 正面/俯瞰/チルスペースの視点切替
  furniture.js         — 3段ベンチ・IKI風ストーブ・柵・ロウリュ桶・ドア
  chill-space.js       — チルスペース (水風呂・アディロンダックチェア・石畳)
  pomodoro.js          — ポモドーロタイマーのロジック (状態管理)
  pomodoro-panel.js    — ポモドーロの HTML オーバーレイ UI
```

## Notes
- 木目テクスチャはプロシージャル生成（画像ファイル不要）
- 時計は Canvas 2D で描画し、毎フレーム CanvasTexture を更新
- 時計の針は `ctx.rotate()` で回転（上向き基準なので角度オフセット不要）
- カメラ遷移は ease in-out で1秒間アニメーション
- ポモドーロ: 24分 HEATING / 6分 BREAK / 12分 LONG BREAK (3セット)
- チルスペースのライティングは PointLight/SpotLight のみ使用（サウナ室への光漏れ防止）
- Playwright でのスクリーンショット撮影には `--channel chrome` が必要（WebGL のため）
