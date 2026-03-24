import * as THREE from 'three';
import { createWoodTexture } from './wood-texture.js';

const ROOM_WIDTH = 4;
const ROOM_HEIGHT = 3;
const ROOM_DEPTH = 4;

/**
 * サウナ室を構築してsceneに追加する
 * @param {THREE.Scene} scene
 */
export function buildSaunaRoom(scene) {
  const wallTexture = createWoodTexture({
    baseColor: '#a06830',
    grainColor: '#7a4820',
    horizontal: true,
  });

  const floorTexture = createWoodTexture({
    baseColor: '#8b5e2a',
    grainColor: '#6b4420',
    horizontal: false,
  });

  const ceilingTexture = createWoodTexture({
    baseColor: '#c08040',
    grainColor: '#9a6530',
    horizontal: true,
  });

  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.BackSide,
  });

  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.BackSide,
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: ceilingTexture,
    roughness: 0.8,
    metalness: 0.0,
    side: THREE.BackSide,
  });

  // 部屋を BoxGeometry の内側 (BackSide) で構成
  // 各面に異なるマテリアルを割り当て: +x, -x, +y, -y, +z, -z
  const materials = [
    wallMaterial,     // +x (右壁)
    wallMaterial,     // -x (左壁)
    ceilingMaterial,  // +y (天井)
    floorMaterial,    // -y (床)
    wallMaterial,     // +z (奥壁)
    wallMaterial,     // -z (手前壁 = カメラの背後)
  ];

  const roomGeometry = new THREE.BoxGeometry(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH);
  const room = new THREE.Mesh(roomGeometry, materials);
  room.position.set(0, ROOM_HEIGHT / 2, 0);
  scene.add(room);

  // --- ライティング ---

  // 環境光（暖色で薄暗く）
  const ambientLight = new THREE.AmbientLight(0xff9944, 0.15);
  scene.add(ambientLight);

  // メインのポイントライト（天井付近、暖色）
  const mainLight = new THREE.PointLight(0xff8830, 1.5, 8);
  mainLight.position.set(0, 2.7, 0);
  mainLight.castShadow = true;
  scene.add(mainLight);

  // サブライト（壁側から補助光）
  const fillLight = new THREE.PointLight(0xffaa55, 0.5, 6);
  fillLight.position.set(-1.5, 1.5, -1);
  scene.add(fillLight);

  // 時計用スポットライト（上から文字盤を照らす）
  const clockSpot = new THREE.SpotLight(0xffeedd, 2.0, 5, Math.PI / 6, 0.5);
  clockSpot.position.set(0, 2.7, -1.5);
  clockSpot.target.position.set(0, 1.8, -2.0);
  scene.add(clockSpot);
  scene.add(clockSpot.target);
}
