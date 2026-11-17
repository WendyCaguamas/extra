
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// CONFIGURACIÓN
// ==========================================

const MODEL_PATH = './modelos/museo.glb';

// Posición inicial del jugador
const PLAYER_START = {
    x: 0,
    y: 0,
    z: 1
};

// Límites del jugador
const PLAYER_LIMITS = {
    minX: -7.5,
    maxX: 7.5,

    minZ: -5,
    maxZ: 5
};

// Posición de cámara respecto al jugador
const CAMERA_OFFSET = {
    x: 0.1,
    y: 1.4,
    z: 6
};

// Rotación fija de cámara
const CAMERA_ROTATION = {
    x: -10,
    y: 0,
    z: 0
};

const CAMERA_FOV = 50;

// Velocidad del jugador
const PLAYER_SPEED = 0.08;

// ==========================================
// VARIABLES
// ==========================================

let scene;
let camera;
let renderer;
let player;

let gameStarted = false;
let museumLoaded = false;

const keys = {};

// ==========================================
// ELEMENTOS HTML
// ==========================================

const loadingScreen = document.getElementById('loading');
const loadingText = document.getElementById('loading-text');

const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

const errorMessage = document.getElementById('error-message');

// ==========================================
// ESCENA
// ==========================================

scene = new THREE.Scene();

scene.background = new THREE.Color(0x222222);

// ==========================================
// RENDERIZADOR
// ==========================================

renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

// ==========================================
// CÁMARA
// ==========================================

camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

scene.add(camera);

// ==========================================
// ILUMINACIÓN
// ==========================================

scene.add(
    new THREE.AmbientLight(0xffffff, 1.5)
);

const light = new THREE.DirectionalLight(
    0xffffff,
    2
);

light.position.set(5, 10, 5);

scene.add(light);

// ==========================================
// CREAR JUGADOR
// ==========================================

function createPlayer() {

    player = new THREE.Group();

    player.name = 'player';

    player.position.set(
        PLAYER_START.x,
        PLAYER_START.y,
        PLAYER_START.z
    );

    const geometry = new THREE.PlaneGeometry(
        1,
        1.8
    );

    const material = new THREE.MeshBasicMaterial({
        color: 0x3498db,
        side: THREE.DoubleSide
    });

    const character = new THREE.Mesh(
        geometry,
        material
    );

    character.name = 'player-model';

    character.position.y = 0.9;

    player.add(character);

    scene.add(player);

}

// ==========================================
// ACTUALIZAR CÁMARA
// ==========================================

function updateCamera() {

    if (!player) return;

    // Seguir al jugador

    camera.position.set(
        player.position.x + CAMERA_OFFSET.x,
        player.position.y + CAMERA_OFFSET.y,
        player.position.z + CAMERA_OFFSET.z
    );

    // Mantener rotación fija

    camera.rotation.order = 'XYZ';

    camera.rotation.set(
        THREE.MathUtils.degToRad(CAMERA_ROTATION.x),
        THREE.MathUtils.degToRad(CAMERA_ROTATION.y),
        THREE.MathUtils.degToRad(CAMERA_ROTATION.z),
        'XYZ'
    );

    camera.fov = CAMERA_FOV;

    camera.updateProjectionMatrix();

}

// ==========================================
// MOVIMIENTO DEL JUGADOR
// ==========================================

function updatePlayer() {

    if (!player || !gameStarted) return;

    let moveX = 0;
    let moveZ = 0;

    // Avanzar y retroceder

    if (keys['w'] || keys['arrowup']) {
        moveZ -= 1;
    }

    if (keys['s'] || keys['arrowdown']) {
        moveZ += 1;
    }

    // Movimiento lateral

    if (keys['a'] || keys['arrowleft']) {
        moveX -= 1;
    }

    if (keys['d'] || keys['arrowright']) {
        moveX += 1;
    }

    // Normalizar movimiento diagonal

    const length = Math.sqrt(
        moveX * moveX + moveZ * moveZ
    );

    if (length > 0) {

        moveX /= length;
        moveZ /= length;

    }

    // Aplicar movimiento

    player.position.x += moveX * PLAYER_SPEED;

    player.position.z += moveZ * PLAYER_SPEED;

    // Limitar eje X

    player.position.x = THREE.MathUtils.clamp(
        player.position.x,
        PLAYER_LIMITS.minX,
        PLAYER_LIMITS.maxX
    );

    // Limitar eje Z

    player.position.z = THREE.MathUtils.clamp(
        player.position.z,
        PLAYER_LIMITS.minZ,
        PLAYER_LIMITS.maxZ
    );

}

// ==========================================
// INICIAR EXPERIENCIA
// ==========================================

startButton.addEventListener('click', () => {

    if (!museumLoaded) return;

    gameStarted = true;

    // Ocultar pantalla inicial

    startScreen.style.display = 'none';

    // Limpiar teclas

    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

});

// ==========================================
// CONTROLES DE TECLADO
// ==========================================

const movementKeys = [
    'w',
    'a',
    's',
    'd',
    'arrowup',
    'arrowdown',
    'arrowleft',
    'arrowright'
];

document.addEventListener('keydown', (event) => {

    if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
    ) {
        return;
    }

    const key = event.key.toLowerCase();

    if (movementKeys.includes(key)) {

        event.preventDefault();

        keys[key] = true;

    }

});

document.addEventListener('keyup', (event) => {

    const key = event.key.toLowerCase();

    keys[key] = false;

});

// Evitar movimiento al cambiar de ventana

window.addEventListener('blur', () => {

    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

});

// ==========================================
// CARGAR MUSEO
// ==========================================

const loader = new GLTFLoader();

loader.load(

    MODEL_PATH,

    (gltf) => {

        // Agregar museo

        scene.add(gltf.scene);

        // Crear jugador

        createPlayer();

        // Posicionar cámara

        updateCamera();

        // Marcar museo como cargado

        museumLoaded = true;

        // Ocultar pantalla de carga

        loadingScreen.classList.add('hidden');

        // Habilitar botón de entrada

        startButton.disabled = false;

        startButton.textContent = 'ENTRAR AL MUSEO';

        // Iniciar renderizado

        animate();

        console.log('Museo cargado correctamente.');

    },

    (xhr) => {

        if (xhr.total > 0) {

            const progress =
                (xhr.loaded / xhr.total) * 100;

            if (loadingText) {

                loadingText.textContent =
                    `Cargando museo: ${progress.toFixed(1)}%`;

            }

        }

    },

    (error) => {

        console.error(
            'Error al cargar el museo:',
            error
        );

        loadingScreen.classList.add('hidden');

        errorMessage.textContent =
            'No se pudo cargar el museo. Comprueba la ruta del archivo museo.glb.';

        errorMessage.style.display = 'block';

    }

);

// ==========================================
// ANIMACIÓN
// ==========================================

function animate() {

    requestAnimationFrame(animate);

    // Actualizar movimiento

    updatePlayer();

    // Actualizar seguimiento de cámara

    updateCamera();

    // Renderizar

    renderer.render(scene, camera);

}

// ==========================================
// REDIMENSIONAR VENTANA
// ==========================================

window.addEventListener('resize', () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});
