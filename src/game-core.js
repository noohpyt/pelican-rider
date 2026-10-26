export const ROUND_TIME = 60;
export const ROAD_LIMIT = 4.1;

export function createGame() {
  return {
    status: 'ready', time: ROUND_TIME, score: 0, fish: 0, lives: 3,
    speed: 0, lateral: 0, lateralVelocity: 0, heading: 0,
    distance: 0, invincible: 0, boosting: false,
  };
}

export function resetGame(game) {
  Object.assign(game, createGame(), { status: 'running', speed: 7 });
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
  game.time = Math.max(0, game.time - step);
  game.invincible = Math.max(0, game.invincible - step);
  if (game.time === 0) {
    game.status = 'finished';
    game.speed = 0;
    game.boosting = false;
    return;
  }

  game.boosting = Boolean(input.boost && !input.brake);
  const target = input.brake ? 0 : input.forward ? (game.boosting ? 19 : 12) : 5;
  const response = input.brake ? 7 : game.boosting ? 2.6 : 1.7;
  game.speed += (target - game.speed) * Math.min(1, response * step);
  if (game.speed < 0.025) game.speed = 0;
  game.distance += game.speed * step;

  const steer = Number(Boolean(input.right)) - Number(Boolean(input.left));
  game.lateralVelocity += steer * 19 * step;
  game.lateralVelocity *= Math.exp(-7 * step);
  game.lateral += game.lateralVelocity * step * 6;
  if (Math.abs(game.lateral) > ROAD_LIMIT) {
    game.lateral = Math.sign(game.lateral) * ROAD_LIMIT;
    game.lateralVelocity = 0;
  }
  const targetHeading = steer * 0.24 + game.lateralVelocity * 0.045;
  game.heading += (targetHeading - game.heading) * Math.min(1, 7 * step);
}

export function collectFish(game) {
  if (game.status !== 'running') return false;
  game.fish += 1;
  game.score += 100;
  game.time = Math.min(ROUND_TIME, game.time + 0.5);
  return true;
}

export function hitObstacle(game) {
  if (game.status !== 'running' || game.invincible > 0) return false;
  game.lives -= 1;
  game.invincible = 1.8;
  game.speed *= 0.42;
  game.score = Math.max(0, game.score - 50);
  if (game.lives <= 0) {
    game.lives = 0;
    game.status = 'failed';
    game.speed = 0;
    game.boosting = false;
  }
  return true;
}
