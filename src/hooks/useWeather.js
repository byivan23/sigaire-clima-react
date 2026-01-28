import { useEffect, useState } from "react";

/*  esto es helpers  */
const FALLBACK_POS = { lat: 19.4326, lon: -99.1332 }; // CDMX

function getPositionOnce(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(FALLBACK_POS);
    const ok = (pos) =>
      resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    const err = () => resolve(FALLBACK_POS);
    const timer = setTimeout(err, timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(timer);
        ok(p);
      },
      () => {
        clearTimeout(timer);
        err();
      },
      { enableHighAccuracy: true, maximumAge: 60_000 }
    );
  });
}

function idxForLocalHour(isoArr = []) {
  if (!Array.isArray(isoArr) || isoArr.length === 0) return -1;
  const now = new Date();
  for (let i = 0; i < isoArr.length; i++) {
    const d = new Date(isoArr[i]);
    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate() &&
      d.getHours() === now.getHours()
    ) {
      return i;
    }
  }
  for (let i = isoArr.length - 1; i >= 0; i--) {
    if (!Number.isNaN(new Date(isoArr[i]))) return i;
  }
  return -1;
}

function uvToLabel(uvi = 0) {
  const v = Number(uvi) || 0;
  if (v < 3) return "BAJO";
  if (v < 6) return "MODERADO";
  if (v < 8) return "ALTO";
  if (v < 11) return "MUY ALTO";
  return "EXTREMO";
}

function aqiToLabel(aqi = 0) {
  const v = Number(aqi) || 0;
  if (v <= 50) return "BUENA";
  if (v <= 100) return "MODERADA";
  if (v <= 150) return "SENSIBLES";
  if (v <= 200) return "MALA";
  return "MUY MALA";
}

/* esto es fetchers  */
async function fetchWeather(lat, lon) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    "&timezone=auto" +
    "&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m" +
    "&hourly=temperature_2m,precipitation_probability,uv_index,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m" +
    "&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset";

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather request failed");
  return res.json();
}

async function fetchCAMS(lat, lon) {
  const url =
    "https://air-quality-api.open-meteo.com/v1/air-quality" +
    `?latitude=${lat}&longitude=${lon}` +
    "&timezone=auto" +
    "&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,us_aqi";

  const res = await fetch(url);
  if (!res.ok) throw new Error("CAMS request failed");
  return res.json();
}

/* Hook  */
export default function useWeather() {
  const [wx, setWx] = useState({
    loading: true,
    error: null,
    lat: null,
    lon: null,

    temp: null,
    humidity: null,
    pressure: null,
    windSpeed: null,
    gust: null,
    windDir: null,
    uvi: null,
    uvLabel: null,

    tMin: null,
    tMax: null,
    isNight: false,

    rainProb: null,
    forecast: [],

    usAqi: null,
    aqiLabel: null,

    pm25: null,
    pm10: null,
    co: null,
    no2: null,
    o3: null,
    so2: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const pos = await getPositionOnce();
        const lat = pos.lat;
        const lon = pos.lon;

        //  Clima 
        const meteo = await fetchWeather(lat, lon);
        const h = meteo?.hourly || {};
        const c = meteo?.current || {};
        const d = meteo?.daily || {};
        const tIdx = idxForLocalHour(h.time || []);
        const hour = (arr) =>
          Array.isArray(arr) && tIdx >= 0 ? arr[tIdx] ?? null : null;

        const temperature = Number(c.temperature_2m ?? hour(h.temperature_2m));
        const humidity = Number(
          c.relative_humidity_2m ?? hour(h.relative_humidity_2m)
        );
        const pressure = Number(c.surface_pressure ?? hour(h.surface_pressure));
        const windSpeed = Number(c.wind_speed_10m ?? hour(h.wind_speed_10m));
        const gust = Number(c.wind_gusts_10m ?? hour(h.wind_gusts_10m));
        const windDir = Number(
          c.wind_direction_10m ?? hour(h.wind_direction_10m)
        );
        const uvi = Number(hour(h.uv_index));
        const rainProb = Number(hour(h.precipitation_probability));

        const tMin = Array.isArray(d.temperature_2m_min)
          ? d.temperature_2m_min[0]
          : null;
        const tMax = Array.isArray(d.temperature_2m_max)
          ? d.temperature_2m_max[0]
          : null;
        const sunrise = Array.isArray(d.sunrise) ? new Date(d.sunrise[0]) : null;
        const sunset = Array.isArray(d.sunset) ? new Date(d.sunset[0]) : null;
        const now = new Date();
        const isNight = sunrise && sunset ? now < sunrise || now > sunset : false;

        const forecast = Array.isArray(h.time)
          ? h.time.map((iso, i) => {
              const dt = new Date(iso);
              const hourStr = dt
                .toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  hour12: true,
                })
                .toLowerCase()
                .replace(". ", ".");
              const t = Array.isArray(h.temperature_2m)
                ? h.temperature_2m[i]
                : null;
              return { ts: iso, hour: hourStr, temp: t };
            })
          : [];

        //  CAMS 
        let usAqi = null,
          aqiLabel = null;
        let pm25 = null,
          pm10 = null,
          co = null,
          no2 = null,
          o3 = null,
          so2 = null;

        try {
          const cams = await fetchCAMS(lat, lon);
          const ch = cams?.hourly || {};
          const ai = idxForLocalHour(ch.time || []);
          const at = (arr) =>
            Array.isArray(arr) && ai >= 0 ? arr[ai] ?? null : null;

          pm25 = at(ch.pm2_5);
          pm10 = at(ch.pm10);
          co = at(ch.carbon_monoxide);
          no2 = at(ch.nitrogen_dioxide);
          o3 = at(ch.ozone);
          so2 = at(ch.sulphur_dioxide);
          usAqi = at(ch.us_aqi);
          aqiLabel = aqiToLabel(usAqi);
        } catch {
          // si falla cams, dejamos null
        }

        if (cancelled) return;
        setWx({
          loading: false,
          error: null,
          lat,
          lon,

          temp: Number.isFinite(temperature) ? Math.round(temperature) : null,
          humidity: Number.isFinite(humidity) ? Math.round(humidity) : null,
          pressure: Number.isFinite(pressure) ? Math.round(pressure) : null,
          windSpeed: Number.isFinite(windSpeed) ? Math.round(windSpeed) : null,
          gust: Number.isFinite(gust) ? Math.round(gust) : null,
          windDir: Number.isFinite(windDir) ? Math.round(windDir) : null,
          uvi: Number.isFinite(uvi) ? Math.round(uvi) : null,
          uvLabel: uvToLabel(uvi),

          tMin: Number.isFinite(tMin) ? Math.round(tMin) : null,
          tMax: Number.isFinite(tMax) ? Math.round(tMax) : null,
          isNight,

          rainProb: Number.isFinite(rainProb) ? Math.round(rainProb) : null,
          forecast,

          usAqi: Number.isFinite(usAqi) ? Math.round(usAqi) : null,
          aqiLabel,

          pm25: Number.isFinite(pm25) ? pm25 : null,
          pm10: Number.isFinite(pm10) ? pm10 : null,
          co: Number.isFinite(co) ? co : null,
          no2: Number.isFinite(no2) ? no2 : null,
          o3: Number.isFinite(o3) ? o3 : null,
          so2: Number.isFinite(so2) ? so2 : null,
        });
      } catch (err) {
        if (cancelled) return;
        setWx((s) => ({ ...s, loading: false, error: String(err) || "Error" }));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return wx;
}