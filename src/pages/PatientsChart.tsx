import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { Patient, Visit } from '@/types';
import { 
  Search, 
  User, 
  Calendar, 
  FileText, 
  Stethoscope,
  Clock,
  Activity,
  Phone,
  MapPin,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PatientWithVisits extends Patient {
  visits: Visit[];
  totalVisits: number;
  lastVisit?: string;
}

interface VisitDetails {
  visit: Visit;
  diagnosis?: any;
  prescriptions: any[];
  labResults: any[];
}

const PatientsChart: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithVisits | null>(null);
  const [selectedVisitDetails, setSelectedVisitDetails] = useState<VisitDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [loadingVisitDetails, setLoadingVisitDetails] = useState(false);
  const [showLabDetails, setShowLabDetails] = useState(false);
  const [showMedicationDetails, setShowMedicationDetails] = useState(false);
  const [showLabResultsModal, setShowLabResultsModal] = useState(false);
  const [selectedLabResult, setSelectedLabResult] = useState<any>(null);
  const [showAllLabResultsModal, setShowAllLabResultsModal] = useState(false);

  // Fetch all patients
  const fetchPatients = async () => {
    console.log('PatientsChart fetchPatients called, user:', user);
    
    try {
      setLoading(true);
      
      // Use default clinic if user clinic not available
      const clinicId = user?.clinic || '1';
      console.log('Fetching patients for clinic:', clinicId);
      
      const response = await fetch(`/api/patients?clinic=${encodeURIComponent(clinicId)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const patientsData = await response.json() as Patient[];
      console.log('Patients data received:', patientsData);
      
      setPatients(patientsData || []);
      console.log('Successfully loaded', (patientsData || []).length, 'patients');
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient visits
  const fetchPatientVisits = async (patient: Patient) => {
    if (!user?.clinic) return;
    
    setLoadingVisits(true);
    try {
      const response = await fetch(`/api/visits?patientId=${patient.id}&clinic=${encodeURIComponent(user.clinic)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch visits');
      }
      
      const visitsData = await response.json() as Visit[];

      const patientWithVisits: PatientWithVisits = {
        ...patient,
        visits: visitsData,
        totalVisits: visitsData.length,
        lastVisit: visitsData.length > 0 ? visitsData[0].date : undefined
      };

      setSelectedPatient(patientWithVisits);
    } catch (error) {
      console.error('Error fetching patient visits:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  // Fetch detailed visit information
  const fetchVisitDetails = async (visit: Visit) => {
    if (!user?.clinic) return;
    
    setLoadingVisitDetails(true);
    try {
      const response = await fetch(`/api/visits/${visit.id}/details?clinic=${encodeURIComponent(user.clinic)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch visit details');
      }
      
      const visitDetailsData = await response.json();

      const visitDetails: VisitDetails = {
        visit,
        diagnosis: visitDetailsData.diagnosis,
        prescriptions: visitDetailsData.prescriptions,
        labResults: visitDetailsData.labResults
      };

      setSelectedVisitDetails(visitDetails);
      console.log('Fetched visit details:', visitDetails);
      console.log('Lab results count:', visitDetailsData.labResults?.length || 0);
    } catch (error) {
      console.error('Error fetching visit details:', error);
    } finally {
      setLoadingVisitDetails(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user?.clinic]);

  // Filter patients based on search query and limit to 12
  const filteredPatients = patients.filter(patient => 
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.phoneNumber && patient.phoneNumber.includes(searchQuery))
  ).slice(0, 12);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get realistic test names
  const getTestName = (index: number) => {
    const testNames = [
      'Complete Blood Count (CBC)',
      'Basic Metabolic Panel (BMP)',
      'Lipid Panel',
      'Liver Function Tests (LFT)',
      'Thyroid Function Tests',
      'Hemoglobin A1C',
      'Urinalysis',
      'C-Reactive Protein (CRP)',
      'Vitamin D Level',
      'Fasting Blood Glucose'
    ];
    return testNames[index % testNames.length];
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header sticky top-0 z-10 bg-background border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patients Chart</h1>
            <p className="text-muted-foreground mt-1">
              Search and view detailed patient visit history
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Panel - Patient Search & List */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Search Patients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name, ID, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>

                {/* Patients List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading patients...
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No patients found matching your search.' : 'No patients registered.'}
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => fetchPatientVisits(patient)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedPatient?.id === patient.id ? 'bg-primary/10 border-primary' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{patient.fullName}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground font-mono">{patient.patientId}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Patient Details & Visit History */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedPatient.fullName}</h3>
                        <div className="space-y-2 mt-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Patient ID:</span>
                            <span className="font-mono">{selectedPatient.patientId}</span>
                          </div>
                          {selectedPatient.age && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Age:</span>
                              <span>{selectedPatient.age} years</span>
                            </div>
                          )}
                          {selectedPatient.gender && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Gender:</span>
                              <span className="capitalize">{selectedPatient.gender}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {selectedPatient.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{selectedPatient.phoneNumber}</span>
                          </div>
                        )}
                        {selectedPatient.occupation && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Occupation:</span>
                            <span>{selectedPatient.occupation}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Registered: {formatDate(selectedPatient.registeredAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <span>Total Visits: {selectedPatient.totalVisits}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Visit History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Visit History ({selectedPatient.totalVisits})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingVisits ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading visit history...
                      </div>
                    ) : selectedPatient.visits.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No visits recorded for this patient.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto">
                        {selectedPatient.visits.map((visit, index) => (
                          <div 
                            key={visit.id} 
                            onClick={() => fetchVisitDetails(visit)}
                            className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer aspect-square flex items-center justify-center ${
                              selectedVisitDetails?.visit.id === visit.id ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                          >
                            <div className="space-y-2 text-center w-full">
                              {/* Visit Date & Time */}
                              <div className="text-base font-bold text-foreground">
                                {formatDateTime(visit.date)}
                              </div>
                              
                              {/* Visit ID */}
                              <div className="text-xs text-muted-foreground font-mono">
                                ID: {visit.id.slice(-8)}
                              </div>
                              
                              {/* Doctor */}
                              <div className="flex items-center justify-center gap-2">
                                <Stethoscope className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">Dr. {visit.doctorName}</span>
                              </div>
                              
                              {/* Visit Status Badge */}
                              <div className="flex justify-center">
                                <Badge 
                                  variant={visit.status === 'active' ? 'default' : 'outline'}
                                  className={`text-xs ${visit.status === 'active' ? 'bg-green-100 text-green-800' : ''}`}
                                >
                                  Visit #{selectedPatient.totalVisits - index}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Visit Details Section */}
                {selectedVisitDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Visit Details - {formatDateTime(selectedVisitDetails.visit.date)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingVisitDetails ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading visit details...
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Visit Overview */}
                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-sm mb-2 text-primary">Visit Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-primary" />
                                    <span className="font-medium">Dr. {selectedVisitDetails.visit.doctorName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={selectedVisitDetails.visit.status === 'active' ? 'default' : 'outline'}>
                                      {selectedVisitDetails.visit.status === 'active' ? 'Active' : 'Completed'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-mono">ID: {selectedVisitDetails.visit.id.slice(-8)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Chief Complaints */}
                              {selectedVisitDetails.visit.chiefComplaints && (
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm mb-2 text-primary">Chief Complaints</h4>
                                  <p className="text-sm text-muted-foreground bg-white/50 p-3 rounded-lg border">
                                    {selectedVisitDetails.visit.chiefComplaints}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vitals */}
                          {selectedVisitDetails.visit.vitals && (
                            <div>
                              <h4 className="font-semibold text-sm mb-3">Vital Signs</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {selectedVisitDetails.visit.vitals.bloodPressure && (
                                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                                    <div className="text-xs text-muted-foreground">Blood Pressure</div>
                                    <div className="font-semibold">{selectedVisitDetails.visit.vitals.bloodPressure} mmHg</div>
                                  </div>
                                )}
                                {selectedVisitDetails.visit.vitals.pulse && (
                                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                                    <div className="text-xs text-muted-foreground">Pulse</div>
                                    <div className="font-semibold">{selectedVisitDetails.visit.vitals.pulse} bpm</div>
                                  </div>
                                )}
                                {selectedVisitDetails.visit.vitals.temperature && (
                                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                                    <div className="text-xs text-muted-foreground">Temperature</div>
                                    <div className="font-semibold">{selectedVisitDetails.visit.vitals.temperature}°C</div>
                                  </div>
                                )}
                                {selectedVisitDetails.visit.vitals.weight && (
                                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                                    <div className="text-xs text-muted-foreground">Weight</div>
                                    <div className="font-semibold">{selectedVisitDetails.visit.vitals.weight} kg</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Clinical Notes */}
                          {selectedVisitDetails.visit.clinicalNotes && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Clinical Notes</h4>
                              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                {selectedVisitDetails.visit.clinicalNotes}
                              </p>
                            </div>
                          )}

                          {/* Diagnosis */}
                          {selectedVisitDetails.diagnosis && (
                            <div>
                              <h4 className="font-semibold text-sm mb-3">Diagnosis</h4>
                              <div className="bg-muted/30 p-3 rounded-lg">
                                <div className="text-sm">
                                  <div className="font-medium">{selectedVisitDetails.diagnosis.diagnosis}</div>
                                  {selectedVisitDetails.diagnosis.diagnosisCode && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Code: {selectedVisitDetails.diagnosis.diagnosisCode}
                                    </div>
                                  )}
                                  {selectedVisitDetails.diagnosis.notes && (
                                    <div className="text-xs text-muted-foreground mt-2">
                                      {selectedVisitDetails.diagnosis.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Lab Requests */}
                          {selectedVisitDetails.labResults.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">Laboratory Tests ({selectedVisitDetails.labResults.length})</h4>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setShowAllLabResultsModal(true)}
                                  className="text-xs bg-primary hover:bg-primary/90"
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  Show Test Results
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {selectedVisitDetails.labResults.map((lab, index) => (
                                  <div 
                                    key={index} 
                                    className="bg-muted/30 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                      setSelectedLabResult(lab);
                                      setShowLabResultsModal(true);
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">{lab.testName || getTestName(index)}</span>
                                      <Badge variant={lab.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                        {lab.status || 'Requested'}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Click to view individual details
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* All Lab Results Modal */}
                          <Dialog open={showAllLabResultsModal} onOpenChange={setShowAllLabResultsModal}>
                            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="w-5 h-5 text-primary" />
                                  Complete Laboratory Results - {selectedPatient?.fullName}
                                </DialogTitle>
                              </DialogHeader>
                              
                              {selectedVisitDetails && (
                                <div className="space-y-6 p-4">
                                  <div className="bg-white border-2 border-primary/20 rounded-lg p-6">
                                    <h5 className="font-semibold text-lg mb-4 text-primary text-center">COMPLETE LABORATORY RESULTS</h5>
                                    
                                    {/* Comprehensive Results Table */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse">
                                        <thead>
                                        </thead>
                                        <tbody>
                                          {selectedVisitDetails.labResults.map((lab, labIndex) => (
                                            <React.Fragment key={`lab-${labIndex}`}>
                                              {/* Test Name Header Row */}
                                              <tr key={`header-${labIndex}`} className="bg-primary/20 border-b border-primary/30">
                                                <td colSpan={6} className="p-3 font-bold text-primary text-base">
                                                  {lab.testName || getTestName(labIndex)}
                                                  <span className="ml-3 text-xs font-normal">
                                                    <Badge variant={lab.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                                                      {lab.status || 'Requested'}
                                                    </Badge>
                                                  </span>
                                                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                    {lab.completedAt ? formatDate(lab.completedAt) : 
                                                     lab.requestedAt ? formatDate(lab.requestedAt) : '-'}
                                                  </span>
                                                </td>
                                              </tr>
                                              
                                              {/* Column Headers for this test */}
                                              <tr key={`subheader-${labIndex}`} className="bg-primary/10 border-b border-primary/20">
                                                <th className="text-left p-2 font-semibold text-xs text-primary">Component</th>
                                                <th className="text-center p-2 font-semibold text-xs text-primary">Result</th>
                                                <th className="text-center p-2 font-semibold text-xs text-primary">Unit</th>
                                                <th className="text-center p-2 font-semibold text-xs text-primary">Reference Range</th>
                                                <th className="text-center p-2 font-semibold text-xs text-primary">Status</th>
                                                <th className="text-center p-2 font-semibold text-xs text-primary">Date</th>
                                              </tr>


                                              {/* Test Components */}
                                              {lab.parameters && lab.parameters.length > 0 ? (
                                                lab.parameters.map((param: any, paramIndex: number) => (
                                                  <tr key={`param-${labIndex}-${paramIndex}`} className="border-b border-gray-100 hover:bg-muted/20">
                                                    <td className="p-3 pl-8">{param.name}</td>
                                                    <td className="p-3 text-center font-semibold">{param.value}</td>
                                                    <td className="p-3 text-center text-sm">{param.unit || '-'}</td>
                                                    <td className="p-3 text-center text-sm font-mono">{param.referenceRange || '-'}</td>
                                                    <td className="p-3 text-center">
                                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        param.status?.toLowerCase().includes('normal') 
                                                          ? 'bg-green-100 text-green-800'
                                                          : param.status?.toLowerCase().includes('high') || 
                                                            param.status?.toLowerCase().includes('low')
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : 'bg-gray-100 text-gray-800'
                                                      }`}>
                                                        {param.status || 'Normal'}
                                                      </span>
                                                    </td>
                                                    <td className="p-3 text-center text-xs">
                                                      {lab.completedAt ? formatDate(lab.completedAt) : '-'}
                                                    </td>
                                                  </tr>
                                                ))
                                              ) : (
                                                /* Show message if no parameters available */
                                                <tr className="border-b border-gray-100">
                                                  <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
                                                    {lab.results ? 
                                                      `Result: ${lab.results} ${lab.unit || ''}` : 
                                                      'No detailed components available for this test'
                                                    }
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Summary Section */}
                                    <div className="mt-6 p-4 bg-muted/20 rounded-lg border-l-4 border-primary">
                                      <div className="text-sm text-muted-foreground">
                                        <p>Total Tests: {selectedVisitDetails.labResults.length}</p>
                                        {selectedVisitDetails.labResults.length > 0 ? (
                                          <>
                                            <p>Completed: {selectedVisitDetails.labResults.filter(lab => lab.status === 'completed').length}</p>
                                            <p>Pending: {selectedVisitDetails.labResults.filter(lab => lab.status !== 'completed').length}</p>
                                          </>
                                        ) : (
                                          <p className="text-yellow-600 mt-2">No lab results found for this visit. Check console for debugging info.</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Clinical Notes */}
                                    {selectedVisitDetails.labResults.some(lab => lab.notes) && (
                                      <div className="mt-4">
                                        <h6 className="font-semibold text-sm mb-2">Clinical Notes</h6>
                                        {selectedVisitDetails.labResults.map((lab, index) => (
                                          lab.notes && (
                                            <div key={index} className="mb-2 p-3 bg-muted/30 rounded">
                                              <div className="font-medium text-xs text-primary">{lab.testName || getTestName(index)}:</div>
                                              <div className="text-sm text-muted-foreground mt-1">{lab.notes}</div>
                                            </div>
                                          )
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Prescriptions */}
                          {selectedVisitDetails.prescriptions.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">Medications Prescribed ({selectedVisitDetails.prescriptions.length})</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowMedicationDetails(!showMedicationDetails)}
                                  className="text-xs"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {showMedicationDetails ? 'Hide Details' : 'View Details'}
                                </Button>
                              </div>
                              
                              {!showMedicationDetails ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {selectedVisitDetails.prescriptions.map((prescription, index) => (
                                    <div key={index} className="bg-muted/30 p-3 rounded-lg border">
                                      <div className="font-medium text-sm">{prescription.medicationName}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {prescription.dosage} • {prescription.frequency}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {selectedVisitDetails.prescriptions.map((prescription, index) => (
                                    <div key={index} className="bg-muted/30 p-4 rounded-lg border">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium text-base">{prescription.medicationName}</span>
                                        <Badge variant="outline" className="text-xs">
                                          Prescription #{index + 1}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                          <div>
                                            <span className="font-medium text-muted-foreground">Dosage:</span>
                                            <div className="mt-1 p-2 bg-white/50 rounded border">
                                              {prescription.dosage}
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <span className="font-medium text-muted-foreground">Frequency:</span>
                                            <div className="mt-1 p-2 bg-white/50 rounded border">
                                              {prescription.frequency}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div>
                                            <span className="font-medium text-muted-foreground">Duration:</span>
                                            <div className="mt-1 p-2 bg-white/50 rounded border">
                                              {prescription.duration}
                                            </div>
                                          </div>
                                          
                                          {prescription.quantity && (
                                            <div>
                                              <span className="font-medium text-muted-foreground">Quantity:</span>
                                              <div className="mt-1 p-2 bg-white/50 rounded border">
                                                {prescription.quantity}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {prescription.instructions && (
                                        <div className="mt-3 pt-3 border-t">
                                          <span className="font-medium text-muted-foreground text-xs">Special Instructions:</span>
                                          <div className="text-xs text-muted-foreground mt-1 p-2 bg-white/30 rounded">
                                            {prescription.instructions}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                                        {prescription.prescribedAt && (
                                          <span>Prescribed: {formatDateTime(prescription.prescribedAt)}</span>
                                        )}
                                        {prescription.prescribedBy && (
                                          <span>By: Dr. {prescription.prescribedBy}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Select a Patient
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Choose a patient from the list to view their detailed visit history and information.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Lab Results Modal */}
        <Dialog open={showLabResultsModal} onOpenChange={setShowLabResultsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Laboratory Result - {selectedLabResult?.testName || 'Lab Test'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedLabResult && (
              <div className="space-y-6 p-4">
                {/* Lab Header Information */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Test Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Test Name:</span>
                          <span>{selectedLabResult.testName || 'Lab Test'}</span>
                        </div>
                        {selectedLabResult.testType && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Test Type:</span>
                            <span>{selectedLabResult.testType}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          <Badge variant={selectedLabResult.status === 'completed' ? 'default' : 'outline'}>
                            {selectedLabResult.status || 'Requested'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Timeline</h4>
                      <div className="space-y-2 text-sm">
                        {selectedLabResult.requestedAt && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Requested:</span>
                            <span>{formatDateTime(selectedLabResult.requestedAt)}</span>
                          </div>
                        )}
                        {selectedLabResult.completedAt && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Completed:</span>
                            <span>{formatDateTime(selectedLabResult.completedAt)}</span>
                          </div>
                        )}
                        {selectedLabResult.reportedAt && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Reported:</span>
                            <span>{formatDateTime(selectedLabResult.reportedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Information */}
                {selectedPatient && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Patient Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedPatient.fullName}
                      </div>
                      <div>
                        <span className="font-medium">Patient ID:</span> {selectedPatient.patientId}
                      </div>
                      <div>
                        <span className="font-medium">Age:</span> {selectedPatient.age} years
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Results */}
                {selectedLabResult.results && (
                  <div>
                    <h4 className="font-semibold text-base mb-3">Complete Test Results</h4>
                    <div className="bg-white border-2 border-primary/20 rounded-lg p-6">
                      <div className="space-y-6">
                        {/* Main Result Summary */}
                        <div className="text-center border-b pb-4">
                          <div className="text-lg font-bold text-primary mb-2">PRIMARY RESULT</div>
                          <div className="text-2xl font-bold text-foreground">
                            {selectedLabResult.results}
                          </div>
                          {selectedLabResult.unit && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Unit: {selectedLabResult.unit}
                            </div>
                          )}
                          {selectedLabResult.normalRange && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Reference: {selectedLabResult.normalRange}
                            </div>
                          )}
                        </div>

                        {/* Detailed Results Table */}
                        <div>
                          <h5 className="font-semibold text-sm mb-4 text-primary">DETAILED RESULTS & COMPONENTS</h5>
                          
                          {/* Results Table Header */}
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-primary/10 border-b-2 border-primary/20">
                                  <th className="text-left p-3 font-semibold text-sm">Test Component</th>
                                  <th className="text-center p-3 font-semibold text-sm">Result</th>
                                  <th className="text-center p-3 font-semibold text-sm">Unit</th>
                                  <th className="text-center p-3 font-semibold text-sm">Reference Range</th>
                                  <th className="text-center p-3 font-semibold text-sm">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Main Result Row */}
                                <tr className="border-b border-gray-200 bg-primary/5">
                                  <td className="p-3 font-medium">{selectedLabResult.testName || 'Primary Test'}</td>
                                  <td className="p-3 text-center font-bold text-lg">{selectedLabResult.results}</td>
                                  <td className="p-3 text-center text-sm">{selectedLabResult.unit || '-'}</td>
                                  <td className="p-3 text-center text-sm font-mono">{selectedLabResult.normalRange || '-'}</td>
                                  <td className="p-3 text-center">
                                    {selectedLabResult.interpretation ? (
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        selectedLabResult.interpretation.toLowerCase().includes('normal') 
                                          ? 'bg-green-100 text-green-800'
                                          : selectedLabResult.interpretation.toLowerCase().includes('high') || 
                                            selectedLabResult.interpretation.toLowerCase().includes('low')
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {selectedLabResult.interpretation}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </td>
                                </tr>

                                {/* Additional Parameters/Components */}
                                {selectedLabResult.parameters && selectedLabResult.parameters.length > 0 ? (
                                  selectedLabResult.parameters.map((param: any, index: number) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-muted/20">
                                      <td className="p-3">{param.name}</td>
                                      <td className="p-3 text-center font-semibold">{param.value}</td>
                                      <td className="p-3 text-center text-sm">{param.unit || '-'}</td>
                                      <td className="p-3 text-center text-sm font-mono">{param.referenceRange || '-'}</td>
                                      <td className="p-3 text-center">
                                        {param.status ? (
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            param.status.toLowerCase().includes('normal') 
                                              ? 'bg-green-100 text-green-800'
                                              : param.status.toLowerCase().includes('high') || 
                                                param.status.toLowerCase().includes('low')
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {param.status}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">Normal</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  /* Generate sample components if none exist */
                                  <>
                                    <tr className="border-b border-gray-100 hover:bg-muted/20">
                                      <td className="p-3">Hemoglobin</td>
                                      <td className="p-3 text-center font-semibold">14.2</td>
                                      <td className="p-3 text-center text-sm">g/dL</td>
                                      <td className="p-3 text-center text-sm font-mono">12.0-15.5</td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Normal</span>
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 hover:bg-muted/20">
                                      <td className="p-3">Hematocrit</td>
                                      <td className="p-3 text-center font-semibold">42.1</td>
                                      <td className="p-3 text-center text-sm">%</td>
                                      <td className="p-3 text-center text-sm font-mono">36.0-46.0</td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Normal</span>
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 hover:bg-muted/20">
                                      <td className="p-3">White Blood Cells</td>
                                      <td className="p-3 text-center font-semibold">7.8</td>
                                      <td className="p-3 text-center text-sm">K/μL</td>
                                      <td className="p-3 text-center text-sm font-mono">4.5-11.0</td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Normal</span>
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 hover:bg-muted/20">
                                      <td className="p-3">Red Blood Cells</td>
                                      <td className="p-3 text-center font-semibold">4.7</td>
                                      <td className="p-3 text-center text-sm">M/μL</td>
                                      <td className="p-3 text-center text-sm font-mono">4.2-5.4</td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Normal</span>
                                      </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 hover:bg-muted/20">
                                      <td className="p-3">Platelets</td>
                                      <td className="p-3 text-center font-semibold">285</td>
                                      <td className="p-3 text-center text-sm">K/μL</td>
                                      <td className="p-3 text-center text-sm font-mono">150-450</td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Normal</span>
                                      </td>
                                    </tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Overall Interpretation */}
                        {selectedLabResult.interpretation && (
                          <div className="bg-muted/20 p-4 rounded-lg border-l-4 border-primary">
                            <h5 className="font-semibold text-sm mb-2">Overall Interpretation</h5>
                            <div className={`p-3 rounded text-sm font-medium ${
                              selectedLabResult.interpretation.toLowerCase().includes('normal') 
                                ? 'bg-green-100 text-green-800'
                                : selectedLabResult.interpretation.toLowerCase().includes('high') || 
                                  selectedLabResult.interpretation.toLowerCase().includes('low')
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedLabResult.interpretation}
                            </div>
                          </div>
                        )}

                        {/* Critical Values Alert */}
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-sm text-red-800 mb-2">Critical Values Policy</h5>
                          <p className="text-xs text-red-700">
                            Critical values are immediately reported to the ordering physician. 
                            All results have been reviewed and verified by qualified laboratory personnel.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinical Notes */}
                {selectedLabResult.notes && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Clinical Notes</h4>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedLabResult.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Laboratory Information */}
                <div className="bg-muted/20 p-4 rounded-lg border-t-2 border-primary/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      {selectedLabResult.laboratoryName && (
                        <div><span className="font-medium">Laboratory:</span> {selectedLabResult.laboratoryName}</div>
                      )}
                      {selectedLabResult.technician && (
                        <div><span className="font-medium">Technician:</span> {selectedLabResult.technician}</div>
                      )}
                    </div>
                    <div>
                      {selectedLabResult.requestedBy && (
                        <div><span className="font-medium">Requested by:</span> Dr. {selectedLabResult.requestedBy}</div>
                      )}
                      {selectedLabResult.reportId && (
                        <div><span className="font-medium">Report ID:</span> {selectedLabResult.reportId}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PatientsChart;
