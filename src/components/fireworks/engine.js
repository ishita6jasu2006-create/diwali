// Engine: owns the loop, the scheduler, and one behaviour per firecracker type.
import { ParticleSystem, PALETTES, PATTERNS, GOLD, EMBER, WHITE, SILVER, rand, mix, TAU } from "./particles.js";
import { Renderer } from "./renderer.js";

const MAX_EMITTERS = 26;
const env = (age, dur, atk = 0.25) => Math.max(0, Math.min(1, age / atk, (dur - age) / (dur * 0.35)));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const lt = (x, y, c, radius) => ({ x, y, c, i: 0, radius, life: 1, max: 1 });

// Generic ground fountain used by Rongmosal / Tubri / Anar / Flower Pot / Tara Bati
function Fountain(E, x, c) {
  const nozzles = c.nozzles, total = nozzles.reduce((s, n) => s + (n.w ?? 1), 0);
  const e = { x, visualKind: "fountain", age: 0, acc: 0, sAcc: 0, lt: lt(x, E.ground - 40, c.light || GOLD, 220 * E.hs) };
  e.handle = E.audio.loop(c.sound || "rush", { dur: c.dur, x: E.pan(x) });
  e.update = (dt) => {
    e.age += dt;
    const k = env(e.age, c.dur), surge = c.surge ? 0.7 + 0.3 * Math.sin(e.age * 19 + Math.sin(e.age * 7) * 2) : 1;
    e.acc += c.rate * k * surge * dt * E.ps.quality;
    while (e.acc >= 1) {
      e.acc--;
      let r = Math.random() * total, n = nozzles[0];
      for (const z of nozzles) { r -= z.w ?? 1; if (r <= 0) { n = z; break; } }
      const a = n.angle + (Math.random() + Math.random() - 1) * n.spread;
      const sp = rand(...(n.speed || c.speed)) * (0.8 + 0.2 * k) * E.hs;
      const [c1, c2] = (n.color || c.color)(e.age);
      E.ps.spawn(x + n.dx + rand(-3, 3), E.ground - 13, Math.cos(a) * sp, Math.sin(a) * sp, {
        life: rand(...c.life), size: rand(...c.size), c1, c2, drag: c.drag, grav: c.grav, tail: c.tail,
        flicker: c.flicker ?? 0.1, fade: 0.5, onDeath: c.onDeath, shed: c.shed ?? 0,
      });
    }
    e.sAcc += (c.smoke || 2) * k * dt;
    while (e.sAcc >= 1) {
      e.sAcc--;
      E.ps.puff(x + rand(-8, 8), E.ground - 16, { r: rand(18, 30) * E.hs, life: 5.5, a: 0.16, vx: rand(-10, 10), vy: rand(-16, -5), grow: 0.8 });
    }
    e.lt.i = 0.55 * k * surge;
    return e.age < c.dur + 0.1;
  };
  e.stop = () => e.handle.stop(0.2);
  return e;
}

const pinkGold = (() => {
  const P = [[255, 79, 154], [255, 197, 74], [70, 182, 255], [165, 107, 255]];
  return (age) => { const s = Math.floor(age / 0.9 + Math.random() * 0.4) % 4; return [P[s], P[(s + 1) % 4]]; };
})();
const goldSilver = () => [pick([WHITE, SILVER, GOLD]), mix(GOLD, EMBER, 0.6)];

const FOUNTAINS = {
  fountain: () => ({ dur: 4.2, rate: 330, nozzles: [{ dx: 0, angle: -Math.PI / 2, spread: 0.3 }], speed: [240, 470], life: [0.8, 1.6], size: [1.4, 2.6], drag: 0.978, grav: 220, tail: 0.05, color: pinkGold, light: [255, 120, 180], smoke: 2.5 }),
  tubri: () => ({ dur: 3.8, rate: 280, nozzles: [{ dx: 0, angle: -Math.PI / 2, spread: 0.38 }], speed: [330, 650], life: [0.9, 1.8], size: [1.3, 3], drag: 0.982, grav: 260, tail: 0.06, color: goldSilver, surge: true, smoke: 7, shed: 3 }),
  anar: () => ({
    dur: 5, rate: 430, speed: [150, 420], life: [0.9, 1.7], size: [1.4, 3], drag: 0.978, grav: 200, tail: 0.055, smoke: 3, wide: true,
    nozzles: [
      { dx: 0, angle: -Math.PI / 2, spread: 0.55, w: 4, color: () => [pick([GOLD, [255, 140, 50], WHITE]), EMBER] },
      { dx: 0, angle: -Math.PI / 2, spread: 0.12, w: 1, speed: [300, 540], color: () => [WHITE, GOLD] },
    ],
  }),
  flower: () => {
    const pal = pick(PALETTES);
    return { dur: 4, rate: 300, speed: [250, 430], life: [0.9, 1.5], size: [1.5, 2.6], drag: 0.976, grav: 210, tail: 0.05, smoke: 2, wide: true, color: () => [pick(pal), mix(pick(pal), EMBER, 0.4)],
      nozzles: [{ dx: -22, angle: -Math.PI / 2 + 0.38, spread: 0.22 }, { dx: 22, angle: -Math.PI / 2 - 0.38, spread: 0.22 }, { dx: 0, angle: -Math.PI / 2, spread: 0.3, w: 0.5, speed: [300, 480] }] };
  },
  crackle: () => ({ dur: 3.6, rate: 26, nozzles: [{ dx: 0, angle: -Math.PI / 2, spread: 1.2 }], speed: [90, 280], life: [0.7, 1.3], size: [2, 3.2], drag: 0.97, grav: 150, tail: 0.04, flicker: 0.6, color: () => [WHITE, GOLD], onDeath: "crackle", sound: "crackle", smoke: 0.8 }),
};

function Sparkler(E, x) {
  const dur = 5.2, ty = E.h * 0.52, hs = E.hs;
  const e = { visualKind: "sparkler", age: 0, acc: 0, eAcc: 0, tx: x, ty, lt: lt(x, ty, GOLD, 150 * hs) };
  e.handle = E.audio.loop("sizzle", { dur, x: E.pan(x) });
  e.update = (dt) => {
    e.age += dt;
    const k = env(e.age, dur, 0.3);
    e.tx = x + Math.sin(e.age * 3.1) * 2; e.ty = ty + Math.cos(e.age * 2.3) * 1.5;
    e.acc += 170 * k * dt * E.ps.quality;
    while (e.acc >= 1) {
      e.acc--;
      const a = rand(0, TAU), sp = rand(30, 230) * hs * (Math.random() < 0.2 ? 1.3 : 1);
      E.ps.spawn(e.tx, e.ty, Math.cos(a) * sp, Math.sin(a) * sp, { life: rand(0.18, 0.6), size: rand(0.9, 1.7), c1: WHITE, c2: GOLD, drag: 0.93, grav: 210, tail: 0.04, flicker: 0.35, fade: 0.5, onDeath: Math.random() < 0.14 ? "twig" : null });
    }
    e.eAcc += 14 * k * dt;
    while (e.eAcc >= 1) {
      e.eAcc--;
      E.ps.spawn(e.tx, e.ty, rand(-30, 30), rand(-10, 40), { life: rand(0.9, 1.7), size: 1.5, c1: GOLD, c2: EMBER, drag: 0.96, grav: 260, tail: 0.03, flicker: 0.5, fade: 0.5 });
    }
    e.lt.x = e.tx; e.lt.y = e.ty; e.lt.i = 0.45 * k * (0.8 + 0.2 * Math.random());
    return e.age < dur;
  };
  e.stop = () => e.handle.stop(0.2);
  return e;
}

function Spinner(E, x) {
  const dur = 2.8, y = E.ground - 8, hs = E.hs, pal = pick(PALETTES);
  const cols = [pal[0], pal[1], GOLD, WHITE];
  const e = { x, visualKind: "spinner", age: 0, ang: 0, w: 0, sAcc: 0, lt: lt(x, y - 14, pal[0], 130 * hs) };
  e.handle = E.audio.loop("spin", { dur, x: E.pan(x) });
  e.update = (dt) => {
    e.age += dt;
    e.w = 30 * Math.min(1, e.age / 0.3) * Math.pow(Math.max(0, 1 - e.age / dur), 0.8);
    const prev = e.ang; e.ang += e.w * dt;
    const sub = Math.max(1, Math.ceil((e.w * dt) / 0.15));
    for (let j = 0; j < sub; j++) {
      const th = prev + ((e.ang - prev) * (j + 1)) / sub;
      for (let i = 0; i < 4; i++) {
        if (Math.random() > 0.55 * E.ps.quality) continue;
        const a = th + (i * TAU) / 4, sp = (e.w * 10 * 0.75 + 45) * hs * rand(0.85, 1.1);
        E.ps.spawn(x + Math.cos(a) * 10, y + Math.sin(a) * 10 * 0.35, -Math.sin(a) * sp, Math.cos(a) * sp * 0.35 - 25 * hs, { life: rand(0.45, 0.8), size: 1.9, c1: cols[i], c2: EMBER, drag: 0.96, grav: 70, tail: 0.06, flicker: 0.15, fade: 0.5 });
      }
    }
    e.sAcc += 3 * dt;
    if (e.sAcc >= 1) { e.sAcc = 0; E.ps.puff(x, y - 6, { r: 10 * hs, life: 3, a: 0.1, vx: rand(-8, 8), vy: -10, grow: 1 }); }
    e.lt.i = 0.5 * Math.min(1, e.w / 10);
    return e.age < dur;
  };
  e.stop = () => e.handle.stop(0.2);
  return e;
}

function Potka(E, x) {
  const fuse = 0.8, hs = E.hs, ty = E.ground - 24;
  const e = { x, visualKind: "potka", age: 0, boom: false, acc: 0, lt: lt(x, E.ground - 14, [255, 220, 150], 260 * hs) };
  e.update = (dt) => {
    e.age += dt;
    if (!e.boom) {
      e.tipY = ty + 10 * (e.age / fuse);
      e.acc += 70 * dt;
      while (e.acc >= 1) { e.acc--; E.ps.spawn(x + 6, e.tipY, rand(-60, 60), rand(-120, -20), { life: rand(0.15, 0.35), size: 1.2, c1: WHITE, c2: GOLD, grav: 200, tail: 0.04, flicker: 0.4, fade: 0.6 }); }
      if (e.age >= fuse) {
        e.boom = true;
        const y = E.ground - 14, q = E.ps.quality;
        for (let i = Math.round(22 * q); i--;) { const a = rand(-Math.PI, 0), s = rand(60, 280) * hs; E.ps.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, { life: rand(0.12, 0.3), size: 2.8, c1: WHITE, c2: GOLD, drag: 0.9, grav: 80, tail: 0.04, fade: 1 }); }
        for (let i = Math.round(46 * q); i--;) { const a = rand(-Math.PI * 1.05, 0.05 * Math.PI), s = rand(120, 240) * hs; E.ps.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, { life: rand(0.3, 0.75), size: rand(1.4, 2.4), c1: WHITE, c2: pick([GOLD, EMBER]), drag: 0.93, grav: 160, tail: 0.06, fade: 0.5 }); }
        E.ps.puff(x, y - 8, { r: 22 * hs, life: 3.5, a: 0.22, vx: rand(-10, 10), vy: -10, grow: 1.2 });
        E.audio.trigger("pop", { x: E.pan(x) });
      }
    }
    e.lt.i = e.boom ? Math.max(0, 1.1 - (e.age - fuse) / 0.18) : 0;
    return e.age < fuse + 0.2;
  };
  return e;
}

// Rocket (single-break) and Sky Shot (large shell). Visible ignition, accelerating ascent, burning trail, then pattern burst.
function Rocket(E, x, target, shell, pattern) {
  const hs = E.hs, pal = pick(PALETTES), scale = shell ? 1.55 : 1, ign = shell ? 0.18 : 0.45;
  const e = { visualKind: "rocket", age: 0, x, y: E.ground - 14, vy: 0, acc: 0, sAcc: 0, seed: rand(0, 9), lt: lt(x, E.ground - 14, GOLD, 100 * hs) };
  E.audio.trigger("launch", { x: E.pan(x) });
  e.handle = E.audio.loop("ascend", { dur: (E.ground - target) / (380 * hs) + 1, x: E.pan(x) });
  e.update = (dt) => {
    e.age += dt;
    if (e.age < ign) { // ignition: hissing spray from the base
      for (let i = 0; i < 3; i++) E.ps.spawn(x, E.ground - 12, rand(-70, 70), rand(40, 160), { life: rand(0.15, 0.4), size: 1.5, c1: WHITE, c2: GOLD, grav: 120, tail: 0.04, flicker: 0.3, fade: 0.6 });
      e.lt.i = 0.5 * (e.age / ign);
      return true;
    }
    const a = (shell ? 900 : 760) * hs, vmax = (shell ? 640 : 520) * hs;
    e.vy = Math.max(-vmax, e.vy - a * dt);
    e.y += e.vy * dt;
    e.x += Math.sin(e.age * 31 + e.seed) * 14 * dt;
    e.acc += 260 * dt * E.ps.quality;
    while (e.acc >= 1) {
      e.acc--;
      E.ps.spawn(e.x + rand(-1.5, 1.5), e.y + 6, rand(-22, 22), -e.vy * 0.12 + rand(10, 60), { life: rand(0.35, 0.9), size: rand(1.2, 2.2), c1: WHITE, c2: EMBER, drag: 0.95, grav: 70, tail: 0.03, flicker: 0.3, fade: 0.8 });
    }
    e.sAcc += dt;
    if (e.sAcc > 0.045) { e.sAcc = 0; E.ps.puff(e.x, e.y + 10, { r: rand(5, 9) * hs, life: 3.5, a: 0.09, vx: rand(-4, 4), vy: rand(2, 10), grow: 1.6 }); }
    e.lt.x = e.x; e.lt.y = e.y; e.lt.radius = 90 * hs; e.lt.i = 0.45;
    if (e.y <= target || e.age > 6) {
      e.handle.stop(0.06);
      E.audio.trigger("burst", { x: E.pan(e.x), size: scale });
      E.ps.burst(e.x, e.y, pattern, scale, pal);
      if (pattern === "crackling") E.audio.trigger("crackle", { x: E.pan(e.x), dur: 1.6, delay: 0.1 });
      if (pattern === "willow" || pattern === "palm") E.audio.trigger("fade", { x: E.pan(e.x), delay: 0.4 });
      if (shell && Math.random() < 0.45) { // compound shell: heart burst
        const bx = e.x, by = e.y;
        E.after(0.14, () => { E.ps.burst(bx, by, "peony", 0.6, [pal[1], pal[0]]); E.audio.trigger("pop", { x: E.pan(bx) }); });
      }
      e.done = true; e.lt.i = 0;
      return false;
    }
    return true;
  };
  e.stop = () => e.handle.stop(0.15);
  return e;
}

export class FireworksEngine {
  constructor(canvas, audio) {
    this.canvas = canvas; this.audio = audio;
    this.ps = new ParticleSystem();
    this.renderer = new Renderer(canvas, this.ps);
    this.ps.onSound = (ev, x) => this.audio.trigger(ev, { x: this.pan(x) });
    this.emitters = []; this.queue = [];
    this.time = 0; this.last = 0; this.raf = 0; this.avg = 0.0167; this.frames = 0;
    this.visible = true; this.running = false;
    this.w = 0; this.h = 0; this.ground = 0; this.hs = 1;
    this._tick = this._tick.bind(this);
  }

  get quality() { return this.ps.quality; }
  pan(x) { return Math.max(-1, Math.min(1, (x / (this.w || 1)) * 2 - 1)) * 0.8; }
  after(t, fn) { this.queue.push({ t: this.time + t, fn }); }

  resize() {
    if (!this.renderer.resize()) return;
    const r = this.renderer;
    this.w = r.width; this.h = r.height; this.ground = r.ground;
    this.hs = Math.max(0.7, Math.min(1.9, r.height / 475));
    this.ps.hs = this.hs;
    if (this.w < 520) this.ps.quality = Math.min(this.ps.quality, 0.7);
  }

  start() {
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
    this.io = new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; this.visible ? this._run() : this._halt(); }, { threshold: 0.05 });
    this.io.observe(this.canvas);
    this._run();
  }
  _run() { if (this.running) return; this.running = true; this.last = 0; this.raf = requestAnimationFrame(this._tick); }
  _halt() { this.running = false; cancelAnimationFrame(this.raf); }
  dispose() { this._halt(); this.ro?.disconnect(); this.io?.disconnect(); this.emitters.forEach((e) => e.stop?.()); this.emitters.length = 0; this.queue.length = 0; this.ps.clear(); }

  _tick(t) {
    if (!this.running) return;
    const raw = this.last ? (t - this.last) / 1000 : 0.016;
    this.last = t;
    const dt = Math.min(raw, 0.05);
    this.time += dt;
    for (let i = this.queue.length - 1; i >= 0; i--) if (this.queue[i].t <= this.time) this.queue.splice(i, 1)[0].fn();
    for (let i = this.emitters.length - 1; i >= 0; i--) if (!this.emitters[i].update(dt)) { this.emitters[i].stop?.(); this.emitters.splice(i, 1); }
    this.ps.update(dt);
    this.renderer.frame(dt, this.emitters);
    this.avg = this.avg * 0.95 + Math.min(raw, 0.1) * 0.05;
    if (++this.frames % 45 === 0) { // adaptive quality for mobile / low-end hardware
      if (this.avg > 0.026 && this.ps.quality > 0.45) this.ps.quality -= 0.12;
      else if (this.avg < 0.0185 && this.ps.quality < (this.w < 520 ? 0.7 : 1)) this.ps.quality += 0.05;
    }
    this.raf = requestAnimationFrame(this._tick);
  }

  _pickX() {
    let best = 0, bestD = -1;
    for (let i = 0; i < 6; i++) {
      const x = rand(this.w * 0.14, this.w * 0.86);
      const d = Math.min(...this.emitters.map((e) => Math.abs((e.x ?? e.tx ?? x + 999) - x)), 999);
      if (d > bestD) { bestD = d; best = x; }
    }
    return best;
  }

  _add(e) {
    if (this.emitters.length >= MAX_EMITTERS) this.emitters.shift()?.stop?.();
    this.emitters.push(e);
  }

  launch(kind, { x, y, pattern } = {}) {
    if (!this.w) return;
    const px = x ?? this._pickX();
    if (kind === "rocket" || kind === "skyshot") {
      const shell = kind === "skyshot";
      const target = y !== undefined ? Math.min(y, this.h * 0.72) : rand(this.h * (shell ? 0.12 : 0.18), this.h * (shell ? 0.34 : 0.42));
      const pat = pattern && pattern !== "auto" ? pattern
        : shell ? pick(PATTERNS)
        : pick(["chrysanthemum", "chrysanthemum", "chrysanthemum", "peony", "peony", "peony", "willow", "willow", "palm", "ring", "pistil", "crossette", "crackling"]);
      this._add(Rocket(this, px, target, shell, pat));
    } else if (kind === "sparkler") this._add(Sparkler(this, px));
    else if (kind === "spinner") this._add(Spinner(this, px));
    else if (kind === "pop") this._add(Potka(this, px));
    else if (FOUNTAINS[kind]) this._add(Fountain(this, px, FOUNTAINS[kind]()));
  }

  // A staged ~14 second show finishing with a volley of sky shots
  surprise(kinds = ["rocket", "rocket", "skyshot", "fountain", "spinner", "anar", "tubri", "flower", "crackle", "sparkler", "pop"]) {
    let t = 0;
    const n = 11 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      t += rand(0.4, 1.2);
      const kind = pick(i % 3 === 2 ? ["skyshot", "rocket"] : kinds);
      this.after(t, () => this.launch(kind));
    }
    for (let i = 0; i < 4; i++) this.after(t + 0.9 + i * 0.3, () => this.launch("skyshot", { x: this.w * (0.2 + 0.2 * i) + rand(-30, 30) }));
  }

  clear() {
    this.emitters.forEach((e) => e.stop?.());
    this.emitters.length = 0; this.queue.length = 0;
    this.ps.clear(); this.renderer.clearSparks();
    this.audio.stopAll();
  }
}
