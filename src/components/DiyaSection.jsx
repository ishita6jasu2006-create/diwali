
import { useEffect, useRef, useState } from "react";
import "./diya.css";

const diyaNumbers = [1, 2, 3, 4, 5, 6];

function DiyaLamp({ number, isLit, onRef }) {
  return (
    <button
      ref={onRef}
      type="button"
      className={`ad-lamp ${isLit ? "ad-lit" : ""}`}
      aria-label={`Diya ${number}, ${isLit ? "glowing" : "extinguished"}`}
      aria-pressed={isLit}
      tabIndex={-1}
    >
      <span className="ad-light-glow" />

      <span className="ad-flame-area">
        <span className="ad-flame">
          <span className="ad-inner-flame" />
        </span>
      </span>

      <span className="ad-wick" />

      <span className="ad-oil">
        <span />
      </span>

      <span className="ad-bowl">
        <span className="ad-rim" />
        <span className="ad-ornament">✦</span>
        <span className="ad-ornament ad-ornament-two">✦</span>
        <span className="ad-ornament ad-ornament-three">•</span>
      </span>

      <span className="ad-base" />

      <span className="ad-lamp-number">
        {String(number).padStart(2, "0")}
      </span>

      <span className="ad-lamp-status">
        {isLit ? "GLOWING" : "EXTINGUISHED"}
      </span>
    </button>
  );
}

export default function DiyaSection() {
  const [litDiyas, setLitDiyas] = useState([]);
  const [isMatchLit, setIsMatchLit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [matchPosition, setMatchPosition] = useState({ x: 0, y: 0 });
  const [windActive, setWindActive] = useState(false);
  const [message, setMessage] = useState(
    "Drag a matchstick across the striker to begin."
  );

  const diyaRefs = useRef({});
  const strikerRef = useRef(null);

  const matchLitRef = useRef(false);
  const pointerIdRef = useRef(null);
  const previousPositionRef = useRef(null);
  const burnTimerRef = useRef(null);
  const windTimerRef = useRef(null);

  const count = litDiyas.length;
  const complete = count === diyaNumbers.length;

  // Matchstick ignition and burning
  const igniteMatch = () => {
    if (matchLitRef.current) return;

    matchLitRef.current = true;
    setIsMatchLit(true);
    setMessage("Your match is lit! Bring it close to a diya.");

    burnTimerRef.current = setTimeout(() => {
      matchLitRef.current = false;
      setIsMatchLit(false);
      setMessage("Your match burned out. Strike another one!");
    }, 4500);
  };

  // Check whether the match head crosses the striker
  const checkStrikerCollision = (x, y) => {
    if (matchLitRef.current || !strikerRef.current) return;

    const rect = strikerRef.current.getBoundingClientRect();
    const headX = x;
    const headY = y;

    const inside =
      headX >= rect.left &&
      headX <= rect.right &&
      headY >= rect.top &&
      headY <= rect.bottom;

    const previous = previousPositionRef.current;

    if (inside && previous) {
      const distance = Math.abs(x - previous.x);

      // Require actual dragging across the striker
      if (distance > 2) {
        igniteMatch();
      }
    }

    previousPositionRef.current = { x, y };
  };

  // Light a diya when the burning match is released over it
  const lightDiyaAtPosition = (x, y) => {
    if (!matchLitRef.current) return false;

    for (const number of diyaNumbers) {
      const diya = diyaRefs.current[number];
      if (!diya) continue;

      const rect = diya.getBoundingClientRect();

      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        setLitDiyas((current) =>
          current.includes(number)
            ? current
            : [...current, number]
        );

        setMessage(`Diya ${number} is glowing. Beautiful! 🪔`);
        return true;
      }
    }

    return false;
  };

  // Start dragging a fresh matchstick
  const handleMatchStart = (event) => {
    if (isDragging) return;

    event.preventDefault();

    clearTimeout(burnTimerRef.current);

    matchLitRef.current = false;
    setIsMatchLit(false);

    const rect = event.currentTarget.getBoundingClientRect();

    setMatchPosition({
      x: rect.left,
      y: rect.top,
    });

    previousPositionRef.current = {
      x: rect.left,
      y: rect.top + rect.height / 2,
    };

    pointerIdRef.current = event.pointerId;
    setIsDragging(true);
  };

  // Track the matchstick while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event) => {
      if (event.pointerId !== pointerIdRef.current) return;

      event.preventDefault();

      const x = event.clientX - 20;
      const y = event.clientY - 8;

      setMatchPosition({ x, y });
      checkStrikerCollision(x, y);
    };

    const handlePointerUp = (event) => {
      if (event.pointerId !== pointerIdRef.current) return;

      if (matchLitRef.current) {
        const success = lightDiyaAtPosition(
          event.clientX,
          event.clientY
        );

        if (!success) {
          setMessage("Bring the burning match closer to a diya.");
        }
      } else {
        setMessage("Strike the match against the box first.");
      }

      clearTimeout(burnTimerRef.current);
      matchLitRef.current = false;
      setIsMatchLit(false);

      previousPositionRef.current = null;
      pointerIdRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging]);

  // Occasional wind gusts
  useEffect(() => {
    const windInterval = setInterval(() => {
      if (Math.random() > 0.55) return;

      setWindActive(true);

      // Occasionally extinguish one randomly selected diya
      if (Math.random() < 0.4) {
        setLitDiyas((current) => {
          if (current.length === 0) return current;

          const randomIndex = Math.floor(
            Math.random() * current.length
          );

          const extinguished = current[randomIndex];

          setMessage(
            `A gust of wind extinguished diya ${extinguished}. Relight it!`
          );

          return current.filter((_, i) => i !== randomIndex);
        });
      }

      clearTimeout(windTimerRef.current);

      windTimerRef.current = setTimeout(() => {
        setWindActive(false);
      }, 2200);
    }, 15000);

    return () => {
      clearInterval(windInterval);
      clearTimeout(windTimerRef.current);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(burnTimerRef.current);
      clearTimeout(windTimerRef.current);
    };
  }, []);

  const extinguishAll = () => {
    setLitDiyas([]);
    setMessage("All diyas are extinguished. Start a new ceremony.");
  };

  return (
    <main className={`ad-page ${windActive ? "ad-windy" : ""}`}>
      <div className="ad-background-glow" />
      <div className="ad-grain" />

      <header className="ad-header">
        <span className="ad-brand">
          <span>✦</span> AURORA DIWALI
        </span>
        <span className="ad-header-right">
          THE FESTIVAL OF LIGHTS
        </span>
      </header>

      <section className="ad-intro">
        <p className="ad-eyebrow">
          <span /> A SACRED MOMENT <span />
        </p>

        <h1>
          Let There Be <em>Light.</em>
        </h1>

        <p className="ad-description">
          Every flame begins with a spark.
          Light your diyas and let warmth, hope and happiness
          illuminate your Diwali.
        </p>
      </section>

      <section className="ad-temple">
        <div className="ad-temple-decoration">
          <span>✧</span>
          <span>✦</span>
          <span>✧</span>
        </div>

        <div className="ad-arch">
          <div className="ad-arch-border">
            <div className="ad-arch-content">
              <div className="ad-temple-title">
                <span>✦</span>
                <p>THE LIGHTING CEREMONY</p>
                <span>✦</span>
              </div>

              <div className="ad-lamp-grid">
                {diyaNumbers.map((number) => (
                  <DiyaLamp
                    key={number}
                    number={number}
                    isLit={litDiyas.includes(number)}
                    onRef={(node) => {
                      diyaRefs.current[number] = node;
                    }}
                  />
                ))}
              </div>

              <p className="ad-temple-blessing">
                शुभ दीपावली · SHUBH DEEPAVALI
              </p>
            </div>
          </div>
        </div>

        <div className="ad-platform">
          <span>✦</span>
          <div />
          <span>✧</span>
          <div />
          <span>✦</span>
        </div>
      </section>

      {/* Matchbox and matchstick */}
      <section className="ad-match-station">
        <p className="ad-console-label">YOUR LIGHTING TOOLS</p>

        <div className="ad-match-area">
          <div className="ad-matchbox">
            <div className="ad-matchbox-cover">
              <span>✦</span>
              <strong>AURORA</strong>
              <small>DIWALI MATCHES</small>
              <span>🪔</span>
            </div>

            <div
              className="ad-matchbox-striker"
              ref={strikerRef}
            >
              <span>STRIKE HERE</span>
            </div>
          </div>

          {!isDragging && (
            <button
              type="button"
              className="ad-matchstick"
              onPointerDown={handleMatchStart}
              aria-label="Pick up a matchstick and drag it across the striker"
            >
              <span className="ad-match-head" />
              <span className="ad-match-wood" />
            </button>
          )}

          {isDragging && (
            <div
              className={`ad-matchstick ad-matchstick-floating ${
                isMatchLit ? "ad-match-burning" : ""
              }`}
              style={{
                left: matchPosition.x,
                top: matchPosition.y,
              }}
            >
              {isMatchLit && <span className="ad-match-flame" />}
              <span className="ad-match-head" />
              <span className="ad-match-wood" />
            </div>
          )}
        </div>

        <p className="ad-match-instruction">
          {isDragging
            ? isMatchLit
              ? "🔥 Bring the burning match to a diya!"
              : "Drag the match head across the striker strip."
            : "Pick up a matchstick and drag it across the striker."}
        </p>
      </section>

      {/* Progress */}
      <section className="ad-console">
        <div className="ad-console-info">
          <div>
            <p className="ad-console-label">YOUR LIGHTS</p>
            <h2>
              {String(count).padStart(2, "0")}
              <span> / 06</span>
            </h2>
          </div>

          <div className="ad-console-status">
            <span className={count > 0 ? "ad-online" : ""} />
            {complete
              ? "All flames are glowing"
              : count > 0
                ? "Your light is spreading"
                : "Waiting for your first spark"}
          </div>
        </div>

        <div className="ad-progress">
          <div style={{ width: `${(count / 6) * 100}%` }} />
        </div>

        <p className="ad-match-message" aria-live="polite">
          {message}
        </p>

        <div className="ad-actions">
          <button
            className="ad-secondary-btn"
            onClick={extinguishAll}
            disabled={count === 0}
          >
            Extinguish All
          </button>
        </div>
      </section>

      {complete ? (
        <section className="ad-completion">
          <div className="ad-completion-icon">✧ 🪔 ✧</div>
          <h2>A Thousand Lights, One Beautiful Wish.</h2>
          <p>
            May your home be filled with peace, your heart with joy,
            and your life with endless possibilities.
          </p>
          <button onClick={extinguishAll}>
            Begin Another Celebration
          </button>
        </section>
      ) : (
        <p className="ad-bottom-note">
          ✦ EVERY FLAME BEGINS WITH A SINGLE SPARK ✦
        </p>
      )}

      <footer className="ad-footer">
        <span>MADE WITH LIGHT & LOVE</span>
        <span>✧ AURORA DIWALI ✧</span>
      </footer>
    </main>
  );
}
