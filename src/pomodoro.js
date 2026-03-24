/**
 * ポモドーロタイマーのロジック
 */

const STATE = {
  IDLE: 'idle',
  WORK: 'work',
  SHORT_BREAK: 'short_break',
  LONG_BREAK: 'long_break',
};

const DEFAULT_MINUTES = {
  [STATE.WORK]: 24,
  [STATE.SHORT_BREAK]: 6,
  [STATE.LONG_BREAK]: 12,
};

const SETS_BEFORE_LONG_BREAK = 3;

export class Pomodoro {
  constructor({ onTick, onStateChange, onComplete } = {}) {
    this.state = STATE.IDLE;
    this.completedSets = 0;
    this.remainingMs = DEFAULT_MINUTES[STATE.WORK] * 60 * 1000;
    this.totalMs = this.remainingMs;
    this.running = false;
    this._lastTimestamp = null;

    // コールバック
    this.onTick = onTick || (() => {});
    this.onStateChange = onStateChange || (() => {});
    this.onComplete = onComplete || (() => {});
  }

  /** 開始 / 再開 */
  start() {
    if (this.state === STATE.IDLE) {
      this._switchState(STATE.WORK);
    }
    this.running = true;
    this._lastTimestamp = performance.now();
  }

  /** 一時停止 */
  pause() {
    this.running = false;
    this._lastTimestamp = null;
  }

  /** 開始/一時停止のトグル */
  toggle() {
    if (this.running) {
      this.pause();
    } else {
      this.start();
    }
  }

  /** 次のフェーズへ手動で進む */
  skip() {
    this._completeCurrentPhase();
  }

  /** リセット */
  reset() {
    this.running = false;
    this.state = STATE.IDLE;
    this.completedSets = 0;
    this.remainingMs = DEFAULT_MINUTES[STATE.WORK] * 60 * 1000;
    this.totalMs = this.remainingMs;
    this._lastTimestamp = null;
    this.onStateChange(this.state, this.completedSets);
    this.onTick(this.remainingMs, this.totalMs);
  }

  /** 毎フレーム呼ぶ */
  update() {
    if (!this.running) return;

    const now = performance.now();
    if (this._lastTimestamp === null) {
      this._lastTimestamp = now;
      return;
    }

    const delta = now - this._lastTimestamp;
    this._lastTimestamp = now;

    this.remainingMs -= delta;

    if (this.remainingMs <= 0) {
      this.remainingMs = 0;
      this._completeCurrentPhase();
      return;
    }

    this.onTick(this.remainingMs, this.totalMs);
  }

  _completeCurrentPhase() {
    this.running = false;
    this._lastTimestamp = null;

    const prevState = this.state;

    if (prevState === STATE.WORK || prevState === STATE.IDLE) {
      this.completedSets++;

      if (this.completedSets >= SETS_BEFORE_LONG_BREAK) {
        this._switchState(STATE.LONG_BREAK);
      } else {
        this._switchState(STATE.SHORT_BREAK);
      }
    } else {
      // 休憩終了 → IDLE に戻る（手動で次を開始）
      if (prevState === STATE.LONG_BREAK) {
        this.completedSets = 0;
      }
      this._switchState(STATE.IDLE);
    }

    this.onComplete(prevState, this.state, this.completedSets);
  }

  _switchState(newState) {
    this.state = newState;
    const minutes = newState === STATE.IDLE
      ? DEFAULT_MINUTES[STATE.WORK]
      : DEFAULT_MINUTES[newState];
    this.totalMs = minutes * 60 * 1000;
    this.remainingMs = this.totalMs;
    this.onStateChange(this.state, this.completedSets);
    this.onTick(this.remainingMs, this.totalMs);
  }

  /** 表示用: 残り時間を mm:ss 形式で返す */
  get displayTime() {
    const totalSeconds = Math.ceil(this.remainingMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /** 表示用: 進捗率 0〜1 */
  get progress() {
    if (this.totalMs === 0) return 0;
    return 1 - this.remainingMs / this.totalMs;
  }

  /** 表示用: 状態ラベル */
  get stateLabel() {
    switch (this.state) {
      case STATE.IDLE: return 'READY';
      case STATE.WORK: return 'HEATING';
      case STATE.SHORT_BREAK: return 'BREAK';
      case STATE.LONG_BREAK: return 'LONG BREAK';
      default: return '';
    }
  }

  get isBreak() {
    return this.state === STATE.SHORT_BREAK || this.state === STATE.LONG_BREAK;
  }
}

export { STATE };
