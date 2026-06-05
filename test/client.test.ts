import { afterEach, describe, expect, it } from "vitest";
import { Wire } from "../src/client.js";
import { WireError } from "../src/errors.js";
import { start } from "./server.js";

let close: (() => Promise<void>) | undefined;
afterEach(async () => {
  if (close) await close();
  close = undefined;
});

describe("Wire client", () => {
  it("sends auth and decodes", async () => {
    let auth = "";
    const s = await start((_m, _p, h) => {
      auth = String(h["authorization"] ?? "");
      return { status: 200, json: { id: "pi_1", object: "payment_intent", amount: 50000 } };
    });
    close = s.close;
    const wire = new Wire("sk_test_123", { baseURL: s.url, backoffMs: 1 });
    const pi = await wire.paymentIntents.retrieve("pi_1");
    expect(auth).toBe("Bearer sk_test_123");
    expect(pi.id).toBe("pi_1");
    expect(pi.amount).toBe(50000);
  });

  it("retries on 503", async () => {
    let n = 0;
    const s = await start(() => {
      n += 1;
      if (n < 3) return { status: 503, json: {} };
      return { status: 200, json: { id: "pi_1", object: "payment_intent" } };
    });
    close = s.close;
    const wire = new Wire("sk_test_123", { baseURL: s.url, maxRetries: 3, backoffMs: 1 });
    await wire.paymentIntents.retrieve("pi_1");
    expect(n).toBe(3);
  });

  it("does not retry on 400", async () => {
    let n = 0;
    const s = await start(() => {
      n += 1;
      return { status: 400, json: { error: { type: "invalid_request_error", message: "bad" } } };
    });
    close = s.close;
    const wire = new Wire("sk_test_123", { baseURL: s.url, maxRetries: 3, backoffMs: 1 });
    await expect(wire.paymentIntents.retrieve("x")).rejects.toBeInstanceOf(WireError);
    expect(n).toBe(1);
  });

  it("sends an idempotency key on POST", async () => {
    let key: string | string[] | undefined;
    const s = await start((_m, _p, h) => {
      key = h["idempotency-key"];
      return { status: 200, json: { id: "pi_1", object: "payment_intent" } };
    });
    close = s.close;
    const wire = new Wire("sk_test_123", { baseURL: s.url, backoffMs: 1 });
    await wire.paymentIntents.create({ amount: 1 });
    expect(key).toBeTruthy();
  });
});
