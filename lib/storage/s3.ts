/**
 * Minimal S3-compatible storage client (Pillar 03, Action Item 6).
 *
 * Implements just enough AWS SigV4 to PUT / GET / DELETE objects and list a
 * bucket prefix via the REST API, so backups work against AWS S3, Cloudflare
 * R2, and self-hosted MinIO without adding an SDK dependency.
 */

import { createHash, createHmac } from "node:crypto";

type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const SERVICE = "s3";

function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function sign(key: string | Buffer, msg: string): Buffer {
  return hmac(key, msg);
}

function getSigningKey(secret: string, dateStamp: string, region: string): Buffer {
  const kDate = sign(`AWS4${secret}`, dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, SERVICE);
  return sign(kService, "aws4_request");
}

/** Percent-encode per the S3/SigV4 canonical URI rules. */
function encodePath(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function buildAuthHeaders(
  config: S3Config,
  method: string,
  path: string,
  payload: string | Buffer,
  extraHeaders: Record<string, string>,
  now = new Date()
): Record<string, string> {
  const endpoint = new URL(config.endpoint);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = endpoint.host;

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": sha256Hex(payload),
    "x-amz-date": amzDate,
    ...extraHeaders,
  };

  const signedHeaders = Object.keys(headers)
    .map((h) => h.toLowerCase())
    .sort();
  const canonicalHeaders = signedHeaders
    .map((h) => `${h}:${headers[h].trim()}\n`)
    .join("");

  const canonicalRequest = [
    method,
    encodePath(path),
    "", // canonical query string (unused for our operations)
    canonicalHeaders,
    signedHeaders.join(";"),
    headers["x-amz-content-sha256"],
  ].join("\n");

  const scope = `${dateStamp}/${config.region}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(config.secretAccessKey, dateStamp, config.region);
  const signature = hmac(signingKey, stringToSign).toString("hex");

  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`,
    "x-amz-content-sha256": headers["x-amz-content-sha256"],
    "x-amz-date": headers["x-amz-date"],
  };
}

export function getS3Config(): S3Config {
  const endpoint = process.env.S3_ENDPOINT || "https://s3.amazonaws.com";
  const region = process.env.S3_REGION || "us-east-1";
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 backup storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY."
    );
  }

  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

async function s3Request(
  config: S3Config,
  method: string,
  key: string,
  body?: Buffer
): Promise<Response> {
  const endpoint = new URL(config.endpoint);
  const path = `/${config.bucket}/${encodePath(key)}`;
  const payload = body ?? Buffer.alloc(0);
  const authHeaders = buildAuthHeaders(
    config,
    method,
    path,
    payload,
    body ? { "content-type": "application/gzip" } : {}
  );

  const res = await fetch(`${endpoint.protocol}//${endpoint.host}${path}`, {
    method,
    headers: { ...authHeaders, ...(body ? { "content-length": String(payload.length) } : {}) },
    body: body ? new Uint8Array(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`S3 ${method} ${key} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res;
}

export async function s3Put(key: string, data: Buffer): Promise<void> {
  await s3Request(getS3Config(), "PUT", key, data);
}

export async function s3Get(key: string): Promise<Buffer> {
  const res = await s3Request(getS3Config(), "GET", key);
  return Buffer.from(await res.arrayBuffer());
}

export async function s3Delete(key: string): Promise<void> {
  await s3Request(getS3Config(), "DELETE", key);
}

export type S3Object = { key: string; lastModified: string | null };

/** List objects under `prefix` using ListObjectsV2 (page size capped at 1000). */
export async function s3List(prefix: string): Promise<S3Object[]> {
  const config = getS3Config();
  const endpoint = new URL(config.endpoint);
  const path = `/${config.bucket}`;
  const query = `?list-type=2&prefix=${encodeURIComponent(prefix)}`;

  const authHeaders = buildAuthHeaders(
    config,
    "GET",
    `${path}?${query.replace(/^\?/, "")}`,
    Buffer.alloc(0),
    {}
  );

  const res = await fetch(`${endpoint.protocol}//${endpoint.host}${path}${query}`, {
    method: "GET",
    headers: authHeaders,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`S3 list ${prefix} failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const xml = await res.text();
  const keys: S3Object[] = [];
  const keyRegex = /<Key>([^<]+)<\/Key>/g;
  const lastModifiedRegex = /<LastModified>([^<]+)<\/LastModified>/g;
  const lastModifieds = [...xml.matchAll(lastModifiedRegex)].map((m) => m[1]);
  let i = 0;
  for (const match of xml.matchAll(keyRegex)) {
    keys.push({ key: match[1], lastModified: lastModifieds[i++] ?? null });
  }
  return keys;
}
