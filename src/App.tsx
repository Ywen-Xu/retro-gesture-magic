/**
 * @license CC-BY-NC-4.0
 * Copyright (c) 2026 Ywen-Xu
 * https://github.com/Ywen-Xu/retro-gesture-magic
 */

import React, { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { LowFpsBlinker } from './components/LowFpsBlinker';
import { CameraFilterView } from './components/CameraFilterView';
import { RetroDiscoSynth } from './utils/RetroDiscoSynth';

export default function App() {
  const synth = useMemo(() => new RetroDiscoSynth(), []);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center py-8 pb-16 overflow-x-hidden bg-[#0d0216] font-sans text-stone-150 relative">
      {/* 1. RETRO FILTER OVERLAYS IN MAIN CONTAINER */}
      <div className="retro-filter-overlay" />
      <div className="grain-overlay" />

      {/* 2. LOW FRAME RATE MARTIAN BLINKING TEXT BACKGROUND */}
      <LowFpsBlinker />

      {/* Decorative neon backglow gradient grids */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-950/25 via-[#1a052e]/10 to-transparent z-0" />

      {/* 2. TOP RETRO GLOW HEADER BAR - Vibrant Palette Style */}
      <header className="relative w-full max-w-5xl mx-auto flex flex-col items-center text-center justify-center mb-8 px-4 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ff00ff]/10 border-2 border-[#ff00ff]/40 text-[#ff00ff] text-xs uppercase tracking-widest rounded-full mb-3 shadow-[0_0_15px_rgba(255,0,255,0.25)] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-[#00ffff]" />
          <span>✧ GLOW-UP-CAM v0.1 // ULTRA DISCO EXPERIENCE ✧</span>
        </div>
        
        <h1 
          className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white mb-2 select-none relative group"
          style={{
            fontFamily: '"ZCOOL KuaiLe", sans-serif',
            textShadow: '3px 3px 0px #ff00ff, 6px 6px 0px #00ffff'
          }}
        >
          ✧ Glow-Up-Cam v0.1 ✧
        </h1>
        
        <p 
          className="text-xs md:text-sm text-stone-300 max-w-xl font-light leading-relaxed select-none pb-2 border-b-2 border-dashed border-[#ff00ff]/40"
          style={{ fontFamily: '"ZCOOL XiaoWei", serif' }}
        >
          「 淚、洇ィ尒侕蓅... 傷感噯情密碼 ✖ 掌心合一誕出玫红真愛 ✖ 雙手交叉璀璨爆炸 」
        </p>
      </header>

      {/* 3. MAIN LIVE WORKSPACE VIEWPORTS */}
      <main className="relative w-full z-10 flex flex-col items-center gap-6">
        <CameraFilterView
          synth={synth}
          isMusicPlaying={isMusicPlaying}
          setIsMusicPlaying={setIsMusicPlaying}
        />
      </main>

      {/* 5. GENTLE HUMBLE FOOTER */}
      <footer className="mt-16 text-xs font-mono text-[#ff00ff]/70 tracking-widest text-center select-none pointer-events-none flex flex-col items-center gap-2">
        <div className="flex gap-4">
          <div className="bg-white text-black px-4 py-1.5 font-black text-sm rotate-1 italic">#DISCO_GLOW</div>
          <div className="bg-[#ff00ff] text-white px-4 py-1.5 font-black text-sm -rotate-1 tracking-wider">ULTRA_SASSY</div>
        </div>
        <div className="mt-2">★ CYBER WEBCAM SOFTWARE STABILIZED ★</div>
        <div>© 2007-2026 RETRO RECALL LABS. NO RIGHTS SECURED.</div>
      </footer>
    </div>
  );
}

