// Journal Engine — Section 5 complete implementation
// RULES:
//   1. Never DELETE or UPDATE journal_entries / journal_lines
//   2. Every journal must balance: sum(debit) = sum(credit)
//   3. All entries include tenant_id
//   4. Spread income from symbol_config only
//   5. No unrealised P&L in journals
//   6. Corrections create new offsetting entries referencing original

import type { PoolClient } from 'pg';
import type { ReferenceType } from '../types/db';
import { getAccountIds, spreadIncomeAccount } from '../utils/accounts';

export interface JournalLineInput {
  accountCode: string;
  debit?: number;
  credit?: number;
  currency?: string;
  narration?: string;
}

export interface CreateJournalInput {
  tenantId: string;
  entryDate: string;
  referenceType: ReferenceType;
  referenceId?: string;
  narration: string;
  createdBy?: string;
  lines: JournalLineInput[];
}

// ── Core engine ───────────────────────────────────────────────────────────────

async function postJournal(db: PoolClient, input: CreateJournalInput): Promise<string> {
  const totalDebit  = input.lines.reduce((s, l) => s + (l.debit  || 0), 0);
  const totalCredit = input.lines.reduce((s, l) => s + (l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.000001) {
    throw new Error(
      `Journal imbalance [${input.referenceType}]: DR=${totalDebit.toFixed(6)} CR=${totalCredit.toFixed(6)}`
    );
  }

  const codes = input.lines.map(l => l.accountCode);
  const accountIds = await getAccountIds(db, input.tenantId, codes);

  const { rows: [entry] } = await db.query<{ id: string }>(
    `INSERT INTO journal_entries
       (tenant_id, entry_date, reference_type, reference_id, narration, status, created_by)
     VALUES ($1, $2, $3, $4, $5, 'POSTED', $6)
     RETURNING id`,
    [
      input.tenantId,
      input.entryDate,
      input.referenceType,
      input.referenceId ?? null,
      input.narration,
      input.createdBy ?? null,
    ]
  );

  for (const line of input.lines) {
    await db.query(
      `INSERT INTO journal_lines
         (tenant_id, journal_id, account_id, debit, credit, currency, narration)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.tenantId,
        entry.id,
        accountIds.get(line.accountCode),
        line.debit  ?? 0,
        line.credit ?? 0,
        line.currency ?? 'USD',
        line.narration ?? null,
      ]
    );
  }

  return entry.id;
}

// ── Section 5 event implementations ──────────────────────────────────────────

// TRADE CLOSE A-Book
// DR LP Account (1300)    = spread_income
//   CR Spread Income (41xx) = spread_income
export async function postTradeCloseABook(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  tradeId: string,
  spreadIncome: number,
  assetClass: string | null,
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'TRADE_CLOSE', referenceId: tradeId,
    narration, createdBy,
    lines: [
      { accountCode: '1300', debit:  spreadIncome },
      { accountCode: spreadIncomeAccount(assetClass), credit: spreadIncome },
    ],
  });
}

// TRADE CLOSE B-Book — client loses
// DR Client Payable (2100)    = |mt5_profit|
//   CR Spread Income B (4200) = spread_income
//   CR B-Book P&L Income(4300)= |mt5_profit| - spread_income
export async function postTradeCloseBBookLoss(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  tradeId: string,
  spreadIncome: number,
  mt5Profit: number,   // negative value (client lost)
  narration: string,
  createdBy?: string
): Promise<string> {
  const absLoss    = Math.abs(mt5Profit);
  const bbookGain  = round6(absLoss - spreadIncome);

  return postJournal(db, {
    tenantId, entryDate, referenceType: 'TRADE_CLOSE', referenceId: tradeId,
    narration, createdBy,
    lines: [
      { accountCode: '2100', debit:  absLoss    },
      { accountCode: '4200', credit: spreadIncome },
      { accountCode: '4300', credit: bbookGain    },
    ],
  });
}

// TRADE CLOSE B-Book — client profits
// DR Spread Income B (4200) = spread_income
// DR B-Book P&L Loss (5200) = mt5_profit
//   CR Client Payable (2100)= spread_income + mt5_profit
export async function postTradeCloseBBookProfit(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  tradeId: string,
  spreadIncome: number,
  mt5Profit: number,   // positive value (client profited)
  narration: string,
  createdBy?: string
): Promise<string> {
  const clientPayable = round6(mt5Profit + spreadIncome);

  return postJournal(db, {
    tenantId, entryDate, referenceType: 'TRADE_CLOSE', referenceId: tradeId,
    narration, createdBy,
    lines: [
      { accountCode: '4200', debit:  spreadIncome  },
      { accountCode: '5200', debit:  mt5Profit      },
      { accountCode: '2100', credit: clientPayable  },
    ],
  });
}

// SWAP EXPENSE — broker pays client (negative swap)
// DR Swap Expense (5300)
//   CR Client Payable (2100)
export async function postSwapExpense(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  accountId: string,
  swapAmount: number,   // absolute value
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'SWAP', referenceId: accountId,
    narration, createdBy,
    lines: [
      { accountCode: '5300', debit:  swapAmount },
      { accountCode: '2100', credit: swapAmount },
    ],
  });
}

// SWAP INCOME — broker charges client (positive swap)
// DR Client Payable (2100)
//   CR Swap Income (4500)
export async function postSwapIncome(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  accountId: string,
  swapAmount: number,   // absolute value
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'SWAP', referenceId: accountId,
    narration, createdBy,
    lines: [
      { accountCode: '2100', debit:  swapAmount },
      { accountCode: '4500', credit: swapAmount },
    ],
  });
}

// COMMISSION — charged with trade
// DR Client Payable (2100)
//   CR Commission Income (4400)
export async function postCommission(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  tradeId: string,
  commissionAmount: number,
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'TRADE_CLOSE', referenceId: tradeId,
    narration, createdBy,
    lines: [
      { accountCode: '2100', debit:  commissionAmount },
      { accountCode: '4400', credit: commissionAmount },
    ],
  });
}

// DEPOSIT — on payment approval
// DR Segregated Funds (1200)
//   CR Client Payable (2100)
export async function postDeposit(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  paymentId: string,
  amountUsd: number,
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'DEPOSIT', referenceId: paymentId,
    narration, createdBy,
    lines: [
      { accountCode: '1200', debit:  amountUsd },
      { accountCode: '2100', credit: amountUsd },
    ],
  });
}

// WITHDRAWAL — on payment approval
// DR Client Payable (2100)
//   CR Segregated Funds (1200)
export async function postWithdrawal(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  paymentId: string,
  amountUsd: number,
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'WITHDRAWAL', referenceId: paymentId,
    narration, createdBy,
    lines: [
      { accountCode: '2100', debit:  amountUsd },
      { accountCode: '1200', credit: amountUsd },
    ],
  });
}

// NEGATIVE BALANCE — EOD write-off
// DR NB Write-off (5500)
//   CR Client Payable (2100)
export async function postNegativeBalance(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  accountId: string,
  writeOffAmount: number,   // absolute value of negative balance
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'NEGATIVE_BALANCE', referenceId: accountId,
    narration, createdBy,
    lines: [
      { accountCode: '5500', debit:  writeOffAmount },
      { accountCode: '2100', credit: writeOffAmount },
    ],
  });
}

// IB COMMISSION — EOD per trade (up to 3 levels, single balanced entry)
// DR IB Commission Exp (5400)   = total across all levels
//   CR IB Payable (2200) L1     = level 1 amount
//   CR IB Payable (2200) L2     = level 2 amount  (if any)
//   CR IB Payable (2200) L3     = level 3 amount  (if any)
// Note: all IB levels use same payable account (2200); ledger detail in ib_commission_ledger
export async function postIBCommission(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  tradeId: string,
  levels: Array<{ ibId: string; amount: number; level: number }>,
  narration: string,
  createdBy?: string
): Promise<string> {
  const total = round6(levels.reduce((s, l) => s + l.amount, 0));

  const lines: JournalLineInput[] = [
    { accountCode: '5400', debit: total, narration: 'IB commission total' },
  ];

  for (const lvl of levels) {
    lines.push({
      accountCode: '2200',
      credit: round6(lvl.amount),
      narration: `IB level ${lvl.level} commission`,
    });
  }

  return postJournal(db, {
    tenantId, entryDate, referenceType: 'IB_COMMISSION', referenceId: tradeId,
    narration, createdBy, lines,
  });
}

// IB PAYOUT — on approval
// DR IB Payable (2200)
//   CR Operational Cash (1100)
export async function postIBPayout(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  ibId: string,
  amount: number,
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'IB_PAYOUT', referenceId: ibId,
    narration, createdBy,
    lines: [
      { accountCode: '2200', debit:  amount },
      { accountCode: '1100', credit: amount },
    ],
  });
}

// FX REVALUATION — EOD
// Gain: DR FX Reval Asset (1600)  /  CR FX Gain (4600)
// Loss: DR FX Loss (5700)         /  CR FX Reval Liability (2400)
export async function postFXRevaluation(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  amount: number,      // absolute value
  isGain: boolean,
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'FX_REVALUATION',
    narration, createdBy,
    lines: isGain
      ? [
          { accountCode: '1600', debit:  amount },
          { accountCode: '4600', credit: amount },
        ]
      : [
          { accountCode: '5700', debit:  amount },
          { accountCode: '2400', credit: amount },
        ],
  });
}

// TRADE CORRECTION — offsetting entry only, never modify original
// Creates a full reversal of the original journal, linked by reference_id
export async function postTradeCorrection(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  originalTradeId: string,
  lines: JournalLineInput[],   // reversed debit/credit of original lines
  narration: string,
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, referenceType: 'TRADE_CORRECTION',
    referenceId: originalTradeId,
    narration, createdBy, lines,
  });
}

// MT5 BALANCE ADJUSTMENT — requires CFO approval
// DR/CR Client Payable (2100) / Adjustment account (5800)
export async function postMT5Adjustment(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  mt5AccountId: string,
  amount: number,   // positive = credit to client, negative = debit from client
  narration: string,
  createdBy?: string
): Promise<string> {
  const abs = Math.abs(amount);
  const creditToClient = amount > 0;

  return postJournal(db, {
    tenantId, entryDate, referenceType: 'MT5_BALANCE_ADJUSTMENT',
    referenceId: mt5AccountId,
    narration, createdBy,
    lines: creditToClient
      ? [
          { accountCode: '5800', debit:  abs },
          { accountCode: '2100', credit: abs },
        ]
      : [
          { accountCode: '2100', debit:  abs },
          { accountCode: '5800', credit: abs },
        ],
  });
}

// ── Client Ledger helpers ─────────────────────────────────────────────────────

// Append a client_ledger row and return the new running balance.
// Must be called within the same transaction as the journal post.
export async function appendClientLedger(
  db: PoolClient,
  tenantId: string,
  mt5AccountId: string,
  entryType: string,
  amount: number,        // positive = credit to client, negative = debit
  currency: string,
  referenceId: string | null,
  referenceType: string | null,
  journalId: string,
  narration: string
): Promise<number> {
  // Get last running balance (lock row for update to prevent races)
  const { rows } = await db.query<{ balance_after: string }>(
    `SELECT balance_after
     FROM client_ledger
     WHERE mt5_account_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 1
     FOR UPDATE`,
    [mt5AccountId]
  );

  const prevBalance = rows[0] ? parseFloat(rows[0].balance_after) : 0;
  const newBalance  = round6(prevBalance + amount);

  await db.query(
    `INSERT INTO client_ledger
       (tenant_id, mt5_account_id, entry_type, amount, currency,
        reference_id, reference_type, balance_after, journal_id, narration)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      tenantId, mt5AccountId, entryType, amount, currency,
      referenceId, referenceType, newBalance, journalId, narration,
    ]
  );

  return newBalance;
}

// MANUAL JOURNAL — CFO / Senior Accountant free-form entry
// referenceType is always 'MANUAL'; caller supplies balanced lines
export async function postManualJournal(
  db: PoolClient,
  tenantId: string,
  entryDate: string,
  narration: string,
  lines: JournalLineInput[],
  createdBy?: string
): Promise<string> {
  return postJournal(db, {
    tenantId, entryDate, narration, createdBy,
    referenceType: 'MANUAL',
    lines,
  });
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
