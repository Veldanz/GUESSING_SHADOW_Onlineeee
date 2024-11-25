import { io, Socket } from 'socket.io-client';

export class ExternalMessaging {
    private socket: Socket;

    constructor() {
        this.socket = io('http://localhost:3000');
        
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

    guessShadow(guess: any) {
        this.socket.emit('clientGuessShadow', guess);
    }
}