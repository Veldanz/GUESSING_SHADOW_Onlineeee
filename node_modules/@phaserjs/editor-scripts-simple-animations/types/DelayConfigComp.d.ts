export default class DelayConfigComp {
    constructor(gameObject: any);
    static getComponent(gameObject: any): DelayConfigComp;
    private gameObject;
    delay: number;
    static getDelay(obj: any, defaultValue: number): number;
}
