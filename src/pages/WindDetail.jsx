import React from "react";
import useWeather from "../hooks/useWeather";
import WindDial from "../components/WindDial";
import DetailShell from "../components/DetailShell";

function degToCardinal(d = 0) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO"];
  return dirs[Math.round((d % 360) / 22.5) % 16];
}

// Descripción corta estilo Beaufort (en km/h)
function beaufortLabel(kmh = 0) {
  if (kmh <= 1)  return "Calma";
  if (kmh <= 5)  return "Muy débil";
  if (kmh <= 11) return "Ligera";
  if (kmh <= 19) return "Moderada";
  if (kmh <= 28) return "Fresca";
  if (kmh <= 38) return "Fuerte";
  return "Muy fuerte";
}

export default function WindDetail() {
  const wx = useWeather();
  const speed = Math.round(wx?.windSpeed ?? 0);
  const gust  = Math.round(wx?.gust ?? 0);
  const dir   = Math.round(wx?.windDir ?? 0);
  const card  = degToCardinal(dir);
  const beaufort = beaufortLabel(speed);

  // Escala relativa para la barrita (0–80 km/h habitual en ciudad)
  const scaleMax = 80;
  const pctSpeed = Math.min(100, (speed / scaleMax) * 100);
  const pctGust  = Math.min(100, (Math.max(speed, gust) / scaleMax) * 100);

  return (
    <DetailShell isNight={!!wx?.isNight}>
      <main className="container" style={{ maxWidth: 1100 }}>
        {/* Chips compactos arriba */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span className="chip">Viento: {speed} km/h</span>
          <span className="chip">Ráfagas: {gust} km/h</span>
          <span className="chip">{dir}° {card}</span>
          <span className="chip">{beaufort}</span>
        </div>

        <h1>Viento</h1>

        {/* Responsive: 1 columna en móvil, 2 en escritorio */}
        <section
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginTop: 10
          }}
        >
          {/* Dial principal (centrado) */}
          <article className="info-card card-center" style={{ minHeight: 360, overflow: "hidden" }}>
            <h3>Viento</h3>
            <div style={{ width: "100%", maxWidth: 460, height: 320 }}>
              <WindDial
                speed={speed}
                gust={gust}
                dir={dir}
                height={320}
                compact
              />
            </div>
            <p className="muted" style={{ marginTop: 6, textAlign: "center" }}>
              Dirección: <strong>{dir}° {card}</strong> · Ráfagas: <strong>{gust} km/h</strong>
            </p>
          </article>

          {/* Resumen entendible + barrita velocidad/ráfaga */}
          <article className="banner">
            <h3>Resumen rápido</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Sopla desde <strong>{card}</strong> a <strong>{speed} km/h</strong>.
              {gust > 0 && <> Ráfagas hasta <strong>{gust} km/h</strong>.</>}
              &nbsp;Sensación: <strong>{beaufort}</strong>.
            </p>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Velocidad vs. ráfaga</div>
              <div
                aria-label="Velocidad actual y ráfagas"
                style={{
                  position: "relative",
                  height: 14,
                  borderRadius: 999,
                  background: "rgba(14,165,233,.18)",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)"
                }}
              >
                {/* relleno velocidad */}
                <div
                  style={{
                    width: `${pctSpeed}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "var(--chart-line)"
                  }}
                />
                {/* marcador ráfaga */}
                <div
                  title="Ráfaga"
                  style={{
                    position: "absolute",
                    left: `${pctGust}%`,
                    top: -6,
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "8px solid var(--ink)"
                  }}
                />
              </div>
              <small className="muted">Escala relativa (0–{scaleMax} km/h).</small>
            </div>

            <h3 style={{ marginTop: 14 }}>Consejos rápidos</h3>
            <ul>
              <li><strong>Ligera/Moderada</strong>: ideal para actividades al aire libre.</li>
              <li><strong>Fuerte</strong> (&gt;30–40 km/h): precaución al conducir y con objetos sueltos.</li>
              <li><strong>Ráfagas altas</strong>: si la ráfaga supera ~30–40% la media, espera cambios bruscos.</li>
            </ul>
          </article>
        </section>
      </main>
    </DetailShell>
  );
}