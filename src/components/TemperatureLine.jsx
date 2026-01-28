import React from "react";
import ReactECharts from "echarts-for-react";

export default function TemperatureLine({ points = [], vertical = false }) {
  // Normaliza datos de entrada
  const times = points.map(p => String(p?.hour ?? p?.h ?? "")).filter(Boolean);
  const temps = points.map(p => Number(p?.temp ?? p?.t ?? NaN));

  const finiteTemps = temps.filter(Number.isFinite);
  const minV = finiteTemps.length ? Math.floor(Math.min(...finiteTemps) - 1) : null;
  const maxV = finiteTemps.length ? Math.ceil(Math.max(...finiteTemps) + 1) : null;
  const avgV = finiteTemps.length
    ? finiteTemps.reduce((a, b) => a + b, 0) / finiteTemps.length
    : null;

  // Más espacio abajo en vertical para colocar Promedio y números sin colisión
  const grid = vertical
    ? { left: 56, right: 16, top: 20, bottom: 74 }
    : { left: 42, right: 18, top: 30, bottom: 32 };

  // Ejes
  const xAxis = vertical
    ? {
        type: "value",
        min: minV,
        max: maxV,
        // Bajamos un poco más los números del eje X para que no choquen con el Promedio
        axisLabel: { color: "var(--muted)", formatter: v => `${v}°`, margin: 28 },
        splitLine: { lineStyle: { color: "rgba(0,0,0,.1)" } },
        axisTick: { show: false }
      }
    : {
        type: "category",
        data: times,
        boundaryGap: false,
        axisLabel: { color: "var(--muted)" },
        axisTick: { show: false },
        splitLine: { show: false }
      };

  const yAxis = vertical
    ? {
        type: "category",
        data: times,
        inverse: true,
        axisLabel: { color: "var(--muted)" },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    : {
        type: "value",
        min: minV,
        max: maxV,
        axisLabel: { color: "var(--muted)", formatter: v => `${v}°` },
        splitLine: { lineStyle: { color: "rgba(0,0,0,.1)" } }
      };

  // Opciones ECharts
  const opt = {
    backgroundColor: "transparent",
    grid,
    tooltip: {
      trigger: "axis",
      appendToBody: true,
      valueFormatter: v => `${Math.round(v)} °C`,
    },
    xAxis,
    yAxis,
    series: [
      {
        type: "line",
        data: temps,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 3, color: "var(--chart-line)" },
        areaStyle: { color: "var(--chart-area)" },

        // Min / Máx
        markPoint: finiteTemps.length
          ? {
              symbolSize: 42,
              label: {
                color: "#fff",
                fontWeight: 700,
                formatter: p => (p.name === "min" ? "Min" : "Máx"),
              },
              itemStyle: { color: "var(--chart-line)" },
              data: [
                { type: "min", name: "min" },
                { type: "max", name: "max" },
              ],
            }
          : undefined,

        // Promedio — en vertical: etiqueta abajo, no rotada, fuera del área del grid
        markLine:
          avgV == null
            ? undefined
            : vertical
            ? {
                symbol: "none",
                lineStyle: { type: "dashed", color: "rgba(0,0,0,.35)" },
                // La línea sigue dentro del grid; movemos la etiqueta al final (abajo)
                label: {
                  show: true,
                  formatter: `Promedio: ${Math.round(avgV)}°`,
                  color: "var(--muted)",
                  position: "end",          // final de la línea vertical (parte baja)
                  distance: 14,              // separada del borde del grid
                  rotate: 0,
                },
                data: [{ xAxis: avgV }],
              }
            : {
                symbol: "none",
                lineStyle: { type: "dashed", color: "rgba(0,0,0,.35)" },
                label: { formatter: `Promedio: ${Math.round(avgV)}°`, color: "var(--muted)" },
                data: [{ yAxis: avgV }],
              },
      },
    ],
  };

  // Alto adaptable por orientación
  const style = { width: "100%", height: vertical ? 420 : 240 };

  return <ReactECharts option={opt} style={style} opts={{ renderer: "svg" }} />;
}