// Cloudflare Worker entry point: serves the static client (from the `assets`
// binding) and routes WebSocket upgrades to the GameServer Durable Object.

import { GameServer } from './GameServer';

export { GameServer };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route WebSocket upgrades to the game server Durable Object FIRST,
    // before the static-asset fallback (which would otherwise serve `/` as HTML).
    const upgrade = request.headers.get('Upgrade');
    if (upgrade && upgrade.toLowerCase() === 'websocket') {
      const id = env.GAME.idFromName('global');
      const stub = env.GAME.get(id);
      return stub.fetch(request);
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Serve static client assets (deployed alongside the worker).
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Biggie\u2019s House server is running.', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
