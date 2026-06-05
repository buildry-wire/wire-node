import type { Wire } from "./client.js";
import type {
  Charge,
  Deleted,
  ListParams,
  PaymentIntent,
  PaymentIntentConfirmParams,
  PaymentIntentCreateParams,
  WebhookEndpoint,
  WebhookEndpointCreateParams,
  WebhookEndpointUpdateParams,
  WireEvent,
  WireList,
} from "./types.js";

/** paginate yields every item across pages, following has_more via starting_after. */
async function* paginate<T extends { id: string }>(
  client: Wire,
  path: string,
  params: ListParams | undefined,
): AsyncGenerator<T> {
  let after = params?.startingAfter ?? "";
  const limit = params?.limit ?? 0;
  for (;;) {
    const page = await client.request<WireList<T>>("GET", path, {
      query: { limit: limit || undefined, starting_after: after || undefined },
    });
    for (const item of page.data) {
      after = item.id;
      yield item;
    }
    if (!page.has_more || page.data.length === 0) return;
  }
}

export class PaymentIntents {
  constructor(private client: Wire) {}

  create(p: PaymentIntentCreateParams): Promise<PaymentIntent> {
    const { idempotencyKey, ...body } = p;
    return this.client.request("POST", "/v1/payment_intents", { body, idempotencyKey });
  }

  retrieve(id: string): Promise<PaymentIntent> {
    return this.client.request("GET", `/v1/payment_intents/${encodeURIComponent(id)}`);
  }

  confirm(id: string, p: PaymentIntentConfirmParams = {}): Promise<PaymentIntent> {
    const { idempotencyKey, ...body } = p;
    return this.client.request("POST", `/v1/payment_intents/${encodeURIComponent(id)}/confirm`, { body, idempotencyKey });
  }

  cancel(id: string): Promise<PaymentIntent> {
    return this.client.request("POST", `/v1/payment_intents/${encodeURIComponent(id)}/cancel`, { body: {} });
  }

  list(params?: ListParams): AsyncGenerator<PaymentIntent> {
    return paginate<PaymentIntent>(this.client, "/v1/payment_intents", params);
  }
}

export class Charges {
  constructor(private client: Wire) {}

  retrieve(id: string): Promise<Charge> {
    return this.client.request("GET", `/v1/charges/${encodeURIComponent(id)}`);
  }

  list(params?: ListParams): AsyncGenerator<Charge> {
    return paginate<Charge>(this.client, "/v1/charges", params);
  }
}

export class Events {
  constructor(private client: Wire) {}

  retrieve(id: string): Promise<WireEvent> {
    return this.client.request("GET", `/v1/events/${encodeURIComponent(id)}`);
  }

  list(params?: ListParams): AsyncGenerator<WireEvent> {
    return paginate<WireEvent>(this.client, "/v1/events", params);
  }
}

export class WebhookEndpoints {
  constructor(private client: Wire) {}

  create(p: WebhookEndpointCreateParams): Promise<WebhookEndpoint> {
    const { idempotencyKey, ...body } = p;
    return this.client.request("POST", "/v1/webhook_endpoints", { body, idempotencyKey });
  }

  retrieve(id: string): Promise<WebhookEndpoint> {
    return this.client.request("GET", `/v1/webhook_endpoints/${encodeURIComponent(id)}`);
  }

  update(id: string, p: WebhookEndpointUpdateParams): Promise<WebhookEndpoint> {
    const { idempotencyKey, ...body } = p;
    return this.client.request("POST", `/v1/webhook_endpoints/${encodeURIComponent(id)}`, { body, idempotencyKey });
  }

  delete(id: string): Promise<Deleted> {
    return this.client.request("DELETE", `/v1/webhook_endpoints/${encodeURIComponent(id)}`);
  }

  list(params?: ListParams): AsyncGenerator<WebhookEndpoint> {
    return paginate<WebhookEndpoint>(this.client, "/v1/webhook_endpoints", params);
  }
}
