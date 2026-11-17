import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// CONFIGURACIÓN
// ==========================================

const MODEL_PATH = './modelos/museo.glb';
const MOVE_SPEED = 4;

const CAMERA_POSITION = new THREE.Vector3(0, 0, 0);

const CAMERA_ROTATION = new THREE.Euler(
    THREE.MathUtils.degToRad(0),
    0,
    0
);

// ==========================================
// VARIABLES
// ==========================================

let scene, camera, renderer;
let player;

let gameStarted = false;
let lastTime = 0;

const keys = {};

const cameraOffset = CAMERA_POSITION.clone();

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

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

document.body.appendChild(renderer.domElement);

// ==========================================
// CÁMARA
// ==========================================

camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.copy(CAMERA_POSITION);
camera.rotation.copy(CAMERA_ROTATION);

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
// CREAR PLAYER PROVISIONAL
// ==========================================

function createPlayer() {

    // Grupo principal del jugador.
    player = new THREE.Group();

    player.name = 'player';

    player.position.set(0, 0, 1);

    // Plano provisional.
    const geometry = new THREE.PlaneGeometry(1, 1.8);

    const material = new THREE.MeshStandardMaterial({
        color: 0x3498db,
        side: THREE.DoubleSide
    });

    const character = new THREE.Mesh(
        geometry,
        material
    );

    character.name = 'player-model';

    // Mantener el plano vertical.
    character.rotation.x = 0;

    // Centrar el plano respecto al suelo.
    character.position.y = 0.9;

    player.add(character);

    scene.add(player);

    console.log('Player creado:', player);

    // FUTURO:
    // Conectar aquí player.js para controlar el modelo,
    // animaciones, orientación y comportamiento del personaje.

}

// ==========================================
// CARGAR MUSEO
// ==========================================

const loader = new GLTFLoader();

loader.load(MODEL_PATH, (gltf) => {

    const museum = gltf.scene;

    scene.add(museum);

    console.log('Museo cargado:', museum);

    // Crear personaje después de cargar el museo.
    createPlayer();

    // Posicionar la cámara respecto al jugador.
    cameraOffset.copy(CAMERA_POSITION);

    camera.position.copy(player.position).add(cameraOffset);

    document.getElementById('loading').classList.add('hidden');

    animate();

});

// ==========================================
// INICIAR JUEGO
// ==========================================

document.getElementById('start-button').addEventListener('click', () => {

    if (!player) return;

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

    if (!gameStarted || !player) return;

    camera.getWorldDirection(forward);

    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, up).normalize();

    movement.set(0, 0, 0);

    if (keys['w'] || keys['arrowup']) {
        movement.add(forward);
    }

    if (keys['s'] || keys['arrowdown']) {
        movement.sub(forward);
    }

    if (keys['a'] || keys['arrowleft']) {
        movement.sub(right);
    }

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

    if (!player) return;

    camera.position.copy(player.position).add(cameraOffset);

    camera.rotation.copy(CAMERA_ROTATION);

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

    if (player && camera) {

        movePlayer(delta);

        updateCamera();

        renderer.render(scene, camera);

    }

}

// ==========================================
// REDIMENSIONAR
// ==========================================

window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});
