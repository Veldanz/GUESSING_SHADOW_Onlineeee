export interface GameInfo {
    gameUrl: string;
    permissionList: GamePermission[];
  }
  

export interface GamePermission {
    identity: string;
    permissions: string[];
  }

export interface GameStateContent {
  mainPicture: string;           // ชื่อหรือคีย์ของภาพตัวอย่าง
  shadows: ShadowData[];         // ข้อมูลเงาที่แสดงในเกม
  correctShadow: string;         // คีย์ของเงาที่ถูกต้อง
  guessedShadows: string[];      // คีย์ของเงาที่ผู้เล่นเคยเลือก
  wrongGuessCount: number;       // จำนวนครั้งที่เลือกผิด
  maxWrongGuesses: number;       // จำนวนครั้งที่ผิดได้สูงสุดก่อน Game Over
  timeRemaining: number;         // เวลาที่เหลืออยู่
  isGameOver: boolean;           // สถานะจบเกม
  currentPlayer: string;         // ระบุผู้เล่นที่กำลังเล่น
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