import * as React from 'react';
import { cn } from '@/lib/utils';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeBytes?: number;
  title?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  accept = '.xlsx, .xls, .csv',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  title = 'Upload Spreadsheet or Drag & Drop',
  description = 'Supports UTF-8 CSV, XLS, XLSX formats up to 10MB',
  className,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    const file = files[0];
    if (!file) return;

    if (maxSizeBytes && file.size > maxSizeBytes) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is ${maxSizeBytes / (1024 * 1024)}MB.`);
      return;
    }

    setErrorMessage(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3',
          isDragOver
            ? 'border-[#7654D7] bg-[#F4F1FD]/60'
            : 'border-border bg-card/60 hover:bg-muted/40 hover:border-primary/50',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />

        <div className="w-14 h-14 rounded-2xl bg-[#F4F1FD] text-[#7654D7] flex items-center justify-center shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>
        </div>

        <button
          type="button"
          disabled={disabled}
          className="mt-1 px-4 py-2 bg-white border border-border shadow-xs hover:bg-muted/50 rounded-xl text-xs font-semibold text-foreground pointer-events-none"
        >
          Browse Local Files
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs font-medium text-[#B91C1C] p-2 bg-[#FEE2E2]/60 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
