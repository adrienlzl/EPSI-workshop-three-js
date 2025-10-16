import * as THREE from 'three';

export function createBoundingBox(width: number, length: number, height: number): THREE.Group {
    const group = new THREE.Group();

    const box = new THREE.BoxGeometry(width, height, length);
    const edges = new THREE.EdgesGeometry(box);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);

    wireframe.position.set(0, height / 2, 0); // centré sur Y

    group.add(wireframe);

    // Axes visuels
    const axesHelper = new THREE.AxesHelper(Math.max(width, length, height));
    group.add(axesHelper);

    return group;
}
