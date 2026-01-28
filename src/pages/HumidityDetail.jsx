import React from "react";
import ReactECharts from "echarts-for-react";
import useWeather from "../hooks/useWeather";

// Fallbacks inmutables (no cambian identidad)
const EMPTY_ARR = Object.freeze([]);

// Índice del punto de la hora más cercana (labels "HH:MM")
function nearestIndex(labels = EMPTY_ARR) {
  if (!Array.isArray(labels) || labels.length === 0) return 0;
  const now = new Date();
  const target = now.getHours() * 60 + now.getMinutes();
  let best = 0;
  let bestDiff = Infinity;
  labels.forEach((h, i) => {
    const [HH = "0", mm = "0"] = String(h).split(":");
    const mins = (Number(HH) || 0) * 60 + (Number(mm) || 0);
    const diff = Math.abs(mins - target);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
}

export default function HumidityDetail() {
  const wx = useWeather();

  // Series desde el hook (con fallback seguro)
  const series = wx?.humiditySeries || {};
  const times  = Array.isArray(series.times) ? series.times : EMPTY_ARR;
  const rhArr  = Array.isArray(series.rh)    ? series.rh    : EMPTY_ARR;
  const dewArr = Array.isArray(series.dew)   ? series.dew   : EMPTY_ARR;

  // Punto actual (hora más cercana)
  const nowIdx = nearestIndex(times);
  const nowRH  = Number(rhArr?.[nowIdx] ?? NaN);

  // Estadísticos simples del día
  const vals   = rhArr.map(Number).filter(Number.isFinite);
  const avg    = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const dewVals = dewArr.map(Number).filter(Number.isFinite);
  const dewMin  = dewVals.length ? Math.min(...dewVals) : null;
  const dewMax  = dewVals.length ? Math.max(...dewVals) : null;

  // Tendencia y ~1 hora atrás
  const backIdx = Math.max(0, nowIdx - 1);
  const before  = Number.isFinite(nowRH) && Number.isFinite(rhArr?.[backIdx])
    ? Number(rhArr[backIdx])
    : null;
  const delta = before == null ? 0 : nowRH - before;
  const trend = before == null ? "estable" : delta > 1 ? "subiendo" : delta < -1 ? "bajando" : "estable";

  // Rango Y (0–100%)
  const yMin = 0;
  const yMax = 100;

  // Opciones ECharts (sin memo) ya que lo quitamos
  const option = {
    grid: { left: 44, right: 20, top: 28, bottom: 28 },
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      formatter: (items) => {
        const [rh, dew] = items;
        const h    = rh?.axisValueLabel || "";
        const rhV  = rh ? `${Math.round(rh.data)}%` : "—";
        const dewV = dew && Number.isFinite(dew.data) ? `${Math.round(dew.data)}°` : "—";
        return `<strong>${h}</strong><br/>Humedad: ${rhV}<br/>Punto de rocío: ${dewV}`;
      }
    },
    xAxis: {
      type: "category",
      data: times,
      boundaryGap: false,
      axisLabel: { color: "var(--muted)" },
      axisLine: { lineStyle: { color: "rgba(0,0,0,.2)" } },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: "value",
        min: yMin,
        max: yMax,
        axisLabel: { formatter: (v) => `${v}%`, color: "var(--muted)" },
        splitLine: { lineStyle: { color: "rgba(0,0,0,.08)" } }
      },
      {
        type: "value",
        position: "right",
        axisLabel: { formatter: (v) => `${Math.round(v)}°`, color: "var(--muted)" },
        splitLine: { show: false }
      }
    ],
    axisPointer: { type: "line" },
    series: [
      {
        name: "Humedad",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: rhArr,
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 3 }
      },
      {
        name: "Punto de rocío",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbol: "none",
        data: dewArr
      },
      {
        // marca el ahora
        type: "effectScatter",
        coordinateSystem: "cartesian2d",
        data: (Number.isFinite(nowRH) && times[nowIdx]) ? [[times[nowIdx], nowRH]] : [],
        symbolSize: 10,
        z: 5
      }
    ]
  };

  // Resumen estilo iOS (sin memo)
  const summary = (() => {
    if (!times.length) return "—";
    const p = avg == null ? "—" : `${Math.round(avg)}%`;
    const dewTxt =
      (dewMin == null || dewMax == null)
        ? ""
        : ` El punto de rocío se encuentra entre ${Math.round(dewMin)}° y ${Math.round(dewMax)}°.`;
    const mov = trend === "subiendo" ? "y subiendo" : trend === "bajando" ? "y bajando" : "estable";
    return `La humedad es de ${Math.round(nowRH || 0)}% ${mov}. Hoy la humedad promedio será de ${p}.${dewTxt}`;
  })();

  return (
    <main className="container">
      <h2 style={{ marginTop: 8 }}>Humedad</h2>

      <section className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <article className="info-card">
          <ReactECharts option={option} style={{ height: 340, width: "100%" }} opts={{ renderer: "svg" }} />
        </article>

        <article className="info-card">
          <h3>Resumen diario</h3>
          <p>{summary}</p>

          <h3 style={{ marginTop: 12 }}>Información sobre la humedad relativa</h3>
          <p style={{ textAlign: "justify" }}>
            La humedad relativa es la cantidad de vapor de agua en el aire en comparación con la que podría retener a esa temperatura.
            Valores cercanos a 100% indican posibilidad de rocío o niebla.
          </p>

          <h3 style={{ marginTop: 12 }}>Información sobre el punto de rocío</h3>
          <p style={{ textAlign: "justify" }}>
            El punto de rocío es la temperatura a la que el aire debe enfriarse para que el vapor de agua se condense.
            Cuanto mayor sea, más húmedo se siente el ambiente. Si coincide con la temperatura real, la humedad es ~100% y puede presentarse niebla.
          </p>
        </article>
      </section>
    </main>
  );
}