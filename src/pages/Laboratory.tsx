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
  Download
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

  // Load data on component mount
  useEffect(() => {
    if (!user?.clinic) {
      setLoading(false);
      return;
    }

    loadLabRequests();
    loadLabResults();
    loadPatients();
  }, [user?.clinic]);

  const loadLabRequests = async () => {
    try {
      const response = await fetch(`/api/lab-requests?clinic=${encodeURIComponent(user!.clinic)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lab requests');
      }
      
      const requests = await response.json() as LabRequest[];
      setLabRequests(requests);
    } catch (error) {
      console.error('Error loading lab requests:', error);
      toast.error('Failed to load lab requests');
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
    setSelectedPatientName(patientName);
    setSelectedPatient(patientMap[patientId] || null);
    setSelectedPatientId(patientId);
    setSelectedPatientRequests([]);
    setSelectedTestRequest(null);
    setTestName('');
    setTestComponents([]);
    setResultText('');
    
    // Load patient requests
    try {
      const response = await fetch(`/api/lab-requests?clinic=${encodeURIComponent(user!.clinic)}&patientId=${patientId}&status=pending,partial`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const requests = await response.json() as LabRequest[];
        setSelectedPatientRequests(requests);
        
        if (requests.length > 0) {
          const firstRequest = requests[0];
          setSelectedTestRequest(firstRequest);
          setTestName(firstRequest.testType);
        }
      }
    } catch (error) {
      console.error('Error loading patient requests:', error);
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

  const filteredRequests = labRequests.filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (dateRangeFrom && request.requestedAt < dateRangeFrom) return false;
    if (dateRangeTo && request.requestedAt > dateRangeTo) return false;
    if (patientSearch && !request.patientName.toLowerCase().includes(patientSearch.toLowerCase())) return false;
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

        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as 'list' | 'history')}>
          <TabsList>
            <TabsTrigger value="list">Pending Tests</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search patients..."
                  value={patientSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'partial' | 'completed') => setStatusFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lab Requests</CardTitle>
                  <CardDescription>Select a patient to view their lab requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {Object.entries(groupedRequests).map(([patientId, data]) => (
                        <div key={patientId} className="border rounded-lg p-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => handlePatientSelect(patientId, data.patient?.fullName || 'Unknown')}
                          >
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4" />
                              <div>
                                <p className="font-medium">{data.patient?.fullName || 'Unknown Patient'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.requests.length} test{data.requests.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Results Entry</CardTitle>
                  <CardDescription>
                    {selectedPatient ? `Enter results for ${selectedPatient.fullName}` : 'Select a patient to enter results'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTestRequest ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Test Type</Label>
                        <p className="text-sm font-medium">{selectedTestRequest.testType}</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="resultText">Results</Label>
                        <Textarea
                          id="resultText"
                          value={resultText}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResultText(e.target.value)}
                          placeholder="Enter test results..."
                          rows={6}
                        />
                      </div>

                      <Button 
                        onClick={handleSaveResults}
                        disabled={saving || !resultText.trim()}
                        className="w-full"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Save Results
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TestTube2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a patient to enter test results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test History</CardTitle>
                <CardDescription>View completed lab results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {labResults.length > 0 ? (
                    labResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{result.patientName}</p>
                            <p className="text-sm text-muted-foreground">{result.testType}</p>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No completed results found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Laboratory;
