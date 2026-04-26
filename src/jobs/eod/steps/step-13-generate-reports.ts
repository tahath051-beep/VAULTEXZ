// Step 13: Generate daily reports (data layer — rendering handled by API layer)
// Reports: P&L Statement, Balance Sheet, Client Ledger Summary,
//          IB Commission Report, Reconciliation Report, Exposure Report (A/B Book)

import type { EODContext, StepResult } from '../../../types/eod';

export interface DailyReports {
  pnlStatement:       PnLStatement;
  balanceSheet:       BalanceSheetRow[];
  clientLedgerSummary: ClientLedgerSummaryRow[];
  ibCommissionReport: IBCommissionRow[];
  reconciliationReport: ReconReport;
  exposureReport:     ExposureReport;
}

interface PnLStatement {
  date:          string;
  revenue:       AccountBalance[];
  expenses:      AccountBalance[];
  totalRevenue:  number;
  totalExpenses: number;
  netPnL:        number;
}

interface AccountBalance { code: string; name: string; balance: number; }
interface BalanceSheetRow { type: string; code: string; name: string; balance: number; }
interface ClientLedgerSummaryRow {
  mt5Login: number; clientName: string; currency: string; balance: number;
}
interface IBCommissionRow {
  ibCode: string; ibName: string; level: number;
  totalCommission: number; status: string;
}
interface ReconReport {
  date: string; mt5Equity: number; systemEquity: number;
  difference: number; status: string;
}
interface ExposureReport {
  aBookVolume: number; aBookSpreadIncome: number; aBookLpCost: number;
  bBookVolume: number; bBookSpreadIncome: number; bBookPnl: number;
}

export async function step13GenerateReports(ctx: EODContext): Promise<StepResult & { reports: DailyReports }> {
  const start  = Date.now();
  const errors: string[] = [];

  const [pnl, bs, cl, ib, recon, exp] = await Promise.all([
    getPnLStatement(ctx),
    getBalanceSheet(ctx),
    getClientLedgerSummary(ctx),
    getIBCommissions(ctx),
    getReconReport(ctx),
    getExposureReport(ctx),
  ]).catch(err => { errors.push(`Report generation failed: ${err}`); return [null,null,null,null,null,null]; });

  const reports: DailyReports = {
    pnlStatement:        pnl        as PnLStatement,
    balanceSheet:        bs         as BalanceSheetRow[],
    clientLedgerSummary: cl         as ClientLedgerSummaryRow[],
    ibCommissionReport:  ib         as IBCommissionRow[],
    reconciliationReport: recon     as ReconReport,
    exposureReport:      exp        as ExposureReport,
  };

  return {
    step: 13,
    name: 'Generate Reports',
    success: errors.length === 0,
    recordsProcessed: 6,
    errors,
    durationMs: Date.now() - start,
    reports,
  };
}

async function getPnLStatement(ctx: EODContext): Promise<PnLStatement> {
  const { rows } = await ctx.db.query<{
    type: string; code: string; name: string; balance: string;
  }>(
    `SELECT coa.type, coa.code, coa.name,
            COALESCE(s.closing_balance, 0) AS balance
     FROM chart_of_accounts coa
     LEFT JOIN eod_snapshots s
       ON s.account_id = coa.id AND s.snapshot_date = $2
     WHERE coa.tenant_id = $1
       AND coa.type IN ('REVENUE','EXPENSE')
       AND coa.is_active = true
       AND coa.parent_id IS NOT NULL
     ORDER BY coa.code`,
    [ctx.tenantId, ctx.eodDate]
  );

  const revenue  = rows.filter(r => r.type === 'REVENUE').map(r => ({
    code: r.code, name: r.name, balance: parseFloat(r.balance),
  }));
  const expenses = rows.filter(r => r.type === 'EXPENSE').map(r => ({
    code: r.code, name: r.name, balance: parseFloat(r.balance),
  }));
  const totalRevenue  = revenue.reduce((s, r) => s + r.balance, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.balance, 0);

  return {
    date: ctx.eodDate, revenue, expenses,
    totalRevenue, totalExpenses,
    netPnL: round2(totalRevenue - totalExpenses),
  };
}

async function getBalanceSheet(ctx: EODContext): Promise<BalanceSheetRow[]> {
  const { rows } = await ctx.db.query<{
    type: string; code: string; name: string; balance: string;
  }>(
    `SELECT coa.type, coa.code, coa.name,
            COALESCE(s.closing_balance, 0) AS balance
     FROM chart_of_accounts coa
     LEFT JOIN eod_snapshots s
       ON s.account_id = coa.id AND s.snapshot_date = $2
     WHERE coa.tenant_id = $1
       AND coa.type IN ('ASSET','LIABILITY','EQUITY')
       AND coa.is_active = true
       AND coa.parent_id IS NOT NULL
     ORDER BY coa.code`,
    [ctx.tenantId, ctx.eodDate]
  );
  return rows.map(r => ({
    type: r.type, code: r.code, name: r.name, balance: parseFloat(r.balance),
  }));
}

async function getClientLedgerSummary(ctx: EODContext): Promise<ClientLedgerSummaryRow[]> {
  const { rows } = await ctx.db.query<{
    mt5_login: number; full_name: string; currency: string; balance_after: string;
  }>(
    `SELECT DISTINCT ON (cl.mt5_account_id)
       a.mt5_login, c.full_name, a.currency, cl.balance_after
     FROM client_ledger cl
     JOIN mt5_accounts a ON a.id = cl.mt5_account_id
     JOIN clients c ON c.id = a.client_id
     WHERE cl.tenant_id = $1
     ORDER BY cl.mt5_account_id, cl.created_at DESC, cl.id DESC`,
    [ctx.tenantId]
  );
  return rows.map(r => ({
    mt5Login: r.mt5_login, clientName: r.full_name,
    currency: r.currency, balance: parseFloat(r.balance_after),
  }));
}

async function getIBCommissions(ctx: EODContext): Promise<IBCommissionRow[]> {
  const { rows } = await ctx.db.query<{
    ib_code: string; full_name: string; ib_level: number;
    total: string; status: string;
  }>(
    `SELECT ib.ib_code, ib.full_name, icl.ib_level,
            SUM(icl.gross_amount) AS total, icl.status
     FROM ib_commission_ledger icl
     JOIN ibs ib ON ib.id = icl.ib_id
     WHERE icl.tenant_id = $1
       AND icl.created_at::date = $2
     GROUP BY ib.ib_code, ib.full_name, icl.ib_level, icl.status
     ORDER BY icl.ib_level, ib.ib_code`,
    [ctx.tenantId, ctx.eodDate]
  );
  return rows.map(r => ({
    ibCode: r.ib_code, ibName: r.full_name, level: r.ib_level,
    totalCommission: parseFloat(r.total), status: r.status,
  }));
}

async function getReconReport(ctx: EODContext): Promise<ReconReport> {
  const { rows: [r] } = await ctx.db.query<{
    mt5_total_equity: string; system_total_equity: string;
    difference: string; status: string;
  }>(
    `SELECT mt5_total_equity, system_total_equity, difference, status
     FROM daily_reconciliation
     WHERE tenant_id = $1 AND recon_date = $2`,
    [ctx.tenantId, ctx.eodDate]
  );
  return {
    date: ctx.eodDate,
    mt5Equity:    parseFloat(r?.mt5_total_equity    ?? '0'),
    systemEquity: parseFloat(r?.system_total_equity ?? '0'),
    difference:   parseFloat(r?.difference          ?? '0'),
    status:       r?.status ?? 'UNKNOWN',
  };
}

async function getExposureReport(ctx: EODContext): Promise<ExposureReport> {
  const { rows: [r] } = await ctx.db.query<{
    a_vol: string; a_spread: string; a_lp: string;
    b_vol: string; b_spread: string; b_pnl: string;
  }>(
    `SELECT
       SUM(CASE WHEN book_type='A' THEN volume::numeric  ELSE 0 END) AS a_vol,
       SUM(CASE WHEN book_type='A' THEN spread_income    ELSE 0 END) AS a_spread,
       SUM(CASE WHEN book_type='A' THEN lp_cost          ELSE 0 END) AS a_lp,
       SUM(CASE WHEN book_type='B' THEN volume::numeric  ELSE 0 END) AS b_vol,
       SUM(CASE WHEN book_type='B' THEN spread_income    ELSE 0 END) AS b_spread,
       SUM(CASE WHEN book_type='B' THEN bbook_pnl        ELSE 0 END) AS b_pnl
     FROM trades
     WHERE tenant_id = $1
       AND close_time::date = $2
       AND journal_posted = true`,
    [ctx.tenantId, ctx.eodDate]
  );
  return {
    aBookVolume:      parseFloat(r?.a_vol    ?? '0'),
    aBookSpreadIncome:parseFloat(r?.a_spread ?? '0'),
    aBookLpCost:      parseFloat(r?.a_lp     ?? '0'),
    bBookVolume:      parseFloat(r?.b_vol    ?? '0'),
    bBookSpreadIncome:parseFloat(r?.b_spread ?? '0'),
    bBookPnl:         parseFloat(r?.b_pnl    ?? '0'),
  };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
