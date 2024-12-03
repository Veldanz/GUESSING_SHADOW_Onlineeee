import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import ShadowContainer from "../prefabs/ShadowContainer";
import Shadow from "../prefabs/Shadow";
import { GameStateContent, GameState } from "../data/gameState";
import { DefaultEventsMap } from "socket.io";


export default class Level extends Phaser.Scene {
    private socket!: Socket<DefaultEventsMap, DefaultEventsMap>;
    private shadowContainer!: ShadowContainer;
    private gameOverText?: Phaser.GameObjects.Text;
    private container_picture!: Phaser.GameObjects.Image;
    private timerText!: Phaser.GameObjects.Text;
    private otherPlayerCursors: { [key: string]: Phaser.GameObjects.Image } = {};
    private retryButton?: Phaser.GameObjects.Rectangle;
    private retryText?: Phaser.GameObjects.Text;
    private localCursor?: Phaser.GameObjects.Image;
    
    private gameState: GameStateContent = {
        currentState: GameState.INITIALIZING,
        mainPicture: "Pic_elephant",
        shadows: [],
        correctShadow: "shadow_elephant_t",
        guessedShadows: [],
        wrongGuessCount: 0,
        maxWrongGuesses: 3,
        timeRemaining: 10,
        totalTime: 10,
        currentPlayer: '',
        players: [],
        level: 1,
        score: 0
    };

    private readonly CONFIG = {
        mainPicture: { scale: 1, width: 400, height: 300 },
        shadows: { scale: 0.45, width: 300, height: 200 }
    };

    constructor() {
        super({ key: "Level" });
    }

    create(): void {
        this.setupScene();
        this.setupNetwork();
        this.setupMouseTracking();
        this.setupShadowInteractions();
        this.initializeGameState();
        this.initializeSocket();
    }

    private initializeSocket(): void {
        // Disconnect previous socket if exists
        if (this.socket) {
            this.socket.disconnect();
        }

        // Explicitly create the socket
        this.socket = io("http://localhost:3000", {
            // Optional: add connection options if needed
            forceNew: true,
            reconnection: true
        });
    }


    private initializeGameState(): void {
        // Ensure socket is defined before using
        if (!this.socket) {
            console.error("Socket not initialized");
            return;
        }

        this.updateGameState({
            currentState: GameState.NORMAL,
            currentPlayer: this.socket.id || '', // Provide a fallback
            players: this.socket.id ? [this.socket.id] : []
        });

        this.socket.emit("clientStartGame");
    }

    private updateGameState(newState: Partial<GameStateContent>): void {
        // Ensure socket is defined before using
        if (!this.socket) {
            console.error("Cannot update game state: Socket not initialized");
            return;
        }

        this.gameState = {
            ...this.gameState,
            ...newState
        };

        // Synchronize game state with server
        this.socket.emit('clientGameUpdate', {
            gameState: this.gameState,
            playerSocketId: this.socket.id || '' // Provide a fallback
        });

        this.handleStateTransition();
    }

    private handleStateTransition(): void {
        switch(this.gameState.currentState) {
            case GameState.CORRECT_GUESS:
                this.handleCorrectGuess();
                break;
            case GameState.INCORRECT_GUESS:
                this.handleIncorrectGuess();
                break;
            case GameState.GAME_OVER:
                this.showGameOverScreen();
                break;
            case GameState.TIME_UP:
                this.handleTimeUp();
                break;
        }
    }

    private handleCorrectGuess(): void {
        this.showMessage("Correct! Well done!", "#00ff00");
        this.updateGameState({
            score: this.gameState.score + 100,
            level: this.gameState.level + 1
        });
        this.shadowContainer.disableAllShadows();
    }

    private handleIncorrectGuess(): void {
        const remainingTries = this.gameState.maxWrongGuesses - this.gameState.wrongGuessCount;
        const message = remainingTries > 0 
            ? `Incorrect! ${remainingTries} tries remaining!`
            : "Game Over! Too many wrong guesses.";
        
        this.showMessage(message, "#ff0000");

        if (this.gameState.wrongGuessCount >= this.gameState.maxWrongGuesses) {
            this.updateGameState({ 
                currentState: GameState.GAME_OVER 
            });
        }
    }

    private handleTimeUp(): void {
        this.showMessage("Time's up!", "#ff0000");
        this.showGameOverScreen();
    }

    private setupScene(): void {
        this.children.removeAll();

        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");
        this.add.image(this.scale.width / 2, this.scale.height / 2, "GRASS");
        this.add.image(this.scale.width / 2, this.scale.height / 2, "Shadow_Panel");
        this.add.image(this.scale.width / 2, this.scale.height / 2, "Timer_Pic").setPosition(1700, 150);
        
        this.container_picture = this.add.image(
            this.scale.width / 2, 
            this.scale.height / 3.5, 
            this.gameState.mainPicture
        ).setScale(0.6);

        // Timer text
        this.timerText = this.add.text(
            this.scale.width - 265, 
            65,
            `${this.gameState.timeRemaining}`, 
            { fontSize: '150px', color: '#ffffff' }
        );
    }

    private setupNetwork(): void {
        // Ensure socket is properly initialized
        if (!this.socket) {
            console.error("Socket not initialized in setupNetwork");
            return;
        }

        // Game state synchronization
        this.socket.on("serverGameUpdate", (gameState: GameStateContent) => {
            this.gameState = gameState;
            this.handleStateTransition();
        });

        // Timer update listener
        this.socket.on("serverTimerUpdate", (data: { timeRemaining: number, totalTime: number }) => {
            this.updateTimerUI(data.timeRemaining, data.totalTime);
        });

        // Other player tracking listeners
        this.setupMultiplayerListeners();
    }

    private setupMultiplayerListeners(): void {
        // Ensure socket is defined
        if (!this.socket) {
            console.error("Socket not initialized in setupMultiplayerListeners");
            return;
        }

        // Synchronized mouse tracking
        this.socket.on('serverMouseMove', (data: { socketId: string, x: number, y: number }) => {
            if (data.socketId !== this.socket.id) {
                this.updateOtherPlayerCursor(data.socketId, data.x, data.y);
            }
        });

        // Synchronized shadow hover
        this.socket.on('serverShadowHover', (data: { texture: string, isHovering: boolean }) => {
            this.handleShadowHover(data.texture, data.isHovering);
        });
    }

    private setupMouseTracking(): void {
        // Ensure socket is defined
        if (!this.socket) {
            console.error("Socket not initialized in setupMouseTracking");
            return;
        }

        this.input.off('pointermove');
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.gameState.currentState !== GameState.GAME_OVER) {
                this.socket.emit('clientMouseMove', {
                    x: pointer.x,
                    y: pointer.y
                });
            }
        });
    }

    private setupShadowInteractions(): void {
        if (this.shadowContainer) {
            this.shadowContainer.destroy();
        }
        this.shadowContainer = new ShadowContainer(this, 0, 0);

        const shadowData = [
            { x: 200, y: 800, texture: "shadow_elephant_f_1", isCorrect: false },
            { x: 700, y: 800, texture: "shadow_elephant_f_2", isCorrect: false },
            { x: 1200, y: 800, texture: "shadow_elephant_t", isCorrect: true },
            { x: 1700, y: 800, texture: "shadow_elephant_f_3", isCorrect: false },
        ];

        shadowData.forEach(({ x, y, texture, isCorrect }) => {
            const shadow = new Shadow(this, x, y, texture, isCorrect);
            shadow.setScale(this.CONFIG.shadows.scale);
            this.shadowContainer.addShadow(shadow);

            shadow.setInteractive();
            
            shadow.on('pointerover', () => {
                if (this.gameState.currentState !== GameState.GAME_OVER) {
                    this.socket.emit('clientShadowHover', { 
                        texture: texture, 
                        isHovering: true 
                    });
                    this.handleShadowHover(texture, true);
                }
            });

            shadow.on('pointerout', () => {
                if (this.gameState.currentState !== GameState.GAME_OVER) {
                    this.socket.emit('clientShadowHover', { 
                        texture: texture, 
                        isHovering: false 
                    });
                    this.handleShadowHover(texture, false);
                }
            });

            shadow.on("pointerdown", () => {
                this.handleShadowGuess(texture);
            });
        });
    }

    private handleShadowGuess(shadowTexture: string): void {
        if (this.gameState.currentState === GameState.GAME_OVER) return;

        const isCorrect = shadowTexture === this.gameState.correctShadow;
        
        this.updateGameState({
            currentState: isCorrect ? GameState.CORRECT_GUESS : GameState.INCORRECT_GUESS,
            guessedShadows: [...this.gameState.guessedShadows, shadowTexture],
            wrongGuessCount: isCorrect ? this.gameState.wrongGuessCount : this.gameState.wrongGuessCount + 1,
            lastGuess: {
                texture: shadowTexture,
                isCorrect: isCorrect,
                timestamp: Date.now()
            }
        });
    }

    private updateTimerUI(timeRemaining: number, totalTime: number): void {
        this.gameState.timeRemaining = timeRemaining;
        this.gameState.totalTime = totalTime;

        this.timerText.setText(`${timeRemaining}`);

        if (timeRemaining <= 3) {
            this.timerText.setColor('#ff0000');
        } else {
            this.timerText.setColor('#ffffff');
        }

        if (timeRemaining <= 0) {
            this.updateGameState({ 
                currentState: GameState.TIME_UP 
            });
        }
    }

    private showGameOverScreen(): void {
        // Clear previous game over elements
        [this.gameOverText, this.retryButton, this.retryText].forEach(element => {
            if (element) element.destroy();
        });

        this.gameOverText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "Game Over",
            {
                fontSize: "32px",
                color: "#ff0000",
                align: "center",
                backgroundColor: "#ffffff",
                padding: { x: 20, y: 20 }
            }
        ).setOrigin(0.5);

        this.retryButton = this.add.rectangle(
            this.scale.width / 2, 
            this.scale.height / 2 + 100, 
            200, 
            50, 
            0x00ff00
        );
        
        this.retryText = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2 + 100, 
            "Retry", 
            { fontSize: '24px', color: '#000000' }
        ).setOrigin(0.5);

        this.retryButton.setInteractive();
        this.retryText.setInteractive();

        const retryHandler = () => {
            this.updateGameState({
                currentState: GameState.RESET,
                wrongGuessCount: 0,
                guessedShadows: [],
                timeRemaining: this.gameState.totalTime
            });
        };

        this.retryButton.on('pointerdown', retryHandler);
        this.retryText.on('pointerdown', retryHandler);

        this.shadowContainer.disableAllShadows();
    }

    private updateOtherPlayerCursor(socketId: string, x: number, y: number): void {
        if (!this.otherPlayerCursors[socketId]) {
            this.otherPlayerCursors[socketId] = this.add.image(x, y, 'otherMouse');
        } else {
            this.otherPlayerCursors[socketId].setPosition(x, y);
        }
    }

    private handleShadowHover(texture: string, isHovering: boolean): void {
        if (this.gameState.currentState === GameState.GAME_OVER) return;
    
        const shadow = this.shadowContainer.getShadowByTexture(texture);
        if (shadow) {
            shadow.setScale(
                isHovering 
                    ? this.CONFIG.shadows.scale * 1.1 
                    : this.CONFIG.shadows.scale
            );
        }
    }

    private showMessage(text: string, color: string): void {
        const message = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            text,
            {
                fontSize: "32px",
                color: color,
                backgroundColor: "#ffffff",
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        this.time.delayedCall(2000, () => message.destroy());
    }
}