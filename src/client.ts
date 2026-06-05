import { randomBytes } from "node:crypto";
import { parseError, WireError } from "./errors.js";
import { Charges, Events, PaymentIntents, WebhookEndpoints } from "./resources.js";
import { Webhooks } from "./webhook.js";

export const DEFAULT_BASE_URL = "https://api.wire.mn";

export interface WireOptions {
  baseURL?: string;
  timeoutMs?: number;
  maxRetries?: number;
  backoffMs?: number;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  idempotencyKey?: string;
}

/** Wire is the API client. Construct it with an API key (sk_live_...). */
export class Wire {
  private apiKey: string;
  private baseURL: string;
  private timeoutMs: number;
  private maxRetries: number;
  private backoffMs: number;
  private fetchImpl: typeof fetch;

  readonly paymentIntents: PaymentIntents;
  readonly charges: Charges;
  readonly events: Events;
  readonly webhookEndpoints: WebhookEndpoints;
  readonly webhooks: Webhooks;

  constructor(apiKey: string, opts: WireOptions = {}) {
    this.apiKey = apiKey;
    this.baseURL = (opts.baseURL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.maxRetries = opts.maxRetries ?? 2;
    this.backoffMs = opts.backoffMs ?? 500;
    this.fetchImpl = opts.fetch ?? fetch;

    this.paymentIntents = new PaymentIntents(this);
    this.charges = new Charges(this);
    this.events = new Events(this);
    this.webhookEndpoints = new WebhookEndpoints(this);
    this.webhooks = new Webhooks();
  }

  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    let url = this.baseURL + path;
    if (opts.query) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== "" && v !== 0) qs.set(k, String(v));
      }
      const s = qs.toString();
      if (s) url += `?${s}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    let bodyStr: string | undefined;
    if (opts.body !== undefined) {
      bodyStr = JSON.stringify(opts.body);
      headers["Content-Type"] = "application/json";
    }
    if (method === "POST") {
      headers["Idempotency-Key"] = opts.idempotencyKey ?? newIdempotencyKey();
    }

    for (let attempt = 0; ; attempt++) {
      let resp: Response;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
          resp = await this.fetchImpl(url, { method, headers, body: bodyStr, signal: ctrl.signal });
        } finally {
          clearTimeout(timer);
        }
      } catch (e) {
        if (attempt < this.maxRetries) {
          await sleep(this.backoffMs * 2 ** attempt);
          continue;
        }
        throw new WireError(`request failed: ${(e as Error).message}`, { type: "api_error" });
      }

      if ((resp.status === 429 || resp.status >= 500) && attempt < this.maxRetries) {
        const ra = parseRetryAfter(resp.headers.get("retry-after"));
        await sleep(ra || this.backoffMs * 2 ** attempt);
        continue;
      }

      const text = await resp.text();
      if (resp.ok) {
        return (text ? JSON.parse(text) : {}) as T;
      }
      throw parseError(resp.status, text);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfter(h: string | null): number {
  if (!h) return 0;
  const n = Number.parseInt(h, 10);
  return Number.isFinite(n) ? n * 1000 : 0;
}

function newIdempotencyKey(): string {
  return "idk_" + randomBytes(16).toString("hex");
}
