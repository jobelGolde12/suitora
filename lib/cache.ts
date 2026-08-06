import { Redis } from "ioredis";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redis = new Redis(redisUrl);
  }
  return redis;
}

export async function get<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
}

export async function set<T>(key: string, value: T, expireSeconds: number = 3600): Promise<void> {
  const client = getRedisClient();
  await client.set(key, JSON.stringify(value), "EX", expireSeconds);
}

export async function del(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export async function flushAll(): Promise<void> {
  const client = getRedisClient();
  await client.flushall();
}