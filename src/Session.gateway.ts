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
  private gameState: GameStateContent | null = null;
  private readonly logContext = "SessionGateway";

  async handleConnection(socket: Socket): Promise<void> {
      const roomId = "defaultRoom";
      socket.join(roomId);
      Logger.log(`Player connected: ${socket.id}`, this.logContext);

      if (this.gameState) {
          this.server.to(socket.id).emit("serverGameUpdate", this.gameState);
      }
  }

  @SubscribeMessage('clientStartGame')
  handleStartGame(socket: Socket): void {
      const roomId = "defaultRoom";
      this.gameState = {
          shadowAnswer: 'shadow_elephant_t',
          guessedShadow: [],
          wrongGuessCount: 0,
      };
      
      this.broadcastGameState(roomId);
      Logger.log('Game started', this.logContext);
  }

  @SubscribeMessage('clientMouseMove')
  handleMouseMove(socket: Socket, payload: { x: number, y: number }): void {
      const roomId = "defaultRoom";
      // Broadcast mouse position with socket ID to identify different players
      socket.to(roomId).emit('serverMouseMove', { 
          socketId: socket.id, 
          x: payload.x, 
          y: payload.y 
      });
  }

  @SubscribeMessage('clientShadowHover')
  handleShadowHover(socket: Socket, payload: { texture: string, isHovering: boolean }): void {
      const roomId = "defaultRoom";
      // Broadcast hover state to all other players
      socket.to(roomId).emit('serverShadowHover', payload);
  }

  @SubscribeMessage('clientGameOver')
  handleGameOver(socket: Socket): void {
      const roomId = "defaultRoom";
      this.server.to(roomId).emit('serverMessage', { text: "Game Over!" });
      this.gameState = null;
  }

  @SubscribeMessage('clientGuessShadow')
  handleGuessShadow(socket: Socket, payload: { guess: string }): void {
      if (!this.gameState) {
          Logger.warn("No active game state", this.logContext);
          return;
      }

      const { guess } = payload;
      const roomId = "defaultRoom";

      if (guess === this.gameState.shadowAnswer) {
          this.server.to(roomId).emit('serverMessage', { text: "Correct! Well done!" });
          this.gameState = null;
      } else {
          this.gameState.wrongGuessCount++;
          this.gameState.guessedShadow.push(guess);

          if (this.gameState.wrongGuessCount >= 3) {
              this.server.to(roomId).emit('serverMessage', { text: "Game Over!" });
              this.gameState = null;
          } else {
              this.server.to(roomId).emit('serverMessage', { 
                  text: `Incorrect! ${3 - this.gameState.wrongGuessCount} tries remaining!` 
              });
          }
      }

      this.broadcastGameState(roomId);
  }

  @SubscribeMessage("clientResetGame")
  handleResetGame(socket: Socket): void {
      Logger.log(`Game reset by player: ${socket.id}`, this.logContext);
      this.gameState = {
          shadowAnswer: "shadow_elephant_t",
          guessedShadow: [],
          wrongGuessCount: 0,
      };
      
      // Broadcast game reset to all players
      const roomId = "defaultRoom";
      this.server.to(roomId).emit('serverGameReset');
      this.broadcastGameState(roomId);
  }

  private broadcastGameState(roomId: string): void {
      Logger.log("Broadcasting game state to all players", this.logContext);
      this.server.to(roomId).emit("serverGameUpdate", this.gameState);
  }
}