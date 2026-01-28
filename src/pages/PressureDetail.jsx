import React from "react";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
const DEG = Math.PI / 180;

export default function PressureGauge({
  hPa = 1013,
  height = 220,      // controla el tamaño del gráfico
  bare = false,      // si true, oculta ticks/etiquetas (modo compacto)
}) {
  // Rango típico a nivel del mar
  const MIN = 960;
  const REF = 1013;
  const MAX = 1060;

  //  Geometría (para para que nada se tape) 
  const H = height;
  const W = Math.round(H * 1.6);          // un poco más ancho que alto
  const cx = Math.round(W * 0.5);
  const cy = Math.round(H * 0.72);        // bajamos el centro para dejar espacio arriba
  const R  = Math.round(H * 0.38);        // radio del arco visible
  const T  = Math.max(10, Math.round(R * 0.16)); // grosor del arco

  // Ángulos (semicírculo abierto para texto)
  const A_START = -100 * DEG;
  const A_END   =  100 * DEG;

  // Helpers
  const polar = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arcPath = (r, a1, a2) => {
    const [x0, y0] = polar(r, a1);
    const [x1, y1] = polar(r, a2);
    const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
    const sweep = a2 > a1 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} ${sweep} ${x1} ${y1}`;
  };

  const mapValToAngle = (val) =>
    ((clamp(val, MIN, MAX) - MIN) / (MAX - MIN)) * (A_END - A_START) + A_START;

  // Bandas (baja/normal/alta)
  const segs = [
    { from: A_START, to: (-15) * DEG, color: "#60a5fa" }, // azul (baja)
    { from: (-15) * DEG, to: (10) * DEG, color: "#86efac" }, // verde (normal)
    { from: (10) * DEG,  to: A_END,      color: "#fda4af" }, // rojo/rosa (alta)
  ];

  // Valor de ángulo
  const ang = mapValToAngle(hPa);

  // Aguja (triángulo) 
  const needleLen = R - T * 1.1;          // punta sin tocar el texto ni el borde
  const tip   = polar(needleLen, ang);
  const left  = polar(Math.max(8, T * 0.55), ang - 90 * DEG);
  const right = polar(Math.max(8, T * 0.55), ang + 90 * DEG);

  //  Ticks y etiquetas (se pueden ocultar con bare) 
  const tickFont = Math.round(H * 0.085);
  const ticks = bare
    ? null
    : (
      <g>
        {[MIN, REF, MAX].map((val, i) => {
          const a = mapValToAngle(val);
          const p1 = polar(R - T * 0.35, a);
          const p2 = polar(R + T * 0.35, a);
          const pt = polar(R + T * 1.35, a); // etiqueta un poco por debajo del arco
          return (
            <g key={i}>
              <line
                x1={p1[0]} y1={p1[1]}
                x2={p2[0]} y2={p2[1]}
                stroke="rgba(0,0,0,.35)" strokeWidth="2"
                strokeLinecap="round"
              />
              <text
                x={pt[0]}
                y={pt[1] + 5}
                textAnchor="middle"
                fontSize={tickFont}
                fill="rgba(0,0,0,.55)"
              >
                {val}
              </text>
            </g>
          );
        })}
      </g>
    );

  // Tamaños tipográficos del valor principal
  const valueSize = Math.round(H * 0.20);
  const unitSize  = Math.round(H * 0.10);

  return (
    <div style={{ width: "100%", height, display: "grid", placeItems: "center" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Presión ${hPa} hPa`}
      >
        {/* Arco base (gris claro) */}
        <path
          d={arcPath(R, A_START, A_END)}
          stroke="rgba(0,0,0,.08)"
          strokeWidth={T}
          fill="none"
          strokeLinecap="round"
        />

        {/* Bandas de color */}
        {segs.map((s, i) => (
          <path
            key={i}
            d={arcPath(R, s.from, s.to)}
            stroke={s.color}
            strokeWidth={T}
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Ticks y números de referencia */}
        {ticks}

        {/* Aguja */}
        <polygon
          points={`${tip[0]},${tip[1]} ${left[0]},${left[1]} ${right[0]},${right[1]}`}
          fill="#1e3a8a"
          opacity="0.95"
        />
        <circle cx={cx} cy={cy} r={Math.max(6, T * 0.45)} fill="#1e3a8a" />

        {/* Valor grande y unidad — DEBAJO del arco para que nada lo tape */}
        <g textAnchor="middle">
          <text
            x={cx}
            y={cy + Math.round(R * 0.55)}
            fontSize={valueSize}
            fontWeight={800}
            fill="rgba(15,23,42,0.95)"
          >
            {Math.round(hPa)}
          </text>
          <text
            x={cx}
            y={cy + Math.round(R * 0.55) + unitSize + 2}
            fontSize={unitSize}
            fill="rgba(15,23,42,0.7)"
          >
            hPa
          </text>
        </g>
      </svg>
    </div>
  );
}