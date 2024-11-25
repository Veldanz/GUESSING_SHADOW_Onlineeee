"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const phaser_1 = tslib_1.__importDefault(require("phaser"));
const Level_1 = tslib_1.__importDefault(require("./scenes/Level"));
const preload_asset_pack_json_1 = tslib_1.__importDefault(require("../static/assets/preload-asset-pack.json"));
const Preload_1 = tslib_1.__importDefault(require("./scenes/Preload"));
class Boot extends phaser_1.default.Scene {
    constructor() {
        super("Boot");
    }
    preload() {
        this.load.pack("pack", preload_asset_pack_json_1.default);
    }
    create() {
        this.scene.start("Preload");
    }
}
window.addEventListener('load', function () {
    const game = new phaser_1.default.Game({
        width: 1280,
        height: 720,
        backgroundColor: "#2f2f2f",
        scale: {
            mode: phaser_1.default.Scale.ScaleModes.FIT,
            autoCenter: phaser_1.default.Scale.Center.CENTER_BOTH
        },
        scene: [Boot, Preload_1.default, Level_1.default]
    });
    game.scene.start("Boot");
});
//# sourceMappingURL=index.js.map