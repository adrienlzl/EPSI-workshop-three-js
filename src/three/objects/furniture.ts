import * as THREE from 'three';
import { woodMaterial, goldMaterial, leatherMaterial } from '@/three/materials';

export function createTable(length = 10, width = 1.5, height = 1): THREE.Group {
    const group = new THREE.Group();

    // Plateau
    const topGeo = new THREE.BoxGeometry(length, 0.1, width);
    const top = new THREE.Mesh(topGeo, woodMaterial);
    top.position.y = height;
    group.add(top);

    // Pieds
    const legGeo = new THREE.BoxGeometry(0.1, height, 0.1);
    const positions: [number, number, number][] = [
        [-length / 2 + 0.1, height / 2, -width / 2 + 0.1],
        [length / 2 - 0.1, height / 2, -width / 2 + 0.1],
        [-length / 2 + 0.1, height / 2, width / 2 - 0.1],
        [length / 2 - 0.1, height / 2, width / 2 - 0.1],
    ];
    positions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, woodMaterial);
        leg.position.set(x, y, z);
        group.add(leg);
    });

    return group;
}

export function createSecretRoomHighlight(): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(3, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffcc66,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;

    // API d'animation pulsée pour le halo
    let rafId: number | null = null;
    const baseOpacity = 0.4;
    const speed = 2.0; // pulsations par seconde
    const startTime = performance.now();

    function animatePulse() {
        const t = (performance.now() - startTime) / 1000;
        const factor = (Math.sin(t * Math.PI * 2 * speed) + 1) / 2; // [0..1]
        (mesh.material as THREE.MeshBasicMaterial).opacity = baseOpacity * (0.6 + 0.4 * factor);
        rafId = requestAnimationFrame(animatePulse);
    }

    // Expose une méthode pour activer/désactiver la pulsation
    mesh.userData.togglePulse = (enabled: boolean) => {
        if (enabled) {
            if (rafId == null) animatePulse();
        } else {
            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = null;
            (mesh.material as THREE.MeshBasicMaterial).opacity = baseOpacity;
        }
    };

    return mesh;
}

export function createFrame(width = 2, height = 1.5): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, 0.05);
    const mesh = new THREE.Mesh(geometry, goldMaterial);
    return mesh;
}

// Tables hautes (type mange-debout) pour 4 personnes : 4 tables disposées en grille
export function createHighTablesForFour(): THREE.Group {
    const group = new THREE.Group();
    const tableHeight = 1.1;
    const tableRadius = 0.5;
    const topGeo = new THREE.CylinderGeometry(tableRadius, tableRadius, 0.06, 20);
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, tableHeight, 12);

    function makeHighTable(): THREE.Group {
        const g = new THREE.Group();
        const top = new THREE.Mesh(topGeo, woodMaterial);
        top.position.y = tableHeight + 0.03;
        const leg = new THREE.Mesh(legGeo, woodMaterial);
        leg.position.y = tableHeight / 2;
        g.add(leg, top);
        return g;
    }

    const spacing = 2.0;
    const positions: [number, number][] = [
        [-spacing / 2, -spacing / 2],
        [ spacing / 2, -spacing / 2],
        [-spacing / 2,  spacing / 2],
        [ spacing / 2,  spacing / 2],
    ];
    positions.forEach(([x, z]) => {
        const t = makeHighTable();
        t.position.set(x, 0, z);
        group.add(t);
    });
    return group;
}

// Bureau simple rectangulaire
export function createOfficeDesk(length = 2, depth = 0.8, height = 0.75): THREE.Group {
    const group = new THREE.Group();
    const topGeo = new THREE.BoxGeometry(length, 0.05, depth);
    const legGeo = new THREE.BoxGeometry(0.06, height, 0.06);
    const top = new THREE.Mesh(topGeo, woodMaterial);
    top.position.y = height + 0.025;
    group.add(top);
    const legs: [number, number, number][] = [
        [-length / 2 + 0.08, height / 2, -depth / 2 + 0.08],
        [ length / 2 - 0.08, height / 2, -depth / 2 + 0.08],
        [-length / 2 + 0.08, height / 2,  depth / 2 - 0.08],
        [ length / 2 - 0.08, height / 2,  depth / 2 - 0.08],
    ];
    legs.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, woodMaterial);
        leg.position.set(x, y, z);
        group.add(leg);
    });
    return group;
}

// Baie vitrée : panneau transparent
export function createGlassBay(width = 2, height = 2): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x88aaff,
        transmission: 0.9,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

// Bloc WC avec N cellules simples (cloisons + portes symboliques)
export function createWCBlock(numStalls = 4, stallWidth = 0.9, stallDepth = 1.4, wallThickness = 0.08): THREE.Group {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1 });

    for (let i = 0; i < numStalls; i++) {
        const x = - (numStalls - 1) * stallWidth / 2 + i * stallWidth;

        // Cloisons latérales
        const sideGeo = new THREE.BoxGeometry(wallThickness, 2, stallDepth);
        const left = new THREE.Mesh(sideGeo, wallMat);
        left.position.set(x - stallWidth / 2, 1, 0);
        const right = new THREE.Mesh(sideGeo, wallMat);
        right.position.set(x + stallWidth / 2, 1, 0);

        // Fond
        const backGeo = new THREE.BoxGeometry(stallWidth, 2, wallThickness);
        const back = new THREE.Mesh(backGeo, wallMat);
        back.position.set(x, 1, -stallDepth / 2);

        // Porte symbolique (demi-hauteur)
        const doorGeo = new THREE.BoxGeometry(stallWidth * 0.9, 1.6, wallThickness / 2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(x, 0.8, stallDepth / 2);

        group.add(left, right, back, door);
    }
    return group;
}

// Ascenseur simple (cabine fermée)
export function createElevator(size = 3, height = 3): THREE.Mesh {
    const geo = new THREE.BoxGeometry(size, height, size);
    const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    return mesh;
}

// Canapé (banquette) avec dossier et accoudoirs
export function createSofa(length = 3, width = 1, height = 0.9): THREE.Group {
    const group = new THREE.Group();
    
    const seatHeight = 0.45; // Hauteur de l'assise
    const backHeight = 0.5; // Hauteur du dossier (au-dessus de l'assise)
    const seatDepth = width - 0.15; // Profondeur de l'assise
    const backThickness = 0.15; // Épaisseur du dossier
    
    // Assise (siège)
    const seatGeo = new THREE.BoxGeometry(length, 0.15, seatDepth);
    const seat = new THREE.Mesh(seatGeo, leatherMaterial);
    seat.position.y = seatHeight;
    group.add(seat);
    
    // Dossier
    const backGeo = new THREE.BoxGeometry(length, backHeight, backThickness);
    const back = new THREE.Mesh(backGeo, leatherMaterial);
    back.position.y = seatHeight + backHeight / 2;
    back.position.z = -(seatDepth / 2) + (backThickness / 2);
    group.add(back);
    
    // Base (structure sous l'assise)
    const baseGeo = new THREE.BoxGeometry(length, seatHeight - 0.05, width);
    const base = new THREE.Mesh(baseGeo, leatherMaterial);
    base.position.y = (seatHeight - 0.05) / 2;
    group.add(base);
    
    // Accoudoir gauche
    const armrestWidth = 0.12;
    const armrestGeo = new THREE.BoxGeometry(armrestWidth, height, width);
    const leftArmrest = new THREE.Mesh(armrestGeo, leatherMaterial);
    leftArmrest.position.x = -length / 2 + armrestWidth / 2;
    leftArmrest.position.y = height / 2;
    group.add(leftArmrest);
    
    // Accoudoir droit
    const rightArmrest = new THREE.Mesh(armrestGeo, leatherMaterial);
    rightArmrest.position.x = length / 2 - armrestWidth / 2;
    rightArmrest.position.y = height / 2;
    group.add(rightArmrest);
    
    return group;
}

// Bureau avec matériau personnalisé (utilisé pour les bureaux en marbre)
export function createDesk(length: number, width: number, height: number, material: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    
    // Plateau
    const topGeo = new THREE.BoxGeometry(length, 0.1, width);
    const top = new THREE.Mesh(topGeo, material);
    top.position.y = height;
    group.add(top);
    
    // Pieds
    const legGeo = new THREE.BoxGeometry(0.1, height, 0.1);
    const legPositions: [number, number, number][] = [
        [-length / 2 + 0.15, height / 2, -width / 2 + 0.15],
        [length / 2 - 0.15, height / 2, -width / 2 + 0.15],
        [-length / 2 + 0.15, height / 2, width / 2 - 0.15],
        [length / 2 - 0.15, height / 2, width / 2 - 0.15],
    ];
    
    legPositions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, woodMaterial);
        leg.position.set(x, y, z);
        group.add(leg);
    });
    
    return group;
}