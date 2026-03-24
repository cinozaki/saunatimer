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

    // セッションモード
    this._sessionMode = false;
    this._sessionElapsedMs = 0;
    this._sessionRunning = false;
    this._lastTimestamp = null;

    // スイープアニメーション
    this._sweeping = false;
    this._sweepStartTime = 0;
    this._sweepFromMinute = 0;
    this._sweepFromSecond = 0;
    this._currentMinuteAngle = 0;
    this._currentSecondAngle = 0;

    this._draw();
  }

  /** セッション開始: スイープしてから 0:00 で計測開始 */
  startSession() {
    this._startSweep('session');
  }

  /** セッション一時停止 */
  pauseSession() {
    this._sessionRunning = false;
    this._lastTimestamp = null;
  }

  /** セッション再開 */
  resumeSession() {
    this._sessionRunning = true;
    this._lastTimestamp = performance.now();
  }

  /** セッション終了: スイープして通常時計に戻る */
  stopSession() {
    this._startSweep('clock');
  }

  /**
   * スイープアニメーションを開始
   * @param {'session'|'clock'} target - スイープ後のモード
   */
  _startSweep(target) {
    this._sweepFromMinute = this._currentMinuteAngle;
    this._sweepFromSecond = this._currentSecondAngle;
    this._sweepTarget = target;
    this._sweeping = true;
    this._sweepStartTime = performance.now();

    // スイープ中は針の自走を止める
    this._sessionRunning = false;
    this._lastTimestamp = null;

    if (target === 'session') {
      this._sessionMode = true;
      this._sessionElapsedMs = 0;
    }
  }

  /** 毎フレーム呼んでテクスチャを更新 */
  update() {
    if (this._sessionRunning) {
      const now = performance.now();
      if (this._lastTimestamp !== null) {
        this._sessionElapsedMs += now - this._lastTimestamp;
      }
      this._lastTimestamp = now;
    }
    this._draw();
    this.texture.needsUpdate = true;
  }

  _draw() {
    const ctx = this.ctx;
    const SWEEP_DURATION = 800; // ms

    let minuteAngle, secondAngle;

    if (this._sweeping) {
      const elapsed = performance.now() - this._sweepStartTime;
      const rawT = Math.min(elapsed / SWEEP_DURATION, 1);
      // ease out with slight overshoot (like a gauge needle)
      const t = rawT < 1
        ? 1 - Math.pow(1 - rawT, 3) + Math.sin(rawT * Math.PI) * 0.08
        : 1;

      // スイープ先の角度を計算（到着時刻 = 現在 + 残りのスイープ時間）
      let toMin = 0, toSec = 0;
      if (this._sweepTarget === 'clock') {
        const arrivalTime = new Date(Date.now() + SWEEP_DURATION - elapsed);
        const arrMin = arrivalTime.getMinutes() % 12;
        const arrSec = arrivalTime.getSeconds();
        const arrMs = arrivalTime.getMilliseconds();
        toMin = (arrMin * DEG_PER_HOUR + arrSec / 2 + arrMs / 2000) * (Math.PI / 180);
        toSec = (arrSec * DEG_PER_SECOND + DEG_PER_SECOND * arrMs / 1000) * (Math.PI / 180);
      }

      // 最短経路で補間
      let fromMin = this._sweepFromMinute % (Math.PI * 2);
      let fromSec = this._sweepFromSecond % (Math.PI * 2);
      let diffMin = toMin - fromMin;
      let diffSec = toSec - fromSec;
      // 最短方向に正規化
      if (diffMin > Math.PI) diffMin -= Math.PI * 2;
      if (diffMin < -Math.PI) diffMin += Math.PI * 2;
      if (diffSec > Math.PI) diffSec -= Math.PI * 2;
      if (diffSec < -Math.PI) diffSec += Math.PI * 2;

      minuteAngle = fromMin + diffMin * t;
      secondAngle = fromSec + diffSec * t;

      if (rawT >= 1) {
        this._sweeping = false;
        if (this._sweepTarget === 'session') {
          this._sessionRunning = true;
          this._lastTimestamp = performance.now();
          minuteAngle = 0;
          secondAngle = 0;
        } else {
          this._sessionMode = false;
        }
      }
    } else if (this._sessionMode) {
      const totalSeconds = this._sessionElapsedMs / 1000;
      const minute = Math.floor(totalSeconds / 60) % 12;
      const second = totalSeconds % 60;
      minuteAngle = (minute * DEG_PER_HOUR + second / 2) * (Math.PI / 180);
      secondAngle = (second * DEG_PER_SECOND) * (Math.PI / 180);
    } else {
      const now = new Date();
      const minute = now.getMinutes() % 12;
      const second = now.getSeconds();
      const ms = now.getMilliseconds();
      minuteAngle = (minute * DEG_PER_HOUR + second / 2 + ms / 2000) * (Math.PI / 180);
      secondAngle = (second * DEG_PER_SECOND + DEG_PER_SECOND * ms / 1000) * (Math.PI / 180);
    }

    // 現在角度を記録（次のスイープ開始用）
    this._currentMinuteAngle = minuteAngle;
    this._currentSecondAngle = secondAngle;

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
