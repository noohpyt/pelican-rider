import * as THREE from 'three';
import { material, mesh, sphere, rod, setRod, tube, group } from './geometry.js';
import { advanceCrank, pedalPosition, solveLeg, steeringAngle, WHEEL_RADIUS } from './animation.js';

const palette = {
  ivory: material('#fff4d9'), white: material('#fffdf3'), shade: material('#dce8dd'),
  ink: material('#183e46'), black: material('#172c30', { roughness: 0.55 }),
  orange: material('#f59b52'), coral: material('#ed6a4b'), yellow: material('#ffc95f'),
  frame: material('#e96645', { roughness: 0.4 }), metal: material('#d6ebe4', { metalness: 0.65, roughness: 0.28 }),
  tire: material('#203a3d'), leather: material('#714f3b'), fish: material('#67d5cb', { metalness: 0.12, roughness: 0.4 }),
};

function createWheel(parent, z) {
  const wheel = group(parent, [0, WHEEL_RADIUS, z]);
  const tire = mesh(new THREE.TorusGeometry(WHEEL_RADIUS, 0.065, 10, 40), palette.tire, wheel);
  tire.rotation.y = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(WHEEL_RADIUS - 0.075, 0.025, 8, 40), palette.metal, wheel);
  rim.rotation.y = Math.PI / 2;
  rod(wheel, palette.metal, [-0.16, 0, 0], [0.16, 0, 0], 0.055);
  for (let i = 0; i < 16; i += 1) {
    const angle = i / 16 * Math.PI * 2;
    rod(wheel, palette.metal, [0, 0, 0], [0, Math.sin(angle) * 0.51, Math.cos(angle) * 0.51], 0.009, 5);
  }
  return wheel;
}

function createBike(parent) {
  const bike = group(parent);
  const rear = createWheel(bike, 0.93);
  const steering = group(bike, [0, 0, -0.93]);
  const front = createWheel(steering, 0);
  const crank = [0, 1.03, 0.06];
  const seatPost = [0, 1.75, 0.42];
  const head = [0, 1.67, -0.68];
  const rearAxle = [0, WHEEL_RADIUS, 0.93];
  for (const side of [-1, 1]) {
    const x = side * 0.1;
    rod(bike, palette.frame, [x, crank[1], crank[2]], [x, seatPost[1], seatPost[2]], 0.052);
    rod(bike, palette.frame, [x, seatPost[1], seatPost[2]], [x, head[1], head[2]], 0.052);
    rod(bike, palette.frame, [x, head[1], head[2]], [x, crank[1], crank[2]], 0.052);
    rod(bike, palette.frame, [x, rearAxle[1], rearAxle[2]], [x, crank[1], crank[2]], 0.038);
    rod(bike, palette.frame, [x, rearAxle[1], rearAxle[2]], [x, seatPost[1], seatPost[2]], 0.038);
    rod(steering, palette.metal, [x, 1.67, 0.25], [x, WHEEL_RADIUS, 0], 0.042);
  }
  rod(bike, palette.metal, seatPost, [0, 1.96, 0.43], 0.045);
  const saddle = sphere(bike, palette.leather, [0, 1.98, 0.46], [0.29, 0.08, 0.34]);
  saddle.rotation.x = -0.08;
  rod(bike, palette.metal, head, [0, 2.04, -0.73], 0.043);
  tube(bike, palette.ink, [[-0.48, 2.02, -0.7], [-0.36, 2.09, -0.8], [0, 2.09, -0.82], [0.36, 2.09, -0.8], [0.48, 2.02, -0.7]], 0.035);
  for (const side of [-1, 1]) rod(bike, palette.leather, [side * 0.38, 2.04, -0.73], [side * 0.51, 2.0, -0.66], 0.052);
  const crankGroup = group(bike, crank);
  rod(crankGroup, palette.metal, [-0.25, 0, 0], [0.25, 0, 0], 0.07);
  const pedals = [];
  for (const side of [-1, 1]) {
    const pedal = group(bike);
    const arm = rod(crankGroup, palette.metal, [side * 0.16, 0, 0], [side * 0.16, 0, side * CRANK_LOCAL_RADIUS()], 0.032);
    rod(pedal, palette.metal, [side * 0.15, 0, 0], [side * 0.48, 0, 0], 0.028);
    const platform = mesh(new THREE.BoxGeometry(0.31, 0.07, 0.2), palette.ink, pedal, [side * 0.45, 0, 0]);
    platform.geometry.translate(0, 0, 0);
    pedals.push({ side, group: pedal, arm });
  }
  return { bike, wheels: [rear, front], steering, crank: crankGroup, pedals };
}

function CRANK_LOCAL_RADIUS() { return 0.29; }

function createBird(parent) {
  const bird = group(parent);
  const body = sphere(bird, palette.ivory, [0, 2.35, 0.28], [0.51, 0.69, 0.49]);
  body.rotation.x = -0.2;
  sphere(bird, palette.white, [0, 2.75, 0.02], [0.34, 0.52, 0.33]);
  const head = group(bird, [0, 3.16, -0.13]);
  sphere(head, palette.white, [0, 0, 0], [0.4, 0.4, 0.39]);
  const upperBeak = sphere(head, palette.orange, [0, -0.08, -0.52], [0.29, 0.15, 0.63]);
  upperBeak.rotation.x = -0.08;
  const pouch = sphere(head, palette.yellow, [0, -0.25, -0.47], [0.28, 0.26, 0.52]);
  pouch.rotation.x = -0.15;
  sphere(head, palette.coral, [0, -0.12, -1.09], [0.12, 0.07, 0.1]);
  for (const side of [-1, 1]) {
    sphere(head, palette.ivory, [side * 0.315, 0.06, -0.12], [0.105, 0.13, 0.11]);
    sphere(head, palette.black, [side * 0.35, 0.07, -0.17], [0.06, 0.075, 0.06]);
    sphere(head, palette.white, [side * 0.376, 0.1, -0.2], [0.017, 0.02, 0.017], 12);
    const brow = rod(head, palette.ink, [side * 0.25, 0.2, -0.23], [side * 0.39, 0.15, -0.15], 0.026);
    brow.castShadow = false;
  }
  for (let i = -1; i <= 1; i++) {
    const feather = sphere(head, palette.white, [i * 0.1, 0.39 + Math.abs(i) * -0.03, 0.06], [0.075, 0.22, 0.07], 16);
    feather.rotation.z = -i * 0.34;
    feather.rotation.x = -0.25;
  }
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = group(bird, [side * 0.43, 2.61, 0.13]);
    const main = sphere(wing, palette.shade, [side * 0.09, -0.18, -0.1], [0.19, 0.52, 0.28]);
    main.rotation.x = -0.55;
    main.rotation.z = side * -0.28;
    for (let i = 0; i < 4; i++) {
      const feather = sphere(wing, palette.ivory, [side * (0.12 + i * 0.018), -0.42 - i * 0.055, 0.03 + i * 0.07], [0.075, 0.26, 0.1], 16);
      feather.rotation.x = -0.5;
      feather.rotation.z = side * -0.2;
    }
    rod(bird, palette.ivory, [side * 0.44, 2.37, -0.02], [side * 0.4, 2.07, -0.71], 0.075);
    sphere(bird, palette.orange, [side * 0.4, 2.06, -0.72], [0.1, 0.075, 0.12]);
    wings.push(wing);
  }
  for (let i = -2; i <= 2; i++) {
    const tail = sphere(bird, palette.shade, [i * 0.1, 2.15, 0.69], [0.1, 0.12, 0.36], 16);
    tail.rotation.x = -0.3;
    tail.rotation.z = i * 0.08;
  }
  const legs = [];
  for (const side of [-1, 1]) {
    const upper = rod(bird, palette.ivory, [0, 0, 0], [0, 1, 0], 0.095);
    const lower = rod(bird, palette.orange, [0, 0, 0], [0, 1, 0], 0.055);
    const foot = group(bird);
    sphere(foot, palette.orange, [0, 0.055, -0.07], [0.17, 0.055, 0.25]);
    for (let toe = -1; toe <= 1; toe++) {
      rod(foot, palette.coral, [toe * 0.07, 0.04, -0.1], [toe * 0.1, 0.03, -0.32], 0.025);
    }
    legs.push({ side, upper, lower, foot });
  }
  return { bird, body, head, wings, legs };
}

export function createRider() {
  const root = new THREE.Group();
  const lean = group(root);
  const bicycle = createBike(lean);
  const pelican = createBird(lean);
  return { group: root, lean, ...bicycle, ...pelican, phase: 0 };
}

export function updateRider(rig, motion, dt) {
  rig.phase = advanceCrank(rig.phase, motion.speed, dt);
  for (const wheel of rig.wheels) wheel.rotation.x -= motion.speed * dt / WHEEL_RADIUS;
  rig.crank.rotation.x = -rig.phase;
  rig.steering.rotation.y += (steeringAngle(motion.steer) - rig.steering.rotation.y) * Math.min(1, dt * 10);
  rig.lean.rotation.z += (-motion.steer * 0.16 - rig.lean.rotation.z) * Math.min(1, dt * 7);
  rig.group.rotation.y = -motion.heading;
  rig.group.position.x = motion.lateral;
  rig.body.scale.y = 0.69 + Math.sin(rig.phase * 2) * Math.min(0.015, motion.speed * 0.001);
  // 转向时头部跟随左右转，展示侧脸
  rig.head.rotation.y += (-motion.steer * 1.24 - rig.head.rotation.y) * Math.min(1, dt * 7);
  rig.head.rotation.z = Math.sin(rig.phase) * Math.min(0.025, motion.speed * 0.002);
  rig.head.rotation.x = -0.04 + Math.sin(rig.phase * 2) * Math.min(0.02, motion.speed * 0.0015);
  for (let i = 0; i < rig.wings.length; i++) {
    rig.wings[i].rotation.z = (i === 0 ? 1 : -1) * (0.04 + Math.sin(rig.phase * 2) * Math.min(0.05, motion.speed * 0.004));
  }
  for (const leg of rig.legs) {
    const pedal = pedalPosition(rig.phase, leg.side);
    const hip = { x: leg.side * 0.3, y: 2.08, z: 0.33 };
    const knee = solveLeg(hip, pedal, leg.side);
    setRod(leg.upper, hip, knee);
    setRod(leg.lower, knee, pedal);
    leg.foot.position.set(pedal.x, pedal.y + 0.055, pedal.z - 0.02);
    leg.foot.rotation.x = -0.12 + Math.sin(rig.phase + (leg.side > 0 ? Math.PI : 0)) * 0.12;
  }
  for (const pedal of rig.pedals) {
    const position = pedalPosition(rig.phase, pedal.side);
    pedal.group.position.set(0, position.y, position.z);
  }
}

export function createFish() {
  // 水桶，桶里有一条活蹦乱跳的小鱼
  const bucket = new THREE.Group();
  const wood = material('#a87748', { roughness: 0.85 });
  mesh(new THREE.CylinderGeometry(0.42, 0.33, 0.55, 16), wood, bucket, [0, 0.28, 0]);
  for (const [radius, y] of [[0.43, 0.5], [0.35, 0.07]]) {
    const band = mesh(new THREE.TorusGeometry(radius, 0.025, 8, 24), palette.metal, bucket, [0, y, 0]);
    band.rotation.x = Math.PI / 2;
  }
  mesh(new THREE.TorusGeometry(0.4, 0.02, 8, 20, Math.PI), palette.metal, bucket, [0, 0.55, 0]);
  mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.03, 16), material('#5fb8c9', { roughness: 0.25 }), bucket, [0, 0.5, 0]);
  const fish = group(bucket, [0, 0.72, 0]);
  const body = sphere(fish, palette.fish, [0, 0, 0], [0.11, 0.09, 0.26], 12);
  body.rotation.x = 0.1;
  const tailFin = mesh(new THREE.ConeGeometry(0.11, 0.2, 4), palette.coral, fish, [0, 0.01, 0.3]);
  tailFin.rotation.x = Math.PI / 2;
  tailFin.scale.z = 0.35;
  const dorsal = mesh(new THREE.ConeGeometry(0.05, 0.12, 4), palette.coral, fish, [0, 0.1, 0.02]);
  dorsal.scale.z = 0.4;
  for (const side of [-1, 1]) {
    sphere(fish, palette.white, [side * 0.075, 0.03, -0.14], [0.032, 0.032, 0.032], 8);
    sphere(fish, palette.black, [side * 0.085, 0.03, -0.16], [0.017, 0.017, 0.017], 8);
  }
  bucket.userData.fish = fish;
  return bucket;
}

export function createHeart() {
  // 红心：只剩一滴血时概率刷新，拾取回一滴血
  const heart = new THREE.Group();
  const heartMat = material('#ff4d5e', { roughness: 0.3, emissive: '#a3121f', emissiveIntensity: 0.45 });
  sphere(heart, heartMat, [-0.13, 0.12, 0], [0.19, 0.19, 0.16], 16);
  sphere(heart, heartMat, [0.13, 0.12, 0], [0.19, 0.19, 0.16], 16);
  const tip = mesh(new THREE.ConeGeometry(0.27, 0.4, 4), heartMat, heart, [0, -0.1, 0]);
  tip.rotation.x = Math.PI;
  tip.rotation.y = Math.PI / 4;
  return heart;
}

export function createObstacle() {
  // 路上的大石头
  const rock = new THREE.Group();
  const rockColors = ['#7d7468', '#8a8175', '#6e675c', '#948b7e'];
  const rockMat = material(rockColors[Math.floor(Math.random() * rockColors.length)], { roughness: 0.95 });
  const main = mesh(new THREE.DodecahedronGeometry(0.78, 0), rockMat, rock, [0, 0.58, 0]);
  main.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  main.scale.set(1 + Math.random() * 0.25, 0.85 + Math.random() * 0.3, 0.9 + Math.random() * 0.3);
  const bumpA = mesh(new THREE.DodecahedronGeometry(0.4, 0), rockMat, rock, [0.42, 0.28, 0.25]);
  bumpA.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  const bumpB = mesh(new THREE.DodecahedronGeometry(0.3, 0), rockMat, rock, [-0.38, 0.22, -0.2]);
  bumpB.rotation.set(0, Math.random() * Math.PI, Math.random() * Math.PI);
  return rock;
}

export function createPalm() {
  const palm = new THREE.Group();
  tube(palm, material('#9c6a43'), [[0, 0, 0], [0.08, 1.5, 0], [-0.12, 3.1, 0.04], [-0.32, 4.3, 0]], 0.13);
  const leafMaterial = material('#3f9b78');
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    const leaf = sphere(palm, leafMaterial, [-0.32 + Math.cos(angle) * 0.72, 4.25, Math.sin(angle) * 0.72], [0.25, 0.075, 1.15], 16);
    leaf.rotation.y = -angle + Math.PI / 2;
    leaf.rotation.x = 0.25;
  }
  for (let i = 0; i < 3; i++) sphere(palm, palette.leather, [-0.3 + i * 0.16, 4.05, 0.1], [0.15, 0.15, 0.15], 12);
  return palm;
}
