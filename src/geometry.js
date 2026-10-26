import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

export function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...options });
}

export function mesh(geometry, surface, parent, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  parent?.add(object);
  return object;
}

export function sphere(parent, surface, position, scale = [1, 1, 1], detail = 24) {
  const object = mesh(new THREE.SphereGeometry(1, detail, 16), surface, parent, position);
  object.scale.set(...scale);
  return object;
}

export function box(parent, surface, position, scale, radius = 0) {
  const geometry = radius
    ? new THREE.CapsuleGeometry(radius, Math.max(0.01, scale[1] - radius * 2), 4, 10)
    : new THREE.BoxGeometry(...scale);
  const object = mesh(geometry, surface, parent, position);
  if (radius) object.scale.set(scale[0] / (radius * 2), 1, scale[2] / (radius * 2));
  return object;
}

export function rod(parent, surface, start, end, radius = 0.04, segments = 10) {
  const object = mesh(new THREE.CylinderGeometry(radius, radius, 1, segments), surface, parent);
  setRod(object, start, end);
  return object;
}

export function setRod(object, start, end) {
  const a = Array.isArray(start) ? new THREE.Vector3(...start) : start;
  const b = Array.isArray(end) ? new THREE.Vector3(...end) : end;
  const delta = new THREE.Vector3().subVectors(b, a);
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.scale.y = delta.length();
  object.quaternion.setFromUnitVectors(UP, delta.normalize());
}

export function tube(parent, surface, points, radius = 0.05) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, 32, radius, 8, false), surface, parent);
}

export function group(parent, position = [0, 0, 0]) {
  const object = new THREE.Group();
  object.position.set(...position);
  parent?.add(object);
  return object;
}
