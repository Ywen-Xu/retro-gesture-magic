import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Camera, Music, Play, Square, Sparkles, Volume2, VolumeX, Heart, Trash2, CameraOff, Shuffle, RotateCcw, Image as ImageIcon, HelpCircle, Flame, Disc } from 'lucide-react';
import { RetroFilterType, Particle, Y2KSticker, SparkleEdge } from '../types';
import { RetroDiscoSynth } from '../utils/RetroDiscoSynth';

interface CameraFilterViewProps {
  synth: RetroDiscoSynth;
  isMusicPlaying: boolean;
  setIsMusicPlaying: (val: boolean) => void;
}

// Retro stickers template
const PRESET_STICKERS = [
  { emoji: '🎀', label: '粉红蝴蝶結' },
  { emoji: '🕶️', label: '炫酷墨鏡' },
  { emoji: '🌸', label: '非主流櫻花' },
  { emoji: '⭐', label: '閃耀星星' },
  { emoji: '🐱', label: '小貓鬍鬚' },
  { emoji: '🔥', label: '非主流烈焰' },
  { emoji: '💘', label: '愛心一箭' },
  { emoji: '💔', label: '憂傷碎心' }
];

// Martian sticker texts
const MARTIAN_SIGNATURES = [
  'ら 傷感。爺 ゞ',
  '涐扪の噯，巳晟濄呿。',
  'じ莣憂愺﹌',
  '︻︼─一 獨臫縸涙',
  '糖菓ィ菋檤',
  '︶ㄣ 噯の淚痕 ㄣ︶'
];

// Martian dictionary mapping list
const MARTIAN_MAP: Record<string, string> = {
  '我': '涐', '你': '伱', '的': 'の', '是': '湜', '爱': '噯', '愛': '噯',
  '美': '羙', '绝': '蕝', '家': '傢', '好': '佷恏', '伤': '傷', '傷': '傷',
  '痛': '痌', '心': '訫', '泪': '涙', '忘': '莣', '忧': '憂', '草': '愺',
  '悲': '苝', '福': '冨', '快': '筷', '乐': '樂', '樂': '樂', '永': '詠',
  '远': '逺', '遠': '逺', '一': '①', '二': '②', '三': '③', '不': '卟',
  '人': '亾', '着': '着', '看': '看', '说': '說', '説': '說', '谁': '誰', '有': '侑',
  '没': '莈', '无': '無', '就': '勶', '去': '呿', '真': '眞', '天': '兲',
  '死': '屍', '恋': '戀', '情': '情', '男': '悩', '女': '囡', '和': '咊',
  '那': '那', '这': '這', '也': '乜'
};

const convertToMartian = (text: string, style: 'none' | 'star' | 'love' | 'emo') => {
  let result = '';
  for (const char of text) {
    result += MARTIAN_MAP[char] || char;
  }
  if (style === 'star') {
    return `★ ${result} ★`;
  } else if (style === 'love') {
    return `じ☆ve ${result} じ☆ve`;
  } else if (style === 'emo') {
    return `ら ${result} ゞ`;
  }
  return result;
};

// Classic photo frame designs
const PHOTO_FRAMES = [
  { id: 'none', name: '純拍照視窗' },
  { id: 'dreamy-pink-frame', name: '✧ 暃主流・夢幻粉 ✧' },
  { id: 'cyber-star-frame', name: '★ Y2K・酷炫極光 ★' },
  { id: 'emo-sad-frame', name: '✖ 淚、洇ィ尒侕蓅 ✖' }
];

const getFilterCSSValue = (filter: RetroFilterType, intensity: number) => {
  if (filter === 'no-filter') return 'none';
  switch (filter) {
    case 'dreamy-pink':
      return `saturate(${1 + 0.6 * intensity}) contrast(${1 + 0.12 * intensity}) brightness(${1 + 0.08 * intensity}) sepia(${0.14 * intensity})`;
    case 'lomo-nostalgia':
      return `contrast(${1 + 0.45 * intensity}) saturate(${1 + 0.8 * intensity}) brightness(${1 - 0.08 * intensity}) grayscale(${0.05 * intensity})`;
    case 'cyber-cyan':
      return `hue-rotate(${175 * intensity}deg) saturate(${1 + 0.4 * intensity}) contrast(${1 + 0.3 * intensity}) brightness(${1 + 0.04 * intensity})`;
    case 'golden-seventies':
      return `sepia(${0.55 * intensity}) contrast(${1 + 0.25 * intensity}) brightness(${1 + 0.08 * intensity}) saturate(${1 + 0.85 * intensity})`;
    default:
      return 'none';
  }
};

export function CameraFilterView({ synth, isMusicPlaying, setIsMusicPlaying }: CameraFilterViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Mobile detection ──
  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);
  const MAX_PARTICLES = isMobile ? 30 : 250;
  const MP_SKIP_FRAMES = isMobile ? 6 : 4; // mobile: 5fps  desktop: 8fps

  // App States
  const [cameraActive, setCameraActive] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<RetroFilterType>('dreamy-pink');
  const [filterIntensity, setFilterIntensity] = useState(1.0);
  const filterIntensityRef = useRef(1.0);
  useEffect(() => {
    filterIntensityRef.current = filterIntensity;
  }, [filterIntensity]);
  const [selectedFrame, setSelectedFrame] = useState<string>('dreamy-pink-frame');
  const [stickers, setStickers] = useState<Y2KSticker[]>([]);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [sfxMuted, setSfxMuted] = useState(false);
  const sfxMutedRef = useRef(false);
  useEffect(() => {
    sfxMutedRef.current = sfxMuted;
  }, [sfxMuted]);
  const [tempoMultiplier, setTempoMultiplier] = useState(1.0);
  const [snapshotPreviewUrl, setSnapshotPreviewUrl] = useState<string | null>(null);

  // Special Interactive Effects states
  const [activeEffectStyle, setActiveEffectStyle] = useState<'retro_stars' | 'heart_bubbles' | 'love_balloon' | 'finger_diamond'>('retro_stars');
  const activeEffectStyleRef = useRef<'retro_stars' | 'heart_bubbles' | 'love_balloon' | 'finger_diamond'>('retro_stars');
  useEffect(() => {
    activeEffectStyleRef.current = activeEffectStyle;
    particlesRef.current = []; // Clear existing particles when switching style to prevent overlap!
  }, [activeEffectStyle]);

  const [balloonColor, setBalloonColor] = useState<'pink' | 'green'>('pink');
  const balloonColorRef = useRef<'pink' | 'green'>('pink');
  useEffect(() => {
    balloonColorRef.current = balloonColor;
  }, [balloonColor]);

  // Balloon references per hand
  const balloonsRef = useRef([
    { radius: 0, growing: false, startTime: 0, popped: false, cooldownUntil: 0 },
    { radius: 0, growing: false, startTime: 0, popped: false, cooldownUntil: 0 }
  ]);
  const [balloonProgressPercent, setBalloonProgressPercent] = useState(0);

  // Sticker extra controls selection
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Scale and rotate bounding box state for active sticker transformations
  const [transformState, setTransformState] = useState<{
    id: string;
    mode: 'scale' | 'rotate';
    startAngle: number;
    startDist: number;
    initialScale: number;
    initialRotation: number;
  } | null>(null);

  // Custom saving album directory option
  const [virtualFolderSuffix, setVirtualFolderSuffix] = useState('Desktop/Y2K_Album');
  const [folderConfigOpen, setFolderConfigOpen] = useState(false);
  const [directoryHandle, setDirectoryHandle] = useState<any>(null); // Experimental FileSystemDirectoryHandle
  
  // Real-time tracking HUD indicators
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
  const [trackingConfidence, setTrackingConfidence] = useState<number>(0);
  const [activeGesture, setActiveGesture] = useState<'heart' | 'explosion' | 'none'>('none');
  const [scrambleProgress, setScrambleProgress] = useState(0);

  // Drawing Canvas States
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff00ff');
  const [pixelSize, setPixelSize] = useState(16); // Default 16px is sweet and perfect for pixel art
  const [drawnPixels, setDrawnPixels] = useState<Record<string, { color: string, size: number }>>({}); // key structure: "xAlign,yAlign" -> { color, size }
  const drawnPixelsRef = useRef<Record<string, { color: string, size: number }>>({});
  
  // References for rendering and calculations
  const particlesRef = useRef<Particle[]>([]);
  const edgeEffectsRef = useRef<SparkleEdge[]>([]);
  const lastGestureRef = useRef<'heart' | 'explosion' | 'none'>('none');
  const explodedCooldownRef = useRef<boolean>(false);
  const requestRef = useRef<number | null>(null);
  const cameraHelperRef = useRef<any>(null);
  const mediaPipeHandsRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mpFrameRef = useRef(0); // MediaPipe frame counter for throttling

  // Memoize isolated FaceMesh loader page as a blob URL.
  // This isolates FaceMesh's Emscripten/WASM runtime inside its own window, completely resolving conflicts with Hands.
  const iframeSrc = useMemo(() => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" crossorigin="anonymous"></script>
      </head>
      <body>
        <canvas id="canvas" style="display:none;"></canvas>
        <script>
          let faceMesh = null;
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');

          function initFaceMesh() {
            faceMesh = new FaceMesh({
              locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/" + file
            });
            faceMesh.setOptions({
              maxNumFaces: 1,
              refineLandmarks: true,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5
            });
            faceMesh.onResults((results) => {
              let landmarks = null;
              if (results && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const lm = results.multiFaceLandmarks[0];
                if (lm) {
                  landmarks = {
                    234: lm[234],
                    454: lm[454],
                    10: lm[10],
                    152: lm[152],
                    468: lm[468],
                    473: lm[473]
                  };
                }
              }
              window.parent.postMessage({ type: 'face-results', landmarks }, '*');
            });
          }

          window.addEventListener('message', async (e) => {
            if (e.data && e.data.type === 'process-frame') {
              if (!faceMesh) {
                initFaceMesh();
              }
              const { imageBitmap } = e.data;
              if (imageBitmap && faceMesh) {
                canvas.width = imageBitmap.width;
                canvas.height = imageBitmap.height;
                ctx.drawImage(imageBitmap, 0, 0);
                imageBitmap.close();
                try {
                  await faceMesh.send({ image: canvas });
                } catch (err) {
                  // ignore
                }
              }
            }
          });
        </script>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, []);

  const faceMetricsRef = useRef<{ 
    width: number; 
    height: number; 
    area: number; 
    detected: boolean;
    centerX: number;
    centerY: number;
  }>({
    width: 0.25,
    height: 0.25,
    area: 0.0625,
    detected: false,
    centerX: 0.5,
    centerY: 0.35,
  });

  // Listen to FaceMesh results sent from inner-frame sandbox
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'face-results') {
        const landmarks = e.data.landmarks;
        if (!landmarks) {
          faceMetricsRef.current.detected = false;
          return;
        }

        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const forehead = landmarks[10];
        const chin = landmarks[152];

        let w = 0.25;
        let h = 0.25;

        if (leftEar && rightEar) {
          w = Math.hypot(leftEar.x - rightEar.x, leftEar.y - rightEar.y);
        }
        if (forehead && chin) {
          h = Math.hypot(forehead.x - chin.x, forehead.y - chin.y);
        }

        const leftPupil = landmarks[468];
        const rightPupil = landmarks[473];
        if (leftPupil && rightPupil) {
          const pupilDistance = Math.hypot(leftPupil.x - rightPupil.x, leftPupil.y - rightPupil.y);
          w = pupilDistance * 3;
          h = pupilDistance * 3;
        }

        let cx = 0.5;
        let cy = 0.35;
        if (forehead && chin) {
          cx = (forehead.x + chin.x) / 2;
          cy = (forehead.y + chin.y) / 2;
        } else if (leftEar && rightEar) {
          cx = (leftEar.x + rightEar.x) / 2;
          cy = (leftEar.y + rightEar.y) / 2;
        }

        faceMetricsRef.current = {
          width: w,
          height: h,
          area: w * h,
          detected: true,
          centerX: cx,
          centerY: cy
        };
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, []);

  const cameraActiveRef = useRef(false);
  const selectedFilterRef = useRef(selectedFilter);
  const activeGestureRef = useRef<'heart' | 'explosion' | 'none'>('none');

  // Synchronizers of state changes to keep refs updated inside async canvas and camera helpers
  useEffect(() => {
    selectedFilterRef.current = selectedFilter;
  }, [selectedFilter]);

  const updateActiveGesture = (gesture: 'heart' | 'explosion' | 'none') => {
    activeGestureRef.current = gesture;
    setActiveGesture(gesture);
  };

  // Sticker Drag States
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Poll for MediaPipe readiness on mount
  useEffect(() => {
    const checkMediaPipe = setInterval(() => {
      if ((window as any).Hands && (window as any).Camera) {
        setIsMediaPipeLoaded(true);
        clearInterval(checkMediaPipe);
      }
    }, 200);

    return () => {
      clearInterval(checkMediaPipe);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (cameraHelperRef.current) {
        try { cameraHelperRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Sync music details
  useEffect(() => {
    synth.setVolume(sfxMuted ? 0 : musicVolume);
  }, [musicVolume, sfxMuted, synth]);

  useEffect(() => {
    synth.setTempoMultiplier(tempoMultiplier);
  }, [tempoMultiplier, synth]);

  // Handle camera toggles
  const toggleCamera = async () => {
    if (cameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const startCamera = async () => {
    if (!isMediaPipeLoaded) return;

    // Ensure synthesizer starts on webcam trigger to enable full Y2K party feeling!
    if (!isMusicPlaying) {
      synth.start();
      setIsMusicPlaying(true);
    }

    try {
      cameraActiveRef.current = true;
      setCameraActive(true);

      // Initialize MediaPipe Hands if not already done
      if (!mediaPipeHandsRef.current) {
        const HandsClass = (window as any).Hands;
        mediaPipeHandsRef.current = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        mediaPipeHandsRef.current.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        mediaPipeHandsRef.current.onResults(handleHandsResults);
      }

      // Sync active view video
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });

        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          // Start MediaPipe Camera Helper
          const CameraClass = (window as any).Camera;
          cameraHelperRef.current = new CameraClass(videoRef.current, {
            onFrame: async () => {
              // Throttle: only process every 4th frame ≈ 8fps detection
              mpFrameRef.current++;
              if (mpFrameRef.current % MP_SKIP_FRAMES !== 0) return;

              if (videoRef.current && cameraActiveRef.current) {
                try {
                  await mediaPipeHandsRef.current.send({ image: videoRef.current });

                  if (iframeRef.current && videoRef.current.readyState >= 2) {
                    createImageBitmap(videoRef.current).then((imageBitmap) => {
                      iframeRef.current?.contentWindow?.postMessage(
                        { type: 'process-frame', imageBitmap },
                        '*',
                        [imageBitmap]
                      );
                    }).catch(() => {});
                  }
                } catch (e) {
                  console.error('Error running MediaPipe frames:', e);
                }
              }
            },
            width: 640,
            height: 480
          });
          cameraHelperRef.current.start();
        });
      };
    }

      // Trigger canvas continuous rendering loop
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(canvasRenderLoop);

    } catch (err) {
      alert('無法開啟攝像頭，請授權攝像頭權限！');
      console.error(err);
      cameraActiveRef.current = false;
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    cameraActiveRef.current = false;
    setCameraActive(false);
    updateActiveGesture('none');
    if (cameraHelperRef.current) {
      try { cameraHelperRef.current.stop(); } catch (e) {}
      cameraHelperRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    // Reset Canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Process Hand Landmarks inside MediaPipe event callback
  const handleHandsResults = (results: any) => {
    if (mediaPipeHandsRef.current) {
      (mediaPipeHandsRef.current as any).lastResults = results;
    }
    if (!results || !results.multiHandLandmarks || !canvasRef.current) {
      setTrackingConfidence(0);
      updateActiveGesture('none');
      synth.setFiltersInteractive(false);
      return;
    }

    const landmarksList = results.multiHandLandmarks;
    setTrackingConfidence(landmarksList.length > 0 ? 0.95 : 0);

    // Helper: detect extended fingers using joint angles (works for all palm orientations)
    const checkHandOpen = (landmarks: any[]) => {
      // Landmark indices for 4 fingers: index, middle, ring, pinky
      // Each finger: MCP, PIP, DIP, TIP (4 joints apart)
      const mcpIndices = [5, 9, 13, 17];
      const pipIndices = [6, 10, 14, 18];
      const tipIndices = [8, 12, 16, 20];
      let openCount = 0;

      for (let i = 0; i < 4; i++) {
        const mcp = landmarks[mcpIndices[i]];
        const pip = landmarks[pipIndices[i]];
        const tip = landmarks[tipIndices[i]];
        if (!mcp || !pip || !tip) continue;

        // Vector from MCP to PIP (first segment)
        const dx1 = pip.x - mcp.x;
        const dy1 = pip.y - mcp.y;
        // Vector from PIP to TIP (second segment)
        const dx2 = tip.x - pip.x;
        const dy2 = tip.y - pip.y;

        const len1 = Math.hypot(dx1, dy1);
        const len2 = Math.hypot(dx2, dy2);
        if (len1 < 0.001 || len2 < 0.001) continue;

        // Cosine of the angle between the two segments
        const cosAngle = (dx1 * dx2 + dy1 * dy2) / (len1 * len2);
        // cosAngle > 0.4 means angle < ~66° → finger is relatively straight → "open"
        if (cosAngle > 0.4) {
          openCount++;
        }
      }
      return openCount; // Returns the count of open fingers (0 to 4)
    };

    // Helper to calculate middle finger vector angle with vertical upward vector [0, -1]
    const getMiddleFingerAngleUpward = (landmarks: any[]) => {
      const middleBase = landmarks[9]; // Middle finger MCP
      const middleTip = landmarks[12]; // Middle finger Tip
      if (!middleBase || !middleTip) return 90;
      const dx = middleTip.x - middleBase.x;
      const dy = middleTip.y - middleBase.y; // note screen y is inverted (going down)
      const length = Math.hypot(dx, dy);
      if (length === 0) return 90;
      const cosTheta = -dy / length; // dot product with upward vector [0, -1]
      const clampedCos = Math.max(-1, Math.min(1, cosTheta));
      return Math.acos(clampedCos) * 180 / Math.PI;
    };

    // If zero hands are detected, clear gestural status and return
    if (landmarksList.length === 0) {
      updateActiveGesture('none');
      synth.setFiltersInteractive(false);
      lastGestureRef.current = 'none';
      balloonsRef.current.forEach(b => {
        b.growing = false;
        b.radius = 0;
        b.popped = false;
      });
      setBalloonProgressPercent(0);
      return;
    }

    // Estimate user head metrics (width, height, area)
    let headWidth = 0.25;
    let headHeight = 0.25;
    let headArea = 0.0625;

    if (faceMetricsRef.current.detected) {
      headWidth = faceMetricsRef.current.width;
      headHeight = faceMetricsRef.current.height;
      headArea = faceMetricsRef.current.area;
    } else {
      // Fallback head estimation based on hand scale
      const hand = landmarksList[0];
      const handScale = Math.hypot(hand[12].x - hand[0].x, hand[12].y - hand[0].y);
      headWidth = handScale * 1.15;
      headHeight = handScale * 1.15;
      headArea = headWidth * headHeight;
    }

    const h1 = landmarksList[0];
    const h2 = landmarksList.length >= 2 ? landmarksList[1] : null;
    const activeStyle = activeEffectStyleRef.current;

    // Check pre-condition of palm crossing/overlapping (EXPLOSION) if two hands exist
    // ONLY check if active style is selected as 'retro_stars' (碎星)
    if (activeStyle === 'retro_stars' && h2) {
      const palm1 = h1[9];
      const palm2 = h2[9];
      const palmDist = Math.hypot(palm1.x - palm2.x, palm1.y - palm2.y);
      const wristDist = Math.hypot(h1[0].x - h2[0].x, h1[0].y - h2[0].y);

      if (palmDist < 0.055 || wristDist < 0.055) {
        updateActiveGesture('explosion');
        synth.setFiltersInteractive(false);
        balloonsRef.current.forEach(b => {
          b.growing = false;
          b.radius = 0;
          b.popped = false;
        });
        setBalloonProgressPercent(0);

        if (!explodedCooldownRef.current) {
          const midX = (palm1.x + palm2.x) / 2;
          const midY = (palm1.y + palm2.y) / 2;
          playHeartExplosion(midX, midY);
          explodedCooldownRef.current = true;
          
          setTimeout(() => {
            explodedCooldownRef.current = false;
          }, 1200);
        }
        return;
      }
    }

    let isAnyTriggeredInFrame = false;

    // --- CONDITION 1 (Dream Stars / Dream Bubbles) ---
    // "双手掌根间距 < 头部宽度 × 0.5 且 双手食指间距 > 掌根间距"
    const isStyleStarsOrBubbles = activeStyle === 'retro_stars' || activeStyle === 'heart_bubbles';
    let isCondition1Met = false;

    if (isStyleStarsOrBubbles && h2) {
      const wristDist = Math.hypot(h1[0].x - h2[0].x, h1[0].y - h2[0].y);
      const indexDist = Math.hypot(h1[8].x - h2[8].x, h1[8].y - h2[8].y);

      if (wristDist < headWidth * 0.5 && indexDist > wristDist) {
        isCondition1Met = true;
        isAnyTriggeredInFrame = true;

        // Midpoint of index fingertips
        const midIndexX = (h1[8].x + h2[8].x) / 2;
        const midIndexY = (h1[8].y + h2[8].y) / 2;

        const canvas = canvasRef.current;
        if (canvas) {
          const targetX = (1 - midIndexX) * canvas.width;
          const targetY = midIndexY * canvas.height;

          if (activeStyle === 'retro_stars') {
            // Stars: 4 mobile / 12 desktop
            for (let i = 0; i < (isMobile ? 4 : 12); i++) {
              particlesRef.current.push({
                id: Math.random().toString(),
                x: targetX,
                y: targetY,
                vx: (Math.random() - 0.5) * 4.5,
                vy: -1.5 - Math.random() * 3.5, // Emitted upwards
                size: 7 + Math.random() * 9,
                color: ['#ff007f', '#ff80df', '#ffffff', '#eab308', '#00ffff'][Math.floor(Math.random() * 5)],
                alpha: 1.0,
                rotation: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.12,
                life: 25 + Math.floor(Math.random() * 20),
                maxLife: 45,
                type: 'star'
              });
            }
            if (Math.random() < 0.2) {
              spawnEdgeSparkle();
            }
          } else if (activeStyle === 'heart_bubbles') {
            // Bubbles: 3 mobile / 8 desktop
            for (let i = 0; i < (isMobile ? 3 : 8); i++) {
              particlesRef.current.push({
                id: Math.random().toString(),
                x: targetX + (Math.random() - 0.5) * 15,
                y: targetY + (Math.random() - 0.5) * 15,
                vx: (Math.random() - 0.5) * 2.5,
                vy: -2.0 - Math.random() * 3.0, // floats up
                size: 13 + Math.random() * 14,
                color: ['#ff00ff', '#ff66cc', '#ff80df', '#00ffff', '#fffdd0'][Math.floor(Math.random() * 5)],
                alpha: 0.95,
                rotation: Math.random() * Math.PI,
                spin: (Math.random() - 0.5) * 0.05,
                life: 45 + Math.floor(Math.random() * 40),
                maxLife: 85,
                type: 'sparkle'
              });
            }
          }
        }
      }
    }

    // --- CONDITION 2 (Love Balloon) ---
    // "任一只手掌心向上，中指根部到中指尖向量与垂直方向夹角 < 35°，且 ≥3根手指伸展"
    if (!isCondition1Met) {
      if (activeStyle === 'love_balloon') {
        let balloonActiveForHands = [false, false];

        [h1, h2].forEach((hand, idx) => {
          if (!hand) return;
          const openFingersCount = checkHandOpen(hand);
          const angle = getMiddleFingerAngleUpward(hand);

          // Condition: Angle < 35 degrees with vertical upward, and extended fingers count >= 3
          if (openFingersCount >= 3 && angle < 35) {
            balloonActiveForHands[idx] = true;
          }
        });

        // Process balloon growth state and pop animation for each hand
        balloonsRef.current.forEach((b, idx) => {
          const hand = landmarksList[idx];
          if (hand && balloonActiveForHands[idx]) {
            // Check cooldown
            if (b.cooldownUntil > Date.now()) {
              b.growing = false;
              b.radius = 0;
              b.popped = false;
              return;
            }

            isAnyTriggeredInFrame = true;
            if (!b.growing) {
              b.growing = true;
              b.startTime = Date.now();
              b.popped = false;
              b.radius = 0;
            } else {
              if (b.popped) {
                return;
              }
              const elapsed = Date.now() - b.startTime;
              if (elapsed >= 1500) {
                // Forcible POP pop at 1.5 seconds!
                playBalloonBurst(hand[9].x, hand[9].y);
                b.radius = 0;
                b.growing = false;
                b.popped = true;
                b.cooldownUntil = Date.now() + 500; // 0.5 second cooldown
              } else {
                // Grow radius linearly so diameter reaches headWidth * 1.3 at 1.5 seconds
                const maxRadius = (headWidth * 1.3) / 2;
                b.radius = maxRadius * (elapsed / 1500);
              }
            }
          } else {
            b.growing = false;
            b.radius = 0;
            b.popped = false;
          }
        });

        // Set gauge progress according to any active balloons
        let maxProgressPct = 0;
        balloonsRef.current.forEach((b) => {
          if (b.growing && !b.popped) {
            const elapsed = Date.now() - b.startTime;
            const pct = (elapsed / 1500) * 100;
            if (pct > maxProgressPct) maxProgressPct = pct;
          } else if (b.popped) {
            maxProgressPct = 100;
          }
        });
        setBalloonProgressPercent(maxProgressPct);
      } else {
        // Not selecting love_balloon, reset balloons refs
        balloonsRef.current.forEach(b => {
          b.growing = false;
          b.radius = 0;
          b.popped = false;
        });
        setBalloonProgressPercent(0);
      }
    } else {
      // Condition 1 met, reset balloons refs
      balloonsRef.current.forEach(b => {
        b.growing = false;
        b.radius = 0;
        b.popped = false;
      });
      setBalloonProgressPercent(0);
    }

    // --- CONDITION 3 (Finger Diamond) ---
    // "任一隻手僅伸出單根手指時，指尖綻放絢麗碎鑽"
    if (activeStyle === 'finger_diamond') {
      [h1, h2].forEach((hand) => {
        if (!hand) return;
        const openCount = checkHandOpen(hand);
        if (openCount !== 1) return;

        // Find which fingertip is extended (using joint-angle method)
        const mcpIdx = [5, 9, 13, 17];
        const pipIdx = [6, 10, 14, 18];
        const tipIdx = [8, 12, 16, 20];
        let fingertip: any = null;

        for (let i = 0; i < 4; i++) {
          const mcp = hand[mcpIdx[i]];
          const pip = hand[pipIdx[i]];
          const tip = hand[tipIdx[i]];
          if (!mcp || !pip || !tip) continue;
          const dx1 = pip.x - mcp.x, dy1 = pip.y - mcp.y;
          const dx2 = tip.x - pip.x, dy2 = tip.y - pip.y;
          const l1 = Math.hypot(dx1, dy1), l2 = Math.hypot(dx2, dy2);
          if (l1 < 0.001 || l2 < 0.001) continue;
          if ((dx1 * dx2 + dy1 * dy2) / (l1 * l2) > 0.4) {
            fingertip = tip;
            break;
          }
        }

        if (!fingertip) return;

        isAnyTriggeredInFrame = true;

        const canvas = canvasRef.current;
        if (canvas) {
          const targetX = (1 - fingertip.x) * canvas.width;
          const targetY = fingertip.y * canvas.height;

          // Spawn 2-3 glowing diamonds per frame at fingertip
          const count = isMobile ? (2 + Math.floor(Math.random() * 2)) : (8 + Math.floor(Math.random() * 5));
          for (let i = 0; i < count; i++) {
            particlesRef.current.push({
              id: Math.random().toString(),
              x: targetX + (Math.random() - 0.5) * 14,
              y: targetY + (Math.random() - 0.5) * 14,
              vx: (Math.random() - 0.5) * 2.0,
              vy: -1.0 - Math.random() * 3.5,
              size: 5 + Math.random() * 7,
              color: ['#e8d5ff', '#c4b5fd', '#a78bfa', '#00ffff', '#f0e6ff', '#ffffff'][Math.floor(Math.random() * 6)],
              alpha: 0.95,
              rotation: Math.random() * Math.PI * 2,
              spin: (Math.random() - 0.5) * 0.18,
              life: 20 + Math.floor(Math.random() * 15),
              maxLife: 35,
              type: 'diamond'
            });
          }
        }
      });
    }

    // Set interactive audio synth and frame state feedback
    if (isAnyTriggeredInFrame) {
      updateActiveGesture('heart');
      synth.setFiltersInteractive(true);
    } else {
      updateActiveGesture('none');
      synth.setFiltersInteractive(false);
    }

    lastGestureRef.current = activeGestureRef.current;
  };

  // Spawn trail sparkles rotating around the giant pink heart
  const spawnHeartTrailParticles = (normalizedX: number, normalizedY: number, sizeScalar: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Map mirrored coordinate
    const targetX = (1 - normalizedX) * canvas.width;
    const targetY = normalizedY * canvas.height;

    const colors = ['#ff007f', '#ff80df', '#f43f5e', '#ec4899', '#ffffff', '#eab308'];
    const count = 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const range = (40 + Math.random() * 50) * sizeScalar;
      
      particlesRef.current.push({
        id: Math.random().toString(),
        x: targetX + Math.cos(angle) * range,
        y: targetY + Math.sin(angle) * range,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.8, // drift up
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.95,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.1,
        life: 30 + Math.floor(Math.random() * 25),
        maxLife: 55,
        type: Math.random() > 0.5 ? 'star' : 'diamond'
      });
    }
  };

  // Spawn random sparkly flashes along the screen boundaries
  const spawnEdgeSparkle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const margin = 20;
    // select random border edge: 0-Top, 1-Right, 2-Bottom, 3-Left
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (edge === 0) { // Top
      x = margin + Math.random() * (canvas.width - margin * 2);
      y = margin;
    } else if (edge === 1) { // Right
      x = canvas.width - margin;
      y = margin + Math.random() * (canvas.height - margin * 2);
    } else if (edge === 2) { // Bottom
      x = margin + Math.random() * (canvas.width - margin * 2);
      y = canvas.height - margin;
    } else { // Left
      x = margin;
      y = margin + Math.random() * (canvas.height - margin * 2);
    }

    edgeEffectsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      size: 15 + Math.random() * 25,
      alpha: 1.0,
      scale: 0.2,
      delay: Math.random() * 3
    });
  };

  // Trigger horizontal love balloon popping burst!
  const playBalloonBurst = (normalizedX: number, normalizedY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Play loud fun synth explosion popping sound if not muted
    if (!sfxMutedRef.current) {
      synth.playExplosionEffect();
    }

    const originX = (1 - normalizedX) * canvas.width;
    const originY = normalizedY * canvas.height;

    const isGreen = balloonColorRef.current === 'green';
    const burstColors = isGreen 
      ? ['#39ff14', '#22c55e', '#a3e635', '#00ffcc', '#ffffff']
      : ['#ff00ff', '#ff66cc', '#ff80df', '#00ffff', '#fffdd0'];

    // Heart particles: 30 mobile / 80 desktop
    for (let i = 0; i < (isMobile ? 30 : 80); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 9.5;
      particlesRef.current.push({
        id: Math.random().toString(),
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8, // burst outwards and upwards
        size: 7 + Math.random() * 11,
        color: burstColors[Math.floor(Math.random() * burstColors.length)],
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
        life: 45 + Math.floor(Math.random() * 35),
        maxLife: 80,
        type: 'heart' // Beautiful small heart particles
      });
    }
  };

  // Trigger heart explosion starburst!
  const playHeartExplosion = (normalizedX: number, normalizedY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Play synthesized sci-fi arpeggio sweeping blast if not muted
    if (!sfxMutedRef.current) {
      synth.playExplosionEffect();
    }

    // Map mirrored coordinate
    const originX = (1 - normalizedX) * canvas.width;
    const originY = normalizedY * canvas.height;

    // Generate big ring shockwave
    particlesRef.current.push({
      id: Math.random().toString(),
      x: originX,
      y: originY,
      vx: 0,
      vy: 0,
      size: 8,
      color: '#ff007f',
      alpha: 1.0,
      rotation: 0,
      spin: 0,
      life: 25,
      maxLife: 25,
      type: 'ring'
    });

    // Populate lots of retro star sparkles & small cute heart chunks
    const colors = ['#ff007f', '#00f3ff', '#d500f9', '#ff80df', '#facc15', '#fffdd0', '#3b82f6'];
    const pCount = isMobile ? 50 : 120;

    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 11.0;
      
      particlesRef.current.push({
        id: Math.random().toString(),
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.8, // pop upwards then fall down
        size: 5 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
        life: 45 + Math.floor(Math.random() * 45),
        maxLife: 90,
        type: Math.random() > 0.75 ? 'heart' : (Math.random() > 0.4 ? 'star' : 'diamond')
      });
    }
  };

  // Main UI Canvas Continuous Draw Routine inside RequestAnimationFrame
  const canvasRenderLoop = () => {
    if (!cameraActiveRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      requestRef.current = requestAnimationFrame(canvasRenderLoop);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestRef.current = requestAnimationFrame(canvasRenderLoop);
      return;
    }

    // 1. Clear viewport
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw mirrored camera frame inside Canvas
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    try {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#0d0216';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 16px "Share Tech Mono", monospace';
        ctx.fillStyle = '#ff00ff';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ SYNCING WEBCAM DATA...', canvas.width / 2, canvas.height / 2);
      }
    } catch (e) {
      console.error(e);
    }
    ctx.restore();

    // 3. Apply canvas style overlays depending on camera filters (for complex visual assets like Vignettes & Grain overlay)
    applyCanvasGraphicFilter(ctx, canvas);

    // 4. Update and Draw Sparkle Edge Decorations if gesture state is active
    drawBorderSparkles(ctx, canvas);

    // 5. Update and render particle engine (stars, diamonds, mini-hearts)
    drawParticleEngine(ctx);

    // 6. If gesture state holds 'heart' (掌根并拢 & 手掌张開), render a giant romantic rose-pink heart blowing up
    drawGesturalHeart(ctx);

    // 6.5. Render user's custom pixel art drawing on the viewport
    ctx.save();
    Object.entries(drawnPixelsRef.current).forEach(([key, val]) => {
      const pixel = val as { color: string; size: number };
      const [xStr, yStr] = key.split(',');
      const px = parseInt(xStr, 10);
      const py = parseInt(yStr, 10);
      ctx.fillStyle = pixel.color;
      ctx.fillRect(px, py, pixel.size, pixel.size);
    });
    ctx.restore();

    // Keep loop active
    requestRef.current = requestAnimationFrame(canvasRenderLoop);
  };

  // Canvas local custom visual overlays
  const applyCanvasGraphicFilter = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const activeFilter = selectedFilterRef.current;
    const intensity = filterIntensityRef.current;
    if (activeFilter === 'lomo-nostalgia') {
      // Vignette effect (Dark edge falloff)
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width / 3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.75
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${0.65 * intensity})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Analog noise grain
      ctx.fillStyle = `rgba(255,255,255,${0.04 * intensity})`;
      for (let i = 0; i < Math.floor(6 * intensity); i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (activeFilter === 'dreamy-pink') {
      // Sweet dreamy pastel overlay
      ctx.fillStyle = `rgba(244, 63, 94, ${0.08 * intensity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (activeFilter === 'golden-seventies') {
      // Warm retro disco overlay
      ctx.fillStyle = `rgba(234, 179, 8, ${0.07 * intensity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Draw continuous border sparkles
  const drawBorderSparkles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    edgeEffectsRef.current = edgeEffectsRef.current.filter(item => item.alpha > 0.01);

    edgeEffectsRef.current.forEach(item => {
      // Pulsing and fadeout animation
      item.scale += 0.04;
      item.alpha = Math.max(0, 1.0 - item.scale * 0.95);

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.globalAlpha = item.alpha;
      
      // Draw shiny ✦ sparkle star
      drawFourPointStarPath(ctx, 0, 0, item.size * item.scale, '#fffdd0');
      drawFourPointStarPath(ctx, 0, 0, item.size * 0.5 * item.scale, '#facc15');

      ctx.restore();
    });
  };

  // Helper routine to draw 4 point star path
  const drawFourPointStarPath = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(0, -size);
      ctx.quadraticCurveTo(0, 0, size, 0);
      ctx.rotate(Math.PI / 2);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowBlur = isMobile ? 0 : 8;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.restore();
  };

  // Draw romantic gestural heart or custom active effects if active
  const drawGesturalHeart = (ctx: CanvasRenderingContext2D) => {
    if (activeGestureRef.current !== 'heart' || !mediaPipeHandsRef.current) return;

    // Grab hands tracking metrics to calculate midpoint dynamically
    const results = (mediaPipeHandsRef.current as any).lastResults;
    if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    const currentStyle = activeEffectStyleRef.current;

    if (currentStyle === 'heart_bubbles') {
      // In bubbles mode, we do not draw any giant static background heart! Only continuous floaty air bubbles
      return;
    }

    if (currentStyle === 'finger_diamond') {
      // In finger diamond mode, only sparkling diamond particles follow the fingertip — no giant heart
      return;
    }

    if (currentStyle === 'love_balloon') {
      // Draw growing 3D glossy Love Balloons centered on each active hand!
      balloonsRef.current.forEach((b, idx) => {
        if (!b.growing || b.popped) return;
        const palm = results.multiHandLandmarks[idx]?.[9];
        if (!palm) return;

        const currentRadius = b.radius * ctx.canvas.width;
        if (currentRadius < 3) return;

        ctx.save();
        const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.12;
        const size = currentRadius * pulse;

        const posX = (1 - palm.x) * ctx.canvas.width;
        // Offset posY upwards by size * 1.12 so that the bottom of the heart (which ends at Y=size*1.05) sits perfectly supported just above the palm!
        const posY = palm.y * ctx.canvas.height - (size * 1.12);

        const elapsed = Date.now() - b.startTime;
        const currentRatio = elapsed / 1500;

        // Jitter if getting near critical ratio of 1.0
        if (currentRatio >= 0.8) {
          const shakeX = (Math.random() - 0.5) * 6;
          const shakeY = (Math.random() - 0.5) * 6;
          ctx.translate(posX + shakeX, posY + shakeY);
        } else {
          ctx.translate(posX, posY);
        }

        const isGreen = balloonColorRef.current === 'green';

        // Draw the beautiful 3D plump heart balloon itself (no outer circle wrap, no string, no tie knot, no banner)
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.25);
        // Left lobe (fully curves outbound for that super plump bubble look)
        ctx.bezierCurveTo(-size * 0.65, -size * 0.85, -size * 1.15, -size * 0.35, -size * 0.95, size * 0.15);
        ctx.bezierCurveTo(-size * 0.75, size * 0.55, -size * 0.35, size * 0.85, 0, size * 1.05);
        // Right lobe (symmetrical curves)
        ctx.bezierCurveTo(size * 0.35, size * 0.85, size * 0.75, size * 0.55, size * 0.95, size * 0.15);
        ctx.bezierCurveTo(size * 1.15, -size * 0.35, size * 0.65, -size * 0.85, 0, -size * 0.25);
        ctx.closePath();

        // Balanced 3D glossy radial gradient centering towards top-left lobe
        const balloonGrad = ctx.createRadialGradient(-size * 0.25, -size * 0.25, size * 0.05, 0, 0, size * 1.25);
        if (isGreen) {
          if (currentRatio >= 0.8) {
            // Lime warning glow
            balloonGrad.addColorStop(0, '#fef08a');
            balloonGrad.addColorStop(0.3, '#eab308');
            balloonGrad.addColorStop(1, '#1e1b4b');
          } else {
            // Gorgeous bright green glossy balloon
            balloonGrad.addColorStop(0, '#f0fdf4');
            balloonGrad.addColorStop(0.25, '#39ff14');
            balloonGrad.addColorStop(1, '#022c22');
          }
        } else {
          if (currentRatio >= 0.8) {
            // Red warning glow
            balloonGrad.addColorStop(0, '#fef2f2');
            balloonGrad.addColorStop(0.25, '#ef4444');
            balloonGrad.addColorStop(1, '#450a0a');
          } else {
            // Hot pink glossy 3D look
            balloonGrad.addColorStop(0, '#fdf2f8');
            balloonGrad.addColorStop(0.25, '#ff00aa');
            balloonGrad.addColorStop(1, '#4c0519');
          }
        }
        ctx.fillStyle = balloonGrad;
        ctx.shadowBlur = isMobile ? 0 : 20;
        ctx.shadowColor = currentRatio >= 0.8
          ? (isGreen ? '#facc15' : '#ef4444') 
          : (isGreen ? '#39ff14' : '#ff00aa');
        ctx.fill();

        // --- GLOSSY REFLEX HIGHLIGHTS ---
        // 1. Sleek white high-gloss oval on the top left
        ctx.save();
        ctx.beginPath();
        ctx.translate(-size * 0.35, -size * 0.35);
        ctx.rotate(-Math.PI / 4);
        ctx.scale(2.0, 1.0); // Make it a sleek long ellipse
        ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();

        // 2. Clear secondary highlight spot on the bottom right edge for volumetric 3D light reflection
        ctx.beginPath();
        ctx.arc(size * 0.45, size * 0.35, size * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();

        ctx.restore();
      });
      return;
    }

    // Default: CLASSIC STYLE 1: `retro_stars` (Requires 2 hands and active gesture lock)
    if (activeGestureRef.current !== 'heart') return;
    if (results.multiHandLandmarks.length < 2) return;

    const h1 = results.multiHandLandmarks[0];
    const h2 = results.multiHandLandmarks[1];

    const palm1 = h1[9];
    const palm2 = h2[9];

    // Compute center and mirrored location mapping
    const midX = (palm1.x + palm2.x) / 2;
    const midY = (palm1.y + palm2.y) / 2;
    const canvasCenterX = (1 - midX) * ctx.canvas.width;
    const canvasCenterY = midY * ctx.canvas.height;

    const pmDist = Math.hypot(palm1.x - palm2.x, palm1.y - palm2.y);
    const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.12;

    const baseSize = 80 + pmDist * 320; // responsive scaling with hands stretch!

    ctx.save();
    ctx.translate(canvasCenterX, canvasCenterY);
    
    // Draw neon outer dream halo ring
    ctx.beginPath();
    ctx.arc(0, 0, baseSize * 0.95 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
    ctx.lineWidth = 4;
    ctx.shadowBlur = isMobile ? 0 : 15;
    ctx.shadowColor = '#ec4899';
    ctx.stroke();

    // Symmetrical flawless bezier heart curves
    ctx.beginPath();
    const size = baseSize * pulse;
    ctx.moveTo(0, -size / 4);
    // Left bezier lobe
    ctx.bezierCurveTo(-size / 2, -size * 3/4, -size, -size / 3, -size / 10, size / 2);
    ctx.lineTo(0, size * 0.88);
    // Right bezier lobe
    ctx.lineTo(size / 10, size / 2);
    ctx.bezierCurveTo(size, -size / 3, size / 2, -size * 3/4, 0, -size / 4);
    ctx.closePath();

    ctx.fillStyle = '#ff007f'; // Rose Pink!
    ctx.shadowBlur = isMobile ? 0 : 35;
    ctx.shadowColor = '#f43f5e';
    ctx.fill();

    // Star highlights stamp on bottom heart
    ctx.save();
    ctx.translate(-size / 4, -size / 4);
    drawFourPointStarPath(ctx, 0, 0, size / 5, '#ffffff');
    ctx.restore();

    // Sparkle text banner above heart
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Share Tech Mono", monospace';
    ctx.shadowBlur = isMobile ? 0 : 4;
    ctx.shadowColor = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('じ☆ve 暃主流 じ☆ve', 0, -size/1.5);

    ctx.restore();
  };

  // Rendering routine for Canvas Particle engine (explosion + trails)
  const drawParticleEngine = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    // Hard cap to prevent runaway GPU load (mobile: 80, desktop: 250)
    if (particlesRef.current.length > MAX_PARTICLES) {
      particlesRef.current = particlesRef.current.slice(-MAX_PARTICLES);
    }

    particlesRef.current.forEach(p => {
      // Custom physics for 'sparkle' bubbles (sway back and forth, move upwards)
      if (p.type === 'sparkle') {
        p.y += p.vy;
        // Sway horizontally using a sine function based on lifetime and unique particle index
        const swaySeed = parseInt(p.id.slice(-3), 36) || 0;
        p.x += Math.sin((p.life + swaySeed) / 8) * 1.5;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.type !== 'ring') {
          p.vy += 0.085; // downward gravitational pull
        } else {
          p.size += 14.0; // rapid expanding ring shockwave
        }
      }
      
      p.life -= 1;
      let baseAlpha = Math.max(0, p.life / p.maxLife);

      // Prevent particles from covering more than 1/2 of the face by fading them out inside the face's area
      const fd = faceMetricsRef.current;
      if (fd && fd.detected) {
        const faceX = (1 - fd.centerX) * ctx.canvas.width;
        const faceY = fd.centerY * ctx.canvas.height;
        // Face radius in pixels (approx 45% of face height)
        const faceRadius = fd.height * 0.45 * ctx.canvas.height;
        if (faceRadius > 5) {
          const dx = p.x - faceX;
          const dy = p.y - faceY;
          const dist = Math.hypot(dx, dy);
          if (dist < faceRadius) {
            const ratio = dist / faceRadius; // 0 at center, 1 at edge
            // Fade out the particle inside the face area rapidly to ensure a clean, un-obscured face!
            // This prevents any dense spewing or scattering section from blocking more than 1/2 of the user's face.
            baseAlpha *= Math.pow(ratio, 2.8);
            if (ratio < 0.6) {
              baseAlpha *= 0.3; // Extra safety guard to ensure no dense cluster blocks the main face area
            }
          }
        }
      }

      p.alpha = baseAlpha;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;

      if (p.type === 'star') {
        drawFourPointStarPath(ctx, 0, 0, p.size, p.color);
      } else if (p.type === 'sparkle') {
        // Draw a romantic glassy transparent pink bubble with shiny light flare and heart core!
        const r = p.size;
        
        // Shadow glow
        ctx.shadowBlur = isMobile ? 0 : 10;
        ctx.shadowColor = p.color;

        // Outer transparent glossy ring
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Shiny reflective highlight glare on the bubble shoulder
        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 0;
        ctx.fill();

        // Tiny heart inside the bubble!
        ctx.beginPath();
        const hr = r * 0.45;
        ctx.moveTo(0, -hr / 4);
        ctx.bezierCurveTo(-hr / 2, -hr * 3 / 4, -hr, -hr / 3, -hr / 10, hr / 2);
        ctx.lineTo(0, hr * 0.88);
        ctx.lineTo(hr / 10, hr / 2);
        ctx.bezierCurveTo(hr, -hr / 3, hr / 2, -hr * 3 / 4, 0, -hr / 4);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'diamond') {
        // Draw shiny cyan diamond
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.65, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.65, 0);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.shadowBlur = isMobile ? 0 : 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      } else if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = isMobile ? 0 : 12;
        ctx.shadowColor = p.color;
        ctx.stroke();
      } else { // heart chunk particle
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(0, -s / 4);
        ctx.bezierCurveTo(-s / 2, -s * 3/4, -s, -s / 3, -s / 10, s / 2);
        ctx.lineTo(0, s * 0.88);
        ctx.lineTo(s / 10, s / 2);
        ctx.bezierCurveTo(s, -s / 3, s / 2, -s * 3/4, 0, -s / 4);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.shadowBlur = isMobile ? 0 : 6;
        ctx.shadowColor = p.color;
        ctx.fill();
      }

      ctx.restore();
    });
  };

  // Sticker Placement Routine
  const addSticker = (emoji: string, text?: string) => {
    const canvas = canvasRef.current;
    const viewportX = canvas ? canvas.width / 2 + (Math.random() - 0.5) * 80 : 250;
    const viewportY = canvas ? canvas.height / 2 + (Math.random() - 0.5) * 80 : 200;

    const newSticker: Y2KSticker = {
      id: Math.random().toString(),
      emoji,
      text,
      x: viewportX,
      y: viewportY,
      scale: 1.0,
      rotation: (Math.random() - 0.5) * 20 // minor slant
    };

    setStickers(prev => [...prev, newSticker]);
  };

  const getViewportCoords = (clientX: number, clientY: number) => {
    const container = canvasRef.current?.parentElement;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const scaleX = 640 / rect.width;
    const scaleY = 480 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 640 / rect.width;
    const scaleY = 480 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const isPaintingRef = useRef(false);
  const lastPaintPosRef = useRef<{ x: number; y: number } | null>(null);
  const paintFlushRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Batch React state sync — avoids per-pixel re-renders
  const flushNow = () => {
    if (paintFlushRef.current) { clearTimeout(paintFlushRef.current); paintFlushRef.current = null; }
    setDrawnPixels({ ...drawnPixelsRef.current });
  };
  const flushLater = () => {
    if (!paintFlushRef.current) {
      paintFlushRef.current = setTimeout(() => { paintFlushRef.current = null; flushNow(); }, 50);
    }
  };

  // Bresenham line interpolation to fill gaps between fast mouse moves
  const paintLineBetween = (fromX: number, fromY: number, toX: number, toY: number) => {
    const size = pixelSize;
    // Work in grid-aligned coordinates
    const x0 = Math.floor(fromX / size);
    const y0 = Math.floor(fromY / size);
    const x1 = Math.floor(toX / size);
    const y1 = Math.floor(toY / size);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      const px = cx * size;
      const py = cy * size;
      if (px >= 0 && px < 640 && py >= 0 && py < 480) {
        placePixel(px, py, size);
      }
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
  };

  const placePixel = (xAlign: number, yAlign: number, size: number) => {
    const key = `${xAlign},${yAlign}`;
    const newPixels = { ...drawnPixelsRef.current };

    if (drawColor === 'eraser') {
      let changed = false;
      Object.keys(newPixels).forEach((k) => {
        const [pxStr, pyStr] = k.split(',');
        const px = parseInt(pxStr, 10);
        const py = parseInt(pyStr, 10);
        const pSize = newPixels[k].size;
        if (xAlign >= px && xAlign < px + pSize && yAlign >= py && yAlign < py + pSize) {
          delete newPixels[k];
          changed = true;
        }
      });
      if (newPixels[key]) {
        delete newPixels[key];
        changed = true;
      }
      if (changed) {
        drawnPixelsRef.current = newPixels;
        flushLater();
      }
    } else {
      if (newPixels[key] && newPixels[key].color === drawColor && newPixels[key].size === size) return;
      newPixels[key] = { color: drawColor, size };
      drawnPixelsRef.current = newPixels;
      flushLater();
    }
  };

  const paintPixelAt = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);
    const x = coords.x;
    const y = coords.y;
    if (x < 0 || x >= 640 || y < 0 || y >= 480) return;

    const prev = lastPaintPosRef.current;
    if (prev) {
      paintLineBetween(prev.x, prev.y, x, y);
    } else {
      const size = pixelSize;
      const xAlign = Math.floor(x / size) * size;
      const yAlign = Math.floor(y / size) * size;
      placePixel(xAlign, yAlign, size);
    }
    lastPaintPosRef.current = { x, y };
  };

  const handleDrawStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    isPaintingRef.current = true;
    lastPaintPosRef.current = null;
    paintPixelAt(e.clientX, e.clientY);
  };

  const handleDrawMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPaintingRef.current) return;
    paintPixelAt(e.clientX, e.clientY);
  };

  const handleDrawEnd = () => {
    isPaintingRef.current = false;
    flushNow();
  };

  const handleDrawTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    isPaintingRef.current = true;
    lastPaintPosRef.current = null;
    if (e.touches[0]) {
      paintPixelAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleDrawTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isPaintingRef.current) return;
    if (e.touches[0]) {
      paintPixelAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const startStickerTransform = (e: React.MouseEvent | React.TouchEvent, id: string, mode: 'scale' | 'rotate') => {
    e.stopPropagation();
    e.preventDefault();
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const mCoords = getViewportCoords(clientX, clientY);
    const cx = sticker.x;
    const cy = sticker.y;

    const startAngle = Math.atan2(mCoords.y - cy, mCoords.x - cx) * (180 / Math.PI);
    const startDist = Math.hypot(mCoords.x - cx, mCoords.y - cy);

    setTransformState({
      id,
      mode,
      startAngle,
      startDist: startDist > 0 ? startDist : 1,
      initialScale: sticker.scale,
      initialRotation: sticker.rotation,
    });
    setSelectedStickerId(id);
  };

  // Drag and Drop interaction handlers on Y2K absolute stickers
  const handleStickerMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setDraggingId(id);
    setSelectedStickerId(id); // Select sticker for rotation scaling!
    const sticker = stickers.find(s => s.id === id);
    if (sticker) {
      setDragOffset({
        x: e.clientX - sticker.x,
        y: e.clientY - sticker.y
      });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (transformState) {
      const sticker = stickers.find(s => s.id === transformState.id);
      if (!sticker) return;

      const mCoords = getViewportCoords(e.clientX, e.clientY);
      const cx = sticker.x;
      const cy = sticker.y;

      if (transformState.mode === 'rotate') {
        const currentAngle = Math.atan2(mCoords.y - cy, mCoords.x - cx) * (180 / Math.PI);
        const deltaAngle = currentAngle - transformState.startAngle;
        const newRotation = (transformState.initialRotation + deltaAngle + 360) % 360;
        setStickers(prev => prev.map(s => s.id === transformState.id ? { ...s, rotation: newRotation } : s));
      } else if (transformState.mode === 'scale') {
        const currentDist = Math.hypot(mCoords.x - cx, mCoords.y - cy);
        const ratio = currentDist / transformState.startDist;
        const newScale = Math.max(0.25, Math.min(4.5, transformState.initialScale * ratio));
        setStickers(prev => prev.map(s => s.id === transformState.id ? { ...s, scale: newScale } : s));
      }
      return;
    }

    if (!draggingId) return;
    setStickers(prev => prev.map(s => {
      if (s.id === draggingId) {
        return {
          ...s,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
      }
      return s;
    }));
  };

  const handleContainerMouseUp = () => {
    setDraggingId(null);
    setTransformState(null);
  };

  // Drag handlers for Mobile Touch events
  const handleStickerTouchStart = (e: React.TouchEvent, id: string) => {
    setDraggingId(id);
    setSelectedStickerId(id); // Select sticker for touch devices!
    const sticker = stickers.find(s => s.id === id);
    if (sticker && e.touches[0]) {
      setDragOffset({
        x: e.touches[0].clientX - sticker.x,
        y: e.touches[0].clientY - sticker.y
      });
    }
  };

  const handleContainerTouchMove = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    const touch = e.touches[0];

    if (transformState) {
      const sticker = stickers.find(s => s.id === transformState.id);
      if (!sticker) return;

      const mCoords = getViewportCoords(touch.clientX, touch.clientY);
      const cx = sticker.x;
      const cy = sticker.y;

      if (transformState.mode === 'rotate') {
        const currentAngle = Math.atan2(mCoords.y - cy, mCoords.x - cx) * (180 / Math.PI);
        const deltaAngle = currentAngle - transformState.startAngle;
        const newRotation = (transformState.initialRotation + deltaAngle + 360) % 360;
        setStickers(prev => prev.map(s => s.id === transformState.id ? { ...s, rotation: newRotation } : s));
      } else if (transformState.mode === 'scale') {
        const currentDist = Math.hypot(mCoords.x - cx, mCoords.y - cy);
        const ratio = currentDist / transformState.startDist;
        const newScale = Math.max(0.25, Math.min(4.5, transformState.initialScale * ratio));
        setStickers(prev => prev.map(s => s.id === transformState.id ? { ...s, scale: newScale } : s));
      }
      return;
    }

    if (!draggingId) return;
    setStickers(prev => prev.map(s => {
      if (s.id === draggingId) {
        return {
          ...s,
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        };
      }
      return s;
    }));
  };

  // Clear stickers
  const clearAllStickers = () => {
    setStickers([]);
    setSelectedStickerId(null);
  };

  // Filter styles list mapper
  const getFilterCSSClass = () => {
    switch (selectedFilter) {
      case 'dreamy-pink':
        return 'saturate-[1.6] contrast-[1.12] brightness-[1.08] sepia-[0.14]';
      case 'lomo-nostalgia':
        return 'contrast-[1.45] saturate-[1.8] brightness-[0.92] grayscale-[0.05]';
      case 'cyber-cyan':
        return 'hue-rotate-[175deg] saturate-[1.4] contrast-[1.3] brightness-[1.04]';
      case 'golden-seventies':
        return 'sepia-[0.55] contrast-[1.25] brightness-[1.08] saturate-[1.85]';
      default:
        return 'none';
    }
  };

  // Take snap photo screenshot
  const takeSnapshot = () => {
    if (!canvasRef.current) return;
    
    // Play camera shutter sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.20);
    } catch (e) {}

    // 1. Create a temporary canvas matching original resolution
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = 640;
    captureCanvas.height = 480;
    const exportCtx = captureCanvas.getContext('2d');
    if (!exportCtx) return;

    // 2. Set identical dynamic color adjustments on high-fidelity context before we draw feed
    exportCtx.filter = getFilterCSSValue(selectedFilter, filterIntensity);

    // 3. Render active canvas snapshot frame onto capture canvas (this carries feed, vignettes, particles, hand hearts)
    exportCtx.drawImage(canvasRef.current, 0, 0);

    // 4. Force reset context filters to avoid distorting borders or sticker colors
    exportCtx.filter = 'none';

    // 5. Build chosen sticker / frame borders on top of the graphics layer
    if (selectedFrame !== 'none') {
      let borderColor = '#ff00ff';
      let topBg = '#ff00ff';
      let textColor = '#ffffff';
      let botBg = '#1a052e';
      let bannerBorderColor = '#ff00ff';
      let labelLeftTop = '✧ 傷感・愛 ✧';
      let labelRightTop = '🌸 莣憂愺 🌸';
      let labelLeftBot = 'じ☆ve 伱湜涐の蓶①';
      let labelRightBot = '★ Y2K PARTY ★';

      if (selectedFrame === 'cyber-star-frame') {
        borderColor = '#00ffff';
        topBg = '#00ffff';
        textColor = '#000000';
        botBg = '#0d0216';
        bannerBorderColor = '#00ffff';
        labelLeftTop = '⚡ HYPER CYBER ⚡';
        labelRightTop = '✦ DISCO PARTY ✦';
        labelLeftBot = '✖ 非主流・強勢回歸 ✖';
        labelRightBot = '2007 // 2026';
      } else if (selectedFrame === 'emo-sad-frame') {
        borderColor = '#ec4899';
        topBg = '#db2777';
        textColor = '#ffffff';
        botBg = '#1a052e';
        bannerBorderColor = '#ec4899';
        labelLeftTop = '单、因尒而蓅';
        labelRightTop = '💔 SAD BOY EMO';
        labelLeftBot = 'ら 傷感。爺 ゞ';
        labelRightBot = '縸誮亦泠 ╰☆╮';
      }

      exportCtx.save();
      // Outer border frame line
      exportCtx.strokeStyle = borderColor;
      exportCtx.lineWidth = 14;
      exportCtx.strokeRect(7, 7, 640 - 14, 480 - 14);

      // Top slogan design bar
      exportCtx.fillStyle = topBg;
      exportCtx.beginPath();
      if (exportCtx.roundRect) {
        exportCtx.roundRect(24, 20, 640 - 48, 24, 4);
      } else {
        exportCtx.rect(24, 20, 640 - 48, 24);
      }
      exportCtx.fill();
      if (selectedFrame !== 'dreamy-pink-frame') {
        exportCtx.strokeStyle = borderColor;
        exportCtx.lineWidth = 1.5;
        exportCtx.stroke();
      }

      // Slogan Texts inside banner
      exportCtx.fillStyle = textColor;
      // standard fallback fonts used
      exportCtx.font = 'bold 11px "Microsoft JhengHei", sans-serif';
      exportCtx.textAlign = 'left';
      exportCtx.textBaseline = 'middle';
      exportCtx.fillText(labelLeftTop, 32, 32);

      exportCtx.textAlign = 'right';
      exportCtx.fillText(labelRightTop, 640 - 32, 32);

      // Bottom design bar
      exportCtx.fillStyle = botBg;
      exportCtx.beginPath();
      if (exportCtx.roundRect) {
        exportCtx.roundRect(24, 480 - 44, 640 - 48, 24, 4);
      } else {
        exportCtx.rect(24, 480 - 44, 640 - 48, 24);
      }
      exportCtx.fill();
      exportCtx.strokeStyle = bannerBorderColor;
      exportCtx.lineWidth = 1.5;
      exportCtx.stroke();

      // Bottom slogan texts
      exportCtx.fillStyle = selectedFrame === 'cyber-star-frame' ? '#00ffff' : (selectedFrame === 'emo-sad-frame' ? '#f472b6' : '#ffffff');
      exportCtx.font = 'bold 11px "Microsoft JhengHei", sans-serif';
      exportCtx.textAlign = 'left';
      exportCtx.textBaseline = 'middle';
      exportCtx.fillText(labelLeftBot, 32, 480 - 32);

      exportCtx.textAlign = 'right';
      exportCtx.fillText(labelRightBot, 640 - 32, 480 - 32);

      exportCtx.restore();
    }

    // 6. Draw all active user-placed stickers onto compilation context
    stickers.forEach(sticker => {
      exportCtx.save();
      // Translate, rotate, and scale relative to canvas coordinates
      exportCtx.translate(sticker.x, sticker.y);
      exportCtx.rotate((sticker.rotation * Math.PI) / 180);
      exportCtx.scale(sticker.scale, sticker.scale);

      if (sticker.text) {
        // Render text label bubble
        const text = sticker.text;
        exportCtx.font = 'bold 13px "Microsoft JhengHei", "ZCOOL XiaoWei", sans-serif';
        const textWidth = exportCtx.measureText(text).width;
        
        const paddingX = 10;
        const paddingY = 5;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = 16 + paddingY * 2;
        
        exportCtx.fillStyle = '#1a052e';
        exportCtx.strokeStyle = '#ff00ff';
        exportCtx.lineWidth = 1.5;
        
        const rx = -boxWidth / 2;
        const ry = -boxHeight / 2;
        
        exportCtx.beginPath();
        if (exportCtx.roundRect) {
          exportCtx.roundRect(rx, ry, boxWidth, boxHeight, 4);
        } else {
          exportCtx.rect(rx, ry, boxWidth, boxHeight);
        }
        exportCtx.fill();
        exportCtx.stroke();
        
        exportCtx.fillStyle = '#00ffff';
        exportCtx.textAlign = 'center';
        exportCtx.textBaseline = 'middle';
        exportCtx.shadowBlur = 4;
        exportCtx.shadowColor = '#00ffff';
        exportCtx.fillText(text, 0, 0);
      } else {
        // Render large Emoji icon
        const emoji = sticker.emoji;
        exportCtx.font = '40px sans-serif';
        exportCtx.textAlign = 'center';
        exportCtx.textBaseline = 'middle';
        exportCtx.fillText(emoji, 0, 0);
      }

      exportCtx.restore();
    });

    // 6.5. Render user's custom pixel art drawing on top of everything
    exportCtx.save();
    Object.entries(drawnPixelsRef.current).forEach(([key, val]) => {
      const pixel = val as { color: string; size: number };
      const [xStr, yStr] = key.split(',');
      const px = parseInt(xStr, 10);
      const py = parseInt(yStr, 10);
      exportCtx.fillStyle = pixel.color;
      exportCtx.fillRect(px, py, pixel.size, pixel.size);
    });
    exportCtx.restore();

    // 7. Store the final composited image as data URL of PNG
    const dataUrl = captureCanvas.toDataURL('image/png');
    setSnapshotPreviewUrl(dataUrl);
  };

  // Triggers final actual file system saving upon preview confirmation with Directory path configurations
  const confirmSaveSnapshot = async () => {
    if (!snapshotPreviewUrl) return;
    const safeFolderLabel = virtualFolderSuffix ? virtualFolderSuffix.replace(/[\/\\:]/g, '-') : 'Y2K_Album';
    const filename = `[${safeFolderLabel}]_y2k_photo_${Date.now()}.png`;

    try {
      if (directoryHandle) {
        // Query and verify storage permission
        const queryOpts = { mode: 'readwrite' as const };
        if (await directoryHandle.queryPermission(queryOpts) !== 'granted') {
          const requestResult = await directoryHandle.requestPermission(queryOpts);
          if (requestResult !== 'granted') {
            throw new Error('Directory access permission denied.');
          }
        }
        const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        
        // Convert data URL to blob
        const res = await fetch(snapshotPreviewUrl);
        const blob = await res.blob();
        await writable.write(blob);
        await writable.close();
        
        alert(`💾 保存成功！照片已自動儲存至您的預設本機路徑中：\n📂 ${directoryHandle.name}/${filename}`);
        setSnapshotPreviewUrl(null);
        return;
      }
    } catch (e) {
      console.warn('Directory handle saving error, falling back to instant browser download:', e);
    }

    // Fallback regular browser download (always triggers download dialog with virtual prefix folder prefix!)
    const link = document.createElement('a');
    link.download = filename;
    link.href = snapshotPreviewUrl;
    link.click();
    setSnapshotPreviewUrl(null);
  };

  return (
    <div 
      className="relative flex flex-col lg:flex-row lg:items-start gap-8 px-4 max-w-6xl w-full mx-auto justify-center select-none z-10"
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onTouchMove={handleContainerTouchMove}
      onTouchEnd={handleContainerMouseUp}
    >
      {/* LEFT: Classic webcam layout framed nicely like Y2K beauty software with neon borders */}
      <div 
        className="relative flex flex-col bg-[#1a052e]/95 border-4 border-[#ff00ff] rounded-3xl p-5 w-full md:w-[680px] shrink-0 shadow-[0_0_40px_rgba(255,0,255,0.2)] transition-all duration-300"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), inset 0 2px 0 rgba(255, 0, 255, 0.2)'
        }}
      >
        {/* Soft glossy retro top panel */}
        <div className="flex items-center justify-between border-b-2 border-[#ff00ff]/30 pb-3 mb-4 select-none">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#ff00ff] shadow-[0_0_8px_#ff00ff] animate-pulse" />
            <span className="font-mono text-xs tracking-widest text-[#00ffff] font-bold">
              Y2K_LIVE_VIEWFINDER.EXE
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0d0216]/80 rounded-full border-2 border-[#ff00ff]/30 text-[10px] font-mono text-[#ff00ff]">
              <span className="text-[10px] text-[#00ffff] animate-ping">●</span>
              <span>FEED GESTURE:</span>
              <span className={`font-black uppercase tracking-wider ${
                activeGesture === 'heart' ? 'text-[#ff00ff] blink-text-effect' : activeGesture === 'explosion' ? 'text-[#00ffff] font-extrabold animate-bounce' : 'text-stone-500'
              }`}>
                {activeGesture === 'heart' ? '❤ PALM_MEET' : activeGesture === 'explosion' ? '✵ DISCO_BOOM' : 'STANDBY'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#00ffff] bg-[#0d0216]/80 p-1 px-2.5 rounded border border-[#00ffff]/20">
              BPM: <span className="font-bold text-yellow-300">{(128 * tempoMultiplier).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* HIDDEN VIDEO SOURCE TRACK & ISOLATED FACEMESH SANDBOX */}
        <video 
          id="webcam-raw-video"
          ref={videoRef}
          style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
          playsInline
          muted
          autoPlay
          width="640"
          height="480"
        />
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          style={{ display: 'none', width: '1px', height: '1px', position: 'absolute', opacity: 0 }}
          title="facemesh-isolated-sandbox"
        />

        {/* CENTERPIECE: STYLIZED VIEWPORT */}
        <div 
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.y2k-sticker-container')) {
              setSelectedStickerId(null);
            }
          }}
          onTouchStart={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.y2k-sticker-container')) {
              setSelectedStickerId(null);
            }
          }}
          className="relative w-full overflow-hidden border-2 border-[#ff00ff] rounded-2xl bg-[#0d0216] flex items-center justify-center min-h-[300px] md:min-h-[480px]"
        >
          {/* Scanline CRT simulation */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] z-20 opacity-45" />
          
          {/* Scanline highlighter laser active */}
          <div className="absolute w-full h-[2px] bg-[#00ffff]/40 top-0 shadow-[0_0_10px_#00ffff] pointer-events-none z-20" style={{ animation: 'scanline 4s linear infinite' }} />

          {/* WATERMARK BACKGROUND IN TEXT DECORATION */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
            <div className="text-[80px] md:text-[120px] font-black text-white italic tracking-tighter">GLOW_UP</div>
          </div>

          {/* ACTIVE VIEWFINDER */}
          <canvas
            id="webcam-canvas"
            ref={canvasRef}
            width="640"
            height="480"
            className="w-full h-auto aspect-[4/3] rounded-2xl cursor-crosshair border border-[#ff00ff]/20 bg-[#0d0216] transition-all"
            style={{ filter: getFilterCSSValue(selectedFilter, filterIntensity) }}
          />

          {/* DYNAMIC DRAWING OVERLAY LAYER */}
          {isDrawMode && (
            <div
              className="absolute aspect-[4/3] w-full rounded-2xl z-45 cursor-crosshair"
              style={{ touchAction: 'none' }}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              onTouchStart={handleDrawTouchStart}
              onTouchMove={handleDrawTouchMove}
              onTouchEnd={handleDrawEnd}
            />
          )}

          {/* DRAGGABLE Y2K STICKERS LAYER */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {stickers.map((sticker) => {
              const isSelected = selectedStickerId === sticker.id;
              return (
                <div
                  key={sticker.id}
                  onMouseDown={(e) => handleStickerMouseDown(e, sticker.id)}
                  onTouchStart={(e) => handleStickerTouchStart(e, sticker.id)}
                  className={`absolute select-none pointer-events-auto cursor-move group transition-transform duration-700 ease-out y2k-sticker-container ${
                    isSelected ? 'ring-2 ring-dashed ring-[#00ffff] ring-offset-2 ring-offset-[#1a052e] rounded-lg p-2.5 bg-black/10' : ''
                  }`}
                  style={{
                    left: `${(sticker.x / 640) * 100}%`,
                    top: `${(sticker.y / 480) * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`
                  }}
                  data-sticker-id={sticker.id}
                >
                  {/* Top-Right/Left Delete Button */}
                  {isSelected && (
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setStickers(prev => prev.filter(s => s.id !== sticker.id));
                        setSelectedStickerId(null);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setStickers(prev => prev.filter(s => s.id !== sticker.id));
                        setSelectedStickerId(null);
                      }}
                      className="absolute -top-3.5 -left-3.5 w-[22px] h-[22px] flex items-center justify-center bg-rose-600 border border-white text-white text-[10px] font-black rounded-full transition cursor-pointer shadow-[0_0_8px_rgba(225,29,72,0.6)] hover:bg-rose-700 pointer-events-auto z-40 active:scale-90"
                      title="刪除"
                    >
                      ✕
                    </button>
                  )}

                  {/* Top-Middle Rotate Handle connected with a stem */}
                  {isSelected && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40">
                      <button
                        onMouseDown={(e) => startStickerTransform(e, sticker.id, 'rotate')}
                        onTouchStart={(e) => startStickerTransform(e, sticker.id, 'rotate')}
                        className="w-6 h-6 flex items-center justify-center bg-[#00ffff] border border-white text-xs text-black font-extrabold rounded-full transition cursor-grab active:cursor-grabbing shadow-[0_0_8px_rgba(0,255,255,0.6)] hover:bg-[#ff00ff] hover:text-white hover:scale-110"
                        title="拖動旋轉"
                      >
                        ⟳
                      </button>
                      <div className="w-[1.5px] h-4 bg-[#00ffff] shadow-[0_0_4px_#00ffff]" />
                    </div>
                  )}

                  {/* Bottom-Right Scale/Resize Handle */}
                  {isSelected && (
                    <button
                      onMouseDown={(e) => startStickerTransform(e, sticker.id, 'scale')}
                      onTouchStart={(e) => startStickerTransform(e, sticker.id, 'scale')}
                      className="absolute -bottom-3.5 -right-3.5 w-6 h-6 flex items-center justify-center bg-[#ff00ff] border border-white text-white font-black rounded-full transition cursor-se-resize shadow-[0_0_8px_rgba(255,0,255,0.6)] hover:bg-[#00ffff] hover:text-black hover:scale-110 pointer-events-auto z-40"
                      title="拖動縮放"
                      style={{ fontSize: '11px' }}
                    >
                      ⤄
                    </button>
                  )}

                  {/* Render Text or Emoji */}
                  {sticker.text ? (
                    <span className="inline-block px-3 py-1 bg-[#1a052e] border-2 border-[#ff00ff] text-[#00ffff] font-sans text-xs font-bold whitespace-nowrap rounded-md shadow-lg drop-shadow-[0_4px_12px_rgba(255,0,255,0.3)] select-none">
                      {sticker.text}
                    </span>
                  ) : (
                    <span className="text-4xl md:text-5xl inline-block drop-shadow-[0_4px_12px_rgba(255,0,255,0.5)] select-none">
                      {sticker.emoji}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* CAMERA DISCONNECTED / INACTIVE STANDBY COVER GRAPHIC */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0216]/95 p-6 text-center z-30 border-4 border-dashed border-[#ff00ff]/30 rounded-2xl m-2">
              <div className="p-4 bg-[#1a052e] border-2 border-[#ff00ff] rounded-full mb-4 shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                <CameraOff className="w-12 h-12 text-[#ff00ff] blink-text-effect" />
              </div>
              <h3 
                className="text-2xl font-black text-[#ff00ff] italic tracking-tight mb-2 uppercase"
                style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif', textShadow: '2px 2px 0px #00ffff' }}
              >
                ✦ GLOW-UP SYSTEM INACTIVE ✦
              </h3>
              <p className="text-xs text-stone-300 max-w-sm mb-6 leading-relaxed">
                本鏡頭套用經典「非主流極鮮」Y2K風格色彩，開啟後在鏡頭前將「雙手掌根並攏」解鎖粉紅愛心特效，「雙手交叉」即爆裂閃亮碎片！
              </p>

              <button
                onClick={toggleCamera}
                className="px-6 py-3 bg-[#ff00ff] text-white hover:bg-white hover:text-[#1a052e] font-black text-sm uppercase tracking-wider rounded-xl cursor-pointer shadow-lg hover:shadow-[#ff00ff]/40 active:scale-95 transition-all flex items-center gap-2 border-2 border-white skew-x-[-6deg]"
              >
                <Camera className="w-4 h-4" />
                啟動美體魔法相機
              </button>
            </div>
          )}

          {/* RETRO PHOTO BOOTH FRAMES (大頭貼相框邊框) */}
          {cameraActive && selectedFrame !== 'none' && (
            <div className="absolute inset-0 pointer-events-none z-20 border-[14px] border-transparent">
              {selectedFrame === 'dreamy-pink-frame' && (
                <div className="absolute inset-0 border-6 border-[#ff00ff]/60 rounded-lg flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] text-white font-bold tracking-wider bg-[#ff00ff] p-0.5 px-2 rounded border border-white uppercase select-none">
                    <span>✧ 傷感・愛 ✧</span>
                    <span>🌸 莣憂愺 🌸</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-white font-bold tracking-wider bg-[#1a052e] p-0.5 px-2 rounded border border-[#ff00ff] uppercase select-none">
                    <span>じ☆ve 伱湜涐の蓶①</span>
                    <span>★ Y2K PARTY ★</span>
                  </div>
                </div>
              )}
              {selectedFrame === 'cyber-star-frame' && (
                <div className="absolute inset-0 border-6 border-[#00ffff]/60 rounded-lg flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] text-black font-black tracking-wider bg-[#00ffff] p-0.5 px-2 rounded border border-white font-mono select-none">
                    <span>⚡ HYPER CYBER ⚡</span>
                    <span>✦ DISCO PARTY ✦</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#00ffff] font-bold tracking-wider bg-[#0d0216] p-0.5 px-2 rounded border border-[#00ffff] select-none">
                    <span>✖ 非主流・強勢回歸 ✖</span>
                    <span>2007 // 2026</span>
                  </div>
                </div>
              )}
              {selectedFrame === 'emo-sad-frame' && (
                <div className="absolute inset-0 border-6 border-pink-500/70 rounded-lg flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] text-white font-bold tracking-wider bg-pink-600 p-0.5 px-2 rounded border border-white select-none">
                    <span>泪、因尒而蓅</span>
                    <span>💔 SAD BOY EMO</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-pink-300 font-bold tracking-wider bg-[#1a052e] p-0.5 px-2 rounded border border-pink-500 select-none">
                    <span>ら 傷感。爺 ゞ</span>
                    <span>縸誮亦泠 ╰☆╮</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. REAL-TIME [SYSTEM_LOG] PANEL HUD */}
        <div className="mt-4 p-4 bg-[#0d0216]/90 border-2 border-[#ff00ff] rounded-xl z-10">
          <p className="text-[#00ffff] font-mono text-xs mb-2 font-bold select-none flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00ffff] rounded-full animate-pulse" />
            [SYSTEM_Glow_LOG] // LIVE
          </p>
          <div className="text-[10px] font-mono space-y-1 text-[#ff00ff]/80">
            <div className="flex justify-between">
              <span>&gt; Camera active state:</span>
              <span className={cameraActive ? "text-green-400" : "text-stone-500"}>{cameraActive ? "ACTIVE_STREAMING" : "STANDBY"}</span>
            </div>
            <div className="flex justify-between">
              <span>&gt; Gesture parser buffer:</span>
              <span className="text-[#00ffff]">Palm_Detector_V1.1</span>
            </div>
            <div className="flex justify-between">
              <span>&gt; Active magic rendering:</span>
              <span className="text-yellow-300 font-bold uppercase">{activeGesture === 'heart' ? '❤ RENDERING_HEART(HIGH_GLOW)' : activeGesture === 'explosion' ? '✵ ACTIVE_PARTICLE_SHOCKWAVE' : 'ZERO_STRETCH'}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>&gt; Loaded frame decoder:</span>
              <span>{selectedFrame.toUpperCase() || "NONE"}</span>
            </div>
            <p className="blink-text-effect text-[#00ffff]">_</p>
          </div>
        </div>

        {/* BOTTOM UTILITY: TRIGGER SNAPSHOT PHOTO AND TOGGLES */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t-2 border-[#ff00ff]/20">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={takeSnapshot}
              disabled={!cameraActive}
              className={`px-5 py-2.5 bg-[#ff00ff] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition border-2 border-white skew-x-[-4deg] ${
                !cameraActive ? 'opacity-30 cursor-not-allowed' : 'active:scale-95 cursor-pointer hover:bg-white hover:text-black hover:shadow-[#ff00ff]/30'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#00ffff]" />
              拍照大頭貼 (Snap)
            </button>
            <button
              onClick={() => setFolderConfigOpen(!folderConfigOpen)}
              className={`px-3 py-2 border-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition flex items-center gap-1.5 ${
                folderConfigOpen || directoryHandle
                  ? 'border-[#00ffff] bg-[#00ffff]/20 text-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                  : 'border-[#ff00ff]/40 bg-[#1a052e] text-[#ff00ff] hover:text-white hover:border-[#ff00ff]'
              }`}
              title="儲存位置設定"
            >
              <span>📂</span>
              <span className="text-[10px] font-bold">
                {directoryHandle ? '已設儲存路徑' : '儲存路徑設定'}
              </span>
            </button>
            <button
              onClick={clearAllStickers}
              disabled={stickers.length === 0}
              className="p-2.5 border-2 border-[#ff00ff]/40 hover:border-[#ff00ff] bg-[#1a052e] rounded-xl text-[#ff00ff] hover:text-white transition cursor-pointer"
              title="清除所有貼紙"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSfxMuted(!sfxMuted)}
              className={`p-2.5 border-2 rounded-xl transition cursor-pointer ${
                sfxMuted
                  ? 'border-red-500/50 hover:border-red-500 bg-red-950/20 text-red-400 hover:text-red-300'
                  : 'border-[#00ffff]/40 hover:border-[#00ffff] bg-[#1a052e] text-[#00ffff] hover:text-white animate-pulse-slow'
              }`}
              title={sfxMuted ? "開啟音效 / 音樂" : "關閉音效 / 音樂"}
            >
              {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className={`px-4 py-2 border-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition ${
                cameraActive 
                  ? 'border-[#ff00ff] bg-[#ff00ff]/10 text-[#ff00ff] hover:bg-[#ff00ff]/20 shadow-[0_0_12px_rgba(255,0,255,0.2)]' 
                  : 'border-[#00ffff]/40 hover:border-[#00ffff] bg-[#0d0216] text-[#00ffff] hover:bg-[#00ffff]/10'
              }`}
            >
              {cameraActive ? '❌ 關閉相機' : '🎬 開啟相機'}
            </button>
          </div>
        </div>

        {/* FOLDER PATH CONFIGURATION SUB-PANEL */}
        {folderConfigOpen && (
          <div className="mt-3 p-3.5 bg-[#0d0216]/95 border-2 border-[#00ffff]/70 rounded-xl animate-pulse-slow">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#00ffff]/20">
              <span className="text-xs font-black text-[#00ffff] tracking-widest uppercase">
                📂 預設儲存目錄與珍藏相簿設置
              </span>
              <button 
                onClick={() => setFolderConfigOpen(false)}
                className="text-stone-400 hover:text-white font-mono text-[10px] cursor-pointer"
              >
                [ ✕ 關閉 ]
              </button>
            </div>
            
            <p className="text-[10px] text-stone-300 leading-relaxed mb-3">
              點擊下方按鈕授權本機資料夾，系統將在拍照確認後將照片「直接寫入」選定文件夾中！
              若您使用的是 iOS/Safari 或無 API 支持，照片下載名將自動載入自定義相簿標籤！
            </p>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#ff00ff] font-bold shrink-0 font-mono">
                  相簿分類標籤:
                </span>
                <input
                  type="text"
                  value={virtualFolderSuffix}
                  onChange={(e) => setVirtualFolderSuffix(e.target.value)}
                  placeholder="例如: Desktop/Y2K_Album"
                  className="flex-1 text-xs px-2.5 py-1.5 bg-[#1a052e] border border-[#ff00ff]/40 rounded-lg text-white font-mono outline-none focus:border-[#ff00ff]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      if ('showDirectoryPicker' in window) {
                        const handle = await (window as any).showDirectoryPicker();
                        setDirectoryHandle(handle);
                        alert(`📂 已安全鏈結本機目錄：${handle.name}！照片儲存更簡單了！`);
                      } else {
                        alert('您的瀏覽器不支援原生 showDirectoryPicker() (推薦在 Google Chrome / Edge 中開啟本地文件夾)。已為您採用帶有自訂文件標籤的下載通道！');
                      }
                    } catch (err) {
                      console.log('User cancelled or failed folder picker access:', err);
                    }
                  }}
                  className="flex-1 py-1.5 px-3 bg-[#0d0216] hover:bg-[#00ffff]/10 border-2 border-[#00ffff] text-[#00ffff] font-black text-[10px] uppercase rounded-lg cursor-pointer text-center transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  📡 {directoryHandle ? `✅ 已授權相簿：${directoryHandle.name}` : '⚡ 授權本機預設快速寫入資料夾 (Chrome/Edge)'}
                </button>
                {directoryHandle && (
                  <button
                    onClick={() => {
                      setDirectoryHandle(null);
                      alert('已重新重設為流覽器下載。');
                    }}
                    className="p-1 px-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-500/10 text-[10px]"
                    title="重設"
                  >
                    重設
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR AREA: two columns + manual grimoire below */}
      <div className="flex flex-col gap-3.5 w-full lg:w-auto shrink-0">
        {/* TOP ROW: two control columns side by side */}
        <div className="flex flex-col lg:flex-row gap-3.5">

      {/* RIGHT COLUMN 1: High-vibe webcam control and decoration console in Vibrant Palette */}
      <div
        className="flex flex-col gap-3.5 w-full lg:w-[290px] shrink-0 text-stone-200 sidebar-scroll lg:pr-1"
        style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto', overscrollBehavior: 'contain' }}
      >
        {/* PANEL 1: PHOTO FILTER AND DECORATIVE FRAME */}
        <div className="bg-[#1a052e]/95 border-2 border-[#ff00ff] p-3 rounded-2xl shadow-[0_0_15px_rgba(255,0,255,0.1)] flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-[#ff00ff]/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-1.5 border-b border-[#ff00ff]/20 pb-1.5 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00ffff] animate-pulse" />
            <h4 
              className="font-black text-xs text-white tracking-widest uppercase"
              style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}
            >
              ★ 美容色彩與相框
            </h4>
          </div>

          {/* FILTER LIST */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-[#00ffff] uppercase tracking-widest">
              非主流。色彩濾鏡
            </label>
            <div className="grid grid-cols-2 gap-1">
              {(['dreamy-pink', 'lomo-nostalgia', 'cyber-cyan', 'golden-seventies', 'no-filter'] as RetroFilterType[]).map((filter) => {
                const names: Record<string, string> = {
                  'dreamy-pink': '🌸 夢幻粉格',
                  'lomo-nostalgia': '📸 LOMO復古',
                  'cyber-cyan': '❄ 憂鬱冰藍',
                  'golden-seventies': '🌟 狂野迪斯',
                  'no-filter': '📷 純原相機'
                };
                const active = selectedFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`py-1 px-1.5 rounded-lg text-left text-[10px] font-bold cursor-pointer transition border ${
                      active 
                        ? 'bg-[#ff00ff]/20 border-[#ff00ff] text-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.2)]' 
                        : 'border-[#ff00ff]/10 bg-[#0d0216]/60 text-stone-300 hover:border-[#ff00ff]/45 hover:text-white'
                    }`}
                  >
                    {names[filter]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FILTER INTENSITY SLIDER */}
          {selectedFilter !== 'no-filter' && (
            <div className="flex flex-col gap-1 mt-1 p-1.5 bg-[#0d0216]/50 border border-[#ff00ff]/20 rounded-lg">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#00ffff] font-bold">濾鏡作用程度 (Intensity)</span>
                <span className="font-mono text-[#00ffff] font-black">{Math.round(filterIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={filterIntensity}
                onChange={(e) => setFilterIntensity(parseFloat(e.target.value))}
                className="w-full accent-[#ff00ff] h-1.5 bg-[#0d0216] rounded-md appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* PHOTO FRAME LIST */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-[#00ffff] uppercase tracking-widest">
              大頭貼。美化相框
            </label>
            <div className="grid grid-cols-2 gap-1">
              {PHOTO_FRAMES.map((frm) => {
                const names: Record<string, string> = {
                  'none': '无相框',
                  'dreamy-pink-frame': '🌸 夢幻粉',
                  'cyber-star-frame': '⚡ 酷炫極光',
                  'emo-sad-frame': '😭 憂傷淚痕'
                };
                return (
                  <button
                    key={frm.id}
                    onClick={() => setSelectedFrame(frm.id)}
                    className={`py-1 px-1.5 text-[10px] rounded-lg transition text-left border cursor-pointer truncate ${
                      selectedFrame === frm.id
                        ? 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] font-bold'
                        : 'border-[#ff00ff]/10 bg-[#0d0216]/60 text-stone-300 hover:border-[#00ffff]/45 hover:text-white'
                    }`}
                    title={frm.name}
                  >
                    {names[frm.id] || frm.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL: GESTURE EFFECTS STYLE SELECTOR */}
        <div className="bg-[#1a052e]/95 border-2 border-[#ff00ff] p-3 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.05)] flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-[#00ffff]/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-1.5 border-b border-[#ff00ff]/20 pb-1.5 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00ffff] animate-pulse" />
            <h4 
              className="font-black text-xs text-white tracking-widest uppercase"
              style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}
            >
              ★ 手勢互動特效設定
            </h4>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-[#00ffff] uppercase tracking-widest">
              手勢觸發。特效主題
            </label>
            <div className="grid grid-cols-2 gap-1 font-sans">
              {[
                { id: 'retro_stars', short: '✨ 碎星', desc: '雙手靠近時散發粉彩碎星粒子' },
                { id: 'heart_bubbles', short: '🫧 氣泡', desc: '手掌中浮現夢幻心形氣泡泡' },
                { id: 'love_balloon', short: '🎈 氣球', desc: '雙手合抱充氣，1.5秒內長大爆裂' },
                { id: 'finger_diamond', short: '💎 碎鑽', desc: '伸出單根手指，指尖跟隨絢麗碎鑽' },
              ].map((styleItem) => {
                const active = activeEffectStyle === styleItem.id;
                return (
                  <button
                    key={styleItem.id}
                    onClick={() => {
                      setActiveEffectStyle(styleItem.id as any);
                      setBalloonProgressPercent(0);
                    }}
                    className={`py-1.5 px-0.5 rounded-lg text-center text-[10px] truncate transition border cursor-pointer ${
                      active 
                        ? 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] font-bold shadow-[0_0_8px_rgba(0,255,255,0.2)]' 
                        : 'border-[#ff00ff]/15 bg-[#0d0216]/60 text-stone-300 hover:border-[#00ffff]/44 hover:text-white'
                    }`}
                    title={styleItem.desc}
                  >
                    <span>{styleItem.short}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Show only active style description */}
            <p className="text-[10px] text-stone-400 font-mono text-center leading-none mt-1">
              {(() => {
                if (activeEffectStyle === 'retro_stars') return '✨ 說明: 雙手靠近時散發粉彩碎星';
                if (activeEffectStyle === 'heart_bubbles') return '🫧 說明: 手掌中漂浮上升亮麗心形氣泡';
                if (activeEffectStyle === 'finger_diamond') return '💎 說明: 伸出單根手指，指尖綻放絢麗碎鑽';
                return '🎈 說明: 雙手合抱充氣，將在1.5秒內膨脹並爆裂';
              })()}
            </p>

            {/* Balloon Color Toggle Option */}
            {activeEffectStyle === 'love_balloon' && (
              <div className="flex items-center justify-between gap-1 mt-1 p-1 bg-[#120422] rounded border border-[#ff00ff]/10">
                <span className="text-[10px] font-bold text-stone-300">🎈 氣球顏色:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setBalloonColor('pink')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition ${
                      balloonColor === 'pink'
                        ? 'bg-pink-600 text-white border border-[#ff00ff] shadow-[0_0_6px_rgba(255,0,255,0.4)]'
                        : 'bg-[#0d0216] text-stone-400 border border-[#ff00ff]/20 hover:text-white'
                    }`}
                  >
                    玫粉色
                  </button>
                  <button
                    onClick={() => setBalloonColor('green')}
                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition ${
                      balloonColor === 'green'
                        ? 'bg-emerald-600 text-white border border-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]'
                        : 'bg-[#0d0216] text-stone-400 border border-[#22c55e]/20 hover:text-white'
                    }`}
                  >
                    綠色
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Balloon active Live Meter progress indicators */}
          {activeEffectStyle === 'love_balloon' && (
            <div className={`bg-[#0d0216] p-1.5 rounded-lg border ${balloonColor === 'green' ? 'border-[#22c55e]/20' : 'border-[#ff00ff]/20'} text-[10px] space-y-0.5`}>
              <div className="flex justify-between font-mono">
                <span className={balloonColor === 'green' ? 'text-[#22c55e]' : 'text-[#ff00ff]'}>BALLOON VALUE:</span>
                <span className="font-black text-[#00ffff]">{balloonProgressPercent.toFixed(0)}%</span>
              </div>
              <div className={`w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border ${balloonColor === 'green' ? 'border-[#22c55e]/10' : 'border-[#ff00ff]/10'}`}>
                <div 
                  className={`h-full transition-all duration-150 bg-gradient-to-r ${
                    balloonColor === 'green' 
                      ? 'from-emerald-500 to-[#00ff66]' 
                      : 'from-pink-500 to-[#ff00ff]'
                  }`}
                  style={{ width: `${balloonProgressPercent}%` }}
                />
              </div>
              <p className="text-[9px] text-stone-400 font-mono text-center leading-none">
                {balloonProgressPercent >= 100 ? '💥 BOOM! BALLOON POPPED!' : '合攏雙手，吹大氣球吧！'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN 2: Stickers & Music — 獨立右側豎列 */}
      <div
        className="flex flex-col gap-3.5 w-full lg:w-[290px] shrink-0 text-stone-200 sidebar-scroll lg:pr-1"
        style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto', overscrollBehavior: 'contain' }}
      >
        {/* PANEL 2: STAMP STICKERS DECORATION BOX */}
        <div className="bg-[#1a052e]/95 border-2 border-[#ff00ff] p-3 rounded-2xl shadow-[0_0_15px_rgba(255,0,255,0.1)] flex flex-col gap-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-[#00ffff]/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-1.5 border-b border-[#ff00ff]/20 pb-1.5 mb-0.5">
            <Heart className="w-3.5 h-3.5 text-[#ff00ff]" />
            <h4 
              className="font-black text-xs text-white tracking-widest uppercase"
              style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}
            >
              ★ 復古貼紙大車拼
            </h4>
          </div>

          {/* PRESENTS EMOJIS */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-[#00ffff] uppercase tracking-widest">
              貼上經典。大頭貼貼圖
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_STICKERS.map((stk, idx) => (
                <button
                  key={idx}
                  onClick={() => addSticker(stk.emoji)}
                  disabled={!cameraActive}
                  className={`py-1 bg-[#0d0216] border border-[#ff00ff]/20 rounded-lg hover:border-[#ff00ff] hover:bg-[#1a052e] active:scale-95 transition text-xl flex items-center justify-center ${
                    !cameraActive ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={stk.label}
                >
                  {stk.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* RETRO PIXEL DRAWER */}
          <div className="flex flex-col gap-1.5 mt-0.5 pt-1.5 border-t border-[#ff00ff]/20">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-[#00ffff] uppercase tracking-widest flex items-center gap-1">
                <span>🖌️ Y2K 像素塗鴉畫筆</span>
              </label>
              {Object.keys(drawnPixels).length > 0 && (
                <button
                  onClick={() => {
                    drawnPixelsRef.current = {};
                    flushNow();
                  }}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition underline cursor-pointer"
                  title="清空畫布上的塗鴉"
                >
                  🧹 清除全部
                </button>
              )}
            </div>

            {/* Mode toggle */}
            <button
              onClick={() => setIsDrawMode(!isDrawMode)}
              disabled={!cameraActive}
              className={`w-full py-1.5 rounded-lg text-[10px] font-black transition border text-center flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(0,0,0,0.4)] ${
                !cameraActive
                  ? 'opacity-30 border-stone-800 bg-[#0d0216] cursor-not-allowed text-stone-500'
                  : isDrawMode
                    ? 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] shadow-[0_0_12px_rgba(0,255,255,0.3)] animate-pulse cursor-pointer'
                    : 'bg-[#ff00ff]/10 border-[#ff00ff]/30 text-[#ff00ff] hover:bg-[#ff00ff]/20 hover:border-[#ff00ff] cursor-pointer'
              }`}
            >
              {isDrawMode ? '✨ 繪圖模式中 (點擊退出) ✨' : '🖌️ 進入像素自訂繪圖 🖌️'}
            </button>

            {/* Active Drawing tools */}
            {isDrawMode && cameraActive && (
              <div className="flex flex-col gap-2 p-2 bg-[#0d0216]/50 rounded-xl border border-[#ff00ff]/10 animate-fade-in">
                {/* 1. Color Swatches */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-pink-300 uppercase">1. 選擇畫筆顏色</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { color: '#ff00ff', label: '粉' },
                      { color: '#00ffff', label: '藍' },
                      { color: '#ffff00', label: '黃' },
                      { color: '#39ff14', label: '綠' },
                      { color: '#b55fe6', label: '紫' },
                      { color: '#ffffff', label: '白' },
                      { color: '#000000', label: '黑' },
                      { color: 'eraser', label: '🧼' },
                    ].map((swatch) => {
                      const isActive = drawColor === swatch.color;
                      return (
                        <button
                          key={swatch.color}
                          onClick={() => setDrawColor(swatch.color)}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border transition-all cursor-pointer ${
                            isActive
                              ? 'border-white scale-110 shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                              : 'border-white/10 hover:scale-105 hover:border-white/40'
                          }`}
                          style={{
                            backgroundColor: swatch.color === 'eraser' ? '#27103d' : swatch.color,
                            color: swatch.color === '#ffffff' || swatch.color === '#ffff00' || swatch.color === '#39ff14' || swatch.color === '#00ffff' ? '#000' : '#fff'
                          }}
                          title={swatch.color === 'eraser' ? '橡皮擦' : swatch.color}
                        >
                          {swatch.color === 'eraser' ? '🧼' : isActive ? '✓' : ''}
                        </button>
                      );
                    })}
                    {/* Clear all pixels button */}
                    {Object.keys(drawnPixels).length > 0 && (
                      <button
                        onClick={() => {
                          drawnPixelsRef.current = {};
                          flushNow();
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border border-red-500/40 bg-red-950/30 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-400 transition-all cursor-pointer active:scale-90"
                        title="清除全部像素畫"
                      >
                        🧹
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Grid cell size selection */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-black text-[#00ffff] uppercase font-bold">
                    <span>2. 像素格子大小</span>
                    <span className="font-mono text-yellow-300">{pixelSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="36"
                    step="2"
                    value={pixelSize}
                    onChange={(e) => setPixelSize(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffff] h-1 bg-[#0d0216] rounded-md appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-stone-400">
                    <button onClick={() => setPixelSize(8)} className="hover:text-white">細 (8px)</button>
                    <button onClick={() => setPixelSize(16)} className="hover:text-white">中 (16px)</button>
                    <button onClick={() => setPixelSize(24)} className="hover:text-white">粗 (24px)</button>
                    <button onClick={() => setPixelSize(32)} className="hover:text-white">極粗 (32px)</button>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-center text-stone-400 bg-black/40 py-1 rounded">
                  💡 畫筆模式下，在外部相機畫面上拖曳/滑動即可繪圖作畫
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: RETRO DISCO TRACKS BOX */}
        <div className="bg-[#1a052e]/95 border-2 border-[#ff00ff] p-3 rounded-2xl shadow-[0_0_15px_rgba(255,0,255,0.1)] flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 border-b border-[#ff00ff]/20 pb-1.5 mb-0.5">
            <Music className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
            <h4 
              className="font-black text-xs text-white tracking-widest"
              style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}
            >
              ★ 慢搖。慢嗨舞曲中樞
            </h4>
          </div>

          {/* PLAY/PAUSE */}
          <div className="flex items-center justify-between bg-[#0d0216] p-1.5 rounded-xl border border-[#ff00ff]/15">
            <div className="flex items-center gap-1.5 truncate">
              <div className={`p-1.5 rounded-lg border ${isMusicPlaying ? 'bg-[#ff00ff]/20 text-[#ff00ff] border-[#ff00ff]/40' : 'bg-stone-900 border-stone-800 text-stone-500'}`}>
                <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[10px] font-black text-white truncate">復古慢搖 8-Bit Synth</span>
                <span className="text-[9px] text-stone-400 font-mono">128 BPM Loop</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (isMusicPlaying) {
                  synth.stop();
                } else {
                  synth.start();
                }
                setIsMusicPlaying(!isMusicPlaying);
              }}
              className={`p-1.5 rounded-lg cursor-pointer transition shrink-0 ${
                isMusicPlaying 
                  ? 'bg-[#ff00ff]/15 text-[#ff00ff] hover:bg-[#ff00ff]/30 border border-[#ff00ff]/30' 
                  : 'bg-[#ff00ff] text-white hover:bg-white hover:text-[#1a052e]'
              }`}
            >
              {isMusicPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
          </div>

          {/* VOLUME SLIDER */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[10px] text-stone-300">
              <span className="flex items-center gap-1 font-semibold">
                <Volume2 className="w-3 h-3 text-[#00ffff]" />
                音量 (Vol)
              </span>
              <span className="font-mono text-[#00ffff] font-bold">{(musicVolume * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="w-full accent-[#ff00ff] h-1.5 bg-[#0d0216] rounded-md appearance-none cursor-pointer"
            />
          </div>

          {/* TEMPO ENVELOPE */}
          <div className="flex flex-col gap-0.5 mt-0.5">
            <div className="flex items-center justify-between text-[10px] text-stone-300">
              <span className="font-semibold text-yellow-300">熱舞速率 (Speed)</span>
              <span className="font-mono text-yellow-300 font-bold">{tempoMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.60"
              max="1.80"
              step="0.05"
              value={tempoMultiplier}
              onChange={(e) => setTempoMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#0d0216] rounded-md appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      </div>

        {/* GESTURE MANUAL GRIMOIRE — 手勢秘笈 (below both sidebar columns) */}
        {showHowTo && (
          <div
            className="w-full transition-all"
            style={{ animation: 'fadeIn 0.6s ease-out' }}
          >
            <div className="bg-[#1a052e]/95 border-2 border-[#ff00ff] rounded-2xl p-4 shadow-[0_0_20px_rgba(255,0,255,0.12)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#ff00ff11] to-transparent pointer-events-none" />

              <div className="flex items-center justify-between border-b border-[#ff00ff]/30 pb-2 mb-3">
                <div className="flex items-center gap-1.5 text-[#00ffff]">
                  <HelpCircle className="w-4 h-4" />
                  <h4
                    className="font-black text-sm text-white tracking-wider"
                    style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}
                  >
                    ★ 手勢操作秘笈
                  </h4>
                </div>
                <button
                  onClick={() => setShowHowTo(false)}
                  className="bg-[#ff00ff] text-white hover:bg-[#00ffff] hover:text-black font-black text-xs px-2.5 py-0.5 skew-x-[-8deg] transition cursor-pointer rounded"
                >
                  ✕ 隱藏
                </button>
              </div>

              <div className="flex flex-col gap-2 text-stone-300">
                <div className="flex gap-2.5 bg-[#0d0216]/60 p-2.5 rounded-xl border border-[#ff00ff]/20">
                  <div className="flex items-center justify-center p-2 h-9 w-9 shrink-0 bg-[#ff00ff]/10 border border-[#ff00ff]/50 rounded-lg text-[#ff00ff]">
                    <Heart className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-bold text-white text-xs">01. 💗 掌心召喚・愛心浮現</h4>
                    <p className="leading-relaxed text-stone-400 text-[11px]">
                      雙手<strong className="text-[#ff00ff]">掌根並攏</strong> + <strong className="text-[#00ffff]">手指全張開</strong>，掌心間誕生超大粉紅愛心！
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 bg-[#0d0216]/60 p-2.5 rounded-xl border border-[#ff00ff]/20">
                  <div className="flex items-center justify-center p-2 h-9 w-9 shrink-0 bg-[#00ffff]/10 border border-[#00ffff]/50 rounded-lg text-[#00ffff]">
                    <Flame className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-bold text-white text-xs">02. ✵ 雙手交叉・璀璨爆炸</h4>
                    <p className="leading-relaxed text-stone-400 text-[11px]">
                      兩手<strong className="text-[#00ffff]">交叉重合或觸碰</strong>即引爆數百閃亮碎片！
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 bg-[#0d0216]/60 p-2.5 rounded-xl border border-[#ff00ff]/20">
                  <div className="flex items-center justify-center p-2 h-9 w-9 shrink-0 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400">
                    <Disc className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-bold text-white text-xs">03. 🎨 貼圖點綴・大頭貼秀</h4>
                    <p className="leading-relaxed text-stone-400 text-[11px]">
                      右鍵拖曳 Y2K 貼圖、火星文字，<strong className="text-[#00ffff]">滑動縮放旋轉</strong>後拍照存檔！
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 bg-[#0d0216]/60 p-2.5 rounded-xl border border-[#ff00ff]/20">
                  <div className="flex items-center justify-center p-2 h-9 w-9 shrink-0 bg-purple-500/10 border border-purple-400/50 rounded-lg text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-bold text-white text-xs">04. 💎 單指伸・碎鑽跟隨</h4>
                    <p className="leading-relaxed text-stone-400 text-[11px]">
                      選「碎鑽」模式後<strong className="text-[#c4b5fd]">伸出一根手指</strong>，指尖綻放流光碎鑽！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showHowTo && (
          <button
            onClick={() => setShowHowTo(true)}
            className="w-full py-2 border border-dashed border-[#ff00ff]/40 bg-[#1a052e]/60 hover:border-[#ff00ff] rounded-xl text-stone-400 hover:text-white text-xs font-mono cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#00ffff]" />
            顯示手勢魔法秘笈
          </button>
        )}
      </div>

      {/* PHOTO SNAPSHOT PREVIEW MODAL */}
      {snapshotPreviewUrl && (
        <div className="fixed inset-0 bg-[#0d0216]/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a052e] border-4 border-[#ff00ff] rounded-3xl p-6 max-w-xl w-full shadow-[0_0_50px_rgba(255,0,255,0.4)] relative flex flex-col items-center">
            
            {/* Decorative top header */}
            <div className="w-full flex items-center justify-between border-b-2 border-[#ff00ff]/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00ffff] animate-pulse" />
                <span className="font-mono text-xs tracking-widest text-[#ff00ff] font-bold">
                  ✧ PHOTO_PREVIEW_CONFIRM ✧
                </span>
              </div>
              <button 
                onClick={() => setSnapshotPreviewUrl(null)}
                className="text-[#ff00ff] hover:text-white transition font-mono font-bold text-xs cursor-pointer"
              >
                [ ESC_RETAKE ]
              </button>
            </div>

            <h3 
              className="text-xl font-black text-center text-[#ff00ff] italic tracking-tight mb-4 uppercase animate-bounce"
              style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif', textShadow: '2px 2px 0px #00ffff' }}
            >
              ✦ 哇！你拍得太暃主流啦 ✦
            </h3>

            {/* Captured image display container */}
            <div className="relative border-4 border-[#ff00ff] bg-black rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,0,255,0.3)] w-full max-w-md aspect-[4/3] mb-6">
              {/* Soft scanlines and glows */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-20 z-10" />
              <img 
                src={snapshotPreviewUrl} 
                alt="Y2K snapshot preview" 
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-stone-300 text-center max-w-sm mb-6 leading-relaxed">
              這是你的專屬 Y2K 非主流大頭貼！確認保存會自動下載到你的電腦，不滿意可以點擊重新拍攝哦！
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 w-full">
              <button
                onClick={confirmSaveSnapshot}
                className="flex-1 py-3 px-6 bg-[#ff00ff] hover:bg-white hover:text-[#1a052e] text-white font-black text-sm uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2 border-2 border-white skew-x-[-6deg]"
              >
                💾 確認保存 (Save)
              </button>
              <button
                onClick={() => setSnapshotPreviewUrl(null)}
                className="flex-1 py-3 px-6 bg-transparent hover:bg-rose-500/10 text-[#ff00ff] hover:text-white border-2 border-[#ff00ff] hover:border-white font-black text-sm uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 skew-x-[-6deg]"
              >
                🔄 重新拍攝 (Retake)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
