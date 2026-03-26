import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// チルスペースはサウナ室(x:-2〜+2)の左側に配置
const SPACE_WIDTH = 6;
const SPACE_DEPTH = 4;
const SPACE_HEIGHT = 3;
const ORIGIN_X = -2 - SPACE_WIDTH / 2; // = -5

// 水面アニメーション用
let _waterSurface = null;
let _waterBaseY = 0;
let _spoutLocalX = 0;
let _spoutLocalZ = 0;
let _waterWidth = 0;
let _waterDepth = 0;
// 注水アニメーション用
let _streamMesh = null;
let _streamCanvas = null;
let _streamCtx = null;
let _streamTexture = null;

/**
 * チルスペース（水風呂 + 外気浴）を構築する
 * 草加健康センター風: 石畳の床、半屋外、水風呂、アディロンダックチェア
 */
export function buildChillSpace(scene) {
  const group = new THREE.Group();

  _buildFloor(group);
  _buildWalls(group);
  _buildColdBath(group);
  _buildChairs(group);

  // --- ライティング（朝焼けの雰囲気、PointLight で距離制限） ---
  // 空からの朝焼け光（オレンジ〜ピンク）
  const sunLight = new THREE.PointLight(0xffaa77, 3.0, 8);
  sunLight.position.set(ORIGIN_X + 1, 4, 3);
  group.add(sunLight);

  // 上方からの柔らかい光
  const skyLight = new THREE.PointLight(0xeeccaa, 1.8, 7);
  skyLight.position.set(ORIGIN_X, 3.5, 0);
  group.add(skyLight);

  // 椅子エリアのスポット（手前を照らす）
  const chairSpot = new THREE.SpotLight(0xffddbb, 1.5, 6, Math.PI / 4, 0.6);
  chairSpot.position.set(ORIGIN_X, 3, 2);
  chairSpot.target.position.set(ORIGIN_X, 0, 1);
  group.add(chairSpot);
  group.add(chairSpot.target);

  // 水風呂エリアのスポット（明るめ）
  const bathSpot = new THREE.SpotLight(0xddeeff, 2.5, 6, Math.PI / 3, 0.4);
  bathSpot.position.set(ORIGIN_X, 3.5, -0.3);
  bathSpot.target.position.set(ORIGIN_X, 0, -SPACE_DEPTH / 2 + 0.8);
  group.add(bathSpot);
  group.add(bathSpot.target);

  // 奥側の青みがかった補光（朝の空気感）
  const coolFill = new THREE.PointLight(0x8899bb, 0.6, 5);
  coolFill.position.set(ORIGIN_X - 2, 2, -1.5);
  group.add(coolFill);

  // 水面の反射光
  const waterLight = new THREE.PointLight(0x5588aa, 0.8, 4);
  waterLight.position.set(ORIGIN_X, 0.5, -SPACE_DEPTH / 2 + 0.8);
  group.add(waterLight);

  // 窓際の光（サウナ室から窓越しにチルスペースが見えるように）
  const windowLight = new THREE.PointLight(0xeeddcc, 0.8, 6);
  windowLight.position.set(ORIGIN_X + SPACE_WIDTH / 2 - 0.3, 1.5, (-SPACE_DEPTH / 2 + 0.3 + 0.45) / 2);
  group.add(windowLight);

  scene.add(group);
}

/** 石畳の床 */
function _buildFloor(group) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#686058';
  ctx.fillRect(0, 0, 512, 512);

  const stoneSize = 64;
  for (let y = 0; y < 512; y += stoneSize) {
    for (let x = 0; x < 512; x += stoneSize) {
      const v = 85 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${v + 5}, ${v}, ${v - 5})`;
      ctx.fillRect(x + 2, y + 2, stoneSize - 4, stoneSize - 4);
      ctx.strokeStyle = '#4a4238';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, stoneSize, stoneSize);
    }
  }
  // 微細ノイズ
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(SPACE_WIDTH, SPACE_DEPTH);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.92,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ORIGIN_X, 0.01, 0);
  group.add(floor);
}

/** 壁（奥と左のみ、手前は開放） */
function _buildWalls(group) {
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x5a5248,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // 奥壁
  const backGeo = new THREE.PlaneGeometry(SPACE_WIDTH, SPACE_HEIGHT);
  const back = new THREE.Mesh(backGeo, wallMat);
  back.position.set(ORIGIN_X, SPACE_HEIGHT / 2, -SPACE_DEPTH / 2);
  group.add(back);

  // 左壁
  const leftGeo = new THREE.PlaneGeometry(SPACE_DEPTH, SPACE_HEIGHT);
  const left = new THREE.Mesh(leftGeo, wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(ORIGIN_X - SPACE_WIDTH / 2, SPACE_HEIGHT / 2, 0);
  group.add(left);

  // 右壁（サウナ室との境界、横長窓付き）
  const RIGHT_X = ORIGIN_X + SPACE_WIDTH / 2; // = -2
  const WIN_BOTTOM = 1.2;
  const WIN_TOP = 1.8;
  const WIN_H = WIN_TOP - WIN_BOTTOM;
  const DOOR_EDGE_Z = 0.45;
  const WIN_Z_START = -SPACE_DEPTH / 2 + 0.3;
  const WIN_W = DOOR_EDGE_Z - WIN_Z_START;
  const WIN_CENTER_Z = (WIN_Z_START + DOOR_EDGE_Z) / 2;

  // 窓より下の壁
  const rWallBottomGeo = new THREE.PlaneGeometry(SPACE_DEPTH, WIN_BOTTOM);
  const rWallBottom = new THREE.Mesh(rWallBottomGeo, wallMat);
  rWallBottom.rotation.y = -Math.PI / 2;
  rWallBottom.position.set(RIGHT_X, WIN_BOTTOM / 2, 0);
  group.add(rWallBottom);

  // 窓より上の壁
  const rUpperH = SPACE_HEIGHT - WIN_TOP;
  const rWallTopGeo = new THREE.PlaneGeometry(SPACE_DEPTH, rUpperH);
  const rWallTop = new THREE.Mesh(rWallTopGeo, wallMat);
  rWallTop.rotation.y = -Math.PI / 2;
  rWallTop.position.set(RIGHT_X, WIN_TOP + rUpperH / 2, 0);
  group.add(rWallTop);

  // 窓の左パネル（奥壁側）
  const rLeftPanelW = WIN_Z_START - (-SPACE_DEPTH / 2);
  if (rLeftPanelW > 0) {
    const geo = new THREE.PlaneGeometry(rLeftPanelW, WIN_H);
    const panel = new THREE.Mesh(geo, wallMat);
    panel.rotation.y = -Math.PI / 2;
    panel.position.set(RIGHT_X, WIN_BOTTOM + WIN_H / 2, -SPACE_DEPTH / 2 + rLeftPanelW / 2);
    group.add(panel);
  }

  // 窓の右パネル（ドア側〜手前端）
  const rRightPanelW = SPACE_DEPTH / 2 - DOOR_EDGE_Z;
  if (rRightPanelW > 0) {
    const geo = new THREE.PlaneGeometry(rRightPanelW, WIN_H);
    const panel = new THREE.Mesh(geo, wallMat);
    panel.rotation.y = -Math.PI / 2;
    panel.position.set(RIGHT_X, WIN_BOTTOM + WIN_H / 2, DOOR_EDGE_Z + rRightPanelW / 2);
    group.add(panel);
  }

  // 窓枠
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x4a3828,
    roughness: 0.7,
    metalness: 0.05,
  });
  const frameT = 0.035;
  [WIN_BOTTOM, WIN_TOP].forEach((fy) => {
    const geo = new THREE.BoxGeometry(frameT, frameT, WIN_W + frameT * 2);
    const frame = new THREE.Mesh(geo, frameMat);
    frame.position.set(RIGHT_X, fy, WIN_CENTER_Z);
    group.add(frame);
  });
  [WIN_Z_START, DOOR_EDGE_Z].forEach((fz) => {
    const geo = new THREE.BoxGeometry(frameT, WIN_H + frameT * 2, frameT);
    const frame = new THREE.Mesh(geo, frameMat);
    frame.position.set(RIGHT_X, WIN_BOTTOM + WIN_H / 2, fz);
    group.add(frame);
  });

  // 屋根（奥半分のみ、手前は空）
  const roofGeo = new THREE.PlaneGeometry(SPACE_WIDTH, SPACE_DEPTH * 0.4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x4a4238,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.x = Math.PI / 2;
  roof.position.set(ORIGIN_X, SPACE_HEIGHT, -SPACE_DEPTH * 0.3);
  group.add(roof);
}

/** 水風呂（奥壁際、大きめ、手すり付き） */
function _buildColdBath(group) {
  const BX = ORIGIN_X;
  const BZ = -SPACE_DEPTH / 2 + 0.9; // 奥壁際
  const BW = 3.5;
  const BD = 1.5;
  const BH = 0.45;
  const T = 0.1;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x606058,
    roughness: 0.88,
    metalness: 0.08,
  });

  // 縁（4辺）
  [
    [BW + T * 2, T, 0, -BD / 2 - T / 2],   // 奥
    [BW + T * 2, T, 0, BD / 2 + T / 2],     // 手前
    [T, BD, -BW / 2 - T / 2, 0],             // 左
    [T, BD, BW / 2 + T / 2, 0],              // 右
  ].forEach(([w, d, dx, dz]) => {
    const geo = new THREE.BoxGeometry(w, BH, d);
    const mesh = new THREE.Mesh(geo, stoneMat);
    mesh.position.set(BX + dx, BH / 2, BZ + dz);
    group.add(mesh);
  });

  // 底
  const bottomGeo = new THREE.PlaneGeometry(BW, BD);
  const bottomMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a28,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const bottom = new THREE.Mesh(bottomGeo, bottomMat);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.set(BX, 0.02, BZ);
  group.add(bottom);

  // 水（水面 + 側面）
  const waterH = BH - 0.08;
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2a6677,
    roughness: 0.02,
    metalness: 0.3,
    transparent: true,
    opacity: 0.55,
  });

  // 水面（細分化した PlaneGeometry で波を表現）
  const segX = 32;
  const segZ = 24;
  const surfaceGeo = new THREE.PlaneGeometry(BW - 0.02, BD - 0.02, segX, segZ);
  const surface = new THREE.Mesh(surfaceGeo, waterMat);
  surface.rotation.x = -Math.PI / 2;
  const surfaceY = waterH + 0.01;
  surface.position.set(BX, surfaceY, BZ);
  group.add(surface);

  // 側面（前後左右の薄い板）
  const sideW = BW - 0.02;
  const sideD = BD - 0.02;
  const sideMat = waterMat;
  // 前面・背面
  [[-sideD / 2, 0], [sideD / 2, Math.PI]].forEach(([dz, ry]) => {
    const geo = new THREE.PlaneGeometry(sideW, waterH);
    const side = new THREE.Mesh(geo, sideMat);
    side.position.set(BX, waterH / 2 + 0.01, BZ + dz);
    side.rotation.y = ry;
    group.add(side);
  });
  // 左面・右面
  [[-sideW / 2, Math.PI / 2], [sideW / 2, -Math.PI / 2]].forEach(([dx, ry]) => {
    const geo = new THREE.PlaneGeometry(sideD, waterH);
    const side = new THREE.Mesh(geo, sideMat);
    side.position.set(BX + dx, waterH / 2 + 0.01, BZ);
    side.rotation.y = ry;
    group.add(side);
  });

  // 水面アニメーション用の変数を保存
  _waterSurface = surface;
  _waterBaseY = surfaceY;
  _waterWidth = BW - 0.02;
  _waterDepth = BD - 0.02;
  // 注水口の水面ローカル座標（水面中心からの相対位置）
  _spoutLocalX = 0.6;  // BX + 0.6 - BX
  _spoutLocalZ = -BD / 2 + 0.15 - 0;  // 注水口の落下点（奥壁側）

  // --- 水中ライト（ナイトプール風、白っぽい光） ---
  // 底面に沿って3箇所
  const underwaterPositions = [
    [BX - 0.7, 0.15, BZ],
    [BX,       0.15, BZ],
    [BX + 0.7, 0.15, BZ],
  ];
  underwaterPositions.forEach(([lx, ly, lz]) => {
    const light = new THREE.PointLight(0xddeeff, 0.8, 2);
    light.position.set(lx, ly, lz);
    group.add(light);
  });

  // --- 手すり（プール式、手前の縁に1本） ---
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.2,
    metalness: 0.9,
  });

  const railGroup = new THREE.Group();

  // 縦パイプ（2本）
  const pipeH = 0.7;
  const pipeGeo = new THREE.CylinderGeometry(0.018, 0.018, pipeH, 8);
  [-0.04, 0.04].forEach((offset) => {
    const pipe = new THREE.Mesh(pipeGeo, railMat);
    pipe.position.set(offset, BH + pipeH / 2 - 0.05, 0);
    railGroup.add(pipe);
  });

  // 上部の握り棒
  const gripGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
  const grip = new THREE.Mesh(gripGeo, railMat);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0, BH + pipeH - 0.08, 0);
  railGroup.add(grip);

  // 根元の固定プレート
  const plateGeo = new THREE.BoxGeometry(0.12, 0.03, 0.06);
  const plate = new THREE.Mesh(plateGeo, railMat);
  plate.position.set(0, BH + 0.015, 0);
  railGroup.add(plate);

  railGroup.position.set(BX, 0, BZ + BD / 2 + T / 2);
  group.add(railGroup);

  // --- 注水口（奥壁側、幅広で角張った吐水口） ---
  const spoutMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.25,
    metalness: 0.85,
  });

  // 壁から突き出た角型スパウト
  const spoutW = 0.35;
  const spoutH = 0.04;
  const spoutD = 0.15;
  const spoutGeo = new THREE.BoxGeometry(spoutW, spoutH, spoutD);
  const spout = new THREE.Mesh(spoutGeo, spoutMat);
  spout.position.set(BX + 0.6, BH + 0.2, BZ - BD / 2 + spoutD / 2);
  group.add(spout);

  // 壁の取付プレート
  const mountGeo = new THREE.BoxGeometry(spoutW + 0.06, 0.12, 0.02);
  const mount = new THREE.Mesh(mountGeo, spoutMat);
  plate.position.set(BX + 0.6, BH + 0.2, BZ - BD / 2 + 0.01);
  group.add(plate);

  // 水流（放物線カーブの半筒形 + Canvas テクスチャで流れを表現）
  {
    const streamW = spoutW - 0.04;
    const spoutTipY = BH + 0.18;           // 吐水口先端の高さ
    const spoutTipZ = BZ - BD / 2 + spoutD; // 吐水口先端のZ
    const waterSurfaceY = BH - 0.04;       // 着水点の高さ
    const fallH = spoutTipY - waterSurfaceY;
    const curveForward = 0.12;              // 前方への膨らみ
    const thickness = 0.03;                 // 水流の厚み（奥行き方向）

    // 半筒形の断面（手前に膨らむ弧）× 放物線カーブ
    const segY = 12;  // 落下方向の分割数
    const segX = 6;   // 断面方向の分割数（弧を描く）
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let iy = 0; iy <= segY; iy++) {
      const t = iy / segY; // 0（上）〜 1（下）
      const y = spoutTipY - t * fallH;
      const zCenter = spoutTipZ + curveForward * Math.sin(t * Math.PI) * (1 - t * 0.3);
      // 下に行くほど水流が少し細くなる
      const widthScale = 1.0 - t * 0.15;
      const thickScale = 1.0 - t * 0.2;

      for (let ix = 0; ix <= segX; ix++) {
        const u = ix / segX; // 0〜1（断面の左端〜右端）
        // 断面: X方向に幅、Z方向に弧（手前に膨らむ半筒）
        const angle = u * Math.PI; // 0〜π（半円）
        const x = BX + 0.6 + (u - 0.5) * streamW * widthScale;
        const z = zCenter + Math.sin(angle) * thickness * thickScale;
        vertices.push(x, y, z);
        // UV: u=断面位置、v=0が吐水口(上)、v=1が着水点(下)
        // Three.js テクスチャは v=0→画像下端、v=1→画像上端なので反転
        uvs.push(u, 1 - t);
      }
    }

    for (let iy = 0; iy < segY; iy++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = iy * (segX + 1) + ix;
        const b = a + 1;
        const c = a + (segX + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // Canvas テクスチャ（縦スクロールで流れを表現）
    _streamCanvas = document.createElement('canvas');
    _streamCanvas.width = 64;
    _streamCanvas.height = 128;
    _streamCtx = _streamCanvas.getContext('2d');
    _streamTexture = new THREE.CanvasTexture(_streamCanvas);
    _streamTexture.wrapS = THREE.RepeatWrapping;
    _streamTexture.wrapT = THREE.RepeatWrapping;

    const mat = new THREE.MeshStandardMaterial({
      map: _streamTexture,
      color: 0x99ddee,
      roughness: 0.0,
      metalness: 0.15,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    _streamMesh = new THREE.Mesh(geo, mat);
    group.add(_streamMesh);
  }

  // --- 桶（プラスチック製、白、洗面器型） ---
  const bucketGroup = new THREE.Group();
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.4,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // LatheGeometry で洗面器の断面を回転
  // 断面: 底面中心→底面外縁→側面（外側、テーパー）→縁上面→縁内側→側面（内側）→底面内側
  const R_BOTTOM_OUT = 0.09;
  const R_TOP_OUT = 0.12;
  const R_TOP_IN = 0.105;
  const R_BOTTOM_IN = 0.075;
  const H = 0.13;
  const RIM_H = 0.015;
  const WALL_THICK = 0.012;

  const points = [
    new THREE.Vector2(0, 0),                        // 底面中心
    new THREE.Vector2(R_BOTTOM_OUT, 0),              // 底面外縁
    new THREE.Vector2(R_TOP_OUT, H - RIM_H),         // 側面外側上端
    new THREE.Vector2(R_TOP_OUT + 0.005, H),          // 縁の外側上角
    new THREE.Vector2(R_TOP_IN, H),                   // 縁の内側上角
    new THREE.Vector2(R_TOP_IN, H - RIM_H),           // 縁の内側下角
    new THREE.Vector2(R_BOTTOM_IN, WALL_THICK),       // 側面内側下端
    new THREE.Vector2(0, WALL_THICK),                 // 底面内側中心
  ];

  const bucketGeo = new THREE.LatheGeometry(points, 24);
  const bucket = new THREE.Mesh(bucketGeo, plasticMat);
  bucketGroup.add(bucket);

  bucketGroup.position.set(BX - 0.8, BH, BZ + BD / 2 + T + 0.05);
  group.add(bucketGroup);
}

/**
 * ガーデンチェア（GLBモデル読み込み）
 */
function _buildChairs(group) {
  const positions = [
    { x: ORIGIN_X - 1.2, z: 0.8, rot: 0.4 },
    { x: ORIGIN_X - 0.0, z: 1.4, rot: 0.05 },
    { x: ORIGIN_X + 1.2, z: 1.0, rot: -0.3 },
  ];

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load('/models/chair.glb', (gltf) => {
    const source = gltf.scene;

    // モデルは既にZ-up→Y-up回転を内包しているので追加回転不要
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());
    const scale = 0.7 / size.y; // 高さ(Y軸)を約0.7mに

    positions.forEach(({ x, z, rot }, i) => {
      const clone = i === 0 ? source : source.clone();
      clone.scale.setScalar(scale);

      // 底面を床に合わせる
      const scaledBox = new THREE.Box3().setFromObject(clone);
      clone.position.set(x, -scaledBox.min.y, z);
      clone.rotation.y = rot;
      group.add(clone);
    });
  });
}

/**
 * 水面の波紋アニメーション + 注水流アニメーションを更新する（毎フレーム呼び出し）
 */
export function updateChillSpace(time) {
  if (!_waterSurface) return;

  // --- 水面の波紋 ---
  const pos = _waterSurface.geometry.attributes.position;
  const amplitude = 0.012;   // 波の高さ（強め）
  const rippleSpeed = 4.0;   // 波の伝播速度
  const frequency = 10.0;    // 波の細かさ
  const decay = 1.8;         // 距離減衰（緩めで遠くまで届く）

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);

    // 注水口からの距離
    const dx = vx - _spoutLocalX;
    const dz = vy - _spoutLocalZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // 注水口から広がる同心円波紋（複数の波を重ねてリアルに）
    const ripple1 = Math.sin(dist * frequency - time * rippleSpeed)
                  * amplitude * Math.exp(-dist * decay);
    const ripple2 = Math.sin(dist * frequency * 1.7 - time * rippleSpeed * 1.3 + 1.0)
                  * amplitude * 0.4 * Math.exp(-dist * decay * 1.2);

    // ゆったりとした全体のうねり
    const swell = Math.sin(vx * 3.0 + time * 0.8) * Math.cos(vy * 2.5 + time * 0.6)
                * 0.005;

    // 微細なさざ波（全体）
    const micro = Math.sin(vx * 22 + time * 3.0) * Math.cos(vy * 18 + time * 2.2)
                * 0.003;

    pos.setZ(i, ripple1 + ripple2 + swell + micro);
  }

  pos.needsUpdate = true;
  _waterSurface.geometry.computeVertexNormals();

  // --- 注水流アニメーション（Canvas テクスチャを縦スクロール） ---
  if (_streamCtx && _streamTexture) {
    const ctx = _streamCtx;
    const cw = _streamCanvas.width;
    const ch = _streamCanvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // 縦方向にスクロールする流水模様を描画
    const scrollOffset = (time * 120) % ch;
    for (let y = -ch; y < ch * 2; y += 3) {
      const yy = (y + scrollOffset) % (ch * 2) - ch;
      // 幅の揺れ（自然な水の乱流）
      const waveX = Math.sin(y * 0.08 + time * 4) * 6
                  + Math.sin(y * 0.15 + time * 6) * 3;
      const alpha = 0.15 + Math.sin(y * 0.12 + time * 5) * 0.1
                         + Math.sin(y * 0.25 + time * 8) * 0.05;
      ctx.globalAlpha = Math.max(0.05, Math.min(0.35, alpha));
      ctx.fillStyle = '#cceeFF';
      ctx.fillRect(8 + waveX, yy, cw - 16 - waveX * 2, 2);
    }

    // ハイライト（光の筋）
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const lx = cw * 0.3 + Math.sin(time * 3 + i * 2) * 8;
      const ly = ((time * 100 + i * 40) % ch);
      ctx.fillRect(lx, ly, 2, 12);
    }

    ctx.globalAlpha = 1;
    _streamTexture.needsUpdate = true;

    // 透明度の微妙な揺れ
    _streamMesh.material.opacity = 0.32 + Math.sin(time * 2.5) * 0.05;
  }
}

