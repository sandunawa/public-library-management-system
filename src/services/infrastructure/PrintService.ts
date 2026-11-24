import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReceiptData {
  libraryName: string;
  libraryAddress?: string;
  libraryPhone?: string;
  patronName: string;
  memberId: string;
  transactionType: 'ISSUE' | 'RETURN' | 'FINE_PAYMENT';
  dateStr: string;
  staffName: string;
  items: {
    title: string;
    barcode: string;
    dueDate?: string;
    fine?: number;
  }[];
  totalAmount?: number;
}

export class PrintService {
  /**
   * Generates and prints an 80mm standard thermal POS slip
   */
  public static printThermalSlip(data: ReceiptData, widthMm: 80 | 58 = 80) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [widthMm, 200], // dynamic height based on content
    });

    const margin = 4;
    const contentWidth = widthMm - margin * 2;
    let y = 8;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(data.libraryName, widthMm / 2, y, { align: 'center' });
    y += 5;

    if (data.libraryAddress) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(data.libraryAddress, widthMm / 2, y, { align: 'center' });
      y += 4;
    }

    if (data.libraryPhone) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Tel: ${data.libraryPhone}`, widthMm / 2, y, { align: 'center' });
      y += 4;
    }

    // Divider
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, margin + contentWidth, y);
    doc.setLineDashPattern([], 0);
    y += 4;

    // Transaction Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${data.transactionType} RECEIPT`, widthMm / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Date: ${data.dateStr}`, margin, y);
    y += 4;
    doc.text(`Patron: ${data.patronName} (${data.memberId})`, margin, y);
    y += 4;
    doc.text(`Operator: ${data.staffName}`, margin, y);
    y += 5;

    // Items Table
    const tableData = data.items.map((item) => [
      item.title.substring(0, 22),
      item.dueDate || (item.fine ? `Rs. ${item.fine}` : '-'),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Item / Barcode', data.transactionType === 'FINE_PAYMENT' ? 'Paid' : 'Due']],
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;

    if (data.totalAmount !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`TOTAL: Rs. ${data.totalAmount.toFixed(2)}`, margin + contentWidth, finalY, {
        align: 'right',
      });
    }

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Thank you for using the library!', widthMm / 2, finalY + 7, { align: 'center' });

    // Trigger Print
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  }
}
