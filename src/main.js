import * as THREE from 'three';
import { createGame, updateGame, resetGame, collectFish, hitObstacle } from './game-core.js';
import { createRider, updateRider, createFish, createObstacle } from './models.js';
import { createWorld } from './world.js';
import { getParticleMaterial } from './effects.js';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main id="game" aria-label="Pelican Rider 3D 游戏">
    <div id="scene" aria-hidden="true"></div>
    <div class="grain"></div>
    <header class="topbar">
      <a class="brand" href="#" aria-label="Pelican Rider 首页"><span class="brand-mark">PR</span><span>PELICAN <b>RIDER</b></span></a>
      <div class="round-pill"><span class="dot"></span> COASTAL RUN <span class="round-number">01</span></div>
      <button id="soundless" class="icon-button" aria-label="游戏操作说明">?</button>
    </header>
    <section id="hud" class="hud hidden" aria-label="游戏状态">
      <div class="timer-card"><span>TIME LEFT</span><strong id="time">60</strong><small>SECONDS</small></div>
      <div class="lives-card"><span>FEATHERS</span><div id="lives" aria-label="3 点生命">● ● ●</div></div>
      <div class="score-card"><span>CATCH OF THE DAY</span><div><strong id="score">0000</strong><small>PTS</small></div><p><b id="fish">0</b> FISH COLLECTED</p></div>
      <div class="speed-card"><div class="speed-label"><span id="speed-label">CRUISING</span><b><span id="speed">7</span> km/h</b></div><div class="speed-track"><i id="speed-fill"></i></div><small>HOLD SHIFT TO PICK UP THE PACE</small></div>
    </section>
    <div id="toast" class="toast" role="status"></div>
    <div id="flash" class="flash"></div>
    <section id="start-screen" class="overlay start-screen">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> A SMALL COASTAL ADVENTURE</p>
        <h1>PELICAN<br><em>RIDER</em></h1>
        <p class="tagline">Serious bird. <span>Easy breeze.</span></p>
        <p class="intro">踩上踏板，沿海风前行。<br>收集鲜鱼，躲开路障，享受这 60 秒。</p>
        <button id="start" class="primary-button">LET'S RIDE <span>→</span></button>
        <div class="controls"><div><kbd>W</kbd><kbd>↑</kbd><span>加速</span></div><div><kbd>A</kbd><kbd>D</kbd><span>转向</span></div><div><kbd>SHIFT</kbd><span>冲刺</span></div><div><kbd>S</kbd><span>刹车</span></div></div>
      </div>
      <div class="route-stamp"><span>THE COASTAL</span><strong>60</strong><span>SECOND RUN</span></div>
      <p class="start-hint">HEADPHONES OPTIONAL · SEA BREEZE INCLUDED</p>
    </section>
    <section id="result-screen" class="overlay result-screen hidden" aria-live="polite">
      <div class="result-card"><p class="eyebrow" id="result-eyebrow">COASTAL RUN COMPLETE</p><h2 id="result-title">NICE RIDE!</h2><p id="result-copy">海风记住了你的车铃。</p><div class="result-stats"><div><strong id="final-score">0</strong><span>SCORE</span></div><div><strong id="final-fish">0</strong><span>FISH</span></div><div><strong id="best-score">0</strong><span>BEST</span></div></div><button id="restart" class="primary-button">RIDE AGAIN <span>↻</span></button><small>或按 Enter 重新开始</small></div>
    </section>
    <section id="help" class="help-card hidden"><button id="close-help" aria-label="关闭操作说明">×</button><p class="eyebrow">HOW TO RIDE</p><h2>海岸骑行指南</h2><p><b>W / ↑</b> 加速，<b>S / ↓</b> 刹车，<b>A D / ← →</b> 转向。</p><p>按住 <b>Shift / 空格</b> 冲刺。鲜鱼 +100 分并 +0.5 秒；碰撞扣一点生命和 50 分。</p><p>三点生命耗尽则失败；坚持到倒计时结束即完成。</p></section>
    <div class="touch-controls hidden" id="touch-controls"><button data-key="left" aria-label="左转">←</button><button data-key="forward" aria-label="加速">↑</button><button data-key="boost" aria-label="冲刺">»</button><button data-key="right" aria-label="右转">→</button></div>
  </main>`;

const $ = (selector) => document.querySelector(selector);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(47, innerWidth / innerHeight, 0.1, 400);
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
rider.group.position.set(1.5, 0, 0);

const entities = [];
const lanes = [-3.15, 0, 3.15];
for (let i = 0; i < 34; i++) {
  const type = i % 5 === 3 ? 'obstacle' : 'fish';
  const object = type === 'fish' ? createFish() : createObstacle();
  const lane = lanes[(i * 7 + Math.floor(i / 3)) % 3];
  object.position.set(lane, type === 'fish' ? 1.25 : 0, -14 - i * 8.2);
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
const input = { forward: false, brake: false, left: false, right: false, boost: false };
const keyMap = { KeyW: 'forward', ArrowUp: 'forward', KeyS: 'brake', ArrowDown: 'brake', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', ShiftLeft: 'boost', ShiftRight: 'boost', Space: 'boost' };
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
  $('#time').textContent = Math.ceil(game.time).toString().padStart(2, '0');
  $('#time').classList.toggle('urgent', game.time <= 10);
  $('#score').textContent = game.score.toString().padStart(4, '0');
  $('#fish').textContent = game.fish;
  $('#speed').textContent = Math.round(game.speed * 3.6);
  $('#speed-fill').style.width = `${Math.min(100, game.speed / 19 * 100)}%`;
  $('#speed-label').textContent = game.boosting && game.speed > 13 ? 'FULL SEND' : game.speed < 1 ? 'TAKING A BREATHER' : 'CRUISING';
  $('#lives').textContent = `${'● '.repeat(game.lives)}${'○ '.repeat(3 - game.lives)}`.trim();
  $('#lives').setAttribute('aria-label', `${game.lives} 点生命`);
}
let best = 0;
try { best = Number(localStorage.getItem('pelican-rider-best')) || 0; } catch { best = 0; }
function showResult() {
  best = Math.max(best, game.score);
  try { localStorage.setItem('pelican-rider-best', String(best)); } catch { /* Storage is optional. */ }
  $('#result-eyebrow').textContent = game.status === 'failed' ? 'A FEW RUFFLED FEATHERS' : 'COASTAL RUN COMPLETE';
  $('#result-title').textContent = game.status === 'failed' ? 'SHAKE IT OFF.' : 'NICE RIDE!';
  $('#result-copy').textContent = game.status === 'failed' ? '路障赢了这一回，鹈鹕还想再试一次。' : '海风记住了你的车铃。';
  $('#final-score').textContent = game.score;
  $('#final-fish').textContent = game.fish;
  $('#best-score').textContent = best;
  $('#result-screen').classList.remove('hidden');
  $('#touch-controls').classList.add('hidden');
}

const cameraTarget = new THREE.Vector3();
camera.position.set(6.4, 4.5, 8.7);
camera.lookAt(0, 1.65, -2);
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
      if (entity.object.position.z > 13) {
        entity.object.position.z -= 278.8;
        entity.object.visible = true;
        entity.collected = false;
      }
      if (entity.type === 'fish') {
        entity.object.rotation.y = Math.sin(elapsed * 2 + entity.initialZ) * 0.4;
        entity.object.position.y = 1.25 + Math.sin(elapsed * 3 + entity.initialZ) * 0.13;
      }
      if (!entity.collected && Math.abs(entity.object.position.z) < 1.05 && Math.abs(entity.object.position.x - game.lateral) < (entity.type === 'fish' ? 0.95 : 0.78)) {
        if (entity.type === 'fish') {
          if (collectFish(game)) {
            entity.collected = true;
            entity.object.visible = false;
            toast('+100  ·  FRESH CATCH');
            burst('#ffd068');
          }
        } else if (hitObstacle(game)) {
          entity.collected = true;
          entity.object.visible = false;
          toast('-50  ·  WATCH THE ROAD', true);
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
    rider.group.position.x = 1.5;
    updateRider(rider, { speed: 0, steer: 0, lateral: 1.5, heading: -0.08 }, dt);
  } else {
    updateRider(rider, { speed: game.speed, steer: game.heading / 0.3, lateral: game.lateral, heading: game.heading }, dt);
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
  const desiredX = (game.status === 'ready' ? 7.6 : 5.8) + rider.group.position.x * 0.35;
  camera.position.x += (desiredX - camera.position.x) * Math.min(1, dt * 3);
  camera.position.y += (4.5 - camera.position.y) * Math.min(1, dt * 3);
  camera.position.z = 8.7;
  cameraTarget.set(rider.group.position.x * 0.55, 1.62, -2.4);
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
