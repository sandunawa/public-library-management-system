import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { useTranslation } from 'react-i18next';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutGroup {
  category: string;
  shortcuts: { keys: string[]; description: string }[];
}

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();

  const groups: ShortcutGroup[] = [
    {
      category: 'General Navigation',
      shortcuts: [
        { keys: ['Ctrl', 'K'], description: 'Open global search / quick actions' },
        { keys: ['?'], description: 'Show keyboard shortcuts cheat sheet' },
        { keys: ['Esc'], description: 'Close modals, sheets, or clear current form' },
      ],
    },
    {
      category: 'Circulation Desk (Speed Operations)',
      shortcuts: [
        { keys: ['F1'], description: 'Switch to Issue / Checkout tab' },
        { keys: ['F2'], description: 'Switch to Return / Check-in tab' },
        { keys: ['F3'], description: 'Switch to Renew tab' },
        { keys: ['Alt', 'P'], description: 'Focus Patron / Member scan input' },
        { keys: ['Alt', 'B'], description: 'Focus Book / Accession scan input' },
        { keys: ['Ctrl', 'Enter'], description: 'Complete current desk transaction' },
        { keys: ['Ctrl', 'P'], description: 'Print transaction receipt' },
      ],
    },
    {
      category: 'Tables & Lists',
      shortcuts: [
        { keys: ['Ctrl', 'A'], description: 'Select all visible items in table' },
        { keys: ['Shift', 'Click'], description: 'Select range of items' },
        { keys: ['Delete'], description: 'Bulk delete / archive selected items' },
      ],
    },
    {
      category: 'Smart Kiosk Mode',
      shortcuts: [
        { keys: ['F11'], description: 'Toggle full screen kiosk mode' },
        { keys: ['Space'], description: 'Toggle IN / OUT attendance direction' },
        { keys: ['Esc'], description: 'Exit kiosk to operator view (passcode required)' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-2 border-[#7654D7] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span>⌨️</span> {t('shortcuts.title', 'Keyboard Shortcuts & Scanner Cheat Sheet')}
          </DialogTitle>
          <DialogDescription>
            {t('shortcuts.description', 'Use these hotkeys to operate LibraryOS without touching the mouse.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {groups.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {group.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-sm"
                  >
                    <span className="text-foreground font-medium">{sc.description}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
