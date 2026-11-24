import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface BarcodeLabelProps {
  barcode: string;
  bookTitle: string;
  callNumber?: string;
  libraryName?: string;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  barcode,
  bookTitle,
  callNumber = '823.91 GEN',
  libraryName = 'COLOMBO PUBLIC LIBRARY',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && barcode) {
      try {
        JsBarcode(svgRef.current, barcode, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 48,
          displayValue: true,
          fontSize: 13,
          font: 'monospace',
          textMargin: 3,
          margin: 6,
        });
      } catch (err) {
        console.warn('Barcode generation note:', err);
      }
    }
  }, [barcode]);

  const handlePrint = (printerMode: 'pos_80mm' | 'pos_58mm' | 'a4' = 'pos_80mm') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isPos58 = printerMode === 'pos_58mm';
    const isPos80 = printerMode === 'pos_80mm';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${barcode}</title>
          <style>
            /* 
              Zero-Margin Thermal POS Stylesheet (Tested on Xprinter / POS thermal roll printers)
              - size: 80mm auto / 58mm auto prevents browser from ejecting empty blank paper
              - margin: 0 !important removes default top/bottom headers, footers & margin
            */
            @page {
              size: ${isPos58 ? '58mm auto' : isPos80 ? '80mm auto' : 'A4 portrait'};
              margin: 0 !important;
            }
            @media print {
              html, body {
                width: ${isPos58 ? '58mm' : isPos80 ? '80mm' : '100%'} !important;
                height: auto !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                overflow: hidden !important;
                display: block !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .pos-label-container {
                width: ${isPos58 ? '52mm' : isPos80 ? '72mm' : '320px'} !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 2mm 1mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                border: none !important;
                box-shadow: none !important;
                page-break-before: avoid !important;
                page-break-after: avoid !important;
                break-before: avoid !important;
                break-after: avoid !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              background: #fff;
              color: #000;
              text-align: center;
            }
            .pos-label-container {
              width: ${isPos58 ? '52mm' : isPos80 ? '72mm' : '320px'};
              margin: 0 auto;
              padding: 2mm 1mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            .lib-header {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #000;
              line-height: 1.1;
              border-bottom: 1.5px solid #000;
              padding-bottom: 2px;
              margin-bottom: 3px;
              width: 100%;
            }
            .book-title {
              font-size: 11px;
              font-weight: 800;
              line-height: 1.15;
              max-width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              color: #000;
              margin: 2px 0;
            }
            .barcode-svg {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 2px 0;
            }
            .barcode-svg svg {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              max-height: 42px !important;
            }
            .shelf-code {
              font-size: 9.5px;
              font-weight: 800;
              font-family: monospace;
              border-top: 1px solid #000;
              padding-top: 2px;
              margin-top: 2px;
              width: 100%;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="pos-label-container">
            <div class="lib-header">${libraryName}</div>
            <div class="book-title" title="${bookTitle}">${bookTitle}</div>
            <div class="barcode-svg">
              ${svgRef.current ? svgRef.current.outerHTML : ''}
            </div>
            <div class="shelf-code">SHELF: ${callNumber}</div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-3 border rounded-xl bg-white text-black shadow-sm flex flex-col items-center space-y-1.5 w-full max-w-[280px]">
      <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase text-center">
        {libraryName}
      </div>
      <div className="text-xs font-semibold text-center line-clamp-1 w-full px-2" title={bookTitle}>
        {bookTitle}
      </div>

      {/* SVG Barcode rendered via JsBarcode */}
      <div className="py-1">
        <svg ref={svgRef} className="max-w-full h-auto"></svg>
      </div>

      <div className="text-[10px] font-mono font-bold text-muted-foreground">
        SHELF: {callNumber}
      </div>

      <div className="w-full pt-2 border-t flex flex-col gap-1.5">
        {/* Main 80mm Xprinter Default Button */}
        <Button
          size="sm"
          variant="default"
          onClick={() => handlePrint('pos_80mm')}
          className="h-8 text-xs font-bold gap-1.5 w-full bg-primary text-primary-foreground shadow-sm hover:opacity-90"
          title="Print directly on Xprinter 80mm Thermal Printer (Same zero-margin architecture as ID Card)"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print on 80mm Xprinter</span>
        </Button>

        {/* Secondary Standard Sticker Sizes */}
        <div className="flex gap-1 w-full">
          <button
            type="button"
            onClick={() => handlePrint('pos_58mm')}
            className="flex-1 py-1 text-[10px] rounded border border-muted bg-muted/30 hover:bg-muted text-foreground transition-colors font-mono"
            title="POS 58mm Thermal"
          >
            POS 58mm
          </button>
          <button
            type="button"
            onClick={() => handlePrint('a4')}
            className="flex-1 py-1 text-[10px] rounded border border-muted bg-muted/30 hover:bg-muted text-foreground transition-colors font-mono"
            title="A4 Sheet"
          >
            A4 Standard
          </button>
        </div>
      </div>
    </div>
  );
};
