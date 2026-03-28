/**
 * デバッグ用スクリーンショット撮影スクリプト
 *
 * Usage: node scripts/screenshot.js [view1,view2,...] [--out dir]
 *
 * Views:
 *   front       - サウナ室正面
 *   overview    - サウナ室俯瞰
 *   chill       - チルスペース正面
 *   chillOver   - チルスペース俯瞰
 *   showerZoom  - シャワーエリアズーム
 *   stoveZoom   - ストーブズーム
 *   doorZoom    - ドアズーム
 *   windowZoom  - 窓ズーム
 *   all         - 全ビュー
 *
 * Examples:
 *   node scripts/screenshot.js                    # 全ビュー
 *   node scripts/screenshot.js front,chill        # 指定ビューのみ
 *   node scripts/screenshot.js all --out ./shots  # 出力先指定
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CAMERA_VIEWS = {
  front: {
    pos: [0, 1.6, 1.8],
    lookAt: [0, 1.6, 0],
    label: 'Sauna Front',
  },
  overview: {
    pos: [0, 5.5, 3.5],
    lookAt: [0, 1.0, 0],
    label: 'Sauna Overview',
  },
  chill: {
    pos: [-4.5, 1.4, 2.2],
    lookAt: [-5.5, 0.6, -0.3],
    label: 'Chill Front',
  },
  chillOver: {
    pos: [-5.0, 4.5, 3.0],
    lookAt: [-5.0, 0.3, -0.5],
    label: 'Chill Overview',
  },
  showerZoom: {
    pos: [-6.2, 1.3, 0.5],
    lookAt: [-7.25, 0.8, -1.6],
    label: 'Shower Zoom',
  },
  stoveZoom: {
    pos: [-0.2, 1.5, 0.2],
    lookAt: [-1.2, 0.6, -1.2],
    label: 'Stove Zoom',
  },
  doorZoom: {
    pos: [-1.0, 1.3, 1.2],
    lookAt: [-1.93, 1.0, 1.2],
    label: 'Door Zoom',
  },
  windowZoom: {
    pos: [-1.0, 1.5, -0.3],
    lookAt: [-2.0, 1.5, -0.3],
    label: 'Window Zoom',
  },
};

async function main() {
  const args = process.argv.slice(2);
  let outDir = '/tmp/sauna-screenshots';
  let viewNames = Object.keys(CAMERA_VIEWS);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outDir = args[++i];
    } else if (args[i] !== 'all') {
      viewNames = args[i].split(',');
    }
  }

  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3003');
  await page.waitForTimeout(2500);

  for (const name of viewNames) {
    const view = CAMERA_VIEWS[name];
    if (!view) {
      console.log(`Unknown view: ${name}, skipping`);
      continue;
    }

    await page.evaluate(({ pos, lookAt }) => {
      const THREE = window.__THREE__;
      if (!THREE) return;
      const cam = THREE._camera;
      if (!cam) return;
      cam.position.set(pos[0], pos[1], pos[2]);
      cam.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    }, { pos: view.pos, lookAt: view.lookAt });

    // THREE がグローバルに無い場合は、scene を traverse して camera を探す
    await page.evaluate(({ pos, lookAt }) => {
      // Fallback: find camera from renderer
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const renderer = canvas.__renderer;
      if (renderer && renderer._camera) {
        renderer._camera.position.set(pos[0], pos[1], pos[2]);
        renderer._camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      }
    }, { pos: view.pos, lookAt: view.lookAt });

    await page.waitForTimeout(200);

    // requestAnimationFrame で1フレーム描画させる
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await page.waitForTimeout(100);

    const filePath = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: filePath });
    console.log(`✓ ${view.label} → ${filePath}`);
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${outDir}`);
}

main().catch(console.error);
