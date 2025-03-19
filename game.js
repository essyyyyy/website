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
        this.walls = [];
        this.raycaster = new THREE.Raycaster();
        this.inventory = [];
        this.highlightedObject = null;
        this.moveSpeed = 5.0; // Adjusted movement speed
        this.puzzleState = {
            computerSolved: false,
            safeLocked: true,
            doorLocked: true,
            hasKey: false,
            hasRedKey: false,
            hasBlueKey: false,
            hasGreenKey: false,
            terminalHacked: false,
            paintingMoved: false
        };
        this.playerCollider = new THREE.Box3();
        this.prevPosition = new THREE.Vector3();

        this.init();
        this.createInstructions();
    }

    createInstructions() {
        const instructions = document.createElement('div');
        instructions.style.position = 'fixed';
        instructions.style.left = '20px';
        instructions.style.top = '20px';
        instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        instructions.style.color = 'white';
        instructions.style.padding = '20px';
        instructions.style.borderRadius = '10px';
        instructions.style.fontFamily = 'Arial, sans-serif';
        instructions.style.zIndex = '1000';
        instructions.style.maxWidth = '300px';
        instructions.innerHTML = `
            <h2 style="margin: 0 0 10px 0; color: #4CAF50;">Escape Room Instructions</h2>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
                <li>WASD or Arrow Keys to move</li>
                <li>Mouse to look around</li>
                <li>E to interact with highlighted objects</li>
                <li>ESC to pause/unlock mouse</li>
            </ul>
            <h3 style="margin: 10px 0; color: #4CAF50;">Objectives:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
                <li>Find three colored keys</li>
                <li>Solve the computer puzzle</li>
                <li>Hack the terminal</li>
                <li>Escape the room</li>
            </ul>
        `;
        document.body.appendChild(instructions);
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        this.camera.position.set(0, 1.6, 0);
        this.controls = new PointerLockControls(this.camera, document.body);

        document.addEventListener('click', () => this.controls.lock());
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('resize', () => this.onWindowResize());

        this.createRoom();
        this.createLighting();
        this.createFurniture();
        this.createInteractiveObjects();
        this.createPuzzleElements();

        this.animate();

        document.getElementById('loading-screen').style.display = 'none';

        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Create highlight material for interactive objects
        this.highlightMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            emissive: 0x4CAF50,
            emissiveIntensity: 0.5
        });

        // Store original materials for objects
        this.originalMaterials = new Map();
    }

    createRoom() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
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

        // Create walls with collision
        const createWall = (width, height, x, y, z, rotationY = 0) => {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, 0.2),
                wallMaterial
            );
            wall.position.set(x, y, z);
            wall.rotation.y = rotationY;
            wall.receiveShadow = true;
            this.scene.add(wall);
            this.walls.push(wall);
            return wall;
        };

        // Main room walls
        createWall(20, 4, 0, 2, -10); // Back
        createWall(20, 4, 0, 2, 10, Math.PI); // Front
        createWall(20, 4, -10, 2, 0, Math.PI / 2); // Left
        createWall(20, 4, 10, 2, 0, -Math.PI / 2); // Right

        // Room dividers
        createWall(10, 4, -5, 2, 0, 0); // Middle wall
        createWall(5, 4, 5, 2, -5, Math.PI / 2); // Right room divider

        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            wallMaterial
        );
        ceiling.position.y = 4;
        ceiling.rotation.x = Math.PI / 2;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
    }

    createLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const createSpotlight = (color, x, y, z) => {
            const light = new THREE.SpotLight(color, 1);
            light.position.set(x, y, z);
            light.angle = Math.PI / 6;
            light.penumbra = 0.5;
            light.decay = 2;
            light.distance = 15;
            light.castShadow = true;
            this.scene.add(light);
            return light;
        };

        createSpotlight(0xffffff, 0, 3.5, 0);
        createSpotlight(0x2196f3, -8, 3.5, -8);
        createSpotlight(0x4caf50, 8, 3.5, -8);
        createSpotlight(0xff5722, 0, 3.5, 8);
    }

    createFurniture() {
        // Main room computer
        const desk = this.createDesk(-8, 0.4, -8);
        this.screen = this.createScreen(-8, 1.2, -8.2);
        this.objects.push(this.screen);

        // Safe behind painting
        this.safe = this.createSafe(9.8, 2, -4);
        this.objects.push(this.safe);

        // Create painting that hides the safe
        this.painting = this.createPainting(9.8, 2, -3.9);
        this.objects.push(this.painting);

        // Terminal in second room
        const terminalDesk = this.createDesk(8, 0.4, 4);
        this.terminal = this.createScreen(8, 1.2, 4.2);
        this.objects.push(this.terminal);

        // Additional furniture
        this.createBookshelf(4, 0, -9.5);
        this.createChair(-7.5, 0, -7);
    }

    createDesk(x, y, z) {
        const desk = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.8, 1),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        desk.position.set(x, y, z);
        desk.castShadow = true;
        desk.receiveShadow = true;
        this.scene.add(desk);
        return desk;
    }

    createScreen(x, y, z) {
        const screen = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.6, 0.1),
            new THREE.MeshStandardMaterial({ 
                color: 0x000000,
                emissive: 0x0000ff,
                emissiveIntensity: 0.2
            })
        );
        screen.position.set(x, y, z);
        screen.castShadow = true;
        this.scene.add(screen);
        return screen;
    }

    createSafe(x, y, z) {
        const safe = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x404040 })
        );
        safe.position.set(x, y, z);
        safe.castShadow = true;
        this.scene.add(safe);
        return safe;
    }

    createPainting(x, y, z) {
        const painting = new THREE.Mesh(
            new THREE.PlaneGeometry(1.2, 1.2),
            new THREE.MeshStandardMaterial({ 
                color: 0x8b4513,
                map: new THREE.TextureLoader().load('https://picsum.photos/256')
            })
        );
        painting.position.set(x, y, z);
        this.scene.add(painting);
        return painting;
    }

    createBookshelf(x, y, z) {
        const shelf = new THREE.Group();
        
        // Main shelf structure
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        shelf.add(base);

        // Add books
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                const book = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, 0.4, 0.3),
                    new THREE.MeshStandardMaterial({ 
                        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
                    })
                );
                book.position.set(-0.8 + j * 0.4, -1.2 + i * 0.5, 0);
                shelf.add(book);
            }
        }

        shelf.position.set(x, y + 1.5, z);
        this.scene.add(shelf);
    }

    createChair(x, y, z) {
        const chair = new THREE.Group();

        // Seat
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.1, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
        );
        chair.add(seat);

        // Back
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
        );
        back.position.set(0, 0.4, -0.25);
        chair.add(back);

        chair.position.set(x, y + 0.5, z);
        this.scene.add(chair);
    }

    createInteractiveObjects() {
        // Create colored keys
        this.redKey = this.createKey(0xff0000, -7, 0.4, -4);
        this.blueKey = this.createKey(0x0000ff, 7, 0.4, -7);
        this.greenKey = this.createKey(0x00ff00, 4, 0.4, 7);

        // Create main escape door
        this.door = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        this.door.position.set(0, 1.5, 9.9);
        this.objects.push(this.door);
        this.scene.add(this.door);
    }

    createKey(color, x, y, z) {
        const key = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8),
            new THREE.MeshStandardMaterial({ color: color })
        );
        key.rotation.x = Math.PI / 2;
        key.position.set(x, y, z);
        key.visible = false;
        this.objects.push(key);
        this.scene.add(key);
        return key;
    }

    createPuzzleElements() {
        // Add hidden numbers/clues on walls
        const createClue = (text, x, y, z, rotationY = 0) => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.font = '48px Arial';
            ctx.fillText(text, 64, 128);
            
            const texture = new THREE.CanvasTexture(canvas);
            const clue = new THREE.Mesh(
                new THREE.PlaneGeometry(0.5, 0.5),
                new THREE.MeshStandardMaterial({ map: texture, transparent: true })
            );
            clue.position.set(x, y, z);
            clue.rotation.y = rotationY;
            this.scene.add(clue);
        };

        createClue("7", -9.9, 1.5, -2, Math.PI / 2);
        createClue("3", 4, 1.5, -9.9);
        createClue("9", 9.9, 2.5, 2, -Math.PI / 2);
    }

    interact() {
        this.raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Computer interaction
            if (object === this.screen && !this.puzzleState.computerSolved) {
                this.showPrompt('Enter the code: _ _ _');
                const code = prompt('Enter the 3-digit code:');
                if (code === '739') {
                    this.solvePuzzle('computer');
                } else {
                    this.showPrompt('Wrong code. Try again.');
                }
            }
            
            // Terminal interaction
            if (object === this.terminal && !this.puzzleState.terminalHacked) {
                this.showPrompt('Terminal requires password...');
                const password = prompt('Enter password:');
                if (password === 'quantum') {
                    this.solvePuzzle('terminal');
                } else {
                    this.showPrompt('Access denied.');
                }
            }

            // Painting interaction
            if (object === this.painting && !this.puzzleState.paintingMoved) {
                this.painting.position.z += 0.5;
                this.puzzleState.paintingMoved = true;
                this.showPrompt('You moved the painting and found a safe!');
            }
            
            // Safe interaction
            if (object === this.safe && !this.puzzleState.safeLocked) {
                this.redKey.visible = true;
                this.showPrompt('You found a red key!');
                this.puzzleState.hasRedKey = true;
            }
            
            // Key interactions
            if (object === this.redKey && !this.inventory.includes('redKey')) {
                this.redKey.visible = false;
                this.inventory.push('redKey');
                this.showPrompt('Red key added to inventory');
            }
            if (object === this.blueKey && !this.inventory.includes('blueKey')) {
                this.blueKey.visible = false;
                this.inventory.push('blueKey');
                this.showPrompt('Blue key added to inventory');
            }
            if (object === this.greenKey && !this.inventory.includes('greenKey')) {
                this.greenKey.visible = false;
                this.inventory.push('greenKey');
                this.showPrompt('Green key added to inventory');
            }
            
            // Door interaction
            if (object === this.door) {
                if (this.inventory.includes('redKey') && 
                    this.inventory.includes('blueKey') && 
                    this.inventory.includes('greenKey')) {
                    this.showPrompt('Congratulations! You escaped!');
                    setTimeout(() => location.reload(), 3000);
                } else {
                    this.showPrompt('The door requires three colored keys to open.');
                }
            }
        }
    }

    solvePuzzle(type) {
        switch(type) {
            case 'computer':
                this.puzzleState.computerSolved = true;
                this.puzzleState.safeLocked = false;
                this.showPrompt('Computer unlocked! Check behind the painting...');
                break;
            case 'terminal':
                this.puzzleState.terminalHacked = true;
                this.blueKey.visible = true;
                this.showPrompt('Terminal hacked! A blue key appeared.');
                break;
        }
    }

    checkCollisions() {
        this.playerCollider.setFromObject(this.camera);
        
        for (const wall of this.walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            if (this.playerCollider.intersectsBox(wallBox)) {
                this.camera.position.copy(this.prevPosition);
                return true;
            }
        }
        
        this.prevPosition.copy(this.camera.position);
        return false;
    }

    checkInteractiveObjects() {
        this.raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects);

        // Reset previously highlighted object
        if (this.highlightedObject && this.originalMaterials.has(this.highlightedObject)) {
            this.highlightedObject.material = this.originalMaterials.get(this.highlightedObject);
        }
        this.highlightedObject = null;

        // Highlight new object
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (!this.originalMaterials.has(object)) {
                this.originalMaterials.set(object, object.material.clone());
            }
            object.material = this.highlightMaterial;
            this.highlightedObject = object;
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    updateMovement() {
        if (this.controls.isLocked) {
            const delta = 0.016; // Fixed time step
            
            // Damping
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            // Set movement direction
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            // Apply movement
            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * this.moveSpeed * delta;
            }
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * this.moveSpeed * delta;
            }

            // Store old position for collision detection
            const oldPosition = this.camera.position.clone();
            
            // Apply movement
            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);

            // Check collisions and revert if needed
            if (this.checkCollisions()) {
                this.camera.position.copy(oldPosition);
            }
        }

        // Check for interactive objects
        this.checkInteractiveObjects();
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

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updateMovement();
        this.renderer.render(this.scene, this.camera);
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
}

// Start the game
new EscapeRoom(); 
