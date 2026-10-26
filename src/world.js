import * as THREE from 'three';
import { material, mesh, group } from './geometry.js';
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

  const road = material('#555e60', { roughness: 0.95 });
  const line = material('#f8e8bd');
  const edge = material('#d49a5a');
  const barrier = material('#c44d3a');
  const sand = material('#e0c690', { roughness: 0.9 });

  // 海面：两侧不断涨潮的大海，公路是海上公路
  const water = mesh(new THREE.PlaneGeometry(220, 440, 72, 96), new THREE.ShaderMaterial({
    transparent: true,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { time: { value: 0 }, deep: { value: new THREE.Color('#2b7a8c') }, shallow: { value: new THREE.Color('#7ecabb') } },
    ]),
    vertexShader: `
      #include <fog_pars_vertex>
      uniform float time;
      varying float vWave;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 0.32 + time * 1.7) * 0.14 + cos(p.y * 0.22 + time * 1.15) * 0.12
                + sin((p.x + p.y) * 0.09 + time * 0.6) * 0.1;
        p.z += w;
        vWave = w;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <fog_pars_fragment>
      uniform vec3 deep;
      uniform vec3 shallow;
      varying float vWave;
      void main() {
        vec3 c = mix(deep, shallow, smoothstep(-0.2, 0.3, vWave));
        gl_FragColor = vec4(c, 0.93);
        #include <fog_fragment>
      }`,
  }), scene, [0, -1.5, -80]);
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  water.receiveShadow = false;

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
    const item = group(scene, [side * (8.5 + (i % 3) * 1.5), -0.12, -i * 14 + 12]);
    // 小沙岛：棕榈/礁石立在海上
    const islet = mesh(new THREE.CylinderGeometry(1.7, 2.3, 0.6, 12), sand, item, [0, -0.45, 0]);
    islet.receiveShadow = true;
    if (i % 3 !== 0) {
      const palm = createPalm();
      palm.scale.setScalar(0.65 + (i % 4) * 0.06);
      item.add(palm);
    } else {
      const rock = mesh(new THREE.DodecahedronGeometry(0.7, 0), material('#8a8175', { roughness: 0.95 }), item, [0.2, 0.3, 0]);
      rock.rotation.set(i, i * 2, 0);
      const rockB = mesh(new THREE.DodecahedronGeometry(0.4, 0), material('#7d7468', { roughness: 0.95 }), item, [-0.5, 0.15, 0.3]);
      rockB.rotation.set(0, i, i);
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
      // 涨潮：海面随时间缓慢上升，接近路面后停住
      water.material.uniforms.time.value = time;
      water.position.y = Math.min(-0.2, -1.5 + time * 0.012);
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
