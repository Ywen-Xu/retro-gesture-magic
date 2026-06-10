/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Camera, Music, Sparkles, AlertCircle, HelpCircle, Heart, Flame, Disc, VolumeX, RefreshCw } from 'lucide-react';
import { LowFpsBlinker } from './components/LowFpsBlinker';
import { CameraFilterView } from './components/CameraFilterView';
import { RetroDiscoSynth } from './utils/RetroDiscoSynth';

export default function App() {
  const synth = useMemo(() => new RetroDiscoSynth(), []);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);

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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff00ff]/10 border-2 border-[#ff00ff]/40 text-[#ff00ff] text-[10px] uppercase tracking-widest rounded-full mb-3 shadow-[0_0_15px_rgba(255,0,255,0.25)] animate-pulse">
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
        
        {/* 4. GESTURES GRIMOIRE (手勢秘笈/說明面板) */}
        {showHowTo && (
          <div 
            className="w-full max-w-5xl px-4 mt-6 transition-all"
            style={{ animation: 'fadeIn 0.6s ease-out' }}
          >
            <div className="bg-[#1a052e]/85 border-4 border-[#ff00ff] rounded-3xl p-5 md:p-6 shadow-[0_0_30px_rgba(255,0,255,0.15)] relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-t from-[#ff00ff11] to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between border-b-2 border-[#ff00ff]/30 pb-3 mb-4">
                <div className="flex items-center gap-2 text-[#00ffff]">
                  <HelpCircle className="w-5 h-5" />
                  <h3 
                    className="font-bold text-sm text-white tracking-wider"
                    style={{ fontFamily: '"ZCOOL KuaiLe", sans-serif' }}
                  >
                    ★ 非主流魔法・手勢操作秘笈 (Interactive Manual)
                  </h3>
                </div>
                <button 
                  onClick={() => setShowHowTo(false)}
                  className="bg-[#ff00ff] text-[#1a052e] hover:bg-[#00ffff] font-black text-xs px-3 py-1 skew-x-[-8deg] transition cursor-pointer"
                >
                  [ 隱藏秘笈 ✕ ]
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-300">
                {/* Rule 1 */}
                <div className="flex gap-3 bg-[#0d0216]/60 p-4 rounded-2xl border-2 border-[#ff00ff]/20">
                  <div className="flex items-center justify-center p-2.5 h-11 w-11 shrink-0 bg-[#ff00ff]/10 border-2 border-[#ff00ff]/50 rounded-xl text-[#ff00ff]">
                    <Heart className="w-5 h-5 fill-current animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1">
                      01. 掌心召喚 💗 愛心浮現
                    </h4>
                    <p className="leading-relaxed text-stone-400">
                      當雙手<strong className="text-[#ff00ff] font-semibold">掌根部分並攏偏近</strong>（腕關節接近），且<strong className="text-[#00ffff] font-semibold">手指全部張開</strong>時，即會在雙手間誕生超大粉紅真愛愛心，隨手勢任意移動與缩放！
                    </p>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="flex gap-3 bg-[#0d0216]/60 p-4 rounded-2xl border-2 border-[#ff00ff]/20">
                  <div className="flex items-center justify-center p-2.5 h-11 w-11 shrink-0 bg-[#00ffff]/10 border-2 border-[#00ffff]/50 rounded-xl text-[#00ffff]">
                    <Flame className="w-5 h-5 text-cyan-300 animate-bounce" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1 font-sans">
                      02. 雙手交叉 ✵ 璀璨爆炸
                    </h4>
                    <p className="leading-relaxed text-stone-400">
                      當兩手掌心<strong className="text-[#00ffff] font-semibold">交叉重合或觸碰</strong>時，大愛心會立馬在空中<strong className="text-[#ff00ff] font-semibold">轟然引爆</strong>，爆發出數以百計的復古炫麗閃亮碎片，並伴隨爆炸舞曲節奏！
                    </p>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="flex gap-3 bg-[#0d0216]/60 p-4 rounded-2xl border-2 border-[#ff00ff]/20">
                  <div className="flex items-center justify-center p-2.5 h-11 w-11 shrink-0 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl text-yellow-400">
                    <Disc className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1">
                      03. 貼圖點綴 🎨 大頭貼秀
                    </h4>
                    <p className="leading-relaxed text-stone-400">
                      點擊右側面板的各種 Y2K 貼圖
                      或火星文字，即可<strong className="text-[#00ffff] font-semibold">滑動或拖曳</strong>放置於畫面上。可調整速率、切換相框、更換美學色調，最後點擊<strong className="text-white font-semibold">「拍照存檔」</strong>！
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
            className="px-5 py-2 border-2 border-dashed border-[#ff00ff]/40 bg-[#1a052e] hover:border-[#ff00ff] rounded-full text-stone-300 hover:text-white text-xs font-mono cursor-pointer transition flex items-center gap-1.5 mt-2"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#00ffff]" />
            顯示手勢魔法操作說明 (Manual)
          </button>
        )}
      </main>

      {/* 5. GENTLE HUMBLE FOOTER */}
      <footer className="mt-16 text-[10px] font-mono text-[#ff00ff]/70 tracking-widest text-center select-none pointer-events-none flex flex-col items-center gap-2">
        <div className="flex gap-4">
          <div className="bg-white text-black px-4 py-1.5 font-black text-xs rotate-1 italic">#DISCO_GLOW</div>
          <div className="bg-[#ff00ff] text-white px-4 py-1.5 font-black text-xs -rotate-1 tracking-wider">ULTRA_SASSY</div>
        </div>
        <div className="mt-2">★ CYBER WEBCAM SOFTWARE STABILIZED ★</div>
        <div>© 2007-2026 RETRO RECALL LABS. NO RIGHTS SECURED.</div>
      </footer>
    </div>
  );
}

