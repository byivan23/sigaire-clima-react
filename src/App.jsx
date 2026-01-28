import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";

const Home             = lazy(() => import("./pages/Home.jsx"));
const About            = lazy(() => import("./pages/About.jsx"));
const WindDetail       = lazy(() => import("./pages/WindDetail.jsx"));
const AirDetail        = lazy(() => import("./pages/AirDetail.jsx"));
const UvDetail         = lazy(() => import("./pages/UvDetail.jsx"));
const PressureDetail   = lazy(() => import("./pages/PressureDetail.jsx"));
const PrecipDetail     = lazy(() => import("./pages/PrecipDetail.jsx"));
const PollutantsDetail = lazy(() => import("./pages/PollutantsDetail.jsx"));
const HumidityDetail   = lazy(() => import("./pages/HumidityDetail.jsx"));

export default function App(){
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Navega a secciones del Home (siempre funciona)
  const gotoHash = (h) => {
    setOpen(false);
    if (!h) { navigate("/"); return; }
    navigate({ pathname: "/", hash: h });
  };

  // Scroll con offset por navbar sticky
  useEffect(() => {
    if (pathname !== "/") return;
    const doScroll = () => {
      if (!hash) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      const HEADER = 56; // alto aproximado de la barra vino
      const y = el.getBoundingClientRect().top + window.scrollY - HEADER - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    };
    doScroll();
    requestAnimationFrame(doScroll);
  }, [pathname, hash]);

  return (
    <>
      {/*  NUEVA FRANJA SUPERIOR (solo se estiliza para desktop en CSS)  */}
      <div className="govbar">
        <div className="govbar__container">
        <button
          type="button"
          className="govbar__brand"
          onClick={() => gotoHash("")}
          aria-label="Ir a inicio"
        >
          <img src="/img/robotlogo.png" alt="SIGAIRE" className="govbar__logo" />
        </button>
        </div>
      </div>

      {/* LOGO FUERA DEL NAVBAR (el existente, sin cambios) */}
    

      {/* NAVBAR VINO (sticky) */}
      <header className="wine-navbar" role="navigation" aria-label="Principal">
        <div className="nav-container">
          {/* Logo visible en móvil (oculto en desktop por CSS) */}
          <img
            className="nav-logo"
            src="/img/robotlogo.png"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/logorobot.png'; }}
            alt="SIGAIRE"
            width="256"
            height="96"
            decoding="async"
          />
          {/* Título SIGAIRE (visible en desktop, oculto en móvil por CSS) */}
          <div className="nav-title">SIGAIRE</div>
          
          {/* Desktop centrado */}
          <nav className="nav-desktop">
            <button onClick={() => gotoHash("")}            className="nav-btn">Inicio</button>
            <button onClick={() => gotoHash("#alerts")}     className="nav-btn">Alertas</button>
            <button onClick={() => gotoHash("#rain")}       className="nav-btn">Radar</button>
            <button onClick={() => gotoHash("#pollutants")} className="nav-btn">Contaminantes</button>
            <button onClick={() => { setOpen(false); navigate("/about"); }} className="nav-btn">
              Acerca de nosotros
            </button>
          </nav>

          {/* Hamburguesa (móvil) */}
          <button
            className="hamb"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Panel móvil */}
        <div className={`mobile-panel ${open ? "open" : ""}`}>
          <button onClick={() => gotoHash("")}            className="mobile-item">Inicio</button>
          <button onClick={() => gotoHash("#alerts")}     className="mobile-item">Alertas</button>
          <button onClick={() => gotoHash("#rain")}       className="mobile-item">Radar</button>
          <button onClick={() => gotoHash("#pollutants")} className="mobile-item">Contaminantes</button>
          <button onClick={() => { setOpen(false); navigate("/about"); }} className="mobile-item">
            Acerca de nosotros
          </button>
        </div>
      </header>

      <Suspense fallback={
        <main className="container"><div className="info-card">Cargando…</div></main>
      }>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/about"       element={<About />} />
          <Route path="/wind"        element={<WindDetail />} />
          <Route path="/air"         element={<AirDetail />} />
          <Route path="/uv"          element={<UvDetail />} />
          <Route path="/humidity"    element={<HumidityDetail />} />
          <Route path="/pollutants"  element={<PollutantsDetail />} />
          <Route path="/precip"      element={<PrecipDetail />} />
          <Route path="/pressure"    element={<PressureDetail />} />
        </Routes>
      </Suspense>
    </>
  );
}