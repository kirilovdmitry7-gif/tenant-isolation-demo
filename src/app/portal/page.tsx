"use client";

import { useState } from "react";

type Json = Record<string, unknown>;

function Panel({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg border p-5"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-4 mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {blurb}
      </p>
      {children}
    </section>
  );
}

function Output({ data }: { data: Json | null }) {
  if (!data) return null;
  return (
    <pre
      className="mt-3 overflow-x-auto rounded-md border p-3 text-xs"
      style={{ borderColor: "var(--line)" }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function PortalPage() {
  const [importOut, setImportOut] = useState<Json | null>(null);
  const [hookOut, setHookOut] = useState<Json | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function runImport() {
    setBusy("import");
    const res = await fetch("/api/import", { method: "POST" });
    setImportOut(await res.json());
    setBusy(null);
  }

  async function sendWebhook(mode: "valid" | "forged" | "replay") {
    setBusy(mode);
    const res = await fetch(`/api/demo-webhook?mode=${mode}`, { method: "POST" });
    setHookOut(await res.json());
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Pipelines</h1>
        <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Two pieces of plumbing that quietly decide whether a system is
          trustworthy: an import that is safe to run twice, and a webhook that
          cannot be forged or replayed.
        </p>
      </header>

      <Panel
        title="Idempotent feed import"
        blurb="Press once and rows are written. Press again without changing the feed and nothing is written at all — that is the whole point. The key is (org, external id) and an unchanged content hash short-circuits the write."
      >
        <button
          onClick={runImport}
          disabled={busy !== null}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {busy === "import" ? "Importing…" : "Run the import"}
        </button>
        <Output data={importOut} />
      </Panel>

      <Panel
        title="Signed webhook"
        blurb="Three cases: a correctly signed delivery, one with a tampered signature, and the same delivery sent twice. Only a valid, unseen delivery does anything."
      >
        <div className="flex flex-wrap gap-2">
          {(["valid", "forged", "replay"] as const).map((m) => (
            <button
              key={m}
              onClick={() => sendWebhook(m)}
              disabled={busy !== null}
              className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "var(--line)" }}
            >
              {m === "valid" ? "Send signed" : m === "forged" ? "Send forged" : "Send the same one twice"}
            </button>
          ))}
        </div>
        <Output data={hookOut} />
      </Panel>
    </div>
  );
}
