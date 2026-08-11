import type { IncomingMessage, ServerResponse } from 'http';

type App = (req: IncomingMessage, res: ServerResponse) => void;

let appPromise: Promise<App> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!appPromise) {
      appPromise = import('../server/src/index.js').then((m) => m.default as App);
    }
    const app = await appPromise;
    return app(req, res);
  } catch (e: unknown) {
    const err = e as Error;
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('FUNCTION LOAD ERROR:\n\n' + (err?.stack || String(err)));
  }
}
