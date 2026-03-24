# Sauna Timer

## Overview
Three.js + WebGL で構築された 3D サウナ室タイマーアプリ。

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
  camera-controller.js — 正面/俯瞰の2視点切替 (クリック/タップ)
```

## Notes
- 木目テクスチャはプロシージャル生成（画像ファイル不要）
- 時計は Canvas 2D で描画し、毎フレーム CanvasTexture を更新
- カメラ遷移は ease in-out で1秒間アニメーション
- Playwright でのスクリーンショット撮影には `--channel chrome` が必要（WebGL のため）
