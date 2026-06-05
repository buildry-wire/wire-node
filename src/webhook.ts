import { createHmac, timingSafeEqual } from "node:crypto";
import type { WireEvent } from "./types.js";

export const SIGNATURE_HEADER = "WirePayment-Signature";
export const DEFAULT_TOLERANCE_SECONDS = 300;

/** Thrown when a webhook signature does not verify. */
export class SignatureVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignatureVerificationError";
  }
}

/** Verifies inbound webhook signatures (HMAC-SHA256 over "<t>.<body>"). */
export class Webhooks {
  /** Verify a webhook and return the parsed event. `payload` is the raw body. */
  verify(payload: string | Buffer, header: string, secret: string, toleranceSeconds = DEFAULT_TOLERANCE_SECONDS): WireEvent {
    return this.verifyAt(payload, header, secret, toleranceSeconds, Math.floor(Date.now() / 1000));
  }

  /** verifyAt is the testable core taking an explicit `now` (unix seconds). */
  verifyAt(payload: string | Buffer, header: string, secret: string, toleranceSeconds: number, now: number): WireEvent {
    const { t, v1 } = parseHeader(header);
    if (t === undefined || !v1) throw new SignatureVerificationError("malformed signature header");
    if (Math.abs(now - t) > toleranceSeconds) throw new SignatureVerificationError("timestamp outside tolerance");

    const body = typeof payload === "string" ? Buffer.from(payload) : payload;
    const mac = createHmac("sha256", secret);
    mac.update(`${t}.`);
    mac.update(body);
    const expected = mac.digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new SignatureVerificationError("signature mismatch");
    }
    return JSON.parse(body.toString()) as WireEvent;
  }
}

function parseHeader(header: string): { t?: number; v1?: string } {
  let t: number | undefined;
  let v1: string | undefined;
  for (const part of header.split(",")) {
    const [k, val] = part.trim().split("=", 2);
    if (k === "t") {
      const n = Number.parseInt(val, 10);
      if (!Number.isFinite(n)) return {};
      t = n;
    } else if (k === "v1") {
      v1 = val;
    }
  }
  return { t, v1 };
}
