export default class EaseConfigComp {
    constructor(gameObject: any);
    static getComponent(gameObject: any): EaseConfigComp;
    private gameObject;
    ease: "Power0" | "Power1" | "Power2" | "Power3" | "Power4" | "Linear" | "Quad" | "Cubic" | "Quart" | "Quint" | "Sine" | "Expo" | "Circ" | "Elastic" | "Back" | "Bounce" | "Stepped" | "Quad.easeIn" | "Cubic.easeIn" | "Quart.easeIn" | "Quint.easeIn" | "Sine.easeIn" | "Expo.easeIn" | "Circ.easeIn" | "Elastic.easeIn" | "Back.easeIn" | "Bounce.easeIn" | "Quad.easeOut" | "Cubic.easeOut" | "Quart.easeOut" | "Quint.easeOut" | "Sine.easeOut" | "Expo.easeOut" | "Circ.easeOut" | "Elastic.easeOut" | "Back.easeOut" | "Bounce.easeOut" | "Quad.easeInOut" | "Cubic.easeInOut" | "Quart.easeInOut" | "Quint.easeInOut" | "Sine.easeInOut" | "Expo.easeInOut" | "Circ.easeInOut" | "Elastic.easeInOut" | "Back.easeInOut" | "Bounce.easeInOut";
    static getEase(obj: any, defaultValue: string): string;
}
