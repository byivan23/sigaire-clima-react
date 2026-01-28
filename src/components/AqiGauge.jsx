import React from "react";
import ReactECharts from "echarts-for-react";

function aqiAutoLabel(v = 0) {
  const a = Number(v) || 0;
  if (a <=  50) return "BUENA";
  if (a <= 100) return "MODERADO";
  if (a <= 150) return "SENSIBLES";
  if (a <= 200) return "DAÑINA";
  if (a <= 300) return "MUY DAÑINA";
  return "PELIGROSA";
}

/**
 * Comentarios que cree, props:
 *  - value   (number)  AQI (0–500)
 *  - label   (string?) etiqueta opcional; si no, se infiere
 *  - bare    (bool)    si true, solo el canvas (para tarjetas circulares)
 *  - height  (number)  alto del lienzo en px (por defecto 220)
 */
export default function AqiGauge({
  value = 0,
  label,
  bare = false,
  height = 220,
}) {
  const v = Math.max(0, Math.min(300, Number(value) || 0));
  const shown = label ?? aqiAutoLabel(v);

  const option = {
    backgroundColor: "transparent",
    series: [
      {
        type: "gauge",
        center: ["50%", "60%"],
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 300,
        splitNumber: 6,
        radius: "95%",
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 14,
            color: [
              [50/300,  "#16a34a"], // 0–50 Buena
              [100/300, "#84cc16"], // 51–100 Moderado
              [150/300, "#facc15"], // 101–150 Sensibles
              [200/300, "#fb923c"], // 151–200 Daño
              [300/300, "#ef4444"], // 201–300 Muy daña/peligro
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: {
          show: true,
          width: 8,
          length: "55%",
          itemStyle: { color: "#4f46e5" },
        },
        detail: { show: false },
        data: [{ value: v }],
      },
      // valor grande y etiqueta
      {
        type: "gauge",
        center: ["50%", "60%"],
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 300,
        radius: "95%",
        pointer: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          offsetCenter: [0, 0],
          formatter: () => `${Math.round(v)}\nAQI`,
          rich: {
            a: { fontSize: 30, fontWeight: 900, color: "#0b2239", lineHeight: 34 },
            b: { fontSize: 16, fontWeight: 800, color: "#0b2239" },
          },
        },
        title: { show: false },
        data: [{ value: v }],
      },
    ],
  };

  if (bare) {
    return <ReactECharts option={option} style={{ width: "100%", height: "100%" }} />;
  }

  return (
    <article className="info-card mod-circle aqi-card">
      <h3>Calidad del aire</h3>
      <ReactECharts option={option} style={{ width: "100%", height }} />
      <p className="card-legend">{shown}</p>
    </article>
  );
}