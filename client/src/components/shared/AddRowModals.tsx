import { useState } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useWorkbookStore } from '@/stores/workbook.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from '@/hooks/use-toast';
import { type OpType, type Category } from '@/lib/workbook';
import { cn } from '@/lib/utils';

const opTypes: { value: OpType; tone: string; icon: typeof ArrowDownLeft }[] = [
  { value: 'تعزيز',     tone: 'bg-success/10 text-success',         icon: ArrowDownLeft },
  { value: 'سحب',       tone: 'bg-destructive/10 text-destructive', icon: ArrowUpRight },
  { value: 'تحويل الى', tone: 'bg-accent text-accent-foreground',   icon: ArrowLeftRight },
  { value: 'تحويل من',  tone: 'bg-warning/10 text-warning',         icon: ArrowLeftRight },
];

const opLabelKey: Record<OpType, 'entries.op.deposit' | 'entries.op.withdraw' | 'entries.op.transferFrom' | 'entries.op.transferTo'> = {
  'تعزيز':      'entries.op.deposit',
  'سحب':        'entries.op.withdraw',
  'تحويل من':   'entries.op.transferFrom',
  'تحويل الى':  'entries.op.transferTo',
};

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- Add Entry ---------------- */
export function AddEntryButton() {
  const { t } = useTranslation();
  const accounts = useWorkbookStore((s) => s.accounts);
  const addEntry = useWorkbookStore((s) => s.addEntry);
  const [open, setOpen] = useState(false);

  const [date, setDate]               = useState(today());
  const [opType, setOpType]           = useState<OpType>('تعزيز');
  const [amount, setAmount]           = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [counterCode, setCounterCode] = useState('');
  const [currency, setCurrency]       = useState('USD');
  const [note, setNote]               = useState('');

  const reset = () => {
    setDate(today()); setOpType('تعزيز'); setAmount('');
    setAccountCode(''); setCounterCode(''); setCurrency('USD'); setNote('');
  };

  const canSubmit =
    !!date && !!amount && Number(amount) > 0 && accountCode && counterCode && accountCode !== counterCode;

  const submit = () => {
    if (!canSubmit) return;
    const res = addEntry({
      date, opType,
      amount: Number(amount),
      accountCode, counterAccountCode: counterCode,
      currency, note: note.trim() || undefined,
    });
    toast({ title: t('toast.entryAdded'), description: `#${res.ticket}` });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t('entries.newEntry')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.addEntry.title')}</DialogTitle>
          <DialogDescription>{t('modal.addEntry.desc')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="entry-date" className="text-xs">{t('field.date')}</Label>
              <Input id="entry-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entry-currency" className="text-xs">{t('field.currency')}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="entry-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="TRY">TRY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t('field.opType')}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {opTypes.map(({ value, tone, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOpType(value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border border-border/60 p-2.5 text-xs font-medium transition-all',
                    opType === value
                      ? 'border-primary/60 bg-primary/5 shadow-sm'
                      : 'hover:bg-accent/50',
                  )}
                >
                  <span className={cn('grid h-7 w-7 place-items-center rounded-lg', tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{t(opLabelKey[value])}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entry-amount" className="text-xs">{t('field.amount')}</Label>
            <Input
              id="entry-amount" type="number" min="0" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('field.account')}</Label>
              <Select value={accountCode} onValueChange={setAccountCode}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.code + a.name} value={a.code}>
                      {a.code} · {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('field.counter')}</Label>
              <Select value={counterCode} onValueChange={setCounterCode}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.code !== accountCode)
                    .map((a) => (
                      <SelectItem key={a.code + a.name + '-c'} value={a.code}>
                        {a.code} · {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entry-note" className="text-xs">{t('field.note')}</Label>
            <Input
              id="entry-note" type="text"
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder=""
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
          <Button variant="gradient" onClick={submit} disabled={!canSubmit}>{t('action.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Add Account ---------------- */
const categoryOptions: { value: Category; key: 'cat.funds'|'cat.banks'|'cat.clients'|'cat.suppliers'|'cat.partners'|'cat.staff'|'cat.revenue'|'cat.expenses'|'cat.debts'|'cat.platform' }[] = [
  { value: 'funds',     key: 'cat.funds' },
  { value: 'banks',     key: 'cat.banks' },
  { value: 'clients',   key: 'cat.clients' },
  { value: 'suppliers', key: 'cat.suppliers' },
  { value: 'partners',  key: 'cat.partners' },
  { value: 'staff',     key: 'cat.staff' },
  { value: 'revenue',   key: 'cat.revenue' },
  { value: 'expenses',  key: 'cat.expenses' },
  { value: 'debts',     key: 'cat.debts' },
];

export function AddAccountButton() {
  const { t } = useTranslation();
  const addAccount = useWorkbookStore((s) => s.addAccount);
  const [open, setOpen] = useState(false);

  const [code, setCode]       = useState('');
  const [name, setName]       = useState('');
  const [arabic, setArabic]   = useState('');
  const [category, setCategory] = useState<Category>('clients');
  const [currency, setCurrency] = useState('USD');

  const canSubmit = code.trim() && name.trim();

  const submit = () => {
    if (!canSubmit) return;
    addAccount({ code: code.trim(), name: name.trim(), arabic: arabic.trim() || undefined, category, currency });
    toast({ title: t('toast.accountAdded'), description: `${code} · ${name}` });
    setCode(''); setName(''); setArabic(''); setCategory('clients'); setCurrency('USD');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t('data.addAccount')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.addAccount.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-code" className="text-xs">{t('field.code')}</Label>
              <Input id="acc-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="12188" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('field.currency')}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="TRY">TRY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-name" className="text-xs">{t('field.name')}</Label>
            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Abu Omar" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-arabic" className="text-xs">{t('field.nameAr')}</Label>
            <Input id="acc-arabic" value={arabic} onChange={(e) => setArabic(e.target.value)} placeholder="ابو عمر" dir="rtl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('field.category')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{t(c.key)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
          <Button variant="gradient" onClick={submit} disabled={!canSubmit}>{t('action.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Add Opening Balance ---------------- */
export function AddOpeningButton() {
  const { t } = useTranslation();
  const addOpening = useWorkbookStore((s) => s.addOpening);
  const [open, setOpen] = useState(false);

  const [code, setCode]     = useState('');
  const [name, setName]     = useState('');
  const [arabic, setArabic] = useState('');
  const [opening, setOpening] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const canSubmit = code.trim() && name.trim();

  const submit = () => {
    if (!canSubmit) return;
    addOpening({
      code: code.trim(), name: name.trim(), arabic: arabic.trim() || undefined,
      opening: Number(opening) || 0,
      creditLimit: creditLimit ? Number(creditLimit) : undefined,
    });
    toast({ title: t('toast.openingAdded'), description: `${code} · ${name}` });
    setCode(''); setName(''); setArabic(''); setOpening(''); setCreditLimit('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t('opening.addOpening')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.addOpening.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="o-code" className="text-xs">{t('field.code')}</Label>
              <Input id="o-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="12188" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-name" className="text-xs">{t('field.name')}</Label>
              <Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Abu Omar" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-arabic" className="text-xs">{t('field.nameAr')}</Label>
            <Input id="o-arabic" value={arabic} onChange={(e) => setArabic(e.target.value)} dir="rtl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="o-open" className="text-xs">{t('field.openingBalance')}</Label>
              <Input id="o-open" type="number" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-credit" className="text-xs">{t('field.creditLimit')}</Label>
              <Input id="o-credit" type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="—" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
          <Button variant="gradient" onClick={submit} disabled={!canSubmit}>{t('action.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Add Voucher ---------------- */
export function AddVoucherButton({ accountCode }: { accountCode?: string }) {
  const { t } = useTranslation();
  const accounts = useWorkbookStore((s) => s.accounts);
  const addVoucher = useWorkbookStore((s) => s.addVoucher);
  const [open, setOpen] = useState(false);

  const [code, setCode]     = useState(accountCode ?? '');
  const [voucher, setVoucher] = useState('');

  const canSubmit = code && voucher && Number(voucher) > 0;

  const submit = () => {
    if (!canSubmit) return;
    addVoucher({ accountCode: code, voucherNumber: Number(voucher) });
    toast({ title: t('toast.voucherAdded'), description: `${code} · #${voucher}` });
    setVoucher('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t('vouchers.addVoucher')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.addVoucher.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('field.account')}</Label>
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.code + a.name} value={a.code}>{a.code} · {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-num" className="text-xs">{t('field.voucher')}</Label>
            <Input id="v-num" type="number" value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="0000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
          <Button variant="gradient" onClick={submit} disabled={!canSubmit}>{t('action.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Add FX Rate ---------------- */
export function AddRateButton() {
  const { t } = useTranslation();
  const addRate = useWorkbookStore((s) => s.addRate);
  const [open, setOpen] = useState(false);

  const [date, setDate] = useState(today());
  const [pair, setPair] = useState('USD/TRY');
  const [rate, setRate] = useState('');

  const canSubmit = date && rate && Number(rate) > 0;

  const submit = () => {
    if (!canSubmit) return;
    addRate({ date, rate: Number(rate) });
    toast({ title: t('toast.rateAdded'), description: `${pair} @ ${rate}` });
    setRate('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t('currency.addRate')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.addRate.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-date" className="text-xs">{t('field.date')}</Label>
              <Input id="r-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('field.pair')}</Label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD/TRY">USD/TRY</SelectItem>
                  <SelectItem value="EUR/TRY">EUR/TRY</SelectItem>
                  <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-rate" className="text-xs">{t('field.rate')}</Label>
            <Input id="r-rate" type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.0000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('action.cancel')}</Button>
          <Button variant="gradient" onClick={submit} disabled={!canSubmit}>{t('action.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
