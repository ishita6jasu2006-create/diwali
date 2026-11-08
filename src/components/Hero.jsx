
import "./Hero.css";
import DiwaliCountdown from "./DiwaliCountdown";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="home-hero">
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

      </div>
      <div className="hero-sparkles">
        <span>✦</span>
        <span>✧</span>
        <span>✳</span>
        <span>✦</span>
        <span>✧</span>
        <span>✳</span>
      </div>

      <div className="home-hero__content">
        <span className="home-hero__eyebrow">
          ✦ THE FESTIVAL OF LIGHTS ✦
        </span>

        <h1>
          Happy <span>Diwali</span>
        </h1>

        <div className="home-hero__subtitle">
          F E S T I V A L &nbsp; O F &nbsp; L I G H T S
        </div>

        <p>
          Celebrate the beauty of Diwali with lights, colours
          and happiness. Create memories and spread joy.
        </p>

        <div className="home-hero__actions">
          <Link to="/greetings" className="hero-primary-btn">
            Create Your Greeting ✨
          </Link>

          <Link to="/diya" className="hero-secondary-btn">
            Light Diya 🪔
          </Link>

          <Link to="/lantern" className="hero-secondary-btn">
            Sky Lanterns 🏮
          </Link>

          <Link to="/eco" className="hero-secondary-btn">
            Animal Safety 🌿
          </Link>
        </div>

        <DiwaliCountdown />
      </div>
    </section>
  );
}

export default Hero;
