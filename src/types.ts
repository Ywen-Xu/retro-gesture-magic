export interface Point {
  x: number;
  y: number;
}

export interface HandLandmark {
  x: number; // 0 to 1, normalized to image width
  y: number; // 0 to 1, normalized to image height
  z: number; // depth
}

export type HandLandmarks = HandLandmark[];

export interface HandResult {
  landmarks: HandLandmarks;
  label: 'Left' | 'Right';
  isExtended: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
    allOpen: boolean;
  };
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  spin: number;
  life: number;
  maxLife: number;
  type: 'star' | 'diamond' | 'heart' | 'sparkle' | 'ring';
}

export interface SparkleEdge {
  id: string;
  x: number;
  y: number;
  size: number;
  alpha: number;
  scale: number;
  delay: number;
}

export type RetroFilterType = 
  | 'dreamy-pink'      // 夢幻粉格 (Sweet magenta glow)
  | 'lomo-nostalgia'   // LOMO復古 (Vignette & high contrast)
  | 'cyber-cyan'       // 憂鬱冰藍 (Cold cyber tone)
  | 'golden-seventies' // 狂野迪斯可 (Warm golden vintage sepia)
  | 'no-filter';       // 純原相機

export interface Y2KSticker {
  id: string;
  emoji: string;
  text?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
