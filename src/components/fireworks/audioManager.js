// Event-based audio: launch / ascend / burst / crackle / fade, plus looping sizzle / rush / spin / crackle beds.
// Recorded samples (launch, pop) are used where available; sizzle/rush/crackle beds are procedural noise buffers
// (not oscillators). Drop more recordings into the `urls` map and extend trigger() to use them.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const NOOP = { stop() {} };

export class AudioManager {
  constructor(urls = {}) {
    this.urls = urls; this.raw = {}; this.buf = {};
    this.ctx = null; this.vol = 0.7; this.muted = false;
    this.active = 0; this.gates = {}; this.voices = new Set();
  }

  preload() {
    for (const [k, u] of Object.entries(this.urls)) {
      this.raw[k] = fetch(u)
        .then((response) => {
          if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
          return response.arrayBuffer();
        })
        .catch((error) => {
          console.error(`Unable to preload firework sample "${k}".`, error);
          return null;
        });
    }
  }

  // Must be called from a user gesture (respects autoplay policy).
  async unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC({ latencyHint: "interactive" });
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.25;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.vol * this.vol;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      this._build();
      this._decode();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx.state === "running";
  }

  async _decode() {
    for (const k of Object.keys(this.raw)) {
      try {
        const ab = await this.raw[k];
        if (ab) this.buf[k] = await this.ctx.decodeAudioData(ab.slice(0));
      } catch (e) { console.warn("Firework sample failed to decode:", k, e); }
    }
  }

  _build() {
    const sr = this.ctx.sampleRate;
    const mk = (sec, fn) => { const b = this.ctx.createBuffer(1, (sr * sec) | 0, sr); fn(b.getChannelData(0)); return b; };
    this.sizzle = mk(2.4, (d) => {
      let last = 0, imp = 0;
      for (let i = 0; i < d.length; i++) {
        const n = Math.random() * 2 - 1; let s = (n - last) * 0.3; last = n;
        if (Math.random() < 0.0011) imp = (Math.random() * 0.7 + 0.3) * (Math.random() < 0.5 ? -1 : 1);
        d[i] = s + imp; imp *= 0.9;
      }
    });
    this.rush = mk(3, (d) => {
      let b = 0;
      for (let i = 0; i < d.length; i++) { const n = Math.random() * 2 - 1; b = (b + 0.025 * n) / 1.025; d[i] = b * 3.2 + n * 0.18; }
    });
    this.crackle = mk(2, (d) => {
      let imp = 0;
      for (let i = 0; i < d.length; i++) {
        if (Math.random() < 0.0007) imp = (Math.random() * 0.8 + 0.2) * (Math.random() < 0.5 ? -1 : 1);
        d[i] = imp; imp *= 0.86;
      }
    });
  }

  setVolume(v) { this.vol = v; this._applyGain(); }
  setMuted(m) { this.muted = m; this._applyGain(); if (m) this.stopAll(); }
  _applyGain() {
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.vol * this.vol, this.ctx.currentTime, 0.03);
  }
  _ready() { return this.ctx && !this.muted && this.vol > 0 && this.ctx.state === "running"; }
  _duck() { return 1 / Math.sqrt(1 + this.active * 0.12); }
  _gate(k, ms) { const n = performance.now(); if (n - (this.gates[k] || 0) < ms) return false; this.gates[k] = n; return true; }

  _play(buf, o = {}) {
    const c = this.ctx;
    if (!buf || this.active > 36) return null;
    const t = c.currentTime + (o.delay || 0), rate = o.rate || 1;
    const s = c.createBufferSource();
    s.buffer = buf; s.loop = !!o.loop; s.playbackRate.value = rate;
    let node = s;
    if (o.filter) {
      const f = c.createBiquadFilter();
      f.type = o.filter[0]; f.frequency.value = o.filter[1]; f.Q.value = o.filter[2] || 0.7;
      if (o.sweep && o.dur) { f.frequency.setValueAtTime(o.filter[1], t); f.frequency.exponentialRampToValueAtTime(o.sweep, t + o.dur); }
      node.connect(f); node = f;
    }
    const g = c.createGain(); node.connect(g);
    const peak = (o.gain ?? 1) * this._duck();
    if (o.dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + (o.atk || 0.01));
      g.gain.setValueAtTime(peak, Math.max(t + 0.02, t + o.dur - (o.rel || o.dur * 0.3)));
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    } else g.gain.setValueAtTime(peak, t);
    if (o.rampRate && o.dur) { s.playbackRate.setValueAtTime(rate, t); s.playbackRate.linearRampToValueAtTime(o.rampRate, t + o.dur); }
    let out = g, pan = null;
    if (c.createStereoPanner) { pan = c.createStereoPanner(); pan.pan.value = clamp(o.pan || 0, -1, 1); g.connect(pan); out = pan; }
    out.connect(this.master);
    const voice = {
      stop: (f = 0.12) => {
        const n = c.currentTime;
        g.gain.cancelScheduledValues(n);
        g.gain.setValueAtTime(Math.max(0.0002, g.gain.value), n);
        g.gain.exponentialRampToValueAtTime(0.0001, n + f);
        try { s.stop(n + f + 0.02); } catch { /* already stopped */ }
      },
    };
    s.onended = () => {
      this.active--; this.voices.delete(voice);
      try { s.disconnect(); g.disconnect(); pan?.disconnect(); } catch { /* ignore */ }
    };
    this.active++; this.voices.add(voice);
    s.start(t, o.offset || 0);
    if (o.dur) s.stop(t + o.dur + 0.05);
    return voice;
  }

  _osc(type, f0, f1, dur, gain, pan = 0, delay = 0) {
    const c = this.ctx;
    if (this.active > 36) return null;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * this._duck(), t + Math.min(0.03, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    let out = g, p = null;
    if (c.createStereoPanner) { p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); out = p; }
    out.connect(this.master);
    const voice = { stop: (f = 0.1) => { try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(0.0001, c.currentTime, f / 3); o.stop(c.currentTime + f + 0.05); } catch { /* ignore */ } } };
    o.onended = () => { this.active--; this.voices.delete(voice); try { o.disconnect(); g.disconnect(); p?.disconnect(); } catch { /* ignore */ } };
    this.active++; this.voices.add(voice);
    o.start(t); o.stop(t + dur + 0.05);
    return voice;
  }

  // One-shot events
  trigger(ev, o = {}) {
    if (!this._ready()) return;
    const pan = o.x || 0, d = o.delay || 0, sz = o.size || 1;
    const crack = (gain, dur, f = 2600) => this._play(this.sizzle, { filter: ["bandpass", f, 0.6], gain, dur, atk: 0.002, rel: dur * 0.9, pan, delay: d, offset: Math.random() });
    switch (ev) {
      case "launch":
        this._play(this.buf.launch, { rate: rand(0.97, 1.05), gain: 0.6, pan, delay: d });
        this._play(this.rush, { filter: ["bandpass", 1800, 0.8], gain: 0.22, dur: 0.55, atk: 0.04, rate: 1.2, pan, delay: d, offset: Math.random() * 2 });
        break;
      case "burst":
        if (!this._gate("burst", 35)) return;
        this._play(this.buf.pop, { rate: clamp(1.08 - 0.28 * sz, 0.55, 1.1), gain: 0.85 * clamp(0.55 + 0.3 * sz, 0.5, 1.1), pan, delay: d });
        this._osc("sine", 130, 34, 0.5 + 0.2 * sz, 0.5 * Math.sqrt(sz), pan, d);
        this._play(this.rush, { filter: ["lowpass", 320, 0.7], gain: 0.35 * sz, dur: 1.2 + 0.4 * sz, atk: 0.01, pan, delay: d, offset: Math.random() * 2 });
        crack(0.5, 0.22);
        break;
      case "pop":
        this._play(this.buf.pop, { rate: 1.3, gain: 0.75, pan, delay: d });
        crack(0.35, 0.12, 3800);
        break;
      case "crossette":
        if (this._gate("cross", 70)) crack(0.22, 0.1, 3200);
        break;
      case "crackle": {
        const dur = o.dur || 1.4;
        this._play(this.crackle, { filter: ["highpass", 1800, 0.5], gain: 0.55, dur, atk: 0.01, rel: dur * 0.8, pan, delay: d, offset: Math.random() * 0.5, rate: rand(0.9, 1.2) });
        break;
      }
      case "fade": // soft falling-ember hiss
        this._play(this.rush, { filter: ["highpass", 2500, 0.5], gain: 0.08, dur: 1.8, atk: 0.3, rel: 1.2, pan, delay: d, offset: Math.random() * 2 });
        break;
    }
  }

  // Sustained beds; returns a handle with stop(fadeSeconds)
  loop(kind, o = {}) {
    if (!this._ready()) return NOOP;
    const dur = o.dur || 3, pan = o.x || 0, hs = [];
    const L = (buf, extra) => hs.push(this._play(buf, { loop: true, dur, pan, offset: Math.random() * 1.5, ...extra }));
    switch (kind) {
      case "sizzle":
        L(this.sizzle, { filter: ["highpass", 1500, 0.5], gain: 0.3, atk: 0.08, rel: dur * 0.25 });
        L(this.crackle, { filter: ["highpass", 2200, 0.5], gain: 0.4, atk: 0.1, rel: dur * 0.25 });
        break;
      case "rush":
        L(this.rush, { filter: ["bandpass", 1100, 0.5], gain: 0.5, atk: 0.15, rel: dur * 0.35 });
        L(this.sizzle, { filter: ["highpass", 2500, 0.5], gain: 0.12, atk: 0.15, rel: dur * 0.35 });
        break;
      case "spin":
        L(this.sizzle, { filter: ["bandpass", 3000, 0.6], gain: 0.28, rate: 1.6, rampRate: 0.5, atk: 0.1, rel: dur * 0.3 });
        L(this.rush, { filter: ["bandpass", 900, 0.6], gain: 0.3, rate: 1.5, rampRate: 0.6, atk: 0.1, rel: dur * 0.3 });
        break;
      case "crackle":
        L(this.crackle, { filter: ["highpass", 1500, 0.5], gain: 0.6, atk: 0.1, rel: dur * 0.25 });
        L(this.sizzle, { filter: ["highpass", 3000, 0.5], gain: 0.1, atk: 0.1, rel: dur * 0.25 });
        break;
      case "ascend": // rising whistle + rising rush
        hs.push(this._osc("sine", 650, 2300, dur, 0.028, pan));
        L(this.rush, { filter: ["bandpass", 900, 1.2], sweep: 4200, gain: 0.2, atk: 0.1, rel: dur * 0.3 });
        break;
    }
    return { stop: (f) => hs.forEach((h) => h?.stop(f)) };
  }

  stopAll() { for (const v of [...this.voices]) v.stop(0.1); }
  dispose() {
    this.stopAll();
    this.ctx?.close().catch((error) => {
      console.error("Unable to close firecracker audio context.", error);
    });
    this.ctx = null;
  }
}
