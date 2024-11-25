export default class DurationConfigComp {
    constructor(gameObject: any);
    static getComponent(gameObject: any): DurationConfigComp;
    private gameObject;
    duration: number;
    static getDuration(obj: any, defaultValue: number): number;
}
