import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import { UnrealBloomPass } from 'UnrealBloomPass';

const canvas = document.getElementById('three-canvas');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 15);

// Загрузка текстуры планеты
const textureLoader = new THREE.TextureLoader();
const planetTexture = textureLoader.load('planet.jpg');

// Планета
const sphereGeo = new THREE.SphereGeometry(5, 128, 128);
const sphereMat = new THREE.MeshStandardMaterial({
  map: planetTexture,
  roughness: 0.1,
  metalness: 0.5,
  color: new THREE.Color(0x0000FF),
  opacity: 0,
  transparent: true,
});
const planet = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(planet);

// Атмосфера (ShaderMaterial)
const atmGeo = new THREE.SphereGeometry(5.2, 64, 64);
const atmMat = new THREE.ShaderMaterial({
  uniforms: {
    opacity: { value: 0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    uniform float opacity;
    void main() {
      float intensity = pow(0.69 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
      gl_FragColor = vec4(0.1, 0.2, 2.5, opacity) * intensity;
    }
  `,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true
});
const atmosphere = new THREE.Mesh(atmGeo, atmMat);
scene.add(atmosphere);

// Освещение
const redEye = new THREE.DirectionalLight(0xff3333, 1.5);
redEye.position.set(-200, 100, -300);
scene.add(redEye);

const blueEye = new THREE.DirectionalLight(0x4444ff, 1.5);
blueEye.position.set(200, 100, -250);
scene.add(blueEye);

const rimLight = new THREE.HemisphereLight(0xffccaa, 0x333333, 2.45);
rimLight.position.set(0, 0, 20);
scene.add(rimLight);

// Постобработка: Bloom эффект
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.2);
composer.addPass(bloomPass);

// Анимационные состояния
let planetRevealOpacity = 0;
let phase = 'appear'; // appear -> shrink -> done

function animate() {
  requestAnimationFrame(animate);

  if (phase === 'appear') {
    if (planetRevealOpacity < 1) {
      planetRevealOpacity += 0.01;
      sphereMat.opacity = planetRevealOpacity;
      atmMat.uniforms.opacity.value = planetRevealOpacity * 0.6;
    } else {
      phase = 'shrink';
    }
  } else if (phase === 'shrink') {
    planet.scale.multiplyScalar(0.98);
    atmosphere.scale.multiplyScalar(0.98);
    sphereMat.opacity *= 0.98;

    if (planet.scale.x < 0.89) {
      phase = 'done';

      // Включаем CSS-затемнение
      const overlay = document.getElementById('dark-overlay');
      overlay.style.opacity = '1';
    }
  }

  planet.rotation.y += 0.0008;
  composer.render();
}

animate();

// Обработка ресайза
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
