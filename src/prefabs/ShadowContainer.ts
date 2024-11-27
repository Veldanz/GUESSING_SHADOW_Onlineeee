import Phaser from "phaser";
import Shadow from "./Shadow";

export default class ShadowContainer extends Phaser.GameObjects.Container {
    private shadows: Shadow[] = [];

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        scene.add.existing(this);
    }

    public addShadow(shadow: Shadow): void {
        this.shadows.push(shadow);
        this.add(shadow);
    }

    public getShadows(): Shadow[] {
        return this.shadows;
    }

    public disableAllShadows(): void {
        this.shadows.forEach(shadow => shadow.setInteractiveState(false));
    }

    public enableAllShadows(): void {
        this.shadows.forEach(shadow => shadow.setInteractiveState(true));
    }

    getShadowByTexture(texture: string): Shadow | undefined {
        return this.shadows.find(shadow => shadow.texture.key === texture);
    }
}