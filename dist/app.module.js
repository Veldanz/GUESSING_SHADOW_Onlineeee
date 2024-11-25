"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const Session_gateway_1 = require("./Session.gateway");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [],
        providers: [Session_gateway_1.SessionGateway], // Register your gateway
        controllers: []
    })
], AppModule);
//# sourceMappingURL=app.module.js.map