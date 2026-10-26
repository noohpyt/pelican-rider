import * as THREE from 'three';
import { createGame, updateGame, resetGame, collectFish, hitObstacle, TARGET_DISTANCE } from './game-core.js';
import { createRider, updateRider, createFish, createObstacle } from './models.js';
import { createWorld } from './world.js';
import { getParticleMaterial } from './effects.js';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main id="game" aria-label="鹈鹕骑自行车 3D 游戏">
    <div id="scene" aria-hidden="true"></div>
    <div class="grain"></div>
    <header class="topbar">
      <a class="brand" href="#" aria-label="鹈鹕骑自行车 首页"><span class="brand-mark">PR</span><span>鹈鹕骑自行车</span></a>
      <div class="round-pill"><span class="dot"></span> ROAD <span class="round-number">01</span></div>
      <button id="soundless" class="icon-button" aria-label="游戏操作说明">?</button>
    </header>
    <section id="hud" class="hud hidden" aria-label="游戏状态">
      <div class="timer-card"><span>SCORE</span><strong id="score">0000</strong></div>
      <div class="lives-card"><span>LIVES</span><div id="lives" aria-label="3 点生命">● ● ●</div></div>
      <div class="speed-card"><div class="speed-label"><b><span id="speed">0</span> km/h</b></div><div class="speed-track"><i id="speed-fill"></i></div></div>
      <div class="fuel-card"><span>FUEL</span><div class="fuel-track"><i id="fuel-fill"></i></div></div>
      <div class="distance-card"><span>DIST</span><strong id="distance">0</strong><small>/<span id="target-distance">${Math.round(TARGET_DISTANCE / 100)}</span>00 m</small></div>
    </section>
    <div id="toast" class="toast" role="status"></div>
    <div id="flash" class="flash"></div>
    <section id="start-screen" class="overlay start-screen">
      <div class="hero-copy">
        <h1>鹈鹕<br><em>骑自行车</em></h1>
        <p class="intro">自动加速，左右变道。<br>躲开车辆，收集燃料。</p>
        <button id="start" class="primary-button">开始 <span>→</span></button>
        <div class="controls"><div><kbd>A</kbd><kbd>←</kbd><span>左移</span></div><div><kbd>D</kbd><kbd>→</kbd><span>右移</span></div></div>
      </div>
      <div class="route-stamp"><span>TARGET</span><strong>${Math.round(TARGET_DISTANCE / 100)}</strong><span>00 METERS</span></div>
    </section>
    <section id="result-screen" class="overlay result-screen hidden" aria-live="polite">
      <div class="result-card"><h2 id="result-title">游戏结束</h2><p id="result-copy"></p><div class="result-stats"><div><strong id="final-score">0</strong><span>SCORE</span></div><div><strong id="final-fish">0</strong><span>FUEL</span></div><div><strong id="best-score">0</strong><span>BEST</span></div></div><button id="restart" class="primary-button">再来一次 <span>↻</span></button><small>按 Enter 重新开始</small></div>
    </section>
    <section id="help" class="help-card hidden"><button id="close-help" aria-label="关闭操作说明">×</button><h2>操作说明</h2><p><b>A / ←</b> 左移，<b>D / →</b> 右移。</p><p>自动加速。撞上车辆扣生命、减速、扣燃料。收集燃料罐补充燃料。</p><p>燃料耗尽或生命耗尽失败；到达目标距离过关。</p></section>
    <div class="touch-controls hidden" id="touch-controls"><button data-key="left" aria-label="左移">←</button><button data-key="right" aria-label="右移">→</button></div>
  </main>`;

const $ = (selector) => document.querySelector(selector);
const scene = new THREE.Scene(); // road-fighter style scene
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
$('#scene').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#fff3d6', '#4e8d8a', 2.2));
const sunlight = new THREE.DirectionalLight('#ffe3b4', 3.1);
sunlight.position.set(-12, 24, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -14;
sunlight.shadow.camera.right = 14;
sunlight.shadow.camera.top = 16;
sunlight.shadow.camera.bottom = -10;
sunlight.shadow.camera.near = 1;
sunlight.shadow.camera.far = 65;
sunlight.shadow.bias = -0.0004;
scene.add(sunlight);
const fill = new THREE.DirectionalLight('#8fe3e1', 0.7);
fill.position.set(10, 8, -10);
scene.add(fill);

const world = createWorld(scene);
const rider = createRider();
scene.add(rider.group);
rider.group.position.set(0, 0, 0);

const entities = [];
const lanes = [-3, 0, 3];
for (let i = 0; i < 40; i++) {
  const type = i % 4 === 0 ? 'fish' : 'obstacle';
  const object = type === 'fish' ? createFish() : createObstacle();
  const lane = lanes[(i * 7 + Math.floor(i / 3)) % 3];
  object.position.set(lane, type === 'fish' ? 0.9 : 0, -18 - i * 9.5);
  scene.add(object);
  entities.push({ object, type, initialZ: object.position.z, lane, collected: false });
}

const particleGeometry = new THREE.SphereGeometry(0.055, 6, 4);
const particles = [];
function burst(color) {
  const surface = getParticleMaterial(color);
  for (let i = 0; i < 12; i++) {
    const object = new THREE.Mesh(particleGeometry, surface);
    object.position.set(rider.group.position.x, 1.4, 0);
    scene.add(object);
    particles.push({ object, life: 0.75, vx: (Math.random() - 0.5) * 4, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 3 });
  }
}

const game = createGame();
const input = { left: false, right: false };
const keyMap = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
function clearInput() { Object.keys(input).forEach((key) => { input[key] = false; }); }
function startGame() {
  clearInput();
  resetGame(game);
  rider.phase = 0;
  for (const entity of entities) {
    entity.object.position.z = entity.initialZ;
    entity.object.visible = true;
    entity.collected = false;
  }
  $('#start-screen').classList.add('hidden');
  $('#result-screen').classList.add('hidden');
  $('#help').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  if (matchMedia('(pointer: coarse)').matches) $('#touch-controls').classList.remove('hidden');
  updateHud();
}

addEventListener('keydown', (event) => {
  if (keyMap[event.code]) {
    input[keyMap[event.code]] = true;
    event.preventDefault();
  }
  if (event.code === 'Enter' && game.status !== 'running') startGame();
  if (event.code === 'Escape') $('#help').classList.add('hidden');
});
addEventListener('keyup', (event) => {
  if (keyMap[event.code]) input[keyMap[event.code]] = false;
});
addEventListener('blur', clearInput);
$('#start').addEventListener('click', startGame);
$('#restart').addEventListener('click', startGame);
$('.brand').addEventListener('click', (event) => event.preventDefault());
$('#soundless').addEventListener('click', () => $('#help').classList.toggle('hidden'));
$('#close-help').addEventListener('click', () => $('#help').classList.add('hidden'));
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', (event) => { input[button.dataset.key] = true; button.setPointerCapture(event.pointerId); });
  button.addEventListener('pointerup', () => { input[button.dataset.key] = false; });
  button.addEventListener('pointercancel', () => { input[button.dataset.key] = false; });
}

let toastTimer;
function toast(text, bad = false) {
  $('#toast').textContent = text;
  $('#toast').className = `toast show${bad ? ' bad' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').className = 'toast'; }, 850);
}
function updateHud() {
  $('#score').textContent = game.score.toString().padStart(4, '0');
  $('#speed').textContent = Math.round(game.speed * 3.6);
  $('#speed-fill').style.width = `${Math.min(100, game.speed / 30 * 100)}%`;
  $('#fuel-fill').style.width = `${Math.min(100, game.fuel)}%`;
  $('#fuel-fill').classList.toggle('low', game.fuel <= 20);
  $('#distance').textContent = Math.round(game.distance / 10).toString().padStart(3, '0');
  $('#lives').textContent = `${'● '.repeat(game.lives)}${'○ '.repeat(MAX_LIVES - game.lives)}`.trim();
  $('#lives').setAttribute('aria-label', `${game.lives} 点生命`);
}
let best = 0;
try { best = Number(localStorage.getItem('pelican-bike-best')) || 0; } catch { best = 0; }
function showResult() {
  best = Math.max(best, game.score);
  try { localStorage.setItem('pelican-bike-best', String(best)); } catch { /* Storage is optional. */ }
  $('#result-title').textContent = game.status === 'failed' ? '失败' : '过关';
  $('#result-copy').textContent = game.status === 'failed' ? '再试一次' : '到达终点';
  $('#final-score').textContent = game.score;
  $('#final-fish').textContent = game.fish;
  $('#best-score').textContent = best;
  $('#result-screen').classList.remove('hidden');
  $('#touch-controls').classList.add('hidden');
}

const cameraTarget = new THREE.Vector3();
camera.position.set(0, 3.2, 6.5);
camera.lookAt(0, 1.2, -6);
let lastTime = performance.now();
let lastStatus = game.status;
let elapsed = 0;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;
  elapsed += dt;
  if (game.status === 'running') {
    updateGame(game, input, dt);
    for (const entity of entities) {
      entity.object.position.z += game.speed * dt;
      if (entity.object.position.z > 16) {
        entity.object.position.z -= 380;
        entity.object.visible = true;
        entity.collected = false;
      }
      if (entity.type === 'fish') {
        entity.object.rotation.y = Math.sin(elapsed * 2 + entity.initialZ) * 0.4;
        entity.object.position.y = 0.9 + Math.sin(elapsed * 3 + entity.initialZ) * 0.13;
      }
      if (!entity.collected && Math.abs(entity.object.position.z) < 1.2 && Math.abs(entity.object.position.x - game.lateral) < (entity.type === 'fish' ? 0.95 : 0.78)) {
        if (entity.type === 'fish') {
          if (collectFish(game)) {
            entity.collected = true;
            entity.object.visible = false;
            toast('+FUEL  ·  FRESH CATCH');
            burst('#ffd068');
          }
        } else if (hitObstacle(game)) {
          entity.collected = true;
          entity.object.visible = false;
          toast('CRASH  ·  SLOW DOWN', true);
          burst('#ed6a4b');
          $('#flash').classList.remove('hit');
          void $('#flash').offsetWidth;
          $('#flash').classList.add('hit');
        }
      }
    }
    updateHud();
  }
  if (game.status !== lastStatus) {
    if (game.status === 'finished' || game.status === 'failed') showResult();
    lastStatus = game.status;
  }
  if (game.status === 'ready') {
    rider.group.position.x = 0;
    updateRider(rider, { speed: 0, steer: 0, lateral: 0, heading: 0 }, dt);
  } else {
    updateRider(rider, { speed: game.speed, steer: game.heading / 0.35, lateral: game.lateral, heading: game.heading }, dt);
  }
  rider.group.visible = game.invincible <= 0 || Math.floor(game.invincible * 12) % 2 === 0;
  world.update(elapsed, game.speed, dt);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.vy -= 5 * dt;
    p.object.position.x += p.vx * dt;
    p.object.position.y += p.vy * dt;
    p.object.position.z += p.vz * dt;
    p.object.scale.setScalar(Math.max(0, p.life / 0.75));
    if (p.life <= 0) { scene.remove(p.object); particles.splice(i, 1); }
  }

  // 越肩追尾相机
  const camX = rider.group.position.x * 0.6;
  const camY = 3.2 + Math.min(0.5, game.speed * 0.02);
  const camZ = 6.2 + Math.min(1.5, game.speed * 0.08);
  camera.position.x += (camX - camera.position.x) * Math.min(1, dt * 4);
  camera.position.y += (camY - camera.position.y) * Math.min(1, dt * 4);
  camera.position.z += (camZ - camera.position.z) * Math.min(1, dt * 4);
  cameraTarget.set(rider.group.position.x * 0.25, 1.0, -8);
  camera.lookAt(cameraTarget);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
});
