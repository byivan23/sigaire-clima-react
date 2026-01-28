// /api/push/alerts.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Carga web-push (igual que en send.ts)
let webpushCached: any | null = null;
async function getWebpush() {
  if (!webpushCached) {
    const mod: any = await import('web-push');
    const webpush = mod?.default ?? mod;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    webpushCached = webpush;
  }
  return webpushCached;
}

export default async function handler(req: any, res: any) {
  // Permite POST (Cron) y prueba manual GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // --- Protección: sólo debe poder llamarlo tu Cron ---
  const authHeader =
    (req.headers && (req.headers.authorization || (req.headers as any)['authorization'])) ||
    (typeof (req.headers as any)?.get === 'function'
      ? (req.headers as any).get('authorization')
      : undefined);

  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }

  // --- Modo prueba opcional: ?test=1 o header x-test: 1 ---
  let isTest = false;
  try {
    const rawUrl = typeof req.url === 'string' ? req.url : '';
    const fullUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `https://${(req.headers?.host as string) ?? 'localhost'}${rawUrl}`;
    const u = new URL(fullUrl);
    isTest = u.searchParams.get('test') === '1' || (req.headers?.['x-test'] as string) === '1';
  } catch {
    // sin URL válida, ignora test
  }

  const webpush = await getWebpush();

  // Tipado seguro (evita error de genérico)
  const ids: string[] = await redis.smembers('subs:all');

  const results: Array<{ id: string; pushes: number; errors?: number }> = [];

  for (const id of ids) {
    const rec = await redis.hgetall<Record<string, string>>(id);

    // Si está corrupto o sin endpoint, limpiar
    if (!rec?.endpoint) {
      await redis.srem('subs:all', id);
      if (rec) await redis.del(id);
      continue;
    }

    const keys = safeParseJSON(rec.keys);
    if (!keys?.p256dh || !keys?.auth) {
      await redis.srem('subs:all', id);
      await redis.del(id);
      continue;
    }

    // 1) Inputs para datos
    const lat = Number(rec.lat) || null;
    const lon = Number(rec.lon) || null;
    const city = rec.city || 'tu zona';

    const { rainProb, aqi, aqiCat } = await getRainAndAqi({ lat, lon, city });

    // 2) Mensajes cortos y claros
    const messages: Array<{ title: string; body: string; tag: string }> = [];

    // Modo prueba (para validar que el cron envía)
    if (isTest) {
      messages.push({
        title: 'SIGAIRE',
        body: '🧪 Prueba automática del cron',
        tag: 'test-auto',
      });
    }

    // Lluvia
    if (rainProb != null && !Number.isNaN(rainProb)) {
      if (rainProb >= 60) {
        messages.push({
          title: 'SIGAIRE',
          body: `🌧️ Lluvia probable (${rainProb}%). Lleva paraguas.`,
          tag: 'lluvia-hoy',
        });
      } else if (rainProb >= 30) {
        messages.push({
          title: 'SIGAIRE',
          body: `🌦️ Posible lluvia (${rainProb}%).`,
          tag: 'lluvia-hoy',
        });
      }
    }

    // Calidad del aire (AQI)
    if (aqi != null && !Number.isNaN(aqi)) {
      const cat = aqiCat || aqiCategory(aqi);
      if (cat !== 'Buena') {
        const emoji =
          cat === 'Moderada' ? '🙂' :
          cat === 'Sensibles' ? '⚠️' :
          cat === 'Mala' ? '😷' : '🚫';
        messages.push({
          title: 'SIGAIRE',
          body: `${emoji} Aire ${cat} (AQI ${aqi}).`,
          tag: 'aire-hoy',
        });
      }
    }

    // 3) Enviar (si hay algo que avisar)
    let pushes = 0, errors = 0;
    if (messages.length) {
      const subscription: any = { endpoint: rec.endpoint, keys };
      for (const m of messages) {
        // Dedupe: evita repetir el mismo tag al mismo usuario en el día
        const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const dedupeKey = `sent:${id}:${m.tag}:${day}`;
        const first = await redis.set(dedupeKey, '1', { nx: true, ex: 60 * 60 * 24 }); // TTL 24h
        if (first !== 'OK') continue; // ya enviada hoy

        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify({ title: m.title, body: m.body, tag: m.tag, url: '/' })
          );
          pushes++;
        } catch (err: any) {
          errors++;
          // limpiar expiradas
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await redis.srem('subs:all', id);
            await redis.del(id);
          }
        }
      }
    }

    results.push({ id, pushes, errors: errors || undefined });
  }

  return res.status(200).json({ ok: true, total: results.length, results });
}

// ========= helpers =========
function safeParseJSON(input: any) {
  if (!input) return {};
  if (typeof input === 'object') return input;
  if (typeof input !== 'string') return {};
  try { return JSON.parse(input); } catch { return {}; }
}

// Map estándar AQI → categoría corta
function aqiCategory(aqi: number) {
  if (aqi <= 50) return 'Buena';
  if (aqi <= 100) return 'Moderada';
  if (aqi <= 150) return 'Sensibles';
  if (aqi <= 200) return 'Mala';
  return 'Muy mala';
}

/**
 * Obtén prob. de lluvia (próximas 12h, máximo %) y US AQI (hora más cercana)
 * Fuentes: Open-Meteo Weather + Air Quality (sin API key).
 * Si no hay lat/lon pero sí city, geocodifica la ciudad.
 */
async function getRainAndAqi({
  lat,
  lon,
  city,
}: {
  lat: number | null;
  lon: number | null;
  city?: string;
}) {
  try {
    let latitude = lat ?? null;
    let longitude = lon ?? null;

    // 1) Geocodificar si faltan coords pero hay ciudad
    if ((!latitude || !longitude) && city) {
      const gRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city,
        )}&count=1&language=es`,
      );
      if (gRes.ok) {
        const g = await gRes.json();
        if (g?.results?.[0]) {
          latitude = g.results[0].latitude;
          longitude = g.results[0].longitude;
        }
      }
    }

    if (!latitude || !longitude) {
      return { rainProb: null as number | null, aqi: null as number | null, aqiCat: undefined as string | undefined };
    }

    const tz = 'auto';
    const now = Date.now();

    // 2) Pedir datos en paralelo
    const [rainRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&hourly=precipitation_probability&forecast_days=1&timezone=${tz}`,
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
          `&hourly=us_aqi&timezone=${tz}`,
      ),
    ]);

    // --- Lluvia: máximo de las próximas 12 horas ---
    let rainProb: number | null = null;
    if (rainRes.ok) {
      const rj = await rainRes.json();
      const times: string[] = rj?.hourly?.time ?? [];
      const probs: number[] = rj?.hourly?.precipitation_probability ?? [];
      if (times.length && probs.length) {
        const futureIdxs = times
          .map((t, i) => ({ i, ts: new Date(t).getTime() }))
          .filter((x) => x.ts >= now)
          .slice(0, 12)
          .map((x) => x.i);
        if (futureIdxs.length) {
          rainProb = futureIdxs.reduce(
            (max, i) => Math.max(max, Number(probs[i] ?? 0)),
            0,
          );
        }
      }
    }

    // --- AQI: valor de la hora más cercana a "ahora" ---
    let aqi: number | null = null;
    if (aqiRes.ok) {
      const aj = await aqiRes.json();
      const times: string[] = aj?.hourly?.time ?? [];
      const values: number[] = aj?.hourly?.us_aqi ?? [];
      if (times.length && values.length) {
        let idx = 0;
        let best = Infinity;
        for (let i = 0; i < times.length; i++) {
          const d = Math.abs(new Date(times[i]).getTime() - now);
          if (d < best) {
            best = d;
            idx = i;
          }
        }
        aqi = Number(values[idx] ?? null);
      }
    }

    const aqiCat = aqi != null ? aqiCategory(aqi) : undefined;
    return { rainProb, aqi, aqiCat };
  } catch (e) {
    console.error('getRainAndAqi error', e);
    return { rainProb: null as number | null, aqi: null as number | null, aqiCat: undefined as string | undefined };
  }
}