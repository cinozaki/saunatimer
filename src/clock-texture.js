import * as THREE from 'three';

const CLOCK_SIZE = 512;
const CENTER = CLOCK_SIZE / 2;
const RADIUS = CLOCK_SIZE / 2 - 20;

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const DEG_PER_HOUR = 30;
const DEG_PER_SECOND = 6;

/**
 * 時計テクスチャを生成・管理するクラス
 */
export class ClockTexture {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CLOCK_SIZE;
    this.canvas.height = CLOCK_SIZE;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this._draw();
  }

  /** 毎フレーム呼んでテクスチャを更新 */
  update() {
    this._draw();
    this.texture.needsUpdate = true;
  }

  _draw() {
    const ctx = this.ctx;
    const now = new Date();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const ms = now.getMilliseconds();

    const minute12 = minute % 12;
    const minuteAngle = (minute12 * DEG_PER_HOUR + second / 2 + ms / 2000) * (Math.PI / 180);
    const secondAngle = (second * DEG_PER_SECOND + DEG_PER_SECOND * ms / 1000) * (Math.PI / 180);

    ctx.clearRect(0, 0, CLOCK_SIZE, CLOCK_SIZE);

    // --- 文字盤の影（壁に落ちる影を演出） ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(CENTER + 4, CENTER + 4, RADIUS + 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    ctx.restore();

    // --- 文字盤背景 ---
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // --- 縁 ---
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#e8e8e8';
    ctx.stroke();

    // --- 内側の影（inset風） ---
    const gradient = ctx.createRadialGradient(
      CENTER - 30, CENTER - 30, 10,
      CENTER, CENTER, RADIUS
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS - 4, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // --- "SAUNA" ロゴ ---
    ctx.font = '900 22px "Overpass", sans-serif';
    ctx.fillStyle = '#464646';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '2px';
    ctx.fillText('SAUNA', CENTER, CENTER - RADIUS * 0.22);

    // --- "12min" バッジ ---
    const badgeText = '12min';
    ctx.font = '900 italic 16px "Overpass", sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 12;
    const badgeX = CENTER - badgeWidth / 2;
    const badgeY = CENTER + RADIUS * 0.12;
    ctx.fillStyle = '#1800ff';
    ctx.fillRect(badgeX, badgeY, badgeWidth, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(badgeText, CENTER, badgeY + 10);

    // --- 時間の数字 ---
    ctx.font = '900 38px "Overpass", sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < HOURS.length; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const numRadius = RADIUS - 35;
      const x = CENTER + Math.cos(angle) * numRadius;
      const y = CENTER + Math.sin(angle) * numRadius;
      ctx.fillText(String(HOURS[i]), x, y);
    }

    // --- 分針 ---
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(minuteAngle);
    ctx.beginPath();
    ctx.roundRect(-6, -RADIUS * 0.6, 12, RADIUS * 0.6 + 10, 4);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.restore();

    // --- 秒針 ---
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(secondAngle);
    ctx.beginPath();
    ctx.roundRect(-3, -RADIUS * 0.82, 6, RADIUS * 0.82 + 10, 4);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.restore();

    // --- 中心の丸 ---
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
  }
}
