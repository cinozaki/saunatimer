import * as THREE from 'three';

const VIEWS = {
  front: {
    position: new THREE.Vector3(0, 1.6, 1.8),
    lookAt: new THREE.Vector3(0, 1.6, 0),
  },
  overview: {
    position: new THREE.Vector3(0, 5.5, 3.5),
    lookAt: new THREE.Vector3(0, 1.0, 0),
  },
  chill: {
    position: new THREE.Vector3(-4.5, 1.4, 2.2),
    lookAt: new THREE.Vector3(-5.5, 0.6, -0.3),
  },
};

const TRANSITION_DURATION = 1.0; // 秒

/**
 * カメラコントローラー
 */
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this._currentView = 'front';
    this._transitioning = false;
    this._progress = 0;
    this._from = { position: new THREE.Vector3(), lookAt: new THREE.Vector3() };
    this._to = { position: new THREE.Vector3(), lookAt: new THREE.Vector3() };
    this._currentLookAt = VIEWS.front.lookAt.clone();

    camera.position.copy(VIEWS.front.position);
    camera.lookAt(VIEWS.front.lookAt);
  }

  /** サウナ室内の正面/俯瞰をトグル */
  toggle() {
    if (this._transitioning) return;
    if (this._currentView === 'front') {
      this.moveTo('overview');
    } else {
      this.moveTo('front');
    }
  }

  /** 指定ビューへ遷移 */
  moveTo(viewName) {
    if (this._transitioning) return;
    const target = VIEWS[viewName];
    if (!target || this._currentView === viewName) return;

    this._transitioning = true;
    this._progress = 0;

    this._from.position.copy(this.camera.position);
    this._from.lookAt.copy(this._currentLookAt);
    this._to.position.copy(target.position);
    this._to.lookAt.copy(target.lookAt);

    this._currentView = viewName;
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
