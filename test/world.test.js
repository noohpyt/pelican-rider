import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createWorld } from '../src/world.js';

describe('coastal world', () => {
  it('keeps the sea geometry to the left of the road shoulder', () => {
    const scene = new THREE.Scene();
    createWorld(scene);
    scene.updateMatrixWorld(true);
    const sea = scene.children.find((child) => child.material?.uniforms?.deep);
    const bounds = new THREE.Box3().setFromObject(sea);
    expect(bounds.max.x).toBeLessThanOrEqual(-5.5);
  });
});
