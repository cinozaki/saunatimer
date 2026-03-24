import * as THREE from 'three';

/**
 * プロシージャルに木目テクスチャを生成する
 * @param {object} options
 * @param {number} options.width - テクスチャ幅
 * @param {number} options.height - テクスチャ高さ
 * @param {string} options.baseColor - ベースカラー (CSS色)
 * @param {string} options.grainColor - 木目の色 (CSS色)
 * @param {boolean} options.horizontal - 木目を横方向にするか
 * @returns {THREE.CanvasTexture}
 */
export function createWoodTexture({
  width = 512,
  height = 512,
  baseColor = '#b5803a',
  grainColor = '#8b5e2a',
  horizontal = false,
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // ベース塗り
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // 木目ライン
  ctx.strokeStyle = grainColor;
  ctx.globalAlpha = 0.3;

  const lineCount = 40;
  for (let i = 0; i < lineCount; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1 + Math.random() * 3;

    if (horizontal) {
      const y = (height / lineCount) * i + Math.random() * 8;
      ctx.moveTo(0, y);
      for (let x = 0; x < width; x += 20) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 6);
      }
    } else {
      const x = (width / lineCount) * i + Math.random() * 8;
      ctx.moveTo(x, 0);
      for (let y = 0; y < height; y += 20) {
        ctx.lineTo(x + (Math.random() - 0.5) * 6, y);
      }
    }
    ctx.stroke();
  }

  // 板の境目（パネルライン）
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#3d2510';
  ctx.lineWidth = 2;
  const panelCount = 6;
  for (let i = 1; i < panelCount; i++) {
    ctx.beginPath();
    if (horizontal) {
      const x = (width / panelCount) * i;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    } else {
      const y = (height / panelCount) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
