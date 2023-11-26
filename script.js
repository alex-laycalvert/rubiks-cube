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
document.body.replaceChildren(renderer.domElement);

const ws = new WebSocket("ws://localhost:8888");
ws.onmessage = async (e) => {
    const cubeData = JSON.parse(e.data);
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
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster
        .intersectObjects(scene.children, false)
        .filter((i) => i.object instanceof THREE.Mesh);
    /** @type THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap> */
    const object = intersections[0]?.object;
    current = object ?? null;
    renderer.render(scene, camera);
}

render();

const mouse = {
    moving: false,
    x: 0,
    y: 0,
};

window.addEventListener("mousedown", (e) => {
    if (!current) {
        mouse.moving = true;
        return;
    }
    ws.send(
        JSON.stringify({
            event: "ROTATE",
            face: current.uuid,
            rotation: e.button === 0 ? "CLOCKWISE" : "COUNTERCLOCKWISE",
        }),
    );
});
window.addEventListener("mouseup", () => {
    mouse.moving = false;
});
window.addEventListener("mousemove", (e) => {
    if (mouse.moving) {
        const deltaX = e.clientX - mouse.x;
        const deltaY = e.clientY - mouse.y;
        scene.rotateOnWorldAxis(Y, deltaX / 250);
        scene.rotateOnWorldAxis(X, deltaY / 250);
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener("wheel", (e) => {
    camera.position.z += e.deltaY / 500;
});
window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / Settings.WIDTH) * 2 - 1;
    pointer.y = (-e.clientY / Settings.HEIGHT) * 2 + 1;
});
window.addEventListener("contextmenu", (e) => e.preventDefault());
