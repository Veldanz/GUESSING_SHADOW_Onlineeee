"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const phaser_1 = tslib_1.__importDefault(require("phaser"));
class Shadow extends phaser_1.default.GameObjects.Image {
    setInteractiveState(arg0) {
        throw new Error("Method not implemented.");
    }
    constructor(scene, x, y, texture, isCorrect) {
        super(scene, x, y, texture);
        this.isCorrect = isCorrect;
        // Add to the scene
        scene.add.existing(this);
        // Enable input interaction
        this.setInteractive();
        // Handle click interactions
        this.on("pointerdown", () => {
            // Pass the guess result to the scene's handler
            if (scene instanceof phaser_1.default.Scene) {
                const levelScene = scene; // Ensure dynamic typing here
                if (typeof levelScene.handleShadowClick === "function") {
                    levelScene.handleShadowClick(this.isCorrect);
                }
                else {
                    console.warn("handleShadowClick not found on the scene.");
                }
            }
        });
    }
}
exports.default = Shadow;
//# sourceMappingURL=Shadow.js.map