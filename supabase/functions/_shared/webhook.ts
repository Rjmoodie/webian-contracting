/**
 * Resend webhook verification (Svix-style).
 * Headers: svix-id, svix-timestamp, svix-signature.
 * Secret: RESEND_WEBHOOK_SECRET (from Resend dashboard, e.g. whsec_xxx).
 */
const TOLERANCE_SEC = 300; // 5 min replay window

function decodeWhsec(secret: string): Uint8Array | null {
  if (!secret.startsWith("whsec_")) return null;
  try {
    const b64 = secret.slice(6);
    const binary = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function hmacSha256(key: Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const enc = new TextEncoder();
  return await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Verify Resend inbound webhook. Returns true if valid. */
export async function verifyResendWebhook(
  rawBody: string,
  headers: Headers
): Promise<boolean> {
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
  if (!secret) return false;

  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TOLERANCE_SEC) return false;

  const key = decodeWhsec(secret);
  if (!key) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = toBase64(await hmacSha256(key, signedContent));

  const parts = signature.split(" ");
  for (const part of parts) {
    const sig = part.startsWith("v1,") ? part.slice(3) : part;
    if (sig.length !== expected.length) continue;
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (sig[i] !== expected[i]) { match = false; break; }
    }
    if (match) return true;
  }
  return false;
}
