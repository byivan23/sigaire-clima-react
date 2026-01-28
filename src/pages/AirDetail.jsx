import React from "react";
import useWeather from "../hooks/useWeather";
import DetailShell from "../components/DetailShell";

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));

function prettyPollutant(key = "") {
  const k = String(key).toUpperCase().replace(/\s/g, "");
  if (k.includes("PM2")) return "PM2.5";
  if (k.includes("PM10")) return "PM10";
  if (k.includes("O3")) return "O₃ (ozono)";
  if (k.includes("NO2")) return "NO₂";
  if (k.includes("SO2")) return "SO₂";
  if (k.includes("CO")) return "CO (monóxido)";
  return key || "PM2.5";
}

function tierForAqi(aqi) {
  if (aqi <= 50)  return { key: "ok",   label: "BUENA" };
  if (aqi <= 100) return { key: "warn", label: "MODERADA" };
  if (aqi <= 150) return { key: "warn", label: "SENSIBLES" };
  if (aqi <= 200) return { key: "bad",  label: "MALA" };
  return { key: "bad", label: "MUY MALA" };
}

export default function AirDetail() {
  const wx = useWeather();

  // Valores básicos
  const aqi = clamp(wx?.usAqi ?? 0, 0, 500);
  const tier = tierForAqi(aqi);
  const aqiLabel = wx?.aqiLabel || tier.label;

  // Principal contaminante (si viene del hook) y su valor
  const pollutant = prettyPollutant(wx?.mainPollutant);
  const pollutantVal = wx?.mainPollutantValue ?? "—";

  // Semáforo visual (barra 0–300 y leyenda)
  const MAX = 300;
  const markerPct = (clamp(aqi, 0, MAX) / MAX) * 100;
  const bandLegend = [
    { txt: "0–50 Buena",        cls: "ok"   },
    { txt: "51–100 Moderada",   cls: "warn" },
    { txt: "101–150 Sensibles", cls: "warn" },
    { txt: "151–200 Mala",      cls: "bad"  },
    { txt: ">200 Muy mala",     cls: "bad"  },
  ];

  return (
    <DetailShell maxWidth={1100}>
      {/* Chips compactos arriba */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span className="chip">AQI {Math.round(aqi)}</span>
        <span className={`chip ${tier.key}`}>{aqiLabel}</span>
        <span className="chip">{pollutant}</span>
      </div>

      <h1>Calidad del aire</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        {aqi <= 50
          ? "Aire limpio. Actividades al aire libre sin problema."
          : aqi <= 100
          ? "Aceptable. Si eres sensible, reduce esfuerzo prolongado."
          : aqi <= 150
          ? "Personas sensibles: eviten ejercicio intenso al aire libre."
          : aqi <= 200
          ? "Mala. Preferir interiores ventilados y reducir esfuerzo."
          : "Muy mala. Evita ejercicio al aire libre; prioriza interiores."}
      </p>

      {/* Semáforo visual */}
      <section className="banner" style={{ marginTop: 14 }}>
        <h3>Tu AQI en la escala</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {/* barra de colores */}
          <div
            style={{
              position: "relative",
              height: 16,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, #16a34a 0 16.6%, #84cc16 16.6% 33.3%, #facc15 33.3% 50%, #f97316 50% 66.6%, #ef4444 66.6% 100%)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
            }}
          >
            {/* marcador */}
            <div
              style={{
                position: "absolute",
                left: `${markerPct}%`,
                top: -6,
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "8px solid var(--ink)",
              }}
              aria-hidden="true"
            />
          </div>

          {/* Leyenda corta */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {bandLegend.map((b, i) => (
              <span key={i} className={`chip ${b.cls}`} style={{ fontSize: ".85rem" }}>
                {b.txt}
              </span>
            ))}
          </div>

          <small className="muted">
            AQI combina varios contaminantes y los traduce a una escala 0–500 (más alto = peor).
          </small>
        </div>
      </section>

      {/* Qué domina hoy */}
      <section className="banner" style={{ marginTop: 14 }}>
        <h3>¿Qué domina hoy?</h3>
        <p>
          <strong>{pollutant}</strong> — {pollutantVal} µg/m³
        </p>

        <details style={{ marginTop: 6 }}>
          <summary className="muted">¿Qué significa “µg/m³” y “PM2.5”?</summary>
          <p className="muted">
            µg/m³ = microgramos por metro cúbico de aire. PM2.5 = partículas muy finas (≤2.5 µm) que
            pueden entrar profundo en los pulmones.
          </p>
        </details>

        <p className="muted" style={{ marginTop: 6 }}>Fuente: Open-Meteo (CAMS).</p>
      </section>

      {/* Recomendaciones rápidas */}
      <section className="banner" style={{ marginTop: 14 }}>
        <h3>Qué conviene hacer</h3>
        <ul style={{ margin: 0 }}>
          {aqi <= 100 ? (
            <>
              <li>Ventila tu casa.</li>
              <li>Ejercicio al aire libre sin restricciones.</li>
            </>
          ) : aqi <= 150 ? (
            <>
              <li>Personas sensibles: reduzcan esfuerzo intenso.</li>
              <li>Prefiere horarios con menos tráfico y parques.</li>
            </>
          ) : (
            <>
              <li>Reduce salidas y esfuerzo intenso al aire libre.</li>
              <li>Personas sensibles: consideren mascarilla o interiores.</li>
            </>
          )}
        </ul>
      </section>
    </DetailShell>
  );
}