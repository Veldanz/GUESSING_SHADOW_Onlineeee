export interface GameInfo {
    gameUrl: string;
    permissionList: GamePermission[];
  }
  

export interface GamePermission {
    identity: string;
    permissions: string[];
  }

  export interface GameStateContent {
    // Game Configuration
    gameMode: 'single' | 'multiplayer';
    difficulty: 'easy' | 'medium' | 'hard';
  
    // Game Object Details
    mainPicture: {
      key: string;
      scale: number;
      position: { x: number; y: number };
    };
  
    // Shadow-related Details
    shadows: {
      texture: string;
      position: { x: number; y: number };
      isCorrect: boolean;
      isHovered: boolean;
      isSelected: boolean;
    }[];
  
    // Game Progress Tracking
    correctShadow: string;
    guessedShadows: string[];
    wrongGuessCount: number;
    maxWrongGuesses: number;
  
    // Timer Management
    timeRemaining: number;
    totalTime: number;
    timerStatus: 'running' | 'paused' | 'stopped';
  
    // Game State Management
    isGameOver: boolean;
    gameResult: 'win' | 'lose' | 'ongoing';
    currentLevel: number;
  
    // Player Information
    currentPlayer: {
      id: string | undefined;  // Change from string | null to string | undefined
      mousePosition: { x: number; y: number };
    };
  
    // Multiplayer Specific
    connectedPlayers: string[];
  }

interface ShadowData {
  texture: string;               // ชื่อหรือคีย์ของเงา
  position: { x: number; y: number }; // ตำแหน่งของเงาในเกม
  isHovered: boolean;            // สถานะ hover ของเงา
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