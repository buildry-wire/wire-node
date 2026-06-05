# @buildry-wire/wire

Official TypeScript SDK for the [Wire](https://wire.mn) payment API. Zero runtime dependencies; works on Node 18+.

## Install
```bash
npm install @buildry-wire/wire
```

## Quickstart
```ts
import { Wire } from "@buildry-wire/wire";

const wire = new Wire("sk_live_...");

const pi = await wire.paymentIntents.create({ amount: 50000, currency: "MNT" }); // minor units
console.log(pi.id, pi.status);
```

## Auto-pagination
```ts
for await (const charge of wire.charges.list({ limit: 50 })) {
  console.log(charge.id);
}
```

## Webhook verification
```ts
import { Wire, SIGNATURE_HEADER } from "@buildry-wire/wire";

const wire = new Wire("sk_live_...");
// rawBody must be the unparsed request body (string or Buffer)
const event = wire.webhooks.verify(rawBody, req.headers[SIGNATURE_HEADER.toLowerCase()], endpointSecret);
console.log(event.type);
```

## Errors
```ts
import { WireError } from "@buildry-wire/wire";

try {
  await wire.paymentIntents.create({ amount: -1 });
} catch (e) {
  if (e instanceof WireError) console.log(e.code, e.requestId, e.statusCode);
}
```

## License
MIT
