export const CRANK_RADIUS = 0.29;
export const WHEEL_RADIUS = 0.62;
export const GEAR_RATIO = 0.58;

export function advanceCrank(phase, speed, dt) {
  return phase + speed * dt / WHEEL_RADIUS * GEAR_RATIO;
}

export function pedalPosition(phase, side) {
  const angle = phase + (side > 0 ? Math.PI : 0);
  return { x: side * 0.48, y: 1.03 - Math.sin(angle) * CRANK_RADIUS, z: 0.06 - Math.cos(angle) * CRANK_RADIUS };
}

export function solveLeg(hip, pedal, side = 1) {
  const upper = 0.72;
  const lower = 0.76;
  const dy = pedal.y - hip.y;
  const dz = pedal.z - hip.z;
  const rawDistance = Math.hypot(dy, dz);
  const distance = Math.min(upper + lower - 0.001, Math.max(0.05, rawDistance));
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const uy = dy / (rawDistance || 1);
  const uz = dz / (rawDistance || 1);
  return {
    x: hip.x + side * 0.09,
    y: hip.y + uy * along - uz * height,
    z: hip.z + uz * along + uy * height,
  };
}

export function steeringAngle(steer) {
  return -Math.max(-1, Math.min(1, steer)) * 0.42;
}
