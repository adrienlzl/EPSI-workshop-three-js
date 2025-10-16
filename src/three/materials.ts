import * as THREE from 'three';

const loader = new THREE.TextureLoader();

// 🔹 Utilitaire pour configurer les textures
function setupTexture(path: string, repeatX = 2, repeatY = 2): THREE.Texture {
    const tex = loader.load(path);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
}

// 🧱 Murs en pierre
export const wallMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/castle_wall/Color.jpg', 4, 2),
    normalMap: setupTexture('/textures/castle_wall/Normal.png', 4, 2),
    roughnessMap: setupTexture('/textures/castle_wall/Roughness.jpg', 4, 2),
    roughness: 0.8,
    metalness: 0,
});

// 🪵 Bois sombre (portes, boiseries, tables)
export const woodMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/wood_dark/Color.jpg', 2, 1),
    normalMap: setupTexture('/textures/wood_dark/Normal.png', 2, 1),
    roughnessMap: setupTexture('/textures/wood_dark/Roughness.jpg', 2, 1),
    roughness: 0.9,
    metalness: 0,
});

// 🖼️ Cadres dorés vieillis
export const goldMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/gold_frame/Color.jpg', 1, 1),
    roughnessMap: setupTexture('/textures/gold_frame/Roughness.jpg', 1, 1),
    roughness: 0.6,
    metalness: 0.1,
});

// 🔥 Flamme de torche
export const flameMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc66,
    emissive: 0xff9900,
    emissiveIntensity: 1.5,
    roughness: 1,
    metalness: 0,
});

// 🏰 Mur extérieur du bâtiment
export const exteriorWallMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/wall/exteriorWall.jpg', 4, 2),
    roughness: 0.8,
    metalness: 0,
});

// 🏠 Mur intérieur du bâtiment
export const interiorWallMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/wall/interiorWall.jpg', 4, 2),
    roughness: 0.7,
    metalness: 0,
});

// 🛋️ Cuir (leather) pour canapés
export const leatherMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/object/leather.jpg', 1, 1),
    roughness: 0.6,
    metalness: 0.1,
});

// 🪨 Marbre pour bureaux
export const marbleMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/floor/marbleFloor.jpg', 1, 1),
    roughness: 0.3,
    metalness: 0.1,
});

// 🚪 Portes ouvertes extérieures
export const openDoorMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture('/textures/object/openDoor.jpg', 1, 1),
    roughness: 0.7,
    metalness: 0.1,
});