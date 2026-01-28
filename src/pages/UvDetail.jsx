import React from "react";
import useWeather from "../hooks/useWeather";
import DetailShell from "../components/DetailShell";
import UvGauge from "../components/UvGauge";

function uvTier(u) {
  if (u < 3)  return { label: "Bajo",     cls: "ok" };
  if (u < 6)  return { label: "Moderado", cls: "warn" };
  if (u < 8)  return { label: "Alto",     cls: "warn" };
  if (u < 11) return { label: "Muy alto", cls: "bad" };
  return { label: "Extremo", cls: "bad" };
}

// Ventana orientativa para actividades
function safeWindow(u) {
  if (u < 3)  return "En general, todo el día.";
  if (u < 6)  return "Mejor antes de 10 a.m. y después de 4 p.m.";
  if (u < 8)  return "Preferible antes de 10 a.m. y después de 5 p.m.";
  return "Evita 10–16 h; busca sombra y limita la exposición.";
}

export default function UvDetail() {
  const wx = useWeather();
  const uvi = Math.round(wx?.uvi ?? 0);
  const tier = uvTier(uvi);

  return (
    <DetailShell isNight={!!wx?.isNight}>
      <main className="container" style={{ maxWidth: 1100 }}>
        {/* Chips compactos arriba */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span className="chip">UV {uvi}</span>
          <span className={`chip ${tier.cls}`}>{tier.label}</span>
        </div>

        <h1>Índice UV</h1>

        {/* Responsive: 1 columna en móvil, 2 en pantallas anchas */}
        <section
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginTop: 10
          }}
        >
          {/* Panel visual: gauge grande + resumen */}
          <article className="info-card card-center" style={{ minHeight: 360 }}>
            <h3>UV</h3>
            {/* En modo bare, define un alto al contenedor */}
            <div style={{ width: "100%", maxWidth: 460, height: 320 }}>
              <UvGauge value={uvi} bare />
            </div>
            <p className="muted" style={{ marginTop: 8, textAlign: "center" }}>
              Nivel actual: <strong>{tier.label}</strong>. {safeWindow(uvi)}
            </p>
          </article>

          {/* Reglas simples y accionables */}
          <article className="banner">
            <h3>Cómo leerlo</h3>
            <ul style={{ marginTop: 6 }}>
              <li><strong>0–2 Bajo</strong>: sin protección especial.</li>
              <li><strong>3–5 Moderado</strong>: bloqueador, gafas, gorra; sombra al mediodía.</li>
              <li><strong>6–7 Alto</strong>: reduce exposición 10–16 h; reaplica bloqueador.</li>
              <li><strong>8–10 Muy alto / 11+ Extremo</strong>: evita sol directo; protección completa.</li>
            </ul>

            <h3 style={{ marginTop: 12 }}>Checklist rápido</h3>
            <ul>
              <li>Bloqueador FPS 30+ (renuévalo cada 2 h).</li>
              <li>Gafas UV, sombrero de ala y ropa ligera de manga larga.</li>
              <li>Busca sombra especialmente hacia el mediodía.</li>
            </ul>

            <details style={{ marginTop: 6 }}>
              <summary className="muted">¿Qué es el índice UV?</summary>
              <p className="muted">
                Es una escala de 0 a 11+ que indica la intensidad de la radiación UV que llega a la
                superficie. Cuanto mayor, más rápido puede causar daño en la piel y ojos.
              </p>
            </details>
          </article>
        </section>
      </main>
    </DetailShell>
  );
}