import { NextResponse } from "next/server";
import { signBody } from "@/lib/hmac";

export const dynamic = "force-dynamic";

/**
 * Demo driver. Builds a delivery and posts it at the real webhook endpoint,
 * so the page shows that endpoint's own answer rather than a story about it.
 *
 * Note on the replay case: it deliberately posts the SAME delivery twice
 * inside one request and reports both answers. An earlier version kept the
 * previous event id in a module-level variable, which is wrong on serverless
 * — each invocation can land on a different instance, so that memory is not
 * there when the next click arrives, and the "replay" quietly became a first
 * delivery. Sending both halves here makes the demonstration deterministic
 * and keeps the claim honest.
 */
export async function POST(req: Request) {
  const mode = new URL(req.url).searchParams.get("mode") ?? "valid";
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing environment variable: PAYMENT_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const target = new URL("/api/webhooks/payments", req.url);

  const deliver = async (id: string, forge: boolean) => {
    const body = JSON.stringify({
      id,
      type: "payment.succeeded",
      amount_cents: 4900,
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = forge
      ? `t=${timestamp},v1=${"0".repeat(64)}`
      : signBody(body, secret, timestamp);

    const res = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": signature },
      body,
    });
    return { status: res.status, body: await res.json() };
  };

  const id = `evt_${Math.random().toString(36).slice(2, 10)}`;

  if (mode === "replay") {
    const first = await deliver(id, false);
    const second = await deliver(id, false);
    return NextResponse.json({
      sent: `the same delivery ${id} twice`,
      firstAttempt: first.body,
      secondAttempt: second.body,
      verdict:
        second.body?.duplicate === true
          ? "The second delivery changed nothing. A provider retry cannot grant twice."
          : "UNEXPECTED: the duplicate was not recognised.",
    });
  }

  const only = await deliver(id, mode === "forged");
  return NextResponse.json({
    sent: mode === "forged" ? `delivery ${id} with a tampered signature` : `delivery ${id}, correctly signed`,
    endpointStatus: only.status,
    endpointSaid: only.body,
  });
}
