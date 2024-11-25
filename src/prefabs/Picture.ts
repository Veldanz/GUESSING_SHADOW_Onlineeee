import Phaser from "phaser";
import Level from "../scenes/Level";

export default class Picture extends Phaser.GameObjects.Image {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        this.setOrigin(0.5);
        scene.add.existing(this);
    }
}
