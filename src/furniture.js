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
 * すべての調度品をシーンに追加
 */
export function buildFurniture(scene) {
  buildBench(scene);
  buildStove(scene);
  buildBucket(scene);
}
