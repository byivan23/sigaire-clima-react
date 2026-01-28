import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

const isBrowser = typeof window !== "undefined";

export default function PrecipCard({
  lat,
  lon,
  title = true,
  clickable = false,   // si true, navega a precip al hacer click
}) {
  const containerRef = useRef(null);  // contenedor del mapa
  const mapRef = useRef(null);        // instancia Leaflet
  const markerRef = useRef(null);
  const navigate = useNavigate();

  const [shouldInit, setShouldInit] = useState(false); // IO es visible

  // requestIdleCallback estable (en ref)
  const ricRef = useRef(null);
  useEffect(() => {
    // función estable que no cambia entre renders
    ricRef.current =
      (isBrowser && window.requestIdleCallback)
        ? (cb) => window.requestIdleCallback(cb)
        : (cb) => setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 1);
  }, []);

  // Observa cuando la tarjeta entra en viewport
  useEffect(() => {
    if (!isBrowser || !containerRef.current) return;
    if (shouldInit) return; // inicializado

    const el = containerRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldInit(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" } // empieza a preparar un poco antes
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [shouldInit]);

  //Inicializa Leaflet cuando deba (visible) y el navegador esté ocioso
  useEffect(() => {
    if (!shouldInit || !isBrowser || !containerRef.current || mapRef.current) return;

    let canceled = false;
    const schedule = ricRef.current || ((cb) => setTimeout(cb, 1));

    schedule(() => {
      if (canceled) return;

      // Crea mapa
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        zoomAnimation: false,
        preferCanvas: true,
        updateWhenIdle: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      const center = [lat ?? 19.43, lon ?? -99.13];
      map.setView(center, 7);

      markerRef.current = L.circleMarker(center, {
        radius: 4,
        color: "#0ea5e9",
        weight: 2,
        fillColor: "#38bdf8",
        fillOpacity: 0.9,
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 0);
      mapRef.current = map;
    });

    return () => {
      canceled = true;
    };
  }, [shouldInit, lat, lon]);

  // Actualiza la vista cuando cambian lat/lon
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = [lat ?? 19.43, lon ?? -99.13];
    map.setView(center, map.getZoom() || 7, { animate: false });
    if (markerRef.current) markerRef.current.setLatLng(center);
  }, [lat, lon]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // esto es opcional, click (si no se envuelven en <Link>)
  const handleClick = () => {
    if (clickable) navigate("/precip");
  };
  const handleKeyDown = (e) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate("/precip");
    }
  };

  return (
    <article
      className="info-card map-card"
      {...(clickable
        ? {
            role: "button",
            tabIndex: 0,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            title: "Ver mapa de precipitación",
            "aria-label": "Abrir mapa de precipitación",
          }
        : {})}
    >
      {title && <h3>Precipitación</h3>}

      {/* Miniatura del mapa o placeholder mientras carga */}
      <div
        ref={containerRef}
        className="mini-map"
        style={{
          position: "relative",
          display: "block",
          borderRadius: 12,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(14,165,233,.10), rgba(255,255,255,.55))",
        }}
      >
        {!mapRef.current && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
              fontWeight: 600,
              fontSize: ".95rem",
              background:
                "repeating-linear-gradient(90deg, rgba(0,0,0,.04) 0 12px, rgba(0,0,0,.06) 12px 24px)",
            }}
            aria-hidden="true"
          >
            Cargando mapa…
          </div>
        )}
      </div>

      <p className="muted" style={{ marginTop: 8 }}>
        Vista rápida del radar. Toca para abrir en grande y animar la precipitación.
      </p>
    </article>
  );
}