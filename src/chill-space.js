import * as THREE from 'three';

// チルスペースはサウナ室(x:-2〜+2)の左側に配置
const SPACE_WIDTH = 6;
const SPACE_DEPTH = 4;
const SPACE_HEIGHT = 3;
const ORIGIN_X = -2 - SPACE_WIDTH / 2; // = -5

/**
 * チルスペース（水風呂 + 外気浴）を構築する
 * 草加健康センター風: 石畳の床、半屋外、水風呂、アディロンダックチェア
 */
export function buildChillSpace(scene) {
  const group = new THREE.Group();

  _buildFloor(group);
  _buildWalls(group);
  _buildColdBath(group);
  _buildAdirondackChairs(group);

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

  // 水（側面も見えるよう BoxGeometry で水を張る）
  const waterH = BH - 0.08;
  const waterGeo = new THREE.BoxGeometry(BW - 0.02, waterH, BD - 0.02);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2a6677,
    roughness: 0.02,
    metalness: 0.3,
    transparent: true,
    opacity: 0.55,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.set(BX, waterH / 2 + 0.01, BZ);
  group.add(water);

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

  // 水流（幅広の薄い板状）
  const streamH = BH + 0.15;
  const streamGeo = new THREE.BoxGeometry(spoutW - 0.04, streamH, 0.01);
  const streamMat = new THREE.MeshStandardMaterial({
    color: 0x88ccdd,
    roughness: 0.0,
    metalness: 0.1,
    transparent: true,
    opacity: 0.3,
  });
  const stream = new THREE.Mesh(streamGeo, streamMat);
  stream.position.set(BX + 0.6, BH + 0.18 - streamH / 2, BZ - BD / 2 + spoutD);
  group.add(stream);

  // --- 桶（プラスチック製、白） ---
  const bucketGroup = new THREE.Group();
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.4,
    metalness: 0.05,
  });

  // 桶本体
  const bucketGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.13, 16);
  const bucket = new THREE.Mesh(bucketGeo, plasticMat);
  bucket.position.y = 0.065;
  bucketGroup.add(bucket);

  // 縁（少し広がったリム）
  const rimGeo = new THREE.TorusGeometry(0.115, 0.012, 8, 16);
  const rim = new THREE.Mesh(rimGeo, plasticMat);
  rim.position.y = 0.13;
  rim.rotation.x = Math.PI / 2;
  bucketGroup.add(rim);

  bucketGroup.position.set(BX - 0.8, BH, BZ + BD / 2 + T + 0.05);
  group.add(bucketGroup);
}

/**
 * アディロンダックチェア（白）
 * 幅広アームレスト、扇状の背もたれが特徴
 */
function _buildAdirondackChairs(group) {
  const positions = [
    { x: ORIGIN_X - 1.2, z: 0.8, rot: 0.4 },
    { x: ORIGIN_X - 0.0, z: 1.4, rot: 0.05 },
    { x: ORIGIN_X + 1.2, z: 1.0, rot: -0.3 },
  ];

  positions.forEach(({ x, z, rot }) => {
    const chair = _createAdirondackChair();
    chair.position.set(x, 0, z);
    chair.rotation.y = rot;
    group.add(chair);
  });
}

function _createAdirondackChair() {
  const chair = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede8,
    roughness: 0.75,
    metalness: 0.0,
  });

  const SEAT_W = 0.55;
  const SEAT_D = 0.5;
  const SEAT_H = 0.32;
  const BACK_H = 0.55;
  const BACK_ANGLE = -0.35; // 傾斜
  const SLAT_T = 0.02; // 板の厚さ
  const SLAT_GAP = 0.01;

  // --- 座面（横板5枚） ---
  const slatCount = 5;
  const slatW = (SEAT_W - SLAT_GAP * (slatCount - 1)) / slatCount;
  for (let i = 0; i < slatCount; i++) {
    const geo = new THREE.BoxGeometry(slatW, SLAT_T, SEAT_D);
    const slat = new THREE.Mesh(geo, woodMat);
    const xOff = -SEAT_W / 2 + slatW / 2 + i * (slatW + SLAT_GAP);
    slat.position.set(xOff, SEAT_H, 0);
    slat.rotation.x = -0.08; // 微傾斜
    chair.add(slat);
  }

  // --- 背もたれ（扇状に5枚） ---
  const backSlats = 5;
  const backSlatW = (SEAT_W * 0.9 - SLAT_GAP * (backSlats - 1)) / backSlats;
  for (let i = 0; i < backSlats; i++) {
    const h = BACK_H + (i === 2 ? 0.06 : i === 1 || i === 3 ? 0.03 : 0); // 中央が高い
    const geo = new THREE.BoxGeometry(backSlatW, h, SLAT_T);
    const slat = new THREE.Mesh(geo, woodMat);
    const xOff = -SEAT_W * 0.45 + backSlatW / 2 + i * (backSlatW + SLAT_GAP);
    slat.position.set(xOff, SEAT_H + h / 2 * Math.cos(-BACK_ANGLE), -SEAT_D / 2 + h / 2 * Math.sin(-BACK_ANGLE));
    slat.rotation.x = BACK_ANGLE;
    chair.add(slat);
  }

  // --- アームレスト（左右の幅広板） ---
  const armGeo = new THREE.BoxGeometry(0.1, SLAT_T, SEAT_D + 0.15);
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(armGeo, woodMat);
    arm.position.set(side * (SEAT_W / 2 + 0.04), SEAT_H + 0.12, 0.05);
    chair.add(arm);
  });

  // --- 前脚（2本） ---
  const frontLegGeo = new THREE.BoxGeometry(0.04, SEAT_H + 0.12, 0.04);
  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(frontLegGeo, woodMat);
    leg.position.set(side * (SEAT_W / 2 + 0.04), (SEAT_H + 0.12) / 2, SEAT_D / 2);
    chair.add(leg);
  });

  // --- 後脚（2本、斜め） ---
  const backLegGeo = new THREE.BoxGeometry(0.04, SEAT_H + 0.05, 0.04);
  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(backLegGeo, woodMat);
    leg.position.set(side * (SEAT_W / 2 + 0.04), (SEAT_H + 0.05) / 2, -SEAT_D / 2 + 0.05);
    leg.rotation.x = BACK_ANGLE * 0.3;
    chair.add(leg);
  });

  return chair;
}
