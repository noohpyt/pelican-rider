import { describe, expect, it } from 'vitest';
import { createGame, updateGame, resetGame, hitObstacle, collectFish } from '../src/game-core.js';

describe('game core', () => {
  it('starts ready with a 60 second round', () => {
    const game = createGame();
    expect(game).toMatchObject({ status: 'ready', time: 60, score: 0, lives: 3, speed: 0 });
  });

  it('accelerates and clamps lateral movement', () => {
    const game = createGame();
    game.status = 'running';
    updateGame(game, { forward: true, left: true, boost: true }, 1);
    expect(game.speed).toBeGreaterThan(8);
    expect(game.lateral).toBeLessThan(0);
    updateGame(game, { left: true }, 100);
    expect(game.lateral).toBe(-4.1);
  });

  it('decelerates to a complete stop', () => {
    const game = createGame();
    game.status = 'running';
    game.speed = 1;
    updateGame(game, { brake: true }, 1);
    expect(game.speed).toBe(0);
  });

  it('ends after exactly 60 seconds without negative time', () => {
    const game = createGame();
    game.status = 'running';
    updateGame(game, { forward: true }, 61);
    expect(game.status).toBe('finished');
    expect(game.time).toBe(0);
  });

  it('fish score once and award a time bonus', () => {
    const game = createGame();
    game.status = 'running';
    game.time = 50;
    expect(collectFish(game)).toBe(true);
    expect(game.score).toBe(100);
    expect(game.fish).toBe(1);
    expect(game.time).toBe(50.5);
    game.status = 'finished';
    expect(collectFish(game)).toBe(false);
  });

  it('protects against repeated collision during invincibility', () => {
    const game = createGame();
    game.status = 'running';
    expect(hitObstacle(game)).toBe(true);
    expect(game.lives).toBe(2);
    expect(hitObstacle(game)).toBe(false);
    expect(game.lives).toBe(2);
    expect(game.score).toBe(0);
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
    Object.assign(game, { status: 'failed', score: 900, lives: 0, speed: 20, lateral: 3, fish: 9 });
    resetGame(game);
    expect(game).toMatchObject({ status: 'running', score: 0, lives: 3, speed: 7, lateral: 0, fish: 0, time: 60, invincible: 0 });
  });
});
