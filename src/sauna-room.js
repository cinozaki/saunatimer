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
  // 左壁（-x）は窓を開けるので削除し、個別パネルで構築
  const transparentMat = new THREE.MeshBasicMaterial({ visible: false });
  const materials = [
    wallMaterial,     // +x (右壁)
    transparentMat,   // -x (左壁 → 個別構築)
    ceilingMaterial,  // +y (天井)
    floorMaterial,    // -y (床)
    wallMaterial,     // +z (奥壁)
    wallMaterial,     // -z (手前壁 = カメラの背後)
  ];

  const roomGeometry = new THREE.BoxGeometry(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH);
  // 左壁（materialIndex=1）の三角形を削除
  roomGeometry.groups = roomGeometry.groups.filter(g => g.materialIndex !== 1);
  const room = new THREE.Mesh(roomGeometry, materials);
  room.position.set(0, ROOM_HEIGHT / 2, 0);
  scene.add(room);

  // --- 左壁（窓付き、厚みあり） ---
  const LEFT_X = -ROOM_WIDTH / 2;
  const WALL_T = 0.12;
  const WIN_BOTTOM = 1.2;
  const WIN_TOP = 1.8;
  const WIN_H = WIN_TOP - WIN_BOTTOM;
  const DOOR_EDGE_Z = 0.45;
  const WIN_Z_START = -ROOM_DEPTH / 2 + 0.3;
  const WIN_W = DOOR_EDGE_Z - WIN_Z_START;
  const WIN_CENTER_Z = (WIN_Z_START + DOOR_EDGE_Z) / 2;

  const wallMatInner = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // 壁パネル（窓より下 — 全幅）
  const lWallBottomGeo = new THREE.BoxGeometry(WALL_T, WIN_BOTTOM, ROOM_DEPTH);
  const lWallBottom = new THREE.Mesh(lWallBottomGeo, wallMatInner);
  lWallBottom.position.set(LEFT_X, WIN_BOTTOM / 2, 0);
  scene.add(lWallBottom);

  // 壁パネル（窓より上 — 全幅）
  const upperH = ROOM_HEIGHT - WIN_TOP;
  const lWallTopGeo = new THREE.BoxGeometry(WALL_T, upperH, ROOM_DEPTH);
  const lWallTop = new THREE.Mesh(lWallTopGeo, wallMatInner);
  lWallTop.position.set(LEFT_X, WIN_TOP + upperH / 2, 0);
  scene.add(lWallTop);

  // 窓の左パネル（奥壁側）
  const leftPanelW = WIN_Z_START - (-ROOM_DEPTH / 2);
  if (leftPanelW > 0) {
    const geo = new THREE.BoxGeometry(WALL_T, WIN_H, leftPanelW);
    const panel = new THREE.Mesh(geo, wallMatInner);
    panel.position.set(LEFT_X, WIN_BOTTOM + WIN_H / 2, -ROOM_DEPTH / 2 + leftPanelW / 2);
    scene.add(panel);
  }

  // 窓の右パネル（ドア側〜手前壁）
  const rightPanelW = ROOM_DEPTH / 2 - DOOR_EDGE_Z;
  if (rightPanelW > 0) {
    const geo = new THREE.BoxGeometry(WALL_T, WIN_H, rightPanelW);
    const panel = new THREE.Mesh(geo, wallMatInner);
    panel.position.set(LEFT_X, WIN_BOTTOM + WIN_H / 2, DOOR_EDGE_Z + rightPanelW / 2);
    scene.add(panel);
  }

  // 窓ガラス
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xaaccdd,
    roughness: 0.05,
    metalness: 0.15,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const glassGeo = new THREE.PlaneGeometry(WIN_W, WIN_H);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(LEFT_X, WIN_BOTTOM + WIN_H / 2, WIN_CENTER_Z);
  scene.add(glass);

  // 窓枠
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x5a3518,
    roughness: 0.7,
    metalness: 0.05,
  });
  const frameT = 0.035;
  [WIN_BOTTOM, WIN_TOP].forEach((fy) => {
    const geo = new THREE.BoxGeometry(frameT, frameT, WIN_W + frameT * 2);
    const frame = new THREE.Mesh(geo, frameMat);
    frame.position.set(LEFT_X, fy, WIN_CENTER_Z);
    scene.add(frame);
  });
  [WIN_Z_START, DOOR_EDGE_Z].forEach((fz) => {
    const geo = new THREE.BoxGeometry(frameT, WIN_H + frameT * 2, frameT);
    const frame = new THREE.Mesh(geo, frameMat);
    frame.position.set(LEFT_X, WIN_BOTTOM + WIN_H / 2, fz);
    scene.add(frame);
  });

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
