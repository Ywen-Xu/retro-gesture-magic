import React, { useState, useEffect } from 'react';

const REGRET_PHRASES = [
  'じ☆ve 伱湜涐の蓶① じ☆ve',
  '涐扪の噯，巳晟濄呿...',
  '恠泘伱、ォ傷感 ˚‧º·(˚ ˃̣̣̥᷄⌓˂̣̣̥᷅ )‧º·˚',
  '︶ㄣ 糖菓菋の初戀 ㄣ︶',
  '噯の淚痕，誰莣記耍？',
  '┲﹊莣憂愺、寂寞嚸綴﹎┲',
  '╰☆夢幻.縸誮.亦泠☆╮',
  'じ★ve 獨臫縸涙 ★',
  '﹎. ︶傷感爺 *',
  '蒛尐、那庅嚸噯',
  '★〃 糖菓ィ菋檤 〃★',
  '珍惜、現在擁有的 ︶ㄣ',
  ' Y2K づ 涐の噯 づ 暃主流',
  '☆~ 宇宙の星空戀人 ~☆',
  '淚、洇ィ尒侕蓅...'
];

export function LowFpsBlinker() {
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const [scrollingTexts, setScrollingTexts] = useState<string[]>([]);
  
  // Set up low frame rate (1.5 Hz) text visibility switching and scrambling
  useEffect(() => {
    // Generate initial floating board list
    const generateGridPositions = () => {
      const itemsCount = 36;
      const list = [];
      for (let i = 0; i < itemsCount; i++) {
        const randomPhrase = REGRET_PHRASES[Math.floor(Math.random() * REGRET_PHRASES.length)];
        list.push(randomPhrase);
      }
      setScrollingTexts(list);
    };

    generateGridPositions();

    // 1.5 Hz frequency timer (approx 666ms per tick)
    const interval = setInterval(() => {
      // randomly toggle visibility of 60% of elements
      const nextVisible: number[] = [];
      for (let i = 0; i < 36; i++) {
        if (Math.random() > 0.4) {
          nextVisible.push(i);
        }
      }
      setVisibleIndexes(nextVisible);
      
      // Randomly rotate some phrases to keep the background active
      setScrollingTexts(prev => 
        prev.map((text, i) => {
          if (Math.random() > 0.8) {
            return REGRET_PHRASES[Math.floor(Math.random() * REGRET_PHRASES.length)];
          }
          return text;
        })
      );
    }, 666); // Low frame rate: ~1.5 FPS refresh rate

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="retro-bg" className="absolute inset-0 w-full h-full bg-[#0d0216] overflow-hidden pointer-events-none z-0 opacity-20">
      {/* Retro matrix scan line grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      
      {/* CRT glowing green/pink grain */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_40%,_rgba(255,0,255,0.1)_90%]" />
      
      {/* Non-mainstream tiled Y2K text layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 md:p-12 w-full h-full select-none font-sans">
        {scrollingTexts.map((phrase, idx) => {
          const isVisible = visibleIndexes.includes(idx);
          const colorVariants = [
            'text-rose-500/80 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]',
            'text-pink-500/70 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]',
            'text-cyan-500/70 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
            'text-purple-400/80 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]'
          ];
          const colorClass = colorVariants[idx % colorVariants.length];
          
          return (
            <div
              key={idx}
              className={`flex items-center justify-center p-4 border border-dashed border-stone-800/10 text-center transition-opacity duration-150 text-xs md:text-sm font-light tracking-wide ${colorClass} ${
                isVisible ? 'opacity-100' : 'opacity-10'
              }`}
              style={{
                fontFamily: idx % 2 === 0 ? '"ZCOOL XiaoWei", serif' : '"ZCOOL KuaiLe", sans-serif',
                transform: `rotate(${(idx % 3 - 1) * 3}deg) scale(${0.85 + (idx % 4) * 0.05})`
              }}
            >
              {phrase}
            </div>
          );
        })}
      </div>
    </div>
  );
}
