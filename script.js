"use strict";
import * as THREE from "three";

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);

const Settings = {
    FIELD_OF_VIEW: 75,
    ASPECT_RATIO: window.innerWidth / window.innerHeight,
    NEAR: 0.1,
    FAR: 1000,
    WIDTH: window.innerWidth,
    HEIGHT: window.innerHeight,
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    Settings.FIELD_OF_VIEW,
    Settings.ASPECT_RATIO,
    Settings.NEAR,
    Settings.FAR,
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(Settings.WIDTH, Settings.HEIGHT);

const container = document.querySelector("#rubiks-container");
if (!container) {
    throw new Error("`canvas` element must be present");
}
container.replaceChildren(renderer.domElement);

let centers = {};

const ws = new WebSocket("ws://localhost:8888");
ws.onmessage = async (e) => {
    const cubeData = JSON.parse(e.data);
    centers = cubeData.centers;
    const cube = cubeData.cube.map((s) => {
        return s.map((r) => {
            return r.map((c) => {
                return c.map((m) => {
                    const geo = new THREE.BoxGeometry();
                    geo.setAttribute(
                        "position",
                        new THREE.BufferAttribute(
                            new Float32Array(m.geometry),
                            3,
                        ),
                    );
                    const material = new THREE.MeshBasicMaterial(m.material);
                    const mesh = new THREE.Mesh(geo, material);
                    mesh.uuid = m.uuid;
                    mesh.setRotationFromEuler(m.rotation);
                    mesh.add(
                        new THREE.LineSegments(
                            mesh.geometry,
                            new THREE.LineBasicMaterial({
                                color: 0x000000,
                                transparent: false,
                                opacity: 1,
                            }),
                        ),
                    );
                    return mesh;
                });
            });
        });
    });
    scene.remove(...scene.children);
    scene.add(...cube.flat(3));
};

/** @type THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap> | null */
let current = null;
camera.position.z = 5;
function render() {
    window.requestAnimationFrame(render);
    setCurrentIntersection();
    renderer.render(scene, camera);
}

render();

const mouse = {
    moving: false,
    x: 0,
    y: 0,
};

/**
 * @param {number} x
 * @param {number} y
 */
function pan(x, y) {
    if (mouse.moving) {
        const deltaX = x - mouse.x;
        const deltaY = y - mouse.y;
        scene.rotateOnWorldAxis(Y, deltaX / 250);
        scene.rotateOnWorldAxis(X, deltaY / 250);
    }
    mouse.x = x;
    mouse.y = y;
}

/**
 * @param {number} x
 * @param {number} y
 */
function setPointer(x, y) {
    pointer.x = (x / Settings.WIDTH) * 2 - 1;
    pointer.y = (-y / Settings.HEIGHT) * 2 + 1;
}

function setCurrentIntersection() {
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster
        .intersectObjects(scene.children, false)
        .filter((i) => i.object instanceof THREE.Mesh);
    /** @type THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap> */
    const object = intersections[0]?.object;
    current = object ?? null;
}

window.addEventListener("pointerdown", (e) => {
    setPointer(e.clientX, e.clientY);
    setCurrentIntersection();
    mouse.moving = true;
    if (Math.abs(e.clientX - mouse.x) > 20) {
        mouse.x = e.clientX;
    }
    if (Math.abs(e.clientY - mouse.y) > 20) {
        mouse.y = e.clientY;
    }
    let face = centers[current?.uuid];
    if (!face) {
        return;
    }
    ws.send(
        JSON.stringify({
            event: "ROTATE",
            face,
            rotation: e.button === 0 ? "CLOCKWISE" : "COUNTERCLOCKWISE",
        }),
    );
});
window.addEventListener("pointerup", () => {
    mouse.moving = false;
});
window.addEventListener("wheel", (e) => {
    camera.position.z += e.deltaY / 500;
});
window.addEventListener("pointermove", (e) => {
    setPointer(e.clientX, e.clientY);
    pan(e.clientX, e.clientY);
});
window.addEventListener("contextmenu", (e) => e.preventDefault());
document.querySelector("#reset-button").addEventListener("click", () => {
    ws.send(
        JSON.stringify({
            event: "RESET",
        }),
    );
});
document.querySelector("#scramble-button").addEventListener("click", () => {
    ws.send(
        JSON.stringify({
            event: "SCRAMBLE",
        }),
    );
});
document.querySelector("#checkerboard-button").addEventListener("click", () => {
    ws.send(
        JSON.stringify({
            event: "CHECKERBOARD",
        }),
    );
});
document.querySelector("#zoom-out-button").addEventListener("click", () => {
    camera.position.z += 1;
});
document.querySelector("#zoom-in-button").addEventListener("click", () => {
    camera.position.z -= 1;
});
