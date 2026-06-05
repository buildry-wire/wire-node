import { createServer, type Server } from "node:http";

export type Handler = (
  method: string,
  path: string,
  headers: Record<string, string | string[] | undefined>,
  body: string,
) => { status: number; json: unknown };

export async function start(handler: Handler): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      const { status, json } = handler(req.method ?? "", req.url ?? "", req.headers, body);
      const data = JSON.stringify(json);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(data);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
