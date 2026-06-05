import { afterEach, describe, expect, it } from "vitest";
import { Wire } from "../src/client.js";
import { start } from "./server.js";

let close: (() => Promise<void>) | undefined;
afterEach(async () => {
  if (close) await close();
  close = undefined;
});

describe("resources", () => {
  it("creates a payment intent", async () => {
    const s = await start((m, p) => {
      expect(m).toBe("POST");
      expect(p).toBe("/v1/payment_intents");
      return { status: 200, json: { id: "pi_1", object: "payment_intent", amount: 50000, status: "requires_payment_method" } };
    });
    close = s.close;
    const wire = new Wire("sk_test_123", { baseURL: s.url, backoffMs: 1 });
    const pi = await wire.paymentIntents.create({ amount: 50000, currency: "MNT" });
    expect(pi.id).toBe("pi_1");
    expect(pi.status).toBe("requires_payment_method");
  });

  it("auto-paginates list()", async () => {
    const s = await start((_m, p) => {
      if (!p.includes("starting_after")) {
        return { status: 200, json: { object: "list", has_more: true, data: [{ id: "ch_1", object: "charge" }] } };
      }
      return { status: 200, json: { object: "list", has_more: false, data: [{ id: "ch_2", object: "charge" }] } };
    });
    close = s.close;
    const wire = new Wire("sk_test_123", { baseURL: s.url, backoffMs: 1 });
    const ids: string[] = [];
    for await (const ch of wire.charges.list({ limit: 1 })) ids.push(ch.id);
    expect(ids).toEqual(["ch_1", "ch_2"]);
  });

  it("deletes a webhook endpoint", async () => {
    const s = await start(() => ({ status: 200, json: { id: "we_1", object: "webhook_endpoint", deleted: true } }));
    close = s.close;
    const wire = new Wire("sk_test_123", { baseURL: s.url, backoffMs: 1 });
    const d = await wire.webhookEndpoints.delete("we_1");
    expect(d.deleted).toBe(true);
  });
});
