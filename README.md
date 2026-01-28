# SIGAIRE — Portal de clima y calidad del aire (React + Vite)

Sitio de demostración (Vercel): < (https://clima-react-iota.vercel.app/) >

## Qué incluye
- Frontend en **React + Vite**.
- Componentes de tarjetas y gráficas (ECharts/Leaflet).
- PWA básica y endpoints locales en `/api` para notificaciones push (pruebas).
- Archivo **`.env.example`** con todas las variables necesarias (sin secretos).

## Consumo real de APIs (para revisión)
- **Open-Meteo (clima / pronóstico):**  
  Código principal en `src/hooks/useWeather.js` (búsqueda: `open-meteo.com/v1/forecast`).
  Usado por componentes como `TemperatureLine.jsx`, `WindDial.jsx`, `UvGauge.jsx`, etc.

- **Calidad del aire (CAMS vía endpoint de Open-Meteo Air Quality):**  
  Implementado en `src/components/PollutantsCard.jsx` y `src/pages/PollutantsDetail.jsx`  
  (búsqueda: `open-meteo.com/v1/air-quality`).

> Cómo verificar rápido en GitHub: presiona **t** y busca `open-meteo` o `air-quality` para saltar a las llamadas `fetch`.

## Estructura mínima
