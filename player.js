
import * as THREE from 'three';

export function applyPlayerTexture(player) {

    const textureLoader = new THREE.TextureLoader();

    textureLoader.load('./modelos/she.png', (texture) => {

        texture.colorSpace = THREE.SRGBColorSpace;

        player.traverse((child) => {

            if (child.isMesh && child.name === 'player-model') {

                child.material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                });

            }

        });

    });

}
