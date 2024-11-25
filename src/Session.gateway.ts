import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { GameStateContent } from "~/data/gameState";


// SessionGateway.ts
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

      // Sync new player with current game state
      if (this.gameState) {
          this.server.to(socket.id).emit("serverGameUpdate", this.gameState);
      }
  }

  @SubscribeMessage('clientStartGame')
  handleStartGame(socket: Socket): void {
      const roomId = "defaultRoom";
      // Initialize new game state
      this.gameState = {
          shadowAnswer: 'shadow_elephant_t',
          guessedShadow: [],
          wrongGuessCount: 0,
      };
      
      // Broadcast new game state to all players
      this.broadcastGameState(roomId);
      Logger.log('Game started', this.logContext);
  }

  @SubscribeMessage('clientGuessShadow')
  handleGuessShadow(socket: Socket, payload: { guess: string }): void {
      if (!this.gameState) {
          Logger.warn("No active game state", this.logContext);
          return;
      }

      const { guess } = payload;
      const roomId = "defaultRoom";

      // Validate guess and update game state
      if (guess === this.gameState.shadowAnswer) {
          this.server.to(roomId).emit('serverMessage', { text: "Correct! Well done!" });
          this.gameState = null; // End game
      } else {
          this.gameState.wrongGuessCount++;
          this.gameState.guessedShadow.push(guess);

          if (this.gameState.wrongGuessCount >= 3) {
              this.server.to(roomId).emit('serverMessage', { text: "Game Over!" });
              this.gameState = null; // End game
          } else {
              this.server.to(roomId).emit('serverMessage', { 
                  text: `Incorrect! ${3 - this.gameState.wrongGuessCount} tries remaining!` 
              });
          }
      }

      // Broadcast updated state to all players
      this.broadcastGameState(roomId);
  }

  @SubscribeMessage("clientResetGame")
  handleResetGame(socket: Socket): void {
      Logger.log(`Game reset by player: ${socket.id}`, this.logContext);
      // Reset game state
      this.gameState = {
          shadowAnswer: "shadow_elephant_t",
          guessedShadow: [],
          wrongGuessCount: 0,
      };
      
      this.broadcastGameState("defaultRoom");
  }

  private broadcastGameState(roomId: string): void {
      Logger.log("Broadcasting game state to all players", this.logContext);
      this.server.to(roomId).emit("serverGameUpdate", this.gameState);
  }
}