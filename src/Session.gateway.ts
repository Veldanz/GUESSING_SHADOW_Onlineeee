import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { GameStateContent } from "~/data/gameState";

@WebSocketGateway({
  cors: {
      origin: '*',
  },
})
export class SessionGateway {
  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('clientUpdateGameState')
  handleClientGameStateUpdate(socket: Socket, gameState: GameStateContent): void {
      const roomId = "defaultRoom";
      
      // Broadcast the client's game state to all players
      this.server.to(roomId).emit('serverBroadcastGameState', {
          ...gameState,
          senderId: socket.id
      });

      // Optional logging
      Logger.log(`Game state update from ${socket.id}`, 'SessionGateway');
  }
}