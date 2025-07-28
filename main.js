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

const redEye = new THREE.DirectionalLight(0xff3333, 1.5);
redEye.position.set(-200, 100, -300);
scene.add(redEye);

const blueEye = new THREE.DirectionalLight(0x4444ff, 1.5);
blueEye.position.set(200, 100, -250);
scene.add(blueEye);

const rimLight = new THREE.HemisphereLight(0xffccaa, 0x333333, 2.45);
rimLight.position.set(0, 0, 20);
scene.add(rimLight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.2);
composer.addPass(bloomPass);

let planetRevealOpacity = 0;
let phase = 'appear';
// Анимация смены языка
let isRevealing = false;
let scrambleInterval = null;
const possible = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
const textEl = document.getElementById("zagolovok");

let revealed = "";  // ❗ исправлено: let вместо const
let target = "";    // ❗ исправлено: let вместо const
let translations = {};
let savedLang = localStorage.getItem('lang') || 'ru';
//перебор символов
function scrambleSymbol(targetChar, iterations = 9) {
  let count = 0;
  return new Promise(resolve => {
    if (scrambleInterval) clearInterval(scrambleInterval);
    scrambleInterval = setInterval(() => {
      if (count < iterations) {
        const randChar = possible[Math.floor(Math.random() * possible.length)];
        textEl.textContent = revealed + randChar;
        count++;
      } else {
        clearInterval(scrambleInterval);
        revealed += targetChar;
        textEl.textContent = revealed;
        resolve();
      }
    }, 30);
  });
}

async function revealWord() {
  if (isRevealing) return;
  isRevealing = true;
  textEl.style.opacity = '1';
  for (let i = 0; i < target.length; i++) {
    await scrambleSymbol(target[i]);
  }
  isRevealing = false
}

fetch('lang.json')
  .then(res => res.json())
  .then(data => {
    translations = data;
    applyLanguage(savedLang);
  });

function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  const zagolovok = document.getElementById('zagolovok');
  if (t.zagolovok) {
    zagolovok.dataset.i18n = 'zagolovok';
    target = t.zagolovok;    // теперь можно менять
    revealed = "";         // сбрасываем на новый язык
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

      const overlay = document.getElementById('dark-overlay');
      overlay.style.opacity = '1';

      setTimeout(() => {
        if (target) {
          revealWord();
        }
      }, 2000);
    }
  }

  planet.rotation.y += 0.0008;
  composer.render();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
