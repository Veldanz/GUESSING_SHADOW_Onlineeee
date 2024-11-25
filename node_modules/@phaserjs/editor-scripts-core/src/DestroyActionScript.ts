
// You can write more code here

/* START OF COMPILED CODE */

import ScriptNode from "./ScriptNode";
import Phaser from "phaser";
/* START-USER-IMPORTS */
import ActionTargetComp from "./ActionTargetComp";
/* END-USER-IMPORTS */

export default class DestroyActionScript extends ScriptNode {

	constructor(parent: ScriptNode | Phaser.GameObjects.GameObject | Phaser.Scene) {
		super(parent);

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	execute(...args: any[]): void {

		const obj = this.getActionTargetObject(args);

		obj?.destroy();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
