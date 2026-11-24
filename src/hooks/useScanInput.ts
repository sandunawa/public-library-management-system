import { useEffect, useRef, useState, useCallback } from 'react';
import { SoundService } from '@/services/infrastructure/SoundService';

interface UseScanInputOptions {
  onScan: (scannedValue: string) => void | Promise<void>;
  minLength?: number;
  prefix?: string;
  preventDoubleScanMs?: number;
  autoRefocus?: boolean;
}

export function useScanInput({
  onScan,
  minLength = 3,
  prefix,
  preventDoubleScanMs = 1200,
  autoRefocus = true,
}: UseScanInputOptions) {
  const [value, setValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastScanRef = useRef<{ value: string; time: number }>({ value: '', time: 0 });

  const handleScanSubmission = useCallback(
    async (rawVal: string) => {
      const trimmed = rawVal.trim();
      if (!trimmed || trimmed.length < minLength) return;

      if (prefix && !trimmed.startsWith(prefix)) {
        SoundService.playError();
        return;
      }

      const now = Date.now();
      if (
        lastScanRef.current.value === trimmed &&
        now - lastScanRef.current.time < preventDoubleScanMs
      ) {
        // Prevent accidental double scan trigger
        return;
      }

      lastScanRef.current = { value: trimmed, time: now };
      setValue('');
      setIsProcessing(true);

      try {
        await onScan(trimmed);
      } catch (err) {
        console.error('Scan handling failed:', err);
      } finally {
        setIsProcessing(false);
        if (autoRefocus && inputRef.current) {
          inputRef.current.focus();
        }
      }
    },
    [onScan, minLength, prefix, preventDoubleScanMs, autoRefocus]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanSubmission(value);
    }
  };

  useEffect(() => {
    if (autoRefocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoRefocus]);

  return {
    value,
    setValue,
    inputRef,
    isProcessing,
    handleKeyDown,
    submitManual: () => handleScanSubmission(value),
  };
}
