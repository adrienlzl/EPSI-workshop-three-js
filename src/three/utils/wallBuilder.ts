// src/three/utils/wallBuilder.ts
import * as THREE from 'three';

export type WallSegment = {
    from: [number, number]; // [x, z]
    to: [number, number];   // [x, z]
};

export function buildWalls(
    segments: WallSegment[],
    height: number,
    thickness: number,
    material?: THREE.Material
): THREE.Group {
    const group = new THREE.Group();
    const wallMaterial = material || new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    segments.forEach(({ from, to }) => {
        const dx = to[0] - from[0];
        const dz = to[1] - from[1];
        const length = Math.sqrt(dx * dx + dz * dz);

        const wallGeometry = new THREE.BoxGeometry(length, height, thickness);
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

        // ✅ Position centrale
        const midX = (from[0] + to[0]) / 2;
        const midZ = (from[1] + to[1]) / 2;
        wallMesh.position.set(midX, height / 2, midZ);

        // ✅ Orientation
        const angle = Math.atan2(dz, dx);
        wallMesh.rotation.y = -angle;

        // ✅ Légers offsets pour éviter z-fighting
        wallMesh.position.y += 0.001;

        group.add(wallMesh);
    });

    return group;
}
