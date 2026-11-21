/**
 * صوت مولّد بـ Web Audio: مؤثرات بطبقات (نغمة + لمعة + ضجيج قصير) وموسيقى خلفية خفيفة.
 * يشتغل بعد أول لمسة (سياسة المتصفحات).
 */
type Sfx = 'tap' | 'pop' | 'slide' | 'bump' | 'win' | 'lose' | 'meow' | 'drop' | 'star' | 'coin' | 'merge' | 'clear' | 'whoosh' | 'unlock';

const PENTA = [0, 2, 4, 7, 9];
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

export class Audio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicGain: GainNode | null = null;
  on = true;
  musicOn = true;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private musicRoot = 60;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.05;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setOn(on: boolean) {
    this.on = on;
    if (this.master) this.master.gain.value = on ? 0.9 : 0;
  }

  private tone(freq: number, ms: number, o: { type?: OscillatorType; vol?: number; to?: number; delay?: number; attack?: number; dest?: AudioNode } = {}) {
    if (!this.ctx || !this.master) return;
    const a = this.ctx;
    const t = a.currentTime + (o.delay ?? 0) / 1000;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + ms / 1000);
    const vol = o.vol ?? 0.15;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack ?? 8) / 1000);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(g).connect(o.dest ?? this.master);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.05);
  }

  private noise(ms: number, o: { vol?: number; delay?: number; freq?: number } = {}) {
    if (!this.ctx || !this.master) return;
    const a = this.ctx;
    const t = a.currentTime + (o.delay ?? 0) / 1000;
    const len = Math.floor((a.sampleRate * ms) / 1000);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = o.freq ?? 1200;
    const g = a.createGain();
    g.gain.value = o.vol ?? 0.12;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  play(s: Sfx) {
    if (!this.on || !this.ctx) return;
    switch (s) {
      case 'tap':
        this.tone(880, 60, { type: 'triangle', vol: 0.1 });
        return this.tone(1320, 50, { type: 'sine', vol: 0.05, delay: 15 });
      case 'pop':
        this.tone(600, 120, { type: 'sine', to: 1100, vol: 0.16 });
        return this.noise(40, { vol: 0.06, freq: 3000 });
      case 'slide':
        this.noise(160, { vol: 0.07, freq: 700 });
        return this.tone(300, 140, { type: 'triangle', to: 380, vol: 0.06 });
      case 'bump':
        this.tone(140, 120, { type: 'sine', to: 90, vol: 0.22 });
        return this.noise(60, { vol: 0.08, freq: 400 });
      case 'meow':
        this.tone(620, 180, { type: 'triangle', to: 980, vol: 0.09, attack: 30 });
        this.tone(1240, 180, { type: 'sine', to: 1960, vol: 0.03, attack: 30 });
        return this.tone(980, 260, { type: 'triangle', to: 560, vol: 0.09, delay: 170 });
      case 'drop':
        this.tone(1200, 380, { type: 'sine', to: 180, vol: 0.12 });
        return this.tone(2400, 200, { type: 'sine', to: 600, vol: 0.03, delay: 40 });
      case 'star':
        [0, 4, 7, 12].forEach((n, i) => this.tone(midi(79 + n), 220, { type: 'triangle', vol: 0.08, delay: i * 45 }));
        return;
      case 'coin':
        this.tone(midi(83), 80, { type: 'square', vol: 0.05 });
        return this.tone(midi(88), 220, { type: 'square', vol: 0.05, delay: 70 });
      case 'merge':
        this.tone(440, 160, { type: 'sine', to: 880, vol: 0.14 });
        return this.tone(660, 200, { type: 'triangle', to: 1320, vol: 0.06, delay: 40 });
      case 'clear':
        [0, 3, 7, 10, 14].forEach((n, i) => this.tone(midi(72 + n), 160, { type: 'triangle', vol: 0.08, delay: i * 35 }));
        return this.noise(250, { vol: 0.06, freq: 2500 });
      case 'whoosh':
        return this.noise(260, { vol: 0.09, freq: 900 });
      case 'unlock':
        [0, 7, 12, 16, 19].forEach((n, i) => this.tone(midi(67 + n), 260, { type: 'sine', vol: 0.09, delay: i * 70 }));
        return;
      case 'win':
        [0, 4, 7, 12, 7, 12, 16].forEach((n, i) => this.tone(midi(67 + n), 240, { type: 'triangle', vol: 0.1, delay: i * 95 }));
        [0, 7].forEach((n, i) => this.tone(midi(43 + n), 700, { type: 'sine', vol: 0.12, delay: i * 380 }));
        return;
      case 'lose':
        [7, 4, 0, -5].forEach((n, i) => this.tone(midi(67 + n), 260, { type: 'triangle', vol: 0.09, delay: i * 170 }));
        return;
    }
  }

  /** موسيقى خلفية: أربيجيو خماسي هادئ ويّا باص. root يحدد «مزاج» المكان */
  music(root = 60) {
    this.musicRoot = root;
    if (this.musicTimer || !this.ctx) return;
    this.musicTimer = setInterval(() => {
      if (!this.on || !this.musicOn || !this.musicGain) return;
      const bar = Math.floor(this.step / 8) % 4;
      const chord = [0, 5, 3, 4][bar];
      const deg = [0, 2, 4, 2, 1, 3, 4, 2][this.step % 8];
      const n = this.musicRoot + PENTA[(deg + chord) % 5] + 12 * Math.floor((deg + chord) / 5);
      this.tone(midi(n), 380, { type: 'triangle', vol: 0.6, dest: this.musicGain, attack: 20 });
      if (this.step % 8 === 0) this.tone(midi(this.musicRoot - 24 + PENTA[chord % 5]), 1500, { type: 'sine', vol: 0.9, dest: this.musicGain, attack: 40 });
      this.step++;
    }, 300);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
