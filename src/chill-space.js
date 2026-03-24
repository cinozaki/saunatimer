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
 * サンラウンジャー（白、1脚）
 * プールサイドの寝椅子、外気浴に最適
 */
function _buildAdirondackChairs(group) {
  const lounger = _createSunLounger();
  lounger.position.set(ORIGIN_X - 1.2, 0, 0.8);
  lounger.rotation.y = 0.4;
  group.add(lounger);
}

function _createSunLounger() {
  const lounger = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.3,
    metalness: 0.1,
  });

  const BED_W = 0.55;
  const BED_L = 1.4;
  const BED_H = 0.3;
  const SLAT_T = 0.02;
  const BACK_L = 0.45;
  const BACK_ANGLE = 0.6; // 背もたれの角度

  // --- フレーム（長方形の枠） ---
  const frameParts = [
    // 長辺（左右）
    [0.03, 0.04, BED_L, -BED_W / 2, BED_H, 0],
    [0.03, 0.04, BED_L, BED_W / 2, BED_H, 0],
    // 短辺（前後）
    [BED_W, 0.04, 0.03, 0, BED_H, BED_L / 2],
    [BED_W, 0.04, 0.03, 0, BED_H, -BED_L / 2 + BACK_L],
  ];
  frameParts.forEach(([w, h, d, x, y, z]) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, frameMat);
    mesh.position.set(x, y, z);
    lounger.add(mesh);
  });

  // --- 座面のスラット（横板、寝る部分） ---
  const slatCount = 12;
  const slatArea = BED_L - BACK_L - 0.05;
  const slatSpacing = slatArea / slatCount;
  for (let i = 0; i < slatCount; i++) {
    const geo = new THREE.BoxGeometry(BED_W - 0.06, SLAT_T, 0.04);
    const slat = new THREE.Mesh(geo, frameMat);
    slat.position.set(0, BED_H + SLAT_T / 2, -BED_L / 2 + BACK_L + 0.05 + i * slatSpacing);
    lounger.add(slat);
  }

  // --- 背もたれフレーム（左右のサイドレール + 上端バー） ---
  const backTopY = BED_H + Math.sin(BACK_ANGLE) * BACK_L;
  const backTopZ = -BED_L / 2;
  const backBottomZ = -BED_L / 2 + BACK_L;
  const sideLen = BACK_L / Math.cos(BACK_ANGLE);

  [-1, 1].forEach((side) => {
    const sideGeo = new THREE.BoxGeometry(0.03, 0.04, sideLen);
    const sideRail = new THREE.Mesh(sideGeo, frameMat);
    sideRail.position.set(
      side * BED_W / 2,
      BED_H + Math.sin(BACK_ANGLE) * BACK_L / 2,
      -BED_L / 2 + BACK_L / 2
    );
    sideRail.rotation.x = -BACK_ANGLE;
    lounger.add(sideRail);
  });

  // 上端バー
  const topBarGeo = new THREE.BoxGeometry(BED_W, 0.04, 0.03);
  const topBar = new THREE.Mesh(topBarGeo, frameMat);
  topBar.position.set(0, backTopY, backTopZ);
  topBar.rotation.x = -BACK_ANGLE;
  lounger.add(topBar);

  // --- 背もたれスラット ---
  const backSlats = 5;
  for (let i = 0; i < backSlats; i++) {
    const t = (i + 0.5) / backSlats;
    const geo = new THREE.BoxGeometry(BED_W - 0.06, SLAT_T, 0.04);
    const slat = new THREE.Mesh(geo, frameMat);
    slat.position.set(
      0,
      BED_H + Math.sin(BACK_ANGLE) * BACK_L * (1 - t),
      -BED_L / 2 + BACK_L * t
    );
    slat.rotation.x = -BACK_ANGLE;
    lounger.add(slat);
  }

  // --- 脚（4本） ---
  const legH = BED_H;
  const legGeo = new THREE.BoxGeometry(0.03, legH, 0.03);
  [
    [-BED_W / 2 + 0.03, legH / 2, -BED_L / 2 + 0.05],
    [BED_W / 2 - 0.03, legH / 2, -BED_L / 2 + 0.05],
    [-BED_W / 2 + 0.03, legH / 2, BED_L / 2 - 0.05],
    [BED_W / 2 - 0.03, legH / 2, BED_L / 2 - 0.05],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(x, y, z);
    lounger.add(leg);
  });

  return lounger;
}
