import React from "react";

function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
const DEG = Math.PI / 180;

// arco con extremos redondeados (como AqíGauge)
function arcPath(R, a0, a1) {
  const cx = 0, cy = 0;
  const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
  const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${x0} ${y0} A ${R} ${R} 0 ${large} ${sweep} ${x1} ${y1}`;
}

export default function PressureGauge({
  hPa = 1013,
  height = 220,
}) {
  // Rango típico SLP
  const MIN = 980, REF = 1013, MAX = 1060;

  // Tamaño del SVG
  const H = Math.max(160, Math.round(height));
  const W = Math.round(H * 1.6);

  // Geometría del gauge
  const R  = Math.round(Math.min(W, H) * 0.42); // radio
  const cx = Math.round(W * 0.5);
  const cy = Math.round(H * 0.56);              // subimos/ajustamos centro
  const T  = Math.max(6, Math.round(R * 0.12)); // grosor del arco

  // Ángulos (semicírculo abierto)
  const A_START = -200 * DEG;
  const A_END   =   20 * DEG;

  // mapea presión de ángulo
  const toAng = (v) => {
    const t = (clamp(v, MIN, MAX) - MIN) / (MAX - MIN);
    return A_START + t * (A_END - A_START);
  };

  // Segmentos estilo AQI (verde - amarillo - naranja a rojo)
  const segs = [
    { from: A_START,         to: toAng(REF - 12), color: "#22c55e" }, // verde
    { from: toAng(REF - 12), to: toAng(REF + 5),  color: "#eab308" }, // amarillo
    { from: toAng(REF + 5),  to: toAng(REF + 15), color: "#f97316" }, // naranja
    { from: toAng(REF + 15), to: A_END,           color: "#ef4444" }, // rojo
  ];

  // Aguja (triángulo delgado)
  const vAng   = toAng(hPa);
  const tipLen = Math.round(R * 0.58);          // más corta para no tocar el número
  const baseW  = Math.round(R * 0.06);
  const tip    = [cx + tipLen * Math.cos(vAng), cy + tipLen * Math.sin(vAng)];
  const left   = [cx + baseW  * Math.cos(vAng + 90 * DEG), cy + baseW * Math.sin(vAng + 90 * DEG)];
  const right  = [cx + baseW  * Math.cos(vAng - 90 * DEG), cy + baseW * Math.sin(vAng - 90 * DEG)];

  // Posiciones de texto (número y unidad)
  const valueY = cy - Math.round(R * 0.05);     // arriba del centro
  const unitY  = valueY + Math.round(H * 0.09); // debajo del número

  return (
    <div style={{ width: "100%", height, display: "grid", placeItems: "center" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Presión ${hPa} hPa`}>
        {/* trasladamos el gauge para dibujar en torno a (0,0) y luego mover al centro */}
        <g transform={`translate(${cx},${cy})`}>
          {/* arco base muy suave */}
          <path d={arcPath(R, A_START, A_END)} stroke="rgba(0,0,0,.08)" strokeWidth={T} fill="none" strokeLinecap="round" />

          {/* segmentos de color */}
          {segs.map((s, i) => (
            <path key={i} d={arcPath(R, s.from, s.to)} stroke={s.color} strokeWidth={T} fill="none" strokeLinecap="round" />
          ))}

          {/* aguja */}
          <polygon
            points={`${tip[0]-cx},${tip[1]-cy} ${left[0]-cx},${left[1]-cy} ${right[0]-cx},${right[1]-cy}`}
            fill="#1e3a8a"
            opacity="0.95"
          />
          <circle cx="0" cy="0" r={Math.round(R * 0.04)} fill="#1e3a8a" />
        </g>

        {/* valor y unidad (centrados y por fuera de los segmentos,
            ¡ya no pintamos “Baja/Normal/Alta” aquí! */}
        <g textAnchor="middle" fill="currentColor">
          <text x={cx} y={valueY} fontWeight="800" fontSize={Math.round(H * 0.22)}>
            {Math.round(hPa)}
          </text>
          <text x={cx} y={unitY} fontSize={Math.round(H * 0.10)} opacity="0.85">
            hPa
          </text>
        </g>
      </svg>
    </div>
  );
}