import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createWorld } from '../src/world.js';

describe('road world', () => {
  it('keeps the road centered and barriers outside the drivable area', () => {
    const scene = new THREE.Scene();
    createWorld(scene);
    scene.updateMatrixWorld(true);
    const road = scene.children.find((child) => child.geometry && child.geometry.parameters && child.geometry.parameters.width === 11.5);
    expect(road).toBeDefined();
    expect(road.position.x).toBe(0);
  });
});
