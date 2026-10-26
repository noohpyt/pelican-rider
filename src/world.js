import * as THREE from 'three';
import { material, mesh, box, group } from './geometry.js';
import { createPalm } from './models.js';

export function createWorld(scene) {
  scene.background = new THREE.Color('#87b8c4');
  scene.fog = new THREE.Fog('#9cc9d1', 55, 220);

  const sky = mesh(new THREE.SphereGeometry(240, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color('#5ca3b5') }, bottom: { value: new THREE.Color('#f7e4c6') } },
    vertexShader: 'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vPosition;uniform vec3 top;uniform vec3 bottom;void main(){float h=normalize(vPosition).y;gl_FragColor=vec4(mix(bottom,top,smoothstep(-0.12,0.65,h)),1.0);}',
  }), scene);
  sky.castShadow = false;
  sky.receiveShadow = false;

  const sun = mesh(new THREE.SphereGeometry(7, 32, 16), new THREE.MeshBasicMaterial({ color: '#ffe2a1' }), scene, [-65, 38, -150]);
  sun.castShadow = false;

  const grass = material('#6b9e6b');
  const road = material('#555e60', { roughness: 0.95 });
  const line = material('#f8e8bd');
  const edge = material('#d49a5a');
  const barrier = material('#c44d3a');

  mesh(new THREE.PlaneGeometry(60, 420), grass, scene, [0, -0.24, -80]).rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(11.5, 420), road, scene, [0, -0.1, -80]).rotation.x = -Math.PI / 2;

  const markings = [];
  for (const side of [-1, 1]) {
    mesh(new THREE.PlaneGeometry(0.18, 420), edge, scene, [side * 4.9, -0.085, -80]).rotation.x = -Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.35, 0.22, 420), barrier, scene, [side * 5.6, 0.05, -80]);
  }
  for (let i = 0; i < 40; i++) {
    for (const x of [-1.8, 1.8]) {
      const dash = mesh(new THREE.BoxGeometry(0.1, 0.025, 3.5), line, scene, [x, -0.065, -i * 9 + 18]);
      dash.castShadow = false;
      markings.push(dash);
    }
  }

  const decor = [];
  for (let i = 0; i < 24; i++) {
    const side = i % 2 ? 1 : -1;
    const item = group(scene, [side * (7.5 + (i % 3)), -0.12, -i * 14 + 12]);
    if (i % 3 !== 0) {
      const palm = createPalm();
      palm.scale.setScalar(0.65 + (i % 4) * 0.06);
      item.add(palm);
    } else {
      const trunk = box(item, material('#8b6b4a'), [0, 0.6, 0], [0.35, 1.2, 0.35]);
      const top = box(item, material('#4a8f4a'), [0, 1.5, 0], [1.2, 0.8, 1.2]);
    }
    decor.push(item);
  }

  const clouds = [];
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: '#fff4dc', fog: false });
  for (let i = 0; i < 10; i++) {
    const cloud = new THREE.Group();
    cloud.position.set(-65 + i * 17, 19 + (i % 3) * 5, -80 - (i % 4) * 25);
    scene.add(cloud);
    for (let j = 0; j < 5; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.4 + (j % 2), 16, 16), cloudMaterial);
      puff.position.set(j * 2.2, Math.sin(j) * 1.2, 0);
      puff.scale.set(1, 0.6 + (j % 2) * 0.3, 0.7);
      puff.castShadow = false;
      cloud.add(puff);
    }
    clouds.push(cloud);
  }

  return {
    update(time, speed, dt) {
      for (const dash of markings) {
        dash.position.z += speed * dt;
        if (dash.position.z > 24) dash.position.z -= 360;
      }
      for (const item of decor) {
        item.position.z += speed * dt * 0.96;
        if (item.position.z > 26) item.position.z -= 336;
      }
      for (let i = 0; i < clouds.length; i++) clouds[i].position.x += Math.sin(time * 0.04 + i) * dt * 0.08;
    },
  };
}
