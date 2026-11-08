
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",            label: "Home" },
  { to: "/diya",        label: "Light Diya" },
  { to: "/rangoli",     label: "Rangoli" },
  { to: "/greetings",   label: "Greetings" },
  { to: "/celebration", label: "Fireworks" },
  { to: "/eco",         label: "Safety" },
  { to: "/lantern",     label: "Lanterns" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={close}>
        🪔 AURORA<span className="gold">DIWALI</span>
      </Link>

      {/* Desktop links */}
      <div className="nav-links">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} onClick={close}>
            {label}
          </NavLink>
        ))}
      </div>

      {/* CTA */}
      <Link to="/greetings" className="nav-button nav-cta" onClick={close}>
        Send a Wish ✨
      </Link>

      {/* Hamburger (mobile) */}
      <button
        className={`hamburger ${open ? "is-open" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        <span /><span /><span />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="mobile-drawer">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={close} className="mobile-link">
              {label}
            </NavLink>
          ))}
          <Link to="/greetings" className="mobile-cta" onClick={close}>
            Send a Wish ✨
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
