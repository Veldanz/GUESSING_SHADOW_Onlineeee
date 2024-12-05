import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import ShadowContainer from "../prefabs/ShadowContainer";
import Shadow from "../prefabs/Shadow";
import { GameStateContent } from "~/data/gameState";

export default class Level extends Phaser.Scene {
    private socket: Socket | null = null;
    private shadowContainer!: ShadowContainer;
    private gameState!: GameStateContent;

    constructor() {
        super({ key: "Level" });
    }

    create(): void {
        this.initializeGameState();
        this.setupNetwork();
        this.setupScene();
    }

    private initializeGameState(): void {
        this.gameState = {
            currentState: 'GameStartState',
            gameMode: 'single',
            difficulty: 'medium',
            mainPicture: {
                key: 'Pic_elephant',
                scale: 0.6,
                position: { x: this.scale.width / 2, y: this.scale.height / 3.5 }
            },
            shadows: [
                { texture: 'shadow_elephant_f_1', position: { x: 200, y: 800 }, isCorrect: false, isHovered: false, isSelected: false },
                { texture: 'shadow_elephant_f_2', position: { x: 700, y: 800 }, isCorrect: false, isHovered: false, isSelected: false },
                { texture: 'shadow_elephant_t', position: { x: 1200, y: 800 }, isCorrect: true, isHovered: false, isSelected: false },
                { texture: 'shadow_elephant_f_3', position: { x: 1700, y: 800 }, isCorrect: false, isHovered: false, isSelected: false }
            ],
            correctShadow: 'shadow_elephant_t',
            guessedShadow: null,
            playerWrongCount: 0,
            playerMaxWrong: 3,
            timeRemaining: 60,
            totalTime: 60,
            timerStatus: 'stopped',
            currentLevel: 1,
            currentPlayer: { id: '', mousePosition: { x: 0, y: 0 } },
            connectedPlayers: []
        };
    }

    private setupScene(): void {
        this.children.removeAll();
        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");
        this.add.image(this.scale.width / 2, this.scale.height / 2, "GRASS");

        // Main picture
        const mainPicture = this.gameState.mainPicture;
        this.add.image(mainPicture.position.x, mainPicture.position.y, mainPicture.key).setScale(mainPicture.scale);

        this.setupShadowInteractions();
        this.safeUpdateGameState({ currentState: 'WaitingState' });
    }

    private setupShadowInteractions(): void {
        if (this.shadowContainer) {
            this.shadowContainer.destroy();
        }
        this.shadowContainer = new ShadowContainer(this, 0, 0);

        this.gameState.shadows.forEach(shadowData => {
            const shadow = new Shadow(this, shadowData.position.x, shadowData.position.y, shadowData.texture, shadowData.isCorrect);
            shadow.setInteractive();
            shadow.on('pointerdown', () => this.handleShadowGuess(shadowData.texture));
            this.shadowContainer.addShadow(shadow);
        });
    }

    private setupNetwork(): void {
        try {
            this.socket = io("http://localhost:3000");
            
            this.socket.on('connect', () => {
                console.log('Socket connected');
                this.socket?.emit('joinRoom', 'defaultRoom');
            });

            this.socket.on('serverGameUpdate', (gameState: GameStateContent) => {
                this.handleServerGameUpdate(gameState);
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
            });
        } catch (error) {
            console.error('Error setting up socket:', error);
            this.socket = null;
        }
    }

    private handleServerGameUpdate(gameState: GameStateContent): void {
        // Update the local game state with the server's game state
        this.gameState = { ...gameState };
        
        // Refresh the UI based on the new game state
        this.refreshUI();
    }

    private refreshUI(): void {
        switch (this.gameState.currentState) {
            case 'GameStartState':
                this.setupScene();
                break;
            case 'WaitingState':
                // Reset any temporary visual states
                break;
            case 'RightState':
                this.showRightStateUI();
                break;
            case 'WrongState':
                this.handleWrongState();
                break;
            case 'GameOverState':
                this.showGameOverUI();
                break;
            case 'ResetGameState':
                this.resetGame();
                break;
        }
    }


    private safeUpdateGameState(updates: Partial<GameStateContent>): void {
        // Update local game state
        this.gameState = { ...this.gameState, ...updates };

        // Safely emit game state update
        if (this.socket && this.socket.connected) {
            this.socket.emit('clientGameUpdate', this.gameState);
        } else {
            console.warn('Socket not available for game state update');
        }
    }

    // Replace all other updateGameState calls with safeUpdateGameState
    private handleShadowGuess(texture: string): void {
        if (this.gameState.currentState !== 'WaitingState') return;

        this.safeUpdateGameState({ 
            currentState: 'GuessState', 
            guessedShadow: texture 
        });

        const isCorrect = texture === this.gameState.correctShadow;

        if (isCorrect) {
            this.safeUpdateGameState({ 
                currentState: 'RightState' 
            });
        } else {
            this.safeUpdateGameState({ 
                currentState: 'WrongState',
                playerWrongCount: this.gameState.playerWrongCount + 1
            });
        }
    }

    // Modify other methods similarly to use safeUpdateGameState
    private showRightStateUI(): void {
        // Add "Well done!" text
        const text = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2, 
            'Well done!', 
            { fontSize: '64px', color: '#00ff00' }
        ).setOrigin(0.5);

        // Go to next level after a short delay
        this.time.delayedCall(2000, () => {
            this.safeUpdateGameState({ 
                currentState: 'NextLevelState',
                currentLevel: this.gameState.currentLevel + 1
            });
        });
    }

    // Similar changes for other methods...
    private handleWrongState(): void {
        if (this.gameState.playerWrongCount >= this.gameState.playerMaxWrong) {
            this.safeUpdateGameState({ currentState: 'GameOverState' });
        } else {
            this.safeUpdateGameState({ currentState: 'WaitingState' });
        }
    }

    private showGameOverUI(): void {
        // Clear previous scene elements
        this.children.removeAll();

        // Add "Game Over" text in red
        this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2 - 50, 
            'Game Over', 
            { 
                fontSize: '64px', 
                color: '#ff0000',
                padding: { x: 10, y: 10 },
                backgroundColor: '#444444'
            }
        ).setOrigin(0.5);

        // Add retry button
        const retryButton = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2 + 50, 
            'Retry', 
            { 
                fontSize: '32px', 
                color: '#ffffff',
                padding: { x: 10, y: 10 },
                backgroundColor: '#444444'
            }
        ).setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.safeUpdateGameState({ currentState: 'ResetGameState' });
        });
    }

    private resetGame(): void {
        this.safeUpdateGameState({
            currentState: 'WaitingState',
            guessedShadow: null,
            playerWrongCount: 0,
            currentLevel: 1
        });
    }

    // Kept for reference, but replaced by safeUpdateGameState
    private updateGameState(updates: Partial<GameStateContent>): void {
        console.warn('Deprecated method called. Use safeUpdateGameState instead.');
        this.safeUpdateGameState(updates);
    }
}