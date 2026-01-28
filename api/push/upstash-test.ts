import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
export default async function handler(_: any, res: any) {
  const now = Date.now().toString();
  await redis.set('sigaire:test', now);
  const got = await redis.get<string>('sigaire:test');
  res.status(200).json({ set: now, got });
}