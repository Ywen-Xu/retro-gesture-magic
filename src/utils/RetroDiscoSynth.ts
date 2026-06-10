// A programmatically generated Retro Disco Beat synthesizer using Web Audio API
// 100% client-side, CORS-free, self-contained, and perfectly synchronized!

const NOTE_FREQS: Record<string, number> = {
  'A1': 55.00, 'A#1': 58.27, 'B1': 61.74, 'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83,
  'A2': 110.00, 'A#2': 116.54, 'B2': 123.47, 'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65,
  'A3': 220.00, 'A#3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30,
  'A4': 440.00, 'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61,
  'A5': 880.00, 'A#5': 932.33, 'B5': 987.77, 'C6': 1046.50
};

export class RetroDiscoSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGain: GainNode | null = null;
  
  private isPlaying = false;
  private bpm = 128;
  private currentStep = 0; // 16 steps per pattern sequence
  private lastScheduledSec = 0;
  private schedulerIntervalId: any = null;
  private lookahead = 25.0; // Miliseconds
  private scheduleAheadTime = 0.1; // Seconds to schedule ahead
  private tempoMultiplier = 1.0;
  private activeFiltersEnabled = false;

  // callbacks
  public onStep: ((step: number) => void) | null = null;

  // Pattern sequence notes
  // A minor progression: Am (4 beats) -> F (4 beats) -> C (4 beats) -> G (4 beats)
  private chordsList = ['Am', 'F', 'C', 'G'];
  
  // Groovy octave bassline patterns (16 steps)
  private bassPatterns: Record<string, string[]> = {
    'Am': ['A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2'],
    'F':  ['F1', 'F2', 'F1', 'F2', 'F1', 'F2', 'F1', 'F2', 'F1', 'F2', 'F1', 'F2', 'F1', 'F2', 'F1', 'F2'],
    'C':  ['C2', 'C3', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3'],
    'G':  ['G1', 'G2', 'G1', 'G2', 'G1', 'G2', 'G1', 'G2', 'G1', 'G2', 'G1', 'G2', 'G1', 'G2', 'G1', 'G2']
  };

  // Fun, catchy, nostalgic 80s/Y2K style dance theme lead notes (16 steps)
  private melodyPattern: string[] = [
    'E5', '', 'D5', 'C5', '', 'B4', 'A4', 'B4', 
    'C5', '', 'E5', 'A5', 'G5', '', 'E5', 'D5',
    'C5', '', 'B4', 'C5', '', 'D5', 'E5', 'G5',
    'E5', 'D5', 'C5', 'D5', 'B4', '', 'G1', '' // Funky turnaround
  ];

  constructor() {
    // Initialized lazily upon user interaction (crucial structure constraint)
  }

  private initAudio() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime); // High-fidelity but moderate volume

    // Add a retro ping-pong filter delay feedback for cosmic space feeling
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayGain = this.ctx.createGain();
    this.delayNode.delayTime.setValueAtTime(0.24, this.ctx.currentTime); // rhythmic 8th note delay
    this.delayGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // feedback volume

    // Connect Delay feedback loop
    this.masterGain.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.delayNode); // feedback
    this.delayGain.connect(this.ctx.destination); // output

    this.masterGain.connect(this.ctx.destination);
  }

  public start() {
    this.initAudio();
    if (this.isPlaying) return;

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.lastScheduledSec = this.ctx!.currentTime;
    this.currentStep = 0;

    // Run custom scheduler loop
    this.schedulerIntervalId = setInterval(() => {
      this.schedulerLoop();
    }, this.lookahead);
  }

  public stop() {
    this.isPlaying = false;
    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
    }
  }

  public isSynthPlaying() {
    return this.isPlaying;
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  public setFiltersInteractive(enabled: boolean) {
    this.activeFiltersEnabled = enabled;
  }

  public setTempoMultiplier(mult: number) {
    this.tempoMultiplier = Math.max(0.6, Math.min(2.0, mult));
  }

  private schedulerLoop() {
    if (!this.ctx) return;

    const currentBpm = this.bpm * this.tempoMultiplier;
    const stepDuration = 60.0 / currentBpm / 4.0; // 16th notes duration

    while (this.lastScheduledSec < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.lastScheduledSec, stepDuration);
      
      // Advance step
      this.lastScheduledSec += stepDuration;
      this.currentStep = (this.currentStep + 1) % 32; // Two full bar rotation
    }
  }

  private scheduleNote(step: number, time: number, stepDuration: number) {
    if (!this.ctx) return;

    // Trigger step callback in UI thread safely
    if (this.onStep) {
      const displayStep = step;
      setTimeout(() => {
        if (this.isPlaying && this.onStep) {
          this.onStep(displayStep);
        }
      }, (time - this.ctx!.currentTime) * 1000);
    }

    // Determine current chord (changes every 8 steps, i.e., 2 beats or 4 beats based on progression)
    // 32-step sequence: step 0-7: Am, step 8-15: F, step 16-23: C, step 24-31: G
    const chordIndex = Math.floor(step / 8) % 4;
    const currentChord = this.chordsList[chordIndex];

    // 1. Kick Drum: plays on beats 1, 5, 9, 13 (step 0, 4, 8, 12, 16, 20, 24, 28)
    const playEveryFour = step % 4 === 0;
    const playOffbeat = step % 4 === 2;

    if (playEveryFour) {
      this.synthesizeKick(time);
    } else if (playOffbeat && Math.random() < 0.1) {
      // Occasional double-kick for groovy rhythm
      this.synthesizeKick(time);
    }

    // 2. Hi-Hat: offbeat syncopation (step 2, 6, 10, 14, 18, 22, 26, 30) or soft ticks
    if (step % 4 === 2) {
      this.synthesizeHiHat(time, true); // Accent
    } else if (step % 2 === 0) {
      this.synthesizeHiHat(time, false); // Light tick
    }

    // 3. Bassline: Octave jumping groovy bass synth
    const bassSeq = this.bassPatterns[currentChord];
    const bassNote = bassSeq[step % 16];
    if (bassNote) {
      const slideDuration = stepDuration * 0.92;
      this.synthesizeBass(time, bassNote, slideDuration);
    }

    // 4. lead Melodic retro synthesizer (glowing, starry lead)
    const melodyNote = this.melodyPattern[step];
    if (melodyNote && melodyNote !== '') {
      const leadDuration = stepDuration * (Math.random() > 0.4 ? 1.5 : 0.85); // legato and staccato variety
      this.synthesizeMelody(time, melodyNote, leadDuration);
    }

    // 5. FX Noise wash: add energetic disco clap on upbeats (step 4, 12, 20, 28)
    if (step % 8 === 4) {
      this.synthesizeClap(time);
    }
  }

  private getNoteFrequency(note: string): number {
    return NOTE_FREQS[note] || 440;
  }

  private synthesizeKick(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    const startFreq = this.activeFiltersEnabled ? 250 : 150;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.15);

    gain.gain.setValueAtTime(0.75, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.start(time);
    osc.stop(time + 0.20);
  }

  private synthesizeHiHat(time: number, isAccent: boolean) {
    if (!this.ctx || !this.masterGain) return;

    // Create high passed random noise
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isAccent ? 7500 : 9500, time);

    const gain = this.ctx.createGain();
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    const volume = isAccent ? 0.11 : 0.04;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.08 : 0.035));

    source.start(time);
    source.stop(time + 0.10);
  }

  private synthesizeBass(time: number, note: string, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Use a classic slightly detuned sawtooth
    osc.type = 'sawtooth';
    let freq = this.getNoteFrequency(note);
    if (this.activeFiltersEnabled) {
      // Modulate pitch slightly based on gesture feedback
      freq *= 1.05; 
    }
    osc.frequency.setValueAtTime(freq, time);

    // Warm retro lowposs filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, time);
    filter.frequency.exponentialRampToValueAtTime(this.activeFiltersEnabled ? 1600 : 850, time + 0.04);
    filter.frequency.exponentialRampToValueAtTime(350, time + duration);

    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.linearRampToValueAtTime(0.18, time + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private synthesizeMelody(time: number, note: string, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Dual electronic square oscillators for retro chiptune/Italo feel
    osc1.type = 'triangle';
    osc2.type = 'square';
    
    let baseFreq = this.getNoteFrequency(note);
    if (this.activeFiltersEnabled) {
      // Octave transpose high shift on filter activation
      baseFreq *= 2;
    }

    osc1.frequency.setValueAtTime(baseFreq, time);
    // detune synth 2 to sound wider and luscious
    osc2.frequency.setValueAtTime(baseFreq * 1.008, time); 

    // Retro resonant glow
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, time);
    filter.frequency.exponentialRampToValueAtTime(1000, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.075, time + 0.012); // smooth short attack
    gain.gain.setValueAtTime(0.07, time + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  private synthesizeClap(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Filtered noise with multi-trigger decay taps
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(3.0, time);

    const gain = this.ctx.createGain();

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Multi-taps simulate hand clapping
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.02, time + 0.012);
    
    gain.gain.setValueAtTime(0.09, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.02, time + 0.035);
    
    gain.gain.setValueAtTime(0.16, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    source.start(time);
    source.stop(time + 0.18);
  }

  // Synthesize a beautiful pixelized explosion starburst sweep on hand crossing!
  public playExplosionEffect() {
    if (!this.ctx || !this.isPlaying) return;

    const now = this.ctx.currentTime;
    
    // Play multiple sub-voices for massive sci-fi retro explosion
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Arpeggiator sparkle sweep
      osc.type = i % 2 === 0 ? 'sine' : 'square';
      const fStart = 800 + i * 400;
      const fEnd = 2200 - i * 300;

      osc.frequency.setValueAtTime(fStart, now);
      osc.frequency.exponentialRampToValueAtTime(fEnd, now + 0.4);
      osc.frequency.linearRampToValueAtTime(80, now + 0.82);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.8);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.90);
    }
  }
}
