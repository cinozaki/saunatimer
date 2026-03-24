import * as THREE from 'three';

const FRONT_VIEW = {
  position: new THREE.Vector3(0, 1.6, 1.8),
  lookAt: new THREE.Vector3(0, 1.6, 0),
};

const OVERVIEW = {
  position: new THREE.Vector3(0, 5.5, 3.5),
  lookAt: new THREE.Vector3(0, 1.0, 0),
};

const TRANSITION_DURATION = 1.0; // 秒

/**
 * 正面/俯瞰の2視点をクリックで切り替えるコントローラー
 */
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.isFrontView = true;
    this._transitioning = false;
    this._progress = 0;
    this._from = { position: new THREE.Vector3(), lookAt: new THREE.Vector3() };
    this._to = { position: new THREE.Vector3(), lookAt: new THREE.Vector3() };
    this._currentLookAt = FRONT_VIEW.lookAt.clone();

    // 初期位置
    camera.position.copy(FRONT_VIEW.position);
    camera.lookAt(FRONT_VIEW.lookAt);
  }

  toggle() {
    if (this._transitioning) return;

    this._transitioning = true;
    this._progress = 0;

    const from = this.isFrontView ? FRONT_VIEW : OVERVIEW;
    const to = this.isFrontView ? OVERVIEW : FRONT_VIEW;

    this._from.position.copy(from.position);
    this._from.lookAt.copy(from.lookAt);
    this._to.position.copy(to.position);
    this._to.lookAt.copy(to.lookAt);

    this.isFrontView = !this.isFrontView;
  }

  /** 毎フレーム呼ぶ。deltaTime は秒単位 */
  update(deltaTime) {
    if (!this._transitioning) return;

    this._progress += deltaTime / TRANSITION_DURATION;
    if (this._progress >= 1) {
      this._progress = 1;
      this._transitioning = false;
    }

    // ease in-out
    const t = this._progress < 0.5
      ? 2 * this._progress * this._progress
      : 1 - Math.pow(-2 * this._progress + 2, 2) / 2;

    this.camera.position.lerpVectors(this._from.position, this._to.position, t);
    this._currentLookAt.lerpVectors(this._from.lookAt, this._to.lookAt, t);
    this.camera.lookAt(this._currentLookAt);
  }
}
