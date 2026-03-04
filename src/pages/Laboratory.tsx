import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { LabRequest, LabResult, Patient, LabTest } from '@/types';
import { 
  FlaskConical, 
  Clock,
  Check,
  Loader2,
  Search,
  User,
  TestTube2,
  FileText,
  CalendarDays,
  Clock as ClockIcon,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Filter,
  Printer,
  X as XIcon,
  Download,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MindrayIntegration } from '@/components/lab/MindrayIntegration';
import { labAutoSaveService } from '@/services/labAutoSaveService';

// Define handleSavePartialResult globally before component definition
declare global {
  interface Window {
    handleSavePartialResult?: () => Promise<void>;
  }
}

const Laboratory: React.FC = () => {
  const { user } = useAuth();
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientMap, setPatientMap] = useState<Record<string, Patient>>({});
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [selectedPatientRequests, setSelectedPatientRequests] = useState<LabRequest[]>([]);
  const [selectedTestRequest, setSelectedTestRequest] = useState<LabRequest | null>(null);
  const [resultText, setResultText] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'history'>('list');
  const [testName, setTestName] = useState('');
  const [dateRangeFrom, setDateRangeFrom] = useState<string>('');
  const [dateRangeTo, setDateRangeTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'completed'>('all');
  const [testComponents, setTestComponents] = useState<Array<{
    name: string;
    value: string;
    unit: string;
    normalRangeMin: string;
    normalRangeMax: string;
    normalRangeText: string;
    remark: string;
  }>>([]);
  const [sendBackReason, setSendBackReason] = useState('');
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [showResultPreview, setShowResultPreview] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<LabRequest | null>(null);
  const [previewResults, setPreviewResults] = useState<LabResult[]>([]);
  const [showSendBackDialog, setShowSendBackDialog] = useState(false);

  // Auto-save component values to database on blur
  const autoSaveComponentValue = async (requestId: string, componentName: string, value: string, remark: string) => {
    if (!user?.clinic) {
      console.log('Auto-save skipped: No clinic');
      return;
    }
    
    if (!value.trim()) {
      console.log('Auto-save skipped: Empty value');
      return;
    }
    
    console.log('Auto-saving component:', { requestId, componentName, value, remark });
    
    try {
      // Auto-save component value via API
      const response = await fetch(`/api/lab-requests/${requestId}/auto-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          componentName,
          componentValue: value,
          remark: remark
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-save component');
      }
      
      console.log('Auto-saved component successfully');
      toast.success(`${componentName}: ${value} ${remark ? `(${remark})` : ''} saved`);
    } catch (error) {
      console.error('Error auto-saving normal values:', error);
      toast.error(`Failed to save ${componentName}`);
    }
  };

  // Handle blur event to save component value
  const handleComponentBlur = (index: number) => {
    const component = testComponents[index];
    
    if (!selectedTestRequest || !component.value.trim()) {
      return;
    }
    
    autoSaveComponentValue(
      selectedTestRequest.id,
      component.name,
      component.value,
      component.remark
    );
  };

  // Update component value and auto-calculate remarks
  const updateComponentValue = (index: number, field: string, value: string) => {
    if (selectedTestRequest?.status === 'completed') {
      toast.error('This test is completed. Please unlock it first to make changes.');
      return;
    }

    const updatedComponents = [...testComponents];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };

    // Auto-calculate remark for numeric values
    if (field === 'value' && value.trim() && !isNaN(Number(value))) {
      const component = updatedComponents[index];
      if (component.normalRangeMin && component.normalRangeMax) {
        const numValue = parseFloat(value);
        const minValue = parseFloat(component.normalRangeMin);
        const maxValue = parseFloat(component.normalRangeMax);
        
        if (numValue < minValue) {
          updatedComponents[index].remark = 'Low';
        } else if (numValue > maxValue) {
          updatedComponents[index].remark = 'High';
        } else {
          updatedComponents[index].remark = 'Normal';
        }
      }
    }

    setTestComponents(updatedComponents);
  };

  // Load data on component mount
  useEffect(() => {
    console.log('Laboratory useEffect called, user:', user);
    
    if (!user?.clinic) {
      console.log('No user clinic, setting loading to false');
      setLoading(false);
      return;
    }

    loadLabRequests();
    loadLabResults();
    loadPatients();
  }, [user?.clinic]);

  const loadLabRequests = async () => {
    console.log('loadLabRequests called');
    
    try {
      const clinicParam = user?.clinic || '1';
      console.log('Fetching lab requests for clinic:', clinicParam);
      
      const response = await fetch(`/api/lab-requests?clinic=${encodeURIComponent(clinicParam)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lab requests');
      }
      
      const requests = await response.json() as LabRequest[];
      console.log('Lab requests received:', requests);
      console.log('First request data:', requests[0]);
      
      setLabRequests(requests || []);
      console.log('Successfully loaded', (requests || []).length, 'lab requests');
    } catch (error) {
      console.error('Error loading lab requests:', error);
      setLabRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadLabResults = async () => {
    try {
      const response = await fetch(`/api/lab-results?clinic=${encodeURIComponent(user!.clinic)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lab results');
      }
      
      const results = await response.json() as LabResult[];
      setLabResults(results);
    } catch (error) {
      console.error('Error loading lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTestComponents = async (testName: string) => {
    try {
      console.log('Loading components for test:', testName);
      
      // First try to fetch components from database
      const response = await fetch(`/api/lab-tests/code/${encodeURIComponent(testName)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const labTest = await response.json();
        console.log('Fetched lab test with components:', labTest);
        
        if (labTest.components && labTest.components.length > 0) {
          const dbComponents = labTest.components.map((comp: any) => ({
            name: comp.component_name || comp.name,
            value: '',
            unit: comp.unit || '',
            normalRangeMin: '',
            normalRangeMax: '',
            normalRangeText: comp.reference_range || comp.normalRangeText || '',
            remark: ''
          }));
          
          console.log('Setting database components:', dbComponents);
          setTestComponents(dbComponents);
          return;
        }
      }
      
      // Fallback to hardcoded components if not found in database
      const testComponentsMap: { [key: string]: Array<{
        name: string;
        value: string;
        unit: string;
        normalRangeMin: string;
        normalRangeMax: string;
        normalRangeText: string;
        remark: string;
      }> } = {
        'ICT for Malaria': [
          { name: 'P. falciparum', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: 'Negative', remark: '' },
          { name: 'P. vivax', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: 'Negative', remark: '' }
        ],
        'Full Blood Count': [
          { name: 'Hemoglobin', value: '', unit: 'g/dL', normalRangeMin: '12.0', normalRangeMax: '16.0', normalRangeText: '12.0-16.0 g/dL', remark: '' },
          { name: 'White Blood Cells', value: '', unit: '×10³/μL', normalRangeMin: '4.0', normalRangeMax: '11.0', normalRangeText: '4.0-11.0 ×10³/μL', remark: '' },
          { name: 'Platelets', value: '', unit: '×10³/μL', normalRangeMin: '150', normalRangeMax: '450', normalRangeText: '150-450 ×10³/μL', remark: '' }
        ],
        'CBC': [
          { name: 'Hemoglobin', value: '', unit: 'g/dL', normalRangeMin: '12.0', normalRangeMax: '16.0', normalRangeText: '12.0-16.0 g/dL', remark: '' },
          { name: 'White Blood Cells', value: '', unit: '×10³/μL', normalRangeMin: '4.0', normalRangeMax: '11.0', normalRangeText: '4.0-11.0 ×10³/μL', remark: '' },
          { name: 'Red Blood Cells', value: '', unit: '×10⁶/μL', normalRangeMin: '4.5', normalRangeMax: '5.5', normalRangeText: '4.5-5.5 ×10⁶/μL', remark: '' },
          { name: 'Platelets', value: '', unit: '×10³/μL', normalRangeMin: '150', normalRangeMax: '450', normalRangeText: '150-450 ×10³/μL', remark: '' },
          { name: 'Hematocrit', value: '', unit: '%', normalRangeMin: '36', normalRangeMax: '46', normalRangeText: '36-46%', remark: '' }
        ],
        'RFT': [
          { name: 'Urea', value: '', unit: 'mmol/L', normalRangeMin: '2.5', normalRangeMax: '7.5', normalRangeText: '2.5-7.5 mmol/L', remark: '' },
          { name: 'Creatinine', value: '', unit: 'μmol/L', normalRangeMin: '60', normalRangeMax: '120', normalRangeText: '60-120 μmol/L', remark: '' },
          { name: 'Sodium', value: '', unit: 'mmol/L', normalRangeMin: '135', normalRangeMax: '145', normalRangeText: '135-145 mmol/L', remark: '' },
          { name: 'Potassium', value: '', unit: 'mmol/L', normalRangeMin: '3.5', normalRangeMax: '5.0', normalRangeText: '3.5-5.0 mmol/L', remark: '' },
          { name: 'Chloride', value: '', unit: 'mmol/L', normalRangeMin: '95', normalRangeMax: '105', normalRangeText: '95-105 mmol/L', remark: '' }
        ],
        'Urinalysis': [
          { name: 'Protein', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: 'Negative', remark: '' },
          { name: 'Glucose', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: 'Negative', remark: '' },
          { name: 'Blood', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: 'Negative', remark: '' }
        ]
      };
      
      const components = testComponentsMap[testName] || [
        { name: 'Result', value: '', unit: '', normalRangeMin: '', normalRangeMax: '', normalRangeText: '', remark: '' }
      ];
      
      console.log('Setting fallback components:', components);
      setTestComponents(components);
      
    } catch (error) {
      console.error('Error loading test components:', error);
      setTestComponents([]);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await fetch(`/api/patients?clinic=${encodeURIComponent(user!.clinic)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const patients = await response.json() as Patient[];
      const patientMap: Record<string, Patient> = {};
      patients.forEach(patient => {
        patientMap[patient.id] = patient;
      });
      setPatientMap(patientMap);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handlePatientSelect = async (patientId: string, patientName: string) => {
    console.log('Patient selected:', { patientId, patientName });
    console.log('Patient from map:', patientMap[patientId]);
    
    setSelectedPatientName(patientName);
    setSelectedPatient(patientMap[patientId] || null);
    setSelectedPatientId(patientId);
    setSelectedPatientRequests([]);
    setSelectedTestRequest(null);
    setTestName('');
    setTestComponents([]);
    setResultText('');
    
    // If patient not in map, fetch from server
    if (!patientMap[patientId]) {
      try {
        const response = await fetch(`/api/patients/${patientId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const patient = await response.json();
          console.log('Fetched patient details:', patient);
          setSelectedPatient(patient);
          // Update patient map
          setPatientMap(prev => ({ ...prev, [patientId]: patient }));
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
      }
    }
    
    // Load patient requests - filter from existing lab requests for this specific patient
    const patientRequests = filteredRequests.filter(request => 
      (request.patient_id || request.patientId) === patientId
    );
    
    console.log('Setting patient requests for patient:', patientId, patientRequests);
    setSelectedPatientRequests(patientRequests);
    
    if (patientRequests.length > 0) {
      const firstRequest = patientRequests[0];
      setSelectedTestRequest(firstRequest);
      setTestName(firstRequest.test_name || firstRequest.testType);
    } else {
      setSelectedTestRequest(null);
      setTestName('');
    }
  };

  const handleSaveResults = async () => {
    if (!selectedTestRequest || !user) return;
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/lab-requests/${selectedTestRequest.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          components: testComponents,
          resultText,
          performedBy: user.displayName,
          status: 'completed'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save results');
      }

      toast.success('Lab results saved successfully');
      
      // Refresh data
      await loadLabRequests();
      await loadLabResults();
      
      // Clear selection
      setSelectedTestRequest(null);
      setTestComponents([]);
      setResultText('');
      
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save lab results');
    } finally {
      setSaving(false);
    }
  };

  // Handle saving partial results with normal values
  const handleSavePartialResult = async () => {
    if (!selectedTestRequest || !user) return;
    
    setSaving(true);
    
    try {
      const filledComponents = testComponents.filter(comp => comp.value.trim());
      let formattedResultText = '';
      
      if (filledComponents.length > 0) {
        const componentResults = filledComponents.map(comp => {
          const range = comp.normalRangeMin && comp.normalRangeMax 
            ? `${comp.normalRangeMin}-${comp.normalRangeMax} ${comp.unit}`
            : comp.normalRangeText || '';
          
          return `${comp.name}: ${comp.value} ${comp.unit} (Normal: ${range})${comp.remark ? ` - ${comp.remark}` : ''}`;
        });
        formattedResultText = componentResults.join('\n');
      } else {
        formattedResultText = resultText.trim();
        if (!formattedResultText) {
          toast.error('Please enter at least one result to save');
          setSaving(false);
          return;
        }
      }
      
      const response = await fetch(`/api/lab-requests/${selectedTestRequest.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          components: testComponents,
          resultText: formattedResultText,
          performedBy: user.displayName,
          status: 'partial',
          isPartial: true,
          totalComponents: testComponents.length,
          completedComponents: filledComponents.length
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save partial result');
      }
      
      toast.success(`Partial result saved (${filledComponents.length}/${testComponents.length} components)`);
      
      // Refresh data
      await loadLabRequests();
      await loadLabResults();
      
    } catch (error) {
      console.error('Error saving partial result:', error);
      toast.error('Failed to save partial result');
    } finally {
      setSaving(false);
    }
  };

  // Register handleSavePartialResult with the global service
  useEffect(() => {
    console.log('🔧 Registering handleSavePartialResult with labAutoSaveService');
    labAutoSaveService.setHandleSavePartialResult(handleSavePartialResult);
    
    return () => {
      console.log('🔧 Clearing handleSavePartialResult from labAutoSaveService');
      labAutoSaveService.clearHandler();
    };
  }, [handleSavePartialResult]);

  const filteredRequests = labRequests.filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (dateRangeFrom && request.requested_at < dateRangeFrom) return false;
    if (dateRangeTo && request.requested_at > dateRangeTo) return false;
    if (patientSearch && !(request.patient_name || request.patientName || '').toLowerCase().includes(patientSearch.toLowerCase())) return false;
    return true;
  });

  const groupedRequests = filteredRequests.reduce((acc, request) => {
    const patientId = request.patientId;
    if (!acc[patientId]) {
      acc[patientId] = {
        patient: patientMap[patientId] || null,
        requests: []
      };
    }
    acc[patientId].requests.push(request);
    return acc;
  }, {} as Record<string, { patient: Patient | null; requests: LabRequest[] }>);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Laboratory</h1>
            <p className="text-muted-foreground">Manage lab requests and results</p>
          </div>
        </div>

        {/* Patient Details and Queue Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Patient Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Details <span className="text-sm font-normal text-muted-foreground">(click here to hide)</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div><span className="font-medium">OPD No:</span> {filteredRequests.find(r => r.patient_id === selectedPatientId)?.patient_id || selectedPatient?.patient_id || selectedPatient?.patientId || ''}</div>
                  <div><span className="font-medium">Surname:</span> {filteredRequests.find(r => r.patient_id === selectedPatientId)?.last_name || selectedPatient?.last_name || selectedPatient?.fullName?.split(' ')[0] || ''}</div>
                  <div><span className="font-medium">Othernames:</span> {filteredRequests.find(r => r.patient_id === selectedPatientId)?.first_name || selectedPatient?.first_name || selectedPatient?.fullName?.split(' ').slice(1).join(' ') || ''}</div>
                  <div><span className="font-medium">Age:</span> {filteredRequests.find(r => r.patient_id === selectedPatientId)?.age || selectedPatient?.age || ''}</div>
                  <div><span className="font-medium">Sex:</span> {filteredRequests.find(r => r.patient_id === selectedPatientId)?.gender || selectedPatient?.gender || selectedPatient?.sex || ''}</div>
                  <div><span className="font-medium">Residence:</span> {selectedPatient?.village || selectedPatient?.address?.village || 'N/A'}</div>
                  <div><span className="font-medium">Occupation:</span> {selectedPatient?.occupation || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <div><span className="font-medium text-blue-600">Scheme:</span></div>
                  <div><span className="font-medium text-red-600">Rem. Credit:</span></div>
                  <div><span className="font-medium text-orange-600">Note:</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={patientSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Q. No</th>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">From</th>
                      <th className="text-left p-2 font-medium">Mins</th>
                    </tr>
                  </thead>
                </table>
                <div className="h-[150px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <tbody>
                    {(() => {
                      // Group requests by patient and show unique patients
                      const uniquePatients = Array.from(new Map(filteredRequests.map(request => [
                        request.patient_id || request.patientId, 
                        {
                          patientId: request.patient_id || request.patientId,
                          patientName: request.patient_name || request.patientName,
                          requestCount: filteredRequests.filter(r => (r.patient_id || r.patientId) === (request.patient_id || request.patientId)).length,
                          latestRequest: filteredRequests
                            .filter(r => (r.patient_id || r.patientId) === (request.patient_id || request.patientId))
                            .sort((a, b) => new Date(b.requested_at || b.requestedAt).getTime() - new Date(a.requested_at || a.requestedAt).getTime())[0]
                        }
                      ])).values());

                      if (uniquePatients.length > 0) {
                        return uniquePatients.map((patientData, index) => (
                          <tr 
                            key={patientData.patientId}
                            className={`border-t cursor-pointer hover:bg-muted/30 ${
                              selectedPatientId === patientData.patientId ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => handlePatientSelect(patientData.patientId, patientData.patientName)}
                          >
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">{patientData.patientName}</td>
                            <td className="p-2">Lab</td>
                            <td className="p-2">{Math.floor((new Date().getTime() - new Date(patientData.latestRequest.requested_at || patientData.latestRequest.requestedAt || new Date()).getTime()) / (1000 * 60)) || 0}</td>
                          </tr>
                        ));
                      } else {
                        return (
                          <tr>
                            <td colSpan={4} className="h-[130px] text-center text-muted-foreground align-middle">
                              <div className="flex items-center justify-center h-full">
                                No data available in table
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requested Tests and Results Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Requested Tests and Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left Section - Tests Table */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>&nbsp;</div>
                  <div>&nbsp;</div>
                  <div>&nbsp;</div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Tests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPatientRequests.length > 0 ? (
                        (() => {
                          // Group tests by date
                          const groupedByDate = selectedPatientRequests.reduce((groups, request) => {
                            const requestDate = new Date(request.requested_at || request.requestedAt);
                            const dateKey = requestDate.toDateString();
                            if (!groups[dateKey]) {
                              groups[dateKey] = [];
                            }
                            groups[dateKey].push(request);
                            return groups;
                          }, {});

                          // Sort dates in descending order (newest first)
                          const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
                            new Date(b).getTime() - new Date(a).getTime()
                          );

                          return sortedDates.map(dateKey => (
                            <React.Fragment key={dateKey}>
                              {/* Date Header Row */}
                              <tr className="bg-muted/30">
                                <td className="p-2 font-semibold text-sm text-primary">
                                  {new Date(dateKey).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({groupedByDate[dateKey].length} test{groupedByDate[dateKey].length !== 1 ? 's' : ''})
                                  </span>
                                </td>
                              </tr>
                              {/* Tests for this date */}
                              {groupedByDate[dateKey]
                                .sort((a, b) => new Date(b.requested_at || b.requestedAt).getTime() - new Date(a.requested_at || a.requestedAt).getTime())
                                .map((request, index) => (
                                <tr 
                                  key={request.id}
                                  className={`border-t cursor-pointer hover:bg-muted/30 ${
                                    selectedTestRequest?.id === request.id ? 'bg-primary/10' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedTestRequest(request);
                                    setTestName(request.test_name || request.testType);
                                    loadTestComponents(request.test_name || request.testType);
                                  }}
                                >
                                  <td className="p-3 pl-6">
                                    <div className="flex items-center justify-between">
                                      <span>{request.test_name || request.testType}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(request.requested_at || request.requestedAt).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ));
                        })()
                      ) : (
                        <tr>
                          <td className="h-[300px] text-center text-muted-foreground align-middle">
                            <div className="flex items-center justify-center h-full">
                              {selectedPatientId ? 'No tests found for this patient' : 'Select a patient to view tests'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Section - Test Details and Components */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-medium">Test:</span> {selectedTestRequest?.test_name || selectedTestRequest?.testType || ''}
                  </div>
                  <div>
                    <span className="font-medium">Specimen:</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 w-48"
                    />
                  </div>
                </div>
                
                {/* Component Results Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Component</th>
                        <th className="text-left p-3 font-medium">Lower</th>
                        <th className="text-left p-3 font-medium">Upper</th>
                        <th className="text-left p-3 font-medium">Units</th>
                        <th className="text-left p-3 font-medium">Value</th>
                        <th className="text-left p-3 font-medium">Result</th>
                        <th className="text-left p-3 font-medium">Clear</th>
                      </tr>
                    </thead>
                  </table>
                  <div className="h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {testComponents.length > 0 ? (
                          testComponents.map((component, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 font-medium w-[20%]">{component.name}</td>
                              <td className="p-3 w-[12%]">{component.normalRangeMin || ''}</td>
                              <td className="p-3 w-[12%]">{component.normalRangeMax || ''}</td>
                              <td className="p-3 w-[12%]">{component.unit}</td>
                              <td className="p-3 w-[16%]">
                                <Input
                                  value={component.value}
                                  onChange={(e) => updateComponentValue(index, 'value', e.target.value)}
                                  onBlur={() => handleComponentBlur(index)}
                                  className="h-8 w-20"
                                />
                              </td>
                              <td className="p-3 w-[16%]">
                                <Select>
                                  <SelectTrigger className="h-8 w-24">
                                    <SelectValue placeholder="Result" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-3 w-[12%]">
                                <Button variant="outline" size="sm" className="h-8">
                                  Clear
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="h-[300px] text-center text-muted-foreground align-middle">
                              <div className="flex items-center justify-center h-full">
                                No data available in table
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="partiallyDone" className="rounded" />
                    <label htmlFor="partiallyDone" className="text-sm">Is Partially Done</label>
                  </div>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    Submit Lab Report
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">View: Test Requests</CardTitle>
            <div className="flex justify-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={patientSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-muted/50 block w-full">
                  <tr className="table-row">
                    <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 w-1/4">
                      Request No <ChevronUp className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 w-1/4">
                      Visit Id <ChevronUp className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 w-1/4">
                      Name <ChevronUp className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 w-1/4">
                      Requested On <ChevronUp className="inline w-3 h-3 ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="block max-h-[200px] overflow-y-auto">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request, index) => (
                      <tr 
                        key={request.id} 
                        className={`table-row border-t cursor-pointer hover:bg-muted/30 ${
                          selectedTestRequest?.id === request.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => {
                          setSelectedTestRequest(request);
                          setTestName(request.test_name || request.testType);
                          // Also select the patient
                          const patientId = request.patient_id || request.patientId;
                          const patientName = request.patient_name || request.patientName;
                          if (patientId && patientName) {
                            handlePatientSelect(patientId, patientName);
                          }
                        }}
                      >
                        <td className="p-3 w-1/4">{request.id}</td>
                        <td className="p-3 w-1/4">{request.visit_id || request.visitId}</td>
                        <td className="p-3 w-1/4">{request.patient_name || request.patientName}</td>
                        <td className="p-3 w-1/4">{new Date(request.requested_at || request.requestedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="h-[150px] text-center text-muted-foreground align-middle">
                        <div className="flex items-center justify-center h-full">
                          No test requests found
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div>Showing 1 to {Math.min(filteredRequests.length, 10)} of {filteredRequests.length} entries</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>View:</span>
                  <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'partial' | 'completed') => setStatusFilter(value)}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span>Care Type:</span>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="opd">OPD</SelectItem>
                      <SelectItem value="ipd">IPD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span>From:</span>
                  <Input type="date" className="w-32 h-8" defaultValue="2026-03-03" />
                </div>
                <div className="flex items-center gap-2">
                  <span>To:</span>
                  <Input type="date" className="w-32 h-8" defaultValue="2026-03-03" />
                </div>
                <Button size="sm" className="h-8">
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentView === 'history' && (

          /* Test History View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Test History
              </CardTitle>
              <CardDescription>View and manage completed lab results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {labResults.length > 0 ? (
                  <div className="grid gap-4">
                    {labResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{result.patientName}</p>
                                <p className="text-sm text-muted-foreground">{result.testType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Completed: {new Date(result.resultDate || '').toLocaleDateString()}</span>
                              <span>By: {result.performedBy}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Completed</Badge>
                            <Button variant="outline" size="sm">
                              <Printer className="w-3 h-3 mr-1" />
                              Print
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No completed results found</p>
                    <p className="text-sm">Completed test results will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Laboratory;
