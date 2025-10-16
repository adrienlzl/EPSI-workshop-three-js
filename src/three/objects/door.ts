import * as THREE from 'three';
import { woodMaterial } from '@/three/materials';

const textureLoader = new THREE.TextureLoader();
const doorTexture = textureLoader.load('/textures/object/interiorGate.jpg');

// Matériau pour la porte avec texture
const doorMaterial = new THREE.MeshStandardMaterial({
    map: doorTexture,
    roughness: 0.7,
    metalness: 0.1,
});

export interface DoorOptions {
    position: THREE.Vector3;
    width?: number;
    height?: number;
    direction?: 'left' | 'right';
    orientation?: 'horizontal' | 'vertical'; // horizontal = porte sur mur X, vertical = porte sur mur Z
}

export class Porte {
    public group: THREE.Group;
    private pivot: THREE.Group;
    private ouvrant: THREE.Mesh;
    private isOpen = false;
    private angle = Math.PI / 2; // 90° ouverture
    private speed = 0.05;
    private targetRotation = 0;
    private animationFrameId: number | null = null;

    constructor(options: DoorOptions) {
        const {
            position,
            width = 1.2,
            height = 2.5,
            direction = 'right',
            orientation = 'vertical'
        } = options;

        this.group = new THREE.Group();

        // ✅ Cadre de porte (dormant)
        const frameThickness = 0.15;
        const frameDepth = 0.2;
        const frameMat = woodMaterial;

        // Montants verticaux
        const verticalFrameGeo = new THREE.BoxGeometry(frameThickness, height, frameDepth);
        const leftFrame = new THREE.Mesh(verticalFrameGeo, frameMat);
        leftFrame.position.set(-width / 2, height / 2, 0);
        const rightFrame = new THREE.Mesh(verticalFrameGeo, frameMat);
        rightFrame.position.set(width / 2, height / 2, 0);

        // Linteau horizontal
        const horizontalFrameGeo = new THREE.BoxGeometry(width, frameThickness, frameDepth);
        const topFrame = new THREE.Mesh(horizontalFrameGeo, frameMat);
        topFrame.position.set(0, height, 0);

        this.group.add(leftFrame, rightFrame, topFrame);

        // ✅ Ouvrant (panneau rotatif) avec texture
        const ouvrantGeo = new THREE.BoxGeometry(width - 0.1, height - 0.1, 0.05);
        this.ouvrant = new THREE.Mesh(ouvrantGeo, doorMaterial);
        this.ouvrant.userData.isDoor = true; // Pour le raycasting

        // ✅ Pivot : charnière sur bord gauche ou droit
        this.pivot = new THREE.Group();
        this.pivot.position.set(direction === 'right' ? width / 2 : -width / 2, 0, 0);
        this.ouvrant.position.set(direction === 'right' ? -width / 2 : width / 2, height / 2, 0);
        this.pivot.add(this.ouvrant);
        this.group.add(this.pivot);

        // ✅ Orientation de la porte
        // La porte est créée par défaut dans le plan XY (face vers Z)
        // vertical = porte sur mur parallèle à Z (nord-sud) → rotation de 90° pour être parallèle au mur
        // horizontal = porte sur mur parallèle à X (est-ouest) → pas de rotation
        if (orientation === 'vertical') {
            this.group.rotation.y = Math.PI / 2;
        }

        // ✅ Position dans la scène
        this.group.position.copy(position);

        // ✅ Animation loop
        this.startAnimation();
    }

    private startAnimation() {
        const animate = () => {
            const current = this.pivot.rotation.y;
            const delta = this.targetRotation - current;
            if (Math.abs(delta) > 0.01) {
                this.pivot.rotation.y += delta * this.speed;
            }
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.targetRotation = this.isOpen ? this.angle : 0;
    }

    getIsOpen(): boolean {
        return this.isOpen;
    }

    getMesh(): THREE.Object3D {
        return this.group;
    }

    getClickableMesh(): THREE.Mesh {
        return this.ouvrant;
    }

    dispose() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}
