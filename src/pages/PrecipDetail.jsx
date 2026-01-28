import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import useWeather from "../hooks/useWeather";
import DetailShell from "../components/DetailShell";

function mmhToLabel(v = 0) {
  const n = Number(v) || 0;
  if (n <= 0.01) return { text: "Sin lluvia", cls: "ok" };
  if (n < 2)     return { text: "Llovizna ligera", cls: "warn" };
  if (n < 6)     return { text: "Lluvia moderada", cls: "warn" };
  return               { text: "Lluvia fuerte",   cls: "bad"  };
}

export default function PrecipDetail() {
  const wx = useWeather();
  const lat = Number(wx?.lat) || 19.43;
  const lon = Number(wx?.lon) || -99.13;

  const mmh = Number(wx?.precipMm ?? wx?.precip1h ?? 0);
  const rainProb = Number(wx?.rainProb ?? 0);
  const nowLabel = mmhToLabel(mmh);

  // refs Leaflet
  const mapRef   = useRef(null);
  const layerRef = useRef(null);

  // frames RainViewer
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Crear mapa y recentrar cuando cambian lat/lon para no duplicar capas
  useEffect(() => {
    let map = mapRef.current;

    if (!map) {
      map = L.map("rv-map", { zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      L.marker([lat, lon]).addTo(map);
      mapRef.current = map;
    }

    // centrar (o crear vista inicial)
    map.setView([lat, lon], map.getZoom() || 7);
  }, [lat, lon]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      const map = mapRef.current;
      try {
        if (layerRef.current && map) {
          map.removeLayer(layerRef.current);
          layerRef.current = null;
        }
        if (map) {
          map.remove();
          mapRef.current = null;
        }
      } catch (e) {
        // Si Leaflet ya limpió internamente, solo reportamos en consola
        console.debug("Leaflet cleanup:", e);
      }
    };
  }, []);

  // Cargar frames de RainViewer
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("https://tilecache.rainviewer.com/api/maps.json");
        const data = await res.json();
        if (!abort && Array.isArray(data)) {
          setFrames(data);
          setIdx(Math.max(0, data.length - 1));
        }
      } catch (e) {
        console.warn("RainViewer API error:", e);
      }
    })();
    return () => { abort = true; };
  }, []);

  // Pintar overlay según frame
  useEffect(() => {
    const map = mapRef.current;
    if (!map || frames.length === 0) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const ts = frames[idx];
    if (!ts) return;

    const url = `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`;
    const overlay = L.tileLayer(url, { opacity: 0.7, zIndex: 10 });
    overlay.addTo(map);
    layerRef.current = overlay;
  }, [frames, idx]);

  // Animación
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % frames.length), 650);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  // Hora del frame actual
  const timeLabel = (() => {
    const ts = frames[idx];
    if (!ts) return "—";
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  })();

  return (
    <DetailShell isNight={!!wx?.isNight}>
      <main className="container detail-page" style={{ maxWidth: 1100 }}>
        <div className="detail-meta">
          <span className={`chip ${nowLabel.cls}`}>{nowLabel.text}</span>
          <span className="chip">Prob. hoy: {Math.round(rainProb)}%</span>
          <span className="chip">Último frame: {timeLabel}</span>
        </div>

        <h1 className="detail-title">Precipitación</h1>

        <section className="detail-grid two">
          <article className="detail-card radar-card detail-equal">
            <h3>Radar en vivo</h3>
            {/* Altura fluida; el CSS de .mini-map la controla */}
            <div id="rv-map" className="mini-map" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pausar animación" : "Reproducir animación"}
              >
                {playing ? "Pausar" : "Reproducir"}
              </button>

              <div style={{ flex: 1, display: "grid", gap: 4 }}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, frames.length - 1)}
                  value={idx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                  aria-label="Control de fotograma del radar"
                />
                <small className="muted">Hora del fotograma: {timeLabel}</small>
              </div>
            </div>

            <p className="muted" style={{ marginTop: 8 }}>
              Fuente del radar: RainViewer. Base map © OpenStreetMap.
            </p>
          </article>

          <article className="detail-card detail-equal detail-body">
            <div className="detail-meta" style={{ marginBottom: 6 }}>
              <span className={`chip ${nowLabel.cls}`}>{nowLabel.text}</span>
              <span className="chip">Lat/Lon: {lat.toFixed(2)}, {lon.toFixed(2)}</span>
            </div>

            <h3 style={{ marginTop: 4 }}>¿Qué estoy viendo?</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Un mapa de radar que muestra <strong>dónde</strong> y
              <strong> con qué intensidad</strong> puede llover cerca de tu ubicación.
              Usa el control para animar la evolución reciente.
            </p>

            <h3>Cómo leer el mapa</h3>
            <ul className="legend-list">
              <li><span className="legend-dot blue" />Azules: llovizna.</li>
              <li><span className="legend-dot green" />Verdes: lluvia ligera.</li>
              <li><span className="legend-dot yellow" />Amarillos/naranjas: lluvia moderada.</li>
              <li><span className="legend-dot red" />Rojos/magentas: lluvia intensa o tormenta.</li>
            </ul>

            <h3>Consejos rápidos</h3>
            <ul>
              <li>Si ves colores acercándose a tu zona, la lluvia es probable en <strong>30–90 min</strong>.</li>
              <li>Los mejores periodos para salir son cuando la animación muestra <em>disipación</em> sobre tu área.</li>
              <li>El radar puede fallar con lloviznas muy tenues; confirma con el cielo real.</li>
            </ul>
          </article>
        </section>
      </main>
    </DetailShell>
  );
}