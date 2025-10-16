import * as THREE from 'three';

export function createClassroomLayout(
    width: number,
    depth: number,
    height: number,
    position: THREE.Vector3
): THREE.Group {
    const group = new THREE.Group();

    // ✅ Tableau mural
    const boardGeo = new THREE.BoxGeometry(3, 1.5, 0.1);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, height * 0.75, -depth / 2 + 0.05);
    group.add(board);

    // ✅ Tables
    const tableGeo = new THREE.BoxGeometry(1.2, 0.1, 0.6);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x664422 });

    const rows = 5;
    const spacingZ = 2;
    const leftX = -width / 2 + 1;
    const rightX = width / 2 - 1;
    const startZ = -depth / 2 + 2;

    for (let i = 0; i < rows; i++) {
        const z = startZ + i * spacingZ;

        // Tables de 3 (gauche)
        const table3 = new THREE.Mesh(tableGeo, tableMat);
        table3.scale.x = 1.5;
        table3.position.set(leftX, 0.5, z);
        group.add(table3);

        // Tables de 2 (droite)
        const table2 = new THREE.Mesh(tableGeo, tableMat);
        table2.scale.x = 1.2;
        table2.position.set(rightX, 0.5, z);
        group.add(table2);
    }

    group.position.copy(position);
    return group;
}
