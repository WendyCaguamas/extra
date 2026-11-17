import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

// ========================================
// CONFIGURACIÓN
// ========================================

const MODEL_PATH = './modelos/museo.glb';

const MOVE_SPEED = 4;
const MOUSE_SENSITIVITY = 0.002;

// ========================================
// VARIABLES
// ========================================

let scene;
let renderer;
let camera;

let yaw = 0;
let pitch = 0;

const keys = {};

let pointerLocked = false;
let lastTime = 0;

// ========================================
// ESCENA
// ========================================

scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// ========================================
// ILUMINACIÓN
// ========================================

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
);

scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    2
);

directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// ========================================
// CARGAR MODELO 3D
// ========================================

const loader = new GLTFLoader();

loader.load(
    MODEL_PATH,

    function (gltf) {

        const museum = gltf.scene;

        scene.add(museum);

        // Buscar la cámara original del modelo.
        const modelCamera =
            gltf.cameras?.[0] ||
            museum.getObjectByProperty('isCamera', true);

        if (modelCamera) {

            // Obtener la posición y orientación globales.
            museum.updateMatrixWorld(true);

            const worldPosition = new THREE.Vector3();
            const worldQuaternion = new THREE.Quaternion();

            modelCamera.getWorldPosition(worldPosition);
            modelCamera.getWorldQuaternion(worldQuaternion);

            // Separar la cámara del modelo para poder moverla.
            scene.add(modelCamera);

            modelCamera.position.copy(worldPosition);
            modelCamera.quaternion.copy(worldQuaternion);

            camera = modelCamera;

            console.log('Cámara original del museo cargada.');

        } else {

            // Cámara alternativa si el modelo no contiene ninguna.
            camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );

            camera.position.set(0, 1.7, 5);

            scene.add(camera);

            console.warn(
                'El modelo no tiene cámara. Se utilizó una cámara alternativa.'
            );
        }

        // Preparar los ángulos para controlar la cámara.
        camera.rotation.order = 'YXZ';

        yaw = camera.rotation.y;
        pitch = camera.rotation.x;

        pitch = THREE.MathUtils.clamp(
            pitch,
            -Math.PI / 2 + 0.01,
            Math.PI / 2 - 0.01
        );

        camera.rotation.set(pitch, yaw, 0, 'YXZ');

        document.getElementById('loading').classList.add('hidden');

        console.log('Museo cargado correctamente.');

        animate();

    },

    function (progress) {

        if (progress.total > 0) {
            const percentage = Math.round(
                (progress.loaded / progress.total) * 100
            );

            document.getElementById('loading-text').textContent =
                `Cargando museo: ${percentage}%`;
        }

    },

    function (error) {

        console.error('Error cargando el museo:', error);

        document.getElementById('loading-text').textContent =
            'No se pudo cargar el modelo.';

        const errorElement = document.getElementById('error-message');

        errorElement.style.display = 'block';

        errorElement.textContent =
            'Error al cargar museo.gltf. Comprueba la ruta y el formato del archivo.';
    }
);

// ========================================
// INICIAR JUEGO
// ========================================

const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');

startButton.addEventListener('click', () => {

    if (!camera) return;

    renderer.domElement.requestPointerLock();

});

// ========================================
// CONTROL DEL MOUSE
// ========================================

document.addEventListener('pointerlockchange', () => {

    pointerLocked =
        document.pointerLockElement === renderer.domElement;

    if (pointerLocked) {
        startScreen.style.display = 'none';
    } else {
        startScreen.style.display = 'flex';
    }

});

document.addEventListener('mousemove', (event) => {

    if (!pointerLocked || !camera) return;

    yaw -= event.movementX * MOUSE_SENSITIVITY;
    pitch -= event.movementY * MOUSE_SENSITIVITY;

    pitch = THREE.MathUtils.clamp(
        pitch,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01
    );

    camera.rotation.set(
        pitch,
        yaw,
        0,
        'YXZ'
    );

});

// ========================================
// TECLADO
// ========================================

document.addEventListener('keydown', (event) => {

    const key = event.key.toLowerCase();

    if (
        ['w', 'a', 's', 'd', 'arrowup',
         'arrowdown', 'arrowleft', 'arrowright'].includes(key)
    ) {
        event.preventDefault();
    }

    keys[key] = true;

});

document.addEventListener('keyup', (event) => {

    keys[event.key.toLowerCase()] = false;

});

// Evitar que las teclas queden presionadas al perder el foco.
window.addEventListener('blur', () => {

    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

});

// ========================================
// MOVIMIENTO DEL JUGADOR
// ========================================

function movePlayer(delta) {

    if (!camera || !pointerLocked) return;

    const forward = new THREE.Vector3(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    );

    const movement = new THREE.Vector3();

    // Adelante
    if (keys['w'] || keys['arrowup']) {
        movement.add(forward);
    }

    // Atrás
    if (keys['s'] || keys['arrowdown']) {
        movement.sub(forward);
    }

    // Izquierda
    if (keys['a'] || keys['arrowleft']) {
        movement.sub(right);
    }

    // Derecha
    if (keys['d'] || keys['arrowright']) {
        movement.add(right);
    }

    if (movement.lengthSq() > 0) {

        movement.normalize();

        camera.position.addScaledVector(
            movement,
            MOVE_SPEED * delta
        );

    }

}

// ========================================
// BUCLE PRINCIPAL
// ========================================

function animate(currentTime = 0) {

    requestAnimationFrame(animate);

    const delta = Math.min(
        (currentTime - lastTime) / 1000,
        0.05
    );

    lastTime = currentTime;

    movePlayer(delta);

    if (camera) {
        renderer.render(scene, camera);
    }

}

// ========================================
// REDIMENSIONAR PANTALLA
// ========================================

window.addEventListener('resize', () => {

    if (!camera) return;

    if (camera.isPerspectiveCamera) {

        camera.aspect =
            window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();

    }

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});
