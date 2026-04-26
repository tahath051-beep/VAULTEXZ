// HTTP + WebSocket client for the MT5 Manager Bridge
// Bridge exposes:  GET /deals  GET /fx-rates  GET /equity  WS /stream

import WebSocket from 'ws';
import type { MT5Deal, MT5FxRate, MT5AccountEquity, MT5BalanceEvent } from './mt5.types';

const HOST   = process.env.MT5_BRIDGE_HOST   || 'localhost';
const PORT   = process.env.MT5_BRIDGE_PORT   || '9090';
const SECRET = process.env.MT5_BRIDGE_SECRET || '';
const BASE   = `http://${HOST}:${PORT}`;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  if (!res.ok) {
    throw new Error(`MT5 bridge error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// Pull closed deals since fromTicket (exclusive), optionally filtered to toDate (YYYY-MM-DD)
export async function getDeals(fromTicket: number, toDate?: string): Promise<MT5Deal[]> {
  const q = new URLSearchParams({ fromTicket: String(fromTicket) });
  if (toDate) q.set('toDate', toDate);
  return get<MT5Deal[]>(`/deals?${q}`);
}

// Mid-price snapshot of all active symbol FX rates
export async function getFxRates(): Promise<MT5FxRate[]> {
  return get<MT5FxRate[]>('/fx-rates');
}

// Per-account equity in account currency (used for reconciliation)
export async function getAccountEquities(): Promise<MT5AccountEquity[]> {
  return get<MT5AccountEquity[]>('/equity');
}

// Subscribe to real-time BALANCE events (deposits / withdrawals).
// Returns an unsubscribe function. Reconnects automatically on disconnect.
export function subscribeBalanceStream(
  onEvent: (event: MT5BalanceEvent) => void,
  onError?: (err: Error) => void
): () => void {
  const WS_URL = `ws://${HOST}:${PORT}/stream`;
  let   active = true;

  function connect(): WebSocket {
    const ws = new WebSocket(WS_URL, {
      headers: { Authorization: `Bearer ${SECRET}` },
    });

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'balance' }));
    });

    ws.on('message', (data: Buffer) => {
      try {
        const event = JSON.parse(data.toString()) as MT5BalanceEvent;
        if (typeof event.amount === 'number') onEvent(event);
      } catch {
        // ignore malformed frames
      }
    });

    ws.on('error', (err) => onError?.(err));

    ws.on('close', () => {
      if (active) setTimeout(connect, 5_000);
    });

    return ws;
  }

  let ws = connect();

  return () => {
    active = false;
    ws.removeAllListeners('close');
    ws.close();
  };
}
