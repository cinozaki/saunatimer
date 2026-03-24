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
      <button class="pomo-collapse-btn"><span class="material-symbols-rounded">expand_less</span></button>
      <div class="pomo-body">
      <div class="pomo-label"></div>
      <div class="pomo-time"></div>
      <div class="pomo-bar-bg"><div class="pomo-bar-fill"></div></div>
      <div class="pomo-dots"></div>
      <div class="pomo-buttons">
        <button class="pomo-btn pomo-btn-main"></button>
        <button class="pomo-btn pomo-btn-skip"><span class="material-symbols-rounded">skip_next</span></button>
        <button class="pomo-btn pomo-btn-settings"><span class="material-symbols-rounded">settings</span></button>
      </div>
      <div class="pomo-settings" style="display:none">
        <div class="pomo-settings-title">Settings</div>
        <label>Heating <input type="number" class="pomo-set-work" min="1" max="120"> min</label>
        <label>Break <input type="number" class="pomo-set-break" min="1" max="60"> min</label>
        <label>Long Break <input type="number" class="pomo-set-lbreak" min="1" max="60"> min</label>
        <label>Long Break interval <input type="number" class="pomo-set-interval" min="1" max="10"></label>
        <label><input type="checkbox" class="pomo-set-auto-break"> Auto Start Breaks</label>
        <label><input type="checkbox" class="pomo-set-auto-pomo"> Auto Start Heating</label>
        <button class="pomo-btn pomo-btn-settings-close">OK</button>
      </div>
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
        border-radius: 0 0 12px 12px;
        text-align: center;
        font-family: 'Overpass', sans-serif;
        z-index: 10;
        width: 280px;
        user-select: none;
        overflow: hidden;
      }
      .pomo-body {
        padding: 12px 28px 14px;
        max-height: 500px;
        overflow: hidden;
        transition: max-height 0.35s ease, padding 0.35s ease, opacity 0.25s ease;
        opacity: 1;
      }
      #pomodoro.collapsed .pomo-body {
        max-height: 0;
        padding: 0 28px;
        opacity: 0;
      }
      .material-symbols-rounded {
        font-family: 'Material Symbols Rounded';
        font-weight: normal;
        font-style: normal;
        font-size: inherit;
        vertical-align: middle;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-smoothing: antialiased;
      }
      .pomo-collapse-btn {
        display: block;
        width: 100%;
        background: none;
        border: none;
        color: #666;
        font-size: 18px;
        cursor: pointer;
        padding: 2px 0;
        line-height: 1;
        transition: padding 0.3s ease;
      }
      .pomo-collapse-btn:hover {
        color: #aaa;
      }
      #pomodoro.collapsed {
        opacity: 0.4;
        transition: opacity 0.3s ease;
      }
      #pomodoro.collapsed:hover {
        opacity: 1;
      }
      #pomodoro.collapsed .pomo-collapse-btn {
        padding: 4px 0;
      }
      .pomo-btn .material-symbols-rounded {
        font-size: 16px;
      }
      .pomo-btn-settings .material-symbols-rounded {
        font-size: 18px;
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
      .pomo-btn-settings {
        padding: 6px 10px;
      }
      .pomo-btn-skip {
        padding: 6px 10px;
      }
      .pomo-settings {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #444;
        text-align: left;
      }
      .pomo-settings-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1px;
        color: #aaa;
        margin-bottom: 8px;
        text-align: center;
      }
      .pomo-settings label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        margin-bottom: 6px;
        color: #ccc;
        gap: 8px;
      }
      .pomo-settings input[type="number"] {
        width: 50px;
        background: #222;
        color: #fff;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 3px 6px;
        font-size: 13px;
        text-align: center;
        font-family: 'Overpass', monospace;
      }
      .pomo-settings input[type="checkbox"] {
        accent-color: #ff6633;
        width: 16px;
        height: 16px;
      }
      .pomo-btn-settings-close {
        width: 100%;
        margin-top: 8px;
        background: #ff6633;
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

    // パネル折りたたみ
    const collapseBtn = container.querySelector('.pomo-collapse-btn');
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const collapsed = container.classList.toggle('collapsed');
      collapseBtn.innerHTML = collapsed
        ? '<span class="material-symbols-rounded">expand_more</span>'
        : '<span class="material-symbols-rounded">expand_less</span>';
    });

    // 設定パネルの開閉
    const settingsPanel = container.querySelector('.pomo-settings');
    container.querySelector('.pomo-btn-settings').addEventListener('click', (e) => {
      e.stopPropagation();
      const visible = settingsPanel.style.display !== 'none';
      if (visible) {
        settingsPanel.style.display = 'none';
      } else {
        this._loadSettingsToUI();
        settingsPanel.style.display = 'block';
      }
    });

    container.querySelector('.pomo-btn-settings-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this._applySettingsFromUI();
      settingsPanel.style.display = 'none';
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
      settingsPanel,
      setWork: container.querySelector('.pomo-set-work'),
      setBreak: container.querySelector('.pomo-set-break'),
      setLBreak: container.querySelector('.pomo-set-lbreak'),
      setInterval: container.querySelector('.pomo-set-interval'),
      setAutoBreak: container.querySelector('.pomo-set-auto-break'),
      setAutoPomo: container.querySelector('.pomo-set-auto-pomo'),
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
    const interval = pomo.settings.longBreakInterval;
    for (let i = 0; i < interval; i++) {
      const dot = document.createElement('div');
      dot.className = 'pomo-dot' + (i < pomo.completedSets ? ' filled' : '');
      el.dots.appendChild(dot);
    }

    // ボタン
    if (isIdle) {
      el.btnMain.innerHTML = '<span class="material-symbols-rounded">play_arrow</span> START';
      el.btnMain.className = 'pomo-btn pomo-btn-main start';
    } else if (pomo.running) {
      el.btnMain.innerHTML = '<span class="material-symbols-rounded">pause</span> PAUSE';
      el.btnMain.className = 'pomo-btn pomo-btn-main pause';
    } else {
      el.btnMain.innerHTML = '<span class="material-symbols-rounded">play_arrow</span> START';
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

  _loadSettingsToUI() {
    const s = this.pomodoro.settings;
    this._el.setWork.value = s.workMinutes;
    this._el.setBreak.value = s.shortBreakMinutes;
    this._el.setLBreak.value = s.longBreakMinutes;
    this._el.setInterval.value = s.longBreakInterval;
    this._el.setAutoBreak.checked = s.autoStartBreaks;
    this._el.setAutoPomo.checked = s.autoStartPomodoros;
  }

  _applySettingsFromUI() {
    this.pomodoro.updateSettings({
      workMinutes: Math.max(1, parseInt(this._el.setWork.value) || 24),
      shortBreakMinutes: Math.max(1, parseInt(this._el.setBreak.value) || 6),
      longBreakMinutes: Math.max(1, parseInt(this._el.setLBreak.value) || 12),
      longBreakInterval: Math.max(1, parseInt(this._el.setInterval.value) || 3),
      autoStartBreaks: this._el.setAutoBreak.checked,
      autoStartPomodoros: this._el.setAutoPomo.checked,
    });
    this._render();
  }

  _onPhaseComplete(prevState, nextState) {
    this._render();
    this._notifyPhaseChange(prevState, nextState);

    if (nextState === STATE.WORK && this.pomodoro.running) {
      // Auto Start Pomodoros でワークが自動開始された
      this._onSessionStart();
    } else if (nextState !== STATE.WORK) {
      // HEATING以外に遷移したら時計を停止（スイープで通常時刻に戻る）
      this._onSessionStop();
    }
  }

  _notifyPhaseChange(prevState, nextState) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = nextState === STATE.WORK ? 'Heating Time' : 'Break Time';
      const s = this.pomodoro.settings;
      const body = nextState === STATE.WORK
        ? 'サウナに入りましょう'
        : nextState === STATE.LONG_BREAK
          ? `ロング休憩です（${s.longBreakMinutes}分）`
          : `短い休憩です（${s.shortBreakMinutes}分）`;
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
