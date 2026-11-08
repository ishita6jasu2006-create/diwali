
import "./EcoSafety.css";

const petTips = [
  {
    icon: "🏠",
    title: "Create a Safe Room",
    tip: "Set up a quiet room away from windows and doors with familiar blankets, toys and water. Keep pets there during peak firework hours.",
  },
  {
    icon: "🎵",
    title: "Calming Background Sounds",
    tip: "Play soft classical music or dedicated pet calming playlists. Steady background sounds can help mask sudden loud cracker noises.",
  },
  {
    icon: "🏷️",
    title: "ID Tags & Microchips",
    tip: "Ensure your pet's ID tag and microchip information is up to date. Frightened pets can bolt and get lost during Diwali.",
  },
  {
    icon: "👕",
    title: "Anxiety Wraps",
    tip: "Thundershirts or gentle anxiety wraps may provide comforting pressure to some anxious dogs and cats. Introduce them beforehand.",
  },
  {
    icon: "🌿",
    title: "Calming Aids",
    tip: "Consult your vet before using calming supplements, medications or essential oils. Never assume natural products are automatically safe for pets.",
  },
  {
    icon: "🚶",
    title: "Early Walks & Meals",
    tip: "Walk your pets and feed them before dark. Keep dogs on a secure leash and avoid outdoor walks during peak firework hours.",
  },
  {
    icon: "🧸",
    title: "Stay Calm Yourself",
    tip: "Remain calm, speak gently and let your pet choose whether they want comfort. Never punish them for being frightened.",
  },
  {
    icon: "🩺",
    title: "Consult Your Vet",
    tip: "If your pet experiences severe noise anxiety, consult your vet beforehand about suitable treatments and preventive measures.",
  },
];

function EcoSafety() {
  return (
    <section className="eco-section">
      {/* Decorative sparkles */}
      <div className="eco-sparkles" aria-hidden="true">
        <span>✦</span><span>✧</span><span>✦</span>
        <span>✧</span><span>✦</span><span>✧</span>
      </div>

      {/* Heading */}
      <div
        className="section-heading"
        style={{ textAlign: "center", marginBottom: "20px" }}
      >
        <p className="section-label">CELEBRATE WITH COMPASSION</p>

        <h2>
          Animal <span>Safety</span>
        </h2>

        <p>
          Diwali is a celebration of light, but loud fireworks can be
          frightening for animals. Let's make this festival safer for
          our furry friends with a little care and compassion.
        </p>
      </div>

      {/* Animal Safety Tips */}
      <div className="eco-panel">
        <p className="eco-panel-intro">
          They may not understand the celebrations, but they deserve
          to feel safe. Here's how you can protect them. 🐾
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

        {/* Safety Warning */}
        <div className="pet-warning-box">
          <span className="pet-warning-icon">⚠️</span>

          <div>
            <h4>Important Warning</h4>
            <p>
              Never sedate your pet without veterinary guidance.
              Some human medications and essential oils can be
              toxic to animals. Always consult a licensed vet
              before administering any treatment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EcoSafety;
