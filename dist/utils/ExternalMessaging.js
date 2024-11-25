"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalMessaging = void 0;
const socket_io_client_1 = require("socket.io-client");
class ExternalMessaging {
    constructor() {
        this.socket = (0, socket_io_client_1.io)('http://localhost:3000');
        // Setup connection event handlers
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }
    // Methods to emit events
    startGame() {
        this.socket.emit('clientStartGame');
    }
    guessShadow(guess) {
        this.socket.emit('clientGuessShadow', guess);
    }
}
exports.ExternalMessaging = ExternalMessaging;
//# sourceMappingURL=ExternalMessaging.js.map