"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const phaser_1 = tslib_1.__importDefault(require("phaser"));
class ShadowContainer extends phaser_1.default.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.shadows = [];
        scene.add.existing(this);
    }
    addShadow(shadow) {
        this.shadows.push(shadow);
        this.add(shadow);
    }
    getShadows() {
        return this.shadows;
    }
    disableAllShadows() {
        this.shadows.forEach(shadow => shadow.setInteractiveState(false));
    }
    enableAllShadows() {
        this.shadows.forEach(shadow => shadow.setInteractiveState(true));
    }
}
exports.default = ShadowContainer;
//# sourceMappingURL=ShadowContainer.js.map