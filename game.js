import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld, toggleFloor } from './world3d.js';

// --- UI LOGIC ---
const uiScreens = document.querySelectorAll('.overlay-screen');
function showScreen(id) {
    uiScreens.forEach(s => s.classList.remove('active'));
    if (id) document.getElementById(id).classList.add('active');
}

document.getElementById('play-btn').addEventListener('click', () => {
    showScreen('creator-screen');
    // Camera face zoom pe personaj
    controls.enabled = false; 
    camera.position.set(2, 2, 3);
    controls.target.set(0, 1.5, 2);
});

document.getElementById('settings-btn').addEventListener('click', () => showScreen('settings-modal'));
document.getElementById('close-settings').addEventListener('click', () => showScreen('main-menu'));
document.getElementById('credits-btn').addEventListener('click', () => {
    const credits = document.getElementById('credits-text');
    credits.style.display = credits.style.display === 'none' ? 'block' : 'none';
});

// --- SETUP THREE.JS ---
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Canvas Fullscreen
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#87CEEB');
scene.fog = new THREE.Fog('#87CEEB', 30, 60);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(15, 25, 15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance = 2;
controls.maxDistance = 40;
controls.enabled = false; // Dezactivat până intrăm în joc

scene.add(new THREE.AmbientLight('#fff5e6', 0.6));
const sunLight = new THREE.DirectionalLight('#ffe8c4', 1.2);
sunLight.position.set(20, 30, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const { interactables, floor1Group, floor2Group } = buildWorld(scene);

// --- FUNCȚIE CREARE PERSONAJ ---
function createHumanCharacter(name, skinColor, hairColor, shirtColor, gender, isNPC = false) {
  const group = new THREE.Group();
  
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor });
  const pantsMat = new THREE.MeshStandardMaterial({ color: isNPC ? '#4a5568' : '#5c6bc0' });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor });

  let shoulderWidth = gender === 'male' ? 0.6 : 0.4;
  let waistWidth = gender === 'male' ? 0.5 : 0.35;

  const legGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
  const legL = new THREE.Mesh(legGeo, pantsMat); legL.position.set(-0.25, 0.5, 0); legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, pantsMat); legR.position.set(0.25, 0.5, 0); legR.castShadow = true;

  const torsoGeo = new THREE.CylinderGeometry(shoulderWidth, waistWidth, 1.2, 8);
  const torso = new THREE.Mesh(torsoGeo, shirtMat); torso.position.set(0, 1.6, 0); torso.castShadow = true;

  const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
  const armL = new THREE.Mesh(armGeo, skinMat); armL.position.set(-(shoulderWidth + 0.15), 1.6, 0); armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, skinMat); armR.position.set(shoulderWidth + 0.15, 1.6, 0); armR.castShadow = true;

  const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat); head.position.set(0, 2.6, 0); head.castShadow = true;

  const hairGeo = new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8);
  const hair = new THREE.Mesh(hairGeo, hairMat); hair.position.set(0, 2.62, 0); hair.castShadow = true;
  
  if (gender === 'female' && !isNPC) {
      const longHairGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const longHair = new THREE.Mesh(longHairGeo, hairMat);
      longHair.position.set(0, 2.4, -0.15);
      longHair.scale.set(1, 1.5, 1);
      longHair.castShadow = true;
      group.add(longHair);
  }

  group.add(legL, legR, torso, armL, armR, head, hair);
  group.userData = { name, isNPC, legL, legR, armL, armR, torsoMat: shirtMat };
  return group;
}

// Personaje
let sim = createHumanCharacter('Sim', '#ffdfc4', '#6d4c41', '#e8a87c', 'female');
sim.position.set(0, 0.2, 2);
scene.add(sim);

const npc = createHumanCharacter('Pufi', '#f0c8a0', '#6d4c41', '#b19cd9', 'male', true);
npc.position.set(-3, 0.2, -2);
scene.add(npc);

// Setări
let selectedGender = 'female';
let selectedSkin = '#ffdfc4';
let selectedHair = '#6d4c41';
let selectedShirt = '#e8a87c';
let gameStarted = false;

// --- LOGICA CREATORULUI ---
document.querySelectorAll('#gender-picker .option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#gender-picker .option-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedGender = e.target.dataset.gender;
        updateSimModel();
    });
});

function setupColorPicker(pickerId, callback) {
    const picker = document.getElementById(pickerId);
    picker.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-option')) {
            picker.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
            callback(e.target.dataset.color);
            updateSimModel();
        }
    });
}

setupColorPicker('skin-picker', (color) => selectedSkin = color);
setupColorPicker('hair-picker', (color) => selectedHair = color);
setupColorPicker('shirt-picker', (color) => selectedShirt = color);

function updateSimModel() {
    if (!sim) return;
    const currentName = document.getElementById('sim-name').value || 'Sim';
    scene.remove(sim);
    sim = createHumanCharacter(currentName, selectedSkin, selectedHair, selectedShirt, selectedGender);
    sim.position.set(0, 0.2, 2);
    scene.add(sim);
}

// --- START JOC ---
document.getElementById('start-btn').addEventListener('click', () => {
  updateSimModel(); // Aplicăm ultimele setări

  document.getElementById('ui-sim-name').innerText = sim.userData.name;
  
  showScreen(null); // Ascundem toate meniurile
  document.getElementById('game-hud').style.display = 'block'; // Arătăm HUD-ul
  
  // Reset Camera
  controls.enabled = true;
  camera.position.set(15, 25, 15);
  controls.target.set(0, 2, 0);

  gameStarted = true;
});

// --- RESTUL JOCULUI ---
let needs = { foame: 100, energie: 100, igiena: 100, distractie: 100, social: 100 };
let targetPos = new THREE.Vector3(0, 0.2, 2);
let simMoving = false;
let isUsingAction = false;
let actionTimer = 0;
let currentFloor = 1;

function makeIconTexture(text) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI*2); ctx.fill();
    ctx.font = '32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    return new THREE.CanvasTexture(c);
}
const icons = { sleep: makeIconTexture('💤'), shower: makeIconTexture('💧'), eat: makeIconTexture('🍔'), fun: makeIconTexture('🎮'), talk: makeIconTexture('💬') };
const actionSprite = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff' }));
actionSprite.scale.set(1, 1, 1); actionSprite.visible = false;
scene.add(actionSprite);

const floorToggleBtn = document.getElementById('floor-toggle-btn');
floorToggleBtn.addEventListener('click', () => {
    if (currentFloor === 1) {
        currentFloor = 2; toggleFloor(1, false); toggleFloor(2, true);
        sim.position.y = 4.2; targetPos.y = 4.2;
        floorToggleBtn.innerText = "🏠 Downstairs";
    } else {
        currentFloor = 1; toggleFloor(1, true); toggleFloor(2, false);
        sim.position.y = 0.2; targetPos.y = 0.2;
        floorToggleBtn.innerText = "🏠 Upstairs";
    }
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = Date.now() / 1000;

  // Dacă suntem în Creator, rotim personajul ușor
  if (document.getElementById('creator-screen').classList.contains('active') && sim) {
      sim.rotation.y = Math.sin(time * 1.5) * 0.3; 
  }

  if (gameStarted) {
    sim.rotation.y = 0; // Reset rotație când jucăm

    needs.foame = Math.max(0, needs.foame - 0.01);
    needs.energie = Math.max(0, needs.energie - 0.008);
    needs.igiena = Math.max(0, needs.igiena - 0.005);
    needs.distractie = Math.max(0, needs.distractie - 0.015);
    needs.social = Math.max(0, needs.social - 0.01);

    const updateBar = (id, val) => {
      document.getElementById('val-' + id).innerText = Math.round(val) + '%';
      document.getElementById('bar-' + id).style.width = val + '%';
    };
    updateBar('foame', needs.foame); updateBar('energie', needs.energie);
    updateBar('igiena', needs.igiena); updateBar('distractie', needs.distractie); updateBar('social', needs.social);

    if (isUsingAction) {
        actionTimer -= delta;
        if (sim.userData.currentAction === 'energie') {
            sim.position.y = (currentFloor === 2 ? 4.6 : 0.6) + Math.sin(time * 2) * 0.1;
            sim.rotation.x = Math.PI / 2;
        } else if (sim.userData.currentAction === 'igiena') {
            sim.position.y = (currentFloor === 2 ? 4.2 : 0.2) + Math.abs(Math.sin(time * 10)) * 0.2;
        }
        if (actionTimer <= 0) {
            isUsingAction = false;
            sim.position.y = currentFloor === 2 ? 4.2 : 0.2;
            sim.rotation.x = 0;
            actionSprite.visible = false;
            document.getElementById('status-msg').innerText = "Done!";
        }
    } else if (simMoving) {
      const dir = new THREE.Vector3().subVectors(targetPos, sim.position);
      dir.y = 0;
      const dist = dir.length();
      
      if (dist > 0.2) {
        dir.normalize();
        sim.position.addScaledVector(dir, 3 * delta);
        const targetLook = sim.position.clone().add(dir);
        sim.lookAt(targetLook);
        const walkSwing = Math.sin(time * 10) * 0.5;
        sim.userData.legL.rotation.x = walkSwing; sim.userData.legR.rotation.x = -walkSwing;
        sim.userData.armL.rotation.x = -walkSwing; sim.userData.armR.rotation.x = walkSwing;
      } else {
        simMoving = false;
        sim.userData.legL.rotation.x = 0; sim.userData.legR.rotation.x = 0;
        sim.userData.armL.rotation.x = 0; sim.userData.armR.rotation.x = 0;
        if (sim.userData.nextAction) {
            isUsingAction = true;
            actionTimer = 3;
            sim.userData.currentAction = sim.userData.nextAction;
            actionSprite.material.map = icons[sim.userData.nextAction] || icons.fun;
            actionSprite.visible = true;
            if (sim.userData.nextAction === 'energie') needs.energie += 30;
            if (sim.userData.nextAction === 'igiena') needs.igiena += 30;
            if (sim.userData.nextAction === 'foame') needs.foame += 30;
            if (sim.userData.nextAction === 'distractie') needs.distractie += 30;
            if (sim.userData.nextAction === 'social') needs.social += 30;
            sim.userData.nextAction = null;
        }
      }
    }

    if (actionSprite.visible) {
        actionSprite.position.copy(sim.position);
        actionSprite.position.y += 3;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

onWindowResize();
animate();
