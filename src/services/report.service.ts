// Report generation service
// PDF: PDFKit     → for regulatory/client-facing reports
// Excel: ExcelJS  → for accountant working files
// Storage: S3     → uploadReport() returns S3 key

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { uploadReport } from '../config/storage';
import type { DailyReports } from '../jobs/eod/steps/step-13-generate-reports';

export async function generatePDFReport(
  tenantId: string,
  date: string,
  reportType: string,
  reports: DailyReports
): Promise<string> {
  const doc    = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   resolve);
    doc.on('error', reject);

    doc.fontSize(18).text(`${reportType} — ${date}`, { align: 'center' });
    doc.moveDown();

    if (reportType === 'pnl') {
      const pnl = reports.pnlStatement;
      doc.fontSize(14).text('P&L Statement');
      doc.fontSize(10);

      doc.text('REVENUE');
      for (const r of pnl.revenue) {
        doc.text(`  ${r.code} ${r.name}`, { continued: true });
        doc.text(`${r.balance.toFixed(2)}`, { align: 'right' });
      }
      doc.text(`Total Revenue: ${pnl.totalRevenue.toFixed(2)}`, { align: 'right' });

      doc.moveDown().text('EXPENSES');
      for (const e of pnl.expenses) {
        doc.text(`  ${e.code} ${e.name}`, { continued: true });
        doc.text(`${e.balance.toFixed(2)}`, { align: 'right' });
      }
      doc.text(`Total Expenses: ${pnl.totalExpenses.toFixed(2)}`, { align: 'right' });
      doc.moveDown().fontSize(12)
        .text(`Net P&L: ${pnl.netPnL.toFixed(2)}`, { align: 'right' });
    }

    if (reportType === 'balance_sheet') {
      doc.fontSize(14).text('Balance Sheet').fontSize(10);
      for (const row of reports.balanceSheet) {
        doc.text(`  [${row.type}] ${row.code} ${row.name}`, { continued: true });
        doc.text(`${row.balance.toFixed(2)}`, { align: 'right' });
      }
    }

    doc.end();
  });

  const buffer = Buffer.concat(chunks);
  return uploadReport(tenantId, date, reportType, 'pdf', buffer);
}

export async function generateExcelReport(
  tenantId: string,
  date: string,
  reports: DailyReports
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Forex Accounting SaaS';
  wb.created  = new Date();

  // P&L Sheet
  const pnlSheet = wb.addWorksheet('P&L Statement');
  pnlSheet.columns = [
    { header: 'Code',    key: 'code',    width: 10 },
    { header: 'Account', key: 'name',    width: 40 },
    { header: 'Balance', key: 'balance', width: 18 },
  ];
  pnlSheet.addRows([
    ...reports.pnlStatement.revenue.map(r => ({ ...r, balance: Number(r.balance.toFixed(6)) })),
    { code: '', name: 'TOTAL REVENUE',  balance: reports.pnlStatement.totalRevenue  },
    { code: '', name: '',               balance: '' },
    ...reports.pnlStatement.expenses.map(e => ({ ...e, balance: Number(e.balance.toFixed(6)) })),
    { code: '', name: 'TOTAL EXPENSES', balance: reports.pnlStatement.totalExpenses },
    { code: '', name: 'NET P&L',        balance: reports.pnlStatement.netPnL        },
  ]);

  // Balance Sheet
  const bsSheet = wb.addWorksheet('Balance Sheet');
  bsSheet.columns = [
    { header: 'Type',    key: 'type',    width: 12 },
    { header: 'Code',    key: 'code',    width: 10 },
    { header: 'Account', key: 'name',    width: 40 },
    { header: 'Balance', key: 'balance', width: 18 },
  ];
  bsSheet.addRows(reports.balanceSheet.map(r => ({
    ...r, balance: Number(r.balance.toFixed(6)),
  })));

  // Client Ledger Summary
  const clSheet = wb.addWorksheet('Client Ledger');
  clSheet.columns = [
    { header: 'MT5 Login',  key: 'mt5Login',    width: 14 },
    { header: 'Client',     key: 'clientName',  width: 30 },
    { header: 'Currency',   key: 'currency',    width: 10 },
    { header: 'Balance',    key: 'balance',     width: 18 },
  ];
  clSheet.addRows(reports.clientLedgerSummary);

  // IB Commission Report
  const ibSheet = wb.addWorksheet('IB Commissions');
  ibSheet.columns = [
    { header: 'IB Code',    key: 'ibCode',          width: 14 },
    { header: 'Name',       key: 'ibName',          width: 30 },
    { header: 'Level',      key: 'level',           width: 8  },
    { header: 'Commission', key: 'totalCommission', width: 18 },
    { header: 'Status',     key: 'status',          width: 12 },
  ];
  ibSheet.addRows(reports.ibCommissionReport);

  // Exposure Report
  const expSheet = wb.addWorksheet('Exposure');
  const exp = reports.exposureReport;
  expSheet.addRows([
    ['Book',  'Volume', 'Spread Income', 'LP Cost / B-Book P&L'],
    ['A-Book', exp.aBookVolume, exp.aBookSpreadIncome, exp.aBookLpCost],
    ['B-Book', exp.bBookVolume, exp.bBookSpreadIncome, exp.bBookPnl],
  ]);

  const buffer = await wb.xlsx.writeBuffer() as Buffer;
  return uploadReport(tenantId, date, 'daily_reports', 'xlsx', buffer);
}
