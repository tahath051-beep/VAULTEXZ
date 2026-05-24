import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: 'sm' | 'xs';
  className?: string;
}

export function CopyButton({ value, label, size = 'sm', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn(
        'shrink-0 transition-colors',
        size === 'xs' ? 'h-5 w-5' : 'h-7 w-7',
        copied && 'text-emerald-500',
        className,
      )}
      title={label ?? 'Copy'}
    >
      {copied
        ? <Check className={cn('shrink-0', size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        : <Copy className={cn('shrink-0', size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
    </Button>
  );
}
