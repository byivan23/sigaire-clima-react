import React from "react";
import ReactECharts from "echarts-for-react";

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));

export default function UvGauge({ value = 0, label = "—", bare = false, height = 220 }) {
  const v = clamp(value, 0, 11);

  const option = {
    backgroundColor: "transparent",
    series: [{
      type: "gauge",
      min: 0, max: 11,
      radius: "95%",
      startAngle: 200, endAngle: -20,
      splitNumber: 11,
      axisLine: { lineStyle: { width: 16, color: [
        [3/11, "#16a34a"], [6/11, "#facc15"], [8/11, "#f97316"], [1, "#ef4444"]
      ]}},
      axisTick: { show: false },
      splitLine: { length: 8, lineStyle: { color: "rgba(0,0,0,.25)" } },
      axisLabel: { show: false },
      pointer: { length: "70%", width: 6, itemStyle: { color: "var(--ink)" } },
      anchor: { show: true, size: 8, itemStyle: { color:"#fff", borderWidth:2, borderColor:"rgba(0,0,0,.25)" }},
      detail: {
        valueAnimation: true, fontSize: 20, color: "var(--ink)", offsetCenter: [0, "55%"],
        formatter: (val) => `${Math.round(val)}\nUV`,
      },
      data: [{ value: v }],
    }],
  };

  const gauge = <ReactECharts option={option} style={{ width:"100%", height:"100%" }} opts={{ renderer:"svg" }} />;

  if (bare) return gauge;

  return (
    <article className="info-card" aria-label="Índice UV">
      <h3>ÍNDICE UV</h3>
      <div style={{ width: "100%", height }}>{gauge}</div>
      <p className="gauge-msg" style={{ marginTop: 6 }}>{label}</p>
    </article>
  );
}