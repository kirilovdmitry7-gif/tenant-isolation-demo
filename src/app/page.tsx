import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Access control you can watch work
        </h1>
        <p className="max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          Most portals say they keep customers apart. This one lets you try to
          break it. Pick an identity, aim a query at another tenant&rsquo;s data,
          and watch the database return nothing — while the same query run with
          the service role returns the rows, proving they exist and that the
          policy is what withheld them.
        </p>
        <Link
          href="/proof"
          className="inline-block rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          Try to read another tenant&rsquo;s data
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            h: "Isolation in the database",
            p: "Row level security on every customer-owned table. Changing an id in the URL, or calling the REST API directly, produces the same answer: zero rows.",
          },
          {
            h: "Imports that are safe to re-run",
            p: "A feed import keyed on (org, external id) with a content hash. Run it twice on an unchanged feed and the second run writes nothing.",
          },
          {
            h: "Webhooks that cannot be forged or replayed",
            p: "HMAC over the raw body, constant-time compare, timestamp window, and a unique event ledger so a retry never grants twice.",
          },
        ].map((c) => (
          <div
            key={c.h}
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <h2 className="mb-2 text-sm font-semibold">{c.h}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {c.p}
            </p>
          </div>
        ))}
      </section>

      <section
        className="rounded-lg border p-5"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <h2 className="mb-2 text-sm font-semibold">How this repository was built</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Written with Claude Code under a checked-in <code>CLAUDE.md</code>,
          two subagents (a migration reviewer and an access-policy auditor) and
          a pre-commit hook that refuses any migration creating a table without
          enabling row level security on it. The agent definitions and the hook
          are in the repository, not described in a paragraph.
        </p>
      </section>
    </div>
  );
}
