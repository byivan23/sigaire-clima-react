// /api/push/unsubscribe.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'Falta endpoint' });

  const id = 'sub:' + Buffer.from(endpoint).toString('base64url').slice(-40);
  await redis.srem('subs:all', id);
  await redis.del(id);

  res.status(200).json({ ok: true });
}