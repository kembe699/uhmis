import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
// MySQL API clients for clinical operations
class ClinicalApiClient {
  private baseUrl = '/api/clinical';

  async getPatients(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/patients/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async getQueue(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/queue/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch queue');
      return await response.json();
    } catch (error) {
      console.error('Error fetching queue:', error);
      throw error;
    }
  }

  async getVisits(clinicId: string, doctorId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/visits/${clinicId}/${doctorId}`);
      if (!response.ok) throw new Error('Failed to fetch visits');
      return await response.json();
    } catch (error) {
      console.error('Error fetching visits:', error);
      throw error;
    }
  }

  async createVisit(visitData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData),
      });
      if (!response.ok) throw new Error('Failed to create visit');
      return await response.json();
    } catch (error) {
      console.error('Error creating visit:', error);
      throw error;
    }
  }

  async getLabTests(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lab-tests`);
      if (!response.ok) throw new Error('Failed to fetch lab tests');
      return await response.json();
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      throw error;
    }
  }

  async getMedicines(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/medicines/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch medicines');
      return await response.json();
    } catch (error) {
      console.error('Error fetching medicines:', error);
      throw error;
    }
  }

  async createPrescription(prescriptionData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData),
      });
      if (!response.ok) throw new Error('Failed to create prescription');
      return await response.json();
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  async closeVisit(visitId: string, closedBy: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/visits/${visitId}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closedBy }),
      });
      if (!response.ok) throw new Error('Failed to close visit');
      return await response.json();
    } catch (error) {
      console.error('Error closing visit:', error);
      throw error;
    }
  }

  async removeFromQueue(queueId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/queue/${queueId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove from queue');
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  }

  // Services API methods
  async getServices(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return await response.json();
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async createService(serviceData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error('Failed to create service');
      return await response.json();
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(serviceId: number, serviceData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error('Failed to update service');
      return await response.json();
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(serviceId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete service');
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
}
import { Patient, Visit, LabRequest, PatientQueue } from '@/types';
import { MOH_DIAGNOSES, searchDiagnoses, MOHDiagnosis } from '@/data/mohDiagnoses';
import { 
  Stethoscope, 
  Search, 
  FileText,
  FlaskConical,
  Check,
  Loader2,
  Plus,
  User,
  ClipboardList,
  Clock,
  X,
  Printer,
  Activity,
  TestTube,
  Bell,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const commonChiefComplaints = [
  'Fever',
  'Headache',
  'Cough',
  'Body pain/aches',
  'Abdominal pain',
  'Diarrhea',
  'Vomiting/Nausea',
  'Chest pain',
  'Shortness of breath',
  'Fatigue/weakness',
  'Dizziness',
  'Skin rash',
  'Sore throat',
  'Difficulty urinating',
  'Joint pain',
  'Back pain',
  'Loss of appetite',
  'Weight loss',
  'Insomnia/sleep problems',
  'Anxiety/stress'
];

const Clinical: React.FC = () => {
  const { user } = useAuth();
  
  // API client instance
  const clinicalApi = new ClinicalApiClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientQueue, setPatientQueue] = useState<PatientQueue[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [visitsSearchQuery, setVisitsSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedQueueItem, setSelectedQueueItem] = useState<PatientQueue | null>(null);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [labTestTypes, setLabTestTypes] = useState<string[]>([]);
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  const [customComplaint, setCustomComplaint] = useState('');
  const [showComplaintDropdown, setShowComplaintDropdown] = useState(false);
  const [showLabTestDropdown, setShowLabTestDropdown] = useState(false);
  const [labTestSearch, setLabTestSearch] = useState('');
  const [showVisitDetailsModal, setShowVisitDetailsModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [visitLabRequests, setVisitLabRequests] = useState<LabRequest[]>([]);
  const [visitLabResults, setVisitLabResults] = useState<any[]>([]);
  const [visitDiagnosis, setVisitDiagnosis] = useState<any>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [showResultsPreview, setShowResultsPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicationName: '',
    take: '',
    frequency: '',
    duration: '',
    instructions: '',
    quantity: ''
  });
  const [prescribedMedications, setPrescribedMedications] = useState<Array<{
    medicationName: string;
    take: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: string;
  }>>([]);
  const [availableMedicines, setAvailableMedicines] = useState<Array<{id: string, drug_name: string, current_stock: number, unit_of_measure: string}>>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosis: '',
    diagnosisCode: ''
  });
  const [editingDiagnosis, setEditingDiagnosis] = useState(false);
  
  // Visit Details diagnosis search state (separate from visit form)
  const [visitDiagnosisSearch, setVisitDiagnosisSearch] = useState('');
  const [showVisitDiagnosisDropdown, setShowVisitDiagnosisDropdown] = useState(false);
  const [filteredVisitDiagnoses, setFilteredVisitDiagnoses] = useState<MOHDiagnosis[]>([]);
  const [selectedVisitDiagnosis, setSelectedVisitDiagnosis] = useState<MOHDiagnosis | null>(null);
  const [labNotifications, setLabNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  const [previewPrescriptions, setPreviewPrescriptions] = useState<any[]>([]);
  const [visitHasPrescriptions, setVisitHasPrescriptions] = useState(false);
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<Patient | null>(null);
  const [patientVisitHistory, setPatientVisitHistory] = useState<Visit[]>([]);
  
  // Patient registration state
  const [showPatientRegistrationModal, setShowPatientRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    age: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    beneficiaryType: 'local_residents'
  });
  const [registeringPatient, setRegisteringPatient] = useState(false);
  const [closingVisit, setClosingVisit] = useState(false);
  const [updatingDiagnosis, setUpdatingDiagnosis] = useState(false);
  
  const [visitForm, setVisitForm] = useState({
    chiefComplaints: '',
    clinicalNotes: '',
    diagnosis: '',
    diagnosisCode: ''
  });

  // Diagnosis search state
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [showDiagnosisDropdown, setShowDiagnosisDropdown] = useState(false);
  const [filteredDiagnoses, setFilteredDiagnoses] = useState<MOHDiagnosis[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<MOHDiagnosis | null>(null);
  const [showAddDiagnosisModal, setShowAddDiagnosisModal] = useState(false);
  const [newDiagnosisForm, setNewDiagnosisForm] = useState({
    name: '',
    icd10Code: '',
    category: 'other' as MOHDiagnosis['category'],
    affectedSystem: '',
    isTropicalDisease: false,
    isNotifiable: false
  });

  // Vitals state
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    pulse: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    bmi: '',
    notes: ''
  });

  // Calculate BMI when weight and height change
  const calculateBMI = (weight: string, height: string) => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    
    if (weightNum > 0 && heightNum > 0) {
      const heightInMeters = heightNum / 100; // Convert cm to meters
      const bmi = weightNum / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return '';
  };

  // Handle diagnosis search
  const handleDiagnosisSearch = (searchTerm: string) => {
    setDiagnosisSearch(searchTerm);
    if (searchTerm.trim()) {
      const results = searchDiagnoses(searchTerm);
      setFilteredDiagnoses(results);
      setShowDiagnosisDropdown(true);
    } else {
      setFilteredDiagnoses(MOH_DIAGNOSES.slice(0, 20)); // Show first 20 by default
      setShowDiagnosisDropdown(true);
    }
  };

  // Handle diagnosis selection
  const handleDiagnosisSelect = (diagnosis: MOHDiagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setVisitForm({
      ...visitForm,
      diagnosis: diagnosis.name,
      diagnosisCode: diagnosis.icd10Code
    });
    setDiagnosisSearch(diagnosis.name);
    setShowDiagnosisDropdown(false);
  };

  // Handle adding new diagnosis to master list
  const handleAddNewDiagnosis = async () => {
    if (!newDiagnosisForm.name.trim() || !user?.clinic) {
      toast.error('Please fill in diagnosis name');
      return;
    }

    try {
      const newDiagnosis = {
        ...newDiagnosisForm,
        id: Date.now().toString(),
        clinic: user.clinic,
        addedBy: user.displayName,
        addedAt: new Date().toISOString()
      };

      // Add to Firestore for persistence
      await addDoc(collection(db, 'custom_diagnoses'), newDiagnosis);
      
      toast.success('New diagnosis added successfully');
      setShowAddDiagnosisModal(false);
      setNewDiagnosisForm({
        name: '',
        icd10Code: '',
        category: 'other',
        affectedSystem: '',
        isTropicalDisease: false,
        isNotifiable: false
      });
    } catch (error) {
      console.error('Error adding new diagnosis:', error);
      toast.error('Failed to add new diagnosis');
    }
  };

  // Handle visit diagnosis search (for Visit Details modal)
  const handleVisitDiagnosisSearch = (searchTerm: string) => {
    setVisitDiagnosisSearch(searchTerm);
    if (searchTerm.trim()) {
      const results = searchDiagnoses(searchTerm);
      setFilteredVisitDiagnoses(results);
      setShowVisitDiagnosisDropdown(true);
    } else {
      setFilteredVisitDiagnoses(MOH_DIAGNOSES.slice(0, 20)); // Show first 20 by default
      setShowVisitDiagnosisDropdown(true);
    }
  };

  // Handle visit diagnosis selection (for Visit Details modal)
  const handleVisitDiagnosisSelect = (diagnosis: MOHDiagnosis) => {
    setSelectedVisitDiagnosis(diagnosis);
    setDiagnosisForm({
      diagnosis: diagnosis.name,
      diagnosisCode: diagnosis.icd10Code
    });
    setVisitDiagnosisSearch(diagnosis.name);
    setShowVisitDiagnosisDropdown(false);
  };

  // Update vitals with BMI calculation
  const updateVitals = (field: string, value: string) => {
    const newVitals = { ...vitals, [field]: value };
    
    if (field === 'weight' || field === 'height') {
      newVitals.bmi = calculateBMI(newVitals.weight, newVitals.height);
    }
    
    setVitals(newVitals);
  };

  // Fetch lab tests from database
  const fetchLabTests = async () => {
    if (!user?.clinic) return;
    
    try {
      const tests = await clinicalApi.getLabTests();
      setLabTestTypes(tests);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Failed to fetch lab tests');
    }
  };

  // Fetch available medicines from pharmacy inventory
  const fetchAvailableMedicines = async () => {
    if (!user?.clinic) return;
    
    setLoadingMedicines(true);
    try {
      const medicines = await clinicalApi.getMedicines(user.clinic);
      setAvailableMedicines(medicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to fetch available medicines');
    } finally {
      setLoadingMedicines(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLabTests();
  }, [user?.clinic]);

  // Set up lab notifications (placeholder - no real-time listener for MySQL)
  useEffect(() => {
    if (!user?.clinic) return;

    // TODO: Implement lab notifications when lab system is built
    // For now, just set empty notifications
    setLabNotifications([]);
  }, [user?.clinic]);

  // Mark notification as read (placeholder)
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // TODO: Implement when lab notifications system is built
      console.log('Mark notification as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Close medicine dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.medicine-dropdown-container')) {
        setShowMedicineDropdown(false);
      }
    };

    if (showMedicineDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMedicineDropdown]);

  // Close complaint dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.complaint-dropdown-container')) {
        setShowComplaintDropdown(false);
      }
    };

    if (showComplaintDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showComplaintDropdown]);

  // Close lab test dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.lab-test-dropdown-container')) {
        setShowLabTestDropdown(false);
      }
    };

    if (showLabTestDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLabTestDropdown]);

  // Calculate quantity automatically based on take × frequency × duration
  const calculateQuantity = (take: string, frequency: string, duration: string): string => {
    const takeNum = parseFloat(take) || 0;
    const frequencyNum = parseFloat(frequency) || 0;
    const durationNum = parseFloat(duration) || 0;
    
    if (takeNum > 0 && frequencyNum > 0 && durationNum > 0) {
      const totalQuantity = takeNum * frequencyNum * durationNum;
      return Math.ceil(totalQuantity).toString(); // Round up to ensure sufficient quantity
    }
    return '';
  };

  // Convert numeric frequency to display text
  const getFrequencyDisplay = (frequency: string): string => {
    switch (frequency) {
      case '1': return 'Once daily';
      case '2': return 'Twice daily';
      case '3': return 'Three times daily';
      case '4': return 'Four times daily';
      case '6': return 'Every 4 hours';
      case '8': return 'Every 3 hours';
      case '0': return 'As needed (PRN)';
      default: return frequency;
    }
  };

  // Convert numeric duration to display text
  const getDurationDisplay = (duration: string): string => {
    const days = parseInt(duration);
    if (days === 7) return '7 days (1 week)';
    if (days === 14) return '14 days (2 weeks)';
    if (days === 21) return '21 days (3 weeks)';
    if (days === 30) return '30 days (1 month)';
    if (days === 60) return '60 days (2 months)';
    if (days === 90) return '90 days (3 months)';
    return `${days} days`;
  };

  // Update quantity whenever take, frequency, or duration changes
  useEffect(() => {
    const newQuantity = calculateQuantity(prescriptionForm.take, prescriptionForm.frequency, prescriptionForm.duration);
    if (newQuantity !== prescriptionForm.quantity) {
      setPrescriptionForm(prev => ({ ...prev, quantity: newQuantity }));
    }
  }, [prescriptionForm.take, prescriptionForm.frequency, prescriptionForm.duration]);

  // Add medication to prescription list
  const handleAddMedication = () => {
    if (!prescriptionForm.medicationName || !prescriptionForm.take || !prescriptionForm.frequency || !prescriptionForm.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if medication is already in the list
    if (prescribedMedications.some(med => med.medicationName === prescriptionForm.medicationName)) {
      toast.error('This medication is already in the prescription list');
      return;
    }

    // Check stock availability
    const selectedMedicine = availableMedicines.find(med => med.drug_name === prescriptionForm.medicationName);
    const prescribedQuantity = parseInt(prescriptionForm.quantity) || 0;
    
    if (selectedMedicine && prescribedQuantity > 0) {
      if (prescribedQuantity > selectedMedicine.current_stock) {
        toast.error(`Insufficient stock! Available: ${selectedMedicine.current_stock} ${selectedMedicine.unit_of_measure}, Requested: ${prescribedQuantity} ${selectedMedicine.unit_of_measure}`);
        return;
      }
      
      // Warn if prescribing more than 80% of available stock
      if (prescribedQuantity > (selectedMedicine.current_stock * 0.8)) {
        toast.warning(`Warning: Prescribing ${prescribedQuantity} out of ${selectedMedicine.current_stock} available ${selectedMedicine.unit_of_measure}. Low stock remaining.`);
      }
    }

    setPrescribedMedications([...prescribedMedications, { ...prescriptionForm }]);
    
    // Reset form for next medication
    setPrescriptionForm({
      medicationName: '',
      take: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: ''
    });
    setMedicineSearch('');
    setShowMedicineDropdown(false);
    
    toast.success('Medication added to prescription');
  };

  // Remove medication from prescription list
  const handleRemoveMedication = (index: number) => {
    setPrescribedMedications(prescribedMedications.filter((_, i) => i !== index));
    toast.success('Medication removed from prescription');
  };

  const fetchData = async () => {
    if (!user?.clinic) return;
    
    try {
      // Fetch patients from MySQL
      const patientsData = await clinicalApi.getPatients(user.clinic);
      // Transform MySQL data to match frontend Patient interface
      const transformedPatients = patientsData.map(patient => ({
        id: patient.id,
        patientId: patient.patient_id,
        fullName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        first_name: patient.first_name,
        last_name: patient.last_name,
        age: patient.age,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phoneNumber: patient.phone_number || patient.phone,
        phone: patient.phone,
        occupation: patient.occupation,
        clinic: patient.clinic_id?.toString(),
        registeredAt: patient.createdAt,
        registeredBy: patient.registered_by
      })) as Patient[];
      setPatients(transformedPatients);

      // Fetch patient queue from MySQL
      const queueData = await clinicalApi.getQueue(user.clinic);
      // Transform MySQL data to match frontend PatientQueue interface
      const transformedQueue = queueData.map(queue => ({
        id: queue.id,
        patientId: queue.patient_id,
        patientDocId: queue.patient_id, // Use patient_id as doc id
        patientName: queue.patient_name || 'Unknown',
        age: queue.age || 0,
        clinic: queue.clinic_id?.toString() || user?.clinic || '1',
        doctor: queue.doctor || '',
        priority: queue.priority || 'normal',
        notes: queue.notes || '',
        status: queue.status,
        queuedAt: queue.created_at || queue.queued_at,
        queuedBy: queue.queued_by || 'System'
      })) as PatientQueue[];
      setPatientQueue(transformedQueue);

      // Fetch visits from MySQL
      const visitsData = await clinicalApi.getVisits(user.clinic, user.uid);
      // Transform MySQL data to match frontend Visit interface
      const transformedVisits = visitsData.map(visit => ({
        id: visit.id,
        patientId: visit.patient_id,
        patientName: visit.patient_name,
        clinic: visit.clinic_id.toString(),
        date: visit.date,
        chiefComplaints: visit.chief_complaints,
        clinicalNotes: visit.clinical_notes,
        doctorId: visit.doctor_id,
        doctorName: visit.doctor_name,
        status: visit.status,
        vitals: visit.vitals ? (() => {
          try {
            const parsed = JSON.parse(visit.vitals);
            // Ensure we have a valid object with at least one non-empty value
            return parsed && typeof parsed === 'object' ? parsed : {};
          } catch (error) {
            console.error('Error parsing vitals JSON:', error, 'Raw vitals:', visit.vitals);
            return {};
          }
        })() : {},
        labRequests: visit.lab_requests ? JSON.parse(visit.lab_requests) : []
      }));
      setVisits(transformedVisits);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to create patient bill for lab tests
  const createPatientBillForLabTests = async (visit: any, labTests: string[]) => {
    try {
      // Fetch lab test prices from the database
      const labTestsWithPrices = await Promise.all(
        labTests.map(async (testName) => {
          try {
            const hostname = window.location.hostname;
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
            const baseUrl = isLocalhost ? '/api' : `/api`;
            const response = await fetch(`${baseUrl}/lab-tests/search?q=${encodeURIComponent(testName)}`);
            if (response.ok) {
              const searchResults = await response.json();
              const matchingTest = searchResults.find((test: any) => 
                test.test_name.toLowerCase() === testName.toLowerCase()
              );
              return {
                serviceName: testName,
                quantity: 1,
                unitPrice: parseFloat(matchingTest?.price) || 0,
                totalPrice: parseFloat(matchingTest?.price) || 0
              };
            }
            return {
              serviceName: testName,
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0
            };
          } catch (error) {
            console.error(`Error fetching price for ${testName}:`, error);
            return {
              serviceName: testName,
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0
            };
          }
        })
      );

      const totalAmount = labTestsWithPrices.reduce((sum, test) => sum + (parseFloat(test.totalPrice.toString()) || 0), 0);

      const patientId = selectedPatient.patientId || selectedPatient.id;
      const patientName = selectedPatient.fullName || 
                         `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() ||
                         selectedPatient.patientName ||
                         'Unknown Patient';

      console.log('Clinical - Creating/updating bill for patient:', { patientId, patientName, clinicId: user.clinic });

      // Check for existing active bill for this patient
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? '/api' : `/api`;
      const existingBillResponse = await fetch(`${baseUrl}/patient-bills/active/${patientId}/${user.clinic}`);
      
      let billResponse;
      let billNumber;

      if (existingBillResponse.ok) {
        // Add services to existing bill
        const existingBill = await existingBillResponse.json();
        console.log('Clinical - Found existing bill:', existingBill.bill_number);
        
        const addServicesResponse = await fetch(`${baseUrl}/patient-bills/${existingBill.id}/add-services`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ services: labTestsWithPrices }),
        });

        if (addServicesResponse.ok) {
          billResponse = addServicesResponse;
          billNumber = existingBill.bill_number;
          console.log('Clinical - Added services to existing bill');
          setTimeout(() => {
            toast.success(`Lab tests added to existing bill ${billNumber}`);
          }, 0);
        } else {
          throw new Error('Failed to add services to existing bill');
        }
      } else {
        // Create new bill
        console.log('Clinical - Creating new bill for patient:', patientId);
        const timestamp = Date.now().toString().slice(-6);
        billNumber = `BILL-${new Date().getFullYear()}-${timestamp}`;

        const billData = {
          bill_number: billNumber,
          patient_id: patientId,
          patient_name: patientName,
          clinic_id: parseInt(user.clinic),
          total_amount: totalAmount,
          paid_amount: 0,
          balance_amount: totalAmount,
          status: 'pending', // Use pending status for new bills
          bill_date: new Date().toISOString(),
          due_date: null,
          services: JSON.stringify(labTestsWithPrices),
          notes: `Lab tests requested during clinical visit on ${new Date().toLocaleDateString()}`,
          created_by: user.displayName || 'Unknown User'
        };

        billResponse = await fetch(`${baseUrl}/patient-bills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billData),
        });

        if (billResponse.ok) {
          console.log('Clinical - New patient bill created successfully for lab tests');
          setTimeout(() => {
            toast.success(`New patient bill ${billNumber} created for lab tests`);
          }, 0);
        }
      }

      if (billResponse && billResponse.ok) {
      } else {
        console.error('Failed to create patient bill');
        setTimeout(() => {
          toast.error('Failed to create patient bill');
        }, 0);
      }
    } catch (error) {
      console.error('Error creating patient bill for lab tests:', error);
      // Don't show error toast as this shouldn't block visit creation
    }
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPatient) return;
    
    setSaving(true);
    
    try {
      const visitData: Omit<Visit, 'id'> = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        clinic: user.clinic,
        date: new Date().toISOString(),
        chiefComplaints: selectedComplaints.join(', '),
        clinicalNotes: visitForm.clinicalNotes,
        doctorId: user.uid,
        doctorName: user.displayName,
        status: 'active',
        vitals: {
          bloodPressure: vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic 
            ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}` 
            : '',
          pulse: vitals.pulse,
          temperature: vitals.temperature,
          respiratoryRate: vitals.respiratoryRate,
          oxygenSaturation: vitals.oxygenSaturation,
          weight: vitals.weight,
          height: vitals.height,
          bmi: vitals.bmi,
          notes: vitals.notes
        }
      };

      // Only include labRequests if there are any selected
      if (selectedLabTests.length > 0) {
        visitData.labRequests = selectedLabTests;
      }

      // Debug: Log patient data before creating visit
      console.log('Selected Patient Data:', selectedPatient);
      console.log('Patient Full Name:', selectedPatient.fullName);
      console.log('Patient ID:', selectedPatient.id);
      
      // Ensure we have a valid patient name
      let patientName = selectedPatient.fullName || 
                       `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() ||
                       selectedPatient.patientName || 
                       (selectedQueueItem?.patientName) ||
                       'Unknown Patient';
      
      console.log('Final Patient Name for Visit:', patientName);
      console.log('Vitals state before saving:', vitals);
      console.log('Selected complaints:', selectedComplaints);
      
      // Check if vitals have any actual data
      const hasVitalsData = Object.values(vitals).some(value => value && value.toString().trim() !== '');
      console.log('Has vitals data:', hasVitalsData);
      
      // Transform visit data for MySQL
      const mysqlVisitData = {
        patient_id: selectedPatient.id,
        patient_name: patientName,
        clinic_id: parseInt(user.clinic) || 1,
        visit_date: new Date().toISOString(),
        chief_complaint: selectedComplaints.join(', ') || null,
        clinical_notes: visitForm.clinicalNotes || null,
        doctor_id: user.uid,
        doctor_name: user.displayName || 'Unknown Doctor',
        status: 'active',
        queue_id: selectedQueueItem?.id || null, // Include queue ID for status update
        vitals: (() => {
          const vitalsData = {
            bloodPressure: vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic 
              ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}` 
              : '',
            pulse: vitals.pulse || '',
            temperature: vitals.temperature || '',
            respiratoryRate: vitals.respiratoryRate || '',
            oxygenSaturation: vitals.oxygenSaturation || '',
            weight: vitals.weight || '',
            height: vitals.height || '',
            bmi: vitals.bmi || '',
            notes: vitals.notes || ''
          };
          console.log('Vitals data being stringified:', vitalsData);
          const stringified = JSON.stringify(vitalsData);
          console.log('Stringified vitals:', stringified);
          return stringified;
        })(),
        lab_requests: selectedLabTests.length > 0 ? JSON.stringify(selectedLabTests) : null,
        diagnosis: visitForm.diagnosis || null,
        diagnosis_code: visitForm.diagnosisCode || null
      };

      const visitDoc = await clinicalApi.createVisit(mysqlVisitData);

      // Create patient bill if lab tests are selected
      if (selectedLabTests.length > 0) {
        await createPatientBillForLabTests(visitDoc, selectedLabTests);
      }

      // TODO: Save diagnosis when diagnosis system is implemented

      // Note: Queue status is automatically updated to 'in_progress' by the backend
      // when visit is created (no need to manually remove from queue)

      // Only reset form state AFTER successful API call
      toast.success('Visit created successfully');
      setShowVisitForm(false);
      setSelectedPatient(null);
      setSelectedQueueItem(null);
      setSelectedLabTests([]);
      setSelectedComplaints([]);
      setCustomComplaint('');
      setVisitForm({
        chiefComplaints: '',
        clinicalNotes: '',
        diagnosis: '',
        diagnosisCode: ''
      });
      setVitals({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        pulse: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: '',
        bmi: '',
        notes: ''
      });
      // Refresh data to show newly created visit in Today's Visits
      fetchData();
    } catch (error: any) {
      console.error('Error creating visit:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      toast.error(`Failed to create visit: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomComplaint = () => {
    if (customComplaint.trim() && !selectedComplaints.includes(customComplaint.trim())) {
      setSelectedComplaints([...selectedComplaints, customComplaint.trim()]);
      setCustomComplaint('');
    }
  };

  const handleRemoveComplaint = (complaint: string) => {
    setSelectedComplaints(selectedComplaints.filter(c => c !== complaint));
  };

  // Handle prescription creation
  const handleCreatePrescription = async () => {
    if (!selectedVisit || !user?.clinic || prescribedMedications.length === 0) {
      toast.error('Please add at least one medication to the prescription');
      return;
    }

    setSavingPrescription(true);
    
    try {
      // Create a prescription record for each medication
      const prescriptionPromises = prescribedMedications.map(medication => {
        const prescriptionData = {
          visit_id: selectedVisit.id,
          patient_id: selectedVisit.patientId,
          patient_name: selectedVisit.patientName,
          medication_name: medication.medicationName.trim(),
          take_instructions: medication.take.trim(),
          frequency: medication.frequency.trim(),
          duration: medication.duration.trim(),
          instructions: medication.instructions.trim(),
          quantity: medication.quantity.trim(),
          prescribed_by: user.displayName,
          prescribed_at: new Date().toISOString(),
          clinic_id: parseInt(user.clinic),
          status: 'active'
        };
        return clinicalApi.createPrescription(prescriptionData);
      });

      await Promise.all(prescriptionPromises);
      
      toast.success(`Prescription created successfully with ${prescribedMedications.length} medication${prescribedMedications.length !== 1 ? 's' : ''}`);
      setShowPrescriptionModal(false);
      setPrescriptionForm({
        medicationName: '',
        take: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: ''
      });
      setPrescribedMedications([]);
      setMedicineSearch('');
      setShowMedicineDropdown(false);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  // Handle close visit functionality
  const handleCloseVisit = async (visit: Visit) => {
    if (!user?.displayName) return;

    setClosingVisit(true);
    try {
      // Close visit using MySQL API - this will change status to inactive but keep in Today's Visits
      await clinicalApi.closeVisit(visit.id, user.displayName);

      toast.success('Visit closed successfully. Patient remains in Today\'s Visits with inactive status.');
      setShowVisitDetailsModal(false);
      fetchData(); // Refresh data to update the lists
    } catch (error) {
      console.error('Error closing visit:', error);
      toast.error('Failed to close visit');
    } finally {
      setClosingVisit(false);
    }
  };

  // Handle diagnosis update
  const handleUpdateDiagnosis = async () => {
    if (!selectedVisit || !user?.clinic || !diagnosisForm.diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    setUpdatingDiagnosis(true);
    try {
      // Check if diagnosis already exists for this visit
      const diagnosesRef = collection(db, 'diagnoses');
      const diagnosisQuery = query(
        diagnosesRef,
        where('visitId', '==', selectedVisit.id),
        where('clinic', '==', user.clinic)
      );
      const diagnosisSnapshot = await getDocs(diagnosisQuery);

      const diagnosisData = {
        description: diagnosisForm.diagnosis.trim(),
        code: diagnosisForm.diagnosisCode.trim() || 'UNSPECIFIED',
        ...(selectedVisitDiagnosis && {
          diseaseCategory: selectedVisitDiagnosis.category,
          isTropicalDisease: selectedVisitDiagnosis.isTropicalDisease,
          affectedSystem: selectedVisitDiagnosis.affectedSystem,
          icd10Code: selectedVisitDiagnosis.icd10Code,
          isNotifiable: selectedVisitDiagnosis.isNotifiable
        })
      };

      if (!diagnosisSnapshot.empty) {
        // Update existing diagnosis
        const diagnosisDoc = diagnosisSnapshot.docs[0];
        await updateDoc(doc(db, 'diagnoses', diagnosisDoc.id), {
          ...diagnosisData,
          updatedAt: new Date().toISOString(),
          updatedBy: user.displayName
        });
      } else {
        // Create new diagnosis
        await addDoc(collection(db, 'diagnoses'), {
          visitId: selectedVisit.id,
          patientId: selectedVisit.patientId,
          ...diagnosisData,
          clinic: user.clinic,
          date: new Date().toISOString(),
          doctorId: user.uid,
          doctorName: user.displayName
        });
      }

      toast.success('Diagnosis updated successfully');
      setEditingDiagnosis(false);
      setDiagnosisForm({ diagnosis: '', diagnosisCode: '' });
      
      // Refresh the diagnosis data
      if (selectedVisit) {
        const diagnosesRef = collection(db, 'diagnoses');
        const diagnosisQuery = query(
          diagnosesRef,
          where('visitId', '==', selectedVisit.id),
          where('clinic', '==', user.clinic)
        );
        const diagnosisSnapshot = await getDocs(diagnosisQuery);
        const diagnosisData = !diagnosisSnapshot.empty ? {
          id: diagnosisSnapshot.docs[0].id,
          ...diagnosisSnapshot.docs[0].data()
        } : null;
        setVisitDiagnosis(diagnosisData);
      }
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      toast.error('Failed to update diagnosis');
    } finally {
      setUpdatingDiagnosis(false);
    }
  };

  // Fetch visit details including lab requests and results
  const fetchVisitDetails = async (visit: Visit) => {
    if (!user?.clinic) return;
    
    // Show modal immediately with basic visit data
    setSelectedVisit(visit);
    setShowVisitDetailsModal(true);
    
    // Clear previous data
    setVisitLabRequests([]);
    setVisitLabResults([]);
    setVisitDiagnosis(null);
    setVisitHasPrescriptions(false);
    
    try {
      console.log('Fetching complete visit details for visit:', visit.id);
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? '/api' : `/api`;
      console.log('Making API call to:', `${baseUrl}/clinical/visit-details/${visit.id}`);
      
      // Fetch the complete visit data from the database
      const response = await fetch(`${baseUrl}/clinical/visit-details/${visit.id}`, {
        credentials: 'include'
      });
      
      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);
      
      if (response.ok) {
        const visitDetails = await response.json();
        console.log('Complete visit details received:', visitDetails);
        
        // Update the selected visit with complete data
        const updatedVisit = {
          ...visit,
          patientId: visitDetails.patient_id || visit.patientId, // Use patient_id from database
          clinicalNotes: visitDetails.clinical_notes || '',
          vitals: visitDetails.vitals ? (() => {
            try {
              console.log('Raw vitals from DB:', visitDetails.vitals);
              let parsedVitals = visitDetails.vitals;
              
              // Handle double-escaped JSON strings from database
              if (typeof parsedVitals === 'string') {
                // First parse to get the JSON string
                parsedVitals = JSON.parse(parsedVitals);
                // Second parse to get the actual object
                if (typeof parsedVitals === 'string') {
                  parsedVitals = JSON.parse(parsedVitals);
                }
              }
              
              console.log('Parsed vitals:', parsedVitals);
              return parsedVitals || {};
            } catch (error) {
              console.error('Error parsing vitals:', error, 'Raw data:', visitDetails.vitals);
              return {};
            }
          })() : {},
          labRequests: visitDetails.lab_requests ? (() => {
            try {
              console.log('Raw lab_requests from DB:', visitDetails.lab_requests);
              let parsedLabRequests = visitDetails.lab_requests;
              
              // Handle double-escaped JSON strings from database
              if (typeof parsedLabRequests === 'string') {
                // First parse to get the JSON string
                parsedLabRequests = JSON.parse(parsedLabRequests);
                // Second parse to get the actual array
                if (typeof parsedLabRequests === 'string') {
                  parsedLabRequests = JSON.parse(parsedLabRequests);
                }
              }
              
              console.log('Parsed lab requests:', parsedLabRequests);
              return parsedLabRequests || [];
            } catch (error) {
              console.error('Error parsing lab requests:', error, 'Raw data:', visitDetails.lab_requests);
              return [];
            }
          })() : []
        };
        
        console.log('Updated visit object before setState:', updatedVisit);
        console.log('Updated visit vitals:', updatedVisit.vitals);
        console.log('Updated visit labRequests:', updatedVisit.labRequests);
        
        setSelectedVisit(updatedVisit);
        
        // Set lab requests if available
        if (visitDetails.lab_requests) {
          try {
            console.log('Setting visitLabRequests with:', visitDetails.lab_requests);
            let labRequests = visitDetails.lab_requests;
            
            // Handle double-escaped JSON strings
            if (typeof labRequests === 'string') {
              labRequests = JSON.parse(labRequests);
              if (typeof labRequests === 'string') {
                labRequests = JSON.parse(labRequests);
              }
            }
            
            console.log('Parsed lab requests for state:', labRequests);
            setVisitLabRequests(labRequests || []);
          } catch (error) {
            console.error('Error parsing lab requests for state:', error);
            setVisitLabRequests([]);
          }
        }
        
        // Set diagnosis if available
        if (visitDetails.diagnosis) {
          setVisitDiagnosis({
            diagnosis: visitDetails.diagnosis,
            diagnosisCode: visitDetails.diagnosis_code || ''
          });
        }
        
      } else {
        console.error('Failed to fetch visit details:', response.status);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        // Keep the basic visit data that was already set
      }
      
    } catch (error) {
      console.error('Error fetching visit details:', error);
      toast.error('Failed to fetch complete visit details');
    }
  };

  // Fetch patient visit history
  const fetchPatientHistory = async (patient: Patient) => {
    if (!user?.clinic) return;
    
    try {
      const visitsRef = collection(db, 'visits');
      const historyQuery = query(
        visitsRef,
        where('patientId', '==', patient.patientId),
        where('clinic', '==', user.clinic),
        orderBy('date', 'desc')
      );
      const historySnapshot = await getDocs(historyQuery);
      const history = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Visit[];
      
      setSelectedPatientHistory(patient);
      setPatientVisitHistory(history);
      setShowPatientHistoryModal(true);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      toast.error('Failed to fetch patient history');
    }
  };

  // Register new patient and auto-queue them
  const handleRegisterPatient = async () => {
    if (!user?.clinic) return;
    
    setRegisteringPatient(true);
    try {
      // Generate patient ID
      const patientId = `P${Date.now()}`;
      
      // Create patient document
      const finalAge = registrationForm.age || (registrationForm.dateOfBirth ? calculateAge(registrationForm.dateOfBirth) : '');
      
      const patientData = {
        patientId,
        fullName: registrationForm.fullName,
        dateOfBirth: registrationForm.dateOfBirth,
        age: finalAge,
        gender: registrationForm.gender,
        phoneNumber: registrationForm.phoneNumber,
        clinic: user.clinic,
        registeredAt: new Date().toISOString(),
        registeredBy: user.displayName,
        beneficiaryType: registrationForm.beneficiaryType,
        occupation: ''
      };
      
      const patientDocRef = await addDoc(collection(db, 'patients'), patientData);
      
      // Auto-queue the patient
      const queueData = {
        patientId,
        patientName: registrationForm.fullName,
        age: finalAge,
        queueNumber: await getNextQueueNumber(),
        status: 'waiting',
        queuedAt: new Date().toISOString(),
        queuedBy: user.displayName,
        clinic: user.clinic,
        patientDocId: patientDocRef.id
      };
      
      const queueDocRef = await addDoc(collection(db, 'patient_queue'), queueData);
      
      // Reset form and close modal
      setRegistrationForm({
        fullName: '',
        age: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        beneficiaryType: 'local_residents'
      });
      setShowPatientRegistrationModal(false);
      
      // Refresh data
      await fetchData();
      
      toast.success(`Patient ${registrationForm.fullName} registered and queued successfully!`);
      
      // Auto-open New Clinical Visit modal for the newly registered patient
      const newPatient = {
        id: patientDocRef.id,
        patientId,
        fullName: registrationForm.fullName,
        age: finalAge,
        gender: registrationForm.gender,
        phoneNumber: registrationForm.phoneNumber,
        occupation: '', // Add missing required property
        clinic: user.clinic,
        registeredAt: new Date().toISOString(),
        registeredBy: user.displayName
      };
      
      const newQueueItem = {
        id: queueDocRef.id, // Use the actual document ID from Firestore
        patientId,
        patientName: registrationForm.fullName,
        age: finalAge,
        queueNumber: queueData.queueNumber,
        status: 'waiting',
        queuedAt: new Date().toISOString(),
        queuedBy: user.displayName,
        clinic: user.clinic,
        patientDocId: patientDocRef.id
      };
      
      // Set the newly registered patient as selected and open visit form
      setSelectedPatient({...newPatient, age: parseInt(registrationForm.age) || 0, gender: registrationForm.gender as 'male' | 'female' | 'other'});
      setSelectedQueueItem({...newQueueItem, age: parseInt(registrationForm.age) || 0, status: 'waiting' as const});
      setShowVisitForm(true);
      
    } catch (error) {
      console.error('Error registering patient:', error);
      toast.error('Failed to register patient');
    } finally {
      setRegisteringPatient(false);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Get next queue number
  const getNextQueueNumber = async (): Promise<number> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const queueRef = collection(db, 'patient_queue');
      // Simplified query to avoid index requirements
      const queueQuery = query(
        queueRef,
        where('clinic', '==', user?.clinic)
      );
      const queueSnapshot = await getDocs(queueQuery);
      
      // Filter by today's date in memory instead of in query
      const todayEntries = queueSnapshot.docs.filter(doc => {
        const queuedAt = doc.data().queuedAt;
        return queuedAt && queuedAt.startsWith(today);
      });
      
      return todayEntries.length + 1;
    } catch (error) {
      console.error('Error getting queue number:', error);
      return 1;
    }
  };

  const handleSelectQueuePatient = (queueItem: PatientQueue) => {
    const patient = patients.find(p => p.id === queueItem.patientDocId);
    if (patient) {
      setSelectedPatient(patient);
      setSelectedQueueItem(queueItem);
      setShowVisitForm(true);
    } else {
      // Create a minimal patient object from queue data
      setSelectedPatient({
        id: queueItem.patientDocId,
        patientId: queueItem.patientId,
        fullName: queueItem.patientName || 'Unknown Patient',
        age: queueItem.age,
        occupation: '',
        phoneNumber: '',
        clinic: queueItem.clinic,
        registeredAt: queueItem.queuedAt,
        registeredBy: queueItem.queuedBy
      });
      setSelectedQueueItem(queueItem);
      setShowVisitForm(true);
    }
  };

  const filteredPatients = patients.filter(patient => 
    (patient.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (patient.patientId?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredPatientQueue = patientQueue
    .filter(queueItem => queueItem.status === 'waiting') // Only show waiting patients
    .filter(queueItem => 
      (queueItem.patientName?.toLowerCase() || '').includes(queueSearchQuery.toLowerCase()) ||
      (queueItem.patientId?.toLowerCase() || '').includes(queueSearchQuery.toLowerCase()) ||
      (queueItem.age && queueItem.age.toString().includes(queueSearchQuery))
    );

  const todayVisits = visits.filter(v => 
    v.date?.startsWith(new Date().toISOString().split('T')[0])
  );

  // Show all today's visits (active, completed, and inactive) filtered by search query
  const filteredAllVisits = todayVisits.filter(visit => 
    (visit.patientName?.toLowerCase() || '').includes(visitsSearchQuery.toLowerCase()) ||
    (visit.patientId?.toLowerCase() || '').includes(visitsSearchQuery.toLowerCase()) ||
    (visit.chiefComplaints?.toLowerCase() || '').includes(visitsSearchQuery.toLowerCase()) ||
    (visit.doctorName?.toLowerCase() || '').includes(visitsSearchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clinical Module</h1>
            <p className="text-muted-foreground mt-1">
              {todayVisits.length} visits today • Dr. {user?.displayName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowPatientRegistrationModal(true)} variant="outline" className="quick-action-btn text-black hover:text-black">
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Register Patient</span>
            </Button>
            <Button onClick={() => setShowVisitForm(true)} className="quick-action-btn">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Visit</span>
            </Button>
          </div>
        </div>

        {/* Unified Clinical Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Queue Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Patient Queue ({filteredPatientQueue.length})
              </h3>
              <div className="flex items-center gap-2">
                {/* Lab Results Notification Bell */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    {labNotifications.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {labNotifications.length}
                      </span>
                    )}
                  </Button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-border">
                        <h4 className="font-medium text-sm">Lab Results Ready</h4>
                      </div>
                      {labNotifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No new lab results
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {labNotifications.map((notification) => (
                            <div key={notification.id} className="p-3 hover:bg-muted/50">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertCircle className="w-4 h-4 text-green-500" />
                                    <span className="font-medium text-sm">{notification.patientName}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {notification.testType} - {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Completed by {notification.completedBy}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(notification.completedAt).toLocaleString()}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="text-xs px-2 py-1 h-auto"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => setShowPatientRegistrationModal(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Register Patient
                </Button>
              </div>
            </div>
            {/* Queue Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search queue by name, ID, or age..."
                  value={queueSearchQuery}
                  onChange={(e) => setQueueSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredPatientQueue.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {queueSearchQuery ? 'No patients found matching search' : 'No patients in queue'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {queueSearchQuery ? 'Try a different search term' : 'Patients will appear here after registration'}
                </p>
              </div>
            ) : (
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Age</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPatientQueue.map((queueItem, index) => {
                        const originalIndex = patientQueue.findIndex(item => item.id === queueItem.id);
                        return (
                          <tr
                            key={queueItem.id}
                            onClick={() => handleSelectQueuePatient(queueItem)}
                            className="hover:bg-muted/30 cursor-pointer transition-colors group"
                          >
                            <td className="p-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                                {originalIndex + 1}
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                  {queueItem.patientName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {queueItem.patientId}
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-foreground">
                                {queueItem.age || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Waiting
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-xs text-muted-foreground">
                                {new Date(queueItem.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* All Visits Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Today's Visits ({filteredAllVisits.length})
              </h3>
            </div>

            {/* Visits Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search visits by patient, complaints, or doctor..."
                  value={visitsSearchQuery}
                  onChange={(e) => setVisitsSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredAllVisits.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {visitsSearchQuery ? 'No visits found matching search' : 'No visits recorded'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {visitsSearchQuery ? 'Try a different search term' : 'Visits will appear here as you see patients'}
                </p>
              </div>
            ) : (
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Complaints</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredAllVisits.map((visit) => (
                        <tr
                          key={visit.id}
                          onClick={() => fetchVisitDetails(visit)}
                          className={`hover:bg-muted/30 cursor-pointer transition-colors group ${
                            visit.status === 'inactive' 
                              ? 'opacity-70 bg-gray-50/50' 
                              : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                  {visit.patientName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-right">
                              <p className="text-xs font-medium text-foreground">
                                {new Date(visit.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-foreground line-clamp-2">
                              {visit.chiefComplaints || 'No complaints recorded'}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant={visit.status === 'completed' ? 'outline' : visit.status === 'inactive' ? 'default' : 'secondary'}
                              className={
                                visit.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                  : ''
                              }
                            >
                              {visit.status === 'completed' ? 'Completed' : visit.status === 'inactive' ? 'Closed' : 'Active'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Statistics Section */}
        <div className="mt-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Today's Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat-card">
                <p className="text-3xl font-bold text-primary">{todayVisits.length}</p>
                <p className="text-muted-foreground">Today's Patients</p>
              </div>
              <div className="stat-card">
                <p className="text-3xl font-bold text-primary">{patientQueue.length}</p>
                <p className="text-muted-foreground">Patients Waiting</p>
              </div>
              <div className="stat-card">
                <p className="text-3xl font-bold text-primary">
                  {todayVisits.filter(v => v.labRequests?.length).length}
                </p>
                <p className="text-muted-foreground">Lab Requests Today</p>
              </div>
            </div>

            {/* Search for existing patients */}
            <div className="pt-6 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Search existing patient</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search patient by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              {searchQuery && (
                <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
                  {filteredPatients.slice(0, 5).map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setSelectedQueueItem(null);
                        setShowVisitForm(true);
                        setSearchQuery('');
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        fetchPatientHistory(patient);
                      }}
                      className="w-full flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{patient.fullName}</p>
                        <p className="text-xs text-muted-foreground">{patient.patientId}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchPatientHistory(patient);
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          title="View History"
                        >
                          History
                        </button>
                      </div>
                    </button>
                  ))}
                  {filteredPatients.length === 0 && (
                    <p className="text-center text-muted-foreground py-2 text-sm">No patients found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Visit History Modal */}
        <Dialog open={showPatientHistoryModal} onOpenChange={setShowPatientHistoryModal}>
          <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                Patient Visit History
              </DialogTitle>
              <DialogDescription>
                {selectedPatientHistory && (
                  <>View all previous visits for {selectedPatientHistory.fullName} (ID: {selectedPatientHistory.patientId})</>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {selectedPatientHistory && (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {/* Patient Info Header */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedPatientHistory.fullName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Patient ID: {selectedPatientHistory.patientId} • 
                        Age: {selectedPatientHistory.age || 'N/A'} • 
                        Total Visits: {patientVisitHistory.length}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedPatient(selectedPatientHistory);
                        setSelectedQueueItem(null);
                        setShowPatientHistoryModal(false);
                        setShowVisitForm(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Visit
                    </Button>
                  </div>
                </div>

                {/* Visit History */}
                {patientVisitHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No previous visits found</p>
                    <p className="text-sm text-muted-foreground mt-1">This will be the patient's first visit</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientVisitHistory.map((visit, index) => (
                      <div
                        key={visit.id}
                        className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setShowPatientHistoryModal(false);
                          fetchVisitDetails(visit);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                Visit #{patientVisitHistory.length - index}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(visit.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })} at {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {visit.labRequests && visit.labRequests.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {visit.labRequests.length} lab test{visit.labRequests.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            <Badge 
                              variant={visit.status === 'completed' ? 'default' : 'secondary'}
                              className={visit.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {visit.status === 'completed' ? 'Completed' : 'Active'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Chief Complaints:</p>
                            <p className="text-foreground line-clamp-2">
                              {visit.chiefComplaints || 'No complaints recorded'}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Doctor:</p>
                            <p className="text-foreground">Dr. {visit.doctorName}</p>
                          </div>
                        </div>

                        {visit.clinicalNotes && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="font-medium text-muted-foreground mb-1 text-sm">Clinical Notes:</p>
                            <p className="text-sm text-foreground line-clamp-2">
                              {visit.clinicalNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowPatientHistoryModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lab Results Preview Modal */}
        <Dialog open={showResultsPreview} onOpenChange={setShowResultsPreview}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-primary" />
                Lab Results Preview
              </DialogTitle>
              <DialogDescription>
                View and review lab test results for the selected patient.
              </DialogDescription>
            </DialogHeader>
            
            {previewResult && previewResult.allResults && (
              <div className="space-y-6">
                {/* Patient Information */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Complete Lab Results</h3>
                    <Badge className="bg-green-100 text-green-800">
                      {previewResult.allResults.length} Test{previewResult.allResults.length !== 1 ? 's' : ''} Completed
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Patient:</span> {previewResult.visitInfo.patientName}
                    </div>
                    <div>
                      <span className="font-medium">Visit Date:</span> {new Date(previewResult.visitInfo.date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Doctor:</span> Dr. {previewResult.visitInfo.doctorName}
                    </div>
                    <div>
                      <span className="font-medium">Clinic:</span> {previewResult.visitInfo.clinic}
                    </div>
                  </div>
                </div>

                {/* All Test Results */}
                <div className="space-y-6">
                  {previewResult.allResults.map((result: any, testIdx: number) => (
                    <div key={testIdx} className="border border-border rounded-lg overflow-hidden">
                      {/* Test Header */}
                      <div className="bg-primary/5 border-b border-border p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground text-lg">{result.testType}</h4>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(result.resultDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Performed by: {result.performedBy} • Specimen: Serum
                        </p>
                      </div>

                      {/* Test Results */}
                      {result.componentValues && result.componentValues.length > 0 ? (
                        <div className="p-4">
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left p-3 font-medium text-sm">Component</th>
                                  <th className="text-center p-3 font-medium text-sm">Result</th>
                                  <th className="text-center p-3 font-medium text-sm">Unit</th>
                                  <th className="text-center p-3 font-medium text-sm">Reference Range</th>
                                  <th className="text-center p-3 font-medium text-sm">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {result.componentValues.map((component: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-muted/20">
                                    <td className="p-3 font-medium text-foreground">{component.name}</td>
                                    <td className="p-3 text-center font-medium">{component.value || '-'}</td>
                                    <td className="p-3 text-center text-muted-foreground">{component.unit || ''}</td>
                                    <td className="p-3 text-center text-muted-foreground text-sm">
                                      {component.normalRangeMin && component.normalRangeMax 
                                        ? `${component.normalRangeMin} - ${component.normalRangeMax}`
                                        : component.normalRangeText || 'N/A'}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        component.remark === 'High' ? 'bg-red-100 text-red-700' :
                                        component.remark === 'Low' ? 'bg-orange-100 text-orange-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {component.remark || 'Normal'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="bg-card border rounded-lg p-4">
                            <p className="text-foreground whitespace-pre-wrap">
                              {result.results || 'No detailed results available'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Clinical Notes for this test */}
                      {result.doctorNote && (
                        <div className="px-4 pb-4">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-sm font-medium text-foreground mb-1">Clinical Notes:</p>
                            <p className="text-sm text-foreground">{result.doctorNote}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowResultsPreview(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // Could add print functionality here
                      toast.info('Print functionality coming soon');
                    }}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Results
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Visit Details Modal */}
        <Dialog open={showVisitDetailsModal} onOpenChange={(open) => {
          setShowVisitDetailsModal(open);
          if (!open) {
            // Clear all visit-related state when closing
            setVisitDiagnosis(null);
            setVisitLabRequests([]);
            setVisitLabResults([]);
            setEditingDiagnosis(false);
            setDiagnosisForm({ diagnosis: '', diagnosisCode: '' });
          }
        }}>
          <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                Visit Details
              </DialogTitle>
              <DialogDescription>
                View comprehensive visit information including complaints, notes, and prescriptions.
              </DialogDescription>
            </DialogHeader>
            
            {selectedVisit && (
              <>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {/* Patient Information */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedVisit.patientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Patient ID: {selectedVisit.patientId || 'N/A'} • 
                          Visit Date: {new Date(selectedVisit.date).toLocaleDateString()} • 
                          Time: {new Date(selectedVisit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={selectedVisit.status === 'completed' ? 'default' : 'secondary'}
                          className={selectedVisit.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {selectedVisit.status === 'completed' ? 'Completed' : 'Active'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Seen by Dr. {selectedVisit.doctorName}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('View History clicked');
                            console.log('selectedVisit:', selectedVisit);
                            console.log('patients array:', patients);
                            const patient = patients.find(p => p.patientId === selectedVisit.patientId);
                            console.log('Found patient:', patient);
                            if (patient) {
                              console.log('Calling fetchPatientHistory');
                              fetchPatientHistory(patient);
                            } else {
                              console.log('Patient not found, trying alternative search');
                              const altPatient = patients.find(p => p.fullName === selectedVisit.patientName);
                              console.log('Alternative patient found:', altPatient);
                              if (altPatient) {
                                fetchPatientHistory(altPatient);
                              } else {
                                console.log('No patient found for history');
                                toast.error('Patient not found for history view');
                              }
                            }
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <User className="w-4 h-4 mr-2" />
                          View History
                        </Button>
                        {selectedVisit.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCloseVisit(selectedVisit)}
                            disabled={closingVisit}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                          >
                            {closingVisit ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <X className="w-4 h-4 mr-2" />
                            )}
                            Close Visit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clinical Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-primary" />
                          Chief Complaints
                        </h4>
                        <div className="bg-card border rounded-lg p-3">
                          <p className="text-sm text-foreground">
                            {selectedVisit.chiefComplaints || 'No complaints recorded'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-primary" />
                          Clinical Notes
                        </h4>
                        <div className="bg-card border rounded-lg p-3">
                          <p className="text-sm text-foreground">
                            {selectedVisit.clinicalNotes && selectedVisit.clinicalNotes.trim() !== '' ? selectedVisit.clinicalNotes : 'No clinical notes recorded'}
                          </p>
                        </div>
                      </div>

                      {/* Vitals Section */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-primary" />
                          Vital Signs
                        </h4>
                        <div className="bg-card border rounded-lg p-3">
                          {(() => {
                            console.log('Vitals display check:');
                            console.log('selectedVisit.vitals:', selectedVisit.vitals);
                            console.log('Object.keys(selectedVisit.vitals).length:', selectedVisit.vitals ? Object.keys(selectedVisit.vitals).length : 0);
                            console.log('Object.values check:', selectedVisit.vitals ? Object.values(selectedVisit.vitals).some(value => value && value.toString().trim() !== '') : false);
                            
                            const hasVitals = selectedVisit.vitals && Object.keys(selectedVisit.vitals).length > 0 && Object.values(selectedVisit.vitals).some(value => value && value.toString().trim() !== '');
                            console.log('Final hasVitals result:', hasVitals);
                            return hasVitals;
                          })() ? (
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {selectedVisit.vitals.bloodPressure && selectedVisit.vitals.bloodPressure.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Blood Pressure:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.bloodPressure}</p>
                                </div>
                              )}
                              {selectedVisit.vitals.pulse && selectedVisit.vitals.pulse.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Pulse:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.pulse} bpm</p>
                                </div>
                              )}
                              {selectedVisit.vitals.temperature && selectedVisit.vitals.temperature.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Temperature:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.temperature}°C</p>
                                </div>
                              )}
                              {selectedVisit.vitals.respiratoryRate && selectedVisit.vitals.respiratoryRate.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Respiratory Rate:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.respiratoryRate} /min</p>
                                </div>
                              )}
                              {selectedVisit.vitals.oxygenSaturation && selectedVisit.vitals.oxygenSaturation.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">O2 Saturation:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.oxygenSaturation}%</p>
                                </div>
                              )}
                              {selectedVisit.vitals.weight && selectedVisit.vitals.weight.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Weight:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.weight} kg</p>
                                </div>
                              )}
                              {selectedVisit.vitals.height && selectedVisit.vitals.height.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Height:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.height} cm</p>
                                </div>
                              )}
                              {selectedVisit.vitals.bmi && selectedVisit.vitals.bmi.trim() !== '' && (
                                <div>
                                  <span className="font-medium text-muted-foreground">BMI:</span>
                                  <p className="text-foreground">{selectedVisit.vitals.bmi}</p>
                                </div>
                              )}
                              {selectedVisit.vitals.notes && selectedVisit.vitals.notes.trim() !== '' && (
                                <div className="col-span-2 pt-2 border-t border-muted">
                                  <span className="font-medium text-muted-foreground">Notes:</span>
                                  <p className="text-foreground mt-1">{selectedVisit.vitals.notes}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-foreground">No vital signs recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Diagnosis Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Diagnosis
                          </h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                // Fetch and show prescribed medications for this visit from MySQL
                                try {
                                  const hostname = window.location.hostname;
                                  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
                                  const baseUrl = isLocalhost ? '/api' : `/api`;
                                  
                                  const response = await fetch(`${baseUrl}/clinical/prescriptions/visit/${selectedVisit.id}`);
                                  
                                  if (response.ok) {
                                    const visitPrescriptions = await response.json();
                                    console.log('Fetched prescriptions for visit:', visitPrescriptions);
                                    
                                    if (visitPrescriptions.length === 0) {
                                      toast.info('No prescriptions found for this visit');
                                    } else {
                                      setPreviewPrescriptions(visitPrescriptions);
                                      setShowPrescriptionPreview(true);
                                    }
                                  } else {
                                    console.error('Failed to fetch prescriptions:', response.status);
                                    toast.error('Failed to fetch prescribed medications');
                                  }
                                } catch (error) {
                                  console.error('Error fetching prescriptions:', error);
                                  toast.error('Failed to fetch prescribed medications');
                                }
                              }}
                              className="h-7 px-3 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              <ClipboardList className="w-3 h-3 mr-1" />
                              View Prescriptions
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!editingDiagnosis && visitDiagnosis) {
                                  // Populate form with existing diagnosis data
                                  setDiagnosisForm({
                                    diagnosis: visitDiagnosis.description || '',
                                    diagnosisCode: visitDiagnosis.code === 'UNSPECIFIED' ? '' : (visitDiagnosis.code || '')
                                  });
                                } else if (editingDiagnosis) {
                                  // Clear form when canceling
                                  setDiagnosisForm({ diagnosis: '', diagnosisCode: '' });
                                }
                                setEditingDiagnosis(!editingDiagnosis);
                              }}
                              className="h-7 px-3 text-xs"
                            >
                              {editingDiagnosis ? 'Cancel' : 'Edit'}
                            </Button>
                          </div>
                        </div>
                        
                        {editingDiagnosis ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">Diagnosis *</Label>
                              <div className="relative">
                                <Input
                                  value={visitDiagnosisSearch}
                                  onChange={(e) => handleVisitDiagnosisSearch(e.target.value)}
                                  onFocus={() => handleVisitDiagnosisSearch(visitDiagnosisSearch)}
                                  placeholder="Search for diagnosis..."
                                  className="mt-1 pr-10"
                                />
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                
                                {showVisitDiagnosisDropdown && (
                                  <div className="absolute z-50 left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                    <div className="p-2">
                                      {filteredVisitDiagnoses.length > 0 ? (
                                        <>
                                          {filteredVisitDiagnoses.map((diagnosis) => (
                                            <div
                                              key={diagnosis.id}
                                              onClick={() => handleVisitDiagnosisSelect(diagnosis)}
                                              className="p-3 hover:bg-muted/50 cursor-pointer rounded-md border-b border-border/50 last:border-b-0"
                                            >
                                              <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                  <p className="font-medium text-sm">{diagnosis.name}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    ICD-10: {diagnosis.icd10Code} | {diagnosis.affectedSystem}
                                                  </p>
                                                  <div className="flex gap-1 mt-1">
                                                    {diagnosis.isTropicalDisease && (
                                                      <Badge variant="secondary" className="text-xs">Tropical</Badge>
                                                    )}
                                                    {diagnosis.isNotifiable && (
                                                      <Badge variant="destructive" className="text-xs">Notifiable</Badge>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          <div className="border-t border-border/50 mt-2 pt-2">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setShowAddDiagnosisModal(true);
                                                setShowVisitDiagnosisDropdown(false);
                                              }}
                                              className="w-full text-primary hover:text-primary/80"
                                            >
                                              <Plus className="w-4 h-4 mr-2" />
                                              Add New Diagnosis
                                            </Button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="p-4 text-center">
                                          <p className="text-sm text-muted-foreground mb-2">No diagnoses found</p>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setShowAddDiagnosisModal(true);
                                              setShowVisitDiagnosisDropdown(false);
                                            }}
                                          >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add New Diagnosis
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {selectedVisitDiagnosis && (
                                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-sm">{selectedVisitDiagnosis.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        ICD-10: {selectedVisitDiagnosis.icd10Code} | {selectedVisitDiagnosis.affectedSystem}
                                      </p>
                                      <div className="flex gap-1 mt-1">
                                        {selectedVisitDiagnosis.isTropicalDisease && (
                                          <Badge variant="secondary" className="text-xs">Tropical Disease</Badge>
                                        )}
                                        {selectedVisitDiagnosis.isNotifiable && (
                                          <Badge variant="destructive" className="text-xs">Notifiable Disease</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedVisitDiagnosis(null);
                                        setVisitDiagnosisSearch('');
                                        setDiagnosisForm({ diagnosis: '', diagnosisCode: '' });
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleUpdateDiagnosis}
                                disabled={!diagnosisForm.diagnosis.trim() || updatingDiagnosis}
                                className="flex-1"
                              >
                                {updatingDiagnosis ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                Save Diagnosis
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-card border rounded-lg p-3">
                            {visitDiagnosis ? (
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Diagnosis:</span>
                                  <p className="text-sm text-foreground">{visitDiagnosis.description}</p>
                                </div>
                                {visitDiagnosis.code && visitDiagnosis.code !== 'UNSPECIFIED' && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">ICD Code:</span>
                                    <p className="text-sm text-foreground">{visitDiagnosis.code}</p>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground pt-1 border-t border-muted">
                                  Diagnosed by Dr. {visitDiagnosis.doctorName} on {new Date(visitDiagnosis.date).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground">
                                No diagnosis recorded yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Lab Requests */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-primary" />
                            Laboratory Tests
                            <Badge variant="outline" className="ml-2">
                              {visitLabRequests.length} test{visitLabRequests.length !== 1 ? 's' : ''}
                            </Badge>
                          </h4>
                          {visitLabResults.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewResult({ allResults: visitLabResults, visitInfo: selectedVisit });
                                setShowResultsPreview(true);
                              }}
                              className="h-7 px-3 text-xs"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Preview All Results
                            </Button>
                          )}
                        </div>
                        <div className="bg-card border rounded-lg">
                          {(() => {
                            console.log('Lab requests display check:');
                            console.log('visitLabRequests:', visitLabRequests);
                            console.log('selectedVisit.labRequests:', selectedVisit.labRequests);
                            console.log('visitLabRequests.length:', Array.isArray(visitLabRequests) ? visitLabRequests.length : 'not array');
                            console.log('selectedVisit.labRequests.length:', Array.isArray(selectedVisit.labRequests) ? selectedVisit.labRequests.length : 'not array');
                            
                            const noLabRequests = (!Array.isArray(visitLabRequests) || visitLabRequests.length === 0) && (!Array.isArray(selectedVisit.labRequests) || selectedVisit.labRequests.length === 0);
                            console.log('Final noLabRequests result:', noLabRequests);
                            return noLabRequests;
                          })() ? (
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">No lab tests requested</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-border">
                              {(Array.isArray(visitLabRequests) && visitLabRequests.length > 0 ? visitLabRequests : Array.isArray(selectedVisit.labRequests) ? selectedVisit.labRequests : []).map((request, index) => {
                                // Handle both array of strings and array of objects
                                const testName = typeof request === 'string' ? request : request.testType || request.name;
                                const requestId = typeof request === 'string' ? `lab-${index}` : request.id;
                                const result = visitLabResults.find(r => r.requestId === requestId);
                                return (
                                  <div key={requestId} className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">{testName}</span>
                                      <Badge 
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                      >
                                        Requested
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Test requested for this visit
                                    </div>
                                    {result && (
                                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                        <p className="font-medium text-foreground mb-2">Results Available</p>
                                        
                                        {/* Show brief summary */}
                                        {result.componentValues && result.componentValues.length > 0 ? (
                                          <div className="space-y-1">
                                            <p className="text-muted-foreground">
                                              {result.componentValues.length} component{result.componentValues.length !== 1 ? 's' : ''} tested
                                            </p>
                                            <div className="flex gap-1 flex-wrap">
                                              {result.componentValues.slice(0, 3).map((component: any, idx: number) => (
                                                <span key={idx} className={`px-1 rounded text-xs font-medium ${
                                                  component.remark === 'High' ? 'bg-red-100 text-red-700' :
                                                  component.remark === 'Low' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-green-100 text-green-700'
                                                }`}>
                                                  {component.name}: {component.remark || 'Normal'}
                                                </span>
                                              ))}
                                              {result.componentValues.length > 3 && (
                                                <span className="text-muted-foreground text-xs">
                                                  +{result.componentValues.length - 3} more
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground">
                                            {result.results ? 'Text results available' : 'Results completed'}
                                          </p>
                                        )}
                                        
                                        <p className="text-muted-foreground mt-2 pt-1 border-t border-muted">
                                          Completed: {new Date(result.resultDate).toLocaleDateString()} by {result.performedBy}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Action Buttons */}
                <div className="flex-shrink-0 flex justify-between pt-4 border-t border-border bg-background">
                  <Button
                    variant="outline"
                    onClick={() => setShowVisitDetailsModal(false)}
                  >
                    Close
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setSelectedVisit(selectedVisit);
                        setShowPrescriptionModal(true);
                        setMedicineSearch('');
                        setShowMedicineDropdown(false);
                        setPrescriptionForm({
                          medicationName: '',
                          take: '',
                          frequency: '',
                          duration: '',
                          instructions: '',
                          quantity: ''
                        });
                        setPrescribedMedications([]);
                        fetchAvailableMedicines(); // Fetch medicines when modal opens
                      }}
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Prescribe Medication
                    </Button>
                    <Button
                      onClick={() => {
                        // Could add functionality to edit visit or add follow-up
                        toast.info('Edit functionality coming soon');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Follow-up
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Prescription Preview Modal */}
        <Dialog open={showPrescriptionPreview} onOpenChange={setShowPrescriptionPreview}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-primary" />
                Prescribed Medications ({previewPrescriptions.length})
              </DialogTitle>
              <DialogDescription>
                Review all prescribed medications for this patient visit.
              </DialogDescription>
            </DialogHeader>
            
            {previewPrescriptions.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No medications prescribed for this visit</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Take</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Quantity</th>
                        <th>Instructions</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewPrescriptions.map((prescription: any) => (
                        <tr key={prescription.id}>
                          <td className="font-medium text-primary">{prescription.medication_name || prescription.medicationName}</td>
                          <td>
                            <Badge variant="outline" className="text-xs">
                              {prescription.take_instructions || prescription.take}
                            </Badge>
                          </td>
                          <td className="font-medium">
                            {prescription.frequency === '1' ? 'Once daily' : 
                             prescription.frequency === '2' ? 'Twice daily' :
                             prescription.frequency === '3' ? 'Three times daily' :
                             prescription.frequency === '4' ? 'Four times daily' :
                             prescription.frequency === '6' ? 'Every 4 hours' :
                             prescription.frequency === '8' ? 'Every 3 hours' :
                             prescription.frequency === '0' ? 'As needed' : prescription.frequency}
                          </td>
                          <td className="font-medium">{prescription.duration} days</td>
                          <td className="font-medium">{prescription.quantity}</td>
                          <td className="max-w-xs">
                            <div className="truncate" title={prescription.instructions}>
                              {prescription.instructions || '-'}
                            </div>
                          </td>
                          <td>
                            <Badge 
                              variant={prescription.status === 'dispensed' ? 'default' : 'secondary'}
                              className={prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {prescription.status === 'dispensed' ? 'Dispensed' : 'Active'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowPrescriptionPreview(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Prescription Modal */}
        <Dialog open={showPrescriptionModal} onOpenChange={setShowPrescriptionModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-primary" />
                Prescribe Medication
              </DialogTitle>
              <DialogDescription>
                Add medications to the patient's prescription from available pharmacy stock.
              </DialogDescription>
            </DialogHeader>
            
            {selectedVisit && (
              <div className="space-y-6">
                {/* Patient Information */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedVisit.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        Visit: {new Date(selectedVisit.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prescription Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 relative">
                    <Label className="text-sm font-medium text-foreground">Medication Name *</Label>
                    {loadingMedicines ? (
                      <div className="mt-1 p-3 border rounded-md bg-muted/30 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          Loading available medicines...
                        </div>
                      </div>
                    ) : (
                      <div className="relative medicine-dropdown-container">
                        <Input
                          value={medicineSearch}
                          onChange={(e) => {
                            setMedicineSearch(e.target.value);
                            setShowMedicineDropdown(true);
                          }}
                          onFocus={() => setShowMedicineDropdown(true)}
                          placeholder="Search and select medication from available stock"
                          className="mt-1"
                        />
                        {showMedicineDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {availableMedicines.length === 0 ? (
                              <div className="p-3 text-center text-muted-foreground">
                                No medicines available in stock
                              </div>
                            ) : (
                              availableMedicines
                                .filter(medicine => 
                                  medicine.drug_name.toLowerCase().includes(medicineSearch.toLowerCase())
                                )
                                .map((medicine) => (
                                  <div
                                    key={medicine.id}
                                    className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                                    onClick={() => {
                                      setPrescriptionForm({ ...prescriptionForm, medicationName: medicine.drug_name });
                                      setMedicineSearch(medicine.drug_name);
                                      setShowMedicineDropdown(false);
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{medicine.drug_name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        Stock: {medicine.current_stock} {medicine.unit_of_measure}
                                      </span>
                                    </div>
                                  </div>
                                ))
                            )}
                            {availableMedicines.filter(medicine => 
                              medicine.drug_name.toLowerCase().includes(medicineSearch.toLowerCase())
                            ).length === 0 && medicineSearch && (
                              <div className="p-3 text-center text-muted-foreground">
                                No medicines found matching "{medicineSearch}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Take *</Label>
                    <Input
                      value={prescriptionForm.take}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, take: e.target.value })}
                      placeholder="e.g., 1, 2, 0.5 (number of tablets/units)"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Frequency *</Label>
                    <Select
                      value={prescriptionForm.frequency}
                      onValueChange={(value) => setPrescriptionForm({ ...prescriptionForm, frequency: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Once daily (1x/day)</SelectItem>
                        <SelectItem value="2">Twice daily (2x/day)</SelectItem>
                        <SelectItem value="3">Three times daily (3x/day)</SelectItem>
                        <SelectItem value="4">Four times daily (4x/day)</SelectItem>
                        <SelectItem value="6">Every 4 hours (6x/day)</SelectItem>
                        <SelectItem value="8">Every 3 hours (8x/day)</SelectItem>
                        <SelectItem value="0">As needed (PRN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Duration *</Label>
                    <Select
                      value={prescriptionForm.duration}
                      onValueChange={(value) => setPrescriptionForm({ ...prescriptionForm, duration: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">7 days (1 week)</SelectItem>
                        <SelectItem value="10">10 days</SelectItem>
                        <SelectItem value="14">14 days (2 weeks)</SelectItem>
                        <SelectItem value="21">21 days (3 weeks)</SelectItem>
                        <SelectItem value="30">30 days (1 month)</SelectItem>
                        <SelectItem value="60">60 days (2 months)</SelectItem>
                        <SelectItem value="90">90 days (3 months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Quantity (Auto-calculated)</Label>
                    <div className="space-y-2">
                      <Input
                        value={prescriptionForm.quantity}
                        readOnly
                        placeholder="Will be calculated automatically"
                        className={`mt-1 bg-muted/30 cursor-not-allowed ${
                          prescriptionForm.medicationName && prescriptionForm.quantity ? 
                            (() => {
                              const selectedMedicine = availableMedicines.find(med => med.drug_name === prescriptionForm.medicationName);
                              const prescribedQuantity = parseInt(prescriptionForm.quantity) || 0;
                              if (selectedMedicine && prescribedQuantity > selectedMedicine.current_stock) {
                                return 'border-red-500 bg-red-50';
                              } else if (selectedMedicine && prescribedQuantity > (selectedMedicine.current_stock * 0.8)) {
                                return 'border-yellow-500 bg-yellow-50';
                              }
                              return '';
                            })()
                            : ''
                        }`}
                      />
                      {prescriptionForm.medicationName && (() => {
                        const selectedMedicine = availableMedicines.find(med => med.drug_name === prescriptionForm.medicationName);
                        if (selectedMedicine) {
                          const prescribedQuantity = parseInt(prescriptionForm.quantity) || 0;
                          return (
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Available Stock:</span>
                                <span className={`font-medium ${
                                  prescribedQuantity > selectedMedicine.current_stock ? 'text-red-600' :
                                  prescribedQuantity > (selectedMedicine.current_stock * 0.8) ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {selectedMedicine.current_stock} {selectedMedicine.unit_of_measure}
                                </span>
                              </div>
                              {prescribedQuantity > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Prescribing:</span>
                                  <span className={`font-medium ${
                                    prescribedQuantity > selectedMedicine.current_stock ? 'text-red-600' :
                                    prescribedQuantity > (selectedMedicine.current_stock * 0.8) ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {prescribedQuantity} {selectedMedicine.unit_of_measure}
                                  </span>
                                </div>
                              )}
                              {prescribedQuantity > selectedMedicine.current_stock && (
                                <div className="text-red-600 font-medium">
                                  ⚠️ Insufficient stock! Need {prescribedQuantity - selectedMedicine.current_stock} more {selectedMedicine.unit_of_measure}
                                </div>
                              )}
                              {prescribedQuantity > (selectedMedicine.current_stock * 0.8) && prescribedQuantity <= selectedMedicine.current_stock && (
                                <div className="text-yellow-600 font-medium">
                                  ⚠️ Low stock warning! Only {selectedMedicine.current_stock - prescribedQuantity} {selectedMedicine.unit_of_measure} remaining
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-foreground">Instructions</Label>
                    <Textarea
                      value={prescriptionForm.instructions}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                      placeholder="Special instructions for the patient"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Add Medication Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddMedication}
                    disabled={(() => {
                      if (!prescriptionForm.medicationName || !prescriptionForm.take || !prescriptionForm.frequency || !prescriptionForm.duration) {
                        return true;
                      }
                      const selectedMedicine = availableMedicines.find(med => med.drug_name === prescriptionForm.medicationName);
                      const prescribedQuantity = parseInt(prescriptionForm.quantity) || 0;
                      return selectedMedicine && prescribedQuantity > selectedMedicine.current_stock;
                    })()}
                    className={`${
                      (() => {
                        if (!prescriptionForm.medicationName || !prescriptionForm.take || !prescriptionForm.frequency || !prescriptionForm.duration) {
                          return 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed';
                        }
                        const selectedMedicine = availableMedicines.find(med => med.drug_name === prescriptionForm.medicationName);
                        const prescribedQuantity = parseInt(prescriptionForm.quantity) || 0;
                        if (selectedMedicine && prescribedQuantity > selectedMedicine.current_stock) {
                          return 'bg-red-500 hover:bg-red-500 cursor-not-allowed';
                        }
                        return 'bg-green-600 hover:bg-green-700';
                      })()
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {(() => {
                      if (!prescriptionForm.medicationName || !prescriptionForm.take || !prescriptionForm.frequency || !prescriptionForm.duration) {
                        return 'Add to Prescription';
                      }
                      const selectedMedicine = availableMedicines.find(med => med.drug_name === prescriptionForm.medicationName);
                      const prescribedQuantity = parseInt(prescriptionForm.quantity) || 0;
                      if (selectedMedicine && prescribedQuantity > selectedMedicine.current_stock) {
                        return 'Insufficient Stock';
                      }
                      return 'Add to Prescription';
                    })()}
                  </Button>
                </div>

                {/* Prescribed Medications List */}
                {prescribedMedications.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Prescribed Medications ({prescribedMedications.length})</h3>
                    </div>
                    
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="max-h-60 overflow-y-auto">
                        <table className="data-table">
                          <thead className="sticky top-0 bg-background">
                            <tr>
                              <th>Medication</th>
                              <th>Take</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Quantity</th>
                              <th>Instructions</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prescribedMedications.map((medication, index) => (
                              <tr key={index}>
                                <td className="font-medium text-primary">{medication.medicationName}</td>
                                <td>
                                  <Badge variant="outline" className="text-xs">
                                    {medication.take}
                                  </Badge>
                                </td>
                                <td className="font-medium">{getFrequencyDisplay(medication.frequency)}</td>
                                <td className="font-medium">{getDurationDisplay(medication.duration)}</td>
                                <td className="font-medium">{medication.quantity || '-'}</td>
                                <td className="max-w-xs">
                                  <div className="truncate" title={medication.instructions}>
                                    {medication.instructions || '-'}
                                  </div>
                                </td>
                                <td>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMedication(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setPrescriptionForm({
                        medicationName: '',
                        take: '',
                        frequency: '',
                        duration: '',
                        instructions: '',
                        quantity: ''
                      });
                    }}
                    className="flex-1"
                    disabled={savingPrescription}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePrescription}
                    className="flex-1"
                    disabled={savingPrescription || prescribedMedications.length === 0}
                  >
                    {savingPrescription ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Create Prescription ({prescribedMedications.length} medication{prescribedMedications.length !== 1 ? 's' : ''})
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Visit Form Modal */}
        <Dialog open={showVisitForm} onOpenChange={setShowVisitForm}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-primary" />
                New Clinical Visit
              </DialogTitle>
              <DialogDescription>
                Create a new clinical visit with patient complaints, vital signs, and clinical notes.
              </DialogDescription>
            </DialogHeader>
            
            {selectedPatient && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="font-medium">{selectedPatient.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient.patientId} • Age: {selectedPatient.age || 'N/A'} • {selectedPatient.occupation || 'N/A'}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <form id="visit-form" onSubmit={handleCreateVisit} className="space-y-6">
                
                {/* Section 1: Chief Complaints */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Chief Complaints
                  </h3>
                  
                  <div className="form-field">
                    <Label className="form-label">Chief Complaints *</Label>
                    <div className="relative complaint-dropdown-container">
                      <button
                        type="button"
                        onClick={() => setShowComplaintDropdown(!showComplaintDropdown)}
                        className="w-full p-3 border border-border rounded-lg bg-background hover:bg-muted/50 text-left min-h-[48px] flex items-center justify-between"
                      >
                        <span className={selectedComplaints.length === 0 ? 'text-muted-foreground' : ''}>
                          {selectedComplaints.length === 0 ? 'Select chief complaints...' : `${selectedComplaints.length} complaint${selectedComplaints.length > 1 ? 's' : ''} selected`}
                        </span>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {showComplaintDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          <div className="p-2">
                            <div className="flex gap-2 mb-2">
                              <Input
                                placeholder="Add custom complaint..."
                                value={customComplaint}
                                onChange={(e) => setCustomComplaint(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomComplaint();
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAddCustomComplaint}
                                disabled={!customComplaint.trim()}
                              >
                                Add
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {commonChiefComplaints.map((complaint) => (
                                <label
                                  key={complaint}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedComplaints.includes(complaint)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedComplaints([...selectedComplaints, complaint]);
                                      } else {
                                        setSelectedComplaints(selectedComplaints.filter(c => c !== complaint));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{complaint}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedComplaints.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedComplaints.map((complaint) => (
                          <Badge
                            key={complaint}
                            variant="secondary"
                            className="cursor-pointer hover:bg-muted/80"
                            onClick={() => handleRemoveComplaint(complaint)}
                          >
                            {complaint}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Vital Signs */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Vital Signs
                  </h3>
                  
                  {/* Blood Pressure and Pulse */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                      <Label className="text-sm font-medium">Blood Pressure (mmHg)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Systolic"
                          value={vitals.bloodPressureSystolic}
                          onChange={(e) => updateVitals('bloodPressureSystolic', e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-muted-foreground">/</span>
                        <Input
                          type="number"
                          placeholder="Diastolic"
                          value={vitals.bloodPressureDiastolic}
                          onChange={(e) => updateVitals('bloodPressureDiastolic', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Pulse (bpm)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 72"
                        value={vitals.pulse}
                        onChange={(e) => updateVitals('pulse', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Temperature (°C)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 36.5"
                        value={vitals.temperature}
                        onChange={(e) => updateVitals('temperature', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Respiratory Rate and Oxygen Saturation */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label className="text-sm font-medium">Respiratory Rate (breaths/min)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 16"
                        value={vitals.respiratoryRate}
                        onChange={(e) => updateVitals('respiratoryRate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Oxygen Saturation (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 98"
                        value={vitals.oxygenSaturation}
                        onChange={(e) => updateVitals('oxygenSaturation', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Weight, Height, and BMI */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                      <Label className="text-sm font-medium">Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 70.5"
                        value={vitals.weight}
                        onChange={(e) => updateVitals('weight', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Height (cm)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 175"
                        value={vitals.height}
                        onChange={(e) => updateVitals('height', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">BMI</Label>
                      <Input
                        value={vitals.bmi}
                        readOnly
                        placeholder="Auto-calculated"
                        className="mt-1 bg-muted/50"
                      />
                    </div>
                  </div>

                  {/* Vitals Notes */}
                  <div>
                    <Label className="text-sm font-medium">Vitals Notes</Label>
                    <Textarea
                      placeholder="Additional observations about vital signs..."
                      value={vitals.notes}
                      onChange={(e) => updateVitals('notes', e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Section 3 & 4: Clinical Assessment and Laboratory Requests */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Clinical Assessment */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Clinical Assessment
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="form-field">
                        <Label className="form-label">Clinical Notes</Label>
                        <Textarea
                          value={visitForm.clinicalNotes}
                          onChange={(e) => setVisitForm({ ...visitForm, clinicalNotes: e.target.value })}
                          placeholder="Examination findings, observations..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="form-field">
                          <Label className="form-label">Diagnosis *</Label>
                          <div className="relative">
                            <Input
                              value={diagnosisSearch}
                              onChange={(e) => handleDiagnosisSearch(e.target.value)}
                              onFocus={() => handleDiagnosisSearch(diagnosisSearch)}
                              placeholder="Search for diagnosis..."
                              className="pr-10"
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            
                            {showDiagnosisDropdown && (
                              <div className="absolute z-50 left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <div className="p-2">
                                  {filteredDiagnoses.length > 0 ? (
                                    <>
                                      {filteredDiagnoses.map((diagnosis) => (
                                        <div
                                          key={diagnosis.id}
                                          onClick={() => handleDiagnosisSelect(diagnosis)}
                                          className="p-3 hover:bg-muted/50 cursor-pointer rounded-md border-b border-border/50 last:border-b-0"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">{diagnosis.name}</p>
                                              <p className="text-xs text-muted-foreground">
                                                ICD-10: {diagnosis.icd10Code} | {diagnosis.affectedSystem}
                                              </p>
                                              <div className="flex gap-1 mt-1">
                                                {diagnosis.isTropicalDisease && (
                                                  <Badge variant="secondary" className="text-xs">Tropical</Badge>
                                                )}
                                                {diagnosis.isNotifiable && (
                                                  <Badge variant="destructive" className="text-xs">Notifiable</Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="border-t border-border/50 mt-2 pt-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setShowAddDiagnosisModal(true);
                                            setShowDiagnosisDropdown(false);
                                          }}
                                          className="w-full text-primary hover:text-primary/80"
                                        >
                                          <Plus className="w-4 h-4 mr-2" />
                                          Add New Diagnosis
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="p-4 text-center">
                                      <p className="text-sm text-muted-foreground mb-2">No diagnoses found</p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setShowAddDiagnosisModal(true);
                                          setShowDiagnosisDropdown(false);
                                        }}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add New Diagnosis
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {selectedDiagnosis && (
                            <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{selectedDiagnosis.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ICD-10: {selectedDiagnosis.icd10Code} | {selectedDiagnosis.affectedSystem}
                                  </p>
                                  <div className="flex gap-1 mt-1">
                                    {selectedDiagnosis.isTropicalDisease && (
                                      <Badge variant="secondary" className="text-xs">Tropical Disease</Badge>
                                    )}
                                    {selectedDiagnosis.isNotifiable && (
                                      <Badge variant="destructive" className="text-xs">Notifiable Disease</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDiagnosis(null);
                                    setDiagnosisSearch('');
                                    setVisitForm({ ...visitForm, diagnosis: '', diagnosisCode: '' });
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Laboratory Requests */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TestTube className="w-5 h-5 text-primary" />
                      Laboratory Requests
                    </h3>
                    
                    <div className="form-field">
                      <Label className="form-label">Laboratory Tests</Label>
                      <div className="relative lab-test-dropdown-container">
                        <button
                          type="button"
                          onClick={() => setShowLabTestDropdown(!showLabTestDropdown)}
                          className="w-full p-3 border border-border rounded-lg bg-background hover:bg-muted/50 text-left min-h-[48px] flex items-center justify-between"
                        >
                          <span className={selectedLabTests.length === 0 ? 'text-muted-foreground' : ''}>
                            {selectedLabTests.length === 0 ? 'Select laboratory tests...' : `${selectedLabTests.length} test${selectedLabTests.length > 1 ? 's' : ''} selected`}
                          </span>
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </button>

                        {showLabTestDropdown && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg">
                            <div className="p-2">
                              <div className="mb-2 sticky top-0 bg-background">
                                <Input
                                  placeholder="Search lab tests..."
                                  value={labTestSearch}
                                  onChange={(e) => setLabTestSearch(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {labTestTypes
                                  .filter(test => 
                                    test.toLowerCase().includes(labTestSearch.toLowerCase())
                                  )
                                  .map((test) => (
                                  <label
                                    key={test}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedLabTests.includes(test)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedLabTests([...selectedLabTests, test]);
                                        } else {
                                          setSelectedLabTests(selectedLabTests.filter(t => t !== test));
                                        }
                                      }}
                                      className="rounded"
                                    />
                                    <span className="text-sm">{test}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedLabTests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedLabTests.map((test) => (
                            <Badge
                              key={test}
                              variant="secondary"
                              className="cursor-pointer hover:bg-muted/80"
                              onClick={() => setSelectedLabTests(selectedLabTests.filter(t => t !== test))}
                            >
                              {test}
                              <X className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer with Buttons */}
            <div className="bg-background border-t border-border p-4 mt-4">
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowVisitForm(false);
                    setSelectedPatient(null);
                    setSelectedQueueItem(null);
                    setSelectedComplaints([]);
                    setCustomComplaint('');
                  }}
                  className="w-24"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="visit-form"
                  className="w-32"
                  disabled={saving || selectedComplaints.length === 0}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Save Visit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Patient Registration Modal */}
        <Dialog open={showPatientRegistrationModal} onOpenChange={setShowPatientRegistrationModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Register New Patient
              </DialogTitle>
              <DialogDescription>
                Register a new patient and automatically add them to the queue
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => { e.preventDefault(); handleRegisterPatient(); }} className="space-y-4">
              {/* Essential Information Only */}
              <div className="form-field">
                <Label className="form-label">Full Name *</Label>
                <Input
                  value={registrationForm.fullName}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, fullName: e.target.value })}
                  placeholder="Enter patient's full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label className="form-label">Age</Label>
                  <Input
                    type="number"
                    value={registrationForm.age}
                    onChange={(e) => {
                      setRegistrationForm({ 
                        ...registrationForm, 
                        age: e.target.value,
                        dateOfBirth: '' // Clear DOB when age is entered
                      });
                    }}
                    placeholder="Enter age"
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">OR Date of Birth</Label>
                  <Input
                    type="date"
                    value={registrationForm.dateOfBirth}
                    onChange={(e) => {
                      const age = e.target.value ? calculateAge(e.target.value) : '';
                      setRegistrationForm({ 
                        ...registrationForm, 
                        dateOfBirth: e.target.value,
                        age: age.toString()
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label className="form-label">Gender</Label>
                  <Select 
                    value={registrationForm.gender} 
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-field">
                  <Label className="form-label">Phone Number</Label>
                  <Input
                    value={registrationForm.phoneNumber}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, phoneNumber: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">Beneficiary Type</Label>
                  <Select 
                    value={registrationForm.beneficiaryType} 
                    onValueChange={(value) => setRegistrationForm({ ...registrationForm, beneficiaryType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select beneficiary type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_residents">Local Residents</SelectItem>
                      <SelectItem value="dpoc_staff">DPOC Staff</SelectItem>
                      <SelectItem value="contractors">Contractors</SelectItem>
                      <SelectItem value="arm_group">Arm Group (Police, NSS & SSPDF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPatientRegistrationModal(false);
                    setRegistrationForm({
                      fullName: '',
                      age: '',
                      dateOfBirth: '',
                      gender: '',
                      phoneNumber: '',
                      beneficiaryType: 'local_residents'
                    });
                  }}
                  className="flex-1"
                  disabled={registeringPatient}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={registeringPatient || !registrationForm.fullName}
                >
                  {registeringPatient ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <User className="w-4 h-4 mr-2" />
                  )}
                  Register & Queue Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add New Diagnosis Modal */}
        <Dialog open={showAddDiagnosisModal} onOpenChange={setShowAddDiagnosisModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add New Diagnosis
              </DialogTitle>
              <DialogDescription>
                Add a new diagnosis to the MOH master list for future use
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => { e.preventDefault(); handleAddNewDiagnosis(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label className="form-label">Diagnosis Name *</Label>
                  <Input
                    value={newDiagnosisForm.name}
                    onChange={(e) => setNewDiagnosisForm({ ...newDiagnosisForm, name: e.target.value })}
                    placeholder="e.g., Acute Bronchitis"
                    required
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">ICD-10 Code</Label>
                  <Input
                    value={newDiagnosisForm.icd10Code}
                    onChange={(e) => setNewDiagnosisForm({ ...newDiagnosisForm, icd10Code: e.target.value })}
                    placeholder="e.g., J20.9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label className="form-label">Disease Category</Label>
                  <Select 
                    value={newDiagnosisForm.category} 
                    onValueChange={(value: MOHDiagnosis['category']) => 
                      setNewDiagnosisForm({ ...newDiagnosisForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tropical">Tropical Disease</SelectItem>
                      <SelectItem value="digestive">Digestive System</SelectItem>
                      <SelectItem value="respiratory">Respiratory System</SelectItem>
                      <SelectItem value="urogenital">Urogenital System</SelectItem>
                      <SelectItem value="cardiovascular">Cardiovascular System</SelectItem>
                      <SelectItem value="cns_musculoskeletal">CNS & Musculoskeletal</SelectItem>
                      <SelectItem value="dermatological">Dermatological System</SelectItem>
                      <SelectItem value="surgery">Surgery Cases</SelectItem>
                      <SelectItem value="other">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-field">
                  <Label className="form-label">Affected System</Label>
                  <Input
                    value={newDiagnosisForm.affectedSystem}
                    onChange={(e) => setNewDiagnosisForm({ ...newDiagnosisForm, affectedSystem: e.target.value })}
                    placeholder="e.g., Respiratory system"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isTropicalDisease"
                      checked={newDiagnosisForm.isTropicalDisease}
                      onChange={(e) => setNewDiagnosisForm({ ...newDiagnosisForm, isTropicalDisease: e.target.checked })}
                      className="rounded border-border"
                    />
                    <Label htmlFor="isTropicalDisease" className="text-sm font-medium">
                      Tropical Disease
                    </Label>
                  </div>
                </div>
                <div className="form-field">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isNotifiable"
                      checked={newDiagnosisForm.isNotifiable}
                      onChange={(e) => setNewDiagnosisForm({ ...newDiagnosisForm, isNotifiable: e.target.checked })}
                      className="rounded border-border"
                    />
                    <Label htmlFor="isNotifiable" className="text-sm font-medium">
                      Notifiable Disease
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDiagnosisModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Diagnosis
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Clinical;
