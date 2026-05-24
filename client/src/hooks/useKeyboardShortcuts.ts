import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(extras?: Shortcut[]) {
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    { key: 'h', ctrl: true, action: () => navigate('/'), description: 'Go to Dashboard' },
    { key: 'o', ctrl: true, action: () => navigate('/operations'), description: 'Go to Operations' },
    { key: 'c', ctrl: true, shift: true, action: () => navigate('/clients'), description: 'Go to Clients' },
    { key: 'e', ctrl: true, action: () => navigate('/entries'), description: 'Go to Entries' },
    { key: 'r', ctrl: true, action: () => navigate('/reconciliation'), description: 'Go to Reconciliation' },
    { key: 't', ctrl: true, action: () => navigate('/treasury'), description: 'Go to Treasury' },
    ...(extras ?? []),
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      for (const s of shortcuts) {
        const ctrlOrMeta = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;

        if (e.key.toLowerCase() === s.key.toLowerCase() && ctrlOrMeta && shiftMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
