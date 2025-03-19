import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

class EscapeRoom {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.objects = [];
        this.raycaster = new THREE.Raycaster();
        this.inventory = [];
        this.puzzleState = {
            computerSolved: false,
            safeLocked: true,
            doorLocked: true,
            hasKey: false
        };

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Camera setup
        this.camera.position.y = 1.6;
        this.controls = new PointerLockControls(this.camera, document.body);

        // Event listeners
        document.addEventListener('click', () => this.controls.lock());
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('resize', () => this.onWindowResize());

        // Create room
        this.createRoom();
        this.createLighting();
        this.createFurniture();
        this.createInteractiveObjects();

        // Start game loop
        this.animate();

        // Hide loading screen
        document.getElementById('loading-screen').style.display = 'none';
    }

    createRoom() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8 
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.7
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 4),
            wallMaterial
        );
        backWall.position.z = -5;
        backWall.position.y = 2;
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Front wall with door
        const frontWallLeft = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 4),
            wallMaterial
        );
        frontWallLeft.position.z = 5;
        frontWallLeft.position.x = -3;
        frontWallLeft.position.y = 2;
        frontWallLeft.rotation.y = Math.PI;
        frontWallLeft.receiveShadow = true;
        this.scene.add(frontWallLeft);

        const frontWallRight = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 4),
            wallMaterial
        );
        frontWallRight.position.z = 5;
        frontWallRight.position.x = 3;
        frontWallRight.position.y = 2;
        frontWallRight.rotation.y = Math.PI;
        frontWallRight.receiveShadow = true;
        this.scene.add(frontWallRight);

        // Side walls
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 4),
            wallMaterial
        );
        leftWall.position.x = -5;
        leftWall.position.y = 2;
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 4),
            wallMaterial
        );
        rightWall.position.x = 5;
        rightWall.position.y = 2;
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            wallMaterial
        );
        ceiling.position.y = 4;
        ceiling.rotation.x = Math.PI / 2;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
    }

    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Main light
        const mainLight = new THREE.PointLight(0xffffff, 0.8, 20);
        mainLight.position.set(0, 3, 0);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Accent lights
        const accent1 = new THREE.PointLight(0x2196f3, 0.5, 5);
        accent1.position.set(-3, 2, -3);
        this.scene.add(accent1);

        const accent2 = new THREE.PointLight(0x4caf50, 0.5, 5);
        accent2.position.set(3, 2, -3);
        this.scene.add(accent2);
    }

    createFurniture() {
        // Create desk
        const deskGeometry = new THREE.BoxGeometry(2, 0.8, 1);
        const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(-2, 0.4, -4);
        desk.castShadow = true;
        desk.receiveShadow = true;
        this.scene.add(desk);

        // Create computer screen
        const screenGeometry = new THREE.BoxGeometry(1, 0.6, 0.1);
        const screenMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            emissive: 0x0000ff,
            emissiveIntensity: 0.2
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(-2, 1.2, -4.2);
        screen.castShadow = true;
        this.scene.add(screen);

        // Create safe
        const safeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const safeMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
        const safe = new THREE.Mesh(safeGeometry, safeMaterial);
        safe.position.set(4, 0.4, -4);
        safe.castShadow = true;
        this.objects.push(safe);
        this.scene.add(safe);
    }

    createInteractiveObjects() {
        // Create key (initially hidden)
        const keyGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
        const keyMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
        this.key = new THREE.Mesh(keyGeometry, keyMaterial);
        this.key.rotation.x = Math.PI / 2;
        this.key.position.set(4, 0.4, -4);
        this.key.visible = false;
        this.objects.push(this.key);
        this.scene.add(this.key);

        // Create door
        const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        this.door = new THREE.Mesh(doorGeometry, doorMaterial);
        this.door.position.set(0, 1.5, 5);
        this.objects.push(this.door);
        this.scene.add(this.door);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'KeyE':
                this.interact();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    interact() {
        this.raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Computer interaction
            if (object === this.screen && !this.puzzleState.computerSolved) {
                this.solvePuzzle('computer');
            }
            
            // Safe interaction
            if (object === this.safe && !this.puzzleState.safeLocked) {
                this.key.visible = true;
                this.showPrompt('You found a key!');
                this.puzzleState.hasKey = true;
            }
            
            // Key interaction
            if (object === this.key && !this.inventory.includes('key')) {
                this.key.visible = false;
                this.inventory.push('key');
                this.showPrompt('Key added to inventory');
            }
            
            // Door interaction
            if (object === this.door) {
                if (this.puzzleState.hasKey) {
                    this.showPrompt('Congratulations! You escaped!');
                    setTimeout(() => location.reload(), 3000);
                } else {
                    this.showPrompt('The door is locked. Find the key!');
                }
            }
        }
    }

    solvePuzzle(type) {
        switch(type) {
            case 'computer':
                this.puzzleState.computerSolved = true;
                this.puzzleState.safeLocked = false;
                this.showPrompt('You solved the computer puzzle! The safe is now unlocked.');
                break;
        }
    }

    showPrompt(message) {
        const prompt = document.getElementById('interaction-prompt');
        prompt.textContent = message;
        prompt.style.opacity = '1';
        setTimeout(() => prompt.style.opacity = '0', 3000);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateMovement() {
        if (this.controls.isLocked) {
            const delta = 0.1;
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * 400.0 * delta;
            }
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * 400.0 * delta;
            }

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updateMovement();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
new EscapeRoom(); 
