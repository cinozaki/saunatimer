import { Pomodoro, STATE } from './pomodoro.js';

/**
 * ポモドーロタイマーの HTML オーバーレイ UI
 */
export class PomodoroPanel {
  /**
   * @param {object} options
   * @param {function} options.onSessionStart - セッション開始時
   * @param {function} options.onSessionPause - 一時停止時
   * @param {function} options.onSessionResume - 再開時
   * @param {function} options.onSessionStop - セッション終了時(IDLE復帰)
   */
  constructor({ onSessionStart, onSessionPause, onSessionResume, onSessionStop } = {}) {
    this._onSessionStart = onSessionStart || (() => {});
    this._onSessionPause = onSessionPause || (() => {});
    this._onSessionResume = onSessionResume || (() => {});
    this._onSessionStop = onSessionStop || (() => {});

    this.pomodoro = new Pomodoro({
      onTick: () => this._render(),
      onStateChange: () => this._render(),
      onComplete: (prev, next) => this._onPhaseComplete(prev, next),
    });

    this._buildDOM();
    this._render();
  }

  update() {
    this.pomodoro.update();
  }

  _buildDOM() {
    const container = document.createElement('div');
    container.id = 'pomodoro';
    container.innerHTML = `
      <div class="pomo-label"></div>
      <div class="pomo-time"></div>
      <div class="pomo-bar-bg"><div class="pomo-bar-fill"></div></div>
      <div class="pomo-dots"></div>
      <div class="pomo-buttons">
        <button class="pomo-btn pomo-btn-main"></button>
        <button class="pomo-btn pomo-btn-skip">SKIP ▶▶</button>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #pomodoro {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 12px 28px 14px;
        border-radius: 0 0 12px 12px;
        text-align: center;
        font-family: 'Overpass', sans-serif;
        z-index: 10;
        min-width: 240px;
        user-select: none;
      }
      .pomo-label {
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 2px;
        margin-bottom: 2px;
      }
      .pomo-label.work {
        animation: heating-glow 2s ease-in-out infinite;
      }
      @keyframes heating-glow {
        0%, 100% { color: #ff8855; }
        50% { color: #ff9966; }
      }
      .pomo-label.break { color: #66ddaa; }
      .pomo-label.idle { color: #aaa; }
      .pomo-time {
        font-size: 42px;
        font-weight: 900;
        font-family: 'Overpass', monospace;
        letter-spacing: 2px;
        line-height: 1.1;
      }
      .pomo-bar-bg {
        width: 100%;
        height: 6px;
        background: #333;
        border-radius: 3px;
        margin: 8px 0;
        overflow: hidden;
      }
      .pomo-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s linear;
      }
      .pomo-bar-fill.work { background: #ff6633; }
      .pomo-bar-fill.break { background: #66ddaa; }
      .pomo-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin: 6px 0 8px;
      }
      .pomo-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid #666;
        box-sizing: border-box;
      }
      .pomo-dot.filled {
        background: #ff6633;
        border-color: #ff6633;
      }
      .pomo-buttons {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      .pomo-btn {
        background: #333;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 6px 18px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Overpass', sans-serif;
        letter-spacing: 1px;
      }
      .pomo-btn:active {
        background: #555;
      }
      .pomo-btn-main.start { background: #ff6633; }
      .pomo-btn-main.pause { background: #cc4422; }
      .pomo-btn-skip {
        display: none;
      }
      .pomo-btn-skip.visible {
        display: inline-block;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(container);

    // イベント
    container.querySelector('.pomo-btn-main').addEventListener('click', (e) => {
      e.stopPropagation();
      const wasRunning = this.pomodoro.running;
      const wasIdle = this.pomodoro.state === STATE.IDLE;
      this.pomodoro.toggle();
      this._render();

      if (wasIdle) {
        // IDLE → WORK 開始
        this._onSessionStart();
      } else if (wasRunning) {
        this._onSessionPause();
      } else {
        this._onSessionResume();
      }
    });

    container.querySelector('.pomo-btn-skip').addEventListener('click', (e) => {
      e.stopPropagation();
      this.pomodoro.skip();
      this._render();
      // SKIP 後は常に時計を停止（BREAK or IDLE）
      this._onSessionStop();
    });

    // タッチイベントがcanvasに伝播しないように
    container.addEventListener('click', (e) => e.stopPropagation());
    container.addEventListener('touchend', (e) => e.stopPropagation());

    this._el = {
      label: container.querySelector('.pomo-label'),
      time: container.querySelector('.pomo-time'),
      barFill: container.querySelector('.pomo-bar-fill'),
      dots: container.querySelector('.pomo-dots'),
      btnMain: container.querySelector('.pomo-btn-main'),
      btnSkip: container.querySelector('.pomo-btn-skip'),
    };

    // ファビコン用 Canvas
    this._faviconCanvas = document.createElement('canvas');
    this._faviconCanvas.width = 64;
    this._faviconCanvas.height = 64;
    this._faviconLink = document.querySelector('link[rel="icon"]');
    if (!this._faviconLink) {
      this._faviconLink = document.createElement('link');
      this._faviconLink.rel = 'icon';
      document.head.appendChild(this._faviconLink);
    }
    this._defaultTitle = document.title;
  }

  _render() {
    const pomo = this.pomodoro;
    const el = this._el;
    const isBreak = pomo.isBreak;
    const isIdle = pomo.state === STATE.IDLE;

    // ラベル
    el.label.textContent = pomo.stateLabel;
    el.label.className = 'pomo-label ' + (isIdle ? 'idle' : isBreak ? 'break' : 'work');

    // 時間
    el.time.textContent = pomo.displayTime;

    // プログレスバー
    el.barFill.style.width = (pomo.progress * 100) + '%';
    el.barFill.className = 'pomo-bar-fill ' + (isBreak ? 'break' : 'work');

    // セットドット
    el.dots.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'pomo-dot' + (i < pomo.completedSets ? ' filled' : '');
      el.dots.appendChild(dot);
    }

    // ボタン
    if (isIdle) {
      el.btnMain.textContent = 'START ▶';
      el.btnMain.className = 'pomo-btn pomo-btn-main start';
    } else if (pomo.running) {
      el.btnMain.textContent = 'PAUSE ⏸';
      el.btnMain.className = 'pomo-btn pomo-btn-main pause';
    } else {
      el.btnMain.textContent = 'START ▶';
      el.btnMain.className = 'pomo-btn pomo-btn-main start';
    }

    // スキップボタン（進行中かつ一時停止中に表示）
    const showSkip = !isIdle;
    el.btnSkip.className = 'pomo-btn pomo-btn-skip' + (showSkip ? ' visible' : '');

    // タイトル更新
    if (isIdle) {
      document.title = this._defaultTitle;
    } else {
      const label = isBreak ? (pomo.state === STATE.LONG_BREAK ? 'LONG BREAK' : 'BREAK') : 'HEATING';
      document.title = `${pomo.displayTime} - ${label}`;
    }

    // ファビコン更新
    this._updateFavicon(pomo);
  }

  _updateFavicon(pomo) {
    const canvas = this._faviconCanvas;
    const ctx = canvas.getContext('2d');
    const size = 64;
    const isIdle = pomo.state === STATE.IDLE;
    const isBreak = pomo.isBreak;

    ctx.clearRect(0, 0, size, size);

    if (isIdle) {
      // IDLE: グレーの円
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2);
      ctx.fillStyle = '#666';
      ctx.fill();
    } else {
      // 進行中: 進捗を示す円弧
      const color = isBreak ? '#66ddaa' : '#ff6633';
      const bgColor = isBreak ? '#1a4433' : '#4a1a0a';

      // 背景円
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2);
      ctx.fillStyle = bgColor;
      ctx.fill();

      // 進捗アーク（残り時間を表示、上から時計回り）
      const remaining = 1 - pomo.progress;
      if (remaining > 0) {
        ctx.beginPath();
        ctx.moveTo(size / 2, size / 2);
        ctx.arc(size / 2, size / 2, 28,
          -Math.PI / 2,
          -Math.PI / 2 + remaining * Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      // 一時停止中は中央にポーズマーク
      if (!pomo.running) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(22, 20, 7, 24);
        ctx.fillRect(35, 20, 7, 24);
      }
    }

    this._faviconLink.href = canvas.toDataURL('image/png');
  }

  _onPhaseComplete(prevState, nextState) {
    this._render();
    this._notifyPhaseChange(prevState, nextState);

    // HEATING以外に遷移したら時計を停止（スイープで通常時刻に戻る）
    if (nextState !== STATE.WORK) {
      this._onSessionStop();
    }
  }

  _notifyPhaseChange(prevState, nextState) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = nextState === STATE.WORK ? 'Heating Time' : 'Break Time';
      const body = nextState === STATE.WORK
        ? 'サウナに入りましょう'
        : nextState === STATE.LONG_BREAK
          ? 'ロング休憩です（12分）'
          : '短い休憩です（6分）';
      new Notification(title, { body });
    }
    this._playNotificationSound();
  }

  _playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gain.gain.value = 0.3;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 300);
    } catch {
      // Audio not available
    }
  }
}
