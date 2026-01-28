// /api/push/subscribe.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Suscripción inválida' });

  const id = 'sub:' + Buffer.from(sub.endpoint).toString('base64url').slice(-40);
  await redis.hset(id, {
    endpoint: sub.endpoint,
    keys: JSON.stringify(sub.keys || {}),
    // campos extra con metadatos de ubicación (si vienen del cliente)
    lat: sub.meta?.lat ? String(sub.meta.lat) : '',
    lon: sub.meta?.lon ? String(sub.meta.lon) : '',
    city: sub.meta?.city || '',
    ts: Date.now(),
  });
  await redis.sadd('subs:all', id);

  res.status(200).json({ ok: true, id });
}