/** A typed error returned by the Wire API. */
export class WireError extends Error {
  type: string;
  code?: string;
  param?: string;
  requestId?: string;
  docUrl?: string;
  operatorDeclineCode?: string;
  statusCode?: number;

  constructor(
    message: string,
    opts: {
      type?: string;
      code?: string;
      param?: string;
      requestId?: string;
      docUrl?: string;
      operatorDeclineCode?: string;
      statusCode?: number;
    } = {},
  ) {
    super(message);
    this.name = "WireError";
    this.type = opts.type ?? "api_error";
    this.code = opts.code;
    this.param = opts.param;
    this.requestId = opts.requestId;
    this.docUrl = opts.docUrl;
    this.operatorDeclineCode = opts.operatorDeclineCode;
    this.statusCode = opts.statusCode;
  }

  override toString(): string {
    return `WireError: ${this.message} (type=${this.type}, code=${this.code}, status=${this.statusCode}, request_id=${this.requestId})`;
  }
}

/** Decode the Wire error envelope; fall back to a generic error. */
export function parseError(status: number, body: string): WireError {
  try {
    const env = JSON.parse(body) as { error?: Record<string, string> };
    if (env.error) {
      const e = env.error;
      return new WireError(e.message ?? "request failed", {
        type: e.type,
        code: e.code,
        param: e.param,
        requestId: e.request_id,
        docUrl: e.doc_url,
        operatorDeclineCode: e.operator_decline_code,
        statusCode: status,
      });
    }
  } catch {
    // fall through
  }
  return new WireError(`unexpected response (status ${status})`, {
    type: "api_error",
    statusCode: status,
  });
}
