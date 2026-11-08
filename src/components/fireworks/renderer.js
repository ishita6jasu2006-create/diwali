import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const MAX_SPARKS = 3000;
const MAX_SMOKE = 120;
const CAMERA_Z = 28;
const FIELD_OF_VIEW = 42;

const SPARK_VERTEX = `
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uViewportHeight;
  uniform float uFov;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = max(1.0, aSize * uViewportHeight / (2.0 * tan(uFov * 0.5) * -viewPosition.z));
  }
`;

const SPARK_FRAGMENT = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p) * 2.0;
    float core = exp(-r * r * 9.0);
    float halo = exp(-r * r * 3.2) * 0.28;
    float alpha = (core + halo) * vAlpha;
    if (alpha < 0.012) discard;
    gl_FragColor = vec4(vColor * (1.0 + core * 0.8), alpha);
  }
`;

const TRAIL_VERTEX = `
  attribute vec4 aColor;
  varying vec4 vColor;
  void main() {
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TRAIL_FRAGMENT = `
  varying vec4 vColor;
  void main() {
    gl_FragColor = vec4(vColor.rgb, vColor.a);
  }
`;

const SMOKE_VERTEX = `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  uniform float uViewportHeight;
  uniform float uFov;
  void main() {
    vAlpha = aAlpha;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = max(1.0, aSize * uViewportHeight / (2.0 * tan(uFov * 0.5) * -viewPosition.z));
  }
`;

const SMOKE_FRAGMENT = `
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = exp(-r * r * 5.0) * vAlpha;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(0.42, 0.38, 0.46, alpha);
  }
`;

function colorToLinear(color, target, offset, brightness = 1) {
  const scale = 1 / 255;
  for (let channel = 0; channel < 3; channel++) {
    const srgb = Math.min(1, Math.max(0, color[channel] * scale));
    target[offset + channel] = (srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4) * brightness;
  }
}

function setDynamic(attribute, needsUpdate = true) {
  attribute.needsUpdate = needsUpdate;
  attribute.clearUpdateRanges();
  attribute.addUpdateRange(0, attribute.array.length);
}

export class Renderer {
  constructor(canvas, particles) {
    this.canvas = canvas;
    this.ps = particles;
    this.width = 0;
    this.height = 0;
    this.ground = 0;
    this.scale = 1;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 120);
    this.camera.position.z = CAMERA_Z;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor("#050815", 1);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.05, 0.78, 0.075);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.scene.add(new THREE.HemisphereLight("#b4c6ff", "#241426", 0.32));
    const moon = new THREE.DirectionalLight("#93a9ff", 0.28);
    moon.position.set(-5, 10, 12);
    this.scene.add(moon);

    this.sparkGeometry = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(MAX_SPARKS * 3);
    this.sparkColors = new Float32Array(MAX_SPARKS * 3);
    this.sparkAlphas = new Float32Array(MAX_SPARKS);
    this.sparkSizes = new Float32Array(MAX_SPARKS);
    this.sparkGeometry.setAttribute("position", new THREE.BufferAttribute(this.sparkPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.sparkGeometry.setAttribute("aColor", new THREE.BufferAttribute(this.sparkColors, 3).setUsage(THREE.DynamicDrawUsage));
    this.sparkGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(this.sparkAlphas, 1).setUsage(THREE.DynamicDrawUsage));
    this.sparkGeometry.setAttribute("aSize", new THREE.BufferAttribute(this.sparkSizes, 1).setUsage(THREE.DynamicDrawUsage));
    this.sparkMaterial = new THREE.ShaderMaterial({
      vertexShader: SPARK_VERTEX,
      fragmentShader: SPARK_FRAGMENT,
      uniforms: {
        uViewportHeight: { value: 1 },
        uFov: { value: THREE.MathUtils.degToRad(FIELD_OF_VIEW) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.sparkPoints = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);

    this.trailGeometry = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(MAX_SPARKS * 6);
    this.trailColors = new Float32Array(MAX_SPARKS * 8);
    this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(this.trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.trailGeometry.setAttribute("aColor", new THREE.BufferAttribute(this.trailColors, 4).setUsage(THREE.DynamicDrawUsage));
    this.trailMaterial = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERTEX,
      fragmentShader: TRAIL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.trails = new THREE.LineSegments(this.trailGeometry, this.trailMaterial);
    this.trails.frustumCulled = false;
    this.scene.add(this.trails);

    this.smokeGeometry = new THREE.BufferGeometry();
    this.smokePositions = new Float32Array(MAX_SMOKE * 3);
    this.smokeSizes = new Float32Array(MAX_SMOKE);
    this.smokeAlphas = new Float32Array(MAX_SMOKE);
    this.smokeGeometry.setAttribute("position", new THREE.BufferAttribute(this.smokePositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.smokeGeometry.setAttribute("aSize", new THREE.BufferAttribute(this.smokeSizes, 1).setUsage(THREE.DynamicDrawUsage));
    this.smokeGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(this.smokeAlphas, 1).setUsage(THREE.DynamicDrawUsage));
    this.smokeMaterial = new THREE.ShaderMaterial({
      vertexShader: SMOKE_VERTEX,
      fragmentShader: SMOKE_FRAGMENT,
      uniforms: {
        uViewportHeight: { value: 1 },
        uFov: { value: THREE.MathUtils.degToRad(FIELD_OF_VIEW) },
      },
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    this.smokePoints = new THREE.Points(this.smokeGeometry, this.smokeMaterial);
    this.smokePoints.frustumCulled = false;
    this.scene.add(this.smokePoints);

    this.backgroundGroup = new THREE.Group();
    this.scene.add(this.backgroundGroup);
    this.emitterVisuals = new Map();
    this.shared = this._createSharedVisuals();
    this.lights = Array.from({ length: 12 }, () => {
      const light = new THREE.PointLight("#ffd58b", 0, 7, 2);
      this.scene.add(light);
      return light;
    });
  }

  _createSharedVisuals() {
    const materials = {
      box: new THREE.MeshStandardMaterial({ color: "#0b1021", roughness: 1 }),
      distantBox: new THREE.MeshStandardMaterial({ color: "#11142a", roughness: 1 }),
      ground: new THREE.MeshStandardMaterial({ color: "#090d1c", roughness: 0.95 }),
      brass: new THREE.MeshStandardMaterial({ color: "#ad743e", metalness: 0.55, roughness: 0.38 }),
      red: new THREE.MeshStandardMaterial({ color: "#a83231", roughness: 0.7 }),
      wood: new THREE.MeshStandardMaterial({ color: "#c5a176", roughness: 0.85 }),
      spark: new THREE.MeshBasicMaterial({ color: "#fff2bc", toneMapped: false }),
      wire: new THREE.LineBasicMaterial({ color: "#725b49", transparent: true, opacity: 0.65 }),
    };
    return {
      materials,
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(0.35, 0.48, 0.28, 12),
      ring: new THREE.TorusGeometry(0.43, 0.035, 6, 20),
      sparkler: new THREE.CylinderGeometry(0.025, 0.025, 1, 6),
      flame: new THREE.SphereGeometry(0.075, 8, 6),
      spinner: new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12),
      rocket: new THREE.ConeGeometry(0.11, 0.48, 8),
      rod: new THREE.BoxGeometry(0.9, 0.035, 0.035),
      bulb: new THREE.SphereGeometry(0.045, 7, 5),
    };
  }

  _screenPosition(x, y, z = 0) {
    return new THREE.Vector3(
      (x - this.width / 2) * this.scale,
      (this.height / 2 - y) * this.scale,
      z
    );
  }

  _clearGroup(group) {
    const sharedGeometries = new Set(Object.values(this.shared ?? {}).filter((item) => item?.isBufferGeometry));
    const sharedMaterials = new Set(Object.values(this.shared?.materials ?? {}));
    group.traverse((child) => {
      if (child.geometry && !sharedGeometries.has(child.geometry)) child.geometry.dispose();
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (!sharedMaterials.has(material)) material.dispose();
        });
      }
    });
    group.clear();
  }

  _buildBackground() {
    this._clearGroup(this.backgroundGroup);
    const { width, height, ground, scale } = this;
    const worldHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FIELD_OF_VIEW / 2));
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(worldHeight * (width / height) * 1.7, worldHeight * 1.7),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          void main() {
            vec3 top = vec3(0.001, 0.002, 0.008);
            vec3 middle = vec3(0.003, 0.005, 0.02);
            vec3 horizon = vec3(0.012, 0.008, 0.03);
            vec3 sky = mix(horizon, middle, smoothstep(0.0, 0.72, vUv.y));
            sky = mix(sky, top, smoothstep(0.58, 1.0, vUv.y));
            float haze = exp(-pow((vUv.y - 0.15) * 8.0, 2.0));
            sky += vec3(0.035, 0.008, 0.002) * haze * 0.32;
            gl_FragColor = vec4(sky, 1.0);
          }
        `,
        depthWrite: false,
        toneMapped: false,
      })
    );
    sky.position.z = -14;
    this.backgroundGroup.add(sky);

    const starPositions = [];
    for (let i = 0; i < Math.min(180, Math.floor(width / 4)); i++) {
      const point = this._screenPosition(Math.random() * width, Math.random() * ground * 0.72, -10);
      starPositions.push(point.x, point.y, point.z);
    }
    const stars = new THREE.BufferGeometry();
    stars.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    this.backgroundGroup.add(new THREE.Points(
      stars,
      new THREE.PointsMaterial({
        color: "#ffe9b0",
        size: 0.055,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        toneMapped: false,
      })
    ));

    const buildCityLayer = (depth, color, minHeight, maxHeight, minWidth, maxWidth, windowAlpha) => {
      const group = new THREE.Group();
      const windowPositions = [];
      let x = -12;
      while (x < width + 12) {
        const buildingWidth = THREE.MathUtils.randFloat(minWidth, maxWidth);
        const buildingHeight = THREE.MathUtils.randFloat(height * minHeight, height * maxHeight);
        const base = this._screenPosition(x + buildingWidth / 2, ground - buildingHeight / 2, depth);
        const sizeX = buildingWidth * scale;
        const sizeY = buildingHeight * scale;
        const building = new THREE.Mesh(this.shared.box, color);
        building.position.copy(base);
        building.scale.set(sizeX, sizeY, depth === -7 ? 0.55 : 0.8);
        group.add(building);

        for (let wx = x + 7; wx < x + buildingWidth - 5; wx += 13) {
          for (let wy = ground - buildingHeight + 10; wy < ground - 7; wy += 16) {
            if (Math.random() > 0.72) {
              const window = this._screenPosition(wx, wy, depth + 0.04);
              windowPositions.push(window.x, window.y, window.z);
            }
          }
        }
        x += buildingWidth + THREE.MathUtils.randFloat(3, 10);
      }

      const windowGeometry = new THREE.BufferGeometry();
      windowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(windowPositions, 3));
      group.add(new THREE.Points(
        windowGeometry,
        new THREE.PointsMaterial({
          color: "#ffc46e",
          size: 0.075,
          transparent: true,
          opacity: windowAlpha,
          sizeAttenuation: true,
          toneMapped: false,
        })
      ));
      this.backgroundGroup.add(group);
    };
    buildCityLayer(-7, this.shared.materials.distantBox, 0.05, 0.15, 30, 70, 0.42);
    buildCityLayer(-4, this.shared.materials.box, 0.07, 0.23, 38, 92, 0.85);

    const groundPosition = this._screenPosition(width / 2, (ground + height) / 2, -1.5);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width * scale * 1.2, (height - ground) * scale * 1.2),
      this.shared.materials.ground
    );
    floor.position.copy(groundPosition);
    this.backgroundGroup.add(floor);

    const garlandPoints = [];
    const bulbPoints = [];
    const bulbColors = [];
    for (let x = 0; x <= width; x += Math.max(8, width / 100)) {
      const y = 12 + Math.sin((x / width) * Math.PI) * height * 0.07;
      const point = this._screenPosition(x, y, -1);
      garlandPoints.push(point);
    }
    this.backgroundGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(garlandPoints),
      this.shared.materials.wire
    ));
    let bulbIndex = 0;
    for (let x = 14; x < width; x += Math.max(28, width / 24), bulbIndex++) {
      const y = 12 + Math.sin((x / width) * Math.PI) * height * 0.07;
      const point = this._screenPosition(x, y, -0.8);
      bulbPoints.push(point.x, point.y, point.z);
      const color = new THREE.Color(["#ffcf74", "#ff7692", "#9ae8ff"][bulbIndex % 3]);
      bulbColors.push(color.r, color.g, color.b);
    }
    const bulbGeometry = new THREE.BufferGeometry();
    bulbGeometry.setAttribute("position", new THREE.Float32BufferAttribute(bulbPoints, 3));
    bulbGeometry.setAttribute("color", new THREE.Float32BufferAttribute(bulbColors, 3));
    this.backgroundGroup.add(new THREE.Points(
      bulbGeometry,
      new THREE.PointsMaterial({
        size: 0.16,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    ));

    const diyaPoints = [];
    for (let x = 18; x < width; x += THREE.MathUtils.randFloat(35, 52)) {
      const point = this._screenPosition(x, ground + THREE.MathUtils.randFloat(8, Math.max(10, height - ground - 6)), -0.6);
      diyaPoints.push(point.x, point.y, point.z);
    }
    const diyaGeometry = new THREE.BufferGeometry();
    diyaGeometry.setAttribute("position", new THREE.Float32BufferAttribute(diyaPoints, 3));
    this.backgroundGroup.add(new THREE.Points(
      diyaGeometry,
      new THREE.PointsMaterial({
        color: "#ffd98a",
        size: 0.12,
        transparent: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    ));
  }

  _createEmitterVisual(emitter) {
    const group = new THREE.Group();
    const { box, cylinder, ring, sparkler, flame, spinner, rocket, rod, materials } = this.shared;
    if (emitter.visualKind === "fountain") {
      const base = new THREE.Mesh(cylinder, materials.red);
      const rim = new THREE.Mesh(ring, materials.brass);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.16;
      group.add(base, rim);
    } else if (emitter.visualKind === "sparkler") {
      const stick = new THREE.Mesh(sparkler, materials.wood);
      stick.scale.y = 3.2;
      stick.rotation.z = -0.42;
      stick.position.y = -1.6;
      const tip = new THREE.Mesh(flame, materials.spark);
      tip.position.y = 1.8;
      group.add(stick, tip);
    } else if (emitter.visualKind === "spinner") {
      group.add(new THREE.Mesh(spinner, materials.red));
      for (let i = 0; i < 2; i++) {
        const arm = new THREE.Mesh(rod, materials.brass);
        arm.rotation.y = Math.PI / 2;
        arm.rotation.z = (i * Math.PI) / 2;
        group.add(arm);
      }
    } else if (emitter.visualKind === "rocket") {
      const bodyMesh = new THREE.Mesh(this.shared.cylinder, materials.red);
      bodyMesh.scale.set(0.2, 0.9, 0.2);
      const nose = new THREE.Mesh(rocket, materials.brass);
      nose.position.y = 0.25;
      group.add(bodyMesh, nose);
    } else if (emitter.visualKind === "potka") {
      const bodyMesh = new THREE.Mesh(box, materials.red);
      bodyMesh.scale.set(0.24, 0.36, 0.16);
      group.add(bodyMesh);
    }
    this.scene.add(group);
    return group;
  }

  _syncEmitters(emitters) {
    const active = new Set(emitters);
    for (const [emitter, group] of this.emitterVisuals) {
      if (!active.has(emitter)) {
        this.scene.remove(group);
        this.emitterVisuals.delete(emitter);
      }
    }
    for (const emitter of emitters) {
      if (!emitter.visualKind) continue;
      let group = this.emitterVisuals.get(emitter);
      if (!group) {
        group = this._createEmitterVisual(emitter);
        this.emitterVisuals.set(emitter, group);
      }
      if (emitter.visualKind === "sparkler") {
        group.position.copy(this._screenPosition(emitter.tx, emitter.ty + 56));
      } else if (emitter.visualKind === "rocket" && !emitter.done) {
        group.position.copy(this._screenPosition(emitter.x, emitter.y));
      } else {
        group.position.copy(this._screenPosition(emitter.x, this.ground - 7));
      }
      if (emitter.visualKind === "spinner") group.rotation.y = emitter.ang;
      if (emitter.visualKind === "potka") group.visible = !emitter.boom;
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, window.matchMedia?.("(pointer: coarse)").matches ? 1.5 : 1.75);
    this.width = rect.width;
    this.height = rect.height;
    this.ground = this.height * 0.86;
    this.scale = (2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FIELD_OF_VIEW / 2))) / this.height;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(this.width, this.height);
    this.sparkMaterial.uniforms.uViewportHeight.value = this.height * dpr;
    this.smokeMaterial.uniforms.uViewportHeight.value = this.height * dpr;
    this.bloom.setSize(this.width * dpr, this.height * dpr);
    this._buildBackground();
    this._syncEmitters([]);
    return true;
  }

  clearSparks() {
    this.sparkGeometry.setDrawRange(0, 0);
    this.trailGeometry.setDrawRange(0, 0);
    this.smokeGeometry.setDrawRange(0, 0);
    this.renderer.clear();
  }

  frame(_dt, emitters) {
    const live = this.ps.live;
    const sparkCount = Math.min(live.length, MAX_SPARKS);
    let trailIndex = 0;
    for (let i = 0; i < sparkCount; i++) {
      const particle = live[i];
      const offset = i * 3;
      const depth = particle.z * this.scale;
      const x = (particle.x - this.width / 2) * this.scale;
      const y = (this.height / 2 - particle.y) * this.scale;
      this.sparkPositions[offset] = x;
      this.sparkPositions[offset + 1] = y;
      this.sparkPositions[offset + 2] = depth;

      const age = 1 - particle.life / particle.max;
      const color = [
        particle.c1[0] + (particle.c2[0] - particle.c1[0]) * age,
        particle.c1[1] + (particle.c2[1] - particle.c1[1]) * age,
        particle.c1[2] + (particle.c2[2] - particle.c1[2]) * age,
      ];
      const alpha = Math.min(1, particle.life / particle.max / particle.fade) ** 2 * particle.bright;
      const flicker = particle.flicker ? 1 - particle.flicker * Math.random() : 1;
      colorToLinear(color, this.sparkColors, offset, 1.1 + (1 - age) * 0.6);
      this.sparkAlphas[i] = alpha * flicker;
      this.sparkSizes[i] = particle.size * this.scale * 1.8;

      const tailX = particle.x - particle.vx * particle.tail;
      const tailY = particle.y - particle.vy * particle.tail;
      const tailZ = particle.z - particle.vz * particle.tail;
      const trailOffset = trailIndex * 6;
      this.trailPositions[trailOffset] = (tailX - this.width / 2) * this.scale;
      this.trailPositions[trailOffset + 1] = (this.height / 2 - tailY) * this.scale;
      this.trailPositions[trailOffset + 2] = tailZ * this.scale;
      this.trailPositions[trailOffset + 3] = x;
      this.trailPositions[trailOffset + 4] = y;
      this.trailPositions[trailOffset + 5] = depth;
      const colorOffset = trailIndex * 8;
      const trailAlpha = alpha * flicker * 0.72;
      for (let endpoint = 0; endpoint < 2; endpoint++) {
        const endpointOffset = colorOffset + endpoint * 4;
        colorToLinear(color, this.trailColors, endpointOffset, 1.05);
        this.trailColors[endpointOffset + 3] = trailAlpha;
      }
      trailIndex++;
    }
    setDynamic(this.sparkGeometry.attributes.position);
    setDynamic(this.sparkGeometry.attributes.aColor);
    setDynamic(this.sparkGeometry.attributes.aAlpha);
    setDynamic(this.sparkGeometry.attributes.aSize);
    this.sparkGeometry.setDrawRange(0, sparkCount);
    setDynamic(this.trailGeometry.attributes.position);
    setDynamic(this.trailGeometry.attributes.aColor);
    this.trailGeometry.setDrawRange(0, trailIndex * 2);

    const smokeCount = Math.min(this.ps.smoke.length, MAX_SMOKE);
    for (let i = 0; i < smokeCount; i++) {
      const smoke = this.ps.smoke[i];
      const offset = i * 3;
      const point = this._screenPosition(smoke.x, smoke.y, (smoke.z ?? 0) * this.scale);
      const life = Math.max(0, 1 - smoke.age / smoke.life);
      const radius = smoke.r0 * (1 + smoke.age * smoke.grow) * this.scale;
      this.smokePositions[offset] = point.x;
      this.smokePositions[offset + 1] = point.y;
      this.smokePositions[offset + 2] = point.z;
      this.smokeSizes[i] = radius * 2;
      this.smokeAlphas[i] = smoke.a * Math.min(1, smoke.age / 0.4) * life ** 1.4;
    }
    setDynamic(this.smokeGeometry.attributes.position);
    setDynamic(this.smokeGeometry.attributes.aSize);
    setDynamic(this.smokeGeometry.attributes.aAlpha);
    this.smokeGeometry.setDrawRange(0, smokeCount);

    for (let i = 0; i < this.lights.length; i++) {
      const source = this.ps.lights[i];
      const light = this.lights[i];
      if (!source) {
        light.intensity = 0;
        continue;
      }
      light.position.copy(this._screenPosition(source.x, source.y, 0.1));
      light.color.setRGB(source.c[0] / 255, source.c[1] / 255, source.c[2] / 255);
      light.intensity = source.i * (source.life / source.max) * 0.7;
      light.distance = Math.max(2, source.radius * this.scale);
    }

    this._syncEmitters(emitters);
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
    this.renderer.dispose();
    this.sparkGeometry.dispose();
    this.sparkMaterial.dispose();
    this.trailGeometry.dispose();
    this.trailMaterial.dispose();
    this.smokeGeometry.dispose();
    this.smokeMaterial.dispose();
    this._clearGroup(this.backgroundGroup);
    this.backgroundGroup.clear();
    for (const group of this.emitterVisuals.values()) this.scene.remove(group);
    this.emitterVisuals.clear();
    for (const light of this.lights) {
      this.scene.remove(light);
    }
    for (const material of Object.values(this.shared.materials)) material.dispose();
    this.shared.box.dispose();
    this.shared.cylinder.dispose();
    this.shared.ring.dispose();
    this.shared.sparkler.dispose();
    this.shared.flame.dispose();
    this.shared.spinner.dispose();
    this.shared.rocket.dispose();
    this.shared.rod.dispose();
    this.shared.bulb.dispose();
  }
}
