import { Link } from "react-router-dom";
import WindDial from "./WindDial";

// esto convierte grados a punto cardinal
const degToCardinal = (d = 0) => {
  const dirs = [
    "N","NNE","NE","ENE","E","ESE","SE","SSE",
    "S","SSO","SO","OSO","O","ONO","NO","NNO"
  ];
  return dirs[Math.round((d % 360) / 22.5) % 16];
};

export default function WindCard({ speed = 0, gust = null, dir = 0, loading = false }) {
  const cardinal = degToCardinal(dir);

  return (
    <article className="info-card wind-card">
      {/* Título forzado en mayusculos y sin subrayado */}
      <h3
        style={{
          textTransform: "uppercase",
          letterSpacing: ".04em",
          textDecoration: "none",
          margin: 0,
        }}
      >
        VIENTO
      </h3>

      <WindDial
        speed={loading ? 0 : speed}
        gust={loading ? null : gust}
        dir={loading ? 0 : dir}
      />

      <p className="muted" style={{ marginTop: 8 }}>
        Dirección: {loading ? "—" : `${Math.round(dir)}° ${cardinal}`} · Ráfagas:{" "}
        {loading || gust == null ? "—" : `${Math.round(gust)} km/h`}
      </p>

      {/* Enlace sin subrayado, en mayusculas e inherente de color */}
      <Link
        to="/wind"
        className="view-link"
        style={{
          marginTop: 10,
          textTransform: "uppercase",
          letterSpacing: ".04em",
          textDecoration: "none",
          color: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 600,
        }}
        aria-label="Ver detalle del viento"
      >
        VER DETALLE →
      </Link>
    </article>
  );
}