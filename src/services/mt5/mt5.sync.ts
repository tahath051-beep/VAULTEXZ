// MT5 EOD Trade Sync — implements the full sync pipeline per spec:
// 1. Read last_mt5_ticket from sync_jobs
// 2. Pull closed deals from bridge since that ticket
// 3. For each deal: validate → insert → spread calc → journals → client_ledger → IB commissions
// 4. Update last_mt5_ticket in sync_jobs
//
// Error handling:
//   DUPLICATE     → skip silently, log sync_error
//   MISSING_SYMBOL → hold trade, log sync_error
//   JOURNAL_FAIL  → retry 3x, then log sync_error (manual queue)

import type { PoolClient } from 'pg';
import { pool }              from '../../config/database';
import { getDeals }          from './mt5.bridge';
import { MT5DealType, MT5DealEntry } from './mt5.types';
import type { MT5Deal }      from './mt5.types';
import { calculateSpread }   from '../spread.service';
import {
  postTradeCloseABook,
  postTradeCloseBBookLoss,
  postTradeCloseBBookProfit,
  postCommission,
  postIBCommission,
  appendClientLedger,
} from '../journal.service';
import {
  calculateIBCommissions,
  insertIBCommissionLedger,
} from '../ib-commission.service';

export interface SyncTradesResult {
  inserted:  number;
  skipped:   number;   // duplicates
  failed:    number;   // unrecoverable errors
  maxTicket: number;
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function syncTrades(
  tenantId: string,
  eodDate: string
): Promise<SyncTradesResult> {
  const db = await pool.connect();
  try {
    const { jobId, lastTicket } = await initSyncJob(db, tenantId);

    const deals = await getDeals(lastTicket, eodDate);
    const closedDeals = deals.filter(
      d => (d.type === MT5DealType.BUY || d.type === MT5DealType.SELL)
        && d.entry === MT5DealEntry.OUT
    );

    let inserted  = 0;
    let skipped   = 0;
    let failed    = 0;
    let maxTicket = lastTicket;

    for (const deal of closedDeals) {
      maxTicket = Math.max(maxTicket, deal.ticket);
      const outcome = await processDeal(db, tenantId, jobId, eodDate, deal);
      if      (outcome === 'ok')  inserted++;
      else if (outcome === 'dup') skipped++;
      else                        failed++;
    }

    await db.query(
      `UPDATE sync_jobs
       SET status = 'COMPLETED', completed_at = NOW(),
           last_mt5_ticket = $3,
           records_synced  = records_synced + $4,
           records_failed  = records_failed + $5
       WHERE id = $1 AND tenant_id = $2`,
      [jobId, tenantId, maxTicket, inserted, failed]
    );

    return { inserted, skipped, failed, maxTicket };
  } catch (err) {
    await db.query(
      `UPDATE sync_jobs SET status = 'FAILED', completed_at = NOW()
       WHERE tenant_id = $1 AND job_type = 'TRADES' AND status = 'RUNNING'`,
      [tenantId]
    ).catch(() => {});
    throw err;
  } finally {
    db.release();
  }
}

// ── Deal processor ────────────────────────────────────────────────────────────

async function processDeal(
  db: PoolClient,
  tenantId: string,
  jobId: string,
  eodDate: string,
  deal: MT5Deal
): Promise<'ok' | 'dup' | 'error'> {
  // d. Validate mt5_login → get account metadata
  const accRes = await db.query<{
    id: string; book_type: 'A' | 'B'; client_id: string | null; currency: string;
  }>(
    `SELECT id, book_type, client_id, currency
     FROM mt5_accounts
     WHERE tenant_id = $1 AND mt5_login = $2 AND is_active = true`,
    [tenantId, deal.login]
  );

  if (!accRes.rowCount) {
    await logError(db, tenantId, jobId, deal.ticket, 'UNKNOWN',
      `MT5 login ${deal.login} not mapped to any mt5_account`, deal);
    return 'error';
  }
  const acct = accRes.rows[0];

  // c. Validate symbol + fetch spread config
  const symRes = await db.query<{
    markup_spread: string; lp_spread: string;
    pip_value_usd: string; asset_class: string | null;
  }>(
    `SELECT markup_spread, lp_spread, pip_value_usd, asset_class
     FROM symbol_config
     WHERE tenant_id = $1 AND symbol = $2 AND is_active = true
     ORDER BY effective_from DESC LIMIT 1`,
    [tenantId, deal.symbol]
  );

  if (!symRes.rowCount) {
    await logError(db, tenantId, jobId, deal.ticket, 'MISSING_SYMBOL',
      `Symbol ${deal.symbol} not found in symbol_config`, deal);
    return 'error';
  }
  const sym = symRes.rows[0];

  // f. Pre-calculate spread (pure function — safe outside transaction)
  const spread = calculateSpread(
    {
      markupSpread: parseFloat(sym.markup_spread),
      lpSpread:     parseFloat(sym.lp_spread),
      volume:       deal.volume,
      pipValueUsd:  parseFloat(sym.pip_value_usd),
    },
    acct.book_type,
    deal.profit
  );

  const direction = deal.type === MT5DealType.BUY ? 'BUY' : 'SELL';
  const narration = `${acct.book_type}-Book ${deal.symbol} ${direction} ${deal.volume}L ticket#${deal.ticket}`;

  // Retry loop — JOURNAL_FAIL retries up to 3x, then moves to manual queue
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await db.query('BEGIN');

      // e. Insert trade with spread data already set
      const tradeRes = await db.query<{ id: string }>(
        `INSERT INTO trades (
           tenant_id, mt5_account_id, mt5_ticket, symbol, direction,
           volume, open_price, close_price, open_time, close_time,
           mt5_profit, swap, commission, book_type,
           spread_income, lp_cost, bbook_pnl, net_broker_pnl,
           journal_posted
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,
           to_timestamp($9), to_timestamp($10),
           $11,$12,$13,$14,$15,$16,$17,$18, false
         ) RETURNING id`,
        [
          tenantId, acct.id, deal.ticket,
          deal.symbol, direction,
          deal.volume,
          deal.openPrice, deal.price,
          deal.openTime,  deal.time,
          deal.profit, deal.swap, deal.commission,
          acct.book_type,
          spread.spreadIncome, spread.lpCost, spread.bbookPnl, spread.netBrokerPnl,
        ]
      );
      const tradeId    = tradeRes.rows[0].id;
      const mt5Profit  = deal.profit;
      const commission = deal.commission;

      // g. Post trade journal (A-Book or B-Book)
      let journalId: string;
      if (acct.book_type === 'A') {
        journalId = await postTradeCloseABook(
          db, tenantId, eodDate, tradeId,
          spread.spreadIncome, sym.asset_class,
          `A-Book close: ${narration}`
        );
      } else {
        journalId = mt5Profit <= 0
          ? await postTradeCloseBBookLoss(
              db, tenantId, eodDate, tradeId,
              spread.spreadIncome, mt5Profit,
              `B-Book close (client loss): ${narration}`
            )
          : await postTradeCloseBBookProfit(
              db, tenantId, eodDate, tradeId,
              spread.spreadIncome, mt5Profit,
              `B-Book close (client profit): ${narration}`
            );
      }

      // Commission journal (separate entry if non-zero)
      if (Math.abs(commission) > 0.000001) {
        await postCommission(
          db, tenantId, eodDate, tradeId,
          Math.abs(commission), `Commission: ${narration}`
        );
      }

      // h. Update client_ledger — realised P&L
      await appendClientLedger(
        db, tenantId, acct.id,
        'TRADE_PNL', mt5Profit, acct.currency,
        tradeId, 'TRADE', journalId,
        `Realised P&L: ${narration}`
      );

      // Commission deducted from client ledger
      if (Math.abs(commission) > 0.000001) {
        await appendClientLedger(
          db, tenantId, acct.id,
          'COMMISSION', -Math.abs(commission), acct.currency,
          tradeId, 'TRADE', journalId,
          `Commission: ${narration}`
        );
      }

      // i. IB commissions — only if client is linked to an IB
      if (acct.client_id) {
        const ibComms = await calculateIBCommissions(
          db, tenantId, acct.client_id,
          deal.symbol, deal.volume, spread.spreadIncome, eodDate
        );
        if (ibComms.length > 0) {
          const ibJournalId = await postIBCommission(
            db, tenantId, eodDate, tradeId,
            ibComms.map(c => ({ ibId: c.ibId, amount: c.grossAmount, level: c.ibLevel })),
            `IB commission ticket#${deal.ticket} ${deal.symbol}`
          );
          await insertIBCommissionLedger(
            db, tenantId, tradeId, ibComms,
            nextMonthFirst(eodDate), ibJournalId
          );
        }
      }

      // j. Mark journal_posted = true
      await db.query(
        `UPDATE trades SET journal_posted = true WHERE id = $1 AND tenant_id = $2`,
        [tradeId, tenantId]
      );

      await db.query('COMMIT');
      return 'ok';

    } catch (err: any) {
      await db.query('ROLLBACK');

      // a. Duplicate ticket — skip silently
      if (err.code === '23505') {
        await logError(db, tenantId, jobId, deal.ticket, 'DUPLICATE',
          `Ticket ${deal.ticket} already exists`, null);
        return 'dup';
      }

      if (attempt < 3) {
        await sleep(500 * attempt);
        continue;
      }

      // After 3 failures: move to manual queue
      await logError(db, tenantId, jobId, deal.ticket, 'JOURNAL_FAILED',
        `Journal failed after 3 attempts: ${err.message}`, deal);
      return 'error';
    }
  }

  return 'error';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function initSyncJob(
  db: PoolClient,
  tenantId: string
): Promise<{ jobId: string; lastTicket: number }> {
  const prev = await db.query<{ last_mt5_ticket: number }>(
    `SELECT last_mt5_ticket FROM sync_jobs
     WHERE tenant_id = $1 AND job_type = 'TRADES' AND status = 'COMPLETED'
     ORDER BY completed_at DESC LIMIT 1`,
    [tenantId]
  );
  const lastTicket = prev.rows[0]?.last_mt5_ticket ?? 0;

  const job = await db.query<{ id: string }>(
    `INSERT INTO sync_jobs (tenant_id, job_type, status, started_at, last_mt5_ticket)
     VALUES ($1, 'TRADES', 'RUNNING', NOW(), $2)
     RETURNING id`,
    [tenantId, lastTicket]
  );

  return { jobId: job.rows[0].id, lastTicket };
}

async function logError(
  db: PoolClient,
  tenantId: string,
  jobId: string,
  ticket: number | null,
  type: string,
  message: string,
  raw: unknown
): Promise<void> {
  await db.query(
    `INSERT INTO sync_errors
       (tenant_id, sync_job_id, mt5_ticket, error_type, error_message, raw_data)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [tenantId, jobId, ticket, type, message, raw ? JSON.stringify(raw) : null]
  );
}

function nextMonthFirst(dateStr: string): string {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
