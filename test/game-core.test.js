import { describe, expect, it } from 'vitest';
import { createGame, updateGame, resetGame, hitObstacle, collectFish, collectHeart, rankPercentile, MAX_LIVES, TARGET_DISTANCE } from '../src/game-core.js';

describe('game core', () => {
  it('starts ready with full fuel', () => {
    const game = createGame();
    expect(game).toMatchObject({ status: 'ready', score: 0, lives: 3, speed: 0, fuel: 100 });
  });

  it('auto-accelerates and clamps lateral movement', () => {
    const game = createGame();
    game.status = 'running';
    updateGame(game, { left: true }, 2);
    expect(game.speed).toBeGreaterThan(8);
    expect(game.lateral).toBeLessThan(0);
    updateGame(game, { left: true }, 100);
    expect(game.lateral).toBe(-4.1);
  });

  it('runs out of fuel and fails', () => {
    const game = createGame();
    game.status = 'running';
    game.fuel = 0.05;
    updateGame(game, {}, 5);
    expect(game.status).toBe('failed');
  });

  it('finishes after reaching target distance', () => {
    const game = createGame();
    game.status = 'running';
    game.distance = TARGET_DISTANCE - 1;
    updateGame(game, {}, 1);
    expect(game.status).toBe('finished');
    expect(game.distance).toBeGreaterThanOrEqual(TARGET_DISTANCE);
  });

  it('fish score once and refuel', () => {
    const game = createGame();
    game.status = 'running';
    game.fuel = 50;
    expect(collectFish(game)).toBe(true);
    expect(game.score).toBe(100);
    expect(game.fish).toBe(1);
    expect(game.fuel).toBe(68);
    game.status = 'finished';
    expect(collectFish(game)).toBe(false);
  });

  it('gets faster the longer you survive', () => {
    const game = createGame();
    game.status = 'running';
    updateGame(game, {}, 10);
    const early = game.speed;
    expect(game.elapsed).toBeGreaterThan(9);
    updateGame(game, {}, 40);
    expect(game.speed).toBeGreaterThan(early);
  });

  it('estimates rank percentile from survival time', () => {
    expect(rankPercentile(0)).toBe(0);
    expect(rankPercentile(120)).toBeGreaterThan(50);
    expect(rankPercentile(100000)).toBeLessThanOrEqual(99.7);
  });

  it('heart restores one life up to the cap', () => {
    const game = createGame();
    game.status = 'running';
    game.lives = 1;
    expect(collectHeart(game)).toBe(true);
    expect(game.lives).toBe(2);
    expect(game.score).toBe(50);
    game.lives = MAX_LIVES;
    collectHeart(game);
    expect(game.lives).toBe(MAX_LIVES);
    game.status = 'finished';
    expect(collectHeart(game)).toBe(false);
  });

  it('protects against repeated collision during invincibility', () => {
    const game = createGame();
    game.status = 'running';
    expect(hitObstacle(game)).toBe(true);
    expect(game.lives).toBe(2);
    expect(hitObstacle(game)).toBe(false);
    expect(game.lives).toBe(2);
  });

  it('fails on the third separated obstacle hit', () => {
    const game = createGame();
    game.status = 'running';
    hitObstacle(game);
    game.invincible = 0;
    hitObstacle(game);
    game.invincible = 0;
    hitObstacle(game);
    expect(game.status).toBe('failed');
    expect(game.lives).toBe(0);
  });

  it('resets every transient gameplay value', () => {
    const game = createGame();
    Object.assign(game, { status: 'failed', score: 900, lives: 0, speed: 20, lateral: 3, fish: 9, fuel: 10, distance: 2000 });
    resetGame(game);
    expect(game).toMatchObject({ status: 'running', score: 0, lives: 3, speed: 8, lateral: 0, fish: 0, invincible: 0, fuel: 100, distance: 0 });
  });
});
