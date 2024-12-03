export interface GameInfo {
    gameUrl: string;
    permissionList: GamePermission[];
  }
  

export interface GamePermission {
    identity: string;
    permissions: string[];
  }

export enum GameState {
    INITIALIZING = 'INITIALIZING',
    NORMAL = 'NORMAL',
    GUESSING = 'GUESSING',
    CORRECT_GUESS = 'CORRECT_GUESS',
    INCORRECT_GUESS = 'INCORRECT_GUESS',
    GAME_OVER = 'GAME_OVER',
    RESET = 'RESET',
    TIME_UP = 'TIME_UP'
}

export interface GameStateContent {
    // Core game state
    currentState: GameState;

    // Game configuration
    mainPicture: string;           // Key or name of the main picture
    shadows: ShadowData[];         // Shadow data for the game
    correctShadow: string;         // Key of the correct shadow
    
    // Game progress tracking
    guessedShadows: string[];      // Keys of shadows guessed so far
    wrongGuessCount: number;       // Number of incorrect guesses
    maxWrongGuesses: number;       // Maximum allowed wrong guesses before game over
    
    // Time management
    timeRemaining: number;         // Remaining time
    totalTime: number;             // Total game time
    
    // Player and multiplayer information
    currentPlayer: string;         // ID of the current player
    players: string[];             // List of player IDs in the game
    
    // Additional metadata
    level: number;                 // Current game level
    score: number;                 // Player's current score
    
    // Detailed game progression
    lastGuess?: {
        texture: string;           // Texture of the last guessed shadow
        isCorrect: boolean;        // Whether the last guess was correct
        timestamp: number;         // Timestamp of the guess
    };
}


interface ShadowData {
  texture: string;               // Shadow texture key
  position: { x: number; y: number }; // Shadow position in the game
  isHovered: boolean;            // Hover state of the shadow
  isCorrect: boolean;            // Whether this is the correct shadow
  isGuessed: boolean;            // Whether this shadow has been guessed
}

export interface UserInformation {
  sub: string | null;
  email_verified: boolean;
  name: string | null;
  preferred_username: string | null;
  given_name: string | null;
  family_name: string | null;
  email: string | null;
}

export interface GameUpdatePayload {
  gameState: GameStateContent;
  playerSocketId: string;
}