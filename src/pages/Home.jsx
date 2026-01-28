import React, { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useWeather from "../hooks/useWeather";
import BackgroundVideo from "../components/BackgroundVideo";
import prefetchRoute from "../utils/prefetchRoute";

import TemperatureLine from "../components/TemperatureLine.jsx";
// import AqiGauge       from "../components/AqiGauge.jsx"; // ← ya no se usa
import UvGauge        from "../components/UvGauge.jsx";
import WindDial       from "../components/WindDial.jsx";
import PressureGauge  from "../components/PressureGauge.jsx";
import PrecipCard     from "../components/PrecipCard.jsx";
import PollutantsCard from "../components/PollutantsCard.jsx";
import Modal          from "../components/Modal.jsx";

import { enablePush } from "../lib/push";

/* ESTO TAMBIEN IMPORTA:
   Helpers de notificaciones (solo agregar, sin romper lo existente)
   - Si ya usas enablePush desde ../lib/push, estos helpers no interfieren.
   - Dejar API_BASE vacío: en dev con `vercel dev` / `vite`, todas las rutas son /api/* */
/* eslint-disable no-unused-vars */
const API_BASE = '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
/* eslint-enable no-unused-vars */

/* Esto lo dejo como comentario pr si lo ocupamos luego:

  Ejemplo de cómo sería enablePush aquí mismo (NO se usa porque ya importas enablePush).
  Lo dejamos de referencia por si en el futuro deseas mover la lógica a este archivo:

  async function enablePushLocal() {
    const reg = await navigator.serviceWorker.register('/sw.js');

    const existing = await reg.pushManager.getSubscription();
    const appKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);

    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appKey,
    });

    let meta = {};
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      meta = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch {
      meta = { city: undefined };
    }

    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...sub.toJSON(), meta }),
    });

    reg.showNotification('SIGAIRE', {
      body: '✅ Notificaciones activadas',
      tag: 'welcome',
    });
  }
*/

/* Consejos de humedad */
const HUMID_TIPS = {
  veryLow: ["Aire muy seco: hidrata piel y labios.","Usa humidificador o una toalla húmeda en la habitación."],
  low:     ["Seco: bebe agua y ventila brevemente.","Evita calefacción directa; reseca el aire."],
  comfort: ["Confortable: ventila 10 minutos para renovar el aire.","Buen momento para secar ropa al aire libre."],
  high:    ["Humedad alta: ventila cocina y baño después de usarlos.","Evita dejar ropa húmeda en interiores."],
  veryHigh:["Muy alta: riesgo de moho; personas con asma pueden resentirse.","Usa extractor/deshumidificador y ventila con frecuencia."]
};
function getHumidityAdvice(h = 0){
  const H = Math.round(Number(h) || 0);
  const dayIdx = new Date().getDay();
  if (H < 30)  return { label: "Seco",         tip: HUMID_TIPS.veryLow[dayIdx % 2],  cls: "warn" };
  if (H < 40)  return { label: "Seco",         tip: HUMID_TIPS.low[dayIdx % 2],      cls: "warn" };
  if (H <= 60) return { label: "Confort",      tip: HUMID_TIPS.comfort[dayIdx % 2],  cls: "ok"   };
  if (H <= 80) return { label: "Humedad alta", tip: HUMID_TIPS.high[dayIdx % 2],     cls: "warn" };
  return         { label: "Muy alta",          tip: HUMID_TIPS.veryHigh[dayIdx % 2], cls: "bad"  };
}

/* Toma N horas a partir de “ahora” */
function takeHoursFromNow(list = [], n = 10) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const nowH = new Date().getHours();
  let start = list.findIndex((p) => {
    const t = p?.ts ?? p?.time ?? p?.date;
    if (!t) return false;
    const d = new Date(t);
    return !Number.isNaN(d) && d.getHours() === nowH;
  });
  if (start === -1) start = Math.min(nowH, list.length - 1);
  const out = [];
  for (let i = 0; i < Math.min(n, list.length); i++) out.push(list[(start + i) % list.length]);
  return out;
}

/* Lluvia: mensajes cortos */
function rainCopy(pct = 0){
  const v = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  if (v < 10)  return "Puedes dejar el paraguas en casa. 🚫🌂";
  if (v < 30)  return "Sal con confianza, pero mira el cielo. 🚶‍♂️🌤️";
  if (v < 50)  return "Un paraguas compacto puede ayudarte. 🌂🧳";
  if (v < 70)  return "Planea trayectos bajo techo cuando puedas. 🧭🏢";
  if (v < 90)  return "Impermeable y paraguas a la mano. 🧥🌂";
  return          "Evita la intemperie y prepárate para charcos. 🌧️💦";
}

/* Utilidades viento (para modal) */
function degToCompass(d=0){
  const dirs=["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(((Number(d)||0)%360)/45)%8];
}
function windSensation(kmh=0){
  const v = Number(kmh)||0;
  if (v < 12) return "Muy ligera";
  if (v < 20) return "Ligera";
  if (v < 35) return "Moderada";
  if (v < 55) return "Fuerte";
  return "Muy fuerte";
}
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));

/* AQI → consejos rápidos */
function aqiAdvice(aqi=0){
  const v = Number(aqi)||0;
  if (v <= 50)  return ["Ventila tu casa.","Ejercicio al aire libre sin restricciones."];
  if (v <= 100) return ["Personas sensibles: reduzcan ejercicio intenso.","Ventila y evita humo en interiores."];
  if (v <= 150) return ["Limita ejercicio prolongado al aire libre.","Personas sensibles: permanezcan en interiores."];
  if (v <= 200) return ["Reduce tiempo al aire libre.","Considera mascarilla si es necesario."];
  return ["Evita la intemperie.","Permanece en interiores con buena ventilación/filtrado."];
}

/* Polutante dominante (simple) */
function dominantPollutant(wx){
  const rows = [
    { key:"PM2.5", val: wx?.pm25 },
    { key:"PM10",  val: wx?.pm10 },
    { key:"CO",    val: wx?.co },
    { key:"NO₂",   val: wx?.no2 },
    { key:"O₃",    val: wx?.o3 },
    { key:"SO₂",   val: wx?.so2 },
  ].filter(r => Number.isFinite(Number(r.val)));
  if (!rows.length) return { key:"PM2.5", val:null };
  rows.sort((a,b)=>Number(b.val)-Number(a.val));
  return { key: rows[0].key, val: Math.round(Number(rows[0].val)) };
}

/* === NUEVOS helpers sencillos para la tarjeta de Humedad === */
function shouldVent(h=0){ return (Number(h)||0) >= 61; } // 61%+ sugiere ventilar

function moldLevel(h=0){
  const v = Number(h)||0;
  if (v < 65) return { txt: "Riesgo de moho: bajo",  cls: "ok"   };
  if (v < 80) return { txt: "Riesgo de moho: medio", cls: "warn" };
  return            { txt: "Riesgo de moho: alto",  cls: "bad"  };
}

function laundryHint(h=0){
  const v = Number(h)||0;
  if (v < 45) return "🧺 Secado rápido";
  if (v < 65) return "🧺 Secado normal";
  return "🧺 Secado lento";
}

export default function Home(){
  const wx = useWeather();
  const loading = !!wx.loading;

  // Ocultar CTA si ya hay suscripción push
  const [pushEnabled, setPushEnabled] = useState(false);

  useLayoutEffect(() => {
    let mounted = true;
    async function checkPush() {
      try {
        if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg && await reg.pushManager.getSubscription();
        const ok = (Notification.permission === 'granted') && !!sub;
        if (mounted) setPushEnabled(!!ok);
      } catch { /* noop */ }
    }
    checkPush();

    // Escucha opcional: se dispara desde push.ts al habilitar
    const onEnabled = () => setPushEnabled(true);
    window.addEventListener('sigaire:push-enabled', onEnabled);
    return () => {
      mounted = false;
      window.removeEventListener('sigaire:push-enabled', onEnabled);
    };
  }, []);

  // Presión: Baja / Normal / Alta
  const refHpa = 1013;
  let presText = "—", presCls = "";
  if (!loading){
    const pres = Math.round(wx?.pressure ?? 0);
    if (pres <= refHpa - 8)      { presText = "Baja";  presCls = "warn"; }
    else if (pres >= refHpa + 12){ presText = "Alta";  presCls = "warn"; }
    else                         { presText = "Normal";presCls = "ok"; }
  }

  const humidAdv = loading ? null : getHumidityAdvice(wx.humidity);
  const pf = (path) => prefetchRoute(path);

  // ==== ResizeObserver para la gráfica ====
  const graphBoxRef = useRef(null);
  const [graphDims, setGraphDims] = useState({ w: 0, h: 0 });
  const [graphKey, setGraphKey]   = useState(0);

  useLayoutEffect(() => {
    const el = graphBoxRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.round(el.clientWidth || 0);
      const h = Math.round(el.clientHeight || 0);
      setGraphDims({ w, h });
      setGraphKey(w * 10000 + h);
    };
    update();
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(el);
    const onWinResize = () => requestAnimationFrame(update);
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
    };
  }, []);

  const graphPoints = !loading && Array.isArray(wx.forecast)
    ? takeHoursFromNow(wx.forecast, 10)
    : [];

  // ===== Modales =====
  const [uvOpen,   setUvOpen]   = useState(false);
  const [windOpen, setWindOpen] = useState(false);
  const [aqiOpen,  setAqiOpen]  = useState(false);   // ← modal AQI

  // Datos para modal de viento
  const speed = Math.round(wx?.windSpeed ?? 0);
  const gust  = Math.round(wx?.gust ?? speed);
  const dir   = degToCompass(wx?.windDir ?? 0);
  const feel  = windSensation(speed);
  const MAX_BAR = 80;
  const pctSpeed = (clamp(speed,0,MAX_BAR)/MAX_BAR)*100;
  const pctGust  = (clamp(gust,0,MAX_BAR)/MAX_BAR)*100;

  // AQI actual y posición del marcador (0–500)
  const aqi = loading ? 0 : Math.round(wx?.usAqi ?? 0);
  const aqiPct = `${(clamp(aqi, 0, 500) / 5).toFixed(2)}%`; // /500 * 100
  const dom = dominantPollutant(wx);
  const aqiTips = aqiAdvice(aqi);

  // Señales para HUMEDAD (usadas en la tarjeta)
  const ventNow = !loading && shouldVent(wx.humidity);
  const mold    =  loading ? null : moldLevel(wx.humidity);
  const laundry =  loading ? null : laundryHint(wx.humidity);

  return (
    <>
      <BackgroundVideo isNight={!!wx.isNight} />

      <main className="container">
        {/* CTA de notificaciones por correo */}
        {!pushEnabled && (
          <section
            id="alerts"
            className="notice notice--compact"
            role="region"
            aria-label="Preferencia de notificaciones"
            style={{ scrollMarginTop: 80 }}
          >
            <div className="notice__text">
              🔔 ¿Quieres recibir notificaciones?
            </div>
            <button
              type="button"
              className="btn btn-primary notice__cta"
              onClick={async () => {
                try {
                  await enablePush();
                  setPushEnabled(true); // ocultar de inmediato
                  alert("✅ Notificaciones push activadas");
                } catch (e) {
                  alert("❌ No se pudieron activar: " + (e?.message || e));
                }
              }}
            >
              Sí, quiero recibir notificaciones
            </button>
          </section>
        )}

        {/*  CALIDAD DEL AIRE (BARRA) — primera tarjeta bajo la CTA  */}
        <section style={{ marginTop:16 }}>
          <article
            className="shape-rect electric-border"
            role="button"
            tabIndex={0}
            onClick={() => setAqiOpen(true)}
            onKeyDown={(e)=> (e.key === "Enter" || e.key === " ") && setAqiOpen(true)}
            aria-haspopup="dialog"
            aria-label="Abrir información de calidad del aire"
            style={{ padding:16, cursor:"pointer" }}
          >
            <h3 style={{ marginTop:0 }}>Calidad del aire</h3>

            {/* Barra 0–500 con segmentos */}
            <div style={{ position:"relative", marginTop:6 }}>
              {/* Marcador */}
              <div
                aria-hidden
                style={{
                  position:"absolute",
                  left: `calc(${aqiPct} - 8px)`,
                  top: -6,
                  fontSize: 16
                }}
              >▲</div>

              {/* Tramos */}
              <div
                style={{
                  display:"flex",
                  height:14,
                  borderRadius:999,
                  overflow:"hidden"
                }}
              >
                <div style={{ flex:"50 0 auto", background:"#22c55e" }} />
                <div style={{ flex:"50 0 auto", background:"#a3e635" }} />
                <div style={{ flex:"50 0 auto", background:"#facc15" }} />
                <div style={{ flex:"50 0 auto", background:"#f97316" }} />
                <div style={{ flex:"300 0 auto", background:"#ef4444" }} />
              </div>
            </div>

            {/* Leyenda por tramos */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:10 }}>
              <span className="badge ok"   style={{ background:"rgba(34,197,94,.15)", color:"#14532d"  }}>0–50 Buena</span>
              <span className="badge warn" style={{ background:"rgba(163,230,53,.2)", color:"#365314" }}>51–100 Moderada</span>
              <span className="badge warn" style={{ background:"rgba(250,204,21,.2)", color:"#713f12" }}>101–150 Sensibles</span>
              <span className="badge bad"  style={{ background:"rgba(249,115,22,.15)", color:"#7c2d12"  }}>151–200 Mala</span>
              <span className="badge bad"  style={{ background:"rgba(239,68,68,.15)",  color:"#7f1d1d"  }}>&gt;200 Muy mala</span>
            </div>

            <p className="muted" style={{ marginTop:8 }}>
              AQI combina varios contaminantes y los traduce a una escala 0–500 (más alto = peor).
            </p>
          </article>
        </section>

        {/* ZONA SUPERIOR */}
        <section
          className="grid"
          style={{
            gridTemplateColumns:"repeat(3, minmax(0,1fr))",
            gridAutoRows:"minmax(min-content,auto)",
            alignItems:"start",
            gap:16,
            marginTop:16
          }}
        >
          {/* Gráfica */}
          <article
            className="shape-rect graph-vertical"
            style={{
              gridRow:"1 / span 2",
              gridColumn:"1",
              display:"flex",
              flexDirection:"column",
              gap:8
            }}
          >
            <h3 style={{ margin:0 }}>Temp °C por hora</h3>
            <div
              ref={graphBoxRef}
              style={{
                width:"100%",
                flex:"1 1 auto",
                minHeight: "clamp(100px, 50vh, 260px)",
                height: "100%",
                overflow: "hidden"
              }}
            >
              {loading || graphPoints.length === 0 ? (
                <p className="muted">Cargando…</p>
              ) : (
                <TemperatureLine
                  key={graphKey}
                  points={graphPoints}
                  vertical
                  width={graphDims.w}
                  height={graphDims.h}
                />
              )}
            </div>
            <p className="muted" style={{ marginTop:0 }}>
              Cada punto representa la temperatura a esa hora.
            </p>
          </article>

          {/* Temperatura */}
          <article className="shape-rect compact temperature-card" style={{ gridColumn:"2" }}>
            <h3>Temperatura</h3>
            <p className="big">{loading ? "—" : Math.round(wx.temp)} °C</p>
            <p>
              Min: <strong>{loading ? "—" : Math.round(wx.tMin)}</strong> °C ·
              Máx: <strong>{loading ? "—" : Math.round(wx.tMax)}</strong> °C
            </p>
          </article>

          {/* Lluvia con mensaje dinámico */}
          <article className="shape-rect compact precip-card electric-border" style={{ gridColumn:"3" }}>
            <h3>Lluvia</h3>
            <div
              className="metric-inline"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                columnGap: 14,
                alignItems: "center",
                minHeight: 93
              }}
            >
              <div>
                <p className="big">{loading ? "—" : Math.round(wx.rainProb)}%</p>
                <span className="muted">Probabilidad hoy</span>
              </div>
              {!loading && (
                <p
                  style={{
                    margin: 0,
                    maxWidth: 280,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: "rgba(255,255,255,.95)",
                    textAlign: "left",
                    textWrap: "balance",
                    hyphens: "auto"
                  }}
                >
                  {rainCopy(wx.rainProb)}
                </p>
              )}
            </div>
          </article>

          {/* Humedad (MISMO TAMAÑO aqui mejore el contenido ) */}
          <article
            className="shape-rect compact humidity-card electric-border card-equal"
            style={{ gridColumn:"2", position:"relative" }}
          >
            <h3 style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:6 }}>
              Humedad
              {!loading && (
                <span
                  className={`badge ${ventNow ? "warn" : "ok"}`}
                  style={{ fontSize:12, padding:"4px 8px" }}
                >
                  {ventNow ? "🪟 Ventilar ahora: Sí" : "🪟 Ventilar ahora: No"}
                </span>
              )}
            </h3>

            {/* Fila principal: valor + barra de confort */}
            <div
              style={{
                display:"grid",
                gridTemplateColumns:"1fr 120px",
                alignItems:"center",
                columnGap:14,
                minHeight:86
              }}
            >
              <div>
                <p className="big" style={{ marginBottom:2 }}>
                  {loading ? "—" : Math.round(wx.humidity)}%
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span className="muted">Relativa (2 m)</span>
                  {!loading && humidAdv && (
                    <span className={`badge ${humidAdv.cls}`} style={{ fontSize:12 }}>
                      {humidAdv.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Mini barra de confort 40–60% con marcador */}
              <div>
                <div style={{ position:"relative", height:10, borderRadius:999, overflow:"hidden" }}>
                  <div style={{ display:"flex", width:"100%", height:"100%" }}>
                    <div style={{ flex:"30 0 auto", background:"rgba(255,255,255,.15)" }} />   {/* 0-30 */}
                    <div style={{ flex:"10 0 auto", background:"rgba(255,255,255,.25)" }} />   {/* 30-40 */}
                    <div style={{ flex:"20 0 auto", background:"rgba(34,197,94,.35)" }} />     {/* 40-60 */}
                    <div style={{ flex:"20 0 auto", background:"rgba(255,165,0,.25)" }} />     {/* 60-80 */}
                    <div style={{ flex:"20 0 auto", background:"rgba(239,68,68,.25)" }} />     {/* 80-100 */}
                  </div>
                  {!loading && (
                    <div
                      aria-hidden
                      style={{
                        position:"absolute",
                        left:`calc(${Math.max(0, Math.min(100, Math.round(wx.humidity)))}% - 6px)`,
                        top:-6, fontSize:12
                      }}
                    >▲</div>
                  )}
                </div>
                <div className="muted" style={{ fontSize:11, marginTop:4, textAlign:"center" }}>
                  40–60% confort
                </div>
              </div>
            </div>

            {/* Chips para completar espacios: moho + secado */}
            {!loading && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
                <span className={`badge ${mold.cls}`} style={{ fontWeight:600 }}>{mold.txt}</span>
                <span className="badge" style={{ background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.25)" }}>
                  {laundry}
                </span>
              </div>
            )}

            {/* Consejo breve existente */}
            {!loading && humidAdv && (
              <p className="muted" style={{ marginTop:8, lineHeight:1.25 }}>
                {humidAdv.tip}
              </p>
            )}
          </article>

          {/* Presión — mismo tamaño que Humedad */}
          <article
            className="shape-rect compact pressure-card electric-border card-equal"
            style={{ gridColumn: "3", display: "flex", flexDirection: "column" }}
          >
            <h3>Presión</h3>
            <div className="rect-content" style={{ flex: "1 1 auto", display: "grid", placeItems: "center" }}>
              <PressureGauge hPa={loading ? 0 : wx.pressure} height={220} bare />
            </div>
            <div className="pressure-scale"><span>Baja</span><span>Normal</span><span>Alta</span></div>
            <p className={`badge ${presCls}`} style={{ alignSelf:"center", marginTop:6 }}>{presText}</p>
          </article>
        </section>

        {/* === PRECIPITACIÓN + CONTAMINANTES === */}
        <section className="grid row-two" style={{ gap:16, marginTop:16 }}>
          <Link to="/precip" className="card-link" aria-label="Abrir mapa de precipitación" onMouseEnter={() => pf("/precip")}>
            <article id="rain" className="shape-rect electric-border" style={{ scrollMarginTop: 80, height:"100%" }}>
              <h3>Precipitación</h3>
              <PrecipCard lat={wx.lat} lon={wx.lon} />
            </article>
          </Link>

          <Link to="/pollutants" className="card-link" aria-label="Abrir detalle de contaminantes" onMouseEnter={() => pf("/pollutants")}>
            <article id="pollutants" className="shape-rect electric-border" style={{ scrollMarginTop: 80, height:"100%" }}>
              <h3>Contaminantes principales</h3>
              <PollutantsCard />
            </article>
          </Link>
        </section>

        {/*  TARJETAS CUADRADAS (VIENTO y UV) */}
        <section
          className="grid"
          style={{ gridTemplateColumns:"repeat(2, minmax(280px,1fr))", alignItems:"stretch", gap:16, marginTop:16 }}
        >
          {/* Viento — abre modal */}
          <article
            className="shape-rect electric-border card-equal"
            role="button"
            tabIndex={0}
            onClick={() => setWindOpen(true)}
            onKeyDown={(e)=> (e.key === "Enter" || e.key === " ") && setWindOpen(true)}
            aria-haspopup="dialog"
            aria-label="Abrir resumen rápido de viento"
            style={{ display:"flex", flexDirection:"column", padding:16 }}
          >
            <h3 style={{ marginTop:0 }}>Viento</h3>
            <div style={{ flex:"1 1 auto", display:"grid", placeItems:"center" }}>
              <div style={{ width:"100%", maxWidth:360, height:220 }}>
                <WindDial
                  speed={loading ? 0 : wx.windSpeed}
                  gust={loading ? null : wx.gust}
                  dir={loading ? 0 : wx.windDir}
                  compact
                />
              </div>
            </div>
            <p className="muted" style={{ textAlign:"center", marginTop:8 }}>
              {loading ? "—" : `Ráfagas: ${Math.round(wx.gust ?? 0)} km/h`}
            </p>
          </article>

          {/* UV — abre modal */}
          <article
            className="shape-rect electric-border card-equal"
            role="button"
            tabIndex={0}
            onClick={() => setUvOpen(true)}
            onKeyDown={(e)=> (e.key === "Enter" || e.key === " ") && setUvOpen(true)}
            aria-haspopup="dialog"
            aria-label="Abrir información de Índice UV"
            style={{ display:"flex", flexDirection:"column", padding:16 }}
          >
            <h3 style={{ marginTop:0 }}>Índice UV</h3>
            <div style={{ flex:"1 1 auto", display:"grid", placeItems:"center" }}>
              <div style={{ width:"100%", maxWidth:360, height:220 }}>
                <UvGauge value={loading ? 0 : Math.round(wx.uvi)} bare />
              </div>
            </div>
            <div className="muted" style={{ textAlign:"center", marginTop:8 }}>
              {loading ? "—" : wx.uvLabel}
            </div>
          </article>
        </section>

        {/* Modal Viento */}
        <Modal open={windOpen} onClose={() => setWindOpen(false)} title="Viento · Resumen rápido">
          <div>
            <p style={{ fontSize: 18, lineHeight: 1.4 }}>
              Sopla desde <strong style={{ color: "#8b0000" }}>{dir}</strong> a{" "}
              <strong style={{ color: "#8b0000" }}>{speed} km/h</strong>. Ráfagas
              hasta <strong style={{ color: "#8b0000" }}>{gust} km/h</strong>. Sensación:{" "}
              <strong style={{ color: "#8b0000" }}>{feel}</strong>.
            </p>

            <h4 style={{ margin: "10px 0 6px" }}>Velocidad vs. ráfaga</h4>
            <div style={{ position:"relative", height: 22 }}>
              <div aria-hidden style={{ position:"absolute", left: `calc(${pctGust}% - 6px)`, top:-6, fontSize: 14 }}>▲</div>
              <div style={{ width:"100%", height:10, borderRadius:6, background:"rgba(0,0,0,.1)" }}>
                <div style={{ width: `${pctSpeed}%`, height:"100%", borderRadius:6, background:"var(--accent, #3b82f6)" }} />
              </div>
            </div>
            <p className="muted" style={{ marginTop: 4 }}>Escala relativa (0–{MAX_BAR} km/h).</p>

            <h4 style={{ margin: "12px 0 6px" }}>Consejos rápidos</h4>
            <ul>
              <li><strong>Ligera/Moderada:</strong> ideal para actividades al aire libre.</li>
              <li><strong>Fuerte</strong> (&gt;30–40 km/h): precaución al conducir y con objetos sueltos.</li>
              <li><strong>Ráfagas altas:</strong> si la ráfaga supera ~30–40% la media, espera cambios bruscos.</li>
            </ul>
          </div>
        </Modal>

        {/* Modal UV */}
        <Modal open={uvOpen} onClose={() => setUvOpen(false)} title="ÍNDICE UV · Guía rápida">
          <div>
            <h4 style={{ marginTop: 6 }}>Cómo leerlo</h4>
            <ul>
              <li><strong>0–2 Bajo:</strong> sin protección especial.</li>
              <li><strong>3–5 Moderado:</strong> bloqueador, gafas, gorra; sombra al mediodía.</li>
              <li><strong>6–7 Alto:</strong> reduce exposición 10–16 h; reaplica bloqueador.</li>
              <li><strong>8–10 Muy alto / 11+ Extremo:</strong> evita sol directo; protección completa.</li>
            </ul>

            <h4 style={{ marginTop: 14 }}>Checklist rápido</h4>
            <ul>
              <li>Bloqueador FPS 30+ (renuévalo cada 2 h).</li>
              <li>Gafas UV, sombrero de ala y ropa ligera de manga larga.</li>
              <li>Busca sombra especialmente hacia el mediodía.</li>
            </ul>

            <details style={{ marginTop: 12 }}>
              <summary>¿Qué es el índice UV?</summary>
              <p style={{ marginTop: 6 }}>
                Escala internacional que mide la intensidad de radiación ultravioleta. Sirve para
                estimar el riesgo de daño en piel y ojos y escoger la protección adecuada.
              </p>
            </details>
          </div>
        </Modal>

        {/* Modal AQI */}
        <Modal open={aqiOpen} onClose={() => setAqiOpen(false)} title="Calidad del aire">
          <div>
            <h4 style={{ marginTop: 4 }}>¿Qué domina hoy?</h4>
            <p style={{ fontWeight: 700, color: "#8b0000", marginTop: 0 }}>
              {dom.key}{" "}
              <span style={{ color: "var(--ink)", fontWeight: 400 }}>
                {dom.val == null ? "—" : `${dom.val}`} µg/m³
              </span>
            </p>

            <details style={{ marginTop: 6 }}>
              <summary>¿Qué significa “µg/m³” y “PM2.5”?</summary>
              <ul style={{ marginTop: 6 }}>
                <li><strong>µg/m³</strong>: microgramos por metro cúbico (concentración en el aire).</li>
                <li><strong>PM2.5</strong>: partículas finas ≤ 2.5 µm que pueden penetrar profundamente en los pulmones.</li>
              </ul>
            </details>

            <p className="muted" style={{ marginTop: 8 }}>
              Fuente: Open-Meteo (CAMS).
            </p>

            <h4 style={{ marginTop: 14 }}>Qué conviene hacer</h4>
            <ul>
              {aqiTips.map((t,i)=><li key={i}>{t}</li>)}
            </ul>
          </div>
        </Modal>
      </main>
    </>
  );
}