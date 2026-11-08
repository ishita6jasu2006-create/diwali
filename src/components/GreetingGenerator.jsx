
import { useState } from "react";

function GreetingGenerator() {
  const [sender,   setSender]   = useState("");
  const [receiver, setReceiver] = useState("");
  const [message,  setMessage]  = useState(
    "May your life shine brighter than a thousand diyas. Wishing you happiness, prosperity and endless joy!"
  );
  const [theme, setTheme]  = useState("gold");
  const [downloading, setDownloading] = useState(false);

  const themes = [
    { id: "gold",   name: "Royal Gold",    accent: "#E8BD73", bg1: "#2a1a04", bg2: "#1a1030" },
    { id: "purple", name: "Mystic Purple", accent: "#C4A0FF", bg1: "#1a0a2e", bg2: "#0e0820" },
    { id: "rose",   name: "Rose Gold",     accent: "#E9A99C", bg1: "#2a0e18", bg2: "#120a1a" },
  ];

  const currentTheme = themes.find(t => t.id === theme);

  /* ---- WhatsApp share ---- */
  const shareGreeting = () => {
    const text = `🪔 Happy Diwali ${receiver || "Dear Friend"}! 🪔\n\n${message}\n\nWith love,\n${sender || "Your Friend"}\n\n✨ Created with Aurora Diwali`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  /* ---- PNG download (Canvas API — no external library) ---- */
  const downloadCard = async () => {
    setDownloading(true);
    try {
      const W = 600, H = 820;
      const canvas = document.createElement("canvas");
      canvas.width  = W * 2; // 2× for retina
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);

      const acc  = currentTheme.accent;

      /* Background gradient */
      const bgGrad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W * 0.8);
      bgGrad.addColorStop(0, hexAlpha(acc, 0.18));
      bgGrad.addColorStop(1, "#0d1225");
      ctx.fillStyle = bgGrad;
      roundRect(ctx, 0, 0, W, H, 18);
      ctx.fill();

      /* Border */
      ctx.strokeStyle = acc;
      ctx.lineWidth   = 1.5;
      ctx.globalAlpha = 0.65;
      roundRect(ctx, 1, 1, W - 2, H - 2, 17);
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* Inner glow */
      const innerGlow = ctx.createRadialGradient(W/2, H * 0.4, 0, W/2, H * 0.4, 240);
      innerGlow.addColorStop(0, hexAlpha(acc, 0.12));
      innerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = innerGlow;
      ctx.fillRect(0, 0, W, H);

      /* ✦ ✧ ✦  top decoration */
      ctx.fillStyle = acc;
      ctx.font = "bold 20px serif";
      ctx.textAlign = "center";
      ctx.fillText("✦  ✧  ✦", W / 2, 52);

      /* Diya */
      ctx.font = "72px serif";
      ctx.textAlign = "center";
      ctx.fillText("🪔", W / 2, 160);

      /* "WITH LOVE & LIGHT" */
      ctx.font = "600 10px 'Outfit', Arial, sans-serif";
      ctx.fillStyle = acc;
      ctx.letterSpacing = "4px";
      ctx.fillText("WITH LOVE & LIGHT", W / 2, 195);
      ctx.letterSpacing = "0px";

      /* "Happy Diwali" */
      ctx.font = "italic 500 54px Georgia, serif";
      ctx.fillStyle = acc;
      ctx.fillText("Happy Diwali", W / 2, 265);

      /* Divider ✧ */
      ctx.font = "22px serif";
      ctx.fillStyle = acc;
      ctx.fillText("✧", W / 2, 300);

      /* Receiver */
      ctx.font = "italic 500 32px Georgia, serif";
      ctx.fillStyle = "#fff";
      const to = receiver.trim() || "Dear Friend";
      ctx.fillText(to.length > 28 ? to.slice(0, 28) + "…" : to, W / 2, 345);

      /* Message body */
      ctx.font = "14px 'Outfit', Arial, sans-serif";
      ctx.fillStyle = "#c8d0df";
      wrapText(ctx, message, W / 2, 390, 480, 24);

      /* Signature */
      const sigY = 650;
      ctx.font = "13px 'Outfit', Arial, sans-serif";
      ctx.fillStyle = "#7a8299";
      ctx.fillText("With love,", W / 2, sigY);

      ctx.font = "italic 500 26px Georgia, serif";
      ctx.fillStyle = acc;
      const from = sender.trim() || "Your Friend";
      ctx.fillText(from.length > 28 ? from.slice(0, 28) + "…" : from, W / 2, sigY + 36);

      /* ✦ ✧ ✦  bottom decoration */
      ctx.font = "bold 20px serif";
      ctx.fillStyle = acc;
      ctx.fillText("✦  ✧  ✦", W / 2, H - 40);

      /* Branding */
      ctx.font = "10px Arial, sans-serif";
      ctx.fillStyle = "#4a5368";
      ctx.fillText("🪔 Created with Aurora Diwali", W / 2, H - 16);

      /* Save */
      const url = canvas.toDataURL("image/png");
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `diwali-greeting-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error("Card download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="greeting-section" id="greetings">

      <div className="section-heading">
        <p className="section-label">A GIFT FROM THE HEART</p>

        <h2>
          Create Your <span>Diwali Wish</span>
        </h2>

        <p>
          Personalise your wishes and spread happiness
          with the people you love.
        </p>
      </div>

      <div className="greeting-layout">

        {/* INPUT FORM */}

        <div className="greeting-form">

          <h3>Create Your Greeting</h3>

          <label>Your Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={sender}
            onChange={e => setSender(e.target.value)}
            maxLength={35}
          />

          <label>Receiver's Name</label>
          <input
            type="text"
            placeholder="Who are you wishing?"
            value={receiver}
            onChange={e => setReceiver(e.target.value)}
            maxLength={35}
          />

          <label>Your Personal Message</label>
          <textarea
            placeholder="Write your Diwali wishes..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={250}
            rows={4}
          />

          <div className="message-count">
            {message.length}/250 characters
          </div>

          <label>Choose Your Theme</label>

          <div className="theme-options">
            {themes.map(item => (
              <button
                key={item.id}
                className={`theme-btn ${theme === item.id ? "selected" : ""}`}
                onClick={() => setTheme(item.id)}
                style={{ "--theme-color": item.accent }}
              >
                <span />
                {item.name}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="greeting-actions">
            <button className="share-btn" onClick={shareGreeting}>
              Share on WhatsApp ↗
            </button>

            <button
              className="download-btn"
              onClick={downloadCard}
              disabled={downloading}
            >
              {downloading ? "Generating…" : "⬇ Download Card"}
            </button>
          </div>

        </div>

        {/* LIVE PREVIEW */}

        <div className="greeting-preview">

          <p className="preview-label">LIVE PREVIEW</p>

          <div className={`greeting-card theme-${theme}`}>

            <div className="card-decoration top-decoration">
              ✦ ✧ ✦
            </div>

            <div className="card-diya">🪔</div>

            <p className="card-small-title">
              WITH LOVE &amp; LIGHT
            </p>

            <h2>Happy Diwali</h2>

            <div className="card-divider">✧</div>

            <h3>
              {receiver.trim() || "Dear Friend"}
            </h3>

            <p className="card-message">
              {message}
            </p>

            <div className="card-signature">
              <span className="card-sig-line">With love,</span>
              <strong>{sender.trim() || "Your Friend"}</strong>
            </div>

            <div className="card-decoration bottom-decoration">
              ✦ ✧ ✦
            </div>

          </div>

          <p className="preview-hint">
            ✨ Your greeting updates as you type
          </p>

        </div>

      </div>

    </section>
  );
}

/* ===== Canvas helpers ===== */

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line  = "";
  let y     = startY;

  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, y);
      line = words[i];
      y   += lineHeight;
      if (y > 630) { // prevent overflow
        ctx.fillText(line + "…", cx, y);
        return;
      }
    } else {
      line = test;
    }
  }
  ctx.fillText(line, cx, y);
}

export default GreetingGenerator;
