// Minimal type shims for dependencies whose type packages are unavailable
// offline (@types/ws) and Cloudflare runtime globals (no @cloudflare/workers-types).

declare module 'ws' {
  export const WebSocketServer: any;
  export class WebSocket {
    static readonly OPEN: number;
    readonly readyState: number;
    isAlive?: boolean;
    send(data: string): void;
    close(): void;
    terminate(): void;
    ping(): void;
    on(event: string, cb: (...args: any[]) => void): void;
    off(event: string, cb: (...args: any[]) => void): void;
  }
}

declare const WebSocketPair: new () => { 0: WebSocket; 1: WebSocket };
