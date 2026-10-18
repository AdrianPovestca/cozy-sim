import * as THREE from 'three';

let floor1Group, floor2Group;

export function buildWorld(scene) {
    // --- IARBĂ ---
    const grass = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: '#8fbc8f' })
    );
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    scene.add(grass);

    // --- CASE VECINI ---
    function createNeighborHouse(x, z, color) {
        const group = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), new THREE.MeshStandardMaterial({ color }));
        base.position.y = 3; base.castShadow = true; base.receiveShadow = true;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 3, 4), new THREE.MeshStandardMaterial({ color: '#a05a5a' }));
        roof.position.y = 7.5; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
        group.add(base, roof); group.position.set(x, 0, z); scene.add(group);
    }
    createNeighborHouse(-25, -15, '#ffd1b3');
    createNeighborHouse(25, -20, '#b3e0ff');
    createNeighborHouse(-30, 15, '#d9b3ff');

    // --- CASA SIM-ULUI ---
    const wallMat = new THREE.MeshStandardMaterial({ color: '#fdfbf7' });
    const floorMat = new THREE.MeshStandardMaterial({ color: '#e8d5c4' });

    // ETaj 1
    floor1Group = new THREE.Group();
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), floorMat);
    f1.position.y = 0.1; f1.receiveShadow = true; floor1Group.add(f1);

    const w1_back = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 0.2), wallMat); w1_back.position.set(0, 2, -8); w1_back.castShadow = true; w1_back.receiveShadow = true;
    const w1_left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w1_left.position.set(-8, 2, 0); w1_left.castShadow = true; w1_left.receiveShadow = true;
    const w1_right = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w1_right.position.set(8, 2, 0); w1_right.castShadow = true; w1_right.receiveShadow = true;
    floor1Group.add(w1_back, w1_left, w1_right);

    // Etaj 2
    floor2Group = new THREE.Group();
    const f2 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), floorMat);
    f2.position.y = 4.1; f2.castShadow = true; f2.receiveShadow = true; floor2Group.add(f2);

    const w2_back = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 0.2), wallMat); w2_back.position.set(0, 6, -8); w2_back.castShadow = true;
    const w2_left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w2_left.position.set(-8, 6, 0); w2_left.castShadow = true;
    const w2_right = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w2_right.position.set(8, 6, 0); w2_right.castShadow = true;
    const w2_inner1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallMat); w2_inner1.position.set(0, 6, -4); w2_inner1.castShadow = true;
    const w2_inner2 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMat); w2_inner2.position.set(-4, 6, 0); w2_inner2.castShadow = true;
    floor2Group.add(w2_back, w2_left, w2_right, w2_inner1, w2_inner2);

    scene.add(floor1Group);
    scene.add(floor2Group);

    // --- MOBILĂ ---
    const interactables = [];
    function addFurniture(mesh, type, pos, floor) {
        mesh.castShadow = true; mesh.receiveShadow = true;
        if (floor === 1) floor1Group.add(mesh);
        else floor2Group.add(mesh);
        interactables.push({ mesh, type, pos });
    }

    // Etaj 1
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), new THREE.MeshStandardMaterial({ color: '#d9a0b3' }));
    sofaBase.position.set(-4, 0.6, 4);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: '#c48698' }));
    sofaBack.position.set(-4, 1.35, 5);
    floor1Group.add(sofaBack);
    addFurniture(sofaBase, 'energie', new THREE.Vector3(-4, 0, 4), 1);

    const tvStand = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.5), new THREE.MeshStandardMaterial({ color: '#4b5563' }));
    tvStand.position.set(4, 0.5, 4);
    const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 0.1), new THREE.MeshStandardMaterial({ color: '#1a1a1a' }));
    tvScreen.position.set(4, 1.7, 4);
    floor1Group.add(tvScreen);
    addFurniture(tvStand, 'distractie', new THREE.Vector3(4, 0, 4), 1);

    const fridge = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 2), new THREE.MeshStandardMaterial({ color: '#d1d5db' }));
    fridge.position.set(-6, 1.75, -6);
    addFurniture(fridge, 'foame', new THREE.Vector3(-6, 0, -6), 1);

    // Etaj 2
    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 4.5), new THREE.MeshStandardMaterial({ color: '#8b5a2b' }));
    bedBase.position.set(-5, 4.6, -5);
    const bedMattrass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 4.2), new THREE.MeshStandardMaterial({ color: '#fff' }));
    bedMattrass.position.set(-5, 5.1, -5);
    const bedPillow = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 1), new THREE.MeshStandardMaterial({ color: '#fbcfe8' }));
    bedPillow.position.set(-5, 5.4, -6.5);
    floor2Group.add(bedMattrass, bedPillow);
    addFurniture(bedBase, 'energie', new THREE.Vector3(-5, 4, -5), 2);

    const showerBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.5), new THREE.MeshStandardMaterial({ color: '#bfdbfe' }));
    showerBase.position.set(5, 4.2, -5);
    const showerGlass = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.1), new THREE.MeshStandardMaterial({ color: '#fff', transparent: true, opacity: 0.3 }));
    showerGlass.position.set(5, 5.7, -3.8);
    floor2Group.add(showerGlass);
    addFurniture(showerBase, 'igiena', new THREE.Vector3(5, 4, -5), 2);

    return { interactables, floor1Group, floor2Group };
}

export function toggleFloor(floorNum, visible) {
    if (floorNum === 1) floor1Group.visible = visible;
    if (floorNum === 2) floor2Group.visible = visible;
}
