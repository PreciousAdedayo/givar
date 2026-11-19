/** Supabase Storage adapter. The service-role key is server-only and must never use a NEXT_PUBLIC_ prefix. */
export function storageConfig() {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Supabase Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return { base, key };
}

export async function uploadPublicObject(bucket: string, path: string, bytes: ArrayBuffer | Buffer, contentType: string) {
  const { base, key } = storageConfig();
  const objectPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${base}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": contentType, "x-upsert": "true" },
    body: bytes instanceof ArrayBuffer ? bytes : (Uint8Array.from(bytes).buffer as ArrayBuffer),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
}

export async function deletePublicObject(bucket: string, path: string) {
  const { base, key } = storageConfig();
  const response = await fetch(`${base}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Storage delete failed (${response.status})`);
}

/** Creates a two-hour, one-object upload capability for large browser-to-storage uploads. */
export async function createSignedPublicUpload(bucket: string, path: string) {
  const { base, key } = storageConfig();
  const objectPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${base}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${objectPath}`, {
    method: "POST", headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({}), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.url !== "string") throw new Error(`Could not create signed upload URL (${response.status})`);
  const signedPath = result.url.startsWith("/storage/v1/") ? result.url : `/storage/v1${result.url.startsWith("/") ? result.url : `/${result.url}`}`;
  const signedUrl = new URL(result.url.startsWith("https://") ? result.url : signedPath, base);
  if (typeof result.token === "string" && !signedUrl.searchParams.has("token")) signedUrl.searchParams.set("token", result.token);
  return { signedUrl: signedUrl.toString(), publicUrl: `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}` };
}
