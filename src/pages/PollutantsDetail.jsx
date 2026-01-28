import React from "react";
import ReactECharts from "echarts-for-react";
import useWeather from "../hooks/useWeather";
import DetailShell from "../components/DetailShell";

/** Referencias típicas (µg/m³) para escalar radar y barras */
const REF = { co: 300, no2: 40, o3: 100, so2: 20 };
const META = {
  co: { name: "CO" },
  no2: { name: "NO₂" },
  o3: { name: "O₃" },
  so2: { name: "SO₂" },
};

function levelFromPct(pct) {
  if (pct < 40) return { label: "Bajo", cls: "ok" };
  if (pct < 80) return { label: "Moderado", cls: "warn" };
  return { label: "Alto", cls: "bad" };
}

export default function PollutantsDetail() {
  const wx = useWeather();

  // Lecturas (fallback en 0 para evitar NaN)
  const co = Number(wx?.co ?? 0);
  const no2 = Number(wx?.no2 ?? 0);
  const o3 = Number(wx?.o3 ?? 0);
  const so2 = Number(wx?.so2 ?? 0);

  const aqi = Math.round(wx?.usAqi ?? 0);
  const aqiLabel =
    wx?.aqiLabel ?? (aqi <= 50 ? "BUENA" : aqi <= 100 ? "MODERADA" : "MALA");
  const dom = String(wx?.mainPollutant ?? "CO").toUpperCase();

  /** Tabla base para pintar UI */
  const rows = [
    { key: "co", v: co },
    { key: "no2", v: no2 },
    { key: "o3", v: o3 },
    { key: "so2", v: so2 },
  ].map(({ key, v }) => {
    const ref = REF[key] || 1;
    const pct = Math.min(200, (v / ref) * 100); // cap 200% para no romper escala
    return {
      key,
      name: META[key].name,
      v,
      ref,
      pct,
      lev: levelFromPct(pct),
    };
  });

  /** Radar 0–100% (= nivel de referencia) */
  const radarOpt = {
    backgroundColor: "transparent",
    radar: {
      indicator: rows.map((r) => ({ name: r.name, max: 100 })),
      axisName: { color: "var(--muted)" },
      splitLine: { lineStyle: { color: "rgba(0,0,0,.12)" } },
      splitArea: {
        areaStyle: { color: ["rgba(14,165,233,.05)", "transparent"] },
      },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: rows.map((r) => Math.min(100, r.pct)),
            areaStyle: { color: "rgba(14,165,233,.18)" },
            lineStyle: { color: "var(--chart-line)" },
          },
        ],
        symbolSize: 0,
      },
    ],
    animation: true,
  };

  return (
    <DetailShell isNight={!!wx?.isNight}>
      <main className="container detail-page" style={{ maxWidth: 1100 }}>
        {/* Chips compactos (se adaptan en móvil) */}
        <div className="detail-meta">
          <span className="chip">AQI {aqi}</span>
          <span
            className={`chip ${aqi <= 50 ? "ok" : aqi <= 100 ? "warn" : "bad"}`}
          >
            {aqiLabel}
          </span>
          <span className="chip">{dom}</span>
        </div>

        <h1 className="detail-title">Contaminantes principales</h1>

        <section className="detail-grid two">
          {/* Radar */}
          <article className="detail-card detail-equal">
            <h3>Radar vs referencia</h3>
            <ReactECharts
              option={radarOpt}
              style={{ width: "100%", height: 320 }}
              opts={{ renderer: "svg" }}
            />
            <p className="muted">
              Referencia: valores típicos de 24h (µg/m³). <strong>100%</strong>{" "}
              ≈ nivel de referencia.
            </p>
          </article>

          {/* Resumen dinámico por contaminante */}
          <article className="detail-card detail-equal">
            <h3>Resumen dinámico</h3>

            <div className="detail-meta" style={{ marginBottom: 6 }}>
              <span className="chip">AQI {aqi}</span>
              <span
                className={`chip ${
                  aqi <= 50 ? "ok" : aqi <= 100 ? "warn" : "bad"
                }`}
              >
                {aqiLabel}
              </span>
              <span className="chip">{dom}</span>
            </div>

            {rows.map(({ key, name, v, pct, lev }) => {
              const barPct = Math.max(0, Math.min(100, pct));
              return (
                <div
                  key={key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    margin: "10px 0",
                  }}
                >
                  {/* Etiqueta */}
                  <div style={{ width: 56, fontWeight: 800 }}>{name}</div>

                  {/* Barra accesible */}
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(barPct)}
                    aria-label={`Nivel de ${name}`}
                    style={{
                      position: "relative",
                      height: 12,
                      background:
                        "linear-gradient(90deg,#22c55e 0%,#f59e0b 50%,#ef4444 100%)",
                      borderRadius: 999,
                      opacity: 0.9,
                    }}
                  >
                    {/* Relleno translucido hasta el % */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${barPct}%`,
                        background: "rgba(255,255,255,.28)",
                        borderRadius: 999,
                      }}
                    />
                    {/* Marcador */}
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: `calc(${barPct}% - 4px)`,
                        top: -5,
                        width: 0,
                        height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderBottom: "9px solid var(--ink)",
                      }}
                    />
                  </div>

                  {/* Valor + nivel */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>
                      {Math.round(v)}{" "}
                      <small className="muted">µg/m³</small>
                    </div>
                    <span
                      className={`badge ${lev.cls}`}
                      style={{ padding: "2px 8px" }}
                    >
                      {lev.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </article>
        </section>

        <section className="banner" style={{ marginTop: 16 }}>
          <h3>¿Cómo leer esto rápido?</h3>
          <ul style={{ margin: 0 }}>
            <li>
              <strong>Verde</strong> = suele ser seguro para la mayoría.
            </li>
            <li>
              <strong>Amarillo</strong> = si eres sensible (asma, niños, mayores),
              reduce esfuerzo al aire libre.
            </li>
            <li>
              <strong>Rojo</strong> = evita ejercicio intenso; prefiere interiores
              ventilados.
            </li>
          </ul>

          <details style={{ marginTop: 6 }}>
            <summary className="muted">¿Qué es “µg/m³”?</summary>
            <p className="muted">
              Microgramos de contaminante por metro cúbico de aire.
            </p>
          </details>
        </section>
      </main>
    </DetailShell>
  );
}