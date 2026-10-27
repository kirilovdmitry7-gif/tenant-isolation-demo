"use client";

import { useState } from "react";

type Result = {
  sql: string;
  identity: string;
  target: string;
  sameOrg: boolean;
  asUser: { rows: { id: string; name: string; status: string }[]; count: number; error: string | null };
  asServiceRole: { count: number; error: string | null };
  verdict: string;
};

const IDENTITIES = [
  { id: "northwind", label: "Client — Northwind Studio" },
  { id: "acme", label: "Client — Acme Coffee Co" },
  { id: "admin", label: "Admin — Northwind Studio" },
];
const TARGETS = [
  { id: "northwind", label: "Northwind Studio's projects" },
  { id: "acme", label: "Acme Coffee Co's projects" },
];

export default function ProofPage() {
  const [identity, setIdentity] = useState("northwind");
  const [target, setTarget] = useState("acme");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identity, target }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "request failed");
      else setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  const leaked = result && !result.sameOrg && result.asUser.count > 0;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Isolation proof</h1>
        <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Choose who you are and whose data you would like to read. The same
          query runs twice: once as that signed-in user through the public key,
          once with the service role that bypasses row level security.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Signed in as</span>
          <select
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: "var(--line)", background: "var(--card)", color: "var(--ink)" }}
          >
            {IDENTITIES.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Trying to read</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            style={{ borderColor: "var(--line)", background: "var(--card)", color: "var(--ink)" }}
          >
            {TARGETS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={run}
        disabled={busy}
        className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {busy ? "Running…" : "Run the query"}
      </button>

      {error && (
        <p className="text-sm" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <pre
            className="overflow-x-auto rounded-md border p-3 text-xs"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            {result.sql}
          </pre>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <h2 className="mb-1 text-sm font-semibold">As the signed-in user</h2>
              <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
                public key, row level security applies
              </p>
              <p className="text-2xl font-semibold">{result.asUser.count} rows</p>
              {result.asUser.rows.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs" style={{ color: "var(--muted)" }}>
                  {result.asUser.rows.map((r) => (
                    <li key={r.id}>{r.name} — {r.status}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <h2 className="mb-1 text-sm font-semibold">As the service role</h2>
              <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
                server only, bypasses row level security
              </p>
              <p className="text-2xl font-semibold">{result.asServiceRole.count} rows</p>
            </div>
          </div>

          <p
            className="rounded-md border-l-4 py-2 pl-3 text-sm leading-relaxed"
            style={{ borderColor: leaked ? "var(--warn)" : "var(--accent)" }}
          >
            {result.verdict}
          </p>
        </div>
      )}
    </div>
  );
}
