import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { advanceCrank, pedalPosition, solveLeg, steeringAngle } from '../src/animation.js';
import { createRider, updateRider } from '../src/models.js';

describe('rider animation', () => {
  it('does not rotate while stationary', () => {
    expect(advanceCrank(1.2, 0, 2)).toBe(1.2);
  });

  it('moves crank and wheels from traveled distance', () => {
    expect(advanceCrank(0, 7, 0.5)).toBeCloseTo(7 * 0.5 / 0.62 * 0.58);
  });

  it('places pedals opposite each other', () => {
    const left = pedalPosition(0, -1);
    const right = pedalPosition(0, 1);
    expect(left.y - 1.03).toBeCloseTo(-(right.y - 1.03));
    expect(left.z - 0.06).toBeCloseTo(-(right.z - 0.06));
  });

  it('solves a reachable two-bone leg', () => {
    const result = solveLeg({ x: 0, y: 2, z: 0 }, { x: 0, y: 0.8, z: 0.4 }, -1);
    const distance = Math.hypot(result.x, result.y - 2, result.z);
    expect(distance).toBeGreaterThan(0);
    expect(Number.isFinite(distance)).toBe(true);
  });

  it('limits steering and reverses direction correctly', () => {
    expect(steeringAngle(-1)).toBeGreaterThan(0);
    expect(steeringAngle(1)).toBeLessThan(0);
    expect(Math.abs(steeringAngle(10))).toBeLessThanOrEqual(0.42);
  });

  it('keeps every pedal attached to its crank arm through a revolution', () => {
    const rig = createRider();
    for (let i = 0; i < 12; i++) {
      updateRider(rig, { speed: 8, steer: 0, lateral: 0, heading: 0 }, 0.04);
      rig.group.updateMatrixWorld(true);
      for (const pedal of rig.pedals) {
        const armEnd = rig.crank.localToWorld(new THREE.Vector3(pedal.side * 0.16, 0, pedal.side * 0.29));
        const pedalEnd = pedal.group.localToWorld(new THREE.Vector3(pedal.side * 0.16, 0, 0));
        expect(armEnd.distanceTo(pedalEnd)).toBeLessThan(0.001);
      }
    }
  });

  it('rotates crank and wheels in the same direction', () => {
    const rig = createRider();
    updateRider(rig, { speed: 8, steer: 0, lateral: 0, heading: 0 }, 0.1);
    expect(Math.sign(rig.crank.rotation.x)).toBe(Math.sign(rig.wheels[0].rotation.x));
  });

  it('points the whole rider toward the steering direction', () => {
    const rig = createRider();
    updateRider(rig, { speed: 8, steer: 1, lateral: 0, heading: 0.24 }, 0.1);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(rig.group.quaternion);
    expect(forward.x).toBeGreaterThan(0);
  });
});
