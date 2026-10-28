"use client";

import { useState } from "react";

type ImportResult = {
  received?: number;
  inserted?: number;
  updated?: number;
  unchanged?: number;
  writes?: number;
  error?: string;
};
type PaymentResult = {
  error?: string;
  endpointSaid?: { accepted?: boolean; reason?: string };
  secondAttempt?: { duplicate?: boolean };
};
const card = { borderColor: "var(--line)", background: "var(--card)" };

function Details({ data }: { data: object | null }) {
  if (!data) return null;
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer" style={{ color: "var(--muted)" }}>
        Technical details
      </summary>
      <pre className="mt-2 overflow-x-auto rounded-md border p-3 text-xs" style={{ borderColor: "var(--line)" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function Outcome({ tone, title, body }: { tone: "good" | "bad"; title: string; body: string }) {
  return (
    <div
      className="mt-4 rounded-md border-l-4 p-4"
      style={{ ...card, borderLeftColor: tone === "good" ? "var(--accent)" : "var(--warn)" }}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{body}</p>
    </div>
  );
}

function importOutcome(d: ImportResult) {
  if (d.error) return { tone: "bad" as const, title: "The import failed.", body: String(d.error) };
  if (d.writes === 0)
    return {
      tone: "good" as const,
      title: "Nothing changed, so nothing was written.",
      body: `All ${d.received} listings were checked against what is already stored, found identical, and left alone. Run it as often as you like — the database only changes when the feed does.`,
    };
  const parts = [];
  if (d.inserted) parts.push(`${d.inserted} new ${d.inserted === 1 ? "listing" : "listings"} added`);
  if (d.updated) parts.push(`${d.updated} updated`);
  if (d.unchanged) parts.push(`${d.unchanged} unchanged`);
  return {
    tone: "good" as const,
    title: parts.join(", ") + ".",
    body: "Now press the button again. Nothing in the feed has changed, so the second run should touch nothing at all.",
  };
}

function paymentOutcome(mode: string, d: PaymentResult) {
  if (d.error) return { tone: "bad" as const, title: "Something failed on the server.", body: String(d.error) };
  if (mode === "replay") {
    const ok = d.secondAttempt?.duplicate === true;
    return ok
      ? {
          tone: "good" as const,
          title: "First copy accepted, second copy ignored.",
          body: "Payment providers resend a notification when your app doesn’t answer fast enough — that’s normal. Here the second copy was recognised as one already handled, so the customer gets access once and is never credited twice.",
        }
      : { tone: "bad" as const, title: "The repeat was not recognised.", body: "This would mean one payment counts twice." };
  }
  const said = d.endpointSaid ?? {};
  if (mode === "forged") {
    return said.accepted === false
      ? {
          tone: "good" as const,
          title: "Rejected. The fake was ignored.",
          body: "The message wasn’t signed with the secret shared only between the app and the payment provider, so it was thrown away. Without this check, anyone who discovers the address could unlock the product for free.",
        }
      : { tone: "bad" as const, title: "The fake was accepted.", body: "This would be a serious problem." };
  }
  return said.accepted
    ? {
        tone: "good" as const,
        title: "Accepted. Access would be granted.",
        body: "The signature checks out and the notification is fresh, so the app trusts it — this is the path a real payment takes.",
      }
    : { tone: "bad" as const, title: "A real notification was refused.", body: String(said.reason ?? "") };
}

export default function PortalPage() {
  const [importData, setImportData] = useState<ImportResult | null>(null);
  const [payData, setPayData] = useState<{ mode: string; data: PaymentResult } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function runImport() {
    setBusy("import");
    const res = await fetch("/api/import", { method: "POST" });
    setImportData(await res.json());
    setBusy(null);
  }

  async function sendPayment(mode: "valid" | "forged" | "replay") {
    setBusy(mode);
    const res = await fetch(`/api/demo-webhook?mode=${mode}`, { method: "POST" });
    setPayData({ mode, data: await res.json() });
    setBusy(null);
  }

  const imp = importData ? importOutcome(importData) : null;
  const pay = payData ? paymentOutcome(payData.mode, payData.data) : null;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Two things that break quietly</h1>
        <p className="max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          Neither of these shows up in a demo or on launch day. They show up weeks
          later as wrong numbers, duplicate records or a customer who got something
          for free. Here you can trigger both on purpose and see what happens.
        </p>
      </header>

      <section id="import" className="rounded-lg border p-6" style={card}>
        <h2 className="text-xl font-semibold">An import you can safely run twice</h2>
        <p className="mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
          Say the app syncs property listings from a partner every night. Most nights
          the feed has barely changed. A careless import rewrites every row anyway — so
          &ldquo;updated today&rdquo; stops meaning anything, and if it stops halfway
          through you are left with duplicates.
        </p>
        <p className="mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
          Press the button to import four listings. Then press it again.
        </p>
        <button
          onClick={runImport}
          disabled={busy !== null}
          className="mt-4 rounded-md px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {busy === "import" ? "Importing…" : "Run the import"}
        </button>
        {imp && <Outcome {...imp} />}
        <Details data={importData} />
      </section>

      <section id="payments" className="rounded-lg border p-6" style={card}>
        <h2 className="text-xl font-semibold">Payment notifications that can&rsquo;t be faked or doubled</h2>
        <p className="mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
          When a customer pays, the payment provider — Stripe, Lemon Squeezy, Paddle —
          sends the app a message: &ldquo;payment received, give them access.&rdquo; The
          app has to tell a real message from a fake one, and has to notice when the
          same message arrives twice. Try all three:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["valid", "A real payment notification"],
              ["forged", "A fake one from an attacker"],
              ["replay", "The same one arriving twice"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => sendPayment(mode)}
              disabled={busy !== null}
              className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "var(--line)" }}
            >
              {busy === mode ? "Sending…" : label}
            </button>
          ))}
        </div>
        {pay && <Outcome {...pay} />}
        <Details data={payData?.data ?? null} />
      </section>
    </div>
  );
}
