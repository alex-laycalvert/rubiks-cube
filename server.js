import { WebSocketServer } from "ws";
import * as THREE from "three";

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

/** @type {readonly ["F", "F'", "F2", "B", "B'", "B2", "U", "U'", "U2", "D", "D'", "D2", "R", "R'", "R2", "L", "L'", "L2"]} */
const MOVES = [
    "F",
    "F'",
    "F2",
    "B",
    "B'",
    "B2",
    "U",
    "U'",
    "U2",
    "D",
    "D'",
    "D2",
    "R",
    "R'",
    "R2",
    "L",
    "L'",
    "L2",
];
/** @typedef {(typeof MOVES)[number]} Move */

const wss = new WebSocketServer({ port: 8888 });

/** @type Map<string, string> */
const solvedMap = new Map();
let cube = generateCube();

console.log("Starting Server");
wss.on("connection", (ws, req) => {
    console.log("Connection received:", req.socket.remoteAddress);
    ws.on("error", console.error);
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        switch (data.event) {
            case "ROTATE":
                rotateCubeFace(cube, data.face, data.rotation);
                broadcast(encode(cube));
                break;
            case "RESET":
                cube = generateCube();
                broadcast(encode(cube));
                break;
            case "SCRAMBLE":
                cube = generateCube();
                scrambleCube(cube);
                broadcast(encode(cube));
                break;
            case "CHECKERBOARD":
                cube = generateCube();
                execute(cube, "F2", "B2", "U2", "D2", "R2", "L2");
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
        centers: {
            [cube[2][1][1][0].uuid]: "RED",
            [cube[0][1][1][0].uuid]: "ORANGE",
            [cube[1][1][2][0].uuid]: "BLUE",
            [cube[1][1][0][0].uuid]: "GREEN",
            [cube[1][2][1][0].uuid]: "WHITE",
            [cube[1][0][1][0].uuid]: "YELLOW",
        },
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
 * @param {Move[]} moves
 */
function execute(cube, ...moves) {
    for (let i = 0; i < moves.length; i++) {
        switch (moves[i]) {
            case "F":
                rotateCubeFace(cube, "RED", "CLOCKWISE");
                continue;
            case "F'":
                rotateCubeFace(cube, "RED", "COUNTERCLOCKWISE");
                continue;
            case "F2":
                rotateCubeFace(cube, "RED", "CLOCKWISE");
                rotateCubeFace(cube, "RED", "CLOCKWISE");
                continue;
            case "B":
                rotateCubeFace(cube, "ORANGE", "CLOCKWISE");
                continue;
            case "B'":
                rotateCubeFace(cube, "ORANGE", "COUNTERCLOCKWISE");
                continue;
            case "B2":
                rotateCubeFace(cube, "ORANGE", "CLOCKWISE");
                rotateCubeFace(cube, "ORANGE", "CLOCKWISE");
                continue;
            case "U":
                rotateCubeFace(cube, "WHITE", "CLOCKWISE");
                continue;
            case "U'":
                rotateCubeFace(cube, "WHITE", "COUNTERCLOCKWISE");
                continue;
            case "U2":
                rotateCubeFace(cube, "WHITE", "CLOCKWISE");
                rotateCubeFace(cube, "WHITE", "CLOCKWISE");
                continue;
            case "D":
                rotateCubeFace(cube, "YELLOW", "CLOCKWISE");
                continue;
            case "D'":
                rotateCubeFace(cube, "YELLOW", "COUNTERCLOCKWISE");
                continue;
            case "D2":
                rotateCubeFace(cube, "YELLOW", "CLOCKWISE");
                rotateCubeFace(cube, "YELLOW", "CLOCKWISE");
                continue;
            case "R":
                rotateCubeFace(cube, "BLUE", "CLOCKWISE");
                continue;
            case "R'":
                rotateCubeFace(cube, "BLUE", "COUNTERCLOCKWISE");
                continue;
            case "R2":
                rotateCubeFace(cube, "BLUE", "CLOCKWISE");
                rotateCubeFace(cube, "BLUE", "CLOCKWISE");
                continue;
            case "L":
                rotateCubeFace(cube, "GREEN", "CLOCKWISE");
                continue;
            case "L'":
                rotateCubeFace(cube, "GREEN", "COUNTERCLOCKWISE");
                continue;
            case "L2":
                rotateCubeFace(cube, "GREEN", "CLOCKWISE");
                rotateCubeFace(cube, "GREEN", "CLOCKWISE");
                continue;
        }
    }
}

/**
 * @param {THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[][][][]} cube
 * @param {'RED'|'ORANGE'|'BLUE'|'GREEN'|'YELLOW'|'WHITE'} face
 * @param {'CLOCKWISE'|'COUNTERCLOCKWISE'} rotation
 */
function rotateCubeFace(cube, face, rotation) {
    const rotationFactor = rotation === "CLOCKWISE" ? -1 : 1;
    if (face === "RED") {
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
    } else if (face === "ORANGE") {
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
            mesh.rotateOnWorldAxis(Z, (-rotationFactor * Math.PI) / 2);
        });
        if (rotation === "CLOCKWISE") {
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
        } else {
            console.log("doing that");
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
    } else if (face === "BLUE") {
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
    } else if (face === "GREEN") {
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
            mesh.rotateOnWorldAxis(X, (-rotationFactor * Math.PI) / 2);
        });
        if (rotation === "CLOCKWISE") {
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
    } else if (face === "WHITE") {
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
    } else if (face === "YELLOW") {
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
            mesh.rotateOnWorldAxis(Y, (-rotationFactor * Math.PI) / 2);
        });
        if (rotation === "CLOCKWISE") {
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
    colorCube(cube);
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

/**
 * @param {THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[][][][]} cube
 */
function scrambleCube(cube) {
    for (let i = 0; i < 20; i++) {
        execute(cube, MOVES[Math.floor(Math.random() * MOVES.length)]);
    }
}
