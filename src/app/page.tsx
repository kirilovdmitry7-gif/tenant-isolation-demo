import Link from "next/link";

const problems = [
  {
    title: "One customer sees another customer's data",
    body: "Two companies use your app. One of them changes a number in the address bar and is suddenly looking at the other company's projects. It is the most common leak in apps that were built quickly — and the most expensive one to explain to a customer.",
    cta: "Try to break in",
    href: "/proof",
  },
  {
    title: "Nightly imports that slowly make a mess",
    body: "Your app pulls listings, orders or prices from a partner every night. Built carelessly, every run rewrites everything: “last updated” stops meaning anything, and a hiccup halfway through leaves duplicates behind.",
    cta: "Run an import twice",
    href: "/portal#import",
  },
  {
    title: "Fake or doubled payment notifications",
    body: "When someone pays, the payment provider tells your app. If the app doesn’t check who is talking, anyone can send a fake “payment received” and unlock the product for free. And providers resend notifications — without a guard, one payment counts twice.",
    cta: "Send a fake one",
    href: "/portal#payments",
  },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          A working demo you can poke at
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Can your customers see each other&rsquo;s data?
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
          Apps built fast — with Lovable, Bolt, Cursor or a rushed sprint —
          usually look fine on screen. The trouble is underneath: the page hides
          other customers&rsquo; records, but the database will still hand them to
          anyone who asks it directly. You find out when a customer tells you.
        </p>
        <p className="max-w-2xl text-lg leading-relaxed">
          This demo lets you watch that problem <em>not</em> happen — and try to
          cause it yourself.
        </p>
        <Link
          href="/proof"
          className="inline-block rounded-md px-5 py-3 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          See it for yourself &rarr;
        </Link>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Three things that quietly go wrong in real apps</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {problems.map((p) => (
            <div
              key={p.title}
              className="flex flex-col rounded-lg border p-5"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            >
              <h3 className="mb-2 font-semibold">{p.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {p.body}
              </p>
              <Link href={p.href} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                {p.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section
        className="space-y-3 rounded-lg border p-6"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <h2 className="font-semibold">For the technical reader</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Next.js and Supabase (Postgres). Customer separation is enforced by the
          database itself through row level security, not by the page. Imports are
          keyed on the partner&rsquo;s own ids with a content hash, so an unchanged feed
          writes nothing. Webhooks are verified with an HMAC over the raw body, a
          time window and a ledger of events already seen.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Built with Claude Code under a written working agreement: two review
          agents (one for database changes, one that tries to break the access
          rules) and an automatic check that refuses any new table without
          protection. All of it is in the repository as files, not described here.
        </p>
        <a
          href="https://github.com/kirilovdmitry7-gif/tenant-isolation-demo"
          className="inline-block text-sm font-medium"
          style={{ color: "var(--accent)" }}
        >
          Read the code on GitHub &rarr;
        </a>
      </section>
    </div>
  );
}
