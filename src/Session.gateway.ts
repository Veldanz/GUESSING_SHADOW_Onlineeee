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
  private readonly logContext = "SessionGateway";

  async handleConnection(socket: Socket): Promise<void> {
      const roomId = "defaultRoom";
      socket.join(roomId);
      Logger.log(`Player connected: ${socket.id}`, this.logContext);
  }

    @SubscribeMessage('clientGameUpdate')
    handleGameUpdate(socket: Socket, gameState: GameStateContent): void {
        const roomId = "defaultRoom";
        // Simply broadcast the received game state to all players
        this.server.to(roomId).emit('serverGameUpdate', gameState);
    }
}