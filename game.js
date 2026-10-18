import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld } from './world3d.js';

// --- SETUP ---
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(800, 600);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#87CEEB');
scene.fog = new THREE.Fog('#87CEEB', 30, 60);

const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
camera.position.set(15, 15, 15);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 5;
controls.maxDistance = 35;

// --- LUMINI ---
const ambientLight = new THREE.AmbientLight('#fff5e6', 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight('#ffe8c4', 1.2);
sunLight.position.set(20, 30, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
scene.add(sunLight);

// --- LUMEA ---
const interactables = buildWorld(scene);

// --- PERSONAJE ---
function createHumanCharacter(name, shirtColor, isNPC) {
  const group = new THREE.Group();
  
  const skinMat = new THREE.MeshStandardMaterial({ color: '#ffdfc4' });
  const pantsMat = new THREE.MeshStandardMaterial({ color: isNPC ? '#4a5568' : '#5c6bc0' });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor });
  const hairMat = new THREE.MeshStandardMaterial({ color: '#6d4c41' });

  const legGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
  const legL = new THREE.Mesh(legGeo, pantsMat); legL.position.set(-0.25, 0.5, 0); legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, pantsMat); legR.position.set(0.25, 0.5, 0); legR.castShadow = true;

  const torsoGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
  const torso = new THREE.Mesh(torsoGeo, shirtMat); torso.position.set(0, 1.6, 0); torso.castShadow = true;

  const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
  const armL = new THREE.Mesh(armGeo, skinMat); armL.position.set(-0.6, 1.6, 0); armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, skinMat); armR.position.set(0.6, 1.6, 0); armR.castShadow = true;

  const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat); head.position.set(0, 2.6, 0); head.castShadow = true;

  const hairGeo = new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const hair = new THREE.Mesh(hairGeo, hairMat); hair.position.set(0, 2.65, 0); hair.castShadow = true;

  group.add(legL, legR, torso, armL, armR, head, hair);
  group.userData = { name, isNPC, legL, legR, armL, armR, torsoMat: shirtMat };
  return group;
}

const sim = createHumanCharacter('Sim', '#e8a87c', false);
sim.position.set(0, 0.2, 6);
scene.add(sim);

const npc = createHumanCharacter('Pufi', '#b19cd9', true);
npc.position.set(-3, 0.2, 2);
scene.add(npc);

// --- STARE JOC ---
let needs = { foame: 100, energie: 100, igiena: 100, distractie: 100, social: 100 };
let gameStarted = false;
let targetPos = new THREE.Vector3(0, 0.2, 6);
let simMoving = false;
let isUsingAction = false;
let actionTimer = 0;

// Iconițe 3D
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

// --- CREATOR ---
document.getElementById('color-picker').addEventListener('click', (e) => {
  if (e.target.classList.contains('color-option')) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    e.target.classList.add('selected');
    sim.userData.color = e.target.dataset.color;
  }
});
document.querySelector('.color-option').classList.add('selected');

document.getElementById('start-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('sim-name').value.trim();
  if (nameInput) { sim.userData.name = nameInput; document.getElementById('ui-sim-name').innerText = nameInput; }
  sim.userData.torsoMat.color.set(sim.userData.color || '#e8a87c');
  document.getElementById('creator-screen').style.display = 'none';
  gameStarted = true;
});

// --- INTERACȚIUNE ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (e) => {
  if (!gameStarted || isUsingAction) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(interactables.map(i => i.mesh));
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const objData = interactables.find(i => i.mesh === hit);
    if (objData) {
      targetPos.copy(objData.pos);
      targetPos.x += 1.5; 
      targetPos.y = objData.pos.y > 2 ? 4.2 : 0.2;
      simMoving = true;
      sim.userData.nextAction = objData.type;
      document.getElementById('status-msg').innerText = "Walking to " + objData.type;
    }
  }
});

// --- LOOP ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = Date.now() / 1000;

  if (gameStarted) {
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
            sim.position.y = 4.6 + Math.sin(time * 2) * 0.1;
            sim.rotation.x = Math.PI / 2;
        } else if (sim.userData.currentAction === 'igiena') {
            sim.position.y = 4.2 + Math.abs(Math.sin(time * 10)) * 0.2;
        }
        
        if (actionTimer <= 0) {
            isUsingAction = false;
            sim.position.y = sim.position.y > 2 ? 4.2 : 0.2;
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
        
        if (sim.position.y < 1 && targetPos.y > 2) sim.position.y = 4.2;
        else if (sim.position.y > 3 && targetPos.y < 1) sim.position.y = 0.2;

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

    if (Math.random() < 0.005) {
        npc.userData.target = new THREE.Vector3(-6 + Math.random() * 12, 0.2, -6 + Math.random() * 12);
    }
    if (npc.userData.target) {
        const dir = new THREE.Vector3().subVectors(npc.userData.target, npc.position);
        dir.y = 0;
        if (dir.length() > 0.2) {
            dir.normalize();
            npc.position.addScaledVector(dir, 1.5 * delta);
            const targetLook = npc.position.clone().add(dir);
            npc.lookAt(targetLook);
            const swing = Math.sin(time * 10) * 0.5;
            npc.userData.legL.rotation.x = swing; npc.userData.legR.rotation.x = -swing;
            npc.userData.armL.rotation.x = -swing; npc.userData.armR.rotation.x = swing;
        } else {
            npc.userData.legL.rotation.x = 0; npc.userData.legR.rotation.x = 0;
            npc.userData.armL.rotation.x = 0; npc.userData.armR.rotation.x = 0;
        }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
