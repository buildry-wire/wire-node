export interface PaymentIntent {
  id: string;
  object: "payment_intent";
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  automatic_operator: boolean;
  allowed_operators: string[];
  selected_operator: string | null;
  next_action: Record<string, unknown> | null;
  metadata: Record<string, string>;
  livemode: boolean;
  created: number;
  expires_at: number | null;
}

export interface Charge {
  id: string;
  object: "charge";
  payment_intent: string;
  operator: string;
  operator_charge_id: string | null;
  status: string;
  amount: number;
  fee: number;
  amount_refunded: number;
  failure_code: string | null;
  failure_message: string | null;
  livemode: boolean;
  created: number;
}

export interface WireEvent {
  id: string;
  object: "event";
  type: string;
  api_version: string;
  data: Record<string, unknown>;
  livemode: boolean;
  created: number;
}

export interface WebhookEndpoint {
  id: string;
  object: "webhook_endpoint";
  url: string;
  enabled_events: string[];
  status: string;
  secret?: string;
  livemode: boolean;
  created: number;
}

export interface Deleted {
  id: string;
  object: string;
  deleted: boolean;
}

export interface WireList<T> {
  object: "list";
  data: T[];
  has_more: boolean;
}

export interface ListParams {
  limit?: number;
  startingAfter?: string;
}

export interface PaymentIntentCreateParams {
  amount: number;
  currency?: string;
  automatic_operator?: boolean;
  allowed_operators?: string[];
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface PaymentIntentConfirmParams {
  return_url?: string;
  idempotencyKey?: string;
}

export interface WebhookEndpointCreateParams {
  url: string;
  enabled_events?: string[];
  idempotencyKey?: string;
}

export interface WebhookEndpointUpdateParams {
  url?: string;
  enabled_events?: string[];
  status?: string;
  idempotencyKey?: string;
}
