import React from "react";
import ReactECharts from "echarts-for-react";

function degToCardinal(d = 0) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO"];
  return dirs[Math.round((d % 360) / 22.5) % 16];
}

/** embed=true = solo el dial; false = tarjeta completa */
export default function WindDial({ speed = 0, gust = null, dir = 0, embed = false, compact = undefined, height = 220 }) {
  const isEmbed = embed || compact === true;

  const option = {
    backgroundColor: "transparent",
    series: [{
      type: "gauge",
      min: 0, max: 360,
      startAngle: 90, endAngle: -270,
      radius: "90%",
      axisLine: { lineStyle: { width: 10, color: [[1, "rgba(255,255,255,.25)"]] } },
      splitNumber: 12,
      splitLine: { length: 12, lineStyle: { color: "rgba(0,0,0,.25)" } },
      axisTick:  { length: 6,  lineStyle: { color: "rgba(0,0,0,.25)" } },
      axisLabel: {
        distance: 18, color: "var(--muted)", fontSize: 12,
        formatter: v => (v===0?"N":v===90?"E":v===180?"S":v===270?"O":"")
      },
      pointer: { length: "70%", width: 6 },
      anchor: { show: true, size: 8, itemStyle: { color: "#fff", borderWidth: 2, borderColor: "rgba(0,0,0,.25)" } },
      detail: {
        valueAnimation: true, fontSize: 20, color: "var(--ink)", offsetCenter: [0, "20%"],
        formatter: () => `${Math.round(speed)}\nkm/h`
      },
      data: [{ value: dir }]
    }]
  };

  const dial = <ReactECharts option={option} style={{ width: "100%", height: "100%" }} opts={{ renderer: "svg" }} />;

  if (isEmbed) return dial;

  return (
    <article className="info-card" aria-label="Viento">
      <h3>VIENTO</h3>
      <div style={{ width: "100%", height }}>{dial}</div>
      <p className="muted" style={{ marginTop: 4 }}>
        Dirección: {Math.round(dir)}° {degToCardinal(dir)}
        {gust != null ? ` · Ráfagas: ${Math.round(gust)} km/h` : ""}
      </p>
    </article>
  );
}