import { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Textarea } from '#/components/ui/textarea';
import { Button } from '#/components/ui/button';
import { Label } from '#/components/ui/label';
import { reportPost } from '#/data/server-functions/reports';
import type { ReportReason } from '#/lib/services/posts';

const REASONS: Array<{ value: ReportReason; label: string; hint: string }> = [
  { value: 'spam', label: 'Spam', hint: 'Promotional, repetitive, or bot-like' },
  { value: 'inappropriate', label: 'Inappropriate', hint: 'Explicit, offensive, or NSFW' },
  { value: 'misleading', label: 'Misleading', hint: 'False health claims or misinformation' },
  { value: 'harmful', label: 'Harmful', hint: 'Dangerous advice or self-harm content' },
  { value: 'other', label: 'Something else', hint: 'Explain in the details below' },
];

type Props = {
  postDocumentId: string;
  trigger: React.ReactNode;
};

export function ReportDialog({ postDocumentId, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setReason('');
    setDetails('');
    setSubmitting(false);
    setError(null);
    setDone(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!reason) {
      setError('Pick a reason first');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await reportPost({
      data: {
        postDocumentId,
        reason: reason as ReportReason,
        details: details.trim() || undefined,
      },
    });
    setSubmitting(false);
    if (result.success) {
      setDone(true);
      await router.invalidate();
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this post</DialogTitle>
          <DialogDescription>
            Reports are anonymous. Three distinct reports auto-hide a post while a human reviews it.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="grid gap-4 py-2">
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Thanks — your report was submitted. The author won't see who reported it.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Reason</Label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as ReportReason)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.hint}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="report-details" className="text-sm font-medium">
                Details (optional)
              </Label>
              <Textarea
                id="report-details"
                placeholder="Anything that would help a moderator decide"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                className="resize-none"
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={submitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || !reason}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
