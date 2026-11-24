import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { Badge } from '@/components/ui/badge';
import { LocalAuthService, LocalUser } from '@/services/auth/LocalAuthService';
import { SnapshotService } from '@/services/infrastructure/SnapshotService';
import { AuditLogService } from '@/services/infrastructure/AuditLogService';
import { MemberProfile } from '@libraryos/shared';
import { toast } from 'sonner';
import {
  Users,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';

interface ParsedStudentRow {
  admissionNo: string;
  fullName: string;
  gender?: string;
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export const BulkRegistrationPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Class Details
  const [grade, setGrade] = useState('10');
  const [section, setSection] = useState('A');
  const [medium, setMedium] = useState<'SINHALA' | 'TAMIL' | 'ENGLISH'>('SINHALA');
  const [academicYear, setAcademicYear] = useState('2026');

  // Step 2: Parsed Students
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState('');

  // Step 3: Registration Status & Rollback
  const [isRegistering, setIsRegistering] = useState(false);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [registeredCount, setRegisteredCount] = useState(0);

  const steps = [
    { id: 1, title: 'Class & Cohort' },
    { id: 2, title: 'Upload Excel/CSV' },
    { id: 3, title: 'Preview & Validate' },
    { id: 4, title: 'Completion & Cards' },
  ];

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0] || ''];
          if (firstSheet) {
            const json: any[] = XLSX.utils.sheet_to_json(firstSheet);
            const mapped: ParsedStudentRow[] = json.map((row) => ({
              admissionNo: String(row['AdmissionNo'] || row['Admission'] || row['Index'] || ''),
              fullName: String(row['FullName'] || row['Name'] || row['StudentName'] || ''),
              gender: row['Gender'] || '',
              dob: row['DOB'] || '2010-01-01',
              phone: String(row['Phone'] || row['Contact'] || ''),
              email: row['Email'] || '',
              address: row['Address'] || 'Colombo',
              guardianName: row['GuardianName'] || row['Parent'] || '',
              guardianPhone: String(row['GuardianPhone'] || ''),
            }));
            setParsedRows(mapped.filter((r) => r.admissionNo && r.fullName));
            toast.success(`Successfully loaded ${mapped.length} rows from Excel sheet.`);
            setCurrentStep(2);
          }
        } catch (err: any) {
          toast.error(`Error reading Excel: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mapped: ParsedStudentRow[] = (results.data as any[]).map((row) => ({
            admissionNo: String(row['AdmissionNo'] || row['Admission'] || row['Index'] || ''),
            fullName: String(row['FullName'] || row['Name'] || row['StudentName'] || ''),
            gender: row['Gender'] || '',
            dob: row['DOB'] || '2010-01-01',
            phone: String(row['Phone'] || row['Contact'] || ''),
            email: row['Email'] || '',
            address: row['Address'] || 'Colombo',
            guardianName: row['GuardianName'] || row['Parent'] || '',
            guardianPhone: String(row['GuardianPhone'] || ''),
          }));
          setParsedRows(mapped.filter((r) => r.admissionNo && r.fullName));
          toast.success(`Parsed ${mapped.length} student records from CSV.`);
          setCurrentStep(2);
        },
      });
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'AdmissionNo,FullName,Gender,DOB,Phone,Address,GuardianName,GuardianPhone\n' +
      'ADM-1001,Kasun Perera,MALE,2010-04-12,0771234567,Colombo 05,S. Perera,0777654321\n' +
      'ADM-1002,Nethmi Jayasinghe,FEMALE,2010-08-20,0712345678,Kandy,M. Jayasinghe,0718765432\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'LibraryOS_Student_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteRegistration = () => {
    if (parsedRows.length === 0) return;
    setIsRegistering(true);

    // 1. Create safety snapshot for atomic rollback
    const snapId = SnapshotService.createSnapshot(`Bulk Registration: Grade ${grade}-${section}`, [
      'libraryos_local_users',
    ]);
    setSnapshotId(snapId);

    const now = Date.now();
    const expiry = now + 365 * 24 * 60 * 60 * 1000;

    const newUsers: LocalUser[] = parsedRows.map((r, idx) => {
      const uid = `stu_${Date.now()}_${idx}_${r.admissionNo}`;
      const profile: MemberProfile = {
        id: uid,
        memberIdNumber: `LIB-${academicYear}-${r.admissionNo}`,
        fullName: r.fullName,
        email: r.email || `${r.admissionNo.toLowerCase()}@school.lk`,
        phone: r.phone || '0770000000',
        dob: r.dob || '2010-01-01',
        address: r.address || 'Sri Lanka',
        district: 'Colombo',
        membershipType: 'STUDENT',
        status: 'ACTIVE',
        homeBranchId: 'branch-colombo-hq',
        preferredLanguage: medium === 'TAMIL' ? 'ta' : medium === 'ENGLISH' ? 'en' : 'si',
        borrowingHistoryOptIn: true,
        activeLoansCount: 0,
        unpaidFinesTotal: 0,
        guardianName: r.guardianName,
        guardianPhone: r.guardianPhone,
        admissionNo: r.admissionNo,
        grade,
        section,
        medium,
        expiryDate: expiry,
        createdAt: now,
        updatedAt: now,
      };

      return {
        uid,
        email: profile.email,
        password: 'Password@123',
        role: 'MEMBER',
        profile,
      };
    });

    const existingUsers = LocalAuthService.getStoredUsers();
    LocalAuthService.saveUsers([...existingUsers, ...newUsers]);

    AuditLogService.log({
      action: 'BULK_MEMBER_REGISTRATION',
      entityType: 'STUDENT_COHORT',
      entityId: `Grade-${grade}-${section}`,
      performedBy: 'Current Operator',
      performerRole: 'LIBRARIAN',
      details: {
        totalRegistered: newUsers.length,
        grade,
        section,
        snapshotId: snapId,
      },
    });

    setRegisteredCount(newUsers.length);
    setIsRegistering(false);
    setCurrentStep(3);
    toast.success(`Successfully registered ${newUsers.length} students into Grade ${grade}-${section}!`);
  };

  const handleRollback = () => {
    if (!snapshotId) return;
    if (confirm('Are you sure you want to rollback this entire batch of registrations?')) {
      const restored = SnapshotService.restoreSnapshot(snapshotId);
      if (restored) {
        toast.info('Snapshot restored! Bulk registration has been rolled back cleanly.');
        setCurrentStep(0);
        setParsedRows([]);
        setSnapshotId(null);
      } else {
        toast.error('Failed to restore snapshot.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Class Bulk Registration"
        description="Streamlined enrollment for entire grades and cohorts with Excel/CSV matching and atomic rollback."
      />

      <Stepper steps={steps} currentStep={currentStep} />

      {/* Step 1: Class Setup */}
      {currentStep === 0 && (
        <Card className="border-2 border-[#7654D7]">
          <CardHeader>
            <CardTitle className="text-lg font-bold">1. Select Target Class & Cohort</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Grade (ශ්‍රේණිය)</Label>
                <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 10" />
              </div>
              <div>
                <Label>Section / Class (පන්තිය)</Label>
                <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
              </div>
              <div>
                <Label>Medium of Instruction</Label>
                <select
                  value={medium}
                  onChange={(e) => setMedium(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="SINHALA">Sinhala Medium</option>
                  <option value="ENGLISH">English Medium</option>
                  <option value="TAMIL">Tamil Medium</option>
                </select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCurrentStep(1)} className="bg-[#7654D7] hover:bg-[#6342c4]">
                Next: Upload Student Sheet
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload File */}
      {currentStep === 1 && (
        <Card className="border-2 border-[#7654D7]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>2. Upload Student List (.xlsx or .csv)</span>
              <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                <Download className="w-4 h-4 mr-1.5" />
                Download Template
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileDropzone
              accept=".csv, .xlsx, .xls"
              title="Drop class student roster here"
              description="Supports Microsoft Excel and UTF-8 CSV with Sinhala & Tamil names"
              onFileSelect={handleFileUpload}
            />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview & Confirm */}
      {currentStep === 2 && (
        <Card className="border-2 border-[#7654D7]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>3. Preview & Validate ({parsedRows.length} Students)</span>
              <Badge variant="outline" className="border-[#7654D7] text-[#7654D7]">
                Grade {grade}-{section}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-72 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b text-left">
                    <th className="p-2.5">Admission #</th>
                    <th className="p-2.5">Full Name</th>
                    <th className="p-2.5">Gender</th>
                    <th className="p-2.5">Parent / Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F1EDFC]'}`}
                    >
                      <td className="p-2.5 font-mono font-bold text-[#7654D7]">{r.admissionNo}</td>
                      <td className="p-2.5 font-medium">{r.fullName}</td>
                      <td className="p-2.5 text-xs text-muted-foreground">{r.gender || '-'}</td>
                      <td className="p-2.5 text-xs text-muted-foreground">{r.phone || r.guardianPhone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleExecuteRegistration}
                disabled={isRegistering}
                className="bg-[#7654D7] hover:bg-[#6342c4]"
              >
                {isRegistering ? 'Registering...' : `Confirm & Register ${parsedRows.length} Students`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Completion */}
      {currentStep === 3 && (
        <Card className="border-2 border-emerald-500 bg-emerald-50/10">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Cohort Registration Completed!</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Successfully created <strong>{registeredCount}</strong> active student library accounts for{' '}
              <strong>Grade {grade}-{section}</strong>. Barcodes and credentials are now active.
            </p>

            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={() => (window.location.href = '/staff/members')}>
                View in Members Directory
              </Button>
              {snapshotId && (
                <Button variant="outline" onClick={handleRollback} className="text-rose-600 border-rose-300">
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Rollback Registration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
