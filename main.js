import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import { UnrealBloomPass } from 'UnrealBloomPass';
import gsap from 'gsap';

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 15);

const textureLoader = new THREE.TextureLoader();
const planetTexture = textureLoader.load('planet.jpg');

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

const atmGeo = new THREE.SphereGeometry(5.2, 64, 64);
const atmMat = new THREE.ShaderMaterial({
  uniforms: { opacity: { value: 0 } },
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

function addLight(light, pos) {
  light.position.set(...pos);
  scene.add(light);
}

[
  [new THREE.DirectionalLight(0xff3333, 1.5), [-200, 100, -300]],
  [new THREE.DirectionalLight(0x4444ff, 1.5), [200, 100, -250]],
  [new THREE.HemisphereLight(0xffccaa, 0x333333, 2.25), [0, 0, 20]]
].forEach(([light, pos]) => addLight(light, pos))

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.2);
composer.addPass(bloomPass);

let planetRevealOpacity = 0;
// Анимация смены языка
let isRevealing = false;
const possible = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
const textEl = document.getElementById("zagolovok");

let revealed = "";
let target = "";
let translations = {};
let savedLang = localStorage.getItem('lang') || 'ru';

//перебор символов
async function scrambleSymbol(char, iterations = 9) {
  for (let i = 0; i < iterations; i++){
    textEl.textContent = revealed + possible[Math.floor(Math.random() * possible.length)];
    await new Promise(r => setTimeout(r, 30));
  }
  revealed += char;
  textEl.textContent = revealed;
}

async function revealWord() {
  if (isRevealing) return;
  isRevealing = true;
  textEl.style.opacity = '1';
  for (let char of target) {
    await scrambleSymbol(char);
  }
  isRevealing = false
}

fetch('lang.json')
  .then(res => res.json())
  .then(data => { translations = data; applyLanguage(savedLang); });

function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;
  const zagolovok = document.getElementById('zagolovok');
  if (t.zagolovok) {
    zagolovok.dataset.i18n = 'zagolovok';
    target = t.zagolovok;
    revealed = "";
  }
  if(t.title) document.title = t.title;
  const switcher = document.getElementById('lang-switch');
  if (switcher) {
    switcher.setAttribute('data-active', lang);
  }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if(isRevealing) return;
    const lang = btn.dataset.lang;
    if (lang !== savedLang) {
      localStorage.setItem('lang', lang);
      savedLang = lang;
      applyLanguage(lang);
      revealWord();
    }
  });
});

let phase = 'appear';
const phases = {
  appear() {
    if (planetRevealOpacity < 1) {
      planetRevealOpacity += 0.01;
      sphereMat.opacity = planetRevealOpacity;
      atmMat.uniforms.opacity.value = planetRevealOpacity * 0.6;
    } else {
      phase = 'shrink';
    }
  },
  shrink() {
    gsap.to([planet.scale, atmosphere.scale], { x: 0.89, y: 0.89, z: 0.89, duration: 2});
    gsap.to(sphereMat, {opacity: 0.75, duration: 1.5});
    if (planet.scale.x < 0.95) {
      phase = 'done';
      const overlay = document.getElementById('dark-overlay');
      overlay.style.opacity = '1';
      setTimeout(() => {
        if (target) {
          revealWord();
        }
      }, 2000);
    }
  }, 
  done() {}
}

function animate() {
  requestAnimationFrame(animate);
  phases[phase]?.();
  planet.rotation.y += 0.0008;
  composer.render();
}
animate();

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}
window.addEventListener('resize', onResize);