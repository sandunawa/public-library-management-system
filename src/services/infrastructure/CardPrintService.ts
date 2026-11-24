import { jsPDF } from 'jspdf';
import { MemberProfile } from '@libraryos/shared';

// Helper to generate a barcode image using native browser canvas & JsBarcode
const generateBarcodeDataUrl = (text: string): string => {
  const canvas = document.createElement('canvas');
  try {
    const JsBarcode = (window as any).JsBarcode;
    if (JsBarcode) {
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
        font: 'monospace',
      });
      return canvas.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('JsBarcode generation failed:', e);
  }
  return '';
};

export class CardPrintService {
  /**
   * CR80 Standard PVC Card (85.6mm x 53.98mm)
   */
  public static printCR80Card(member: MemberProfile, photoDataUrl?: string) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54],
    });

    const w = 85.6;
    const h = 54;

    // Background Card Styling
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(0, 0, w, h, 3, 3, 'F');

    // Header Accent Ribbon (#7654D7)
    doc.setFillColor(118, 84, 215);
    doc.roundedRect(0, 0, w, 11, 3, 3, 'F');
    doc.rect(0, 8, w, 3, 'F'); // square bottom of ribbon

    // Library Name Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('LIBRARYOS SMART ACCESS CARD', w / 2, 7, { align: 'center' });

    // Member Photo or Placeholder
    const photoX = 5;
    const photoY = 14;
    const photoW = 22;
    const photoH = 26;

    if (photoDataUrl) {
      try {
        doc.addImage(photoDataUrl, 'JPEG', photoX, photoY, photoW, photoH);
      } catch {
        doc.setFillColor(240, 240, 240);
        doc.rect(photoX, photoY, photoW, photoH, 'F');
      }
    } else {
      doc.setFillColor(240, 240, 240);
      doc.rect(photoX, photoY, photoW, photoH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('PHOTO', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }

    doc.setDrawColor(118, 84, 215);
    doc.setLineWidth(0.4);
    doc.rect(photoX, photoY, photoW, photoH, 'S');

    // Member Details Box
    const textX = 30;
    let textY = 17;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(36, 35, 53);
    doc.text(member.fullName.substring(0, 24), textX, textY);
    textY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`ID No: ${member.memberIdNumber}`, textX, textY);
    textY += 3.5;

    if (member.admissionNo) {
      doc.text(`Adm No: ${member.admissionNo}`, textX, textY);
      textY += 3.5;
    }

    if (member.grade) {
      doc.text(`Grade: ${member.grade}${member.section ? ` - ${member.section}` : ''}`, textX, textY);
      textY += 3.5;
    }

    doc.text(`Expires: ${new Date(member.expiryDate).toLocaleDateString()}`, textX, textY);

    // Barcode Area at the bottom
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(118, 84, 215);
    doc.text(`* ${member.memberIdNumber} *`, w / 2, 48, { align: 'center' });

    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  }

  /**
   * A4 Duplex Grid (8 cards per sheet, 2x4 layout)
   */
  public static printA4CardSheet(members: MemberProfile[]) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const cardW = 85.6;
    const cardH = 54;
    const startX = 14;
    const startY = 15;
    const gapX = 10;
    const gapY = 8;

    members.slice(0, 8).forEach((member, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // Card border
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

      // Card header
      doc.setFillColor(118, 84, 215);
      doc.rect(x, y, cardW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('LIBRARYOS STUDENT PASS', x + cardW / 2, y + 5.5, { align: 'center' });

      // Member info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(member.fullName.substring(0, 22), x + 6, y + 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(`ID: ${member.memberIdNumber}`, x + 6, y + 20);
      if (member.admissionNo) doc.text(`Adm: ${member.admissionNo}`, x + 6, y + 24);
      if (member.grade) doc.text(`Class: ${member.grade}-${member.section || ''}`, x + 6, y + 28);

      // Barcode line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(118, 84, 215);
      doc.text(`* ${member.memberIdNumber} *`, x + cardW / 2, y + 48, { align: 'center' });
    });

    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  }
}
