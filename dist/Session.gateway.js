"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionGateway = void 0;
const tslib_1 = require("tslib");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
// SessionGateway.ts
let SessionGateway = class SessionGateway {
    constructor() {
        this.gameState = null;
        this.logContext = "SessionGateway";
    }
    async handleConnection(socket) {
        const roomId = "defaultRoom";
        socket.join(roomId);
        common_1.Logger.log(`Player connected: ${socket.id}`, this.logContext);
        // Sync new player with current game state
        if (this.gameState) {
            this.server.to(socket.id).emit("serverGameUpdate", this.gameState);
        }
    }
    handleStartGame(socket) {
        const roomId = "defaultRoom";
        // Initialize new game state
        this.gameState = {
            shadowAnswer: 'shadow_elephant_t',
            guessedShadow: [],
            wrongGuessCount: 0,
        };
        // Broadcast new game state to all players
        this.broadcastGameState(roomId);
        common_1.Logger.log('Game started', this.logContext);
    }
    handleGuessShadow(socket, payload) {
        if (!this.gameState) {
            common_1.Logger.warn("No active game state", this.logContext);
            return;
        }
        const { guess } = payload;
        const roomId = "defaultRoom";
        // Validate guess and update game state
        if (guess === this.gameState.shadowAnswer) {
            this.server.to(roomId).emit('serverMessage', { text: "Correct! Well done!" });
            this.gameState = null; // End game
        }
        else {
            this.gameState.wrongGuessCount++;
            this.gameState.guessedShadow.push(guess);
            if (this.gameState.wrongGuessCount >= 3) {
                this.server.to(roomId).emit('serverMessage', { text: "Game Over!" });
                this.gameState = null; // End game
            }
            else {
                this.server.to(roomId).emit('serverMessage', {
                    text: `Incorrect! ${3 - this.gameState.wrongGuessCount} tries remaining!`
                });
            }
        }
        // Broadcast updated state to all players
        this.broadcastGameState(roomId);
    }
    handleResetGame(socket) {
        common_1.Logger.log(`Game reset by player: ${socket.id}`, this.logContext);
        // Reset game state
        this.gameState = {
            shadowAnswer: "shadow_elephant_t",
            guessedShadow: [],
            wrongGuessCount: 0,
        };
        this.broadcastGameState("defaultRoom");
    }
    broadcastGameState(roomId) {
        common_1.Logger.log("Broadcasting game state to all players", this.logContext);
        this.server.to(roomId).emit("serverGameUpdate", this.gameState);
    }
};
exports.SessionGateway = SessionGateway;
tslib_1.__decorate([
    (0, websockets_1.WebSocketServer)(),
    tslib_1.__metadata("design:type", socket_io_1.Server)
], SessionGateway.prototype, "server", void 0);
tslib_1.__decorate([
    (0, websockets_1.SubscribeMessage)('clientStartGame'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket]),
    tslib_1.__metadata("design:returntype", void 0)
], SessionGateway.prototype, "handleStartGame", null);
tslib_1.__decorate([
    (0, websockets_1.SubscribeMessage)('clientGuessShadow'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], SessionGateway.prototype, "handleGuessShadow", null);
tslib_1.__decorate([
    (0, websockets_1.SubscribeMessage)("clientResetGame"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [socket_io_1.Socket]),
    tslib_1.__metadata("design:returntype", void 0)
], SessionGateway.prototype, "handleResetGame", null);
exports.SessionGateway = SessionGateway = tslib_1.__decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], SessionGateway);
//# sourceMappingURL=Session.gateway.js.map