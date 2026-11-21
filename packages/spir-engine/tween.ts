/** حركات ناعمة مربوطة بساعة المشهد (توقف ويّا الإيقاف) */
export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  out: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  elastic: (t: number) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * 2 * Math.PI) / 3) + 1),
  bounce: (t: number) => {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};
export type Ease = (t: number) => number;

type Job = { t0: number; ms: number; fn: (t: number) => void; ease: Ease; done: () => void; owner?: object };

export class Tweens {
  now = 0;
  private jobs: Job[] = [];

  /** fn تستلم t من 0 لـ 1 بعد الـ easing */
  run(ms: number, fn: (t: number) => void, e: Ease = ease.out, owner?: object): Promise<void> {
    return new Promise((done) => {
      this.jobs.push({ t0: this.now, ms: Math.max(1, ms), fn, ease: e, done, owner });
      fn(e(0));
    });
  }

  /** يحرّك خصائص رقمية بكائن (مثل x، y، alpha، scale.x) */
  to(obj: object, props: Record<string, number>, ms: number, e: Ease = ease.out): Promise<void> {
    const rec = obj as unknown as Record<string, number>;
    const from: Record<string, number> = {};
    for (const k of Object.keys(props)) from[k] = rec[k];
    return this.run(ms, (t) => {
      for (const [k, v] of Object.entries(props)) rec[k] = from[k] + (v - from[k]) * t;
    }, e, obj);
  }

  wait(ms: number) {
    return this.run(ms, () => {}, ease.linear);
  }

  /** يلغي حركات كائن (بدون ما يكمّلها) */
  kill(owner: object) {
    this.jobs = this.jobs.filter((j) => j.owner !== owner);
  }

  clear() {
    this.jobs = [];
  }

  get busy() {
    return this.jobs.length > 0;
  }

  step(dt: number) {
    this.now += dt;
    const keep: Job[] = [];
    for (const j of this.jobs) {
      const t = Math.min(1, (this.now - j.t0) / j.ms);
      j.fn(j.ease(t));
      if (t >= 1) j.done();
      else keep.push(j);
    }
    this.jobs = keep;
  }
}
