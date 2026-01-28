import React from "react";
import ReactECharts from "echarts-for-react";
import useWeather from "../hooks/useWeather";

/* iconos para etiquetas comprensibles */
const META = {
  "PM2.5": { alias: "humo fino",          icon: "🔥" },
  PM10:    { alias: "polvo",               icon: "🌬️" },
  CO:      { alias: "monóxido",            icon: "🚗" },
  "NO₂":   { alias: "gases del tráfico",   icon: "🚧" },
  "O₃":    { alias: "ozono (smog)",        icon: "☀️" },
  "SO₂":   { alias: "gases industriales",  icon: "🏭" },
};

/* Colores por umbral (µg/m³) */
function sevColorBy(key, v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return "#22c55e";
  switch (key) {
    case "PM2.5": return x <= 25  ? "#22c55e" : x <= 50   ? "#f59e0b" : "#ef4444";
    case "PM10":  return x <= 50  ? "#22c55e" : x <= 100  ? "#f59e0b" : "#ef4444";
    case "CO":    return x <= 4000? "#22c55e" : x <= 10000? "#f59e0b" : "#ef4444";
    case "NO₂":   return x <= 100 ? "#22c55e" : x <= 200  ? "#f59e0b" : "#ef4444";
    case "O₃":    return x <= 100 ? "#22c55e" : x <= 180  ? "#f59e0b" : "#ef4444";
    case "SO₂":   return x <= 100 ? "#22c55e" : x <= 200  ? "#f59e0b" : "#ef4444";
    default:      return "#22c55e";
  }
}
function sevWord(key, v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return "bajo";
  switch (key) {
    case "PM2.5": return x <= 25  ? "bajo" : x <= 50   ? "medio" : "alto";
    case "PM10":  return x <= 50  ? "bajo" : x <= 100  ? "medio" : "alto";
    case "CO":    return x <= 4000? "bajo" : x <= 10000? "medio" : "alto";
    case "NO₂":   return x <= 100 ? "bajo" : x <= 200  ? "medio" : "alto";
    case "O₃":    return x <= 100 ? "bajo" : x <= 180  ? "medio" : "alto";
    case "SO₂":   return x <= 100 ? "bajo" : x <= 200  ? "medio" : "alto";
    default:      return "bajo";
  }
}

/* Eje X agradable (redondea a número) */
function niceMax(x) {
  const v = Number(x);
  if (!Number.isFinite(v) || v <= 0) return 50;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / e) * e;
}

/* Recorta texto de forma simple */
function truncateLabel(s, cap) {
  if (!s) return s;
  return s.length > cap ? s.slice(0, cap - 1) + "…" : s;
}

export default function PollutantsCard() {
  const wx = useWeather();

  // 1) Datos
  const base = [
    { key: "PM2.5", value: wx?.pm25 },
    { key: "PM10",  value: wx?.pm10 },
    { key: "CO",    value: wx?.co },
    { key: "NO₂",   value: wx?.no2 },
    { key: "O₃",    value: wx?.o3 },
    { key: "SO₂",   value: wx?.so2 },
  ];

  const rows = base
    .map(d => ({ ...d, num: Number(d.value) }))
    .filter(d => Number.isFinite(d.num) && d.num > 0)
    .map(d => {
      const val = Math.round(d.num);
      const meta = META[d.key] || { alias: "", icon: "" };
      return {
        key: d.key,
        alias: meta.alias,
        icon: meta.icon,
        val,
        color: sevColorBy(d.key, val),
        sev: sevWord(d.key, val),
        label: `${val} µg/m³`,
      };
    });

  const hasAny = rows.length > 0;
  const maxVal = niceMax(Math.max(...rows.map(r => r.val), 0));

  // 2) Responsive: móvil y desktop
  const isMobile = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(max-width:820px)").matches
    : false;

  // límite de caracteres del label para que no empuje la gráfica
  const CHAR_CAP = isMobile ? 22 : 30;

  // mapa clave  de etiqueta (emoji + clave + alias) recortada
  const labelMap = Object.fromEntries(
    rows.map(r => {
      const full = `${r.icon ? r.icon + " " : ""}${r.key}${r.alias ? " · " + r.alias : ""}`;
      return [r.key, truncateLabel(full, CHAR_CAP)];
    })
  );

  // Alto dinámico del canvas
  const chartHeight = Math.max(isMobile ? 220 : 240, (isMobile ? 42 : 46) * rows.length + 48);

  const option = hasAny ? {
    backgroundColor: "transparent",
    animation: true,

    // Reservamos espacio para labels del eje esto evita que se monten con barras
    grid: {
      left: 12,
      right: 12,
      top: isMobile ? 40 : 56,
      bottom: isMobile ? 40 : 56,
      containLabel: true
    },

    xAxis: {
      type: "value",
      min: 0,
      max: maxVal,
      name: "µg/m³",
      nameGap: 14,
      nameTextStyle: { color: "var(--muted)", fontWeight: 600 },
      axisLabel: { color: "var(--muted)", margin: 8, fontSize: isMobile ? 11 : 12 },
      splitLine: { lineStyle: { color: "rgba(0,0,0,.08)" } },
      axisLine: { show: false },
      axisTick: { show: false }
    },

    yAxis: {
      type: "category",
      data: rows.map(r => r.key),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: "var(--ink)",
        fontWeight: 700,
        lineHeight: 18,
        // devolvemos el texto recortado
        formatter: (val) => labelMap[val] ?? val
      }
    },

    series: [{
      type: "bar",
      barWidth: isMobile ? 14 : 18,
      data: rows.map((r) => ({
        value: r.val,
        itemStyle: {
          color: r.color,
          borderRadius: [6, 10, 10, 6],
          opacity: 0.95
        },
        label: {
          show: true,
          position: "right",
          distance: isMobile ? 6 : 10,
          color: "var(--ink)",
          fontWeight: 700,
          fontSize: isMobile ? 12 : 13,
          formatter: `${r.label} · ${r.sev}`
        }
      })),

      // Suaviza el layout shift al cambiar tamaño
      universalTransition: true
    }],

    // esto es opcional Tooltip rápido por si ocultas los labels en pantallas muy chicas
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params;
        const row = rows[p?.dataIndex];
        if (!row) return "";
        const title = labelMap[row.key] || row.key;
        return `<div style="font-weight:700;margin-bottom:4px">${title}</div>
                <div>${row.label} · ${row.sev}</div>`;
      }
    }
  } : null;

  return (
    <div>
      {hasAny ? (
        <ReactECharts
          option={option}
          style={{ height: chartHeight, width: "100%", maxWidth: "100%" }}
          opts={{ renderer: "svg" }}
        />
      ) : (
        <div
          style={{
            height: 220,
            display: "grid",
            placeItems: "center",
            width: "100%",
            borderRadius: 12,
            background: "linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,.4))",
            border: "1px solid var(--card-border)"
          }}
        >
          <p className="muted">Sin datos de contaminantes por ahora.</p>
        </div>
      )}

      <p className="muted" style={{ marginTop: 10 }}>
        Fuente: Open-Meteo (CAMS). Valores en µg/m³.
      </p>
    </div>
  );
}