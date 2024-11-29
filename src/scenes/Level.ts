import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import ShadowContainer from "../prefabs/ShadowContainer";
import Shadow from "../prefabs/Shadow";
import { GameStateContent } from "~/data/gameState";

export default class Level extends Phaser.Scene {
    private socket!: Socket;
    private shadowContainer!: ShadowContainer;
    private gameOverText?: Phaser.GameObjects.Text;
    private container_picture!: Phaser.GameObjects.Image;
    private timerText!: Phaser.GameObjects.Text;
    private timerBar!: Phaser.GameObjects.Rectangle;
    private timeRemaining: number = 10;
    private totalTime: number = 10;
    private otherPlayerCursors: { [key: string]: Phaser.GameObjects.Image } = {};
    private retryButton?: Phaser.GameObjects.Rectangle;
    private retryText?: Phaser.GameObjects.Text;
    private isGameOver: boolean = false;
    private localCursor?: Phaser.GameObjects.Image;
    
    private readonly CONFIG = {
        mainPicture: {
            scale: 1,
            width: 400,
            height: 300
        },
        shadows: {
            scale: 0.4,
            width: 300,
            height: 200
        }
    };

    constructor() {
        super({ key: "Level" });
    }

    create(): void {
        this.isGameOver = false;
        this.setupScene();
        this.setupNetwork();
        this.setupMouseTracking();
        this.setupShadowInteractions();
        this.socket.emit("clientStartGame");
    }

    private setupScene(): void {
        // Clear any existing game elements
        this.children.removeAll();

        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");

        this.container_picture = this.add.image(
            this.scale.width / 2, 
            this.scale.height / 4, 
            "Pic_elephant"
        );
        this.container_picture.setScale(0.5);

        // Timer text
        this.timerText = this.add.text(
            this.scale.width - 150, 
            50, 
            `Time: ${this.timeRemaining}`, 
            { fontSize: '24px', color: '#ffffff' }
        );

        // Timer progress bar
        this.timerBar = this.add.rectangle(
            this.scale.width - 150, 
            80, 
            100, 
            10, 
            0x00ff00
        );

        // Remove any existing local cursor
        if (this.localCursor) {
            this.localCursor.destroy();
        }
    }

    private setupMouseTracking(): void {
        // Remove previous listeners to prevent duplicates
        this.input.off('pointermove');

        // Track and emit local mouse position
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isGameOver) {
                this.socket.emit('clientMouseMove', {
                    x: pointer.x,
                    y: pointer.y
                });
            }
        });
    }

    private setupShadowInteractions(): void {
        // Reset shadow container
        if (this.shadowContainer) {
            this.shadowContainer.destroy();
        }
        this.shadowContainer = new ShadowContainer(this, 0, 0);

        const shadowData = [
            { x: 150, y: 570, texture: "shadow_elephant_f_1", isCorrect: false },
            { x: 450, y: 570, texture: "shadow_elephant_f_2", isCorrect: false },
            { x: 750, y: 570, texture: "shadow_elephant_t", isCorrect: true },
            { x: 1050, y: 570, texture: "shadow_elephant_f_3", isCorrect: false },
        ];

        shadowData.forEach(({ x, y, texture, isCorrect }) => {
            const shadow = new Shadow(this, x, y, texture, isCorrect);
            shadow.setScale(this.CONFIG.shadows.scale);
            this.shadowContainer.addShadow(shadow);

            // Synchronized hover effects
            shadow.setInteractive();
            
            // Only allow interactions if not game over
            shadow.on('pointerover', () => {
                if (!this.isGameOver) {
                    this.socket.emit('clientShadowHover', { 
                        texture: texture, 
                        isHovering: true 
                    });

                    // Local hover effect
                    this.handleShadowHover(texture, true);
                }
            });

            shadow.on('pointerout', () => {
                if (!this.isGameOver) {
                    this.socket.emit('clientShadowHover', { 
                        texture: texture, 
                        isHovering: false 
                    });

                    // Local hover effect
                    this.handleShadowHover(texture, false);
                }
            });

            shadow.on("pointerdown", () => {
                if (!this.isGameOver) {
                    this.socket.emit("clientGuessShadow", { guess: texture });
                }
            });
        });
    }

    private setupNetwork(): void {
        // Disconnect previous socket if exists
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io("http://localhost:3000");

        // Timer update listener
        this.socket.on("serverTimerUpdate", (data: { timeRemaining: number, totalTime: number }) => {
            this.updateTimerUI(data.timeRemaining, data.totalTime);
        });

        // Game state updates
        this.socket.on("serverGameUpdate", (gameState: GameStateContent) => {
            this.handleGameStateUpdate(gameState);
        });

        // Synchronized messages
        this.socket.on("serverMessage", (message: { text: string }) => {
            this.showMessage(message.text, message.text === "Game Over!" ? "#ff0000" : "#00ff00");
            
            // Check if game is over
            if (message.text === "Game Over!") {
                this.isGameOver = true;
                this.shadowContainer.disableAllShadows();
            }
        });

        // Synchronized mouse tracking
        this.socket.on('serverMouseMove', (data: { socketId: string, x: number, y: number }) => {
            // Only update other player's cursor if not the local player
            if (data.socketId !== this.socket.id) {
                this.updateOtherPlayerCursor(data.socketId, data.x, data.y);
            }
        });

        // Synchronized shadow hover
        this.socket.on('serverShadowHover', (data: { texture: string, isHovering: boolean }) => {
            this.handleShadowHover(data.texture, data.isHovering);
        });

        // Synchronized game reset
        this.socket.on('serverGameReset', () => {
            this.resetGameState();
        });
    }

    private resetGameState(): void {
        this.isGameOver = false;
        
        // Clear game over elements
        if (this.gameOverText) this.gameOverText.destroy();
        if (this.retryButton) this.retryButton.destroy();
        if (this.retryText) this.retryText.destroy();

        // Reset scene
        this.setupScene();
        this.setupShadowInteractions();
        this.setupMouseTracking();

        // Recreate other player cursors
        Object.values(this.otherPlayerCursors).forEach(cursor => cursor.destroy());
        this.otherPlayerCursors = {};
    }

    private updateTimerUI(timeRemaining: number, totalTime: number): void {
        this.timeRemaining = timeRemaining;
        this.totalTime = totalTime;

        // Update timer text
        this.timerText.setText(`Time: ${this.timeRemaining}`);

        // Update timer bar width
        const barWidth = (timeRemaining / totalTime) * 100;
        this.timerBar.width = barWidth;

        // Change color and text when time is low
        if (this.timeRemaining <= 3) {
            this.timerText.setColor('#ff0000');
            this.timerBar.setFillStyle(0xff0000);
        } else {
            this.timerText.setColor('#ffffff');
            this.timerBar.setFillStyle(0x00ff00);
        }

        // Handle game over when time expires
        if (this.timeRemaining <= 0) {
            this.isGameOver = true;
            this.showGameOverScreen();
        }
    }

    private updateOtherPlayerCursor(socketId: string, x: number, y: number): void {
        // Create or update cursor for each player (excluding local player)
        if (!this.otherPlayerCursors[socketId]) {
            this.otherPlayerCursors[socketId] = this.add.image(x, y, 'cursor');
        } else {
            this.otherPlayerCursors[socketId].setPosition(x, y);
        }
    }

    private handleShadowHover(texture: string, isHovering: boolean): void {
        if (this.isGameOver) return;

        const shadow = this.shadowContainer.getShadowByTexture(texture);
        if (shadow) {
            if (isHovering) {
                this.tweens.add({
                    targets: shadow,
                    scaleX: this.CONFIG.shadows.scale * 1.1,
                    scaleY: this.CONFIG.shadows.scale * 1.1,
                    duration: 200
                });
            } else {
                this.tweens.add({
                    targets: shadow,
                    scaleX: this.CONFIG.shadows.scale,
                    scaleY: this.CONFIG.shadows.scale,
                    duration: 200
                });
            }
        }
    }

    private showGameOverScreen(): void {
        // Clear any existing game over elements
        if (this.gameOverText) this.gameOverText.destroy();
        if (this.retryButton) this.retryButton.destroy();
        if (this.retryText) this.retryText.destroy();

        this.gameOverText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "Game Over",
            {
                fontSize: "32px",
                color: "#ff0000",
                align: "center",
                backgroundColor: "#ffffff",
                padding: { x: 20, y: 20 }
            }
        ).setOrigin(0.5);

        this.retryButton = this.add.rectangle(
            this.scale.width / 2, 
            this.scale.height / 2 + 100, 
            200, 
            50, 
            0x00ff00
        );
        
        this.retryText = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2 + 100, 
            "Retry", 
            { fontSize: '24px', color: '#000000' }
        ).setOrigin(0.5);

        this.retryButton.setInteractive();
        this.retryText.setInteractive();

        const retryHandler = () => {
            this.socket.emit("clientResetGame");
        };

        this.retryButton.on('pointerdown', retryHandler);
        this.retryText.on('pointerdown', retryHandler);

        // Disable shadows
        this.shadowContainer.disableAllShadows();
    }

    private handleGameStateUpdate(gameState: GameStateContent | null): void {
        if (!gameState) {
            this.shadowContainer.enableAllShadows();
            return;
        }

        if (gameState.wrongGuessCount >= 3) {
            this.isGameOver = true;
            this.showGameOverScreen();
            this.shadowContainer.disableAllShadows();
        }
    }

    private showMessage(text: string, color: string): void {
        const message = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            text,
            {
                fontSize: "32px",
                color: color,
                backgroundColor: "#ffffff",
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        this.time.delayedCall(2000, () => message.destroy());
    }
}