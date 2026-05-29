export type CoaCategory = 'header' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'off-balance';
export type NormalBalance = 'debit' | 'credit';

export interface CoaAccount {
  code: string;
  name_en: string;
  name_ar: string;
  category: CoaCategory;
  parent?: string;
  normal_balance?: NormalBalance;
  is_system?: boolean;
}

export const COA_ACCOUNTS: CoaAccount[] = [
  // ── 1000 ASSETS ──────────────────────────────────────────────────────────────
  { code: '1000', name_en: 'Assets',                           name_ar: 'الأصول',                           category: 'header' },

  { code: '1100', name_en: 'Cash & Vault',                     name_ar: 'النقد والصندوق',                   category: 'header',      parent: '1000' },
  { code: '1110', name_en: 'Main Cash USD',                    name_ar: 'الصندوق الرئيسي USD',              category: 'asset',       parent: '1100', normal_balance: 'debit',  is_system: true },
  { code: '1111', name_en: 'Cash EUR',                         name_ar: 'الصندوق EUR',                      category: 'asset',       parent: '1100', normal_balance: 'debit' },
  { code: '1112', name_en: 'Cash TRY',                         name_ar: 'الصندوق TRY',                      category: 'asset',       parent: '1100', normal_balance: 'debit' },

  { code: '1200', name_en: 'Bank Accounts',                    name_ar: 'الحسابات البنكية',                 category: 'header',      parent: '1000' },
  { code: '1210', name_en: 'Company Bank',                     name_ar: 'بنك الشركة',                       category: 'header',      parent: '1200' },
  { code: '1211', name_en: 'Company Bank USD',                 name_ar: 'بنك الشركة USD',                   category: 'asset',       parent: '1210', normal_balance: 'debit' },
  { code: '1212', name_en: 'Company Bank EUR',                 name_ar: 'بنك الشركة EUR',                   category: 'asset',       parent: '1210', normal_balance: 'debit' },
  { code: '1213', name_en: 'Company Bank TRY',                 name_ar: 'بنك الشركة TRY',                   category: 'asset',       parent: '1210', normal_balance: 'debit' },
  { code: '1220', name_en: 'ZIRAAT Bank',                      name_ar: 'بنك زراعات',                       category: 'header',      parent: '1200' },
  { code: '1221', name_en: 'ZIRAAT Bank USD',                  name_ar: 'بنك زراعات USD',                   category: 'asset',       parent: '1220', normal_balance: 'debit' },
  { code: '1222', name_en: 'ZIRAAT Bank EUR',                  name_ar: 'بنك زراعات EUR',                   category: 'asset',       parent: '1220', normal_balance: 'debit' },
  { code: '1223', name_en: 'ZIRAAT Bank TRY',                  name_ar: 'بنك زراعات TRY',                   category: 'asset',       parent: '1220', normal_balance: 'debit' },
  { code: '1241', name_en: 'Money Transfer Offices',           name_ar: 'مكاتب الحوالات',                   category: 'asset',       parent: '1200', normal_balance: 'debit' },
  { code: '1242', name_en: 'Transfer Agents Accounts',         name_ar: 'حسابات وكلاء الحوالات',            category: 'asset',       parent: '1200', normal_balance: 'debit' },
  { code: '1243', name_en: 'Western Union',                    name_ar: 'ويسترن يونيون',                    category: 'asset',       parent: '1200', normal_balance: 'debit' },
  { code: '1244', name_en: 'MoneyGram',                        name_ar: 'موني جرام',                        category: 'asset',       parent: '1200', normal_balance: 'debit' },
  { code: '1245', name_en: 'Local Exchange Offices',           name_ar: 'مكاتب الصرافة المحلية',            category: 'asset',       parent: '1200', normal_balance: 'debit' },

  { code: '1300', name_en: 'Liquidity Providers',              name_ar: 'مزودو السيولة',                    category: 'header',      parent: '1000' },
  { code: '1310', name_en: 'LP Main Balance',                  name_ar: 'رصيد مزود السيولة الرئيسي',        category: 'asset',       parent: '1300', normal_balance: 'debit',  is_system: true },
  { code: '1311', name_en: 'LP Margin',                        name_ar: 'هامش مزود السيولة',                category: 'asset',       parent: '1300', normal_balance: 'debit',  is_system: true },
  { code: '1312', name_en: 'LP Floating PnL',                  name_ar: 'أرباح وخسائر عائمة LP',            category: 'asset',       parent: '1300', normal_balance: 'debit',  is_system: true },
  { code: '1313', name_en: 'LP Realized PnL',                  name_ar: 'أرباح وخسائر محققة LP',            category: 'asset',       parent: '1300', normal_balance: 'debit',  is_system: true },
  { code: '1314', name_en: 'LP Swap',                          name_ar: 'مبادلة مزود السيولة',              category: 'asset',       parent: '1300', normal_balance: 'debit',  is_system: true },
  { code: '1315', name_en: 'LP Commission',                    name_ar: 'عمولة مزود السيولة',               category: 'asset',       parent: '1300', normal_balance: 'debit',  is_system: true },

  { code: '1400', name_en: 'B-Book Accounts',                  name_ar: 'حسابات B-Book',                    category: 'header',      parent: '1000' },
  { code: '1410', name_en: 'B-Book Floating PnL',              name_ar: 'أرباح وخسائر B-Book العائمة',      category: 'asset',       parent: '1400', normal_balance: 'debit',  is_system: true },
  { code: '1411', name_en: 'B-Book Realized PnL',              name_ar: 'أرباح وخسائر B-Book المحققة',      category: 'asset',       parent: '1400', normal_balance: 'debit',  is_system: true },
  { code: '1412', name_en: 'B-Book Exposure EUR/USD',          name_ar: 'تعرض B-Book يورو/دولار',           category: 'asset',       parent: '1400', normal_balance: 'debit',  is_system: true },
  { code: '1413', name_en: 'B-Book Exposure Gold',             name_ar: 'تعرض B-Book الذهب',               category: 'asset',       parent: '1400', normal_balance: 'debit',  is_system: true },
  { code: '1414', name_en: 'B-Book Exposure Crypto',           name_ar: 'تعرض B-Book الكريبتو',             category: 'asset',       parent: '1400', normal_balance: 'debit',  is_system: true },

  { code: '1500', name_en: 'Settlement & Reconciliation',      name_ar: 'حسابات التسوية والمطابقة',         category: 'header',      parent: '1000' },
  { code: '1510', name_en: 'MT5 Reconciliation',               name_ar: 'مطابقة MT5',                       category: 'asset',       parent: '1500', normal_balance: 'debit',  is_system: true },
  { code: '1511', name_en: 'Wallet Reconciliation',            name_ar: 'مطابقة المحافظ',                   category: 'asset',       parent: '1500', normal_balance: 'debit',  is_system: true },
  { code: '1512', name_en: 'LP Reconciliation',                name_ar: 'مطابقة مزود السيولة',              category: 'asset',       parent: '1500', normal_balance: 'debit',  is_system: true },
  { code: '1513', name_en: 'Payment Provider Reconciliation',  name_ar: 'مطابقة مزود الدفع',                category: 'asset',       parent: '1500', normal_balance: 'debit',  is_system: true },

  { code: '1600', name_en: 'Fixed Assets',                     name_ar: 'الأصول الثابتة',                  category: 'header',      parent: '1000' },
  { code: '1610', name_en: 'Computers',                        name_ar: 'أجهزة كمبيوتر',                   category: 'asset',       parent: '1600', normal_balance: 'debit' },
  { code: '1611', name_en: 'Servers',                          name_ar: 'سيرفرات',                          category: 'asset',       parent: '1600', normal_balance: 'debit' },
  { code: '1612', name_en: 'Furniture & Fixtures',             name_ar: 'أثاث وتجهيزات',                   category: 'asset',       parent: '1600', normal_balance: 'debit' },
  { code: '1613', name_en: 'Software Licenses',                name_ar: 'تراخيص برمجيات',                  category: 'asset',       parent: '1600', normal_balance: 'debit' },
  { code: '1690', name_en: 'Accumulated Depreciation',         name_ar: 'مجمع الإهلاك',                    category: 'asset',       parent: '1600', normal_balance: 'credit', is_system: true },

  // ── 2000 LIABILITIES ─────────────────────────────────────────────────────────
  { code: '2000', name_en: 'Liabilities',                      name_ar: 'الخصوم',                           category: 'header' },

  { code: '2100', name_en: 'Client Wallets',                   name_ar: 'محافظ العملاء',                    category: 'liability',   parent: '2000', normal_balance: 'credit', is_system: true },

  { code: '2200', name_en: 'IB Wallets',                       name_ar: 'محافظ IB',                         category: 'header',      parent: '2000' },
  { code: '2201', name_en: 'IB Earned Commission',             name_ar: 'عمولات IB المكتسبة',               category: 'liability',   parent: '2200', normal_balance: 'credit', is_system: true },
  { code: '2202', name_en: 'IB Pending Commission',            name_ar: 'عمولات IB المعلقة',                category: 'liability',   parent: '2200', normal_balance: 'credit', is_system: true },
  { code: '2203', name_en: 'IB Paid Commission',               name_ar: 'عمولات IB المدفوعة',               category: 'liability',   parent: '2200', normal_balance: 'credit', is_system: true },

  { code: '2300', name_en: 'MT5 Accounts',                     name_ar: 'حسابات MT5',                       category: 'header',      parent: '2000' },
  { code: '2310', name_en: 'MT5 Clients Deposit/Withdrawal',   name_ar: 'إيداع/سحب عملاء MT5',              category: 'liability',   parent: '2300', normal_balance: 'credit', is_system: true },
  { code: '2320', name_en: 'MT5 IB Deposit/Withdrawal',        name_ar: 'إيداع/سحب IB MT5',                 category: 'liability',   parent: '2300', normal_balance: 'credit', is_system: true },

  { code: '2400', name_en: 'Bonus Accounts',                   name_ar: 'حسابات البونص',                    category: 'header',      parent: '2000' },
  { code: '2410', name_en: 'Trading Bonus',                    name_ar: 'بونص التداول',                     category: 'liability',   parent: '2400', normal_balance: 'credit' },
  { code: '2411', name_en: 'Credit Bonus',                     name_ar: 'بونص الائتمان',                    category: 'liability',   parent: '2400', normal_balance: 'credit' },

  { code: '2500', name_en: 'Settlement Accounts',              name_ar: 'حسابات التسوية',                   category: 'header',      parent: '2000' },
  { code: '2510', name_en: 'Daily Settlement',                 name_ar: 'التسوية اليومية',                  category: 'liability',   parent: '2500', normal_balance: 'credit', is_system: true },
  { code: '2511', name_en: 'Client Settlement',                name_ar: 'تسوية العملاء',                    category: 'liability',   parent: '2500', normal_balance: 'credit', is_system: true },
  { code: '2512', name_en: 'LP Settlement',                    name_ar: 'تسوية مزود السيولة',               category: 'liability',   parent: '2500', normal_balance: 'credit', is_system: true },

  { code: '2600', name_en: 'Payroll & Accruals',               name_ar: 'الرواتب والالتزامات',              category: 'header',      parent: '2000' },
  { code: '2610', name_en: 'Accrued Salaries',                 name_ar: 'رواتب مستحقة',                     category: 'liability',   parent: '2600', normal_balance: 'credit' },

  // ── 3000 EQUITY ──────────────────────────────────────────────────────────────
  { code: '3000', name_en: 'Equity',                           name_ar: 'حقوق الملكية',                     category: 'header' },

  { code: '3100', name_en: 'Capital',                          name_ar: 'رأس المال',                        category: 'header',      parent: '3000' },
  { code: '3110', name_en: 'Partners Capital',                 name_ar: 'رأس مال الشركاء',                  category: 'equity',      parent: '3100', normal_balance: 'credit' },

  { code: '3200', name_en: 'Retained Earnings',                name_ar: 'الأرباح المحتجزة',                 category: 'header',      parent: '3000' },
  { code: '3210', name_en: 'Retained Earnings Balance',        name_ar: 'رصيد الأرباح المحتجزة',            category: 'equity',      parent: '3200', normal_balance: 'credit', is_system: true },

  { code: '3300', name_en: 'Current Year Earnings',            name_ar: 'نتائج السنة الحالية',              category: 'header',      parent: '3000' },
  { code: '3310', name_en: 'Current Year P&L',                 name_ar: 'أرباح وخسائر السنة الحالية',       category: 'equity',      parent: '3300', normal_balance: 'credit', is_system: true },

  { code: '3400', name_en: 'Profit Distribution',              name_ar: 'توزيعات الأرباح',                  category: 'header',      parent: '3000' },
  { code: '3410', name_en: 'Dividend Payable',                 name_ar: 'توزيعات مستحقة الدفع',             category: 'equity',      parent: '3400', normal_balance: 'credit' },

  // ── 4000 REVENUE ─────────────────────────────────────────────────────────────
  { code: '4000', name_en: 'Revenue',                          name_ar: 'الإيرادات',                        category: 'header' },

  { code: '4100', name_en: 'B-Book Revenue',                   name_ar: 'إيرادات B-Book',                   category: 'header',      parent: '4000' },
  { code: '4110', name_en: 'Internal Dealing Profit',          name_ar: 'أرباح الصفقات الداخلية',           category: 'revenue',     parent: '4100', normal_balance: 'credit', is_system: true },
  { code: '4111', name_en: 'Client Loss Revenue',              name_ar: 'إيرادات خسائر العملاء',            category: 'revenue',     parent: '4100', normal_balance: 'credit', is_system: true },
  { code: '4112', name_en: 'Markup Spread Revenue',            name_ar: 'إيرادات الفارق المضاف',            category: 'revenue',     parent: '4100', normal_balance: 'credit', is_system: true },

  { code: '4200', name_en: 'A-Book Revenue',                   name_ar: 'إيرادات A-Book',                   category: 'header',      parent: '4000' },
  { code: '4210', name_en: 'Hedge Profit',                     name_ar: 'أرباح التحوط',                     category: 'revenue',     parent: '4200', normal_balance: 'credit', is_system: true },
  { code: '4211', name_en: 'LP Rebate',                        name_ar: 'خصم مزود السيولة',                 category: 'revenue',     parent: '4200', normal_balance: 'credit', is_system: true },
  { code: '4212', name_en: 'Spread Sharing',                   name_ar: 'مشاركة الفارق',                    category: 'revenue',     parent: '4200', normal_balance: 'credit', is_system: true },

  { code: '4300', name_en: 'Fees & Commission Revenue',        name_ar: 'إيرادات الرسوم والعمولات',         category: 'header',      parent: '4000' },
  { code: '4310', name_en: 'Withdrawal Fees',                  name_ar: 'رسوم السحب',                       category: 'revenue',     parent: '4300', normal_balance: 'credit' },
  { code: '4311', name_en: 'Deposit Fees',                     name_ar: 'رسوم الإيداع',                     category: 'revenue',     parent: '4300', normal_balance: 'credit' },

  // ── 5000 EXPENSES ────────────────────────────────────────────────────────────
  { code: '5000', name_en: 'Expenses',                         name_ar: 'المصاريف',                         category: 'header' },

  { code: '5100', name_en: 'Operating Expenses',               name_ar: 'مصاريف التشغيل',                   category: 'header',      parent: '5000' },
  { code: '5110', name_en: 'Rent',                             name_ar: 'إيجارات',                          category: 'expense',     parent: '5100', normal_balance: 'debit' },
  { code: '5111', name_en: 'Internet & Utilities',             name_ar: 'إنترنت وكهرباء',                   category: 'expense',     parent: '5100', normal_balance: 'debit' },
  { code: '5112', name_en: 'Hosting & Servers',                name_ar: 'استضافة وسيرفرات',                 category: 'expense',     parent: '5100', normal_balance: 'debit' },
  { code: '5113', name_en: 'MT5 Licenses',                     name_ar: 'تراخيص MT5',                       category: 'expense',     parent: '5100', normal_balance: 'debit' },
  { code: '5114', name_en: 'CRM Licenses',                     name_ar: 'تراخيص CRM',                       category: 'expense',     parent: '5100', normal_balance: 'debit' },

  { code: '5200', name_en: 'Employee Expenses',                name_ar: 'مصاريف الموظفين',                  category: 'header',      parent: '5000' },
  { code: '5210', name_en: 'Salaries',                         name_ar: 'رواتب',                            category: 'expense',     parent: '5200', normal_balance: 'debit' },
  { code: '5211', name_en: 'Bonuses',                          name_ar: 'مكافآت',                           category: 'expense',     parent: '5200', normal_balance: 'debit' },

  { code: '5300', name_en: 'Marketing Expenses',               name_ar: 'مصاريف التسويق',                   category: 'header',      parent: '5000' },
  { code: '5310', name_en: 'Advertising',                      name_ar: 'إعلانات',                          category: 'expense',     parent: '5300', normal_balance: 'debit' },
  { code: '5311', name_en: 'IB Commissions',                   name_ar: 'عمولات IB',                        category: 'expense',     parent: '5300', normal_balance: 'debit' },

  { code: '5400', name_en: 'Financial Expenses',               name_ar: 'مصاريف مالية',                     category: 'header',      parent: '5000' },
  { code: '5410', name_en: 'Transfer Fees',                    name_ar: 'رسوم التحويل',                     category: 'expense',     parent: '5400', normal_balance: 'debit' },
  { code: '5411', name_en: 'Payment Provider Fees',            name_ar: 'رسوم مزودي الدفع',                 category: 'expense',     parent: '5400', normal_balance: 'debit' },
  { code: '5412', name_en: 'Blockchain Fees',                  name_ar: 'رسوم الشبكات',                     category: 'expense',     parent: '5400', normal_balance: 'debit' },

  { code: '5500', name_en: 'Liquidity Provider Expenses',      name_ar: 'مصاريف مزودي السيولة',             category: 'header',      parent: '5000' },
  { code: '5510', name_en: 'Spread Costs',                     name_ar: 'تكاليف الفارق',                    category: 'expense',     parent: '5500', normal_balance: 'debit',  is_system: true },
  { code: '5511', name_en: 'Swap Costs',                       name_ar: 'تكاليف المبادلة',                  category: 'expense',     parent: '5500', normal_balance: 'debit',  is_system: true },
  { code: '5512', name_en: 'Slippage Costs',                   name_ar: 'تكاليف الانزلاق السعري',           category: 'expense',     parent: '5500', normal_balance: 'debit',  is_system: true },

  // ── 9000 OFF-BALANCE ─────────────────────────────────────────────────────────
  { code: '9000', name_en: 'Off-Balance Accounts',             name_ar: 'الحسابات الرقابية',                category: 'header' },

  { code: '9100', name_en: 'Open Exposure',                    name_ar: 'التعرض المفتوح',                   category: 'header',      parent: '9000' },
  { code: '9110', name_en: 'Net Open Exposure',                name_ar: 'صافي التعرض المفتوح',              category: 'off-balance', parent: '9100', is_system: true },
  { code: '9111', name_en: 'EUR/USD Exposure',                 name_ar: 'تعرض يورو/دولار',                  category: 'off-balance', parent: '9110', is_system: true },
  { code: '9112', name_en: 'Gold Exposure',                    name_ar: 'تعرض الذهب',                       category: 'off-balance', parent: '9110', is_system: true },
  { code: '9113', name_en: 'Crypto Exposure',                  name_ar: 'تعرض الكريبتو',                    category: 'off-balance', parent: '9110', is_system: true },

  { code: '9200', name_en: 'Margin Monitoring',                name_ar: 'مراقبة الهامش',                    category: 'header',      parent: '9000' },
  { code: '9210', name_en: 'Used Margin',                      name_ar: 'الهامش المستخدم',                  category: 'off-balance', parent: '9200', is_system: true },
  { code: '9211', name_en: 'Free Margin',                      name_ar: 'الهامش الحر',                      category: 'off-balance', parent: '9200', is_system: true },
  { code: '9212', name_en: 'Margin Level',                     name_ar: 'مستوى الهامش',                     category: 'off-balance', parent: '9200', is_system: true },

  { code: '9300', name_en: 'Equity Monitoring',                name_ar: 'مراقبة الرصيد',                    category: 'header',      parent: '9000' },
  { code: '9310', name_en: 'Client Floating Equity',           name_ar: 'رصيد العملاء العائم',              category: 'off-balance', parent: '9300', is_system: true },
  { code: '9311', name_en: 'Total Floating PnL',               name_ar: 'إجمالي الأرباح والخسائر العائمة', category: 'off-balance', parent: '9300', is_system: true },
  { code: '9312', name_en: 'Unrealized Profit',                name_ar: 'الأرباح غير المحققة',              category: 'off-balance', parent: '9300', is_system: true },
  { code: '9313', name_en: 'Unrealized Loss',                  name_ar: 'الخسائر غير المحققة',              category: 'off-balance', parent: '9300', is_system: true },

  { code: '9400', name_en: 'Bonus Monitoring',                 name_ar: 'مراقبة البونص',                    category: 'header',      parent: '9000' },
  { code: '9410', name_en: 'Bonus Issued',                     name_ar: 'البونص الممنوح',                   category: 'off-balance', parent: '9400', is_system: true },
  { code: '9411', name_en: 'Bonus Locked',                     name_ar: 'البونص المقفل',                    category: 'off-balance', parent: '9400', is_system: true },
  { code: '9412', name_en: 'Bonus Released',                   name_ar: 'البونص المُفرج عنه',               category: 'off-balance', parent: '9400', is_system: true },
];

export const ROOT_CODES = ['1000', '2000', '3000', '4000', '5000', '9000'];

export function getChildren(parentCode: string): CoaAccount[] {
  return COA_ACCOUNTS.filter((a) => a.parent === parentCode);
}

export function countLeaves(code: string): number {
  const direct = getChildren(code);
  if (direct.length === 0) return 1;
  return direct.reduce((sum, child) => sum + countLeaves(child.code), 0);
}

export function countByCategory(cat: CoaCategory): number {
  return COA_ACCOUNTS.filter((a) => a.category === cat).length;
}
