import * as THREE from 'three';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import { UnrealBloomPass } from 'UnrealBloomPass';
import gsap from 'gsap';

//constants
const possible = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
const savedLang = localStorage.getItem('lang') || 'ru';
let translations = {}, isRevealing = false;

//scene
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 15);

//light
[
  [new THREE.DirectionalLight(0xff3333, 2.0), [-200, 100, -300]],
  [new THREE.DirectionalLight(0x4444ff, 1.5), [200, 100, -250]],
  [new THREE.HemisphereLight(0xffccaa, 0x333333, 2.25), [0, 0, 20]]
].forEach(([light, pos]) => {
  light.position.set(...pos);
  scene.add(light);
});

//planet and atmosphere
const textureLoader = new THREE.TextureLoader();
const planetTexture = textureLoader.load('/image/planet.jpg');
const sphereGeo = new THREE.SphereGeometry(5, window.innerWidth < 768 ? 32 : 64, window.innerWidth < 768 ? 32 : 64);
const sphereMat = new THREE.MeshStandardMaterial({
    map: planetTexture,
    roughness: 0.1, 
    metalness: 0.5,
    color: 0x0000FF,
    opacity: 0,
    transparent: true
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

//post-processing
const bloomStrenght = window.innerWidth < 768 ? 0.6 : 1.0;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector3(window.innerWidth, window.innerHeight), bloomStrenght, 0.2));

//GSAP
function startAnimation() {
  gsap.timeline()
    .to(sphereMat, {
      opacity: 1,
      duration: 2,
      onUpdate: () => atmMat.uniforms.opacity.value = sphereMat.opacity * 0.6
    })
    .to([planet.scale, atmosphere.scale], { x: 0.89, y: 0.89, z: 0.89, duration: 2, ease: "power2.inOut" })
    .to(sphereMat, {opacity: 0.55, duration: 2, ease: "power2.inOut"}, "<")
    .to("#dark-overlay", {
      opacity: 1, duration: 1,
      onComplete: () => { if(pendingLang) revealLanguage(pendingLang); }
    });
}

// scrumbling text
async function scrambleSymbol(char, elementId, currentText, iterations = 7) {
  const textEl = document.getElementById(elementId);
  for (let i = 0; i < iterations; i++) {
    textEl.textContent = currentText + possible[Math.floor(Math.random() * possible.length)];
    await new Promise(r => setTimeout(r, 30));
  }
  return currentText + char;
}

async function revealWord(text, elementId, iterations) {
  const textEl = document.getElementById(elementId);
  if (!textEl) return;
  isRevealing = true;
  let revealedLocal = "";
  for (let char of text) {
    revealedLocal = await scrambleSymbol(char, elementId, revealedLocal, iterations);
    textEl.textContent = revealedLocal;
  }
  isRevealing = false;
}
let pendingLang = savedLang;
//switch language
fetch('lang.json')
  .then(res => res.json())
  .then(data => { translations = data; applyLanguage(savedLang, false); });

function applyLanguage(lang, doReveal = true) {
  const t = translations[lang];
  pendingLang = lang;
  document.getElementById("header").textContent = "";
  document.getElementById("pheader").textContent = "";
  if (!t) return;
  if (t.title) document.title = t.title;
  if(doReveal) revealLanguage(lang);
  document.getElementById('lang-switch')?.setAttribute('data-active', lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.disabled = btn.dataset.lang === lang;
    btn.classList.toggle('disabled', btn.disabled);
  });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if(!isRevealing && !btn.disabled) {
      const newLang = btn.dataset.lang;
      localStorage.setItem('lang', newLang);
      applyLanguage(newLang);
    }
  });
});

//showing lang
function revealLanguage(lang) {
  const t = translations[lang];
  if(!t) return;
  if(t.header){
    revealWord(t.header, "header", 7).then(() => {
      if (t.pheader) revealWord(t.pheader, "pheader", 3);
    });
  }
}

//render
function animate() {
  requestAnimationFrame(animate);
  planet.rotation.y += 0.0005;
  composer.render();
}

function resizeBlya(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}

window.addEventListener('resize', resizeBlya);
animate();
startAnimation();
resizeBlya();