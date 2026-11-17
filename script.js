
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// CONFIGURACIÓN
// ==========================================

const MODEL_PATH = './modelos/museo.glb';

// Posición inicial de cámara
const INITIAL_POSITION = {
    x: 0,
    y: 10,
    z: 2.5
};

// Rotación inicial de cámara
const INITIAL_ROTATION = {
    x: -80,
    y: 0,
    z: 0
};

// ==========================================
// VARIABLES
// ==========================================

let scene, camera, renderer;
let player;

const cameraSettings = {
    x: INITIAL_POSITION.x,
    y: INITIAL_POSITION.y,
    z: INITIAL_POSITION.z,

    rx: INITIAL_ROTATION.x,
    ry: INITIAL_ROTATION.y,
    rz: INITIAL_ROTATION.z,

    fov: 50
};

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
    cameraSettings.fov,
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
// CREAR PERSONAJE PROVISIONAL
// ==========================================

function createPlayer() {

    player = new THREE.Group();

    player.name = 'player';

    player.position.set(0, 0, 1);

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

    camera.position.set(
        cameraSettings.x,
        cameraSettings.y,
        cameraSettings.z
    );

    camera.rotation.order = 'XYZ';

    camera.rotation.set(
        THREE.MathUtils.degToRad(cameraSettings.rx),
        THREE.MathUtils.degToRad(cameraSettings.ry),
        THREE.MathUtils.degToRad(cameraSettings.rz),
        'XYZ'
    );

    camera.fov = cameraSettings.fov;

    camera.updateProjectionMatrix();

}

// ==========================================
// CONTROLES DE CALIBRACIÓN
// ==========================================

const controls = [

    {
        name: 'X',
        key: 'x',
        min: -100,
        max: 100,
        step: 0.1,
        group: 'position'
    },

    {
        name: 'Y',
        key: 'y',
        min: -100,
        max: 100,
        step: 0.1,
        group: 'position'
    },

    {
        name: 'Z',
        key: 'z',
        min: -100,
        max: 100,
        step: 0.1,
        group: 'position'
    },

    {
        name: 'Rotación X',
        key: 'rx',
        min: -180,
        max: 180,
        step: 1,
        group: 'rotation'
    },

    {
        name: 'Rotación Y',
        key: 'ry',
        min: -180,
        max: 180,
        step: 1,
        group: 'rotation'
    },

    {
        name: 'Rotación Z',
        key: 'rz',
        min: -180,
        max: 180,
        step: 1,
        group: 'rotation'
    },

    {
        name: 'FOV',
        key: 'fov',
        min: 20,
        max: 120,
        step: 1,
        group: 'fov'
    }

];

// ==========================================
// PANEL DE CALIBRACIÓN
// ==========================================

function createCalibrationPanel() {

    const panel = document.createElement('div');

    panel.id = 'camera-panel';

    panel.innerHTML = `

        <style>

            #camera-panel {

                position: fixed;
                top: 15px;
                right: 15px;
                width: 290px;
                max-height: 90vh;
                overflow-y: auto;

                background: rgba(15,15,20,.95);
                color: white;

                padding: 18px;
                border-radius: 10px;

                z-index: 1000;

                font-family: Arial, sans-serif;
                font-size: 12px;

                box-shadow: 0 5px 25px #0008;

            }

            #camera-panel h3 {

                margin: 0 0 15px;
                font-size: 16px;
                color: #e4bd78;

            }

            #camera-panel .group {

                margin-bottom: 15px;

                border-bottom: 1px solid #444;

                padding-bottom: 10px;

            }

            #camera-panel .control {

                display: flex;
                align-items: center;
                gap: 8px;

                margin: 10px 0;

            }

            #camera-panel label {

                width: 90px;

            }

            #camera-panel input[type=range] {

                flex: 1;
                min-width: 0;

            }

            #camera-panel output {

                width: 42px;
                text-align: right;
                color: #e4bd78;

            }

            #camera-panel button {

                padding: 9px;

                border: 0;
                border-radius: 5px;

                cursor: pointer;

                background: #a77b42;
                color: white;

                font-weight: bold;
                margin: 3px;

            }

            #camera-panel button:hover {

                background: #c99a5b;

            }

            #camera-panel .buttons {

                display: flex;
                flex-wrap: wrap;

            }

            #camera-panel .hint {

                color: #aaa;
                line-height: 1.6;

            }

        </style>

        <h3>🎥 CALIBRACIÓN DE CÁMARA</h3>

        <div class="group">

            <strong>POSICIÓN</strong>

            <div id="position-controls"></div>

        </div>

        <div class="group">

            <strong>ROTACIÓN (GRADOS)</strong>

            <div id="rotation-controls"></div>

        </div>

        <div class="group">

            <strong>VISIÓN</strong>

            <div id="fov-controls"></div>

        </div>

        <div class="buttons">

            <button id="reset-camera">
                REINICIAR
            </button>

            <button id="save-camera">
                GUARDAR COORDENADAS
            </button>

        </div>

        <p class="hint">

            También puedes mover la cámara con:

            <br>W / S: adelante y atrás

            <br>A / D: izquierda y derecha

            <br>Q / E: subir y bajar

            <br>Flechas: inclinar la cámara

            <br>R / F: rotar cámara

        </p>

    `;

    document.body.appendChild(panel);

    // Crear sliders

    controls.forEach(control => {

        const container = document.getElementById(
            control.group + '-controls'
        );

        const row = document.createElement('div');

        row.className = 'control';

        row.innerHTML = `

            <label>${control.name}</label>

            <input
                type="range"
                min="${control.min}"
                max="${control.max}"
                step="${control.step}"
                value="${cameraSettings[control.key]}"
            >

            <output>
                ${cameraSettings[control.key]}
            </output>

        `;

        const input = row.querySelector('input');

        const output = row.querySelector('output');

        input.addEventListener('input', () => {

            cameraSettings[control.key] = Number(
                input.value
            );

            output.textContent = input.value;

            updateCamera();

        });

        container.appendChild(row);

    });

    // ======================================
    // REINICIAR CÁMARA
    // ======================================

    document.getElementById('reset-camera').onclick = () => {

        Object.assign(cameraSettings, {

            x: INITIAL_POSITION.x,
            y: INITIAL_POSITION.y,
            z: INITIAL_POSITION.z,

            rx: INITIAL_ROTATION.x,
            ry: INITIAL_ROTATION.y,
            rz: INITIAL_ROTATION.z,

            fov: 50

        });

        panel.querySelectorAll(
            'input[type=range]'
        ).forEach(input => {

            const label = input
                .closest('.control')
                .querySelector('label')
                .textContent;

            const control = controls.find(
                c => c.name === label
            );

            if (control) {

                input.value = cameraSettings[control.key];

                input.nextElementSibling.textContent =
                    cameraSettings[control.key];

            }

        });

        updateCamera();

    };

    // ======================================
    // GUARDAR COORDENADAS
    // ======================================

    document.getElementById('save-camera').onclick = () => {

        console.log(
            '========== CÁMARA DEFINITIVA =========='
        );

        console.log('Posición:', {

            x: cameraSettings.x,
            y: cameraSettings.y,
            z: cameraSettings.z

        });

        console.log('Rotación:', {

            x: cameraSettings.rx,
            y: cameraSettings.ry,
            z: cameraSettings.rz

        });

        console.log('FOV:', cameraSettings.fov);

        console.log('Código para utilizar:');

        console.log(`

camera.position.set(
    ${cameraSettings.x},
    ${cameraSettings.y},
    ${cameraSettings.z}
);

camera.rotation.set(
    THREE.MathUtils.degToRad(${cameraSettings.rx}),
    THREE.MathUtils.degToRad(${cameraSettings.ry}),
    THREE.MathUtils.degToRad(${cameraSettings.rz}),
    'XYZ'
);

camera.fov = ${cameraSettings.fov};

camera.updateProjectionMatrix();

        `);

        alert(
            '¡Coordenadas guardadas! Revisa la consola F12.'
        );

    };

}

// ==========================================
// ACTUALIZAR SLIDERS
// ==========================================

function updateSliders() {

    const panel = document.getElementById(
        'camera-panel'
    );

    if (!panel) return;

    panel.querySelectorAll('.control').forEach(row => {

        const label = row.querySelector('label').textContent;

        const control = controls.find(
            c => c.name === label
        );

        if (!control) return;

        const input = row.querySelector('input');

        const output = row.querySelector('output');

        input.value = cameraSettings[control.key];

        output.textContent = cameraSettings[control.key];

    });

}

// ==========================================
// TECLADO PARA CALIBRAR
// ==========================================

document.addEventListener('keydown', (event) => {

    if (event.target instanceof HTMLInputElement) return;

    if (event.target instanceof HTMLTextAreaElement) return;

    const step = event.shiftKey ? 1 : 0.2;

    const angle = event.shiftKey ? 5 : 1;

    switch (event.key.toLowerCase()) {

        case 'w':
            cameraSettings.z -= step;
            break;

        case 's':
            cameraSettings.z += step;
            break;

        case 'a':
            cameraSettings.x -= step;
            break;

        case 'd':
            cameraSettings.x += step;
            break;

        case 'q':
            cameraSettings.y += step;
            break;

        case 'e':
            cameraSettings.y -= step;
            break;

        case 'arrowup':
            cameraSettings.rx -= angle;
            break;

        case 'arrowdown':
            cameraSettings.rx += angle;
            break;

        case 'arrowleft':
            cameraSettings.ry -= angle;
            break;

        case 'arrowright':
            cameraSettings.ry += angle;
            break;

        case 'r':
            cameraSettings.rz += angle;
            break;

        case 'f':
            cameraSettings.rz -= angle;
            break;

        default:
            return;

    }

    event.preventDefault();

    updateCamera();

    updateSliders();

});

// ==========================================
// CARGAR MUSEO
// ==========================================

const loader = new GLTFLoader();

loader.load(

    MODEL_PATH,

    (gltf) => {

        // Agregar museo a la escena

        scene.add(gltf.scene);

        // Crear personaje provisional

        createPlayer();

        // Actualizar cámara

        updateCamera();

        // Ocultar pantalla de carga si existe

        const loading = document.getElementById('loading');

        if (loading) {

            loading.classList.add('hidden');

        }

        // Crear panel de calibración

        createCalibrationPanel();

        // Iniciar renderizado

        animate();

    },

    (xhr) => {

        if (xhr.total > 0) {

            const progress = (
                xhr.loaded / xhr.total
            ) * 100;

            console.log(
                `Cargando museo: ${progress.toFixed(1)}%`
            );

        }

    },

    (error) => {

        console.error(
            'Error al cargar el museo:',
            error
        );

    }

);

// ==========================================
// RENDERIZADO
// ==========================================

function animate() {

    requestAnimationFrame(animate);

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
