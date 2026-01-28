import { Link } from "react-router-dom";
import "./PillNav.css";

export default function PillNav({
  logo,
  logoAlt = "Logo",
  items = [],
  activeHref = "",
  className = "",
  baseColor = "#60a5fa",
  pillColor = "#ffffff",
  hoveredPillTextColor = "#ffffff",
  pillTextColor = "#0b2239",
}) {
  const vars = {
    "--base": baseColor,
    "--pill-bg": pillColor,
    "--hover-text": hoveredPillTextColor,
    "--pill-text": pillTextColor,
  };

  return (
    <div className={`pill-nav-container ${className}`}>
      <nav className="pill-nav" style={vars} aria-label="Navegación principal">
        {logo && (
          <span className="pill-logo" aria-hidden="true">
            <img src={logo} alt={logoAlt} />
          </span>
        )}

        <div className="pill-nav-items">
          <ul className="pill-list">
            {items.map((it) => {
              const isHash = it.href?.startsWith("/#");
              const isActive =
                activeHref === it.href || (isHash && activeHref === "/");
              return (
                <li key={it.href}>
                  <Link
                    to={it.href}
                    className={`pill ${isActive ? "is-active" : ""}`}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}