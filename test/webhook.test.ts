import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Webhooks } from "../src/webhook.js";

const vectors = JSON.parse(
  readFileSync(fileURLToPath(new URL("./data/webhook-signatures.json", import.meta.url)), "utf8"),
) as {
  secret: string;
  now: number;
  tolerance_seconds: number;
  cases: { name: string; body: string; header: string; valid: boolean }[];
};

describe("webhook vectors", () => {
  const w = new Webhooks();
  for (const c of vectors.cases) {
    it(c.name, () => {
      let ok = true;
      let ev: { type?: string } | undefined;
      try {
        ev = w.verifyAt(c.body, c.header, vectors.secret, vectors.tolerance_seconds, vectors.now);
      } catch {
        ok = false;
      }
      expect(ok).toBe(c.valid);
      if (c.valid) expect(ev?.type).toBeTruthy();
    });
  }
});
