import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  BarChart3, 
  Download,
  Calendar,
  Users,
  Pill,
  FlaskConical,
  FileText,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { MOH_DIAGNOSES, getDiagnosisById } from '@/data/mohDiagnoses';
import { ClinicName } from '@/types';

const clinics: ClinicName[] = ['Universal Hospital'];

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClinic, setSelectedClinic] = useState<string>(user?.clinic || 'all');
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    under5: 0,
    over5: 0,
    under5Male: 0,
    under5Female: 0,
    over5Male: 0,
    over5Female: 0,
    totalMale: 0,
    totalFemale: 0,
    totalVisits: 0,
    labTests: 0,
    dispensedDrugs: 0,
    diagnoses: [] as { diagnosis: string; count: number }[],
    tropicalDiseases: [] as { disease: string; count: number }[],
    affectedSystems: [] as { system: string; count: number }[],
    ageGenderBreakdown: [] as { disease: string; under5M: number; under5F: number; over5M: number; over5F: number; totalM: number; totalF: number; total: number }[],
    medicationStats: {
      mostPrescribed: [] as { medication: string; count: number; percentage: number }[],
      fastMoving: [] as { medication: string; dispensed: number; daysInPeriod: number; avgPerDay: number }[],
      leastMoving: [] as { medication: string; dispensed: number; daysInPeriod: number; avgPerDay: number }[],
      totalDispensed: 0
    }
  });

  const fetchReportData = async () => {
    setLoading(true);
    
    try {
      const clinicFilter = selectedClinic === 'all' ? null : selectedClinic;
      
      // Fetch report data via API
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        ...(clinicFilter && { clinic: clinicFilter })
      });
      
      const response = await fetch(`/api/reports?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const reportData = await response.json();
      setStats(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateFrom, dateTo, selectedClinic]);

  const exportToCSV = () => {
    // Main Summary Data
    const summaryData = [
      ['UNIVERSAL HOSPITAL - HEALTH MANAGEMENT INFORMATION SYSTEM (HMIS) REPORT'],
      ['Report Period:', `${dateFrom} to ${dateTo}`],
      ['Clinic/Branch:', selectedClinic === 'all' ? 'All Branches' : selectedClinic],
      ['Generated On:', new Date().toLocaleDateString()],
      [''],
      ['SECTION A: PATIENT STATISTICS'],
      ['Metric', 'Count'],
      ['Total Patients Registered', stats.totalPatients],
      ['Patients Under 5 Years', stats.under5],
      ['Patients Over 5 Years', stats.over5],
      ['Total Clinical Visits', stats.totalVisits],
      ['Laboratory Tests Completed', stats.labTests],
      ['Pharmacy Dispensations', stats.dispensedDrugs],
      [''],
      ['SECTION B: TOP 10 DIAGNOSES'],
      ['Rank', 'Diagnosis', 'Count', 'Percentage of Total Visits'],
      ...stats.diagnoses.map((d, i) => [
        i + 1,
        d.diagnosis,
        d.count,
        `${((d.count / stats.totalVisits) * 100).toFixed(1)}%`
      ]),
      [''],
      ['SECTION D: TROPICAL DISEASES SURVEILLANCE'],
      ['Disease', 'Cases', 'Percentage'],
      ...stats.tropicalDiseases.map(d => [
        d.disease,
        d.count,
        `${((d.count / stats.totalVisits) * 100).toFixed(1)}%`
      ]),
      [''],
      ['SECTION E: AFFECTED SYSTEMS ANALYSIS'],
      ['System', 'Cases', 'Percentage'],
      ...stats.affectedSystems.map(s => [
        s.system,
        s.count,
        `${((s.count / stats.totalVisits) * 100).toFixed(1)}%`
      ]),
      [''],
      ['SECTION F: AGE-GENDER BREAKDOWN (TOP 10 CONDITIONS)'],
      ['Condition', 'Under 5 Male', 'Under 5 Female', 'Over 5 Male', 'Over 5 Female', 'Total Male', 'Total Female', 'Grand Total'],
      ...stats.ageGenderBreakdown.map(a => [
        a.disease,
        a.under5M,
        a.under5F,
        a.over5M,
        a.over5F,
        a.totalM,
        a.totalF,
        a.total
      ])
    ];

    // Convert to CSV
    const csvContent = summaryData.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',')
    ).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `HMIS_Report_${selectedClinic === 'all' ? 'All_Branches' : selectedClinic.replace(/\s+/g, '_')}_${dateFrom}_to_${dateTo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Comprehensive CSV report downloaded successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // MOH Standard Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPUBLIC OF SOUTH SUDAN', 105, 15, { align: 'center' });
    doc.text('MINISTRY OF HEALTH', 105, 25, { align: 'center' });
    doc.text('HEALTH MANAGEMENT INFORMATION SYSTEM (HMIS)', 105, 35, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('UNIVERSAL HOSPITAL - MONTHLY HEALTH REPORT', 105, 45, { align: 'center' });
    
    // Report Details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 20, 55);
    doc.text(`Facility: ${selectedClinic === 'all' ? 'All Clinics' : selectedClinic}`, 20, 62);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, 55);
    
    let yPos = 75;
    
    // Helper function to draw table with borders
    const drawTable = (headers, data, startY, colWidths) => {
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      const startX = 20;
      let currentY = startY;
      
      // Draw headers
      doc.setFillColor(240, 240, 240);
      doc.rect(startX, currentY, tableWidth, 8, 'F');
      
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      
      // Header borders and text
      let currentX = startX;
      headers.forEach((header, i) => {
        doc.rect(currentX, currentY, colWidths[i], 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(header, currentX + 1, currentY + 5);
        currentX += colWidths[i];
      });
      
      currentY += 8;
      
      // Draw data rows
      doc.setFont('helvetica', 'normal');
      data.forEach((row, rowIndex) => {
        currentX = startX;
        
        // Alternate row colors
        if (rowIndex % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(startX, currentY, tableWidth, 6, 'F');
        }
        
        row.forEach((cell, i) => {
          doc.rect(currentX, currentY, colWidths[i], 6);
          doc.text(cell.toString(), currentX + 1, currentY + 4);
          currentX += colWidths[i];
        });
        currentY += 6;
      });
      
      return currentY + 5;
    };
    
    // Diseases by System Table (matching template structure)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Disease Breakdown by Affected Systems', 20, yPos);
    yPos += 8;
    
    // Prepare disease data in template format
    const diseaseHeaders = ['Disease/Condition', 'M<5', 'F<5', 'M>5', 'F>', 'M', 'F', 'M+F'];
    const colWidths = [60, 15, 15, 15, 15, 15, 15, 20];
    
    // Group diseases by system categories dynamically from actual data
    const systemCategories = [];
    
    // Group diagnoses by affected system from actual database data
    const systemGroups = new Map();
    
    stats.ageGenderBreakdown.forEach(diagnosis => {
      // Find the system this diagnosis belongs to based on affectedSystems data
      const system = stats.affectedSystems.find(s => {
        const systemLower = s.system.toLowerCase();
        const diagnosisLower = diagnosis.disease.toLowerCase();
        
        // Check if this diagnosis belongs to this system
        if (systemLower.includes('urogenital') && 
            (diagnosisLower.includes('sti') || diagnosisLower.includes('std') || 
             diagnosisLower.includes('abortion') || diagnosisLower.includes('pih') || 
             diagnosisLower.includes('placenta') || diagnosisLower.includes('dysmenorrhea') ||
             diagnosisLower.includes('aph') || diagnosisLower.includes('pph') ||
             diagnosisLower.includes('uti') || diagnosisLower.includes('pid'))) {
          return true;
        }
        
        if (systemLower.includes('cardiovascular') && 
            (diagnosisLower.includes('hypertension') || diagnosisLower.includes('anemia') || 
             diagnosisLower.includes('heart failure') || diagnosisLower.includes('congestive'))) {
          return true;
        }
        
        if (systemLower.includes('cns') || systemLower.includes('musculoskeletal')) {
          if (diagnosisLower.includes('meningitis') || diagnosisLower.includes('paralysis') || 
              diagnosisLower.includes('epilepsy') || diagnosisLower.includes('back pain') || 
              diagnosisLower.includes('arthritis') || diagnosisLower.includes('shoulder') ||
              diagnosisLower.includes('dislocation')) {
            return true;
          }
        }
        
        if (systemLower.includes('respiratory') && 
            (diagnosisLower.includes('urti') || diagnosisLower.includes('pneumonia') || 
             diagnosisLower.includes('asthma') || diagnosisLower.includes('tuberculosis') ||
             diagnosisLower.includes('cold'))) {
          return true;
        }
        
        if (systemLower.includes('digestive') && 
            (diagnosisLower.includes('diarrhea') || diagnosisLower.includes('gastritis') || 
             diagnosisLower.includes('dysentery') || diagnosisLower.includes('ulcer') ||
             diagnosisLower.includes('typhoid') || diagnosisLower.includes('hepatitis'))) {
          return true;
        }
        
        if (systemLower.includes('dermatological') || systemLower.includes('skin')) {
          if (diagnosisLower.includes('skin') || diagnosisLower.includes('allergy') || 
              diagnosisLower.includes('dermatitis') || diagnosisLower.includes('fungal') ||
              diagnosisLower.includes('scabies') || diagnosisLower.includes('cellulitis')) {
            return true;
          }
        }
        
        return false;
      });
      
      const systemName = system ? system.system : 'Others';
      
      if (!systemGroups.has(systemName)) {
        systemGroups.set(systemName, []);
      }
      systemGroups.get(systemName).push(diagnosis);
    });
    
    // Convert to the expected format
    systemGroups.forEach((diagnoses, systemName) => {
      systemCategories.push({
        title: systemName,
        diseases: diagnoses.map(d => d.disease)
      });
    });
    
    systemCategories.forEach(category => {
      // Category header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(category.title, 20, yPos);
      yPos += 6;
      
      // Prepare disease data for this category - use actual diagnosis data
      const categoryData = category.diseases.map(disease => {
        // Find exact matching diagnosis data from ageGenderBreakdown
        const matchingDiagnosis = stats.ageGenderBreakdown.find(d => d.disease === disease);
        
        if (matchingDiagnosis) {
          return [
            disease,
            matchingDiagnosis.under5M.toString(),
            matchingDiagnosis.under5F.toString(), 
            matchingDiagnosis.over5M.toString(),
            matchingDiagnosis.over5F.toString(),
            matchingDiagnosis.totalM.toString(),
            matchingDiagnosis.totalF.toString(),
            matchingDiagnosis.total.toString()
          ];
        } else {
          return [disease, '0', '0', '0', '0', '0', '0', '0'];
        }
      });
      
      // Add total row for category
      const categoryTotal = categoryData.reduce((acc, row) => {
        for (let i = 1; i < 8; i++) {
          acc[i] = (parseInt(acc[i]) + parseInt(row[i])).toString();
        }
        return acc;
      }, ['Total', '0', '0', '0', '0', '0', '0', '0']);
      
      categoryData.push(categoryTotal);
      
      yPos = drawTable(diseaseHeaders, categoryData, yPos, colWidths);
      yPos += 3;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Summary Statistics Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Summary Statistics', 20, yPos);
    yPos += 8;
    
    const summaryHeaders = ['Metric', 'Total', 'Male', 'Female', 'Under 5', 'Over 5'];
    const summaryData = [
      ['Total Patients Registered', stats.totalPatients.toString(), stats.totalMale.toString(), stats.totalFemale.toString(), stats.under5.toString(), stats.over5.toString()],
      ['Males Under 5 Years', stats.under5Male.toString(), stats.under5Male.toString(), '0', stats.under5Male.toString(), '0'],
      ['Females Under 5 Years', stats.under5Female.toString(), '0', stats.under5Female.toString(), stats.under5Female.toString(), '0'],
      ['Males Over 5 Years', stats.over5Male.toString(), stats.over5Male.toString(), '0', '0', stats.over5Male.toString()],
      ['Females Over 5 Years', stats.over5Female.toString(), '0', stats.over5Female.toString(), '0', stats.over5Female.toString()],
      ['Total Clinical Visits', stats.totalVisits.toString(), '-', '-', '-', '-'],
      ['Laboratory Tests Completed', stats.labTests.toString(), '-', '-', '-', '-'],
      ['Pharmacy Dispensations', stats.dispensedDrugs.toString(), '-', '-', '-', '-']
    ];
    
    yPos = drawTable(summaryHeaders, summaryData, yPos, [60, 25, 20, 20, 20, 20]);
    yPos += 5;
    
    // Tropical Diseases Table
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Tropical Diseases Breakdown', 20, yPos);
    yPos += 8;
    
    const tropicalHeaders = ['Disease', 'Cases', 'Percentage'];
    const totalTropical = stats.tropicalDiseases.reduce((sum, d) => sum + d.count, 0);
    const tropicalData = stats.tropicalDiseases.slice(0, 10).map(d => [
      d.disease,
      d.count.toString(),
      totalTropical > 0 ? ((d.count / totalTropical) * 100).toFixed(1) + '%' : '0%'
    ]);
    
    if (tropicalData.length > 0) {
      tropicalData.push(['Total', totalTropical.toString(), '100%']);
      yPos = drawTable(tropicalHeaders, tropicalData, yPos, [80, 30, 30]);
      yPos += 5;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('No tropical diseases recorded in this period', 20, yPos);
      yPos += 10;
    }
    
    // Affected Systems Summary
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Cases by Affected Systems Summary', 20, yPos);
    yPos += 8;
    
    const systemHeaders = ['Affected System', 'Cases', 'Percentage'];
    const totalSystems = stats.affectedSystems.reduce((sum, s) => sum + s.count, 0);
    const systemData = stats.affectedSystems.map(s => [
      s.system,
      s.count.toString(),
      totalSystems > 0 ? ((s.count / totalSystems) * 100).toFixed(1) + '%' : '0%'
    ]);
    
    if (systemData.length > 0) {
      systemData.push(['Total', totalSystems.toString(), '100%']);
      yPos = drawTable(systemHeaders, systemData, yPos, [80, 30, 30]);
      yPos += 5;
    }
    
    // Demographics Summary
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Demographics Summary', 20, yPos);
    yPos += 8;
    
    const demoHeaders = ['Category', 'Male', 'Female', 'Total', 'Percentage'];
    const demoData = [
      ['Under 5 Years', stats.under5Male.toString(), stats.under5Female.toString(), 
       stats.under5.toString(), stats.totalPatients > 0 ? ((stats.under5 / stats.totalPatients) * 100).toFixed(1) + '%' : '0%'],
      ['Over 5 Years', stats.over5Male.toString(), stats.over5Female.toString(), 
       stats.over5.toString(), stats.totalPatients > 0 ? ((stats.over5 / stats.totalPatients) * 100).toFixed(1) + '%' : '0%'],
      ['Total', stats.totalMale.toString(), stats.totalFemale.toString(), 
       stats.totalPatients.toString(), '100%']
    ];
    
    yPos = drawTable(demoHeaders, demoData, yPos, [50, 25, 25, 25, 25]);
    yPos += 5;
    
    // Top Diagnoses Table
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Top 10 Diagnoses', 20, yPos);
    yPos += 8;
    
    const diagnosisHeaders = ['Rank', 'Diagnosis', 'M<5', 'F<5', 'M>5', 'F>', 'M', 'F', 'Total'];
    const diagnosisData = stats.diagnoses.slice(0, 10).map((d, i) => {
      // Find matching age/gender breakdown data for this diagnosis
      const ageGenderData = stats.ageGenderBreakdown.find(agd => agd.disease === d.diagnosis);
      
      if (ageGenderData) {
        return [
          (i + 1).toString(),
          d.diagnosis.substring(0, 25) + (d.diagnosis.length > 25 ? '...' : ''),
          ageGenderData.under5M.toString(),
          ageGenderData.under5F.toString(),
          ageGenderData.over5M.toString(),
          ageGenderData.over5F.toString(),
          ageGenderData.totalM.toString(),
          ageGenderData.totalF.toString(),
          ageGenderData.total.toString()
        ];
      } else {
        return [
          (i + 1).toString(),
          d.diagnosis.substring(0, 25) + (d.diagnosis.length > 25 ? '...' : ''),
          '0', '0', '0', '0', '0', '0',
          d.count.toString()
        ];
      }
    });
    
    yPos = drawTable(diagnosisHeaders, diagnosisData, yPos, [15, 45, 15, 15, 15, 15, 15, 15, 20]);
    
    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('This report complies with MOH-RSS HMIS reporting standards', 105, 285, { align: 'center' });
    doc.text('Generated by Universal Hospital Management System', 105, 290, { align: 'center' });
    
    const filename = `MOH_HMIS_Report_${selectedClinic === 'all' ? 'All_Branches' : selectedClinic.replace(/\s+/g, '_')}_${dateFrom}_to_${dateTo}.pdf`;
    doc.save(filename);
    toast.success('MOH-standard table format PDF generated successfully');
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate MOH and management reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV Report
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              MOH PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="font-semibold mb-4">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-field">
              <Label className="form-label">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-field">
              <Label className="form-label">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="form-field">
              <Label className="form-label">Clinic</Label>
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clinics</SelectItem>
                  {clinics.map(clinic => (
                    <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchReportData} className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                Generate
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVisits}</p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.labTests}</p>
                <p className="text-sm text-muted-foreground">Lab Tests</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.dispensedDrugs}</p>
                <p className="text-sm text-muted-foreground">Drugs Dispensed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Different Report Types */}
        <Tabs defaultValue="moh" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="moh">MOH Reports</TabsTrigger>
            <TabsTrigger value="registry">Patient Registry</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>

          {/* MOH Reports Tab */}
          <TabsContent value="moh" className="space-y-8">
          {/* Reports Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Tropical Diseases
                </h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Disease</th>
                    <th>Cases</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tropicalDiseases.slice(0, 5).map((disease) => (
                    <tr key={disease.disease}>
                      <td className="font-medium">{disease.disease}</td>
                      <td>{disease.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Affected Systems & Demographics Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Affected Systems
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>System</th>
                      <th>Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.affectedSystems.map((system) => (
                      <tr key={system.system}>
                        <td className="font-medium">{system.system}</td>
                        <td>{system.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Age & Gender Demographics
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Disease</th>
                      <th>M&lt;5</th>
                      <th>F&lt;5</th>
                      <th>M&gt;5</th>
                      <th>F&gt;5</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ageGenderBreakdown.length > 0 ? (
                      stats.ageGenderBreakdown.slice(0, 10).map((item) => (
                        <tr key={item.disease}>
                          <td className="font-medium">{item.disease.length > 20 ? item.disease.substring(0, 20) + '...' : item.disease}</td>
                          <td>{item.under5M}</td>
                          <td>{item.under5F}</td>
                          <td>{item.over5M}</td>
                          <td>{item.over5F}</td>
                          <td className="font-medium">{item.total}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted-foreground py-4">
                          No age & gender data available for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Dispensing Analytics Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Pill className="w-6 h-6 text-accent" />
              Pharmacy & Dispensing Analytics
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Prescribed */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold">Most Prescribed Medications</h3>
                  <p className="text-sm text-muted-foreground mt-1">Top medications by quantity</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Qty</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.medicationStats.mostPrescribed.slice(0, 8).map((med, index) => (
                        <tr key={med.medication}>
                          <td className="font-medium">{med.medication}</td>
                          <td>{med.count}</td>
                          <td>{med.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movement Analysis */}
              <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold">Fast Moving Items</h3>
                    <p className="text-sm text-muted-foreground mt-1">≥1 per day average</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Avg/Day</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.medicationStats.fastMoving.slice(0, 4).map((med) => (
                          <tr key={med.medication}>
                            <td className="font-medium">{med.medication}</td>
                            <td>
                              <span className="text-green-600 font-medium">
                                {med.avgPerDay.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {stats.medicationStats.fastMoving.length === 0 && (
                          <tr>
                            <td colSpan={2} className="text-center text-muted-foreground py-4">
                              No fast moving items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold">Slow Moving Items</h3>
                    <p className="text-sm text-muted-foreground mt-1">&lt;1 per day average</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Avg/Day</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.medicationStats.leastMoving.slice(0, 4).map((med) => (
                          <tr key={med.medication}>
                            <td className="font-medium">{med.medication}</td>
                            <td>
                              <span className="text-red-600 font-medium">
                                {med.avgPerDay.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {stats.medicationStats.leastMoving.length === 0 && (
                          <tr>
                            <td colSpan={2} className="text-center text-muted-foreground py-4">
                              No slow moving items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOH Summary */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                MOH Summary Report
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalPatients}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.under5}</p>
                <p className="text-sm text-muted-foreground">Under 5 Years</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.over5}</p>
                <p className="text-sm text-muted-foreground">Over 5 Years</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.totalVisits}</p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.labTests}</p>
                <p className="text-sm text-muted-foreground">Lab Tests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{stats.dispensedDrugs}</p>
                <p className="text-sm text-muted-foreground">Drugs Dispensed</p>
              </div>
            </div>
          </div>
          </TabsContent>

          {/* Patient Registry Tab */}
          <TabsContent value="registry" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Under 5 Years */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-blue-50 dark:bg-blue-950">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Patients Under 5 Years
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.under5}</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Male (Under 5)</span>
                      <span className="text-xl font-bold text-blue-600">{stats.under5Male}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Female (Under 5)</span>
                      <span className="text-xl font-bold text-pink-600">{stats.under5Female}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="font-medium">Total Under 5</span>
                      <span className="text-xl font-bold text-primary">{stats.under5}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Over 5 Years */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-green-50 dark:bg-green-950">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Patients Over 5 Years
                  </h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.over5}</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Male (Over 5)</span>
                      <span className="text-xl font-bold text-blue-600">{stats.over5Male}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Female (Over 5)</span>
                      <span className="text-xl font-bold text-pink-600">{stats.over5Female}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="font-medium">Total Over 5</span>
                      <span className="text-xl font-bold text-primary">{stats.over5}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Overall Patient Registry Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalMale}</p>
                  <p className="text-sm text-muted-foreground">Total Male</p>
                </div>
                <div className="text-center p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
                  <p className="text-2xl font-bold text-pink-600">{stats.totalFemale}</p>
                  <p className="text-sm text-muted-foreground">Total Female</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{stats.totalPatients}</p>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.totalVisits}</p>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Revenue Report Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Revenue Report
              </h3>
              <p className="text-muted-foreground">Revenue reporting will be implemented based on billing and payment data.</p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm">This section will display:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Total revenue by date range</li>
                  <li>Revenue by service type</li>
                  <li>Revenue by department/clinic</li>
                  <li>Payment methods breakdown</li>
                  <li>Outstanding balances</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Inventory Report Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-accent" />
                Inventory Report
              </h3>
              <p className="text-muted-foreground">Pharmacy inventory reporting based on stock levels and movements.</p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm">This section will display:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Current stock levels by medication</li>
                  <li>Low stock alerts</li>
                  <li>Expired or near-expiry items</li>
                  <li>Stock movement history</li>
                  <li>Reorder recommendations</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Prescriptions Report Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Prescription Report by Doctors
                </h3>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground mb-4">Prescription analytics by prescribing doctor.</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">This section will display:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Total prescriptions by doctor</li>
                    <li>Most prescribed medications per doctor</li>
                    <li>Prescription trends over time</li>
                    <li>Controlled substances tracking</li>
                    <li>Prescription compliance rates</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Reports;
