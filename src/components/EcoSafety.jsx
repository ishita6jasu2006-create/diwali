
import { useState } from "react";
import "./EcoSafety.css";

const crackers = [
  {
    emoji: "🌿",
    title: "Flower Pots (Eco)",
    desc: "Made from recycled paper shells and natural charcoal with minimal heavy metals. 70% less smoke emission.",
    badge: "Low Smoke",
    badgeClass: "badge-green",
  },
  {
    emoji: "✨",
    title: "LED Sparklers",
    desc: "Reusable, battery-powered LED sparklers that mimic real sparkle effects without any chemical fumes or burns.",
    badge: "Zero Emission",
    badgeClass: "badge-blue",
  },
  {
    emoji: "🎊",
    title: "Paper Confetti Poppers",
    desc: "Biodegradable confetti in a paper tube. The POP is as satisfying as a cracker — no fire, no fumes.",
    badge: "Biodegradable",
    badgeClass: "badge-green",
  },
  {
    emoji: "🔦",
    title: "Cold-Spark Fountains",
    desc: "Special cold-spark technology (titanium powder) generates dazzling sparks at room temperature — perfectly safe indoors.",
    badge: "Fire-Safe",
    badgeClass: "badge-amber",
  },
  {
    emoji: "🎶",
    title: "Musical Light Shows",
    desc: "Sync up music-reactive LED strips instead of crackers. Create a stunning light display that your neighbours will thank you for.",
    badge: "Silent",
    badgeClass: "badge-purple",
  },
  {
    emoji: "🌸",
    title: "Natural Camphor Diyas",
    desc: "Light camphor diyas in clay oil lamps — a traditional, smoke-free way to celebrate the Festival of Lights.",
    badge: "Traditional",
    badgeClass: "badge-amber",
  },
];

const petTips = [
  {
    icon: "🏠",
    title: "Create a Safe Room",
    tip: "Set up a quiet room away from windows & doors with familiar blankets, toys and water. Keep pets there during peak firework hours.",
  },
  {
    icon: "🎵",
    title: "Calming Background Sounds",
    tip: "Play soft classical music or dedicated pet calming playlists. The steady rhythm masks sudden loud cracker sounds.",
  },
  {
    icon: "🏷️",
    title: "ID Tags & Microchips",
    tip: "Ensure your pet's ID tag and microchip info is current. Frightened pets can bolt and get lost on Diwali night.",
  },
  {
    icon: "👕",
    title: "Anxiety Wraps",
    tip: "Thundershirts or gentle swaddling wraps provide steady pressure that calms many anxious dogs and cats.",
  },
  {
    icon: "🌿",
    title: "Natural Calming Aids",
    tip: "Consult your vet about melatonin or CBD drops for pets. Lavender sachets near their bed can also reduce anxiety.",
  },
  {
    icon: "🚶",
    title: "Early Walks & Meals",
    tip: "Take pets for a long walk and feed them before dark. A tired, fed pet is calmer and less reactive to noise.",
  },
  {
    icon: "🧸",
    title: "Stay Calm Yourself",
    tip: "Animals sense your stress. Act normal, speak calmly, and do not over-console them — it can reinforce the fear.",
  },
  {
    icon: "🩺",
    title: "Consult Your Vet",
    tip: "If your pet has severe anxiety, speak to your vet ahead of Diwali for a short-term prescription sedative or pheromone treatment.",
  },
];

const stats = [
  { number: "50%", label: "Reduction in particulate matter with eco crackers" },
  { number: "30%", label: "Pets abandoned or lost during Diwali" },
  { number: "90%", label: "Calmer pets with proper noise desensitisation" },
  { number: "70%", label: "Less noise pollution from green alternatives" },
];

function EcoSafety() {
  const [activeTab, setActiveTab] = useState("pet");

  return (
    <section className="eco-section">
      {/* Decorative top sparkles */}
      <div className="eco-sparkles" aria-hidden="true">
        <span>✦</span><span>✧</span><span>✦</span>
        <span>✧</span><span>✦</span><span>✧</span>
      </div>

      {/* Heading */}
      <div className="section-heading" style={{ textAlign: "center", marginBottom: "20px" }}>
        <p className="section-label">CELEBRATE RESPONSIBLY</p>
        <h2>
          Eco Crackers &amp; <span>Pet Safety</span>
        </h2>
        <p>
          Let Diwali shine bright without harming our planet or our beloved pets.
          Discover greener celebrations and keep your furry friends safe.
        </p>
      </div>

      {/* Stats strip */}
      <div className="eco-stats">
        {stats.map((s, i) => (
          <div key={i} className="eco-stat">
            <span className="eco-stat-num">{s.number}</span>
            <span className="eco-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="eco-tabs">
        <button
          className={`eco-tab ${activeTab === "eco" ? "active" : ""}`}
          onClick={() => setActiveTab("eco")}
        >
          🌿 Eco-Friendly Crackers
        </button>
        <button
          className={`eco-tab ${activeTab === "pet" ? "active" : ""}`}
          onClick={() => setActiveTab("pet")}
        >
          🐾 Pet Safety Tips
        </button>
      </div>

      {/* Eco Crackers Panel */}
      {activeTab === "eco" && (
        <div className="eco-panel">
          <p className="eco-panel-intro">
            Switch to these safer, greener alternatives and still have a dazzling Diwali! 🎇
          </p>
          <div className="crackers-grid">
            {crackers.map((c, i) => (
              <div key={i} className="cracker-card">
                <div className="cracker-emoji">{c.emoji}</div>
                <span className={`cracker-badge ${c.badgeClass}`}>{c.badge}</span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="eco-cta-box">
            <div className="eco-cta-icon">🌍</div>
            <div>
              <h4>Pledge a Green Diwali</h4>
              <p>
                Every household that switches to eco alternatives reduces festival pollution by up to <strong style={{ color: "#E8BD73" }}>50%</strong>. Share this page with family and friends!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pet Safety Panel */}
      {activeTab === "pet" && (
        <div className="eco-panel">
          <p className="eco-panel-intro">
            Our pets can't tell us they're scared — but we can act before the crackers start. 🐶🐱
          </p>
          <div className="pet-grid">
            {petTips.map((tip, i) => (
              <div key={i} className="pet-card">
                <div className="pet-icon">{tip.icon}</div>
                <h3>{tip.title}</h3>
                <p>{tip.tip}</p>
              </div>
            ))}
          </div>

          <div className="pet-warning-box">
            <span className="pet-warning-icon">⚠️</span>
            <div>
              <h4>Important Warning</h4>
              <p>
                Never sedate your pet without veterinary guidance. Some human calming medications are <strong style={{ color: "#F4A261" }}>toxic to animals</strong>. Always consult a licensed vet for severe anxiety cases.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default EcoSafety;
