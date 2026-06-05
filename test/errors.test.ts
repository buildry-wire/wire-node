import { describe, expect, it } from "vitest";
import { WireError, parseError } from "../src/errors.js";

describe("parseError", () => {
  it("parses the envelope", () => {
    const body =
      '{"error":{"type":"invalid_request_error","code":"amount_invalid","message":"amount must be positive","param":"amount","request_id":"req_123"}}';
    const err = parseError(400, body);
    expect(err).toBeInstanceOf(WireError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("amount_invalid");
    expect(err.param).toBe("amount");
    expect(err.requestId).toBe("req_123");
    expect(String(err)).toContain("amount must be positive");
  });

  it("falls back on non-json", () => {
    const err = parseError(500, "not json");
    expect(err).toBeInstanceOf(WireError);
    expect(err.statusCode).toBe(500);
  });
});
