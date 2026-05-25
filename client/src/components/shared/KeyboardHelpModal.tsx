import { useEffect } from 'react';
import { X, Command } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Shortcut {
  keys: string[];
  descriptionKey: string;
  categoryKey: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['G', 'D'], descriptionKey: 'keyboard.shortcut.dashboard',   categoryKey: 'keyboard.navigation' },
  { keys: ['G', 'O'], descriptionKey: 'keyboard.shortcut.operations',  categoryKey: 'keyboard.navigation' },
  { keys: ['G', 'C'], descriptionKey: 'keyboard.shortcut.clients',     categoryKey: 'keyboard.navigation' },
  { keys: ['G', 'R'], descriptionKey: 'keyboard.shortcut.reports',     categoryKey: 'keyboard.navigation' },
  { keys: ['G', 'T'], descriptionKey: 'keyboard.shortcut.trades',      categoryKey: 'keyboard.navigation' },
  { keys: ['G', 'J'], descriptionKey: 'keyboard.shortcut.journals',    categoryKey: 'keyboard.navigation' },
  // Global
  { keys: ['⌘', 'K'], descriptionKey: 'keyboard.shortcut.search',      categoryKey: 'keyboard.global' },
  { keys: ['?'],       descriptionKey: 'keyboard.shortcut.shortcuts',   categoryKey: 'keyboard.global' },
  { keys: ['Esc'],     descriptionKey: 'keyboard.shortcut.close',       categoryKey: 'keyboard.global' },
  { keys: ['⌘', 'D'],  descriptionKey: 'keyboard.shortcut.darkMode',    categoryKey: 'keyboard.global' },
  // Operations
  { keys: ['N'],       descriptionKey: 'keyboard.shortcut.newOp',       categoryKey: 'keyboard.ops' },
  { keys: ['A'],       descriptionKey: 'keyboard.shortcut.approve',     categoryKey: 'keyboard.ops' },
  { keys: ['R'],       descriptionKey: 'keyboard.shortcut.reject',      categoryKey: 'keyboard.ops' },
];

interface KeyboardHelpModalProps {
  open: boolean;
  onClose: () => void;
}

function Key({ k }: { k: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-semibold text-foreground shadow-[0_1px_0_1px_hsl(var(--border))]">
      {k}
    </kbd>
  );
}

export function KeyboardHelpModal({ open, onClose }: KeyboardHelpModalProps) {
  const { t } = useTranslation();
  const categoryKeys = [...new Set(SHORTCUTS.map((s) => s.categoryKey))];
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Command className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">{t('keyboard.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 max-h-[60vh] overflow-y-auto divide-x divide-border">
          {categoryKeys.map((catKey) => (
            <div key={catKey} className="p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(catKey as Parameters<typeof t>[0])}</p>
              <div className="space-y-2.5">
                {SHORTCUTS.filter((s) => s.categoryKey === catKey).map((s) => (
                  <div key={s.descriptionKey} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-foreground/80">{t(s.descriptionKey as Parameters<typeof t>[0])}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k) => <Key key={k} k={k} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {t('keyboard.close')}
          </p>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            {t('action.close')}
          </button>
        </div>
      </div>
    </>
  );
}
