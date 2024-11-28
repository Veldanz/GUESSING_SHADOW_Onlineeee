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

  // Timer-related properties
  private timerInterval: NodeJS.Timeout | null = null;
  private timeRemaining: number = 10;
  private readonly TOTAL_TIME = 10; // Total game time
  private readonly TIMER_INTERVAL = 1000; // 1 second updates

  async handleConnection(socket: Socket): Promise<void> {
      const roomId = "defaultRoom";
      socket.join(roomId);
      Logger.log(`Player connected: ${socket.id}`, this.logContext);

      if (this.gameState) {
          this.server.to(socket.id).emit("serverGameUpdate", this.gameState);

           // Send current timer state to newly connected player
          this.server.to(socket.id).emit("serverTimerUpdate", {
            timeRemaining: this.timeRemaining,
            totalTime: this.TOTAL_TIME
        });
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
      
      // Start the synchronized timer
      this.startTimer(roomId);
      this.broadcastGameState(roomId);
      Logger.log('Game started', this.logContext);
  }

  private startTimer(roomId: string): void {
    // Reset timer
    this.timeRemaining = this.TOTAL_TIME;

    // Clear any existing interval
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
    }

    // Start new timer interval
    this.timerInterval = setInterval(() => {
        this.timeRemaining--;

        // Broadcast timer update to all players
        this.server.to(roomId).emit("serverTimerUpdate", {
            timeRemaining: this.timeRemaining,
            totalTime: this.TOTAL_TIME
        });

        // Handle timer expiration
        if (this.timeRemaining <= 0) {
            this.handleTimerExpiration(roomId);
        }
    }, this.TIMER_INTERVAL);
  }

  private handleTimerExpiration(roomId: string): void {
    // Stop the timer
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    // Broadcast game over message
    this.server.to(roomId).emit('serverMessage', { text: "Time's up! Game Over!" });
    this.gameState = null;
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

        // Stop existing timer if running
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Completely reset game state
        this.gameState = {
            shadowAnswer: "shadow_elephant_t",
            guessedShadow: [],
            wrongGuessCount: 0,
        };

        const roomId = "defaultRoom";
        
        // Restart timer
        this.startTimer(roomId);
        
        // Broadcast clean reset
        this.server.to(roomId).emit('serverGameReset');
        this.broadcastGameState(roomId);
    }

  private broadcastGameState(roomId: string): void {
      Logger.log("Broadcasting game state to all players", this.logContext);
      this.server.to(roomId).emit("serverGameUpdate", this.gameState);
  }
}