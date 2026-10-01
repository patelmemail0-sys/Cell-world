// Procedural ambience: a low two-oscillator drone plus filtered noise, muffled like sound
// under water. The filter opens or closes with the compartment you are in. No audio files.

export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private enabled = true;

  /** Must be called from a user gesture (browser autoplay rules). */
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.7;
      filter.connect(master).connect(ctx.destination);

      for (const [freq, gain] of [[55, 0.22], [82.4, 0.12], [110.6, 0.07]] as const) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = gain;
        // Slow beating so the drone breathes.
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.07 + freq * 0.0006;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = gain * 0.5;
        lfo.connect(lfoGain).connect(g.gain);
        osc.connect(g).connect(filter);
        osc.start();
        lfo.start();
      }
      // Brown-ish noise for the sense of fluid.
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + (Math.random() * 2 - 1) * 0.04) * 0.985;
        data[i] = last * 3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const ng = ctx.createGain();
      ng.gain.value = 0.5;
      noise.connect(ng).connect(filter);
      noise.start();

      this.ctx = ctx;
      this.master = master;
      this.filter = filter;
      this.setEnabled(this.enabled);
    } catch {
      this.ctx = null; // No audio available: stay silent.
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.4);
  }

  /** Smaller, denser compartments sound more closed in. */
  setCompartment(fogDensity: number): void {
    if (!this.ctx || !this.filter) return;
    const cutoff = fogDensity > 0.04 ? 240 : fogDensity > 0.02 ? 320 : 460;
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.6);
  }

  blip(freq = 660): void {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.09);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }
}
