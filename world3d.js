import * as THREE from 'three';

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
        base.position.y = 3;
        base.castShadow = true; base.receiveShadow = true;
        
        const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 3, 4), new THREE.MeshStandardMaterial({ color: '#a05a5a' }));
        roof.position.y = 7.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;

        group.add(base, roof);
        group.position.set(x, 0, z);
        scene.add(group);
    }
    createNeighborHouse(-25, -15, '#ffd1b3');
    createNeighborHouse(25, -20, '#b3e0ff');
    createNeighborHouse(-30, 15, '#d9b3ff');

    // --- CASA SIM-ULUI ---
    const houseGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: '#fdfbf7' });
    const floorMat = new THREE.MeshStandardMaterial({ color: '#e8d5c4' });

    // Etaj 1
    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), floorMat);
    floor1.position.y = 0.1; floor1.receiveShadow = true;
    houseGroup.add(floor1);

    const w1_back = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 0.2), wallMat); w1_back.position.set(0, 2, -8); w1_back.castShadow = true; w1_back.receiveShadow = true;
    const w1_left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w1_left.position.set(-8, 2, 0); w1_left.castShadow = true; w1_left.receiveShadow = true;
    const w1_right = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w1_right.position.set(8, 2, 0); w1_right.castShadow = true; w1_right.receiveShadow = true;
    houseGroup.add(w1_back, w1_left, w1_right);

    // Etaj 2
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 16), floorMat);
    floor2.position.y = 4.1; floor2.castShadow = true; floor2.receiveShadow = true;
    houseGroup.add(floor2);

    const w2_back = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 0.2), wallMat); w2_back.position.set(0, 6, -8); w2_back.castShadow = true;
    const w2_left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w2_left.position.set(-8, 6, 0); w2_left.castShadow = true;
    const w2_right = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 16), wallMat); w2_right.position.set(8, 6, 0); w2_right.castShadow = true;
    const w2_inner1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallMat); w2_inner1.position.set(0, 6, -4); w2_inner1.castShadow = true;
    const w2_inner2 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMat); w2_inner2.position.set(-4, 6, 0); w2_inner2.castShadow = true;
    houseGroup.add(w2_back, w2_left, w2_right, w2_inner1, w2_inner2);

    scene.add(houseGroup);

    // --- RETURNEZ OBIECTELE PENTRU INTERACȚIUNE ---
    const interactables = [];

    function addFurniture(mesh, type, pos) {
        mesh.castShadow = true; mesh.receiveShadow = true;
        scene.add(mesh);
        interactables.push({ mesh, type, pos });
    }

    // Etaj 1 (Living)
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), new THREE.MeshStandardMaterial({ color: '#d9a0b3' }));
    sofaBase.position.set(-4, 0.6, 4);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: '#c48698' }));
    sofaBack.position.set(-4, 1.35, 5);
    addFurniture(sofaBase, 'energie', new THREE.Vector3(-4, 0, 4));
    scene.add(sofaBack);

    const tvStand = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.5), new THREE.MeshStandardMaterial({ color: '#4b5563' }));
    tvStand.position.set(4, 0.5, 4);
    const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 0.1), new THREE.MeshStandardMaterial({ color: '#1a1a1a' }));
    tvScreen.position.set(4, 1.7, 4);
    addFurniture(tvStand, 'distractie', new THREE.Vector3(4, 0, 4));
    scene.add(tvScreen);

    const fridge = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 2), new THREE.MeshStandardMaterial({ color: '#d1d5db' }));
    fridge.position.set(-6, 1.75, -6);
    addFurniture(fridge, 'foame', new THREE.Vector3(-6, 0, -6));

    // Etaj 2 (Dormitor & Baie)
    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 4.5), new THREE.MeshStandardMaterial({ color: '#8b5a2b' }));
    bedBase.position.set(-5, 4.6, -5);
    const bedMattrass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 4.2), new THREE.MeshStandardMaterial({ color: '#fff' }));
    bedMattrass.position.set(-5, 5.1, -5);
    const bedPillow = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 1), new THREE.MeshStandardMaterial({ color: '#fbcfe8' }));
    bedPillow.position.set(-5, 5.4, -6.5);
    addFurniture(bedBase, 'energie', new THREE.Vector3(-5, 4, -5));
    scene.add(bedMattrass, bedPillow);

    const showerBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.5), new THREE.MeshStandardMaterial({ color: '#bfdbfe' }));
    showerBase.position.set(5, 4.2, -5);
    const showerGlass = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.1), new THREE.MeshStandardMaterial({ color: '#fff', transparent: true, opacity: 0.3 }));
    showerGlass.position.set(5, 5.7, -3.8);
    addFurniture(showerBase, 'igiena', new THREE.Vector3(5, 4, -5));
    scene.add(showerGlass);

    return interactables;
}
