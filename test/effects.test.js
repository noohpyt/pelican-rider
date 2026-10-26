import { describe, expect, it } from 'vitest';
import { getParticleMaterial } from '../src/effects.js';

describe('particle resources', () => {
  it('reuses a material for repeated events of the same color', () => {
    const first = getParticleMaterial('#ffd068');
    const second = getParticleMaterial('#ffd068');
    expect(second).toBe(first);
    first.dispose();
  });
});
