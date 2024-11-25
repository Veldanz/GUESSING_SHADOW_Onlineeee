"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const phaser_1 = tslib_1.__importDefault(require("phaser"));
class Picture extends phaser_1.default.GameObjects.Image {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.setOrigin(0.5);
        scene.add.existing(this);
    }
}
exports.default = Picture;
//# sourceMappingURL=Picture.js.map