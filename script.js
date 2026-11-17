function createPlayer() {

    player = new THREE.Group();
    player.name = 'player';

    player.position.set(0, 0, 1);

    const geometry = new THREE.PlaneGeometry(1, 1.8);

    const material = new THREE.MeshBasicMaterial({
        color: 0x3498db,
        side: THREE.DoubleSide
    });

    const character = new THREE.Mesh(geometry, material);

    character.name = 'player-model';
    character.position.y = 0.9;

    player.add(character);
    scene.add(player);

}
