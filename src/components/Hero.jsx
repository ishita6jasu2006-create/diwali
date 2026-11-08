
import "./Hero.css";
import DiwaliCountdown from "./DiwaliCountdown";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-decorations">
        <div className="marigold-string string-one">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="marigold-string string-two">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="marigold-string string-three">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="marigold-string string-four">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      <div className="hero-lantern lantern-one">
        <div className="lantern-string" />
        <div className="lantern-top" />
        <div className="lantern-body pink">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="lantern-fringe" />
      </div>

      <div className="hero-lantern lantern-two">
        <div className="lantern-string" />
        <div className="lantern-top" />
        <div className="lantern-body violet">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="lantern-fringe" />
      </div>

      <div className="hero-lantern lantern-three">
        <div className="lantern-string" />
        <div className="lantern-top" />
        <div className="lantern-body pink">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="lantern-fringe" />
      </div>
                {/* Traditional Diwali Fanus */}
      <div className="hero-fanus">
        <div className="akash-fanus fanus-one">
          <div className="fanus-thread" />
          <div className="fanus-cap" />
          <div className="fanus-shape">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="fanus-bottom" />
          <div className="fanus-tassel" />
        </div>

        <div className="akash-fanus fanus-two">
          <div className="fanus-thread" />
          <div className="fanus-cap" />
          <div className="fanus-shape">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="fanus-bottom" />
          <div className="fanus-tassel" />
        </div>

        <div className="akash-fanus fanus-three">
          <div className="fanus-thread" />
          <div className="fanus-cap" />
          <div className="fanus-shape">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="fanus-bottom" />
          <div className="fanus-tassel" />
        </div>
        <div className="akash-fanus fanus-four">
  <div className="fanus-thread" />
  <div className="fanus-cap" />
  <div className="fanus-shape">
    <span />
    <span />
    <span />
    <span />
  </div>
  <div className="fanus-bottom" />
  <div className="fanus-tassel" />
</div>
      </div>
      <div className="hero-sparkles">
        <span>✦</span>
        <span>✧</span>
        <span>✳</span>
        <span>✦</span>
        <span>✧</span>
        <span>✳</span>
      </div>

      <div className="hero-content">
        <span className="hero-eyebrow">
          ✦ THE FESTIVAL OF LIGHTS ✦
        </span>

        <h1>
          Happy <span>Diwali</span>
        </h1>

        <div className="hero-subtitle">
          F E S T I V A L &nbsp; O F &nbsp; L I G H T S
        </div>

        <p>
          Celebrate the beauty of Diwali with lights, colours
          and happiness. Create memories and spread joy.
        </p>

        <div className="hero-buttons">
          <a href="/greetings" className="hero-primary-btn">
            Create Your Greeting ✨
          </a>

          <a href="/diya" className="hero-secondary-btn">
            Light Diya 🪔
          </a>

          <a href="/lantern" className="hero-secondary-btn">
            Sky Lanterns 🏮
          </a>

          <a href="/eco" className="hero-secondary-btn">
            Animal Safety 🌿
          </a>
        </div>

        <DiwaliCountdown />
      </div>
    </section>
  );
}

export default Hero;
