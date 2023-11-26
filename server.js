import { WebSocketServer } from "ws";
import * as THREE from "three";

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

const wss = new WebSocketServer({ port: 8888 });

/** @type Map<string, string> */
const solvedMap = new Map();
const cube = generateCube();
colorCube(cube);

console.log("Starting Server");
wss.on("connection", (ws, req) => {
    console.log("Connection received:", req.socket.remoteAddress);
    ws.on("error", console.error);
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        switch (data.event) {
            case "ROTATE":
                rotateCube(cube, data.face, data.rotation);
                broadcast(encode(cube));
                break;
        }
    });
    ws.send(encode(cube));
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        client.send(data);
    });
}

/**
 * @param {THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[][][][]} cube
 */
function encode(cube) {
    return JSON.stringify({
        isSolved: isSolved(cube),
        cube: cube.map((s) => {
            return s.map((r) => {
                return r.map((c) => {
                    return c.map((m) => {
                        const material = m.material;
                        const geo = m.geometry;
                        return {
                            uuid: m.uuid,
                            geometry: Array.from(
                                geo.getAttribute("position").array.values(),
                            ),
                            material: {
                                color: material.color,
                                transparent: material.transparent,
                                opacity: material.opacity,
                            },
                            rotation: m.rotation,
                        };
                    });
                });
            });
        }),
    });
}

/**
 * @param {THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[][][][]} cube
 * @param {string} face
 * @param {'CLOCKWISE'|'COUNTERCLOCKWISE'} rotation
 */
function rotateCube(cube, face, rotation) {
    const rotationFactor = rotation === "CLOCKWISE" ? -1 : 1;
    if (face === cube[2][1][1][0].uuid) {
        // RED
        const meshes = [
            ...cube[2][0][0],
            ...cube[2][0][1],
            ...cube[2][0][2],
            ...cube[2][1][0],
            ...cube[2][1][1],
            ...cube[2][1][2],
            ...cube[2][2][0],
            ...cube[2][2][1],
            ...cube[2][2][2],
        ];
        meshes.forEach((mesh) => {
            mesh.rotateOnWorldAxis(Z, (rotationFactor * Math.PI) / 2);
        });
        if (rotation === "COUNTERCLOCKWISE") {
            // adjust corners
            let tmp = cube[2][2][0];
            cube[2][2][0] = cube[2][2][2];
            cube[2][2][2] = cube[2][0][2];
            cube[2][0][2] = cube[2][0][0];
            cube[2][0][0] = tmp;
            // adjust edges
            tmp = cube[2][1][0];
            cube[2][1][0] = cube[2][2][1];
            cube[2][2][1] = cube[2][1][2];
            cube[2][1][2] = cube[2][0][1];
            cube[2][0][1] = tmp;
        } else {
            // adjust corners
            let tmp = cube[2][2][0];
            cube[2][2][0] = cube[2][0][0];
            cube[2][0][0] = cube[2][0][2];
            cube[2][0][2] = cube[2][2][2];
            cube[2][2][2] = tmp;
            // adjust edges
            tmp = cube[2][1][0];
            cube[2][1][0] = cube[2][0][1];
            cube[2][0][1] = cube[2][1][2];
            cube[2][1][2] = cube[2][2][1];
            cube[2][2][1] = tmp;
        }
    } else if (face === cube[0][1][1][0].uuid) {
        // ORANGE
        const meshes = [
            ...cube[0][0][0],
            ...cube[0][0][1],
            ...cube[0][0][2],
            ...cube[0][1][0],
            ...cube[0][1][1],
            ...cube[0][1][2],
            ...cube[0][2][0],
            ...cube[0][2][1],
            ...cube[0][2][2],
        ];
        meshes.forEach((mesh) => {
            mesh.rotateOnWorldAxis(Z, (rotationFactor * Math.PI) / 2);
        });
        if (rotationFactor === 1) {
            // adjust corners
            let tmp = cube[0][2][0];
            cube[0][2][0] = cube[0][2][2];
            cube[0][2][2] = cube[0][0][2];
            cube[0][0][2] = cube[0][0][0];
            cube[0][0][0] = tmp;
            // adjust edges
            tmp = cube[0][1][0];
            cube[0][1][0] = cube[0][2][1];
            cube[0][2][1] = cube[0][1][2];
            cube[0][1][2] = cube[0][0][1];
            cube[0][0][1] = tmp;
        } else if (rotationFactor === -1) {
            // adjust corners
            let tmp = cube[0][2][0];
            cube[0][2][0] = cube[0][0][0];
            cube[0][0][0] = cube[0][0][2];
            cube[0][0][2] = cube[0][2][2];
            cube[0][2][2] = tmp;
            // adjust edges
            tmp = cube[0][1][0];
            cube[0][1][0] = cube[0][0][1];
            cube[0][0][1] = cube[0][1][2];
            cube[0][1][2] = cube[0][2][1];
            cube[0][2][1] = tmp;
        }
    } else if (face === cube[1][1][2][0].uuid) {
        // BLUE
        const meshes = [
            ...cube[0][0][2],
            ...cube[1][0][2],
            ...cube[2][0][2],
            ...cube[0][1][2],
            ...cube[1][1][2],
            ...cube[2][1][2],
            ...cube[0][2][2],
            ...cube[1][2][2],
            ...cube[2][2][2],
        ];
        meshes.forEach((mesh) => {
            mesh.rotateOnWorldAxis(X, (rotationFactor * Math.PI) / 2);
        });
        if (rotation === "COUNTERCLOCKWISE") {
            // adjust corners
            let tmp = cube[2][2][2];
            cube[2][2][2] = cube[0][2][2];
            cube[0][2][2] = cube[0][0][2];
            cube[0][0][2] = cube[2][0][2];
            cube[2][0][2] = tmp;
            // adjust edges
            tmp = cube[2][1][2];
            cube[2][1][2] = cube[1][2][2];
            cube[1][2][2] = cube[0][1][2];
            cube[0][1][2] = cube[1][0][2];
            cube[1][0][2] = tmp;
        } else {
            // adjust corners
            let tmp = cube[2][2][2];
            cube[2][2][2] = cube[2][0][2];
            cube[2][0][2] = cube[0][0][2];
            cube[0][0][2] = cube[0][2][2];
            cube[0][2][2] = tmp;
            // adjust edges
            tmp = cube[2][1][2];
            cube[2][1][2] = cube[1][0][2];
            cube[1][0][2] = cube[0][1][2];
            cube[0][1][2] = cube[1][2][2];
            cube[1][2][2] = tmp;
        }
    } else if (face === cube[1][1][0][0].uuid) {
        // GREEN
        const meshes = [
            ...cube[0][0][0],
            ...cube[1][0][0],
            ...cube[2][0][0],
            ...cube[0][1][0],
            ...cube[1][1][0],
            ...cube[2][1][0],
            ...cube[0][2][0],
            ...cube[1][2][0],
            ...cube[2][2][0],
        ];
        meshes.forEach((mesh) => {
            mesh.rotateOnWorldAxis(X, (rotationFactor * Math.PI) / 2);
        });
        if (rotation === "COUNTERCLOCKWISE") {
            // adjust corners
            let tmp = cube[2][2][0];
            cube[2][2][0] = cube[0][2][0];
            cube[0][2][0] = cube[0][0][0];
            cube[0][0][0] = cube[2][0][0];
            cube[2][0][0] = tmp;
            // adjust edges
            tmp = cube[2][1][0];
            cube[2][1][0] = cube[1][2][0];
            cube[1][2][0] = cube[0][1][0];
            cube[0][1][0] = cube[1][0][0];
            cube[1][0][0] = tmp;
        } else {
            // adjust corners
            let tmp = cube[2][2][0];
            cube[2][2][0] = cube[2][0][0];
            cube[2][0][0] = cube[0][0][0];
            cube[0][0][0] = cube[0][2][0];
            cube[0][2][0] = tmp;
            // adjust edges
            tmp = cube[2][1][0];
            cube[2][1][0] = cube[1][0][0];
            cube[1][0][0] = cube[0][1][0];
            cube[0][1][0] = cube[1][2][0];
            cube[1][2][0] = tmp;
        }
    } else if (face === cube[1][2][1][0].uuid) {
        // WHITE
        const meshes = [
            ...cube[0][2][0],
            ...cube[0][2][1],
            ...cube[0][2][2],
            ...cube[1][2][0],
            ...cube[1][2][1],
            ...cube[1][2][2],
            ...cube[2][2][0],
            ...cube[2][2][1],
            ...cube[2][2][2],
        ];
        meshes.forEach((mesh) => {
            mesh.rotateOnWorldAxis(Y, (rotationFactor * Math.PI) / 2);
        });
        if (rotation === "COUNTERCLOCKWISE") {
            let tmp = cube[0][2][0];
            cube[0][2][0] = cube[0][2][2];
            cube[0][2][2] = cube[2][2][2];
            cube[2][2][2] = cube[2][2][0];
            cube[2][2][0] = tmp;
            tmp = cube[1][2][0];
            cube[1][2][0] = cube[0][2][1];
            cube[0][2][1] = cube[1][2][2];
            cube[1][2][2] = cube[2][2][1];
            cube[2][2][1] = tmp;
        } else {
            let tmp = cube[0][2][0];
            cube[0][2][0] = cube[2][2][0];
            cube[2][2][0] = cube[2][2][2];
            cube[2][2][2] = cube[0][2][2];
            cube[0][2][2] = tmp;
            tmp = cube[1][2][0];
            cube[1][2][0] = cube[2][2][1];
            cube[2][2][1] = cube[1][2][2];
            cube[1][2][2] = cube[0][2][1];
            cube[0][2][1] = tmp;
        }
    } else if (face === cube[1][0][1][0].uuid) {
        // YELLOW
        const meshes = [
            ...cube[0][0][0],
            ...cube[0][0][1],
            ...cube[0][0][2],
            ...cube[1][0][0],
            ...cube[1][0][1],
            ...cube[1][0][2],
            ...cube[2][0][0],
            ...cube[2][0][1],
            ...cube[2][0][2],
        ];
        meshes.forEach((mesh) => {
            mesh.rotateOnWorldAxis(Y, (rotationFactor * Math.PI) / 2);
        });
        if (rotation === "COUNTERCLOCKWISE") {
            let tmp = cube[0][0][0];
            cube[0][0][0] = cube[0][0][2];
            cube[0][0][2] = cube[2][0][2];
            cube[2][0][2] = cube[2][0][0];
            cube[2][0][0] = tmp;
            tmp = cube[1][0][0];
            cube[1][0][0] = cube[0][0][1];
            cube[0][0][1] = cube[1][0][2];
            cube[1][0][2] = cube[2][0][1];
            cube[2][0][1] = tmp;
        } else {
            let tmp = cube[0][0][0];
            cube[0][0][0] = cube[2][0][0];
            cube[2][0][0] = cube[2][0][2];
            cube[2][0][2] = cube[0][0][2];
            cube[0][0][2] = tmp;
            tmp = cube[1][0][0];
            cube[1][0][0] = cube[2][0][1];
            cube[2][0][1] = cube[1][0][2];
            cube[1][0][2] = cube[0][0][1];
            cube[0][0][1] = tmp;
        }
    }
}

/**
 * @returns {THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[][][][]}
 */
function generateCube() {
    const cube = [];
    const l = 1.25;
    const s = (2 * l) / 3;
    for (let z = -l; z <= l; z += l) {
        const slice = [];
        for (let y = -l; y <= l; y += l) {
            const row = [];
            for (let x = -l; x <= l; x += l) {
                if (absSum(x, y, z) === l * 3) {
                    // corner piece
                    const geo1 = new THREE.BoxGeometry(s, s, 0);
                    geo1.translate((x * 2) / 3, (y * 2) / 3, z);
                    const mesh1 = new THREE.Mesh(
                        geo1,
                        new THREE.MeshBasicMaterial(),
                    );
                    const geo2 = new THREE.BoxGeometry(0, s, s);
                    geo2.translate(x, (y * 2) / 3, (z * 2) / 3);
                    const mesh2 = new THREE.Mesh(
                        geo2,
                        new THREE.MeshBasicMaterial(),
                    );
                    const geo3 = new THREE.BoxGeometry(s, 0, s);
                    geo3.translate((x * 2) / 3, y, (z * 2) / 3);
                    const mesh3 = new THREE.Mesh(
                        geo3,
                        new THREE.MeshBasicMaterial(),
                    );
                    row.push([mesh1, mesh2, mesh3]);
                } else if (absSum(x, y, z) === l * 2) {
                    // edge piece
                    if (Math.abs(z) === l) {
                        const geo1 = new THREE.BoxGeometry(s, s, 0);
                        geo1.translate((x * 2) / 3, (y * 2) / 3, z);
                        const mesh1 = new THREE.Mesh(
                            geo1,
                            new THREE.MeshBasicMaterial(),
                        );
                        const geo2 = new THREE.BoxGeometry(
                            Math.abs(x) === l ? 0 : s,
                            Math.abs(y) === l ? 0 : s,
                            s,
                        );
                        geo2.translate(x, y, (z * 2) / 3);
                        const mesh2 = new THREE.Mesh(
                            geo2,
                            new THREE.MeshBasicMaterial(),
                        );
                        row.push([mesh1, mesh2]);
                    } else if (z === 0) {
                        const geo1 = new THREE.BoxGeometry(0, s, s);
                        geo1.translate(x, (y * 2) / 3, z);
                        const mesh1 = new THREE.Mesh(
                            geo1,
                            new THREE.MeshBasicMaterial(),
                        );
                        const geo2 = new THREE.BoxGeometry(s, 0, s);
                        geo2.translate((x * 2) / 3, y, (z * 2) / 3);
                        const mesh2 = new THREE.Mesh(
                            geo2,
                            new THREE.MeshBasicMaterial(),
                        );
                        row.push([mesh1, mesh2]);
                    }
                } else if (absSum(x, y, z) === l) {
                    // center
                    const geo = new THREE.BoxGeometry(
                        Math.abs(x) === l ? 0 : s,
                        Math.abs(y) === l ? 0 : s,
                        Math.abs(z) === l ? 0 : s,
                    );
                    geo.translate(x, y, z);
                    const mesh = new THREE.Mesh(
                        geo,
                        new THREE.MeshBasicMaterial(),
                    );
                    row.push([mesh]);
                } else {
                    row.push([]);
                }
            }
            slice.push(row);
        }
        cube.push(slice);
    }
    for (let z = 0; z < cube.length; z++) {
        for (let y = 0; y < cube[z].length; y++) {
            for (let x = 0; x < cube[z][y].length; x++) {
                for (let i = 0; i < cube[z][y][x].length; i++) {
                    solvedMap.set(cube[z][y][x][i].uuid, `${z}-${x}-${y}-${i}`);
                }
            }
        }
    }
    return cube;
}

/**
 * @param {THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[][][][]} cube
 */
function isSolved(cube) {
    for (let z = 0; z < cube.length; z++) {
        for (let y = 0; y < cube[z].length; y++) {
            for (let x = 0; x < cube[z][y].length; x++) {
                for (let i = 0; i < cube[z][y][x].length; i++) {
                    if (
                        solvedMap.get(cube[z][y][x][i].uuid) !==
                        `${z}-${x}-${y}-${i}`
                    ) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

/**
 * @param {THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[][][][]} cube
 */
function colorCube(cube) {
    const Colors = {
        BLACK: {
            color: 0x000000,
            side: THREE.DoubleSide,
        },
        RED: {
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
        },
        ORANGE: {
            color: 0xff9000,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
        },
        YELLOW: {
            color: 0xffff00,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
        },
        GREEN: {
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
        },
        BLUE: {
            color: 0x0000ff,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
        },
        WHITE: {
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
        },
    };

    cube[2][0][0][0].material.setValues(Colors.RED);
    cube[2][0][1][0].material.setValues(Colors.RED);
    cube[2][0][2][0].material.setValues(Colors.RED);
    cube[2][1][0][0].material.setValues(Colors.RED);
    cube[2][1][1][0].material.setValues(Colors.RED);
    cube[2][1][2][0].material.setValues(Colors.RED);
    cube[2][2][0][0].material.setValues(Colors.RED);
    cube[2][2][1][0].material.setValues(Colors.RED);
    cube[2][2][2][0].material.setValues(Colors.RED);

    cube[0][0][2][1].material.setValues(Colors.BLUE);
    cube[0][1][2][1].material.setValues(Colors.BLUE);
    cube[0][2][2][1].material.setValues(Colors.BLUE);
    cube[1][0][2][0].material.setValues(Colors.BLUE);
    cube[1][1][2][0].material.setValues(Colors.BLUE);
    cube[1][2][2][0].material.setValues(Colors.BLUE);
    cube[2][0][2][1].material.setValues(Colors.BLUE);
    cube[2][1][2][1].material.setValues(Colors.BLUE);
    cube[2][2][2][1].material.setValues(Colors.BLUE);

    cube[0][2][0][2].material.setValues(Colors.WHITE);
    cube[0][2][1][1].material.setValues(Colors.WHITE);
    cube[0][2][2][2].material.setValues(Colors.WHITE);
    cube[1][2][0][1].material.setValues(Colors.WHITE);
    cube[1][2][1][0].material.setValues(Colors.WHITE);
    cube[1][2][2][1].material.setValues(Colors.WHITE);
    cube[2][2][0][2].material.setValues(Colors.WHITE);
    cube[2][2][1][1].material.setValues(Colors.WHITE);
    cube[2][2][2][2].material.setValues(Colors.WHITE);

    cube[0][0][0][0].material.setValues(Colors.ORANGE);
    cube[0][0][1][0].material.setValues(Colors.ORANGE);
    cube[0][0][2][0].material.setValues(Colors.ORANGE);
    cube[0][1][0][0].material.setValues(Colors.ORANGE);
    cube[0][1][1][0].material.setValues(Colors.ORANGE);
    cube[0][1][2][0].material.setValues(Colors.ORANGE);
    cube[0][2][0][0].material.setValues(Colors.ORANGE);
    cube[0][2][1][0].material.setValues(Colors.ORANGE);
    cube[0][2][2][0].material.setValues(Colors.ORANGE);

    cube[0][0][0][1].material.setValues(Colors.GREEN);
    cube[0][1][0][1].material.setValues(Colors.GREEN);
    cube[0][2][0][1].material.setValues(Colors.GREEN);
    cube[1][0][0][0].material.setValues(Colors.GREEN);
    cube[1][1][0][0].material.setValues(Colors.GREEN);
    cube[1][2][0][0].material.setValues(Colors.GREEN);
    cube[2][0][0][1].material.setValues(Colors.GREEN);
    cube[2][1][0][1].material.setValues(Colors.GREEN);
    cube[2][2][0][1].material.setValues(Colors.GREEN);

    cube[0][0][0][2].material.setValues(Colors.YELLOW);
    cube[0][0][1][1].material.setValues(Colors.YELLOW);
    cube[0][0][2][2].material.setValues(Colors.YELLOW);
    cube[1][0][0][1].material.setValues(Colors.YELLOW);
    cube[1][0][1][0].material.setValues(Colors.YELLOW);
    cube[1][0][2][1].material.setValues(Colors.YELLOW);
    cube[2][0][0][2].material.setValues(Colors.YELLOW);
    cube[2][0][1][1].material.setValues(Colors.YELLOW);
    cube[2][0][2][2].material.setValues(Colors.YELLOW);
}

/**
 * Returns the sum of the absolute value of each of `nums`
 * @param {...number} nums
 * @returns number
 */
function absSum(...nums) {
    let sum = 0;
    for (let i = 0; i < nums.length; i++) {
        sum += Math.abs(nums[i]);
    }
    return sum;
}
