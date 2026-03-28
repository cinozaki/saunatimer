import * as THREE from 'three';
import { buildSaunaRoom } from './sauna-room.js';
import { buildFurniture, createSteamEffect, triggerLoyly, updateSteamEffect } from './furniture.js';
import { buildChillSpace, updateChillSpace } from './chill-space.js';
import { ClockTexture } from './clock-texture.js';
import { PomodoroPanel } from './pomodoro-panel.js';
import { CameraController } from './camera-controller.js';

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
document.body.appendChild(renderer.domElement);

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0e05);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// デバッグ用: Playwright スクリーンショットスクリプトからカメラを操作可能にする
if (typeof window !== 'undefined') {
  window.__THREE__ = { _camera: camera, _scene: scene };
}

// --- サウナ室 ---
buildSaunaRoom(scene);
buildFurniture(scene);
buildChillSpace(scene);
createSteamEffect(scene);

// --- 時計 ---
const clock = new ClockTexture();
const clockGeometry = new THREE.PlaneGeometry(0.8, 0.8);
const clockMaterial = new THREE.MeshStandardMaterial({
  map: clock.texture,
  transparent: true,
  roughness: 0.4,
  metalness: 0.0,
});
const clockMesh = new THREE.Mesh(clockGeometry, clockMaterial);
clockMesh.position.set(0, 1.8, -1.98);
scene.add(clockMesh);

// --- ポモドーロ（HTMLオーバーレイ、時計・カメラと連動） ---
const pomodoroPanel = new PomodoroPanel({
  onSessionStart: () => {
    clock.startSession();
    cameraCtrl.moveTo('front');
  },
  onSessionPause: () => clock.pauseSession(),
  onSessionResume: () => clock.resumeSession(),
  onSessionStop: () => {
    clock.stopSession();
    cameraCtrl.moveTo('chill');
  },
});

// ブラウザ通知の許可をリクエスト
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// --- カメラコントローラー ---
const cameraCtrl = new CameraController(camera);

// --- Raycaster（桶クリック検知） ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerClick(clientX, clientY) {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(scene.children, true);
  for (const hit of hits) {
    if (hit.object.name === 'loyly-bucket') {
      triggerLoyly();
      return; // 桶をクリックした場合はカメラ切替しない
    }
  }
  cameraCtrl.toggle();
}

renderer.domElement.addEventListener('click', (e) => onPointerClick(e.clientX, e.clientY));
renderer.domElement.addEventListener('touchend', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  onPointerClick(t.clientX, t.clientY);
});

// --- Resize ---
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

// --- Animation loop ---
const threeClock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = threeClock.getDelta();
  const elapsed = threeClock.getElapsedTime();
  cameraCtrl.update(delta);
  clock.update();
  pomodoroPanel.update();
  updateChillSpace(elapsed);
  updateSteamEffect(delta, camera);
  renderer.render(scene, camera);
}
animate();
