"use strict";
// You can write more code here
Object.defineProperty(exports, "__esModule", { value: true });
/* START OF COMPILED CODE */
const editor_scripts_core_1 = require("@phaserjs/editor-scripts-core");
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */
class PreloadBarUpdaterScript extends editor_scripts_core_1.ScriptNode {
    constructor(parent) {
        super(parent);
        /* START-USER-CTR-CODE */
        // Write your code here.
        /* END-USER-CTR-CODE */
    }
    /* START-USER-CODE */
    get gameObject() {
        return super.gameObject;
    }
    awake() {
        const fullWidth = this.gameObject.width;
        this.scene.load.on(Phaser.Loader.Events.PROGRESS, (p) => {
            this.gameObject.width = fullWidth * p;
        });
    }
}
exports.default = PreloadBarUpdaterScript;
/* END OF COMPILED CODE */
// You can write more code here
//# sourceMappingURL=PreloadBarUpdaterScript.js.map