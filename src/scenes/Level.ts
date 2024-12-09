import Phaser from "phaser";
import { io, Socket } from "socket.io-client";

export default class Level extends Phaser.Scene {
    private socket: Socket | null = null;
    private gameState: {
        wordAnswer: string,
        guessedLetter: string[],
        wrongGuessCount: number,
        maxWrongGuesses: number,
        gameStatus: 'playing' | 'won' | 'lost'
    } = {
        wordAnswer: '',
        guessedLetter: [],
        wrongGuessCount: 0,
        maxWrongGuesses: 6,
        gameStatus: 'playing'
    };

    private shadowContainer!: Phaser.GameObjects.Container;
    private letterContainer!: Phaser.GameObjects.Container;
    private answerContainer!: Phaser.GameObjects.Container;
    private hangmanParts!: Phaser.GameObjects.Group;

    constructor() {
        super({ key: "Level" });
    }

    create(): void {
        this.setupNetwork();
        this.createGameBoard();
        this.requestNewGame();
    }

    private setupNetwork(): void {
        try {
            this.socket = io("http://localhost:3000");
            
            this.socket.on('connect', () => {
                console.log('Socket connected');
                this.socket?.emit('joinRoom', 'shadowHangman');
            });

            this.socket.on('serverGameUpdate', (gameState) => {
                this.updateGameState(gameState);
            });
        } catch (error) {
            console.error('Network setup error:', error);
        }
    }

    private createGameBoard(): void {
        // Background
        this.add.image(this.scale.width / 2, this.scale.height / 2, "BG");

        // Hangman parts container
        this.hangmanParts = this.add.group({
            key: ['hangman_head', 'hangman_body', 'hangman_arm_left', 'hangman_arm_right', 'hangman_leg_left', 'hangman_leg_right'],
            setScale: { x: 0.5, y: 0.5 },
            visible: false
        });

        // Shadow container for game images
        this.shadowContainer = this.add.container(this.scale.width / 2, this.scale.height / 3);

        // Letter selection container
        this.letterContainer = this.createLetterContainer();

        // Answer container
        this.answerContainer = this.add.container(this.scale.width / 2, this.scale.height * 0.7);
    }

    private createLetterContainer(): Phaser.GameObjects.Container {
        const container = this.add.container(0, this.scale.height * 0.8);
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        letters.forEach((letter, index) => {
            const x = (index % 13) * 50;
            const y = Math.floor(index / 13) * 50;
            
            const letterBox = this.add.rectangle(x, y, 40, 40, 0x888888)
                .setInteractive()
                .on('pointerdown', () => this.guessLetter(letter));
            
            const letterText = this.add.text(x, y, letter, { 
                color: '#ffffff', 
                fontSize: '24px' 
            }).setOrigin(0.5);

            container.add([letterBox, letterText]);
        });

        return container;
    }

    private requestNewGame(): void {
        // Request a new word from server or generate one
        const mockWords = ['ELEPHANT', 'GIRAFFE', 'RHINO', 'ZEBRA'];
        const randomWord = mockWords[Math.floor(Math.random() * mockWords.length)];
        this.initializeGame(randomWord);
    }

    private initializeGame(word: string): void {
        // Reset game state
        this.gameState = {
            wordAnswer: word,
            guessedLetter: [],
            wrongGuessCount: 0,
            maxWrongGuesses: 6,
            gameStatus: 'playing'
        };

        // Clear previous answer boxes
        this.answerContainer.removeAll(true);

        // Create answer boxes
        word.split('').forEach((_, index) => {
            const box = this.add.rectangle(index * 50, 0, 40, 40, 0x333333);
            this.answerContainer.add(box);
        });

        const hangmanPartChildren = this.hangmanParts.children.entries as Phaser.GameObjects.Sprite[];
        hangmanPartChildren.forEach((part, index) => {
            part.setVisible(false);
            part.setPosition(this.scale.width / 2, this.scale.height / 3 + index * 50);
        });
        

        // Update shadow/image for the game
        this.updateGameImage(word);
    }

    private updateGameImage(word: string): void {
        // Simple placeholder for updating game image based on word
        const shadowKey = `shadow_${word.toLowerCase()}`;
        const shadowSprite = this.add.image(0, 0, shadowKey || 'defaultShadow');
        this.shadowContainer.removeAll(true);
        this.shadowContainer.add(shadowSprite);
    }

    private guessLetter(letter: string): void {
        // Prevent re-guessing or game-over states
        if (this.gameState.guessedLetter.includes(letter) || 
            this.gameState.gameStatus !== 'playing') return;

        // Add to guessed letters
        this.gameState.guessedLetter.push(letter);

        // Check if letter is in word
        if (this.gameState.wordAnswer.includes(letter)) {
            this.revealLetters(letter);
            this.checkGameWin();
        } else {
            this.handleWrongGuess();
        }

        // Update game state on server
        this.sendGameUpdate();
    }

    private revealLetters(letter: string): void {
        this.gameState.wordAnswer.split('').forEach((wordLetter, index) => {
            if (wordLetter === letter) {
                const answerBox = this.answerContainer.getAt(index) as Phaser.GameObjects.Rectangle;
                answerBox.setFillStyle(0xffffff);
                const revealText = this.add.text(
                    answerBox.x, 
                    answerBox.y, 
                    letter, 
                    { color: '#000000', fontSize: '24px' }
                ).setOrigin(0.5);
                this.answerContainer.add(revealText);
            }
        });
    }

    private handleWrongGuess(): void {
        this.gameState.wrongGuessCount++;
        
        // Type assertion and null check
        const hangmanPartChildren = this.hangmanParts.children.entries as Phaser.GameObjects.Sprite[];
        const part = hangmanPartChildren[this.gameState.wrongGuessCount - 1];
        if (part) {
            part.setVisible(true);
        }

        // Check for game over
        if (this.gameState.wrongGuessCount >= this.gameState.maxWrongGuesses) {
            this.gameState.gameStatus = 'lost';
            this.showGameOverScreen();
        }
    }

    private checkGameWin(): void {
        const uniqueWordLetters = new Set(this.gameState.wordAnswer);
        const guessedUniqueLetters = new Set(this.gameState.guessedLetter.filter(
            letter => this.gameState.wordAnswer.includes(letter)
        ));

        if (uniqueWordLetters.size === guessedUniqueLetters.size) {
            this.gameState.gameStatus = 'won';
            this.showVictoryScreen();
        }
    }

    private showGameOverScreen(): void {
        this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2, 
            'Game Over!\nThe word was: ' + this.gameState.wordAnswer, 
            { 
                color: '#ff0000', 
                fontSize: '32px',
                align: 'center'
            }
        ).setOrigin(0.5);
    }

    private showVictoryScreen(): void {
        this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2, 
            'Congratulations!\nYou Won!', 
            { 
                color: '#00ff00', 
                fontSize: '32px',
                align: 'center'
            }
        ).setOrigin(0.5);
    }

    private sendGameUpdate(): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit('clientGameUpdate', this.gameState);
        }
    }

    private updateGameState(newState: any): void {
        this.gameState = { ...this.gameState, ...newState };
        // Additional UI update logic if needed
    }
}