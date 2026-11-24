import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from '@/components/ui/button';
import { MemberProfile } from '@libraryos/shared';
import { Printer, ShieldCheck, User } from 'lucide-react';

interface MemberIdCardProps {
  member: MemberProfile;
  libraryName?: string;
}

export const MemberIdCard: React.FC<MemberIdCardProps> = ({
  member,
  libraryName = 'COLOMBO PUBLIC LIBRARY',
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (barcodeSvgRef.current && member.memberIdNumber) {
      try {
        JsBarcode(barcodeSvgRef.current, member.memberIdNumber, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 42,
          displayValue: true,
          fontSize: 13,
          font: 'monospace',
          textMargin: 3,
          margin: 4,
        });
      } catch (err) {
        console.warn('Barcode card render note:', err);
      }
    }
  }, [member.memberIdNumber]);

  const handlePrint = (mode: 'pos_80mm' | 'pvc_card' = 'pos_80mm') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isPos80 = mode === 'pos_80mm';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Library ID Card - ${member.memberIdNumber}</title>
          <style>
            @page {
              size: ${isPos80 ? '80mm auto' : '86mm 54mm'};
              margin: 0 !important;
            }
            @media print {
              html, body {
                width: ${isPos80 ? '80mm' : '86mm'} !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .id-card-print {
                width: ${isPos80 ? '72mm' : '82mm'} !important;
                margin: 0 auto !important;
                padding: 2.5mm 1.5mm !important;
                border: ${isPos80 ? 'none' : '1px solid #000'} !important;
                page-break-before: avoid !important;
                page-break-after: avoid !important;
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
              padding: 10px;
            }
            .id-card-print {
              width: ${isPos80 ? '72mm' : '82mm'};
              margin: 0 auto;
              border: 1.5px solid #000;
              border-radius: 6px;
              padding: 3mm 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              background: #fff;
            }
            .header-main {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #000;
              padding-bottom: 2px;
              margin-bottom: 4px;
              width: 100%;
            }
            .sub-header {
              font-size: 8.5px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 4px;
              color: #333;
            }
            .patron-name {
              font-size: 13px;
              font-weight: 800;
              line-height: 1.15;
              margin: 2px 0;
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .patron-badge {
              font-size: 9px;
              font-weight: 800;
              background: #000;
              color: #fff;
              padding: 1px 6px;
              border-radius: 3px;
              text-transform: uppercase;
              display: inline-block;
              margin-bottom: 3px;
            }
            .meta-details {
              font-size: 9px;
              font-weight: 600;
              text-align: left;
              width: 100%;
              margin: 3px 0;
              line-height: 1.3;
              border-top: 1px dotted #888;
              border-bottom: 1px dotted #888;
              padding: 2px 0;
            }
            .barcode-box {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-top: 2px;
            }
            .barcode-box svg {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              max-height: 44px !important;
            }
            .footer-notice {
              font-size: 8px;
              font-weight: bold;
              margin-top: 3px;
              color: #444;
            }
          </style>
        </head>
        <body>
          <div class="id-card-print">
            <div class="header-main">${libraryName}</div>
            <div class="sub-header">OFFICIAL STUDENT / PATRON CARD</div>
            <div class="patron-badge">${member.membershipType}</div>
            <div class="patron-name">${member.fullName}</div>
            
            <div class="meta-details">
              <div><strong>District:</strong> ${member.district}</div>
              <div><strong>Phone:</strong> ${member.phone}</div>
              <div><strong>Branch:</strong> ${member.homeBranchId}</div>
              <div><strong>Valid Until:</strong> ${new Date(member.expiryDate).toLocaleDateString()}</div>
            </div>

            <div class="barcode-box">
              ${barcodeSvgRef.current ? barcodeSvgRef.current.outerHTML : ''}
            </div>
            <div class="footer-notice">Scan at circulation desk or kiosk for instant borrowing</div>
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
    <div className="bg-white text-black p-4 rounded-2xl shadow-xl border border-slate-300 flex flex-col items-center max-w-[320px] w-full mx-auto select-none">
      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-2 text-center w-full">
        <div className="text-[10px] font-black uppercase tracking-wider text-black flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span>{libraryName}</span>
        </div>
        <div className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-0.5">
          OFFICIAL LIBRARY CARD
        </div>
      </div>

      {/* Badge & Name */}
      <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 rounded uppercase tracking-wider mb-1">
        {member.membershipType}
      </span>
      <h3 className="text-sm font-black text-center text-black line-clamp-1 w-full" title={member.fullName}>
        {member.fullName}
      </h3>
      <div className="text-[11px] font-mono font-bold text-primary mt-0.5">
        {member.memberIdNumber}
      </div>

      {/* Meta Grid */}
      <div className="w-full my-2 py-1.5 border-t border-b border-black text-[10px] space-y-0.5 text-left text-slate-800">
        <div className="flex justify-between">
          <span className="font-semibold text-slate-600">District:</span>
          <span className="font-bold">{member.district}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-slate-600">Phone:</span>
          <span className="font-bold">{member.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-slate-600">Status:</span>
          <span className="font-bold text-emerald-700 uppercase">{member.status}</span>
        </div>
      </div>

      {/* High Contrast Barcode */}
      <div className="w-full flex justify-center py-1 bg-white">
        <svg ref={barcodeSvgRef} className="max-w-full h-auto"></svg>
      </div>

      <div className="text-[9px] text-slate-600 font-semibold text-center mt-1">
        Scan barcode at circulation desk to borrow books
      </div>

      {/* Print Buttons */}
      <div className="w-full pt-3 mt-2 border-t flex flex-col gap-1.5">
        <Button
          size="sm"
          onClick={() => handlePrint('pos_80mm')}
          className="h-8 text-xs font-bold gap-1.5 w-full bg-primary text-primary-foreground shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Card (80mm Xprinter)</span>
        </Button>
        <button
          type="button"
          onClick={() => handlePrint('pvc_card')}
          className="w-full py-1 text-[10px] rounded border border-muted bg-muted/40 hover:bg-muted text-foreground transition-colors font-mono"
        >
          Print Card (Standard PVC / Badge Size)
        </button>
      </div>
    </div>
  );
};
