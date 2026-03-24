# Sauna Timer

Three.js + WebGL で構築された 3D サウナ室タイマーアプリ。

**https://saunatimer.pages.dev/**

ポモドーロタイマー機能付き。BREAK 中はチルスペース（水風呂 + 外気浴）に遷移。

## Features

- 3D サウナ室（IKI風ストーブ、3段ベンチ、間接照明、丸窓ドア）
- ポモドーロタイマー（Heating / Break / Long Break）
- タイマー設定（時間・自動開始など、localStorage 永続化）
- チルスペース（水風呂の波紋アニメーション、注水表現、アディロンダックチェア）
- ロウリュ演出（桶クリックで蒸気エフェクト）
- ファビコン進捗表示 / タイトルに残り時間表示
- カメラ切替（正面 / 俯瞰 / チルスペース）

## Setup

```bash
npm install
```

## Development

```bash
npm run dev     # http://localhost:3003
```

## Build

```bash
npm run build   # dist/ に出力
```

## Deploy

master ブランチへの push 時に GitHub Actions で Cloudflare Pages に自動デプロイされます。
