// /api/push/send.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Cargamos web-push de forma compatible (ESM o CJS) y lo cacheamos
let webpushCached: any | null = null;
async function getWebpush() {
  if (!webpushCached) {
    const mod: any = await import('web-push');
    // si es ESM viene en mod.default; si es CJS viene en mod
    webpushCached = mod?.default ?? mod;
  }
  return webpushCached;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // Carga web-push y configura VAPID en runtime (evita problemas de import)
  const webpush = await getWebpush();
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const payload = req.body || { title: 'SIGAIRE', body: 'Nuevo aviso', url: '/' };

  // Lista de suscripciones
  const ids = await redis.smembers('subs:all'); // string[]
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const id of ids) {
    const record = await redis.hgetall<Record<string, string>>(id);
    if (!record?.endpoint) {
      await redis.srem('subs:all', id);
      continue;
    }

    const keys = safeParseJSON(record.keys);

    // si faltan claves p256dh/auth, esta suscripción es inválida -> limpiar y continuar
    if (!keys.p256dh || !keys.auth) {
      await redis.srem('subs:all', id);
      await redis.del(id);
      continue;
    }

    const subscription = {
      endpoint: record.endpoint,
      keys,
    };

    try {
      await webpush.sendNotification(subscription as any, JSON.stringify(payload));
      results.push({ id, ok: true });
    } catch (err: any) {
      // Limpia suscripciones inválidas/expiradas
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await redis.srem('subs:all', id);
        await redis.del(id);
      }
      results.push({ id, ok: false, error: String(err) });
    }
  }

  res.status(200).json({ sent: results.length, results });
}

// Helper seguro para parsear JSON o devolver objeto vacío
function safeParseJSON(input: any) {
  if (!input) return {};
  if (typeof input === 'object') return input; // ya es objeto
  if (typeof input !== 'string') return {};
  const str = input.trim();
  if (!(str.startsWith('{') || str.startsWith('['))) return {};
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}