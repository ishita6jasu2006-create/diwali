// Particle system: pooled sparks, drifting smoke, transient lights, and burst patterns.
export const TAU = Math.PI * 2;
export const rand = (a, b) => a + Math.random() * (b - a);
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export const GOLD = hex("#ffb54a");
export const EMBER = hex("#ff5a14");
export const WHITE = hex("#fff6dc");
export const SILVER = hex("#dce9ff");
export const PALETTES = [
  "#ff3b5c|#ffd36a", "#3ab8ff|#e2f8ff", "#7dff6a|#fff2a0", "#b46bff|#ffb0f0",
  "#ff8a2a|#ffe7a0", "#ff5fa8|#6ae6ff", "#f2f2ff|#8aa8ff",
].map((s) => s.split("|").map(hex));
export const PATTERNS = ["chrysanthemum", "peony", "willow", "pistil", "ring", "palm", "crossette", "crackling"];
const sphereDirection = () => {
  const dz = rand(-1, 1), angle = rand(0, TAU), radius = Math.sqrt(1 - dz * dz);
  return [radius * Math.cos(angle), radius * Math.sin(angle), dz];
};

const MAX = 3000, MAX_SMOKE = 120, MAX_LIGHTS = 12;
const blank = () => ({
  x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1, c1: GOLD, c2: EMBER, drag: 0.97, grav: 100,
  tail: 0.05, bright: 1, flicker: 0, shed: 0, fade: 0.6, delay: 0, onDeath: null,
});

export class ParticleSystem {
  constructor() {
    this.free = Array.from({ length: MAX }, blank);
    this.live = [];
    this.smoke = [];
    this.lights = [];
    this.quality = 1;
    this.hs = 1; // height scale (canvas height / 475)
    this.wind = 8;
    this.time = 0;
    this.onSound = null;
  }

  clear() {
    while (this.live.length) this.free.push(this.live.pop());
    this.smoke.length = 0;
    this.lights.length = 0;
  }

  spawn(x, y, vx, vy, o) {
    const p = this.free.pop();
    if (!p) return null;
    p.x = x; p.y = y; p.z = o.z ?? 0;
    p.vx = vx; p.vy = vy; p.vz = o.vz ?? rand(-24, 24) * this.hs;
    p.life = p.max = o.life ?? 1;
    p.size = o.size ?? 1.8;
    p.c1 = o.c1 ?? GOLD; p.c2 = o.c2 ?? EMBER;
    p.drag = o.drag ?? 0.97;
    p.grav = (o.grav ?? 100) * this.hs;
    p.tail = o.tail ?? 0.05;
    p.bright = o.bright ?? 1;
    p.flicker = o.flicker ?? 0;
    p.shed = o.shed ?? 0;
    p.fade = o.fade ?? 0.6;
    p.delay = o.delay ?? 0;
    p.onDeath = o.onDeath ?? null;
    this.live.push(p);
    return p;
  }

  light(x, y, c, i, life, radius) {
    if (this.lights.length >= MAX_LIGHTS) this.lights.shift();
    this.lights.push({ x, y, c, i, life, max: life, radius });
  }

  puff(x, y, o) {
    if (this.smoke.length >= MAX_SMOKE) this.smoke.shift();
    this.smoke.push({ x, y, z: o.z ?? 0, r0: o.r, life: o.life, age: 0, a: o.a, vx: o.vx ?? 0, vy: o.vy ?? 0, vz: o.vz ?? rand(-8, 8), grow: o.grow ?? 0.6 });
  }

  update(dt) {
    this.time += dt;
    this.wind = 8 + 6 * Math.sin(this.time * 0.17);
    const live = this.live;
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.life -= dt;
      if (p.life <= 0) {
        const { x, y, z, vx, vy, vz, onDeath, c1 } = p;
        live[i] = live[live.length - 1];
        live.pop();
        this.free.push(p);
        if (onDeath) this._death(onDeath, x, y, z, vx, vy, vz, c1);
        continue;
      }
      const d = Math.pow(p.drag, dt * 60);
      p.vx = p.vx * d + this.wind * 0.25 * dt;
      p.vy = p.vy * d + p.grav * dt;
      p.vz *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.shed > 0 && Math.random() < p.shed * dt * this.quality) {
        this.spawn(p.x, p.y, p.vx * 0.04 + rand(-12, 12), p.vy * 0.04 + rand(-12, 12), {
          z: p.z, vz: p.vz * 0.04 + rand(-12, 12),
          life: rand(0.25, 0.7), size: p.size * 0.42, c1: p.c1, c2: EMBER, grav: 45, drag: 0.95,
          tail: 0.03, bright: 0.75, fade: 0.9,
        });
      }
    }
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];
      s.age += dt;
      if (s.age >= s.life) { this.smoke.splice(i, 1); continue; }
      s.x += (s.vx + this.wind) * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.vy *= Math.pow(0.98, dt * 60);
    }
    for (let i = this.lights.length - 1; i >= 0; i--) {
      this.lights[i].life -= dt;
      if (this.lights[i].life <= 0) this.lights.splice(i, 1);
    }
  }

  _death(kind, x, y, z, vx, vy, vz, col) {
    const hs = this.hs;
    if (kind === "cross") {
      const rot = rand(0, TAU);
      for (let k = 0; k < 4; k++) {
        const a = rot + (k * TAU) / 4, sp = rand(105, 135) * hs;
        this.spawn(x, y, Math.cos(a) * sp + vx * 0.2, Math.sin(a) * sp + vy * 0.2, {
          z, vz: vz * 0.2 + rand(-30, 30) * hs,
          life: rand(0.75, 1.0), size: 2.4, c1: col, c2: EMBER, drag: 0.955, grav: 60, tail: 0.09, shed: 10, fade: 0.5,
        });
      }
      this.light(x, y, col, 0.4, 0.22, 140 * hs);
      this.onSound?.("crossette", x);
    } else if (kind === "mini") {
      const n = Math.max(6, Math.round(12 * this.quality));
      for (let k = 0; k < n; k++) {
        const a = rand(0, TAU), sp = rand(55, 85) * hs;
        this.spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, { z, vz: vz * 0.2 + rand(-24, 24) * hs, life: rand(0.6, 0.95), size: 1.6, c1: col, c2: EMBER, drag: 0.95, grav: 50, tail: 0.06 });
      }
      this.light(x, y, col, 0.35, 0.2, 120 * hs);
      this.onSound?.("crossette", x);
    } else if (kind === "crackle") {
      for (let k = 0; k < 3; k++) {
        this.spawn(x + rand(-6, 6), y + rand(-6, 6), rand(-25, 25), rand(-25, 25), {
          z, vz: rand(-30, 30) * hs,
          life: rand(0.07, 0.22), size: rand(1.4, 2.4), c1: WHITE, c2: GOLD, delay: rand(0.05, 0.95),
          flicker: 0.8, tail: 0.02, grav: 30, drag: 0.9, fade: 1,
        });
      }
    } else if (kind === "twig") {
      for (let k = 0; k < 3; k++) {
        const a = rand(0, TAU), sp = rand(30, 60) * hs;
        this.spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, { z, vz: rand(-25, 25) * hs, life: rand(0.08, 0.18), size: 1, c1: WHITE, c2: GOLD, tail: 0.03, fade: 1 });
      }
    }
  }

  // --- Aerial burst patterns: each has its own physics, not just its own colour ---
  burst(x, y, pattern, scale = 1, pal = PALETTES[0]) {
    const hs = this.hs, S = 255 * hs * scale, [A, B] = pal;
    const n = (c) => Math.max(10, Math.round(c * this.quality * (0.75 + 0.25 * scale)));
    const dim = (c) => mix(c, EMBER, 0.55);
    switch (pattern) {
      case "peony":
        for (let i = n(150); i--;) {
          const [dx, dy, dz] = sphereDirection(), s = S * rand(0.93, 1);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(1.5, 2.1), size: rand(1.7, 2.5), c1: A, c2: dim(A), drag: 0.958, grav: 42, tail: 0.07, fade: 0.55, bright: rand(0.8, 1), flicker: 0.08 });
        }
        break;
      case "chrysanthemum":
        for (let i = n(200); i--;) {
          const [dx, dy, dz] = sphereDirection(), s = S * rand(0.5, 1.03);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(2.0, 2.8), size: rand(1.4, 2.2), c1: A, c2: dim(B), drag: 0.962, grav: 48, tail: 0.11, shed: 14, fade: 0.5, bright: rand(0.7, 1) });
        }
        break;
      case "willow":
        for (let i = n(100); i--;) {
          const [dx, dy, dz] = sphereDirection(), s = S * rand(0.55, 0.9);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(3.2, 4.4), size: 2.2, c1: GOLD, c2: EMBER, drag: 0.948, grav: 120, tail: 0.14, shed: 38, fade: 0.7, flicker: 0.05 });
        }
        break;
      case "palm": {
        const arms = 11, rot = rand(0, TAU);
        for (let i = 0; i < arms; i++) {
          const a = rot + (i * TAU) / arms + rand(-0.12, 0.12), s = S * rand(0.85, 1.1);
          this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s * 0.9 - 20 * hs, { life: rand(2.6, 3.2), size: 3.6, c1: GOLD, c2: EMBER, drag: 0.965, grav: 95, tail: 0.13, shed: 45, fade: 0.6 });
        }
        for (let i = n(24); i--;) {
          const [dx, dy, dz] = sphereDirection(), s = S * rand(0.3, 0.6);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(1, 1.6), size: 1.6, c1: WHITE, c2: GOLD, drag: 0.95, grav: 60, tail: 0.06 });
        }
        break;
      }
      case "ring": {
        const nz = rand(-0.75, 0.75), phi = rand(0, TAU);
        const normal = [Math.sqrt(1 - nz * nz) * Math.cos(phi), Math.sqrt(1 - nz * nz) * Math.sin(phi), nz];
        const reference = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        const u = [
          normal[1] * reference[2] - normal[2] * reference[1],
          normal[2] * reference[0] - normal[0] * reference[2],
          normal[0] * reference[1] - normal[1] * reference[0],
        ];
        const uLength = Math.hypot(...u);
        u.forEach((value, i) => { u[i] = value / uLength; });
        const v = [
          normal[1] * u[2] - normal[2] * u[1],
          normal[2] * u[0] - normal[0] * u[2],
          normal[0] * u[1] - normal[1] * u[0],
        ];
        for (let i = n(96); i--;) {
          const angle = rand(0, TAU), speed = S * rand(0.94, 1);
          const dx = u[0] * Math.cos(angle) + v[0] * Math.sin(angle);
          const dy = u[1] * Math.cos(angle) + v[1] * Math.sin(angle);
          const dz = u[2] * Math.cos(angle) + v[2] * Math.sin(angle);
          this.spawn(x, y, dx * speed, dy * speed, { vz: dz * speed, life: rand(1.5, 1.9), size: 2.2, c1: A, c2: dim(B), drag: 0.958, grav: 38, tail: 0.06, fade: 0.5 });
        }
        break;
      }
      case "pistil":
        for (let i = n(70); i--;) {
          const [dx, dy, dz] = sphereDirection(), s = S * 0.42 * rand(0.9, 1);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(1.2, 1.5), size: 2, c1: B, c2: dim(B), drag: 0.958, grav: 40, tail: 0.06, fade: 0.5 });
        }
        for (let i = n(110); i--;) {
          const [dx, dy, dz] = sphereDirection(), s = S * rand(0.95, 1.05);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(1.7, 2.2), size: 2.3, c1: A, c2: dim(A), drag: 0.958, grav: 45, tail: 0.08, fade: 0.55 });
        }
        break;
      case "crossette":
        for (let i = 0; i < 16; i++) {
          const [dx, dy, dz] = sphereDirection(), s = S * rand(0.7, 0.9);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(1.2, 1.5), size: 3, c1: mix(GOLD, A, 0.3), c2: EMBER, drag: 0.96, grav: 50, tail: 0.1, shed: 10, fade: 0.12, onDeath: "cross" });
        }
        break;
      case "crackling":
        for (let i = n(110); i--;) {
          const [dx, dy, dz] = sphereDirection(), s = S * rand(0.5, 1);
          this.spawn(x, y, dx * s, dy * s, { vz: dz * s, life: rand(1.1, 1.7), size: 2.2, c1: WHITE, c2: GOLD, drag: 0.96, grav: 50, tail: 0.09, shed: 8, fade: 0.5, onDeath: "crackle" });
        }
        break;
    }
    this._finish(x, y, A, scale);
  }

  _finish(x, y, A, scale) {
    const hs = this.hs;
    this.light(x, y, mix(A, WHITE, 0.6), Math.min(1.3, scale), 0.55, 300 * hs * scale);
    for (let i = 12; i--;) { // hot white core flash
      const direction = sphereDirection(), s = rand(80, 260) * hs * scale;
      this.spawn(x, y, direction[0] * s, direction[1] * s, { vz: direction[2] * s, life: 0.15, size: 3, c1: WHITE, c2: A, tail: 0.04, drag: 0.9, fade: 1, grav: 0 });
    }
    for (let i = Math.round(16 * scale * this.quality); i--;) { // slow golden embers
      const direction = sphereDirection(), s = rand(20, 70) * hs * scale;
      this.spawn(x, y, direction[0] * s, direction[1] * s, { vz: direction[2] * s, life: rand(2.4, 4.2), size: 1.4, c1: GOLD, c2: EMBER, drag: 0.97, grav: 25, tail: 0.05, flicker: 0.5, fade: 0.5, bright: 0.8 });
    }
    for (let k = 0; k < 2; k++) this.puff(x + rand(-10, 10), y + rand(-10, 10), { r: 34 * hs * scale, life: 8, a: 0.13, vx: rand(-6, 6), vy: rand(-4, 2), grow: 0.35 });
    if (scale > 1.2) { // secondary bursts
      for (let i = 0; i < 4; i++) {
        const direction = sphereDirection(), s = 255 * hs * scale * 0.45;
        this.spawn(x, y, direction[0] * s, direction[1] * s, { vz: direction[2] * s, life: rand(0.45, 0.7), size: 2.4, c1: A, c2: A, drag: 0.95, grav: 30, tail: 0.08, fade: 0.15, onDeath: "mini" });
      }
    }
  }
}
