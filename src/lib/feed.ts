import { createHash } from "node:crypto";

export type FeedItem = {
  externalId: string;
  title: string;
  priceCents: number;
};

/** A deterministic fingerprint of the fields we store. */
export function contentHash(item: FeedItem) {
  return createHash("sha256")
    .update(`${item.title}\u0000${item.priceCents}`)
    .digest("hex");
}

/**
 * Stand-in for an MLS/partner XML feed. Real feeds are fetched over HTTP from
 * a fixed IP; the parsing boundary is the same either way, which is why the
 * importer takes FeedItem[] rather than a URL.
 */
export function sampleFeed(): FeedItem[] {
  return [
    { externalId: "NW-1041", title: "Sea-view apartment, 2 bed", priceCents: 34500000 },
    { externalId: "NW-1042", title: "Townhouse with courtyard", priceCents: 28900000 },
    { externalId: "NW-1043", title: "Studio near the old port", priceCents: 14750000 },
    { externalId: "NW-1044", title: "Villa with pool, 4 bed", priceCents: 98500000 },
  ];
}
