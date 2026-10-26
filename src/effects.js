import * as THREE from 'three';

const materials = new Map();

export function getParticleMaterial(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color }));
  return materials.get(color);
}
