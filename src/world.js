import * as THREE from 'three';
import { material, mesh, sphere, box, group } from './geometry.js';
import { createPalm } from './models.js';

export function createWorld(scene) {
  scene.background = new THREE.Color('#a7dfe1');
  scene.fog = new THREE.Fog('#adddde', 48, 175);

  const sky = mesh(new THREE.SphereGeometry(240, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color('#6cbcc9') }, bottom: { value: new THREE.Color('#ffe5ba') } },
    vertexShader: 'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vPosition;uniform vec3 top;uniform vec3 bottom;void main(){float h=normalize(vPosition).y;gl_FragColor=vec4(mix(bottom,top,smoothstep(-0.12,0.65,h)),1.0);}',
  }), scene);
  sky.castShadow = false;
  sky.receiveShadow = false;

  const sun = mesh(new THREE.SphereGeometry(7, 32, 16), new THREE.MeshBasicMaterial({ color: '#ffe2a1' }), scene, [-65, 38, -150]);
  sun.castShadow = false;

  const sea = mesh(new THREE.PlaneGeometry(198, 330, 80, 100), new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, deep: { value: new THREE.Color('#258fa4') }, shallow: { value: new THREE.Color('#68c8c3') } },
    vertexShader: 'uniform float time;varying float vWave;varying vec3 vPos;void main(){vec3 p=position;float w=sin(p.x*.18+time)*.22+sin(p.y*.11-time*.7)*.18;p.z+=w;vWave=w;vPos=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
    fragmentShader: 'uniform vec3 deep;uniform vec3 shallow;varying float vWave;varying vec3 vPos;void main(){float stripe=smoothstep(.28,.38,vWave);vec3 c=mix(deep,shallow,vWave+.5);c=mix(c,vec3(.83,.94,.86),stripe*.35);gl_FragColor=vec4(c,1.0);}',
  }), scene, [-105, -0.42, -70]);
  sea.rotation.x = -Math.PI / 2;
  sea.castShadow = false;

  const sand = material('#e8c991');
  const grass = material('#78aa7c');
  const road = material('#526b6c', { roughness: 0.95 });
  const line = material('#f8e8bd');
  const edge = material('#f4bd6c');
  mesh(new THREE.PlaneGeometry(42, 340), sand, scene, [26, -0.24, -80]).rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(20, 340), grass, scene, [19, -0.19, -80]).rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(10.5, 340), road, scene, [0, -0.1, -80]).rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    mesh(new THREE.PlaneGeometry(0.16, 340), edge, scene, [side * 4.75, -0.085, -80]).rotation.x = -Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.32, 0.2, 340), sand, scene, [side * 5.42, -0.04, -80]);
  }

  const markings = [];
  for (let i = 0; i < 30; i++) {
    for (const x of [-1.65, 1.65]) {
      const dash = mesh(new THREE.BoxGeometry(0.09, 0.025, 2.7), line, scene, [x, -0.065, -i * 9 + 15]);
      dash.castShadow = false;
      markings.push(dash);
    }
  }

  const decor = [];
  for (let i = 0; i < 18; i++) {
    const item = group(scene, [i % 2 ? 8 + (i % 3) : -6.4, -0.12, -i * 16 + 8]);
    if (i % 2) {
      const palm = createPalm();
      palm.scale.setScalar(0.8 + (i % 4) * 0.07);
      item.add(palm);
    } else {
      sphere(item, material('#d3b17e'), [0, 0.28, 0], [0.55, 0.42, 0.65], 12);
      for (let j = 0; j < 3; j++) {
        const tuft = mesh(new THREE.ConeGeometry(0.16, 0.75, 5), grass, item, [j * 0.25 - 0.25, 0.4, 0]);
        tuft.rotation.z = j * 0.25 - 0.25;
      }
    }
    decor.push(item);
  }

  const clouds = [];
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: '#fff4dc', fog: false });
  for (let i = 0; i < 10; i++) {
    const cloud = group(scene, [-65 + i * 17, 19 + (i % 3) * 5, -80 - (i % 4) * 25]);
    for (let j = 0; j < 5; j++) {
      const puff = sphere(cloud, cloudMaterial, [j * 2.2, Math.sin(j) * 1.2, 0], [2.8, 1.5 + (j % 2), 1.4], 16);
      puff.castShadow = false;
    }
    clouds.push(cloud);
  }

  return {
    update(time, speed, dt) {
      sea.material.uniforms.time.value = time * 0.7;
      for (const dash of markings) {
        dash.position.z += speed * dt;
        if (dash.position.z > 24) dash.position.z -= 270;
      }
      for (const item of decor) {
        item.position.z += speed * dt * 0.96;
        if (item.position.z > 26) item.position.z -= 288;
      }
      for (let i = 0; i < clouds.length; i++) clouds[i].position.x += Math.sin(time * 0.04 + i) * dt * 0.08;
    },
  };
}
