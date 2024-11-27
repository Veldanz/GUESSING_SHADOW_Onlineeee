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
    private gameTimer!: Phaser.Time.TimerEvent;
    private timeRemaining: number = 10;
    private otherPlayerCursors: { [key: string]: Phaser.GameObjects.Image } = {};
    private retryButton?: Phaser.GameObjects.Rectangle;
    private retryText?: Phaser.GameObjects.Text;
    
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
        this.setupScene();
        this.setupNetwork();
        this.setupTimer();
        this.setupMouseTracking();
        this.setupShadowInteractions();
        this.socket.emit("clientStartGame");
    }

    private setupScene(): void {
        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");

        this.container_picture = this.add.image(
            this.scale.width / 2, 
            this.scale.height / 4, 
            "Pic_elephant"
        );
        this.container_picture.setScale(0.5);

        this.timerText = this.add.text(
            this.scale.width - 100, 
            50, 
            `Time: ${this.timeRemaining}`, 
            { fontSize: '24px', color: '#ffffff' }
        );
    }

    private setupTimer(): void {
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    private updateTimer(): void {
        this.timeRemaining--;
        this.timerText.setText(`Time: ${this.timeRemaining}`);

        if (this.timeRemaining <= 0) {
            this.gameTimer.remove();
            this.socket.emit("clientGameOver");
        }
    }

    private setupMouseTracking(): void {
        // Track and emit local mouse position
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.socket.emit('clientMouseMove', {
                x: pointer.x,
                y: pointer.y
            });
        });
    }

    private setupShadowInteractions(): void {
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
            
            shadow.on('pointerover', () => {
                this.socket.emit('clientShadowHover', { 
                    texture: texture, 
                    isHovering: true 
                });
            });

            shadow.on('pointerout', () => {
                this.socket.emit('clientShadowHover', { 
                    texture: texture, 
                    isHovering: false 
                });
            });

            shadow.on("pointerdown", () => {
                this.socket.emit("clientGuessShadow", { guess: texture });
            });
        });
    }

    private setupNetwork(): void {
        this.socket = io("http://localhost:3000");

        // Game state updates
        this.socket.on("serverGameUpdate", (gameState: GameStateContent) => {
            this.handleGameStateUpdate(gameState);
        });

        // Synchronized messages
        this.socket.on("serverMessage", (message: { text: string }) => {
            this.showMessage(message.text, message.text === "Game Over!" ? "#ff0000" : "#00ff00");
        });

        // Synchronized mouse tracking
        this.socket.on('serverMouseMove', (data: { socketId: string, x: number, y: number }) => {
            this.updateOtherPlayerCursor(data.socketId, data.x, data.y);
        });

        // Synchronized shadow hover
        this.socket.on('serverShadowHover', (data: { texture: string, isHovering: boolean }) => {
            this.handleShadowHover(data.texture, data.isHovering);
        });

        // Synchronized game reset
        this.socket.on('serverGameReset', () => {
            this.scene.restart();
        });
    }

    private updateOtherPlayerCursor(socketId: string, x: number, y: number): void {
        // Create or update cursor for each player
        if (!this.otherPlayerCursors[socketId]) {
            this.otherPlayerCursors[socketId] = this.add.image(x, y, 'cursor');
        } else {
            this.otherPlayerCursors[socketId].setPosition(x, y);
        }
    }

    private handleShadowHover(texture: string, isHovering: boolean): void {
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
    }

    private handleGameStateUpdate(gameState: GameStateContent | null): void {
        if (!gameState) {
            this.shadowContainer.enableAllShadows();
            return;
        }

        if (gameState.wrongGuessCount >= 3) {
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