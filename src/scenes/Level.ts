import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import ShadowContainer from "../prefabs/ShadowContainer";
import Shadow from "../prefabs/Shadow";
import { GameStateContent } from "~/data/gameState";

export default class Level extends Phaser.Scene {
    private socket!: Socket;
    private shadowContainer!: ShadowContainer;
    private gameState!: GameStateContent;
    
    // UI Elements
    private gameOverText?: Phaser.GameObjects.Text;
    private retryButton?: Phaser.GameObjects.Rectangle;
    private retryText?: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private container_picture!: Phaser.GameObjects.Image;
    private otherPlayerCursors: { [key: string]: Phaser.GameObjects.Image } = {};
    private localCursor?: Phaser.GameObjects.Image;

    // Configuration constants
    private readonly CONFIG = {
        mainPicture: { scale: 0.6, width: 400, height: 300 },
        shadows: { scale: 0.45, width: 300, height: 200 },
        timer: { totalTime: 10 }
    };

    constructor() {
        super({ key: "Level" });
    }

    create(): void {
        this.initializeGameState();
        this.setupScene();
        this.setupNetwork();
        this.setupMouseTracking();
        this.setupShadowInteractions();
        this.startGameTimer();
    }

    private initializeGameState(): void {
        this.gameState = {
            gameMode: 'single',
            difficulty: 'medium',
            mainPicture: {
                key: 'Pic_elephant',
                scale: this.CONFIG.mainPicture.scale,
                position: { 
                    x: this.scale.width / 2, 
                    y: this.scale.height / 3.5 
                }
            },
            shadows: [
                { 
                    texture: 'shadow_elephant_f_1', 
                    position: { x: 200, y: 800 }, 
                    isCorrect: false, 
                    isHovered: false,
                    isSelected: false 
                },
                { 
                    texture: 'shadow_elephant_f_2', 
                    position: { x: 700, y: 800 }, 
                    isCorrect: false, 
                    isHovered: false,
                    isSelected: false 
                },
                { 
                    texture: 'shadow_elephant_t', 
                    position: { x: 1200, y: 800 }, 
                    isCorrect: true, 
                    isHovered: false,
                    isSelected: false 
                },
                { 
                    texture: 'shadow_elephant_f_3', 
                    position: { x: 1700, y: 800 }, 
                    isCorrect: false, 
                    isHovered: false,
                    isSelected: false 
                }
            ],
            correctShadow: 'shadow_elephant_t',
            guessedShadows: [],
            wrongGuessCount: 0,
            maxWrongGuesses: 3,
            timeRemaining: this.CONFIG.timer.totalTime,
            totalTime: this.CONFIG.timer.totalTime,
            timerStatus: 'running',
            isGameOver: false,
            gameResult: 'ongoing',
            currentLevel: 1,
            currentPlayer: {
                id: '', // Will be set when socket connects
                mousePosition: { x: 0, y: 0 }
            },
            connectedPlayers: []
        };
    }

    private setupScene(): void {
        // Clear any existing game elements
        this.children.removeAll();

        // Background setup
        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");
        this.add.image(this.scale.width / 2, this.scale.height / 2, "GRASS");
        this.add.image(this.scale.width / 2, this.scale.height / 2, "Shadow_Panel");
        this.add.image(this.scale.width / 2, this.scale.height / 2, "Timer_Pic").setPosition(1700, 150);

        // Main picture setup
        this.container_picture = this.add.image(
            this.gameState.mainPicture.position.x, 
            this.gameState.mainPicture.position.y, 
            this.gameState.mainPicture.key
        );
        this.container_picture.setScale(this.gameState.mainPicture.scale);

        // Timer text setup
        this.timerText = this.add.text(
            this.scale.width - 265, 
            65,
            `${this.gameState.timeRemaining}`, 
            { fontSize: '150px', color: '#ffffff' }
        );
    }

    private setupNetwork(): void {
        // Disconnect previous socket if exists
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io("http://localhost:3000");
        
        // Set player ID
        this.gameState.currentPlayer.id = this.socket.id;

        // Socket event listeners for synchronization
        this.socket.on('serverGameUpdate', (gameState: GameStateContent) => {
            this.handleServerGameUpdate(gameState);
        });
    }

    private setupMouseTracking(): void {
        // Remove previous listeners to prevent duplicates
        this.input.off('pointermove');

        // Track and emit local mouse position
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.gameState.isGameOver) {
                this.updateGameState({
                    currentPlayer: {
                        ...this.gameState.currentPlayer,
                        mousePosition: { x: pointer.x, y: pointer.y }
                    }
                });
            }
        });
    }

    private setupShadowInteractions(): void {
        // Reset shadow container
        if (this.shadowContainer) {
            this.shadowContainer.destroy();
        }
        this.shadowContainer = new ShadowContainer(this, 0, 0);

        this.gameState.shadows.forEach(shadowData => {
            const shadow = new Shadow(
                this, 
                shadowData.position.x, 
                shadowData.position.y, 
                shadowData.texture, 
                shadowData.isCorrect
            );
            
            shadow.setScale(this.CONFIG.shadows.scale);
            this.shadowContainer.addShadow(shadow);

            // Interactive shadow events
            shadow.setInteractive();
            
            shadow.on('pointerover', () => this.handleShadowHover(shadowData.texture, true));
            shadow.on('pointerout', () => this.handleShadowHover(shadowData.texture, false));
            shadow.on('pointerdown', () => this.handleShadowGuess(shadowData.texture));
        });
    }

    private startGameTimer(): void {
        // Use Phaser's time events for timer
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    private updateTimer(): void {
        if (this.gameState.timerStatus === 'running') {
            this.updateGameState({
                timeRemaining: this.gameState.timeRemaining - 1
            });

            // Update timer text
            this.timerText.setText(`${this.gameState.timeRemaining}`);

            // Handle timer expiration
            if (this.gameState.timeRemaining <= 0) {
                this.handleGameOver('timeout');
            }
        }
    }

    private updateGameState(updates: Partial<GameStateContent>): void {
        // Merge updates with existing game state
        this.gameState = { 
            ...this.gameState, 
            ...updates 
        };

        // Validate game state after updates
        this.validateGameState();

        // Emit updated game state to server
        this.socket.emit('clientGameUpdate', this.gameState);
    }

    private validateGameState(): void {
        // Check for game over conditions
        if (this.gameState.wrongGuessCount >= this.gameState.maxWrongGuesses) {
            this.handleGameOver('max_wrong_guesses');
        }

        // Check for win condition
        if (this.gameState.guessedShadows.includes(this.gameState.correctShadow)) {
            this.handleGameOver('correct_guess');
        }
    }

    private handleShadowHover(texture: string, isHovering: boolean): void {
        if (this.gameState.isGameOver) return;

        // Update shadow hover state
        const updatedShadows = this.gameState.shadows.map(shadow => 
            shadow.texture === texture 
                ? { ...shadow, isHovered: isHovering }
                : shadow
        );

        this.updateGameState({ shadows: updatedShadows });

        // Local visual feedback
        const shadow = this.shadowContainer.getShadowByTexture(texture);
        if (shadow) {
            shadow.setScale(
                isHovering 
                    ? this.CONFIG.shadows.scale * 1.1 
                    : this.CONFIG.shadows.scale
            );
        }
    }

    private handleShadowGuess(texture: string): void {
        if (this.gameState.isGameOver) return;

        const isCorrect = texture === this.gameState.correctShadow;
        
        this.updateGameState({
            guessedShadows: [...this.gameState.guessedShadows, texture],
            wrongGuessCount: isCorrect 
                ? this.gameState.wrongGuessCount 
                : this.gameState.wrongGuessCount + 1,
            shadows: this.gameState.shadows.map(shadow => 
                shadow.texture === texture 
                    ? { ...shadow, isSelected: true } 
                    : shadow
            )
        });
    }

    private handleGameOver(reason: 'timeout' | 'max_wrong_guesses' | 'correct_guess'): void {
        const gameResult = reason === 'correct_guess' ? 'win' : 'lose';

        this.updateGameState({
            isGameOver: true,
            gameResult: gameResult,
            timerStatus: 'stopped'
        });

        this.showGameOverScreen(gameResult);
    }

    private showGameOverScreen(result: 'win' | 'lose'): void {
        // Clear existing game over elements
        if (this.gameOverText) this.gameOverText.destroy();
        if (this.retryButton) this.retryButton.destroy();
        if (this.retryText) this.retryText.destroy();

        const messageText = result === 'win' 
            ? "Congratulations! You Won!" 
            : "Game Over! Try Again";

        this.gameOverText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            messageText,
            {
                fontSize: "32px",
                color: result === 'win' ? "#00ff00" : "#ff0000",
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
            this.scene.restart();
        };

        this.retryButton.on('pointerdown', retryHandler);
        this.retryText.on('pointerdown', retryHandler);

        // Disable shadows
        this.shadowContainer.disableAllShadows();
    }

    private handleServerGameUpdate(gameState: GameStateContent): void {
        // Update local game state with server-synchronized state
        this.gameState = { ...gameState };

        // Synchronize UI elements
        this.updateTimerDisplay();
        this.updateShadowStates();
    }

    private updateTimerDisplay(): void {
        this.timerText.setText(`${this.gameState.timeRemaining}`);
        
        // Change color when time is low
        this.timerText.setColor(
            this.gameState.timeRemaining <= 3 ? '#ff0000' : '#ffffff'
        );
    }

    private updateShadowStates(): void {
        // Synchronize shadow visual states based on game state
        this.gameState.shadows.forEach(shadowData => {
            const shadow = this.shadowContainer.getShadowByTexture(shadowData.texture);
            if (shadow) {
                shadow.setScale(
                    shadowData.isHovered 
                        ? this.CONFIG.shadows.scale * 1.1 
                        : this.CONFIG.shadows.scale
                );
            }
        });
    }
}