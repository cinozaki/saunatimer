import * as THREE from 'three';
import { createWoodTexture } from './wood-texture.js';

/**
 * 3段ベンチを構築する（右壁全面、奥が最上段→手前が最下段）
 */
function buildBench(scene) {
  const benchTexture = createWoodTexture({
    width: 256,
    height: 256,
    baseColor: '#a07040',
    grainColor: '#7a5228',
    horizontal: true,
  });
  const benchMat = new THREE.MeshStandardMaterial({
    map: benchTexture,
    roughness: 0.85,
    metalness: 0.0,
  });

  const WALL_X = 1.95;          // 右壁の位置
  const SEAT_THICKNESS = 0.05;
  const SEAT_WIDTH = 0.5;       // 各段の幅（X方向）
  const BENCH_Z_START = -1.7;   // 奥端
  const BENCH_Z_END = 1.8;      // 手前端
  const BENCH_LENGTH = BENCH_Z_END - BENCH_Z_START;
  const BENCH_CENTER_Z = (BENCH_Z_START + BENCH_Z_END) / 2;

  // 3段: 右壁から左に向かって段が下がる
  const tiers = [
    { y: 1.3,  x: WALL_X - SEAT_WIDTH / 2 },                    // 最上段（右壁寄り）
    { y: 0.85, x: WALL_X - SEAT_WIDTH - SEAT_WIDTH / 2 },       // 中段
    { y: 0.4,  x: WALL_X - SEAT_WIDTH * 2 - SEAT_WIDTH / 2 },   // 最下段（部屋中央寄り）
  ];

  const group = new THREE.Group();

  tiers.forEach((t) => {
    // 座面
    const seatGeo = new THREE.BoxGeometry(SEAT_WIDTH, SEAT_THICKNESS, BENCH_LENGTH);
    const seat = new THREE.Mesh(seatGeo, benchMat);
    seat.position.set(t.x, t.y, BENCH_CENTER_Z);
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);

    // 支柱（等間隔に配置）
    const legCount = Math.max(2, Math.ceil(BENCH_LENGTH / 0.8));
    const legGeo = new THREE.BoxGeometry(0.05, t.y - SEAT_THICKNESS / 2, 0.05);
    for (let li = 0; li < legCount; li++) {
      const legZ = BENCH_Z_START + 0.1 + (BENCH_LENGTH - 0.2) * (li / (legCount - 1));
      const leg = new THREE.Mesh(legGeo, benchMat);
      leg.position.set(t.x, t.y / 2, legZ);
      group.add(leg);
    }
  });

  // 背もたれ（右壁全面、最上段の背面）
  const backHeight = 0.5;
  const backGeo = new THREE.BoxGeometry(0.05, backHeight, BENCH_LENGTH);
  const back = new THREE.Mesh(backGeo, benchMat);
  back.position.set(WALL_X, tiers[0].y + backHeight / 2, BENCH_CENTER_Z);
  group.add(back);

  scene.add(group);
}

/**
 * IKI風サウナストーブを構築する
 * 縦長の円筒フレームにストーンが詰まった形状
 */
function buildStove(scene) {
  const group = new THREE.Group();
  group.position.set(-1.2, 0, -1.2);

  const STOVE_RADIUS = 0.22;
  const STOVE_HEIGHT = 1.0;
  const BAR_COUNT = 12;

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.85,
  });

  // --- ベースプレート ---
  const baseGeo = new THREE.CylinderGeometry(STOVE_RADIUS + 0.03, STOVE_RADIUS + 0.05, 0.05, 24);
  const base = new THREE.Mesh(baseGeo, metalMat);
  base.position.y = 0.025;
  group.add(base);

  // --- 縦バー（IKI特有のオープンフレーム） ---
  const barGeo = new THREE.CylinderGeometry(0.012, 0.012, STOVE_HEIGHT, 6);
  for (let i = 0; i < BAR_COUNT; i++) {
    const angle = (i / BAR_COUNT) * Math.PI * 2;
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.position.set(
      Math.cos(angle) * STOVE_RADIUS,
      STOVE_HEIGHT / 2 + 0.05,
      Math.sin(angle) * STOVE_RADIUS
    );
    group.add(bar);
  }

  // --- リングバンド（上中下3本） ---
  const ringYPositions = [0.15, 0.5, 0.85];
  ringYPositions.forEach((ry) => {
    const ringGeo = new THREE.TorusGeometry(STOVE_RADIUS, 0.015, 8, 24);
    const ring = new THREE.Mesh(ringGeo, metalMat);
    ring.position.y = ry + 0.05;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  });

  // --- トップリング ---
  const topRingGeo = new THREE.TorusGeometry(STOVE_RADIUS, 0.02, 8, 24);
  const topRing = new THREE.Mesh(topRingGeo, metalMat);
  topRing.position.y = STOVE_HEIGHT + 0.05;
  topRing.rotation.x = Math.PI / 2;
  group.add(topRing);

  // --- サウナストーン（フレーム内に大量に詰める） ---
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.95,
    metalness: 0.05,
  });
  const stoneDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.95,
    metalness: 0.05,
  });

  // ランダムシード的に石を詰める
  const stoneRows = 8;
  for (let row = 0; row < stoneRows; row++) {
    const y = 0.12 + (row / stoneRows) * (STOVE_HEIGHT - 0.1);
    const stonesInRow = row === stoneRows - 1 ? 4 : 6;
    const innerRadius = STOVE_RADIUS * 0.55;

    for (let si = 0; si < stonesInRow; si++) {
      const angle = (si / stonesInRow) * Math.PI * 2 + row * 0.5;
      const r = innerRadius + Math.sin(si * 3.7) * 0.05;
      const size = 0.04 + Math.abs(Math.sin(si * 2.3 + row * 1.7)) * 0.035;
      const stoneGeo = new THREE.DodecahedronGeometry(size, 0);
      const mat = (si + row) % 3 === 0 ? stoneDarkMat : stoneMat;
      const stone = new THREE.Mesh(stoneGeo, mat);
      stone.position.set(
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r
      );
      stone.rotation.set(si * 1.2, row * 0.8, si * 0.5);
      group.add(stone);
    }
  }

  // 頂上に盛り上がった石
  const topStones = [
    [0, 1.08, 0, 0.055],
    [0.07, 1.05, 0.05, 0.04],
    [-0.05, 1.06, 0.07, 0.045],
    [0.04, 1.07, -0.06, 0.04],
    [-0.07, 1.05, -0.04, 0.04],
  ];
  topStones.forEach(([sx, sy, sz, sr]) => {
    const geo = new THREE.DodecahedronGeometry(sr, 0);
    const stone = new THREE.Mesh(geo, stoneMat);
    stone.position.set(sx, sy, sz);
    group.add(stone);
  });

  // --- ストーブからの暖かい光 ---
  const stoveLight = new THREE.PointLight(0xff4400, 0.8, 3.5);
  stoveLight.position.set(0, 0.5, 0);
  group.add(stoveLight);

  const topGlow = new THREE.PointLight(0xff6622, 0.4, 2);
  topGlow.position.set(0, 1.1, 0);
  group.add(topGlow);

  scene.add(group);

  // --- ストーブ周りの柵 ---
  buildStoveGuard(scene, group.position);
}

/**
 * ストーブ周りのガードレール（柵）
 */
function buildStoveGuard(scene, stovePos) {
  const group = new THREE.Group();
  group.position.copy(stovePos);

  const GUARD_RADIUS = 0.55;
  const RAIL_COUNT = 3;
  const RAIL_SPACING = 0.12;
  const TOP_RAIL_Y = 0.6;
  const POST_COUNT = 8;
  const GUARD_HEIGHT = TOP_RAIL_Y; // 柱はトップレールまで

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9a7040,
    roughness: 0.85,
    metalness: 0.0,
  });

  // 柱（全周に配置、トップレールの高さまで）
  const postGeo = new THREE.CylinderGeometry(0.02, 0.02, GUARD_HEIGHT, 8);

  for (let i = 0; i < POST_COUNT; i++) {
    const angle = (i / POST_COUNT) * Math.PI * 2;
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(
      Math.cos(angle) * GUARD_RADIUS,
      GUARD_HEIGHT / 2,
      Math.sin(angle) * GUARD_RADIUS
    );
    group.add(post);
  }

  // 横レール3段（上から下へ配置）
  for (let ri = 0; ri < RAIL_COUNT; ri++) {
    const railY = TOP_RAIL_Y - ri * RAIL_SPACING;
    const points = [];
    const segments = 32;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * GUARD_RADIUS,
        railY,
        Math.sin(angle) * GUARD_RADIUS
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.015, 6, true);
    const rail = new THREE.Mesh(tubeGeo, woodMat);
    group.add(rail);
  }

  scene.add(group);
}

/**
 * ロウリュ用の桶を構築する
 */
function buildBucket(scene) {
  const group = new THREE.Group();
  group.position.set(-0.6, 0, -0.8);

  // 桶本体（円柱、中空風）
  const outerGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.2, 12);
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xb08050,
    roughness: 0.85,
    metalness: 0.0,
  });
  const outer = new THREE.Mesh(outerGeo, woodMat);
  outer.position.y = 0.1;
  outer.castShadow = true;
  outer.name = 'loyly-bucket';
  group.add(outer);

  // タガ（金属バンド）
  const bandGeo = new THREE.TorusGeometry(0.115, 0.008, 8, 24);
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
    metalness: 0.9,
  });
  const band1 = new THREE.Mesh(bandGeo, bandMat);
  band1.position.y = 0.15;
  band1.rotation.x = Math.PI / 2;
  group.add(band1);

  const band2 = new THREE.Mesh(bandGeo, bandMat);
  band2.position.y = 0.05;
  band2.rotation.x = Math.PI / 2;
  group.add(band2);

  // 柄杓（ラドル）- 長い棒 + 小さいカップ
  const handleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6);
  const handle = new THREE.Mesh(handleGeo, woodMat);
  handle.position.set(0.05, 0.25, 0);
  handle.rotation.z = -0.3;
  group.add(handle);

  const ladleGeo = new THREE.SphereGeometry(0.04, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const ladle = new THREE.Mesh(ladleGeo, bandMat);
  ladle.position.set(-0.06, 0.06, 0);
  ladle.rotation.z = Math.PI;
  group.add(ladle);

  scene.add(group);
}

/**
 * サウナ室左壁のウッドドア（丸窓付き）
 */
function buildDoor(scene) {
  const WALL_X = -1.99; // 左壁の内側表面に重ねる
  const DOOR_Z = 1.2;
  const DOOR_W = 0.85;
  const DOOR_H = 2.05;

  const group = new THREE.Group();

  // ドアパネル（木目テクスチャ）
  const doorTexture = createWoodTexture({
    width: 256,
    height: 512,
    baseColor: '#8a5a30',
    grainColor: '#6a4020',
    horizontal: false,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTexture,
    roughness: 0.8,
    metalness: 0.0,
  });
  const doorGeo = new THREE.PlaneGeometry(DOOR_W, DOOR_H);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.rotation.y = Math.PI / 2;
  door.position.set(WALL_X, DOOR_H / 2 + 0.02, DOOR_Z);
  group.add(door);

  // ドア枠
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x5a3518,
    roughness: 0.7,
    metalness: 0.0,
  });
  const frameThick = 0.06;
  // 上枠
  const topGeo = new THREE.BoxGeometry(frameThick, 0.06, DOOR_W + frameThick * 2);
  const topFrame = new THREE.Mesh(topGeo, frameMat);
  topFrame.position.set(WALL_X, DOOR_H + 0.05, DOOR_Z);
  group.add(topFrame);
  // 左枠
  const sideGeo = new THREE.BoxGeometry(frameThick, DOOR_H + 0.06, 0.06);
  const leftFrame = new THREE.Mesh(sideGeo, frameMat);
  leftFrame.position.set(WALL_X, DOOR_H / 2 + 0.02, DOOR_Z - DOOR_W / 2 - 0.03);
  group.add(leftFrame);
  // 右枠
  const rightFrame = new THREE.Mesh(sideGeo, frameMat);
  rightFrame.position.set(WALL_X, DOOR_H / 2 + 0.02, DOOR_Z + DOOR_W / 2 + 0.03);
  group.add(rightFrame);

  // 丸窓（ドア上部）
  const WINDOW_Y = 1.5;
  const WINDOW_R = 0.15;
  // 窓枠（トーラス）
  const windowFrameGeo = new THREE.TorusGeometry(WINDOW_R, 0.015, 8, 24);
  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
    metalness: 0.7,
  });
  const windowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
  windowFrame.rotation.y = Math.PI / 2;
  windowFrame.position.set(WALL_X - 0.01, WINDOW_Y, DOOR_Z);
  group.add(windowFrame);

  // 窓ガラス（半透明の円）
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xaaccdd,
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.4,
  });
  const glassGeo = new THREE.CircleGeometry(WINDOW_R - 0.01, 24);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(WALL_X - 0.015, WINDOW_Y, DOOR_Z);
  group.add(glass);

  // 四角い取手（コの字型ハンドル、両面）
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.3,
    metalness: 0.8,
  });
  const HANDLE_W = 0.02;   // 断面の太さ
  const HANDLE_H = 0.12;   // 握り部分の長さ（縦）
  const HANDLE_D = 0.04;   // 壁からの出っ張り
  const HANDLE_Z = DOOR_Z - 0.3;
  const HANDLE_Y = 1.0;

  const gripGeo = new THREE.BoxGeometry(HANDLE_D, HANDLE_H, HANDLE_W);
  const bracketGeo = new THREE.BoxGeometry(HANDLE_D, HANDLE_W, HANDLE_W);

  // 外側（チルスペース側）・内側（サウナ室側）両方に取手
  [-(0.02 + HANDLE_D / 2), (0.02 + HANDLE_D / 2)].forEach((dx) => {
    const grip = new THREE.Mesh(gripGeo, handleMat);
    grip.position.set(WALL_X + dx, HANDLE_Y, HANDLE_Z);
    group.add(grip);

    const topBracket = new THREE.Mesh(bracketGeo, handleMat);
    topBracket.position.set(WALL_X + dx, HANDLE_Y + HANDLE_H / 2 - HANDLE_W / 2, HANDLE_Z);
    group.add(topBracket);

    const bottomBracket = new THREE.Mesh(bracketGeo, handleMat);
    bottomBracket.position.set(WALL_X + dx, HANDLE_Y - HANDLE_H / 2 + HANDLE_W / 2, HANDLE_Z);
    group.add(bottomBracket);
  });

  scene.add(group);
}

/**
 * すべての調度品をシーンに追加
 */
export function buildFurniture(scene) {
  buildBench(scene);
  buildStove(scene);
  buildBucket(scene);
  buildDoor(scene);
}

/**
 * ロウリュ蒸気エフェクト
 * ストーブ上部から蒸気パーティクルが立ち上る
 */
const STOVE_POS = { x: -1.2, z: -1.2 };
const STEAM_COUNT = 60;

let _steamParticles = null;
let _steamActive = false;
let _steamTimer = 0;

export function createSteamEffect(scene) {
  const particles = [];
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  for (let i = 0; i < STEAM_COUNT; i++) {
    const size = 0.04 + Math.random() * 0.06;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = steamMat.clone();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    scene.add(mesh);
    particles.push({
      mesh,
      mat,
      // 各パーティクルの初期パラメータ（emit 時にセット）
      vx: 0, vy: 0, vz: 0,
      life: 0, maxLife: 0, size,
    });
  }

  _steamParticles = particles;
}

/** ロウリュを発動する */
export function triggerLoyly() {
  if (_steamActive) return; // 連打防止
  _steamActive = true;
  _steamTimer = 0;

  // 全パーティクルをストーブ上部にランダム配置して放出
  for (const p of _steamParticles) {
    _emitParticle(p);
  }
}

function _emitParticle(p) {
  const spread = 0.15;
  p.mesh.position.set(
    STOVE_POS.x + (Math.random() - 0.5) * spread,
    1.0 + Math.random() * 0.1,
    STOVE_POS.z + (Math.random() - 0.5) * spread,
  );
  p.vx = (Math.random() - 0.5) * 0.04;
  p.vy = 0.25 + Math.random() * 0.2;
  p.vz = (Math.random() - 0.5) * 0.04;
  p.life = 0;
  p.maxLife = 5 + Math.random() * 6;
  p.mesh.visible = true;
  p.mesh.scale.setScalar(0.5);
  p.mat.opacity = 0;
}

/** 毎フレーム呼び出し */
export function updateSteamEffect(delta, camera) {
  if (!_steamParticles || !_steamActive) return;

  _steamTimer += delta;
  let allDone = true;

  for (const p of _steamParticles) {
    if (!p.mesh.visible) continue;

    p.life += delta;
    if (p.life >= p.maxLife) {
      p.mesh.visible = false;
      p.mat.opacity = 0;
      continue;
    }

    allDone = false;
    const t = p.life / p.maxLife; // 0→1

    // 上昇 + 横に揺れる
    p.mesh.position.x += p.vx * delta + Math.sin(p.life * 3 + p.vx * 10) * 0.002;
    p.mesh.position.y += p.vy * delta;
    p.mesh.position.z += p.vz * delta + Math.cos(p.life * 2.5 + p.vz * 10) * 0.002;

    // 上昇速度を徐々に減速
    p.vy *= 0.995;

    // スケール: 小→大
    const scale = 0.5 + t * 2.5;
    p.mesh.scale.setScalar(scale);

    // 透明度: ふわっと出て消える
    if (t < 0.15) {
      p.mat.opacity = (t / 0.15) * 0.35;
    } else {
      p.mat.opacity = 0.35 * (1 - (t - 0.15) / 0.85);
    }

    // ビルボード（常にカメラに向く）
    p.mesh.quaternion.copy(camera.quaternion);
  }

  if (allDone) {
    _steamActive = false;
  }
}
