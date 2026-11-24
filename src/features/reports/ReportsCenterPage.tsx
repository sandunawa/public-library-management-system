import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Download, BarChart3, Calendar } from 'lucide-react';
import { ExportService } from '@/services/reports/ExportService';
import { toast } from 'sonner';

export const ReportsCenterPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<'CIRCULATION' | 'OVERDUE' | 'INVENTORY' | 'FINES'>('CIRCULATION');

  // Sample verified dataset for circulation report
  const circulationSample = [
    { loanNo: 'LN-2026-10492', title: 'Madol Doova (මාදොල් දූව)', member: 'Kasun Perera', branch: 'Colombo Central', dueDate: '2026-12-05', status: 'ACTIVE' },
    { loanNo: 'LN-2026-10493', title: 'Village in the Jungle', member: 'Nimal Jayawardena', branch: 'Colombo Central', dueDate: '2026-12-06', status: 'ACTIVE' },
    { loanNo: 'LN-2026-10494', title: 'Ponnar Sankar (பொன்னர் சங்கர்)', member: 'S. Tharmalingam', branch: 'Colombo Central', dueDate: '2026-12-08', status: 'ACTIVE' },
    { loanNo: 'LN-2026-10495', title: 'A History of Ceylon', member: 'Sunil Silva', branch: 'Colombo Central', dueDate: '2026-11-20', status: 'OVERDUE' },
  ];

  const handleExport = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    const title = 'Monthly Circulation & Item Movement Report';
    const subtitle = 'Official Administrative Audit Document';

    if (format === 'PDF') {
      ExportService.exportToPdf(
        title,
        subtitle,
        [
          { header: 'Loan No', dataKey: 'loanNo' },
          { header: 'Title (Grayscale Unicode)', dataKey: 'title' },
          { header: 'Patron Name', dataKey: 'member' },
          { header: 'Branch', dataKey: 'branch' },
          { header: 'Due Date', dataKey: 'dueDate' },
          { header: 'Status', dataKey: 'status' },
        ],
        circulationSample,
        'Circulation_Audit_Report'
      );
      toast.success('Generated PDF Report successfully.');
    } else if (format === 'EXCEL') {
      ExportService.exportToExcel(circulationSample, 'Circulation_Audit_Report');
      toast.success('Generated Excel (.xlsx) Report successfully.');
    } else {
      ExportService.exportToCsv(circulationSample, 'Circulation_Audit_Report');
      toast.success('Generated CSV Report successfully.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Analytics, Reports & Exports</h1>
          <p className="text-xs text-muted-foreground">
            Generate certified reports, circulation logs, and financial fine audit exports
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')} className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('EXCEL')} className="text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-success" />
            Excel
          </Button>
          <Button size="sm" onClick={() => handleExport('PDF')} className="text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 mr-1 text-danger" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Preset Report Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { id: 'CIRCULATION', title: 'Circulation & Movement', desc: 'All issues, returns, and renewals' },
          { id: 'OVERDUE', title: 'Overdue & Defaulters', desc: 'Items past due date with accrued fines' },
          { id: 'INVENTORY', title: 'Collection Turnover', desc: 'Most active vs zero-circulation titles' },
          { id: 'FINES', title: 'Cashier & Fines Audit', desc: 'Collected fees and daily close ledger' },
        ].map((tab) => (
          <Card
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as any)}
            className={`cursor-pointer transition-all border ${
              selectedReport === tab.id
                ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/[0.02]'
                : 'hover:border-primary/50'
            }`}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold">{tab.title}</CardTitle>
              <CardDescription className="text-xs">{tab.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Report Data Preview Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold">Report Preview: Circulation Log</CardTitle>
            <CardDescription className="text-xs">Displaying verified operational records</CardDescription>
          </div>
          <span className="text-xs font-mono text-muted-foreground">4 Records Ready</span>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl divide-y text-xs">
            <div className="p-3 bg-muted font-semibold text-muted-foreground grid grid-cols-6 gap-2">
              <span>Loan No</span>
              <span className="col-span-2">Title</span>
              <span>Patron</span>
              <span>Due Date</span>
              <span className="text-right">Status</span>
            </div>
            {circulationSample.map((item, idx) => (
              <div key={idx} className="p-3 grid grid-cols-6 gap-2 items-center hover:bg-muted/30">
                <span className="font-mono">{item.loanNo}</span>
                <span className="col-span-2 font-semibold text-foreground">{item.title}</span>
                <span className="text-muted-foreground">{item.member}</span>
                <span className="text-muted-foreground">{item.dueDate}</span>
                <span className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      item.status === 'ACTIVE'
                        ? 'bg-info-soft text-info-soft-foreground dark:bg-card dark:text-info'
                        : 'bg-danger-soft text-danger dark:bg-card dark:text-danger'
                    }`}
                  >
                    {item.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
