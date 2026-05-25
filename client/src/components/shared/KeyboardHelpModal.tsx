import { useEffect } from 'react';
import { X, Command } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['G', 'D'], description: 'Go to Dashboard',        category: 'Navigation' },
  { keys: ['G', 'O'], description: 'Go to Operations',       category: 'Navigation' },
  { keys: ['G', 'C'], description: 'Go to Clients',          category: 'Navigation' },
  { keys: ['G', 'R'], description: 'Go to Reports',          category: 'Navigation' },
  { keys: ['G', 'T'], description: 'Go to Trades',           category: 'Navigation' },
  { keys: ['G', 'J'], description: 'Go to Journals',         category: 'Navigation' },
  // Global
  { keys: ['⌘', 'K'], description: 'Universal search',       category: 'Global' },
  { keys: ['?'],       description: 'Show keyboard shortcuts', category: 'Global' },
  { keys: ['Esc'],     description: 'Close dialog / panel',   category: 'Global' },
  { keys: ['⌘', 'D'],  description: 'Toggle dark mode',      category: 'Global' },
  // Operations
  { keys: ['N'],       description: 'New operation request',  category: 'Operations' },
  { keys: ['A'],       description: 'Approve selected',       category: 'Operations' },
  { keys: ['R'],       description: 'Reject selected',        category: 'Operations' },
];

const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

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
            <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
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
          {categories.map((cat) => (
            <div key={cat} className="p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cat}</p>
              <div className="space-y-2.5">
                {SHORTCUTS.filter((s) => s.category === cat).map((s) => (
                  <div key={s.description} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-foreground/80">{s.description}</span>
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
            Press <Key k="?" /> anytime to toggle this panel
          </p>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
