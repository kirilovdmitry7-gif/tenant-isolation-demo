"use client";

import { useState } from "react";

type Row = { id: string; name: string; status: string };
type Result = {
  sql: string;
  identity: string;
  target: string;
  sameOrg: boolean;
  asUser: { rows: Row[]; count: number; error: string | null };
  asServiceRole: { rows: Row[]; count: number; error: string | null };
  verdict: string;
};

const WHO = [
  { id: "northwind", label: "Northwind Studio (client)" },
  { id: "acme", label: "Acme Coffee Co (client)" },
  { id: "admin", label: "Northwind Studio (admin)" },
];
const WHAT = [
  { id: "acme", label: "Acme Coffee Co’s projects" },
  { id: "northwind", label: "Northwind Studio’s projects" },
];

const card = { borderColor: "var(--line)", background: "var(--card)" };

function List({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1 text-sm" style={{ color: "var(--muted)" }}>
      {rows.map((r) => (
        <li key={r.id}>• {r.name}</li>
      ))}
    </ul>
  );
}

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
      if (!res.ok) setError(json.error ?? "Something went wrong on the server.");
      else setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const leaked = result && !result.sameOrg && result.asUser.count > 0;
  const blocked = result && !result.sameOrg && result.asUser.count === 0;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Try to read someone else&rsquo;s data</h1>
        <p className="max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          Imagine one app used by two companies: <strong style={{ color: "var(--ink)" }}>Northwind Studio</strong>,
          a video production agency, and <strong style={{ color: "var(--ink)" }}>Acme Coffee Co</strong>, a café
          chain. Each must see only its own projects — never the other&rsquo;s.
        </p>
        <p className="max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          Pick who you are and whose projects you want to open, then press the
          button. The exact same request runs twice:
        </p>
        <ul className="max-w-2xl space-y-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>As you</strong> — the way the app, the browser, or anyone
            poking at the app directly would ask.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>With the master key</strong> — which ignores all
            protection. It never leaves the server; here it is used only to prove the data really exists.
          </li>
        </ul>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">You are signed in as</span>
          <select
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            style={{ ...card, color: "var(--ink)" }}
          >
            {WHO.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">You want to open</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            style={{ ...card, color: "var(--ink)" }}
          >
            {WHAT.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={run}
        disabled={busy}
        className="rounded-md px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {busy ? "Asking the database…" : "Try it"}
      </button>

      {error && (
        <p className="text-sm" style={{ color: "var(--warn)" }}>{error}</p>
      )}

      {result && (
        <div className="space-y-5">
          <div
            className="rounded-lg border-l-4 p-5"
            style={{ ...card, borderLeftColor: leaked ? "var(--warn)" : "var(--accent)" }}
          >
            <p className="text-xl font-semibold">
              {leaked
                ? "Leak: another company’s data came back."
                : blocked
                ? "Blocked. You got nothing."
                : "Allowed. These are your own projects."}
            </p>
            <p className="mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
              {leaked
                ? "This would be a real security problem. In this demo it should never happen."
                : blocked
                ? `${result.target.replace(/'s.*$/, "")}’s projects are right there in the database — the master key sees ${result.asServiceRole.count} of them. But when you asked as ${result.identity.replace(/^.*— /, "")}, the database itself refused to hand them over. Not the screen, not a hidden button: the database. That is why changing a link, opening the browser’s developer tools or calling the app directly does not help either.`
                : "Same request, but this time the projects belong to you, so the database returns them. Blocking everything is easy; the point is to block exactly the right things."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-5" style={card}>
              <p className="text-sm font-medium">What you got</p>
              <p className="mt-1 text-3xl font-semibold">
                {result.asUser.count} {result.asUser.count === 1 ? "project" : "projects"}
              </p>
              <List rows={result.asUser.rows} />
            </div>
            <div className="rounded-lg border p-5" style={card}>
              <p className="text-sm font-medium">What actually exists (master key)</p>
              <p className="mt-1 text-3xl font-semibold">
                {result.asServiceRole.count} {result.asServiceRole.count === 1 ? "project" : "projects"}
              </p>
              <List rows={result.asServiceRole.rows} />
            </div>
          </div>

          <details className="rounded-lg border p-4 text-sm" style={card}>
            <summary className="cursor-pointer font-medium">Technical details</summary>
            <p className="mt-3" style={{ color: "var(--muted)" }}>
              The query sent both times, filtered to the chosen company. Row level
              security on the <code>projects</code> table compares the row&rsquo;s
              company with the signed-in user&rsquo;s memberships before anything is returned.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-md border p-3 text-xs" style={{ borderColor: "var(--line)" }}>
              {result.sql}
            </pre>
            <p className="mt-3" style={{ color: "var(--muted)" }}>{result.verdict}</p>
          </details>
        </div>
      )}
    </div>
  );
}
