import { NextResponse } from "next/server";
import { signBody } from "@/lib/hmac";

export const dynamic = "force-dynamic";

/**
 * Demo driver. Builds three kinds of delivery and posts them at the real
 * webhook endpoint, so the page shows the endpoint's own answer rather than
 * a story about it.
 */
let lastEventId: string | null = null;

export async function POST(req: Request) {
  const mode = new URL(req.url).searchParams.get("mode") ?? "valid";
  const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? "replace-me";

  const id =
    mode === "replay" && lastEventId
      ? lastEventId
      : `evt_${Math.random().toString(36).slice(2, 10)}`;
  if (mode !== "replay") lastEventId = id;

  const body = JSON.stringify({
    id,
    type: "payment.succeeded",
    amount_cents: 4900,
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const signature =
    mode === "forged"
      ? `t=${timestamp},v1=${"0".repeat(64)}`
      : signBody(body, secret, timestamp);

  const target = new URL("/api/webhooks/payments", req.url);
  const res = await fetch(target, {
    method: "POST",
    headers: { "content-type": "application/json", "x-signature": signature },
    body,
  });

  return NextResponse.json({
    sent: { mode, eventId: id, signature: signature.slice(0, 28) + "…" },
    endpointStatus: res.status,
    endpointSaid: await res.json(),
  });
}
