import * as THREE from 'three';
import { flameMaterial, woodMaterial } from '@/three/materials';

export function createTorch(): THREE.Group {
    const group = new THREE.Group();

    // Support mural
    const baseGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const base = new THREE.Mesh(baseGeo, woodMaterial);
    base.rotation.z = Math.PI / 2;
    base.position.set(0, 1.5, 0);
    group.add(base);

    // Tige verticale
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const pole = new THREE.Mesh(poleGeo, woodMaterial);
    pole.position.set(0, 2, 0);
    group.add(pole);

    // Flamme
    const flameGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const flame = new THREE.Mesh(flameGeo, flameMaterial);
    flame.position.set(0, 2.6, 0);
    group.add(flame);

    return group;
}
