import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ReportColumn {
  header: string;
  dataKey: string;
}

export class ExportService {
  /**
   * Export tabular data to Microsoft Excel (.xlsx)
   */
  static exportToExcel(data: any[], fileName: string, sheetName = 'Report') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Export tabular data to CSV (.csv)
   */
  static exportToCsv(data: any[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export standard document to PDF with autotable
   */
  static exportToPdf(
    title: string,
    subtitle: string,
    columns: ReportColumn[],
    data: any[],
    fileName: string
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 43, 74); // Classic Navy #142B4A
    doc.text('LibraryOS — Public Library System', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(title, 14, 22);
    doc.setFontSize(9);
    doc.text(`${subtitle} | Generated: ${new Date().toLocaleString()}`, 14, 27);

    // Render Table
    autoTable(doc, {
      startY: 32,
      columns: columns.map((c) => ({ header: c.header, dataKey: c.dataKey })),
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [20, 43, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`${fileName}.pdf`);
  }
}
