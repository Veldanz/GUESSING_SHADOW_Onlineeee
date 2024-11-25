"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// Level.ts
const phaser_1 = tslib_1.__importDefault(require("phaser"));
const socket_io_client_1 = require("socket.io-client");
const ShadowContainer_1 = tslib_1.__importDefault(require("../prefabs/ShadowContainer"));
const Shadow_1 = tslib_1.__importDefault(require("../prefabs/Shadow"));
class Level extends phaser_1.default.Scene {
    constructor() {
        super({ key: "Level" });
        this.CONFIG = {
            mainPicture: {
                scale: 0.15,
            },
            shadows: {
                scale: 0.13,
            }
        };
    }
    preload() {
        /*this.load.image("BG", "assets/bg.png");
        this.load.image("Pic_elephant", "assets/elephant.png");
        this.load.image("shadow_elephant_t", "assets/shadow_elephant_t.png");
        this.load.image("shadow_elephant_f_1", "assets/shadow_elephant_f_1.png");
        this.load.image("shadow_elephant_f_2", "assets/shadow_elephant_f_2.png");
        this.load.image("shadow_elephant_f_3", "assets/shadow_elephant_f_3.png");*/
    }
    create() {
        // Setup scene
        this.setupScene();
        // Setup network
        this.setupNetwork();
        // Start the game
        this.socket.emit("clientStartGame");
    }
    setupScene() {
        // Add background
        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");
        // Add main picture
        this.add
            .image(this.scale.width / 2, this.scale.height / 4, "Pic_elephant")
            .setScale(this.CONFIG.mainPicture.scale);
        // Setup shadows
        this.setupShadows();
    }
    setupShadows() {
        this.shadowContainer = new ShadowContainer_1.default(this, 0, 0);
        const shadowData = [
            { x: 150, y: 570, texture: "shadow_elephant_f_1", isCorrect: false },
            { x: 450, y: 570, texture: "shadow_elephant_f_2", isCorrect: false },
            { x: 750, y: 570, texture: "shadow_elephant_t", isCorrect: true },
            { x: 1050, y: 570, texture: "shadow_elephant_f_3", isCorrect: false },
        ];
        shadowData.forEach(({ x, y, texture, isCorrect }) => {
            const shadow = new Shadow_1.default(this, x, y, texture, isCorrect);
            shadow.setScale(this.CONFIG.shadows.scale);
            this.shadowContainer.addShadow(shadow);
            shadow.setInteractive();
            shadow.on("pointerdown", () => {
                this.socket.emit("clientGuessShadow", { guess: texture });
            });
        });
    }
    setupNetwork() {
        this.socket = (0, socket_io_client_1.io)("http://localhost:3000");
        // Handle server updates
        this.socket.on("serverGameUpdate", (gameState) => {
            this.handleGameStateUpdate(gameState);
        });
        this.socket.on("serverMessage", (message) => {
            this.showMessage(message.text, "#00ff00");
        });
    }
    handleGameStateUpdate(gameState) {
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
    showMessage(text, color) {
        const message = this.add.text(this.scale.width / 2, this.scale.height / 2, text, {
            fontSize: "32px",
            color: color,
            backgroundColor: "#ffffff",
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.time.delayedCall(2000, () => message.destroy());
    }
    showGameOverScreen() {
        var _a;
        (_a = this.gameOverText) === null || _a === void 0 ? void 0 : _a.destroy();
        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, "Game Over\nClick to Retry", {
            fontSize: "32px",
            color: "#ff0000",
            align: "center",
            backgroundColor: "#ffffff",
            padding: { x: 20, y: 20 }
        }).setOrigin(0.5);
        this.gameOverText.setInteractive();
        this.gameOverText.on("pointerdown", () => {
            this.socket.emit("clientResetGame");
        });
    }
}
exports.default = Level;
//# sourceMappingURL=Level.js.map