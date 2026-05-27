'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Flag, ShieldAlert } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { Button } from '@/app/components/ui/button';

export type ReportReason = 'fake_account' | 'spam' | 'harassment';

const REASON_OPTIONS: { value: ReportReason; label: string; hint: string }[] = [
  {
    value: 'fake_account',
    label: 'Fake account',
    hint: 'Stolen photos or impersonation',
  },
  {
    value: 'spam',
    label: 'Spam',
    hint: 'Promotions, scams, or off-platform links',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    hint: 'Hate speech, threats, or abusive content',
  },
];

function stop(e: React.SyntheticEvent) {
  e.stopPropagation();
}

interface OverlayProps {
  children: React.ReactNode;
}

function DialogShell({ children }: OverlayProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        onClick={stop}
        onPointerDown={stop}
      />
      <DialogPrimitive.Content
        onClick={stop}
        onPointerDown={stop}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl bg-white border border-border p-5 shadow-xl text-neutral-900',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        )}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

interface BlockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetName: string;
  targetUsername?: string | null;
  onBlocked?: () => void;
}

export function BlockConfirmDialog({
  open,
  onOpenChange,
  targetId,
  targetName,
  targetUsername,
  onBlocked,
}: BlockConfirmDialogProps) {
  const [blocking, setBlocking] = useState(false);

  const confirm = async () => {
    if (blocking) return;
    setBlocking(true);
    try {
      await apiClient.post(`/users/${targetId}/block`);
      toast.success(
        targetUsername ? `You blocked @${targetUsername}` : 'User blocked',
      );
      onOpenChange(false);
      onBlocked?.();
    } catch {
      toast.error('Could not block user. Please try again.');
      onOpenChange(false);
    } finally {
      setBlocking(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogShell>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogPrimitive.Title className="text-lg font-semibold leading-tight">
              Block {targetName}?
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-neutral-600 mt-1.5">
              They won&apos;t appear in your browse feed or search results, and
              you won&apos;t see each other&apos;s profile. Any existing likes
              between you will be removed.
            </DialogPrimitive.Description>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button
            variant="ghost"
            size="sm"
            disabled={blocking}
            onClick={() => onOpenChange(false)}
            className="text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={blocking}
            onClick={confirm}
            className="strawberry-matcha-btn text-white hover:opacity-90"
          >
            {blocking ? 'Blocking…' : 'Block'}
          </Button>
        </div>
      </DialogShell>
    </DialogPrimitive.Root>
  );
}

interface ReportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetName: string;
}

export function ReportConfirmDialog({
  open,
  onOpenChange,
  targetId,
  targetName,
}: ReportConfirmDialogProps) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>('fake_account');

  const confirm = async () => {
    if (reporting) return;
    setReporting(true);
    try {
      await apiClient.post(`/users/${targetId}/report`, { reason });
      toast.success('Report submitted', {
        description: 'Thanks for helping keep the community safe.',
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not submit report';
      toast.error(message);
      onOpenChange(false);
    } finally {
      setReporting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogShell>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
            <Flag className="w-5 h-5 text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogPrimitive.Title className="text-lg font-semibold leading-tight">
              Report {targetName}?
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-neutral-600 mt-1.5">
              Pick the reason that fits best. Our team reviews every report.
            </DialogPrimitive.Description>
          </div>
        </div>

        <div
          className="mt-4 flex flex-col gap-1.5"
          role="radiogroup"
          aria-label="Report reason"
        >
          {REASON_OPTIONS.map((opt) => {
            const selected = reason === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={reporting}
                onClick={() => setReason(opt.value)}
                className={cn(
                  'w-full text-left rounded-xl border px-3.5 py-2.5 transition-colors cursor-pointer',
                  selected
                    ? 'bg-pink-50 border-pink-200 ring-1 ring-pink-200'
                    : 'bg-white border-neutral-200 hover:bg-neutral-50',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-900">
                      {opt.label}
                    </div>
                    <div className="text-[12px] text-neutral-500 mt-0.5">
                      {opt.hint}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 w-4 h-4 rounded-full border flex items-center justify-center',
                      selected
                        ? 'border-pink-400 bg-white'
                        : 'border-neutral-300 bg-white',
                    )}
                  >
                    {selected && (
                      <span className="w-2 h-2 rounded-full bg-pink-500" />
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button
            variant="ghost"
            size="sm"
            disabled={reporting}
            onClick={() => onOpenChange(false)}
            className="text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={reporting}
            onClick={confirm}
            className="strawberry-matcha-btn text-white hover:opacity-90"
          >
            {reporting ? 'Reporting…' : 'Submit report'}
          </Button>
        </div>
      </DialogShell>
    </DialogPrimitive.Root>
  );
}
