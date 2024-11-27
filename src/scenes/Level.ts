// Level.ts
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
    
    private readonly CONFIG = {
        mainPicture: {
            scale: 1,
            width: 400,  // Optional: set specific width
            height: 300  // Optional: set specific height
        },
        shadows: {
            scale: 0.4,
            width: 300,  // Optional: set specific width
            height: 200  // Optional: set specific height
        }
    };

    constructor() {
        super({ key: "Level" });
    }

    preload(): void {
        /*this.load.image("BG", "assets/bg.png");
        this.load.image("Pic_elephant", "assets/elephant.png");
        this.load.image("shadow_elephant_t", "assets/shadow_elephant_t.png");
        this.load.image("shadow_elephant_f_1", "assets/shadow_elephant_f_1.png");
        this.load.image("shadow_elephant_f_2", "assets/shadow_elephant_f_2.png");
        this.load.image("shadow_elephant_f_3", "assets/shadow_elephant_f_3.png");*/
    }

    create(): void {
        // Setup scene
        this.setupScene();
        
        // Setup network
        this.setupNetwork();
        
        // Start the game
        this.socket.emit("clientStartGame");
    }

    private setupScene(): void {
        // Add background
        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");

        // Add picture container
        this.container_picture = this.add.image(
            this.scale.width / 2, 
            this.scale.height / 4, 
            "Pic_elephant"
        );
        this.container_picture.setScale(0.5);
        // Setup shadows
        this.setupShadows();
    }

    private setupShadows(): void {
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

            shadow.setInteractive();
            shadow.on("pointerdown", () => {
                this.socket.emit("clientGuessShadow", { guess: texture });
                // Apply shadow scaling or specific dimensions
            if (this.CONFIG.shadows.scale) {
                shadow.setScale(this.CONFIG.shadows.scale);
            } else {
                shadow.setDisplaySize(
                    this.CONFIG.shadows.width,
                    this.CONFIG.shadows.height
                );
            }
            });
        });
    }

    private setupNetwork(): void {
        this.socket = io("http://localhost:3000");

        // Handle server updates
        this.socket.on("serverGameUpdate", (gameState: GameStateContent) => {
            this.handleGameStateUpdate(gameState);
        });

        this.socket.on("serverMessage", (message: { text: string }) => {
            const color = message.text === "Game Over!" ? "#ff0000" : "#00ff00";
            this.showMessage(message.text, color);
        });
    }

    private handleGameStateUpdate(gameState: GameStateContent | null): void {
        if (!gameState) {
            // Game ended or reset
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

    private showGameOverScreen(): void {
        this.gameOverText?.destroy();

        this.gameOverText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "Game Over\nClick to Retry",
            {
                fontSize: "32px",
                color: "#ff0000",
                align: "center",
                backgroundColor: "#ffffff",
                padding: { x: 20, y: 20 }
            }
        ).setOrigin(0.5);

        this.gameOverText.setInteractive();
        this.gameOverText.on("pointerdown", () => {
            this.socket.emit("clientResetGame");
        });
    }
}