
import { useState } from "react";
import "./SkyLantern.css";

const LANTERN_COLORS = [
  { id: "gold",    name: "Golden",   body: "#ffcf3e", glow: "#ffb300", paper: "#ffe082" },
  { id: "rose",    name: "Rose",     body: "#f06292", glow: "#e91e63", paper: "#f8bbd0" },
  { id: "violet",  name: "Violet",   body: "#ab47bc", glow: "#7b1fa2", paper: "#e1bee7" },
  { id: "cyan",    name: "Teal",     body: "#26c6da", glow: "#00838f", paper: "#b2ebf2" },
  { id: "orange",  name: "Saffron",  body: "#ff7043", glow: "#bf360c", paper: "#ffccbc" },
  { id: "green",   name: "Emerald",  body: "#66bb6a", glow: "#2e7d32", paper: "#c8e6c9" },
];

// Pre-compute stable star positions (must be outside component to stay stable across renders)
const STARS = Array.from({ length: 60 }, (_, i) => ({
  key:   i,
  top:   `${(i * 1.618033 * 100) % 100}%`,
  left:  `${(i * 2.414213 * 100) % 100}%`,
  delay: `${(i * 0.067) % 4}s`,
  size:  `${1 + (i % 3) * 0.75}px`,
}));

let nextId = 1;

function SkyLantern() {
  const [wish, setWish]       = useState("");
  const [name, setName]       = useState("");
  const [color, setColor]     = useState("gold");
  const [lanterns, setLanterns] = useState([]);
  const [launched, setLaunched] = useState(false);

  const selectedColor = LANTERN_COLORS.find(c => c.id === color);

  const launch = () => {
    if (!wish.trim()) return;

    const id = nextId++;
    const left = 15 + Math.random() * 70; // % from left

    const newLantern = {
      id,
      wish: wish.trim(),
      name: name.trim() || "Anonymous",
      color: selectedColor,
      left,
      duration: 9 + Math.random() * 5,
      sway:     3 + Math.random() * 4,
      swayDir:  Math.random() > 0.5 ? 1 : -1,
    };

    setLanterns(prev => [...prev.slice(-14), newLantern]); // keep max 15
    setLaunched(true);
    setWish("");
    setName("");

    setTimeout(() => setLaunched(false), 2000);

    // Auto-remove after animation
    setTimeout(() => {
      setLanterns(prev => prev.filter(l => l.id !== id));
    }, (newLantern.duration + 2) * 1000);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      launch();
    }
  };

  return (
    <section className="lantern-section">

      {/* Background starfield */}
      <div className="lantern-stars" aria-hidden="true">
        {STARS.map(s => (
          <span key={s.key} className="star" style={{
            top:  s.top,
            left: s.left,
            "--delay": s.delay,
            "--size":  s.size,
          }} />
        ))}
      </div>

      <div className="lantern-layout">

        {/* Left: Form */}
        <div className="lantern-form-panel">
          <p className="section-label">MAKE A WISH</p>
          <h2 className="lantern-title">
            Release a <span>Sky Lantern</span>
          </h2>
          <p className="lantern-desc">
            Write your Diwali wish, choose a lantern colour, and release it into the sky. Watch it carry your hopes upward! 🌙
          </p>

          <div className="lantern-form">

            <label>Your Wish</label>
            <textarea
              placeholder="Type your Diwali wish here…"
              value={wish}
              onChange={e => setWish(e.target.value)}
              onKeyDown={handleKey}
              maxLength={120}
              rows={3}
            />
            <div className="char-count">{wish.length}/120</div>

            <label>Your Name <span className="optional">(optional)</span></label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
            />

            <label>Choose Lantern Colour</label>
            <div className="lantern-color-picker">
              {LANTERN_COLORS.map(c => (
                <button
                  key={c.id}
                  className={`color-pill ${color === c.id ? "active" : ""}`}
                  style={{ "--c-body": c.body, "--c-glow": c.glow }}
                  onClick={() => setColor(c.id)}
                  title={c.name}
                >
                  <span className="color-dot" />
                  {c.name}
                </button>
              ))}
            </div>

            {/* Preview mini lantern */}
            <div className="mini-lantern-preview">
              <LanternSVG color={selectedColor} size={70} animate={false} />
              <p>Your lantern · <strong style={{ color: selectedColor.body }}>{selectedColor.name}</strong></p>
            </div>

            <button
              className={`launch-btn ${launched ? "launched" : ""}`}
              onClick={launch}
              disabled={!wish.trim()}
            >
              {launched ? "🕊️ Wish Released!" : "🪔 Release Lantern"}
            </button>

          </div>
        </div>

        {/* Right: Sky */}
        <div className="lantern-sky">
          <div className="sky-label">✦ THE SKY ABOVE ✦</div>

          {lanterns.length === 0 && (
            <div className="sky-empty">
              <span>🌙</span>
              <p>Your lanterns will float here…<br />Release your first wish!</p>
            </div>
          )}

          {lanterns.map(l => (
            <FloatingLantern key={l.id} lantern={l} />
          ))}
        </div>

      </div>
    </section>
  );
}

/* ---- Floating Lantern (animated) ---- */

function FloatingLantern({ lantern }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="floating-lantern"
      style={{
        left: `${lantern.left}%`,
        "--dur":  `${lantern.duration}s`,
        "--sway": `${lantern.sway}px`,
        "--sway-dir": lantern.swayDir,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <LanternSVG color={lantern.color} size={56} animate />

      {hovered && (
        <div className="lantern-tooltip">
          <p className="tooltip-name">— {lantern.name}</p>
          <p className="tooltip-wish">"{lantern.wish}"</p>
        </div>
      )}
    </div>
  );
}

/* ---- Lantern SVG ---- */

function LanternSVG({ color, size = 60, animate = false }) {
  const h = size * 1.6;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 96"
      xmlns="http://www.w3.org/2000/svg"
      className={animate ? "lantern-svg lantern-flicker" : "lantern-svg"}
      style={{ filter: `drop-shadow(0 0 10px ${color.glow}88)` }}
    >
      {/* Thread */}
      <line x1="30" y1="0" x2="30" y2="10" stroke={color.body} strokeWidth="1.5" strokeLinecap="round" />

      {/* Cap */}
      <rect x="14" y="10" width="32" height="7" rx="3" fill={color.body} />

      {/* Body */}
      <ellipse cx="30" cy="52" rx="22" ry="34" fill={color.paper} opacity="0.92" />
      <ellipse cx="30" cy="52" rx="22" ry="34" fill={`url(#lg-${color.id})`} />

      {/* Vertical ribs */}
      <line x1="30" y1="18" x2="30" y2="86" stroke={color.body} strokeWidth="1" opacity="0.6" />
      <line x1="12" y1="42" x2="48" y2="62" stroke={color.body} strokeWidth="0.8" opacity="0.4" />
      <line x1="12" y1="62" x2="48" y2="42" stroke={color.body} strokeWidth="0.8" opacity="0.4" />

      {/* Bottom */}
      <ellipse cx="30" cy="85" rx="10" ry="4" fill={color.body} />

      {/* Flame glow inside */}
      <ellipse cx="30" cy="68" rx="8" ry="10" fill={color.glow} opacity="0.35" />
      <ellipse cx="30" cy="72" rx="4" ry="6"  fill="#fffde7" opacity="0.5" />

      {/* Gradient */}
      <defs>
        <radialGradient id={`lg-${color.id}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={color.body} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color.glow} stopOpacity="0.1" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default SkyLantern;
