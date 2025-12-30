import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '../ui';
import { eventBus, EVENTS } from '@/utils/events';

type Decision = 'overwrite' | 'keep-both' | 'cancel';

/**
 * Modal that appears when a file with the same name already exists on the receiver.
 * It resolves a promise with the user's choice.
 */
export function ConflictModal() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [resolveFn, setResolveFn] = useState<(d: Decision) => void>(() => () => {});

  useEffect(() => {
    const handler = (data: { peerId: string; fileName: string; resolve: (d: Decision) => void }) => {
      setFileName(data.fileName);
      setResolveFn(() => data.resolve);
      setOpen(true);
    };
    const unsubscribe = eventBus.on(EVENTS.CONFLICT_REQUEST, handler);
    return () => unsubscribe();
  }, []);

  const decide = (decision: Decision) => {
    resolveFn(decision);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File Conflict</DialogTitle>
        </DialogHeader>
        <p>
          A file named <strong>{fileName}</strong> already exists on this device. What would you like to do?
        </p>
        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={() => decide('cancel')}>
            Cancel
          </Button>
          <Button onClick={() => decide('overwrite')}>Overwrite</Button>
          <Button onClick={() => decide('keep-both')}>Keep Both</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
