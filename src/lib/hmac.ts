import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SKEW_SECONDS = 5 * 60;

/**
 * Verify an inbound webhook signature.
 *
 * Three things matter and all three are easy to get wrong:
 *  1. Hash the RAW body. Parsing and re-serialising JSON changes the bytes
 *     and therefore the digest.
 *  2. Compare in constant time, so an attacker cannot learn the signature
 *     one byte at a time from response timing.
 *  3. Reject deliveries whose timestamp is outside a short window, otherwise
 *     a captured request can be replayed forever.
 */
export function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): { ok: true } | { ok: false; reason: string } {
  if (!header) return { ok: false, reason: "signature header missing" };

  const parts = Object.fromEntries(
    header.split(",").map((p) => p.trim().split("=", 2) as [string, string])
  );
  const timestamp = Number(parts["t"]);
  const provided = parts["v1"];

  if (!timestamp || !provided) {
    return { ok: false, reason: "signature header malformed" };
  }
  if (Math.abs(nowSeconds - timestamp) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "timestamp outside the accepted window" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature does not match" };
  }
  return { ok: true };
}

/** Helper used by the demo page to produce a valid signature. */
export function signBody(rawBody: string, secret: string, timestamp: number) {
  const v1 = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `t=${timestamp},v1=${v1}`;
}
