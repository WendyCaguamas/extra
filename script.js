
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// CONFIGURACIÓN
// ==========================================

const MODEL_PATH = './modelos/museo.glb';

const MOVE_SPEED = 4;

// ==========================================
// VARIABLES
// ==========================================

let scene;
let renderer;
let camera;
let player;

let gameStarted = false;
let lastTime = 0;

// Posición inicial de la cámara respecto al jugador.
const cameraOffset = new THREE.Vector3();

// Vectores para movimiento.
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

const keys = {};

// ==========================================
// ESCENA
// ==========================================

scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// ==========================================
// ILUMINACIÓN
// ==========================================

scene.add(
    new THREE.AmbientLight(0xffffff, 1.5)
);

const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    2
);

directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// ==========================================
// CARGAR MUSEO
// ==========================================

const loader = new GLTFLoader();

loader.load(
    MODEL_PATH,

    (gltf) => {

        const museum = gltf.scene;

        scene.add(museum);

        museum.updateMatrixWorld(true);

        // Buscar los objetos por nombre.
        let originalCamera = null;
        let originalPlayer = null;

        museum.traverse((object) => {

            const name = object.name.toLowerCase();

            if (name === 'camera') {
                originalCamera = object;
            }

            if (name === 'player') {
                originalPlayer = object;
            }

        });

        // ==================================
        // VALIDAR OBJETOS
        // ==================================

        if (!originalCamera) {

            showError('No se encontró el objeto llamado "camera" en el GLB.');
            return;

        }

        if (!originalPlayer) {

            showError('No se encontró el objeto llamado "player" en el GLB.');
            return;

        }

        // ==================================
        // EXTRAER TRANSFORMACIONES GLOBALES
        // ==================================

        function detachObject(object) {

            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();

            object.updateWorldMatrix(true, false);

            object.getWorldPosition(position);
            object.getWorldQuaternion(quaternion);
            object.getWorldScale(scale);

            // Separarlo de su padre.
            if (object.parent) {
                object.parent.remove(object);
            }

            // Añadirlo directamente a la escena.
            scene.add(object);

            object.position.copy(position);
            object.quaternion.copy(quaternion);
            object.scale.copy(scale);

            return position;

        }

        // ==================================
        // CONFIGURAR PLAYER
        // ==================================

        player = originalPlayer;

        const initialPlayerPosition = detachObject(player);

        // ==================================
        // CONFIGURAR CAMERA
        // ==================================

        camera = originalCamera;

        const initialCameraPosition = detachObject(camera);

        // Conservar la orientación original de la cámara.
        const fixedCameraQuaternion = camera.quaternion.clone();

        // Calcular cuánto está desplazada la cámara
        // respecto al personaje.
        cameraOffset.subVectors(
            initialCameraPosition,
            initialPlayerPosition
        );

        // La cámara no girará durante el juego.
        camera.quaternion.copy(fixedCameraQuaternion);

        // ==================================
        // FINALIZAR CARGA
        // ==================================

        document.getElementById('loading').classList.add('hidden');

        console.log('Museo cargado correctamente.');
        console.log('Jugador:', player.name);
        console.log('Cámara:', camera.name);

        animate();

    },

    (progress) => {

        if (progress.total > 0) {

            const percentage = Math.round(
                (progress.loaded / progress.total) * 100
            );

            document.getElementById('loading-text').textContent =
                `Cargando museo: ${percentage}%`;

        }

    },

    (error) => {

        console.error(error);

        showError('No se pudo cargar el archivo museo.glb.');

    }
);

// ==========================================
// ERRORES
// ==========================================

function showError(message) {

    document.getElementById('loading').classList.add('hidden');

    const errorElement = document.getElementById('error-message');

    errorElement.style.display = 'block';
    errorElement.textContent = message;

    console.error(message);

}

// ==========================================
// INICIAR JUEGO
// ==========================================

document.getElementById('start-button').addEventListener('click', () => {

    if (!camera || !player) return;

    gameStarted = true;

    document.getElementById('start-screen').style.display = 'none';

});

// ==========================================
// CONTROLES
// ==========================================

document.addEventListener('keydown', (event) => {

    const key = event.key.toLowerCase();

    if ([
        'w', 'a', 's', 'd',
        'arrowup', 'arrowdown',
        'arrowleft', 'arrowright'
    ].includes(key)) {

        event.preventDefault();

    }

    keys[key] = true;

});

document.addEventListener('keyup', (event) => {

    keys[event.key.toLowerCase()] = false;

});

window.addEventListener('blur', () => {

    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

});

// ==========================================
// MOVIMIENTO DEL JUGADOR
// ==========================================

function movePlayer(delta) {

    if (!gameStarted || !player || !camera) return;

    // Obtener la dirección frontal de la cámara.
    camera.getWorldDirection(forward);

    // Eliminar el componente vertical.
    forward.y = 0;
    forward.normalize();

    // Obtener dirección derecha.
    right.crossVectors(forward, up).normalize();

    movement.set(0, 0, 0);

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

        player.position.addScaledVector(
            movement,
            MOVE_SPEED * delta
        );

    }

}

// ==========================================
// SEGUIMIENTO DE CÁMARA
// ==========================================

function updateCamera() {

    if (!camera || !player) return;

    // Seguir al personaje conservando
    // exactamente el desplazamiento inicial.
    camera.position.copy(player.position).add(cameraOffset);

}

// ==========================================
// BUCLE PRINCIPAL
// ==========================================

function animate(time = 0) {

    requestAnimationFrame(animate);

    const delta = Math.min(
        (time - lastTime) / 1000,
        0.05
    );

    lastTime = time;

    if (camera && player) {

        movePlayer(delta);

        updateCamera();

        renderer.render(scene, camera);

    }

}

// ==========================================
// REDIMENSIONAR
// ==========================================

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
