export const ROAD_LIMIT = 4.1;
export const TARGET_DISTANCE = 3000;
export const MAX_LIVES = 3;
// 调参面板可实时改的加速度倍率
export const tuning = { accelBoost: 2 };

export function createGame() {
  return {
    status: 'ready',
    score: 0,
    fish: 0,
    lives: MAX_LIVES,
    speed: 0,
    lateral: 0,
    lateralVelocity: 0,
    heading: 0,
    distance: 0,
    fuel: 100,
    invincible: 0,
    elapsed: 0,
  };
}

export function resetGame(game) {
  Object.assign(game, createGame(), { status: 'running', speed: 8 });
  return game;
}

export function updateGame(game, input, dt) {
  let remaining = Math.max(0, dt);
  while (remaining > 0 && game.status === 'running') {
    const step = Math.min(1 / 60, remaining);
    stepGame(game, input, step);
    remaining -= step;
  }
  return game;
}

function stepGame(game, input, step) {
  game.invincible = Math.max(0, game.invincible - step);
  game.elapsed += step;

  // 自动持续加速，存活越久速度上限越高、加速越猛；燃料耗尽则熄火滑行
  const maxSpeed = 18 + Math.min(16, game.elapsed * 0.18);
  const accel = (1.2 + Math.min(2.4, game.elapsed * 0.024)) * tuning.accelBoost;
  if (game.fuel > 0) game.speed += (maxSpeed - game.speed) * Math.min(1, accel * step);

  // 燃料持续消耗，速度越快消耗越快
  game.fuel = Math.max(0, game.fuel - (0.35 + game.speed * 0.018) * step);
  if (game.fuel <= 0) {
    game.fuel = 0;
    game.speed *= 0.96;
    if (game.speed < 2) {
      game.status = 'failed';
      game.speed = 0;
      return;
    }
  }

  // 距离与分数
  game.distance += game.speed * step;
  game.score += Math.floor(game.speed * step * 2);

  if (game.distance >= TARGET_DISTANCE) {
    game.status = 'finished';
    game.speed = 0;
    return;
  }

  // 左右变道
  const steer = Number(Boolean(input.right)) - Number(Boolean(input.left));
  game.lateralVelocity += steer * 24 * step;
  game.lateralVelocity *= Math.exp(-10 * step);
  game.lateral += game.lateralVelocity * step * 5;
  if (Math.abs(game.lateral) > ROAD_LIMIT) {
    game.lateral = Math.sign(game.lateral) * ROAD_LIMIT;
    game.lateralVelocity = 0;
  }
  const targetHeading = steer * 0.35 + game.lateralVelocity * 0.03;
  game.heading += (targetHeading - game.heading) * Math.min(1, 8 * step);
}

export function collectFish(game) {
  if (game.status !== 'running') return false;
  game.fish += 1;
  game.score += 100;
  game.fuel = Math.min(100, game.fuel + 18);
  return true;
}

export function collectHeart(game) {
  if (game.status !== 'running') return false;
  game.lives = Math.min(MAX_LIVES, game.lives + 1);
  game.score += 50;
  return true;
}

export function rankPercentile(seconds) {
  // 本地估算：存活越久超越的玩家比例越高，封顶 99.7%
  return Math.min(99.7, Math.round(1000 * (1 - Math.exp(-seconds / 80))) / 10);
}

export function hitObstacle(game) {
  if (game.status !== 'running' || game.invincible > 0) return false;
  game.lives -= 1;
  game.invincible = 1.5;
  game.speed *= 0.35;
  game.fuel = Math.max(0, game.fuel - 12);
  if (game.lives <= 0) {
    game.lives = 0;
    game.status = 'failed';
    game.speed = 0;
  }
  return true;
}
