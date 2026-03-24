import * as THREE from 'three';
import { buildSaunaRoom } from './sauna-room.js';
import { buildFurniture } from './furniture.js';
import { ClockTexture } from './clock-texture.js';
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

// --- サウナ室 ---
buildSaunaRoom(scene);
buildFurniture(scene);

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

// --- カメラコントローラー ---
const cameraCtrl = new CameraController(camera, renderer.domElement);

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
  cameraCtrl.update(delta);
  clock.update();
  renderer.render(scene, camera);
}
animate();
