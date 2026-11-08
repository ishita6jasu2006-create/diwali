import { useEffect, useRef, useState } from "react";
import launchSound from "../assets/firework-launch-travel.mp3";
import popSound from "../assets/firework-pop.mp3";
import { AudioManager } from "./fireworks/audioManager.js";
import { FireworksEngine } from "./fireworks/engine.js";
import { PATTERNS } from "./fireworks/particles.js";
import "./Fireworks.css";

const CRACKERS = [
  {
    id: "sky-shot",
    name: "Aerial Bomb / Sky Shot",
    kind: "skyshot",
    icon: "🎇",
    description: "A soaring sky shot bursts high above the rooftops in a grand colorful bloom.",
  },
  {
    id: "diwali-shell",
    name: "Aerial Shell",
    kind: "shell",
    icon: "🎆",
    description: "A high-flying display shell blooms into a huge floral, multicolor, or ring-shaped burst.",
  },
  {
    id: "charki",
    name: "Charki",
    kind: "spinner",
    icon: "🌀",
    description: "A fast-spinning ground wheel sends colorful sparks circling outward.",
  },
  {
    id: "tara-bati",
    name: "Tara Bati",
    kind: "crackle",
    icon: "🌠",
    description: "Bright crackling golden stars scatter and twinkle before fading away.",
  },
  {
    id: "anar",
    name: "Anar",
    kind: "fountain",
    icon: "🌈",
    description: "A broad, brilliant fountain fans a shower of sparks into the night.",
  },
  {
    id: "flower-pot",
    name: "Flower Pot",
    kind: "flower",
    icon: "🌼",
    description: "Two symmetrical sprays bloom into a decorative shower of color.",
  }
];

const PATTERN_LABELS = {
  chrysanthemum: "Chrysanthemum",
  peony: "Peony",
  willow: "Willow",
  pistil: "Pistil",
  ring: "Ring",
  palm: "Palm",
  crossette: "Crossette",
  crackling: "Crackling",
};

function Fireworks() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const audioRef = useRef(null);
  const [selectedId, setSelectedId] = useState(CRACKERS[0].id);
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [pattern, setPattern] = useState("auto");
  const [shellBurstCount, setShellBurstCount] = useState(10);
  const [audioError, setAudioError] = useState("");
  const [rendererError, setRendererError] = useState("");

  const selected = CRACKERS.find((cracker) => cracker.id === selectedId);
  const hasBurstPattern = selected.kind === "rocket" || selected.kind === "skyshot" || selected.kind === "shell";

  useEffect(() => {
    const audio = new AudioManager({ launch: launchSound, pop: popSound });
    let engine;
    let errorTimer;
    try {
      engine = new FireworksEngine(canvasRef.current, audio);
      audio.preload();
      audioRef.current = audio;
      sceneRef.current = engine;
      engine.start();
    } catch (error) {
      console.error("Unable to initialize the WebGL fireworks experience.", error);
      engine?.dispose();
      audio.dispose();
      errorTimer = window.setTimeout(() => {
        setRendererError("This device or browser could not start the WebGL light show. Try enabling hardware acceleration or using a WebGL-capable browser.");
      }, 0);
      return () => window.clearTimeout(errorTimer);
    }

    return () => {
      sceneRef.current = null;
      audioRef.current = null;
      engine.dispose();
      audio.dispose();
    };
  }, []);

  const unlockAudio = async () => {
    try {
      const available = await audioRef.current?.unlock();
      if (!available) {
        setAudioError("Sound is unavailable in this browser, but the light show still works.");
        return;
      }
      setAudioError("");
    } catch (error) {
      console.error("Unable to enable firecracker audio.", error);
      setAudioError("Sound is unavailable in this browser, but the light show still works.");
    }
  };

  const launchSelected = (position) => {
    const engine = sceneRef.current;
    if (!engine) return;
    if (soundOn) void unlockAudio();
    engine.launch(selected.kind, {
      ...position,
      pattern: hasBurstPattern ? pattern : undefined,
      burstCount: selected.kind === "shell" ? shellBurstCount : undefined,
    });
  };

  const launchSurprise = () => {
    const engine = sceneRef.current;
    if (!engine) return;
    const cracker = CRACKERS[Math.floor(Math.random() * CRACKERS.length)];
    setSelectedId(cracker.id);
    if (soundOn) void unlockAudio();
    engine.surprise();
  };

  const toggleSound = () => {
    const enabled = !soundOn;
    setSoundOn(enabled);
    audioRef.current?.setMuted(!enabled);
  };

  const handleStagePointerDown = (event) => {
    if (event.target !== canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    void launchSelected({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const launchLabel = selected.kind === "sparkler"
    ? "Light Fuljhari"
    : hasBurstPattern
      ? "Launch Selected"
      : "Light Selected";

  return (
    <section className="fireworks-section">
      <header className="fireworks-heading">
        <p className="fireworks-eyebrow">AURORA DIWALI · VIRTUAL CELEBRATION</p>
        <h1>
          Light Up the <span>Night</span>
        </h1>
        <p>
          Pick a favorite, make a wish, and fill the Diwali sky with color.
          All the festive sparkle, none of the smoke.
        </p>
      </header>

      <div className="fireworks-stage" onPointerDown={handleStagePointerDown}>
        <canvas
          ref={canvasRef}
          className="fireworks-canvas"
          aria-label="Interactive virtual Diwali night sky"
        />
        <div className="fireworks-stage-caption" aria-hidden="true">
          TAP THE SKY TO LIGHT YOUR SELECTION
        </div>
      </div>
      {rendererError && <p className="fireworks-sound-error" role="status">{rendererError}</p>}

      <div className="cracker-controls" aria-label="Firecracker controls">
        <div className="cracker-selected">
          <div className="cracker-selected-icon" aria-hidden="true">{selected.icon}</div>
          <div className="cracker-selected-copy">
            <span>SELECTED FIRECRACKER</span>
            <strong>{selected.name}</strong>
            <p>{selected.description}</p>
          </div>
        </div>
        <div className="cracker-control-buttons">
          <button className="cracker-launch-button" onClick={() => launchSelected()}>
            <span aria-hidden="true">✦</span> {launchLabel}
          </button>
          <button className="cracker-utility-button" onClick={launchSurprise}>
            Surprise Me
          </button>
          <button
            className="cracker-utility-button"
            onClick={() => sceneRef.current?.clear()}
          >
            Clear Sky
          </button>
          <button
            className="cracker-sound-button"
            onClick={toggleSound}
            aria-pressed={!soundOn}
            aria-label={soundOn ? "Mute sounds" : "Unmute sounds"}
          >
            {soundOn ? "♫ Sound On" : "♪ Sound Off"}
          </button>
          <label className="cracker-volume">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => {
                const nextVolume = Number(event.target.value);
                setVolume(nextVolume);
                audioRef.current?.setVolume(nextVolume);
              }}
              aria-label="Firecracker sound volume"
            />
          </label>
        </div>
      </div>

      {hasBurstPattern && (
        <div className="cracker-patterns" role="group" aria-label="Choose a burst pattern">
          <span className="cracker-patterns-label">BURST STYLE</span>
          <button
            className={`cracker-pattern ${pattern === "auto" ? "is-selected" : ""}`}
            onClick={() => setPattern("auto")}
            aria-pressed={pattern === "auto"}
          >
            Surprise
          </button>
          {PATTERNS.map((item) => (
            <button
              key={item}
              className={`cracker-pattern ${pattern === item ? "is-selected" : ""}`}
              onClick={() => setPattern(item)}
              aria-pressed={pattern === item}
            >
              {PATTERN_LABELS[item]}
            </button>
          ))}
        </div>
      )}

      {selected.kind === "shell" && (
        <div className="cracker-patterns" role="group" aria-label="Choose aerial shell chain length">
          <span className="cracker-patterns-label">CONTINUOUS BURSTS</span>
          {[1, 10, 20].map((count) => (
            <button
              key={count}
              className={`cracker-pattern ${shellBurstCount === count ? "is-selected" : ""}`}
              onClick={() => setShellBurstCount(count)}
              aria-pressed={shellBurstCount === count}
            >
              {count === 1 ? "Single" : `${count} shells`}
            </button>
          ))}
        </div>
      )}

      {audioError && <p className="fireworks-sound-error" role="status">{audioError}</p>}

      <div className="cracker-picker-heading">
        <div>
          <span>THE FESTIVE LINE-UP</span>
          <h2>Choose your sparkle</h2>
        </div>
        <p>Each one brings its own little bit of magic.</p>
      </div>

      <div className="cracker-picker" role="group" aria-label="Choose a virtual firecracker">
        {CRACKERS.map((cracker) => (
          <button
            key={cracker.id}
            className={`cracker-option ${selectedId === cracker.id ? "is-selected" : ""}`}
            onClick={() => setSelectedId(cracker.id)}
            aria-pressed={selectedId === cracker.id}
            title={cracker.description}
          >
            <span className="cracker-option-icon" aria-hidden="true">{cracker.icon}</span>
            <span className="cracker-option-name">{cracker.name}</span>
            {selectedId === cracker.id && <span className="cracker-option-check" aria-hidden="true">✦</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

export default Fireworks;
