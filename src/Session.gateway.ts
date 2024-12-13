import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { GameStateContent } from "~/data/gameState";

@WebSocketGateway({ cors: true })
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private gameState: GameStateContent = {} as GameStateContent;
  sessionService: any;

    handleConnection(socket: Socket) {
        console.log(`Client connected: ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        console.log(`Client disconnected: ${socket.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(socket: Socket, room: string = 'defaultRoom'): void {
        socket.join(room);
        console.log(`Client ${socket.id} joined room ${room}`);
    }

    @SubscribeMessage('clientChatMessage')
    handleChatMessage(socket: Socket, payload: any) {
      Logger.log(`chatMessage: ${JSON.stringify(payload)}`);
      const room = this.sessionService.getRoomFromSocket(socket);
  
      this.server.to(room.sid).emit('chatMessage', payload);
    }

    @SubscribeMessage('clientGameUpdate')
  handleGameUpdate(socket: Socket, payload: any) {
    const room = this.sessionService.getRoomFromSocket(socket);
    room.gameState = payload;
    console.info(`clientGameUpdate: ${JSON.stringify(room.gameState)}`);

    this.server.to(room.sid).emit('serverGameUpdate', room.gameState);
  }
}