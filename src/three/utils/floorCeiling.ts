import * as THREE from 'three';

const loader = new THREE.TextureLoader();

// Matériaux de sol avec textures
const floorMaterials = {
  woodenFloor: new THREE.MeshStandardMaterial({
    map: loader.load('/textures/floor/woodenFloor.webp'),
    roughness: 0.8,
    metalness: 0,
  }),
  timberFloor: new THREE.MeshStandardMaterial({
    map: loader.load('/textures/floor/TimberFloor.jpg'),
    roughness: 0.9,
    metalness: 0,
  }),
  marbleFloor: new THREE.MeshStandardMaterial({
    map: loader.load('/textures/floor/marbleFloor.jpg'),
    roughness: 0.3,
    metalness: 0.1,
  }),
  tiledFloor: new THREE.MeshStandardMaterial({
    map: loader.load('/textures/floor/tiledFloor.jpg'),
    roughness: 0.6,
    metalness: 0,
  }),
};

export function createFloor(width: number, length: number, type: 'woodenFloor' | 'timberFloor' | 'marbleFloor' | 'tiledFloor'): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, length);
    const material = floorMaterials[type];
    material.side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02; // Surélevé pour apparaître au-dessus du marbre
    return mesh;
}

export function createCeiling(width: number, length: number, height: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, length);
    const material = new THREE.MeshStandardMaterial({
        color: 0xf0f0e0,
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = height - 0.001;
    return mesh;
}
