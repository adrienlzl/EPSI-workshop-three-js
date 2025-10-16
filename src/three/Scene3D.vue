<template>
  <div ref="container" class="scene-container"></div>

  <!-- 🎥 Animation orbitale -->
  <div class="orbit-ui">
    <button tabindex="0" @click="toggleOrbit">Lecture / Pause</button>
  </div>

  <!-- 🐍 Salle des Secrets -->
  <button tabindex="0" class="secret-btn" @click="navigateToSecretRoom">Voir la Chambre des Secrets</button>

  <!-- 📖 Informations du projet -->
  <button tabindex="0" class="info-btn" @click="showInfoPanel = !showInfoPanel">ℹ️ À propos du projet</button>

  <!-- Debug supprimé -->

  <div v-if="showSecretPanel" class="secret-panel">
    <h2>La Chambre des Secrets</h2>
    <p>Lieu mythique caché sous le château. Réservé aux initiés. Entrée interdite aux Moldus.</p>
    <button tabindex="0" @click="showSecretPanel = false">Fermer</button>
    <label><input type="checkbox" @change="toggleHalo($event)" /> Halo doré</label>
  </div>

  <!-- 📖 Panel d'informations du projet -->
  <div v-if="showInfoPanel" class="info-panel">
    <h2>🏰 Plan 3D de Poudlard - EPSI</h2>
    <div class="info-content">
      <p><strong>Contexte du projet :</strong></p>
      <p>Ce projet a été réalisé dans le cadre d'un workshop innovant organisé par l'EPSI, où nous devions utiliser les LLM (Large Language Models) pour relever des défis créatifs et techniques.</p>
      
      <p><strong>Le défi :</strong></p>
      <p>Réaliser les plans 3D de notre école dans le style Harry Potter ! L'objectif était de générer un objet 3D des plans de Poudlard et d'y mettre en surbrillance la chambre des secrets (myDiL).</p>
      
      <p><strong>Exigences techniques :</strong></p>
      <ul>
        <li>✅ Animation du plan pour voir Poudlard sous tous ses angles</li>
        <li>✅ Bonne répartition des surfaces</li>
        <li>✅ Murs bien définis</li>
        <li>✅ Portes apparentes</li>
        <li>✅ Bonus : Bureaux et tableaux</li>
      </ul>
      
      <p><strong>Choix technologique :</strong></p>
      <p>J'ai choisi Three.js pour découvrir cette librairie 3D et progresser sur mes compétences de développement web. Une excellente occasion d'explorer le rendu 3D dans le navigateur !</p>
    </div>
    <button tabindex="0" @click="showInfoPanel = false">Fermer</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useWorldStore } from '@/stores/world';
// Imports pour construction du niveau
import { buildWalls } from '@/three/utils/wallBuilder';
import type { WallSegment } from '@/three/utils/wallBuilder';
import { createFloor } from '@/three/utils/floorCeiling';
import { exteriorWallMaterial, interiorWallMaterial, openDoorMaterial } from '@/three/materials';
import { Porte } from '@/three/objects/door';
import { createTable, createSofa } from '@/three/objects/furniture';

const container = ref<HTMLElement | null>(null);
const store = useWorldStore();

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let controls: OrbitControls;
let animationId: number;

const portes: Porte[] = [];
let secretHighlight: THREE.Mesh | null = null;
const level0Group = new THREE.Group();
const showSecretPanel = ref(false);
const showInfoPanel = ref(false);

// Niveau 0 uniquement dans cette scène

let orbitAngle = 0;
let orbitSpeed = 0.025;
let orbitActive = false;

function toggleOrbit() {
  orbitActive = !orbitActive;
  controls.enabled = !orbitActive;
  // Quand on lance Lecture, on réduit la vitesse par 2
  if (orbitActive) {
    orbitSpeed = orbitSpeed * 0.5;
  }
}

// Fonctions supprimées car non utilisées

function navigateToSecretRoom() {
  // Dimensions/centre de la Secret Room (doivent correspondre à la construction plus bas)
  const secretRoomCenterX = 7;
  const secretRoomCenterZ = -34.5;
  const secretRoomWidth = 6;   // axe X
  const secretRoomDepth = 21;  // axe Z

  // Toggle: si une surbrillance existe, on l'enlève et on quitte
  if (secretHighlight) {
    level0Group.remove(secretHighlight);
    secretHighlight = null;
    return;
  }

  // Surbrillance: un plan rouge couvrant tout le sol de la salle
  const highlightGeometry = new THREE.PlaneGeometry(secretRoomWidth, secretRoomDepth);
  const highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF0000,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  secretHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
  secretHighlight.rotation.x = -Math.PI / 2;
  // Surélever légèrement au-dessus des sols spécifiques (qui sont à 0.02)
  secretHighlight.position.set(secretRoomCenterX, 0.03, secretRoomCenterZ);
  level0Group.add(secretHighlight);

  // Navigation: placer la caméra juste au-dessus et centrée sur la salle
  controls.enabled = false;
  const from = camera.position.clone();
  // Directement au-dessus, avec un peu de hauteur pour bien voir le contour
  const to = new THREE.Vector3(secretRoomCenterX, 25, secretRoomCenterZ);
  const duration = 1200;
  const start = performance.now();

  const animateFocus = (time: number) => {
    const t = Math.min((time - start) / duration, 1);
    camera.position.lerpVectors(from, to, t);
    camera.lookAt(secretRoomCenterX, 0, secretRoomCenterZ);
    if (t < 1) requestAnimationFrame(animateFocus);
    else controls.enabled = true;
  };
  requestAnimationFrame(animateFocus);
}

function toggleHalo(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (secretHighlight && secretHighlight.userData?.togglePulse) {
    secretHighlight.userData.togglePulse(checked);
  }
}
function clearLevel0() {
  // Retirer tout le contenu du groupe niveau 0
  while (level0Group.children.length > 0) {
    const child = level0Group.children.pop()!;
    child.traverse?.((obj: THREE.Object3D) => {
      if ((obj as any).geometry) (obj as any).geometry.dispose?.();
      if ((obj as any).material) {
        const m = (obj as any).material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose?.());
        else m.dispose?.();
      }
    });
  }
}

// Tableau des salles supprimé - sera recréé plus tard

// Fonction de quadrillage supprimée

function buildLevel0FromPlan() {
  clearLevel0();
  const wallHeight = store.ceilingHeight;
  const thickness = store.wallThicknessInterior;

  // Gabarit du bâtiment (périmètre) - 20x90m avec ouvertures pour les portes
  const halfWidth = 10;   // largeur 20 m → X ∈ [-10, 10] (20 cases)
  const halfLength = 45;   // longueur 90 m → Z ∈ [-45, 45] (90 cases)
  
  // Mur d'enceinte avec ouvertures pour les portes
  const perim: WallSegment[] = [
    // Mur sud (bas)
    { from: [-halfWidth, -halfLength], to: [ halfWidth, -halfLength] },
    // Mur est (droite)
    { from: [ halfWidth, -halfLength], to: [ halfWidth,  halfLength] },
    // Mur nord (haut)
    { from: [ halfWidth,  halfLength], to: [-halfWidth,  halfLength] },
    // Mur ouest (gauche) - AVEC OUVERTURES POUR LES PORTES
    // Segment 1: du sud jusqu'à la première porte (Z=-13)
    { from: [-halfWidth, -halfLength], to: [-halfWidth, -13] },
    // Segment 2: entre les deux portes (Z=-17 à Z=-22)
    { from: [-halfWidth, -17], to: [-halfWidth, -22] },
    // Segment 3: après la deuxième porte (Z=-26 jusqu'au nord)
    { from: [-halfWidth, -26], to: [-halfWidth, halfLength] },
  ];
  level0Group.add(buildWalls(perim, wallHeight, thickness, exteriorWallMaterial));

  // ------------------------------
  // SOL EXTÉRIEUR AVEC TEXTURE GRASS
  // ------------------------------
  const grassTexture = new THREE.TextureLoader().load('/textures/floor/Grass.jpg');
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20); // Répétition de la texture
  
  const grassMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.9,
    metalness: 0,
  });
  
  // Grand plan pour le sol extérieur (200m x 200m pour couvrir largement)
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const ground = new THREE.Mesh(groundGeometry, grassMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotation pour être horizontal
  ground.position.y = -0.01; // Légèrement en dessous du sol intérieur
  level0Group.add(ground);

  // ------------------------------
  // SOL INTÉRIEUR GLOBAL EN MARBRE
  // ------------------------------
  const interiorFloor = createFloor(20, 90, 'marbleFloor');
  interiorFloor.position.set(0, 0.01, 0); // Placé à une hauteur de base
  level0Group.add(interiorFloor);

  // ------------------------------
  // SOL INTÉRIEUR - COULOIRS EN MARBRE
  // ------------------------------
  const corridorFloors = [
    // Couloir principal Est (côté droit)
    createFloor(2, 90, 'marbleFloor'),
    // Couloir principal Ouest (côté gauche)
    createFloor(2, 90, 'marbleFloor'),
    // Jonctions et autres espaces
  ];
  
  // Positionnement des sols des couloirs
  corridorFloors[0]?.position.set(9, 0, 0); // Couloir Est
  corridorFloors[1]?.position.set(-9, 0, 0); // Couloir Ouest

  corridorFloors.forEach(floor => level0Group.add(floor));

  // ------------------------------
  // QUADRILLAGE SUPPRIMÉ
  // ------------------------------

  // ------------------------------
  // Sewing Room 01 - Première salle de couture (partie gauche inférieure)
  // ------------------------------
  // Position: partie gauche inférieure du bâtiment
  // Dimensions: 9m de largeur (axe X), 16m de longueur (axe Z) - agrandi de 13 à 16
  const sewingRoom01Width = 9;   // largeur sur axe X
  const sewingRoom01Depth = 16;  // longueur sur axe Z (agrandi de 13 à 16)
  
  // NORD-OUEST = X TRÈS NÉGATIF (ouest/gauche) ET Z POSITIF (nord/haut)
  // Coin supérieur gauche = (-10, 45)
  // Centre de la salle = (-10 + 4.5, 45 - 8) = (-5.5, 37)
  const sewingRoomCenterX = -5.5;  // X NÉGATIF = OUEST (GAUCHE)
  const sewingRoomCenterZ = 37;    // Z POSITIF = NORD (HAUT)
  
  console.log('Position salle de couture:', sewingRoomCenterX, sewingRoomCenterZ);
  
  // Sol de la salle de couture 01
  const sewingRoomFloor = createFloor(sewingRoom01Width, sewingRoom01Depth, 'woodenFloor');
  sewingRoomFloor.position.set(sewingRoomCenterX, 0.02, sewingRoomCenterZ);
  level0Group.add(sewingRoomFloor);
  
  // Murs de la salle de couture 01 (Nord-Ouest, collé au mur d'enceinte)
  const sewingRoomLeft = -10;  // collé au mur ouest
  const sewingRoomRight = -10 + sewingRoom01Width;  // -10 + 9 = -1
  const sewingRoomTop = 45;    // le plus au nord possible
  const sewingRoomBottom = 45 - sewingRoom01Depth;  // 45 - 16 = 29
  
  // Position de la porte sur le mur droit (X=-1)
  const doorZ = sewingRoomBottom + 3; // 3m au-dessus du mur sud (décalé de 1m vers le nord)
  const doorWidth = 1.0; // Largeur de la porte
  
  const sewingRoomWalls: WallSegment[] = [
    // Mur gauche (extérieur)
    { from: [sewingRoomLeft, sewingRoomTop], to: [sewingRoomLeft, sewingRoomBottom] },
    // Mur droit (intérieur) - AVEC OUVERTURE POUR LA PORTE
    // Segment avant la porte
    { from: [sewingRoomRight, sewingRoomTop], to: [sewingRoomRight, doorZ + doorWidth/2] },
    // Segment après la porte
    { from: [sewingRoomRight, doorZ - doorWidth/2], to: [sewingRoomRight, sewingRoomBottom] },
    // Mur haut (extérieur)
    { from: [sewingRoomLeft, sewingRoomTop], to: [sewingRoomRight, sewingRoomTop] },
    // Mur bas (intérieur)
    { from: [sewingRoomLeft, sewingRoomBottom], to: [sewingRoomRight, sewingRoomBottom] }
  ];
  level0Group.add(buildWalls(sewingRoomWalls, wallHeight, thickness, interiorWallMaterial));

  // Porte de Sewing Room 01
  // Position : sur le mur droit (X=-1), vers le bas (proche du mur sud)
  const sewingRoom01Door = new Porte({
    position: new THREE.Vector3(sewingRoomRight, 0, doorZ), // X=-1, Z=31
    width: doorWidth,
    height: 2.5,
    direction: 'right',
    orientation: 'vertical' // Porte sur mur vertical (parallèle à Z)
  });
  level0Group.add(sewingRoom01Door.getMesh());
  portes.push(sewingRoom01Door);

  // Tableau sur le mur nord de Sewing Room 01
  const boardTexture = new THREE.TextureLoader().load('/textures/object/board.jpg');
  const boardMaterial = new THREE.MeshStandardMaterial({
    map: boardTexture,
    roughness: 0.8,
    metalness: 0,
  });
  const boardGeometry = new THREE.BoxGeometry(4, 2, 0.1); // 4m de large, 2m de haut, 10cm d'épaisseur
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  // Position : centre du mur nord (X au centre de la salle, Z au mur nord, Y à hauteur des yeux)
  board.position.set(sewingRoomCenterX, 1.8, sewingRoomTop - 0.3); // Décalé de 30cm vers l'intérieur de la salle
  level0Group.add(board);

  // Tables en bois sombre pour Sewing Room 01
  const tableWoodTexture = new THREE.TextureLoader().load('/textures/wood_dark/Color.jpg');
  const tableWoodNormal = new THREE.TextureLoader().load('/textures/wood_dark/Normal.png');
  const tableWoodRoughness = new THREE.TextureLoader().load('/textures/wood_dark/Roughness.jpg');
  const tableMaterial = new THREE.MeshStandardMaterial({
    map: tableWoodTexture,
    normalMap: tableWoodNormal,
    roughnessMap: tableWoodRoughness,
    roughness: 0.7,
    metalness: 0,
  });

  // Dimensions d'une table pour 2 personnes
  const tableWidth = 2.4;  // largeur (doublée - plus longue)
  const tableDepth = 0.8;  // profondeur
  const tableHeight = 0.75; // hauteur
  const tableThickness = 0.05; // épaisseur du plateau

  // Disposition : 2 rangées avec espace de circulation au milieu
  const numRows = 6; // 6 rangées de tables
  const spacingZ = 2.2; // espacement entre les rangées (en Z)
  const startZ = sewingRoomTop - 3; // commencer à 3m du mur nord (laisser de l'espace devant le tableau)
  const leftX = sewingRoomCenterX - 2; // rangée de gauche
  const rightX = sewingRoomCenterX + 2; // rangée de droite (espace de 4m au milieu)

  for (let i = 0; i < numRows; i++) {
    const z = startZ - i * spacingZ;
    
    // Vérifier qu'on ne dépasse pas le mur sud
    if (z < sewingRoomBottom + 1) break;

    // Table de gauche
    const tableLeftGroup = new THREE.Group();
    
    // Plateau
    const topLeft = new THREE.Mesh(
      new THREE.BoxGeometry(tableWidth, tableThickness, tableDepth),
      tableMaterial
    );
    topLeft.position.y = tableHeight;
    tableLeftGroup.add(topLeft);
    
    // Pieds (4 pieds)
    const legGeometry = new THREE.BoxGeometry(0.08, tableHeight, 0.08);
    const legPositions: [number, number, number][] = [
      [-tableWidth/2 + 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [tableWidth/2 - 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [-tableWidth/2 + 0.1, tableHeight/2, tableDepth/2 - 0.1],
      [tableWidth/2 - 0.1, tableHeight/2, tableDepth/2 - 0.1]
    ];
    
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeometry, tableMaterial);
      leg.position.set(x, y, z);
      tableLeftGroup.add(leg);
    });
    
    tableLeftGroup.position.set(leftX, 0, z);
    level0Group.add(tableLeftGroup);

    // Table de droite (copie de la table de gauche)
    const tableRightGroup = tableLeftGroup.clone();
    tableRightGroup.position.set(rightX, 0, z);
    level0Group.add(tableRightGroup);
  }

  // Fenêtres sur le mur ouest (extérieur) de Sewing Room 01
  const windowTexture = new THREE.TextureLoader().load('/textures/object/windowYellow.jpg');
  const windowMaterial = new THREE.MeshStandardMaterial({
    map: windowTexture,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95,
  });

  // Dimensions des fenêtres
  const windowWidth = 1.5;  // largeur
  const windowHeight = 2;   // hauteur
  const windowThickness = 0.1; // épaisseur

  // Position des 2 fenêtres sur le mur ouest (X=-10)
  const windowY = 1.8; // hauteur du centre de la fenêtre
  const windowPositions = [
    sewingRoomTop - 4,           // Fenêtre 1 (nord)
    sewingRoomTop - 8            // Fenêtre 2 (milieu)
  ];

  windowPositions.forEach(windowZ => {
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth),
      windowMaterial
    );
    window.position.set(sewingRoomLeft + 0.15, windowY, windowZ); // Légèrement décalé du mur vers l'intérieur
    level0Group.add(window);
  });

  // ------------------------------
  // Sewing Room 02 - Deuxième salle de couture (coin Nord-Est)
  // ------------------------------
  const sewingRoom02Width = 9;   // largeur sur axe X
  const sewingRoom02Depth = 13;  // longueur sur axe Z (reste à 13)
  
  // NORD-EST = X POSITIF (est/droite) ET Z POSITIF (nord/haut)
  // Coin supérieur droit = (10, 45)
  // Centre de la salle de 9m x 13m = (10 - 4.5, 45 - 6.5) = (5.5, 38.5)
  const sewingRoom2CenterX = 5.5;   // X POSITIF = EST (DROITE)
  const sewingRoom2CenterZ = 38.5;  // Z POSITIF = NORD (HAUT)
  
  console.log('Position salle de couture 2:', sewingRoom2CenterX, sewingRoom2CenterZ);
  
  // Sol de la salle de couture 2
  const sewingRoom2Floor = createFloor(sewingRoom02Width, sewingRoom02Depth, 'woodenFloor');
  sewingRoom2Floor.position.set(sewingRoom2CenterX, 0.02, sewingRoom2CenterZ);
  level0Group.add(sewingRoom2Floor);
  
  // Murs de la salle de couture 2 (Nord-Est, collé au mur d'enceinte)
  const sewingRoom2Left = 10 - sewingRoom02Width;  // 10 - 9 = 1
  const sewingRoom2Right = 10;  // collé au mur est
  const sewingRoom2Top = 45;    // le plus au nord possible
  const sewingRoom2Bottom = 45 - sewingRoom02Depth;  // 45 - 13 = 32
  
  // Position de la porte sur le mur sud (bas), juste après le mur commun avec Classroom 03
  const door2Width = 1.0;
  
  const sewingRoom2Walls: WallSegment[] = [
    // Mur gauche (intérieur)
    { from: [sewingRoom2Left, sewingRoom2Top], to: [sewingRoom2Left, sewingRoom2Bottom] },
    // Mur droit (extérieur)
    { from: [sewingRoom2Right, sewingRoom2Top], to: [sewingRoom2Right, sewingRoom2Bottom] },
    // Mur haut (extérieur)
    { from: [sewingRoom2Left, sewingRoom2Top], to: [sewingRoom2Right, sewingRoom2Top] },
    // Mur bas (intérieur) - AVEC OUVERTURE POUR LA PORTE
    // Segment avant la porte
    { from: [sewingRoom2Left, sewingRoom2Bottom], to: [sewingRoom2Left + 3, sewingRoom2Bottom] },
    // Segment après la porte
    { from: [sewingRoom2Left + 4, sewingRoom2Bottom], to: [sewingRoom2Right, sewingRoom2Bottom] }
  ];
  level0Group.add(buildWalls(sewingRoom2Walls, wallHeight, thickness, interiorWallMaterial));

  // Porte de Sewing Room 02
  const sewingRoom02Door = new Porte({
    position: new THREE.Vector3(sewingRoom2Left + 3.5, 0, sewingRoom2Bottom),
    width: door2Width,
    height: 2.5,
    direction: 'right',
    orientation: 'horizontal'
  });
  level0Group.add(sewingRoom02Door.getMesh());
  portes.push(sewingRoom02Door);

  // Tableau sur le mur nord (opposé à la porte)
  const board2 = new THREE.Mesh(boardGeometry, boardMaterial);
  board2.position.set(sewingRoom2CenterX, 1.8, sewingRoom2Top - 0.3);
  level0Group.add(board2);

  // Tables face au tableau
  const legGeometry2 = new THREE.BoxGeometry(0.08, tableHeight, 0.08);
  
  for (let i = 0; i < 5; i++) {
    const z = sewingRoom2Top - 3 - i * spacingZ;
    if (z < sewingRoom2Bottom + 1) break;

    const tableLeft2 = new THREE.Group();
    const topLeft2 = new THREE.Mesh(
      new THREE.BoxGeometry(tableWidth, tableThickness, tableDepth),
      tableMaterial
    );
    topLeft2.position.y = tableHeight;
    tableLeft2.add(topLeft2);

    const legPositions2: [number, number, number][] = [
      [-tableWidth/2 + 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [tableWidth/2 - 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [-tableWidth/2 + 0.1, tableHeight/2, tableDepth/2 - 0.1],
      [tableWidth/2 - 0.1, tableHeight/2, tableDepth/2 - 0.1]
    ];

    legPositions2.forEach(([x, y, z]) => {
      const leg2 = new THREE.Mesh(legGeometry2, tableMaterial);
      leg2.position.set(x, y, z);
      tableLeft2.add(leg2);
    });

    tableLeft2.position.set(sewingRoom2CenterX - 2, 0, z);
    level0Group.add(tableLeft2);

    const tableRight2 = tableLeft2.clone();
    tableRight2.position.set(sewingRoom2CenterX + 2, 0, z);
    level0Group.add(tableRight2);
  }

  // Fenêtres sur le mur est (extérieur)
  const window2Positions = [
    sewingRoom2Top - 4,
    sewingRoom2Top - 8
  ];

  window2Positions.forEach(wZ => {
    const window2 = new THREE.Mesh(
      new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth),
      windowMaterial
    );
    window2.position.set(sewingRoom2Right - 0.15, windowY, wZ);
    level0Group.add(window2);
  });

  // ------------------------------
  // Classroom 03 - Collée à Sewing Room 02, au sud
  // ------------------------------
  // Position : collée au mur Est, au sud de Sewing Room 02
  // Sewing Room 02 va de Z=32 à Z=45
  // Classroom 03 commence à Z=32 et descend de 9m
  const classroom03Width = 5;   // largeur sur axe X
  const classroom03Depth = 9;   // longueur sur axe Z
  
  // Position : collée au mur est (X=10), au sud de Room 02 (Z=32)
  // Coin supérieur droit = (10, 32)
  // Centre = (10 - 2.5, 32 - 4.5) = (7.5, 27.5)
  const classroom03CenterX = 7.5;   // X POSITIF = EST
  const classroom03CenterZ = 27.5;  // Z POSITIF mais plus bas que Room 02
  
  console.log('Position Classroom 03:', classroom03CenterX, classroom03CenterZ);
  
  // Sol de la Classroom 03
  const classroom03Floor = createFloor(classroom03Width, classroom03Depth, 'woodenFloor');
  classroom03Floor.position.set(classroom03CenterX, 0.02, classroom03CenterZ);
  level0Group.add(classroom03Floor);
  
  // Murs de la Classroom 03
  const classroom03Left = 10 - classroom03Width;  // 10 - 5 = 5
  const classroom03Right = 10;  // collé au mur est
  const classroom03Top = 32;    // collé au sud de Room 02
  const classroom03Bottom = 32 - classroom03Depth;  // 32 - 9 = 23
  
  // Position de la porte sur le mur gauche (intérieur), en bas
  const door3Width = 1.0;
  const door3Z = classroom03Bottom + 2; // 2m au-dessus du mur sud
  
  const classroom03Walls: WallSegment[] = [
    // Mur gauche (intérieur) - AVEC OUVERTURE POUR LA PORTE
    // Segment avant la porte
    { from: [classroom03Left, classroom03Top], to: [classroom03Left, door3Z + door3Width/2] },
    // Segment après la porte
    { from: [classroom03Left, door3Z - door3Width/2], to: [classroom03Left, classroom03Bottom] },
    // Mur droit (extérieur)
    { from: [classroom03Right, classroom03Top], to: [classroom03Right, classroom03Bottom] },
    // Mur haut (intérieur - partagé avec Room 02)
    { from: [classroom03Left, classroom03Top], to: [classroom03Right, classroom03Top] },
    // Mur bas (intérieur)
    { from: [classroom03Left, classroom03Bottom], to: [classroom03Right, classroom03Bottom] }
  ];
  level0Group.add(buildWalls(classroom03Walls, wallHeight, thickness, interiorWallMaterial));

  // Porte de Classroom 03
  const classroom03Door = new Porte({
    position: new THREE.Vector3(classroom03Left, 0, door3Z),
    width: door3Width,
    height: 2.5,
    direction: 'left',
    orientation: 'vertical'
  });
  level0Group.add(classroom03Door.getMesh());
  portes.push(classroom03Door);

  // Tableau sur le mur nord
  const board3 = new THREE.Mesh(boardGeometry, boardMaterial);
  board3.position.set(classroom03CenterX, 1.8, classroom03Top - 0.3);
  level0Group.add(board3);

  // Tables face au tableau (plus petites pour s'adapter à la salle)
  const legGeometry3 = new THREE.BoxGeometry(0.08, tableHeight, 0.08);
  const smallTableWidth = 1.8; // Tables plus petites pour cette salle
  
  for (let i = 0; i < 3; i++) {
    const z = classroom03Top - 2 - i * 2.5;
    if (z < classroom03Bottom + 1) break;

    const tableLeft3 = new THREE.Group();
    const topLeft3 = new THREE.Mesh(
      new THREE.BoxGeometry(smallTableWidth, tableThickness, tableDepth),
      tableMaterial
    );
    topLeft3.position.y = tableHeight;
    tableLeft3.add(topLeft3);

    const legPositions3: [number, number, number][] = [
      [-smallTableWidth/2 + 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [smallTableWidth/2 - 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [-smallTableWidth/2 + 0.1, tableHeight/2, tableDepth/2 - 0.1],
      [smallTableWidth/2 - 0.1, tableHeight/2, tableDepth/2 - 0.1]
    ];

    legPositions3.forEach(([x, y, z]) => {
      const leg3 = new THREE.Mesh(legGeometry3, tableMaterial);
      leg3.position.set(x, y, z);
      tableLeft3.add(leg3);
    });

    tableLeft3.position.set(classroom03CenterX - 0.8, 0, z);
    level0Group.add(tableLeft3);

    const tableRight3 = tableLeft3.clone();
    tableRight3.position.set(classroom03CenterX + 0.8, 0, z);
    level0Group.add(tableRight3);
  }

  // Fenêtres sur le mur est (extérieur)
  const window3Position = classroom03Top - 4;
  const window3 = new THREE.Mesh(
    new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth),
    windowMaterial
  );
  window3.position.set(classroom03Right - 0.15, windowY, window3Position);
  level0Group.add(window3);

  // ------------------------------
  // WC Men - Collé à Classroom 03, au sud
  // ------------------------------
  const wcWidth = 5;   // largeur sur axe X
  const wcDepth = 9;   // longueur sur axe Z
  
  // Position : collée au mur est (X=10), au sud de Classroom 03 (Z=23)
  // Coin supérieur droit = (10, 23)
  // Centre = (10 - 2.5, 23 - 4.5) = (7.5, 18.5)
  const wcMenCenterX = 7.5;
  const wcMenCenterZ = 18.5;
  
  console.log('Position WC Men:', wcMenCenterX, wcMenCenterZ);
  
  // Sol du WC Hommes avec texture carrelée
  const wcMenFloor = createFloor(wcWidth, wcDepth, 'tiledFloor');
  wcMenFloor.position.set(wcMenCenterX, 0.02, wcMenCenterZ);
  level0Group.add(wcMenFloor);
  
  // Murs du WC Hommes
  const wcMenLeft = 10 - wcWidth;  // 10 - 5 = 5
  const wcMenRight = 10;
  const wcMenTop = 23;    // collé au sud de Classroom 03
  const wcMenBottom = 23 - wcDepth;  // 23 - 9 = 14
  
  const wcMenWalls: WallSegment[] = [
    { from: [wcMenLeft, wcMenTop], to: [wcMenLeft, wcMenBottom] },
    { from: [wcMenRight, wcMenTop], to: [wcMenRight, wcMenBottom] },
    { from: [wcMenLeft, wcMenTop], to: [wcMenRight, wcMenTop] },
    { from: [wcMenLeft, wcMenBottom], to: [wcMenRight, wcMenBottom] }
  ];
  level0Group.add(buildWalls(wcMenWalls, wallHeight, thickness, interiorWallMaterial));

  // ------------------------------
  // WC Women - Collé au WC Men, au sud
  // ------------------------------
  // Position : collée au mur est (X=10), au sud du WC Men (Z=14)
  // Coin supérieur droit = (10, 14)
  // Centre = (10 - 2.5, 14 - 4.5) = (7.5, 9.5)
  const wcWomenCenterX = 7.5;
  const wcWomenCenterZ = 9.5;
  
  console.log('Position WC Women:', wcWomenCenterX, wcWomenCenterZ);
  
  // Sol du WC Femmes avec texture carrelée
  const wcWomenFloor = createFloor(wcWidth, wcDepth, 'tiledFloor');
  wcWomenFloor.position.set(wcWomenCenterX, 0.02, wcWomenCenterZ);
  level0Group.add(wcWomenFloor);
  
  // Murs du WC Femmes
  const wcWomenLeft = 10 - wcWidth;  // 10 - 5 = 5
  const wcWomenRight = 10;
  const wcWomenTop = 14;    // collé au sud du WC Men
  const wcWomenBottom = 14 - wcDepth;  // 14 - 9 = 5
  
  const wcWomenWalls: WallSegment[] = [
    { from: [wcWomenLeft, wcWomenTop], to: [wcWomenLeft, wcWomenBottom] },
    { from: [wcWomenRight, wcWomenTop], to: [wcWomenRight, wcWomenBottom] },
    { from: [wcWomenLeft, wcWomenTop], to: [wcWomenRight, wcWomenTop] },
    { from: [wcWomenLeft, wcWomenBottom], to: [wcWomenRight, wcWomenBottom] }
  ];
  level0Group.add(buildWalls(wcWomenWalls, wallHeight, thickness, interiorWallMaterial));

  // ------------------------------
  // Empty Room 01 - Collée au WC Women, au sud
  // ------------------------------
  const emptyRoom01Width = 5;   // largeur sur axe X
  const emptyRoom01Depth = 4;   // longueur sur axe Z
  
  // Position : collée au mur est (X=10), au sud du WC Women (Z=5)
  // Coin supérieur droit = (10, 5)
  // Centre = (10 - 2.5, 5 - 2) = (7.5, 3)
  const emptyRoom01CenterX = 7.5;
  const emptyRoom01CenterZ = 3;
  
  console.log('Position Empty Room 01:', emptyRoom01CenterX, emptyRoom01CenterZ);
  
  // Sol de l'Empty Room 01
  const emptyRoom01Floor = createFloor(emptyRoom01Width, emptyRoom01Depth, 'woodenFloor');
  emptyRoom01Floor.position.set(emptyRoom01CenterX, 0.02, emptyRoom01CenterZ);
  level0Group.add(emptyRoom01Floor);
  
  // Murs de l'Empty Room 01
  const emptyRoom01Left = 10 - emptyRoom01Width;  // 10 - 5 = 5
  const emptyRoom01Right = 10;
  const emptyRoom01Top = 5;    // collé au sud du WC Women
  const emptyRoom01Bottom = 5 - emptyRoom01Depth;  // 5 - 4 = 1
  
  // Position de la porte sur le mur gauche, à 1m de la bordure droite
  const doorEmpty01Width = 1.0;
  const doorEmpty01Z = emptyRoom01Bottom + 1; // À 1m du bas (bordure droite en regardant le mur)
  
  const emptyRoom01Walls: WallSegment[] = [
    // Mur gauche (intérieur) - AVEC OUVERTURE POUR LA PORTE
    { from: [emptyRoom01Left, emptyRoom01Top], to: [emptyRoom01Left, doorEmpty01Z + doorEmpty01Width/2] },
    { from: [emptyRoom01Left, doorEmpty01Z - doorEmpty01Width/2], to: [emptyRoom01Left, emptyRoom01Bottom] },
    // Mur droit (extérieur)
    { from: [emptyRoom01Right, emptyRoom01Top], to: [emptyRoom01Right, emptyRoom01Bottom] },
    // Mur haut (intérieur)
    { from: [emptyRoom01Left, emptyRoom01Top], to: [emptyRoom01Right, emptyRoom01Top] },
    // Mur bas (intérieur)
    { from: [emptyRoom01Left, emptyRoom01Bottom], to: [emptyRoom01Right, emptyRoom01Bottom] }
  ];
  level0Group.add(buildWalls(emptyRoom01Walls, wallHeight, thickness, interiorWallMaterial));

  // Porte de Empty Room 01
  const emptyRoom01Door = new Porte({
    position: new THREE.Vector3(emptyRoom01Left, 0, doorEmpty01Z),
    width: doorEmpty01Width,
    height: 2.5,
    direction: 'left',
    orientation: 'vertical'
  });
  level0Group.add(emptyRoom01Door.getMesh());
  portes.push(emptyRoom01Door);

  // ------------------------------
  // Classroom 04 - Collée à Empty Room 01, au sud
  // ------------------------------
  const classroom04Width = 6;   // largeur sur axe X
  const classroom04Depth = 13;  // longueur sur axe Z
  
  // Position : collée au mur est (X=10), au sud de Empty Room 01 (Z=1)
  // Coin supérieur droit = (10, 1)
  // Centre = (10 - 3, 1 - 6.5) = (7, -5.5)
  const classroom04CenterX = 7;
  const classroom04CenterZ = -5.5;
  
  console.log('Position Classroom 04:', classroom04CenterX, classroom04CenterZ);
  
  // Sol de la Classroom 04
  const classroom04Floor = createFloor(classroom04Width, classroom04Depth, 'woodenFloor');
  classroom04Floor.position.set(classroom04CenterX, 0.02, classroom04CenterZ);
  level0Group.add(classroom04Floor);
  
  // Murs de la Classroom 04
  const classroom04Left = 10 - classroom04Width;  // 10 - 6 = 4
  const classroom04Right = 10;
  const classroom04Top = 1;    // collé au sud de Empty Room 01
  const classroom04Bottom = 1 - classroom04Depth;  // 1 - 13 = -12
  
  // Position de la porte sur le mur gauche (intérieur), en bas
  const door4Width = 1.0;
  const door4Z = classroom04Bottom + 2;
  
  const classroom04Walls: WallSegment[] = [
    // Mur gauche (intérieur) - AVEC OUVERTURE POUR LA PORTE
    { from: [classroom04Left, classroom04Top], to: [classroom04Left, door4Z + door4Width/2] },
    { from: [classroom04Left, door4Z - door4Width/2], to: [classroom04Left, classroom04Bottom] },
    // Mur droit (extérieur)
    { from: [classroom04Right, classroom04Top], to: [classroom04Right, classroom04Bottom] },
    // Mur haut (intérieur)
    { from: [classroom04Left, classroom04Top], to: [classroom04Right, classroom04Top] },
    // Mur bas (intérieur)
    { from: [classroom04Left, classroom04Bottom], to: [classroom04Right, classroom04Bottom] }
  ];
  level0Group.add(buildWalls(classroom04Walls, wallHeight, thickness, interiorWallMaterial));

  // Porte de Classroom 04
  const classroom04Door = new Porte({
    position: new THREE.Vector3(classroom04Left, 0, door4Z),
    width: door4Width,
    height: 2.5,
    direction: 'left',
    orientation: 'vertical'
  });
  level0Group.add(classroom04Door.getMesh());
  portes.push(classroom04Door);

  // Tableau sur le mur nord
  const board4 = new THREE.Mesh(boardGeometry, boardMaterial);
  board4.position.set(classroom04CenterX, 1.8, classroom04Top - 0.3);
  level0Group.add(board4);

  // Tables face au tableau
  const legGeometry4 = new THREE.BoxGeometry(0.08, tableHeight, 0.08);
  const mediumTableWidth = 2.0;
  
  for (let i = 0; i < 4; i++) {
    const z = classroom04Top - 2 - i * 2.5;
    if (z < classroom04Bottom + 1) break;

    const tableLeft4 = new THREE.Group();
    const topLeft4 = new THREE.Mesh(
      new THREE.BoxGeometry(mediumTableWidth, tableThickness, tableDepth),
      tableMaterial
    );
    topLeft4.position.y = tableHeight;
    tableLeft4.add(topLeft4);

    const legPositions4: [number, number, number][] = [
      [-mediumTableWidth/2 + 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [mediumTableWidth/2 - 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [-mediumTableWidth/2 + 0.1, tableHeight/2, tableDepth/2 - 0.1],
      [mediumTableWidth/2 - 0.1, tableHeight/2, tableDepth/2 - 0.1]
    ];

    legPositions4.forEach(([x, y, z]) => {
      const leg4 = new THREE.Mesh(legGeometry4, tableMaterial);
      leg4.position.set(x, y, z);
      tableLeft4.add(leg4);
    });

    tableLeft4.position.set(classroom04CenterX - 1.2, 0, z);
    level0Group.add(tableLeft4);

    const tableRight4 = tableLeft4.clone();
    tableRight4.position.set(classroom04CenterX + 1.2, 0, z);
    level0Group.add(tableRight4);
  }

  // Fenêtres sur le mur est (extérieur)
  const window4Positions = [
    classroom04Top - 4,
    classroom04Top - 8
  ];

  window4Positions.forEach(wZ => {
    const window4 = new THREE.Mesh(
      new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth),
      windowMaterial
    );
    window4.position.set(classroom04Right - 0.15, windowY, wZ);
    level0Group.add(window4);
  });

  // ------------------------------
  // Cleaning Room (Local de ménage) - Collée à Classroom 04, au sud
  // ------------------------------
  const cleaningRoomWidth = 6;   // largeur sur axe X
  const cleaningRoomDepth = 12;  // longueur sur axe Z (agrandi de 11 à 12)
  
  // Position : collée au mur est (X=10), au sud de Classroom 04 (Z=-12)
  // Coin supérieur droit = (10, -12)
  // Centre = (10 - 3, -12 - 6) = (7, -18)
  const cleaningRoomCenterX = 7;
  const cleaningRoomCenterZ = -18;
  
  console.log('Position Cleaning Room:', cleaningRoomCenterX, cleaningRoomCenterZ);
  
  // Sol du local de ménage
  const cleaningRoomFloor = createFloor(cleaningRoomWidth, cleaningRoomDepth, 'woodenFloor');
  cleaningRoomFloor.position.set(cleaningRoomCenterX, 0.02, cleaningRoomCenterZ);
  level0Group.add(cleaningRoomFloor);
  
  // Murs du local de ménage
  const cleaningRoomLeft = 10 - cleaningRoomWidth;  // 10 - 6 = 4
  const cleaningRoomRight = 10;
  const cleaningRoomTop = -12;    // collé au sud de Classroom 04
  const cleaningRoomBottom = -12 - cleaningRoomDepth;  // -12 - 12 = -24
  
  // Position de la porte sur le mur gauche, à 1m de la bordure droite (bas)
  const doorCleaningWidth = 1.0;
  const doorCleaningZ = cleaningRoomBottom + 1; // À 1m du bas
  
  const cleaningRoomWalls: WallSegment[] = [
    // Mur gauche (intérieur) - AVEC OUVERTURE POUR LA PORTE
    { from: [cleaningRoomLeft, cleaningRoomTop], to: [cleaningRoomLeft, doorCleaningZ + doorCleaningWidth/2] },
    { from: [cleaningRoomLeft, doorCleaningZ - doorCleaningWidth/2], to: [cleaningRoomLeft, cleaningRoomBottom] },
    // Mur droit (extérieur)
    { from: [cleaningRoomRight, cleaningRoomTop], to: [cleaningRoomRight, cleaningRoomBottom] },
    // Mur haut (intérieur)
    { from: [cleaningRoomLeft, cleaningRoomTop], to: [cleaningRoomRight, cleaningRoomTop] },
    // Mur bas (intérieur)
    { from: [cleaningRoomLeft, cleaningRoomBottom], to: [cleaningRoomRight, cleaningRoomBottom] }
  ];
  level0Group.add(buildWalls(cleaningRoomWalls, wallHeight, thickness, interiorWallMaterial));

  // Porte du local de ménage
  const cleaningRoomDoor = new Porte({
    position: new THREE.Vector3(cleaningRoomLeft, 0, doorCleaningZ),
    width: doorCleaningWidth,
    height: 2.5,
    direction: 'left',
    orientation: 'vertical'
  });
  level0Group.add(cleaningRoomDoor.getMesh());
  portes.push(cleaningRoomDoor);

  // ------------------------------
  // Secret Room (Salle des secrets) - Collée au Cleaning Room, au sud
  // ------------------------------
  const secretRoomWidth = 6;   // largeur sur axe X
  const secretRoomDepth = 21;  // longueur sur axe Z
  
  // Position : collée au mur est (X=10), au sud du Cleaning Room (Z=-24)
  // Coin supérieur droit = (10, -24)
  // Centre = (10 - 3, -24 - 10.5) = (7, -34.5)
  const secretRoomCenterX = 7;
  const secretRoomCenterZ = -34.5;
  
  console.log('Position Secret Room:', secretRoomCenterX, secretRoomCenterZ);
  
  // Sol de la salle des secrets avec texture spéciale
  const secretRoomFloor = createFloor(secretRoomWidth, secretRoomDepth, 'timberFloor');
  secretRoomFloor.position.set(secretRoomCenterX, 0.02, secretRoomCenterZ);
  level0Group.add(secretRoomFloor);
  
  // Murs de la salle des secrets
  const secretRoomLeft = 10 - secretRoomWidth;  // 10 - 6 = 4
  const secretRoomRight = 10;
  const secretRoomTop = -24;    // collé au sud du Cleaning Room
  const secretRoomBottom = -24 - secretRoomDepth;  // -24 - 21 = -45
  
  // Position de la double porte sur le mur gauche, à 3m du bas vers le nord
  const doorSecretWidth = 2.0; // Double porte
  const doorSecretZ = secretRoomBottom + 3; // 3m du bas vers le nord
  
  const secretRoomWalls: WallSegment[] = [
    // Mur gauche (intérieur) - AVEC OUVERTURE POUR LA DOUBLE PORTE
    { from: [secretRoomLeft, secretRoomTop], to: [secretRoomLeft, doorSecretZ + doorSecretWidth/2] },
    { from: [secretRoomLeft, doorSecretZ - doorSecretWidth/2], to: [secretRoomLeft, secretRoomBottom] },
    // Mur droit (extérieur)
    { from: [secretRoomRight, secretRoomTop], to: [secretRoomRight, secretRoomBottom] },
    // Mur haut (intérieur)
    { from: [secretRoomLeft, secretRoomTop], to: [secretRoomRight, secretRoomTop] },
    // Mur bas (intérieur)
    { from: [secretRoomLeft, secretRoomBottom], to: [secretRoomRight, secretRoomBottom] }
  ];
  level0Group.add(buildWalls(secretRoomWalls, wallHeight, thickness, interiorWallMaterial));

  // Double porte de la salle des secrets
  const doubleDoorTexture = new THREE.TextureLoader().load('/textures/object/doubleDoor.jpg');
  const doubleDoorMaterial = new THREE.MeshStandardMaterial({
    map: doubleDoorTexture,
    roughness: 0.7,
    metalness: 0.1,
  });
  
  const secretRoomDoor = new Porte({
    position: new THREE.Vector3(secretRoomLeft, 0, doorSecretZ),
    width: doorSecretWidth,
    height: 2.5,
    direction: 'left',
    orientation: 'vertical'
  });
  // Remplacer le matériau de la porte par la texture doubleDoor
  secretRoomDoor.getClickableMesh().material = doubleDoorMaterial;
  level0Group.add(secretRoomDoor.getMesh());
  portes.push(secretRoomDoor);

  // 2 grands bureaux carrés au centre
  const marbleTexture = new THREE.TextureLoader().load('/textures/floor/marbleFloor.jpg');
  const marbleMaterial = new THREE.MeshStandardMaterial({
    map: marbleTexture,
    roughness: 0.3,
    metalness: 0.1,
  });

  const deskSize = 2.5; // Bureaux carrés de 2.5m
  const deskHeight = 0.8;
  const deskThickness = 0.1;

  // Bureau 1 (centre-nord)
  const desk1 = new THREE.Group();
  const desk1Top = new THREE.Mesh(
    new THREE.BoxGeometry(deskSize, deskThickness, deskSize),
    marbleMaterial
  );
  desk1Top.position.y = deskHeight;
  desk1.add(desk1Top);

  // Pieds du bureau 1
  const deskLegGeometry = new THREE.BoxGeometry(0.1, deskHeight, 0.1);
  const deskLegPositions: [number, number, number][] = [
    [-deskSize/2 + 0.2, deskHeight/2, -deskSize/2 + 0.2],
    [deskSize/2 - 0.2, deskHeight/2, -deskSize/2 + 0.2],
    [-deskSize/2 + 0.2, deskHeight/2, deskSize/2 - 0.2],
    [deskSize/2 - 0.2, deskHeight/2, deskSize/2 - 0.2]
  ];

  deskLegPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(deskLegGeometry, tableMaterial);
    leg.position.set(x, y, z);
    desk1.add(leg);
  });

  desk1.position.set(secretRoomCenterX, 0, secretRoomTop - 10); // Déplacé de 2m vers le sud
  level0Group.add(desk1);

  // Bureau 2 (centre-sud)
  const desk2 = desk1.clone();
  desk2.position.set(secretRoomCenterX, 0, secretRoomBottom + 6); // Déplacé de 2m vers le sud
  level0Group.add(desk2);

  // Grand bureau parallèle au mur est (extérieur), 4m de long, partant du nord
  const largeDeskWidth = 1.5; // Profondeur
  const largeDeskDepth = 4; // Longueur de 4m
  const largeDesk = new THREE.Group();
  
  const largeDeskTop = new THREE.Mesh(
    new THREE.BoxGeometry(largeDeskWidth, deskThickness, largeDeskDepth),
    marbleMaterial
  );
  largeDeskTop.position.y = deskHeight;
  largeDesk.add(largeDeskTop);

  // Pieds du grand bureau
  const largeDeskLegPositions: [number, number, number][] = [
    [-largeDeskWidth/2 + 0.2, deskHeight/2, -largeDeskDepth/2 + 0.2],
    [largeDeskWidth/2 - 0.2, deskHeight/2, -largeDeskDepth/2 + 0.2],
    [-largeDeskWidth/2 + 0.2, deskHeight/2, largeDeskDepth/2 - 0.2],
    [largeDeskWidth/2 - 0.2, deskHeight/2, largeDeskDepth/2 - 0.2]
  ];

  largeDeskLegPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(deskLegGeometry, tableMaterial);
    leg.position.set(x, y, z);
    largeDesk.add(leg);
  });

  // Position : collé au mur est, partant du nord (Z = secretRoomTop - 2)
  largeDesk.position.set(secretRoomRight - 1, 0, secretRoomTop - 2);
  level0Group.add(largeDesk);

  // 4 fenêtres rouges sur le mur est (extérieur)
  const windowRedTexture = new THREE.TextureLoader().load('/textures/object/windowRed.jpg');
  const windowRedMaterial = new THREE.MeshStandardMaterial({
    map: windowRedTexture,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95,
  });

  const windowRedPositions = [
    secretRoomTop - 4,
    secretRoomTop - 9,
    secretRoomTop - 14,
    secretRoomTop - 19
  ];

  windowRedPositions.forEach(wZ => {
    const windowRed = new THREE.Mesh(
      new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth),
      windowRedMaterial
    );
    windowRed.position.set(secretRoomRight - 0.15, windowY, wZ);
    level0Group.add(windowRed);
  });

  // ------------------------------
  // Empty Room 02 - Refaite avec nouvelles dimensions (longueur augmentée)
  // ------------------------------
  const emptyRoom02Width = 4;   // largeur sur axe X
  const emptyRoom02Depth = 8;   // longueur sur axe Z (augmentée de 6 à 8)
  
  // Position simple :
  // - Mur nord de la salle à 14 blocs du mur nord d'enceinte → Z = 45 - 14 = 31
  // - Mur est de la salle à 7 blocs du mur est d'enceinte → X = 10 - 7 = 3
  const emptyRoom02Top = 31;    // mur nord de la salle
  const emptyRoom02Bottom = 31 - emptyRoom02Depth;  // 31 - 8 = 23
  const emptyRoom02Right = 3;   // mur est de la salle
  const emptyRoom02Left = 3 - emptyRoom02Width;  // 3 - 4 = -1
  
  // Centre = (-1 + 2, 23 + 4) = (1, 27)
  const emptyRoom02CenterX = 1;
  const emptyRoom02CenterZ = 27;
  
  console.log('Position Empty Room 02:', emptyRoom02CenterX, emptyRoom02CenterZ);
  
  // Sol de l'Empty Room 02
  const emptyRoom02Floor = createFloor(emptyRoom02Width, emptyRoom02Depth, 'woodenFloor');
  emptyRoom02Floor.position.set(emptyRoom02CenterX, 0.02, emptyRoom02CenterZ);
  level0Group.add(emptyRoom02Floor);
  
  // Murs de l'Empty Room 02
  
  const emptyRoom02Walls: WallSegment[] = [
    { from: [emptyRoom02Left, emptyRoom02Top], to: [emptyRoom02Left, emptyRoom02Bottom] },
    { from: [emptyRoom02Right, emptyRoom02Top], to: [emptyRoom02Right, emptyRoom02Bottom] },
    { from: [emptyRoom02Left, emptyRoom02Top], to: [emptyRoom02Right, emptyRoom02Top] },
    { from: [emptyRoom02Left, emptyRoom02Bottom], to: [emptyRoom02Right, emptyRoom02Bottom] }
  ];
  level0Group.add(buildWalls(emptyRoom02Walls, wallHeight, thickness, interiorWallMaterial));

  // ------------------------------
  // Empty Room 03 - Dans le même alignement, à 6 blocs au sud
  // ------------------------------
  const emptyRoom03Width = 4;   // largeur sur axe X
  const emptyRoom03Depth = 15;  // longueur sur axe Z
  
  // Position : même alignement que Empty Room 02, déplacée de 2 vers le nord
  // Empty Room 02 se termine à Z = 23
  // Espace de 6 blocs - 2 (déplacement nord) = 4 blocs → Empty Room 03 commence à Z = 23 - 4 = 19
  const emptyRoom03Top = 19;    // mur nord de la salle (déplacé de 2 vers le nord)
  const emptyRoom03Bottom = 19 - emptyRoom03Depth;  // 19 - 15 = 4
  const emptyRoom03Right = 3;   // même alignement que Empty Room 02
  const emptyRoom03Left = 3 - emptyRoom03Width;  // 3 - 4 = -1
  
  // Centre = (-1 + 2, 4 + 7.5) = (1, 11.5)
  const emptyRoom03CenterX = 1;
  const emptyRoom03CenterZ = 11.5;
  
  console.log('Position Empty Room 03:', emptyRoom03CenterX, emptyRoom03CenterZ);
  
  // Sol de l'Empty Room 03
  const emptyRoom03Floor = createFloor(emptyRoom03Width, emptyRoom03Depth, 'woodenFloor');
  emptyRoom03Floor.position.set(emptyRoom03CenterX, 0.02, emptyRoom03CenterZ);
  level0Group.add(emptyRoom03Floor);
  
  // Murs de l'Empty Room 03
  const emptyRoom03Walls: WallSegment[] = [
    { from: [emptyRoom03Left, emptyRoom03Top], to: [emptyRoom03Left, emptyRoom03Bottom] },
    { from: [emptyRoom03Right, emptyRoom03Top], to: [emptyRoom03Right, emptyRoom03Bottom] },
    { from: [emptyRoom03Left, emptyRoom03Top], to: [emptyRoom03Right, emptyRoom03Top] },
    { from: [emptyRoom03Left, emptyRoom03Bottom], to: [emptyRoom03Right, emptyRoom03Bottom] }
  ];
  level0Group.add(buildWalls(emptyRoom03Walls, wallHeight, thickness, interiorWallMaterial));

  // ------------------------------
  // Mur de séparation entre Empty Room 02 et Empty Room 03
  // ------------------------------
  // Mur vertical à X=1, de Z=23 à Z=19 (4 mètres de long)
  // Ce mur sépare les deux salles dans l'espace entre elles
  const separationWall: WallSegment[] = [
    { from: [1, 23], to: [1, 19] }
  ];
  level0Group.add(buildWalls(separationWall, wallHeight, thickness, interiorWallMaterial));
  
  console.log('Mur de séparation créé à X=1, de Z=23 à Z=19');

  // ------------------------------
  // Classroom 05 - Sur le mur EST, à 21 blocs du mur nord
  // ------------------------------
  const classroom05Width = 7;   // largeur sur axe X
  const classroom05Depth = 13;  // longueur sur axe Z
  
  // Position : collée au mur OUEST, décalée de 9 vers le sud
  // Mur nord d'enceinte à Z=45 → mur nord de la salle à Z = 45 - 21 - 9 = 15
  const classroom05Left = -10;  // collé au mur OUEST d'enceinte
  const classroom05Right = -10 + classroom05Width;  // -10 + 7 = -3
  const classroom05Top = 15;    // décalé de 9 vers le sud (24 - 9 = 15)
  const classroom05Bottom = 15 - classroom05Depth;  // 15 - 13 = 2
  
  // Centre = (-10 + 3.5, 2 + 6.5) = (-6.5, 8.5)
  const classroom05CenterX = -6.5;
  const classroom05CenterZ = 8.5;
  
  console.log('Position Classroom 05:', classroom05CenterX, classroom05CenterZ);
  
  // Sol de la Classroom 05
  const classroom05Floor = createFloor(classroom05Width, classroom05Depth, 'woodenFloor');
  classroom05Floor.position.set(classroom05CenterX, 0.02, classroom05CenterZ);
  level0Group.add(classroom05Floor);
  
  // Position de la porte sur le mur sud (bas), décalée de 1m vers la gauche (est)
  const door5Width = 1.0;
  const door5X = classroom05CenterX + 1; // Décalée de 1m vers la gauche quand on fait face à la porte
  
  // Murs de la Classroom 05
  const classroom05Walls: WallSegment[] = [
    // Mur gauche (extérieur)
    { from: [classroom05Left, classroom05Top], to: [classroom05Left, classroom05Bottom] },
    // Mur droit (intérieur)
    { from: [classroom05Right, classroom05Top], to: [classroom05Right, classroom05Bottom] },
    // Mur haut (intérieur)
    { from: [classroom05Left, classroom05Top], to: [classroom05Right, classroom05Top] },
    // Mur bas (intérieur) - AVEC OUVERTURE POUR LA PORTE
    { from: [classroom05Left, classroom05Bottom], to: [door5X - door5Width/2, classroom05Bottom] },
    { from: [door5X + door5Width/2, classroom05Bottom], to: [classroom05Right, classroom05Bottom] }
  ];
  level0Group.add(buildWalls(classroom05Walls, wallHeight, thickness, interiorWallMaterial));

  // Porte de Classroom 05
  const classroom05Door = new Porte({
    position: new THREE.Vector3(door5X, 0, classroom05Bottom),
    width: door5Width,
    height: 2.5,
    direction: 'right',
    orientation: 'horizontal'
  });
  level0Group.add(classroom05Door.getMesh());
  portes.push(classroom05Door);

  // Tableau sur le mur nord
  const board5 = new THREE.Mesh(boardGeometry, boardMaterial);
  board5.position.set(classroom05CenterX, 1.8, classroom05Top - 0.3);
  level0Group.add(board5);

  // Tables face au tableau
  const legGeometry5 = new THREE.BoxGeometry(0.08, tableHeight, 0.08);
  const classroom05TableWidth = 2.2;
  
  for (let i = 0; i < 4; i++) {
    const z = classroom05Top - 2 - i * 2.5;
    if (z < classroom05Bottom + 1) break;

    const tableLeft5 = new THREE.Group();
    const topLeft5 = new THREE.Mesh(
      new THREE.BoxGeometry(classroom05TableWidth, tableThickness, tableDepth),
      tableMaterial
    );
    topLeft5.position.y = tableHeight;
    tableLeft5.add(topLeft5);

    const legPositions5: [number, number, number][] = [
      [-classroom05TableWidth/2 + 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [classroom05TableWidth/2 - 0.1, tableHeight/2, -tableDepth/2 + 0.1],
      [-classroom05TableWidth/2 + 0.1, tableHeight/2, tableDepth/2 - 0.1],
      [classroom05TableWidth/2 - 0.1, tableHeight/2, tableDepth/2 - 0.1]
    ];

    legPositions5.forEach(([x, y, z]) => {
      const leg5 = new THREE.Mesh(legGeometry5, tableMaterial);
      leg5.position.set(x, y, z);
      tableLeft5.add(leg5);
    });

    tableLeft5.position.set(classroom05CenterX - 1.5, 0, z);
    level0Group.add(tableLeft5);

    const tableRight5 = tableLeft5.clone();
    tableRight5.position.set(classroom05CenterX + 1.5, 0, z);
    level0Group.add(tableRight5);
  }

  // Fenêtres sur le mur ouest (extérieur)
  const window5Positions = [
    classroom05Top - 4,
    classroom05Top - 8
  ];

  window5Positions.forEach(wZ => {
    const window5 = new THREE.Mesh(
      new THREE.BoxGeometry(windowThickness, windowHeight, windowWidth),
      windowMaterial
    );
    window5.position.set(classroom05Left + 0.15, windowY, wZ);
    level0Group.add(window5);
  });

  // ------------------------------
  // Mur de séparation entre Classroom 05 et Empty Room 03
  // ------------------------------
  // Mur horizontal à Z=4, de X=-3 (bord droit de Classroom 05) à X=-1 (bord gauche de Empty Room 03)
  const separationWallClassroom: WallSegment[] = [
    { from: [-3, 4], to: [-1, 4] }
  ];
  level0Group.add(buildWalls(separationWallClassroom, wallHeight, thickness, interiorWallMaterial));
  
  console.log('Mur de séparation entre Classroom 05 et Empty Room 03 créé à Z=4, de X=-3 à X=-1');

  // ------------------------------
  // Nouvelle salle - En dessous de Classroom 05
  // ------------------------------
  const newRoomWidth = 3;   // largeur sur axe X
  const newRoomDepth = 4;   // longueur sur axe Z

  // Position : collée au mur ouest (X=-10), en dessous de Classroom 05 (Z=2)
  // Coin supérieur gauche = (-10, 2)
  // Centre = (-10 + 1.5, 2 - 2) = (-8.5, 0)
  const newRoomLeft = -10;  // collé au mur ouest
  const newRoomRight = -10 + newRoomWidth;  // -10 + 3 = -7
  const newRoomTop = 2;    // en dessous de Classroom 05
  const newRoomBottom = 2 - newRoomDepth;  // 2 - 4 = -2

  const newRoomCenterX = -8.5;
  const newRoomCenterZ = 0;

  console.log('Position nouvelle salle:', newRoomCenterX, newRoomCenterZ);

  // Sol de la nouvelle salle
  const newRoomFloor = createFloor(newRoomWidth, newRoomDepth, 'woodenFloor');
  newRoomFloor.position.set(newRoomCenterX, 0.02, newRoomCenterZ);
  level0Group.add(newRoomFloor);

  // Murs de la nouvelle salle
  const newRoomWalls: WallSegment[] = [
    { from: [newRoomLeft, newRoomTop], to: [newRoomLeft, newRoomBottom] },
    { from: [newRoomRight, newRoomTop], to: [newRoomRight, newRoomBottom] },
    { from: [newRoomLeft, newRoomTop], to: [newRoomRight, newRoomTop] },
    { from: [newRoomLeft, newRoomBottom], to: [newRoomRight, newRoomBottom] }
  ];
  level0Group.add(buildWalls(newRoomWalls, wallHeight, thickness, interiorWallMaterial));

  // ------------------------------
  // Empty Room 04 - À côté de la Cleaning Room (murs nord alignés)
  // ------------------------------
  const emptyRoom04Width = 8;   // largeur sur axe X
  const emptyRoom04Depth = 4;   // longueur sur axe Z

  // Position : mur nord aligné avec Cleaning Room (Z=-12)
  // À gauche de la Cleaning Room (qui va de X=4 à X=10)
  // Coin supérieur droit = (4, -12)
  // Centre = (4 - 4, -12 - 2) = (0, -14)
  const emptyRoom04Right = 4;   // collé au mur gauche de Cleaning Room
  const emptyRoom04Left = 4 - emptyRoom04Width;  // 4 - 8 = -4
  const emptyRoom04Top = -12;   // aligné avec le mur nord de Cleaning Room
  const emptyRoom04Bottom = -12 - emptyRoom04Depth;  // -12 - 4 = -16

  const emptyRoom04CenterX = 0;
  const emptyRoom04CenterZ = -14;

  console.log('Position Empty Room 04:', emptyRoom04CenterX, emptyRoom04CenterZ);

  // Sol de l'Empty Room 04
  const emptyRoom04Floor = createFloor(emptyRoom04Width, emptyRoom04Depth, 'woodenFloor');
  emptyRoom04Floor.position.set(emptyRoom04CenterX, 0.02, emptyRoom04CenterZ);
  level0Group.add(emptyRoom04Floor);

  // Murs de l'Empty Room 04
  const emptyRoom04Walls: WallSegment[] = [
    { from: [emptyRoom04Left, emptyRoom04Top], to: [emptyRoom04Left, emptyRoom04Bottom] },
    { from: [emptyRoom04Right, emptyRoom04Top], to: [emptyRoom04Right, emptyRoom04Bottom] },
    { from: [emptyRoom04Left, emptyRoom04Top], to: [emptyRoom04Right, emptyRoom04Top] },
    { from: [emptyRoom04Left, emptyRoom04Bottom], to: [emptyRoom04Right, emptyRoom04Bottom] }
  ];
  level0Group.add(buildWalls(emptyRoom04Walls, wallHeight, thickness, interiorWallMaterial));

  // ------------------------------
  // Escalier - En dessous de Empty Room 04, avec 4m d'espace
  // ------------------------------
  const escalierWidth = 8;   // largeur sur axe X
  const escalierDepth = 13;  // longueur sur axe Z

  // Position : en dessous de Empty Room 04, avec 4m d'espace
  // Empty Room 04 se termine à Z=-16
  // Escalier commence à Z=-16 - 4 = -20
  // Coin supérieur = (-4, -20) (même alignement X que Empty Room 04)
  // Centre = (-4 + 4, -20 - 6.5) = (0, -26.5)
  const escalierLeft = emptyRoom04Left;  // -4 (même alignement)
  const escalierRight = emptyRoom04Right;  // 4 (même alignement)
  const escalierTop = emptyRoom04Bottom - 4;  // -16 - 4 = -20
  const escalierBottom = escalierTop - escalierDepth;  // -20 - 13 = -33

  const escalierCenterX = 0;
  const escalierCenterZ = -26.5;

  console.log('Position Escalier:', escalierCenterX, escalierCenterZ);

  // Sol de l'Escalier
  const escalierFloor = createFloor(escalierWidth, escalierDepth, 'woodenFloor');
  escalierFloor.position.set(escalierCenterX, 0.02, escalierCenterZ);
  level0Group.add(escalierFloor);

  // Murs de l'Escalier
  const escalierWalls: WallSegment[] = [
    { from: [escalierLeft, escalierTop], to: [escalierLeft, escalierBottom] },
    { from: [escalierRight, escalierTop], to: [escalierRight, escalierBottom] },
    { from: [escalierLeft, escalierTop], to: [escalierRight, escalierTop] },
    { from: [escalierLeft, escalierBottom], to: [escalierRight, escalierBottom] }
  ];
  level0Group.add(buildWalls(escalierWalls, wallHeight, thickness, interiorWallMaterial));

  // ------------------------------
  // ÉTAPE 1 : Grandes tables à droite de Classroom 04 (traits jaunes)
  // ------------------------------
  // Position : dans le couloir à l'est de Classroom 04
  // Classroom 04 va de X=4 à X=10, donc les tables seront à droite (X > 10)
  // Longueur x3 = 2.5 * 3 = 7.5m
  
  // Table 1 - Position selon coordonnées spécifiées
  const bigTable1 = createTable(5.3, 0.8, 0.75); // Longueur = 3.3 - (-2) = 5.3
  bigTable1.position.set(0.65, 0, -3.1); // Centre : (3.3 + (-2)) / 2 = 0.65
  level0Group.add(bigTable1);
  
  // Table 2 - Alignée verticalement avec la première
  const bigTable2 = createTable(5.3, 0.8, 0.75);
  bigTable2.position.set(0.65, 0, -5.5); // Même X, décalée en Z
  level0Group.add(bigTable2);
  
  // Table 3 - Alignée verticalement avec les autres
  const bigTable3 = createTable(5.3, 0.8, 0.75);
  bigTable3.position.set(0.65, 0, -8); // Même X, plus au sud
  level0Group.add(bigTable3);

  // ------------------------------
  // ÉTAPE 2 : Bureau en L supprimé
  // ------------------------------

  // ------------------------------
  // ÉTAPE 3 : Grandes portes ouvertes dans le mur d'enceinte
  // ------------------------------
  
  // Porte 1 : Dans l'ouverture de Z=-13 à Z=-17 (largeur 4 unités)
  // Position centre = X=-9.8 (légèrement à l'intérieur pour être visible), Z=-15
  const openDoor1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 3, 4), // Épaisseur légèrement plus grande, hauteur 3, largeur 4
    openDoorMaterial
  );
  openDoor1.position.set(-9.8, 1.5, -15); // Légèrement à l'intérieur pour être visible
  level0Group.add(openDoor1);
  
  // Porte 2 : Dans l'ouverture de Z=-22 à Z=-26 (largeur 4 unités)
  // Position centre = X=-9.8 (légèrement à l'intérieur pour être visible), Z=-24
  const openDoor2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 3, 4), // Épaisseur légèrement plus grande, hauteur 3, largeur 4
    openDoorMaterial
  );
  openDoor2.position.set(-9.8, 1.5, -24); // Légèrement à l'intérieur pour être visible
  level0Group.add(openDoor2);

  // ------------------------------
  // PORTES EXTÉRIEURES (côté extérieur du mur d'enceinte)
  // ------------------------------
  
  // Porte extérieure 1 : Alignée avec la porte intérieure 1
  // Position centre = X=-10.2 (légèrement à l'extérieur pour être visible), Z=-15
  const openDoorExt1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 3, 4), // Même dimensions que les portes intérieures
    openDoorMaterial
  );
  openDoorExt1.position.set(-10.2, 1.5, -15); // Légèrement à l'extérieur pour être visible
  level0Group.add(openDoorExt1);
  
  // Porte extérieure 2 : Alignée avec la porte intérieure 2
  // Position centre = X=-10.2 (légèrement à l'extérieur pour être visible), Z=-24
  const openDoorExt2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 3, 4), // Même dimensions que les portes intérieures
    openDoorMaterial
  );
  openDoorExt2.position.set(-10.2, 1.5, -24); // Légèrement à l'extérieur pour être visible
  level0Group.add(openDoorExt2);

  // ------------------------------
  // FENÊTRES JAUNES SUR LE MUR D'ENCEINTE
  // ------------------------------
  
  // Matériau pour les fenêtres jaunes du mur d'enceinte
  const exteriorWindowTexture = new THREE.TextureLoader().load('/textures/object/windowYellow.jpg');
  const exteriorWindowMaterial = new THREE.MeshStandardMaterial({
    map: exteriorWindowTexture,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95,
  });

  // Dimensions des fenêtres du mur d'enceinte
  const exteriorWindowWidth = 1.5;  // largeur
  const exteriorWindowHeight = 2;   // hauteur
  const exteriorWindowThickness = 0.1; // épaisseur
  const exteriorWindowY = 1.8; // hauteur du centre de la fenêtre

  // FENÊTRES SUR LE MUR OUEST (avec les portes)
  // Positionnées entre les portes et aux extrémités
  const westWallWindows = [
    -40, // Fenêtre au nord
    -35, // Entre la porte nord et le nord
    -20, // Entre les deux portes
    -10, // Entre la porte sud et le sud
    -5   // Fenêtre au sud
  ];

  westWallWindows.forEach(zPos => {
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(exteriorWindowThickness, exteriorWindowHeight, exteriorWindowWidth),
      exteriorWindowMaterial
    );
    window.position.set(-9.9, exteriorWindowY, zPos); // Légèrement à l'intérieur du mur ouest pour être visible
    level0Group.add(window);
  });

  // FENÊTRES SUR LE MUR SUD (le plus au sud)
  // Positionnées régulièrement le long du mur sud, en évitant la chambre des secrets
  const southWallWindows = [
    -8,  // Fenêtre ouest
    -4,  // Centre-ouest
    0    // Centre (évite la chambre des secrets qui va de X=4 à X=10)
  ];

  southWallWindows.forEach(xPos => {
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(exteriorWindowWidth, exteriorWindowHeight, exteriorWindowThickness),
      exteriorWindowMaterial
    );
    window.position.set(xPos, exteriorWindowY, -44.9); // Légèrement à l'intérieur du mur sud pour être visible
    level0Group.add(window);
  });

  // ------------------------------
  // CANAPÉS QUI SE FONT FACE
  // ------------------------------
  
  // Canapé 1 : X=3, Z=-37 à Z=-34 (longueur 3 unités)
  // Position centre = X=3, Z=(-37 + (-34))/2 = -35.5
  const sofa1 = createSofa(3, 1, 0.9);
  sofa1.position.set(3, 0, -35.5); // Centre calculé
  sofa1.rotation.y = -Math.PI / 2; // Orienté vers l'est (face au canapé 2)
  level0Group.add(sofa1);

  // Canapé 2 : X=0, Z=-37 à Z=-34 (longueur 3 unités)
  // Position centre = X=0, Z=(-37 + (-34))/2 = -35.5
  const sofa2 = createSofa(3, 1, 0.9);
  sofa2.position.set(0, 0, -35.5); // Centre calculé
  sofa2.rotation.y = Math.PI / 2; // Orienté vers l'ouest (face au canapé 1)
  level0Group.add(sofa2);

  // ------------------------------
  // SOLEIL VISIBLE ET ÉCLAIRAGE
  // ------------------------------
  
  // Création du soleil visible
  const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sunMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // Or
    emissive: 0xFFA500, // Orange émis
    emissiveIntensity: 0.8
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(-30, 25, -20); // Position haute et à l'ouest
  level0Group.add(sun);

  // Lumière directionnelle principale (soleil)
  const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
  sunLight.position.set(-30, 25, -20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  sunLight.shadow.camera.left = -25;
  sunLight.shadow.camera.right = 25;
  sunLight.shadow.camera.top = 25;
  sunLight.shadow.camera.bottom = -25;
  level0Group.add(sunLight);

  // ------------------------------
  // FAISCEAUX DE LUMIÈRE SUPPRIMÉS
  // ------------------------------

  // Lumière ambiante pour améliorer l'éclairage général
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // Lumière douce
  level0Group.add(ambientLight);
}

const initScene = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x222222, 0.015);

  camera = new THREE.PerspectiveCamera(60, viewportWidth / viewportHeight, 0.1, 1000);
  camera.position.set(60, 30, 60);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewportWidth, viewportHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.value!.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 200;
  // Pas de restriction d'angle - la caméra peut se déplacer librement partout
  controls.enablePan = true; // Permettre le déplacement latéral avec clic droit ou touches
  controls.screenSpacePanning = true; // Déplacement dans l'espace écran

  const keyLight = new THREE.DirectionalLight(0xfff0e0, 0.6);
  keyLight.position.set(10, 20, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.radius = 4;
  scene.add(keyLight);

  const fillLight = new THREE.AmbientLight(0x888888, 0.4);
  scene.add(fillLight);

  // Debug bounding box supprimé

  // Dimensions générales (gabarit bâtiment) - 20x90m

  // Nettoyage et préparation du niveau 0 selon le nouveau plan (murs/portes/baies seront ajoutés ensuite)
  buildLevel0FromPlan();

  // AUCUN PLAFOND POUR L'INSTANT

  // Ajouter seulement le groupe logique de niveau 0
  scene.add(level0Group);
};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const onMouseMove = (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Vérifier si la souris survole une porte
  const doorMeshes = portes.map(door => door.getClickableMesh());
  const doorIntersects = raycaster.intersectObjects(doorMeshes);
  
  if (doorIntersects.length > 0) {
    document.body.style.cursor = 'pointer';
  } else {
    document.body.style.cursor = 'default';
  }

  // Debug des coordonnées supprimé
};

const onClick = (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Vérifier les clics sur les portes
  const doorMeshes = portes.map(door => door.getClickableMesh());
  const doorIntersects = raycaster.intersectObjects(doorMeshes);
  
  if (doorIntersects.length > 0 && doorIntersects[0]) {
    // Trouver quelle porte a été cliquée
    const clickedMesh = doorIntersects[0].object as THREE.Mesh;
    const clickedDoor = portes.find(door => door.getClickableMesh() === clickedMesh);
    
    if (clickedDoor) {
      clickedDoor.toggle();
      console.log('Porte cliquée - État:', clickedDoor.getIsOpen() ? 'Ouverte' : 'Fermée');
      return; // Ne pas vérifier les autres objets
    }
  }

  // Vérifier les clics sur la salle secrète
  if (secretHighlight) {
    const intersects = raycaster.intersectObject(secretHighlight);
    if (intersects.length > 0) {
      showSecretPanel.value = true;
    }
  }
};


const onResize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  if (orbitActive) {
    orbitAngle += orbitSpeed;
    const radius = 60;
    camera.position.x = Math.cos(orbitAngle) * radius;
    camera.position.z = Math.sin(orbitAngle) * radius;
    camera.lookAt(0, 0, 0);
  }
  controls.update();
  renderer.render(scene, camera);
};

onMounted(() => {
  initScene();
  window.addEventListener('resize', onResize);
  window.addEventListener('click', onClick);
  window.addEventListener('mousemove', onMouseMove);
  animate();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('click', onClick);
  window.removeEventListener('mousemove', onMouseMove);
  // Nettoyer les portes
  portes.forEach(door => door.dispose());
});
</script>

<style scoped>
/* Conteneur plein écran pour le canvas Three.js */
.scene-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 🌍 Contraste et lisibilité */
button,
label,
input,
.secret-panel,
.orbit-ui,
.etage-ui {
  color: #ffffff;
  background-color: #222222;
  font-family: 'Segoe UI', sans-serif;
  font-size: 14px;
}

/* 🧠 Focus clavier visible */
button:focus,
input:focus {
  outline: 2px solid #ffcc00;
  outline-offset: 2px;
}

/* 📱 Responsive panneau info */
.secret-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  max-width: 320px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  z-index: 20;
}

.secret-panel h2 {
  margin-top: 0;
  font-size: 18px;
}

.secret-panel p {
  font-size: 14px;
  line-height: 1.4;
}

/* 🧭 UI boutons orbitaux */
.orbit-ui,
.etage-ui {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  padding: 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
}

/* 🖱️ Boutons génériques */
button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

button:hover {
  background-color: #444444;
}

.secret-btn {
  position: absolute;
  top: 120px;
  left: 20px;
  z-index: 10;
}

.info-btn {
  position: absolute;
  top: 160px;
  left: 20px;
  z-index: 10;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
}

.info-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.info-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 3px solid #8b5cf6;
  border-radius: 15px;
  padding: 25px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 30;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.info-panel h2 {
  margin-top: 0;
  color: #4c1d95;
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.info-content {
  line-height: 1.6;
  color: #374151;
}

.info-content p {
  margin-bottom: 15px;
}

.info-content strong {
  color: #7c3aed;
  font-weight: 600;
}

.info-content ul {
  margin: 15px 0;
  padding-left: 20px;
}

.info-content li {
  margin-bottom: 8px;
  color: #059669;
  font-weight: 500;
}

.info-panel button {
  display: block;
  margin: 20px auto 0;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.info-panel button:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Debug supprimé */
</style>
