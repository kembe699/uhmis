import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
// MySQL Patient interface to match database schema
interface MySQLPatient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  clinic_id: number;
  createdAt: string;
  updatedAt: string;
}

// MySQL API client for patients
class PatientApiClient {
  private getBaseUrl() {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocalhost ? '/api/patients' : `/api/patients`;
  }
  
  private get baseUrl() {
    return this.getBaseUrl();
  }

  async getByClinic(clinicId: string): Promise<MySQLPatient[]> {
    try {
      const response = await fetch(`${this.baseUrl}/clinic/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch patients by clinic');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patients by clinic:', error);
      throw error;
    }
  }

  async create(patientData: any): Promise<MySQLPatient> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });
      if (!response.ok) throw new Error('Failed to create patient');
      return await response.json();
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async search(query: string): Promise<MySQLPatient[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search patients');
      return await response.json();
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }
}

// MySQL API client for users
class UserApiClient {
  private baseUrl = '/api/users';

  async getByClinic(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/clinic/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch users by clinic');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users by clinic:', error);
      throw error;
    }
  }
}

// MySQL API client for patient queue
class PatientQueueApiClient {
  private baseUrl = '/api/patient-queue';

  async getByClinic(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/clinic/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch queue entries');
      return await response.json();
    } catch (error) {
      console.error('Error fetching queue entries:', error);
      throw error;
    }
  }

  async getByClinicAndStatus(clinicId: string, status: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/clinic/${clinicId}/status/${status}`);
      if (!response.ok) throw new Error('Failed to fetch queue entries');
      return await response.json();
    } catch (error) {
      console.error('Error fetching queue entries:', error);
      throw error;
    }
  }

  async create(queueData: any): Promise<any> {
    try {
      console.log('Making POST request to:', this.baseUrl);
      console.log('Queue data being sent:', queueData);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to add patient to queue: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Queue creation successful:', result);
      return result;
    } catch (error) {
      console.error('Error adding patient to queue:', error);
      throw error;
    }
  }
}

// API client for dr_clinics
class DrClinicApiClient {
  private baseUrl = '/api/clinics';

  async getAll(): Promise<any[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) throw new Error('Failed to fetch clinics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  }

  async getActiveOnly(): Promise<any[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) throw new Error('Failed to fetch clinics');
      const clinics = await response.json();
      return clinics.filter((clinic: any) => clinic.isActive);
    } catch (error) {
      console.error('Error fetching active clinics:', error);
      throw error;
    }
  }
}

// API client for patient bills
class PatientBillApiClient {
  private baseUrl = '/api/patient-bills';

  async create(billData: any): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });
      if (!response.ok) throw new Error('Failed to create patient bill');
      return await response.json();
    } catch (error) {
      console.error('Error creating patient bill:', error);
      throw error;
    }
  }
}

const patientApi = new PatientApiClient();
const userApi = new UserApiClient();
const queueApi = new PatientQueueApiClient();
const drClinicApi = new DrClinicApiClient();
const patientBillApi = new PatientBillApiClient();
import { Patient } from '@/types';
import { 
  UserPlus, 
  Search, 
  Loader2, 
  Calendar,
  Activity,
  Users,
  Phone, 
  Briefcase,
  Check,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const generatePatientId = (clinic: string) => {
  const prefix = 'UH';
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}${random}`;
};

const calculateAgeFromDateOfBirth = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const calculateDateOfBirthFromAge = (age: number): string => {
  if (!age || age <= 0) return '';
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  // Use January 1st as approximate birth date
  return `${birthYear}-01-01`;
};

const Patients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQueueForm, setShowQueueForm] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<Array<{displayName: string, role: string}>>([]);
  const [clinics, setClinics] = useState<Array<{id: string, name: string, department: string, service?: string}>>([]);
  const [queuedPatients, setQueuedPatients] = useState<Set<string>>(new Set());
  const [patientQueueStatus, setPatientQueueStatus] = useState<Map<string, string>>(new Map());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // Date filtering state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    phoneNumber: '',
    beneficiaryType: 'local_residents'
  });

  // Queue form state
  const [queueData, setQueueData] = useState({
    doctor: '',
    clinic: '',
    priority: 'normal',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchUsers();
      fetchClinics();
      fetchQueueStatus();
    } else {
      setLoading(false);
    }
  }, [user?.clinic]);

  const fetchPatients = async () => {
    console.log('fetchPatients called, user:', user);
    
    try {
      setLoading(true);
      console.log('Fetching all patients from API...');
      
      // Fetch all patients directly
      const response = await fetch('/api/patients');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('API response is not an array');
      }
      
      // Transform MySQL data to match frontend expectations
      const transformedData = data.map(patient => {
        console.log('Transforming patient:', patient);
        return {
          id: patient.id,
          patientId: patient.patient_id,
          fullName: `${patient.first_name} ${patient.last_name || ''}`.trim(),
          firstName: patient.first_name,
          lastName: patient.last_name || '',
          age: calculateAgeFromDateOfBirth(patient.date_of_birth),
          dateOfBirth: patient.date_of_birth,
          gender: patient.gender,
          phoneNumber: patient.phone_number || '',
          occupation: patient.occupation || '',
          address: patient.address || '',
          clinic: user?.clinic || 'Unknown',
          registeredAt: patient.createdAt || patient.created_at || new Date().toISOString(),
          registeredBy: user?.displayName || 'System',
          beneficiaryType: 'local_residents'
        };
      }) as Patient[];
      
      console.log('Transformed data:', transformedData);
      setPatients(transformedData);
      console.log('Successfully loaded', transformedData.length, 'patients');
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
      setPatients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    console.log('fetchUsers called for doctors, user:', user);
    
    try {
      // Try direct API call first
      console.log('Fetching doctors via direct API call...');
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const usersData = await response.json();
        console.log('Users data received:', usersData);
        
        // Filter users by admin and doctor roles
        const adminAndDoctorUsers = usersData
          .filter(userData => userData.role === 'admin' || userData.role === 'doctor')
          .map(userData => ({
            displayName: userData.display_name || userData.email,
            role: userData.role
          }))
          .sort((a, b) => {
            // Sort by role (admin first, then doctor), then by name
            if (a.role !== b.role) {
              return a.role === 'admin' ? -1 : 1;
            }
            return a.displayName.localeCompare(b.displayName);
          });
        
        console.log('Filtered doctors:', adminAndDoctorUsers);
        setDoctors(adminAndDoctorUsers);
        return;
      }
      
      // Fallback to userApi if direct API fails
      if (user?.clinic) {
        console.log('Direct API failed, trying userApi...');
        const usersData = await userApi.getByClinic(user.clinic);
        
        const adminAndDoctorUsers = usersData
          .filter(userData => userData.role === 'admin' || userData.role === 'doctor')
          .map(userData => ({
            displayName: userData.display_name,
            role: userData.role
          }))
          .sort((a, b) => {
            if (a.role !== b.role) {
              return a.role === 'admin' ? -1 : 1;
            }
            return a.displayName.localeCompare(b.displayName);
          });
        
        setDoctors(adminAndDoctorUsers);
      } else {
        throw new Error('No user clinic available and direct API failed');
      }
      
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Set fallback doctors
      const fallbackDoctors = [
        { displayName: 'Universal Hospital Admin', role: 'admin' },
        { displayName: 'Jok Marol', role: 'doctor' }
      ];
      
      console.log('Setting fallback doctors:', fallbackDoctors);
      setDoctors(fallbackDoctors);
    }
  };

  const fetchClinics = async () => {
    try {
      // Fetch active clinics from dr_clinic table
      const clinicsData = await drClinicApi.getActiveOnly();
      
      // Transform data for the dropdown
      const transformedClinics = clinicsData.map(clinic => ({
        id: clinic.id,
        name: clinic.name,
        department: clinic.department,
        service: clinic.service // Include service ID
      }));
      
      setClinics(transformedClinics);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setClinics([]); // Set empty array on error
    }
  };

  const fetchQueueStatus = async () => {
    if (!user?.clinic) return;
    
    try {
      // Fetch all queue entries for the clinic (all statuses)
      const queueEntries = await queueApi.getByClinic(user.clinic);
      
      console.log('Fetched queue entries:', queueEntries.map(e => ({ 
        patient_id: e.patient_id, 
        status: e.status 
      })));
      
      // Create sets for different statuses
      const queuedPatientIds = new Set<string>();
      const statusMap = new Map<string, string>();
      
      queueEntries.forEach(entry => {
        const dbPatientId = entry.patient_id; // This is now the database ID
        const status = entry.status;
        
        console.log(`Processing queue entry: DB Patient ID ${dbPatientId} has status ${status}`);
        
        // Find the patient identifier (UH-1234) that matches this database ID
        const patient = patients.find(p => p.id === dbPatientId);
        if (patient) {
          const patientIdentifier = patient.patientId; // UH-1234 format
          console.log(`Mapped DB ID ${dbPatientId} to patient identifier ${patientIdentifier}`);
          
          // Add to queued patients if status is waiting or in_progress
          // If status is completed, remove from queued patients (allow re-queueing)
          if (status === 'waiting' || status === 'in_progress') {
            queuedPatientIds.add(patientIdentifier);
            console.log(`Added patient ${patientIdentifier} to queued patients (status: ${status})`);
          } else {
            console.log(`Patient ${patientIdentifier} not added to queued patients (status: ${status})`);
          }
          
          // Track status for each patient using patient identifier
          statusMap.set(patientIdentifier, status);
        } else {
          console.log(`Could not find patient with DB ID ${dbPatientId} in current patient list`);
        }
      });
      
      console.log('Final queuedPatientIds:', Array.from(queuedPatientIds));
      console.log('Final statusMap:', Object.fromEntries(statusMap));
      
      setQueuedPatients(queuedPatientIds);
      setPatientQueueStatus(statusMap);
    } catch (error) {
      console.error('Error fetching queue status:', error);
      // Set empty queue on error to maintain UI functionality
      setQueuedPatients(new Set());
      setPatientQueueStatus(new Map());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    
    try {
      const patientId = generatePatientId(user.clinic);
      const age = formData.dateOfBirth 
        ? Math.floor((Date.now() - new Date(formData.dateOfBirth).getTime()) / 31557600000)
        : parseInt(formData.age) || undefined;
      
      const patientData: Omit<Patient, 'id'> = {
        patientId,
        fullName: formData.fullName.trim(),
        age,
        occupation: formData.occupation.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        clinic: user.clinic,
        registeredAt: new Date().toISOString(),
        registeredBy: user.displayName,
        beneficiaryType: formData.beneficiaryType as 'dpoc_staff' | 'contractors' | 'arm_group' | 'local_residents'
      };

      // Only include dateOfBirth if it has a value
      if (formData.dateOfBirth) {
        patientData.dateOfBirth = formData.dateOfBirth;
      }

      // Only include gender if it has a value
      if (formData.gender) {
        patientData.gender = formData.gender as 'male' | 'female' | 'other';
      }

      // Prepare patient data for MySQL
      const mysqlPatientData = {
        patient_id: patientId,
        first_name: formData.fullName.split(' ')[0] || '',
        last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
        date_of_birth: formData.dateOfBirth || calculateDateOfBirthFromAge(parseInt(formData.age)),
        gender: formData.gender,
        phone_number: formData.phoneNumber,
        address: '', // Can be added to form later
        clinic_id: 6, // Use default General Medicine clinic
        registered_by: null, // Set to null to avoid foreign key issues
        registration_date: new Date(), // Add registration_date field
      };

      // Create patient using MySQL API
      const newPatient = await patientApi.create(mysqlPatientData);
      
      // Store registered patient data and show queue form
      setRegisteredPatient({
        patientId,
        patientDocId: newPatient.id,
        patientName: formData.fullName.trim(),
        age,
        clinic: user.clinic
      });
      
      toast.success(`Patient registered: ${patientId}`);
      setShowForm(false);
      setShowQueueForm(true);
      setFormData({
        fullName: '',
        age: '',
        dateOfBirth: '',
        gender: '',
        occupation: '',
        phoneNumber: '',
        beneficiaryType: 'local_residents'
      });
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Failed to register patient');
    } finally {
      setSaving(false);
    }
  };

  const handleQueueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !registeredPatient) return;
    
    setSaving(true);
    
    try {
      // Find the selected clinic to get service
      const selectedClinic = clinics.find(clinic => clinic.name === queueData.clinic);
      console.log('=== QUEUE PATIENT - BILL CREATION ===');
      console.log('Selected clinic:', selectedClinic);
      console.log('Clinic service ID:', selectedClinic?.service);
      
      // Fetch clinic service with price from the database
      let clinicServices = [];
      let totalAmount = 0;
      
      if (selectedClinic && selectedClinic.service) {
        console.log('Fetching service details for service ID:', selectedClinic.service);
        
        try {
          const response = await fetch(`/api/services/${selectedClinic.service}`);
          console.log('Service fetch response status:', response.status);
          
          if (response.ok) {
            const serviceData = await response.json();
            console.log('Service data received:', serviceData);
            console.log('Service price from DB:', serviceData.price, 'Type:', typeof serviceData.price);
            
            const servicePrice = parseFloat(serviceData.price || 0);
            console.log('Parsed service price:', servicePrice);
            
            if (servicePrice === 0 || isNaN(servicePrice)) {
              console.warn('⚠️ Service price is 0 or invalid! Service ID:', selectedClinic.service);
              toast.warning(`Service "${serviceData.service_name}" has no price set. Please update the service price in Setup > Services.`);
            }
            
            // Build service for the bill
            clinicServices = [{
              name: serviceData.service_name || serviceData.name,
              serviceName: serviceData.service_name || serviceData.name,
              department: selectedClinic.department,
              doctor: queueData.doctor.trim(),
              price: servicePrice,
              quantity: 1,
              unitPrice: servicePrice,
              totalPrice: servicePrice,
              date: new Date().toISOString()
            }];
            
            totalAmount = servicePrice;
            console.log('Built clinic service for bill:', clinicServices);
            console.log('Total amount calculated:', totalAmount);
          } else {
            const errorText = await response.text();
            console.error('Service not found for ID:', selectedClinic.service, 'Status:', response.status, 'Error:', errorText);
            toast.error(`Service not found (ID: ${selectedClinic.service}). Please check clinic configuration.`);
          }
        } catch (error) {
          console.error(`Error fetching service ${selectedClinic.service}:`, error);
          toast.error('Failed to fetch service details. Please try again.');
        }
      } else {
        console.log('No service linked to clinic');
      }
      
      // Fallback if no service found or service has no price
      if (clinicServices.length === 0 || totalAmount === 0) {
        console.warn('No valid service found, using default consultation service');
        clinicServices = [{
          name: `${queueData.clinic} Consultation`,
          serviceName: `${queueData.clinic} Consultation`,
          department: selectedClinic?.department || 'General',
          doctor: queueData.doctor.trim(),
          price: 0,
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          date: new Date().toISOString()
        }];
        totalAmount = 0;
        toast.warning('No service price configured for this clinic. Please set up clinic service in Setup > Clinics.');
      }
      
      // Prepare queue data for MySQL
      const queueData_mysql = {
        patient_id: registeredPatient.patientId, // Use patientId (UH-1234) instead of patientDocId
        queue_type: 'consultation',
        priority: queueData.priority,
        notes: queueData.notes.trim(),
        status: 'waiting'
      };

      // Save to MySQL patient_queue table
      console.log('Creating queue entry with data:', queueData_mysql);
      const queueResult = await queueApi.create(queueData_mysql);
      console.log('Queue entry created:', queueResult);
      
      // Create patient bill with all clinic services
      const billData = {
        patient_id: registeredPatient.patientId,
        patient_name: registeredPatient.patientName,
        clinic_id: parseInt(user.clinic) || 1,
        total_amount: totalAmount,
        paid_amount: 0,
        balance_amount: totalAmount,
        status: 'pending',
        services: JSON.stringify(clinicServices),
        notes: `${queueData.clinic} services with Dr. ${queueData.doctor.trim()}`,
        created_by: user.displayName,
        bill_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Create the patient bill
      await patientBillApi.create(billData);
      
      toast.success(`Patient ${registeredPatient.patientName} queued successfully! Bill created for SSP ${totalAmount.toFixed(2)}`);
      setShowQueueForm(false);
      setRegisteredPatient(null);
      setQueueData({
        doctor: '',
        clinic: '',
        priority: 'normal',
        notes: ''
      });
      
      // Refresh queue status to update button states
      fetchQueueStatus();
    } catch (error) {
      console.error('Error queuing patient:', error);
      toast.error('Failed to queue patient');
    } finally {
      setSaving(false);
    }
  };

  // Apply filters
  const filteredPatients = patients.filter(patient => {
    // Text search filter
    const matchesSearch = searchQuery === '' || 
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phoneNumber.includes(searchQuery);
    
    // Date range filter
    const patientDate = new Date(patient.registeredAt);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null; // Include full day
    
    const matchesDateRange = (!fromDate || patientDate >= fromDate) && 
                            (!toDate || patientDate <= toDate);
    
    return matchesSearch && matchesDateRange;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo]);

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patient Registry</h1>
            <p className="text-muted-foreground mt-1">
              Manage patient registrations and queue visits • {user?.clinic}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{patients.length}</span>
              <span className="text-xs text-muted-foreground">Total Patients</span>
            </div>
            <Button onClick={() => setShowForm(true)} className="quick-action-btn">
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Register Patient</span>
            </Button>
          </div>
        </div>

        {/* Search and Date Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 min-w-[160px]">
                <Label htmlFor="dateFrom" className="text-sm font-medium text-muted-foreground">
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <Label htmlFor="dateTo" className="text-sm font-medium text-muted-foreground">
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSearchQuery('');
                  }}
                  className="h-9 px-4"
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'No patients found' : 'No patients registered'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms or clear the search to see all patients.'
                  : 'Get started by registering your first patient.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowForm(true)} className="mt-2">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register First Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Patient ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Patient Details</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Registration</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPatients.map((patient, index) => (
                    <tr key={patient.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-primary text-sm">
                          {patient.patientId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{patient.fullName}</span>
                          {patient.age && (
                            <span className="text-sm text-muted-foreground">
                              • {patient.age} years
                            </span>
                          )}
                          {patient.occupation && (
                            <span className="text-sm text-muted-foreground">
                              • {patient.occupation}
                            </span>
                          )}
                          {patient.gender && (
                            <span className="text-sm text-muted-foreground capitalize">
                              • {patient.gender}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {patient.phoneNumber ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium">{patient.phoneNumber}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No phone</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <span className="font-medium text-foreground">
                            {new Date(patient.registeredAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            • by {patient.registeredBy}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(() => {
                          const queueStatus = patientQueueStatus.get(patient.patientId);
                          const isQueued = queuedPatients.has(patient.patientId);
                          
                          if (isQueued) {
                            // Patient is in queue (waiting or in_progress)
                            return (
                              <Button
                                size="sm"
                                disabled
                                className="bg-blue-600 text-white shadow-sm cursor-default"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Queued
                              </Button>
                            );
                          } else if (queueStatus === 'completed' || queueStatus === 'cancelled') {
                            // Patient was in queue but now completed/cancelled - show normal button
                            return (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setRegisteredPatient({
                                    patientId: patient.patientId,
                                    patientDocId: patient.id,
                                    patientName: patient.fullName,
                                    age: patient.age,
                                    clinic: patient.clinic
                                  });
                                  setShowQueueForm(true);
                                }}
                                className="bg-success hover:bg-success/90 text-white shadow-sm"
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                Add to Queue
                              </Button>
                            );
                          } else {
                            // Patient never been in queue - show normal button
                            return (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setRegisteredPatient({
                                    patientId: patient.patientId,
                                    patientDocId: patient.id,
                                    patientName: patient.fullName,
                                    age: patient.age,
                                    clinic: patient.clinic
                                  });
                                  setShowQueueForm(true);
                                }}
                                className="bg-success hover:bg-success/90 text-white shadow-sm"
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                Add to Queue
                              </Button>
                            );
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
        </div>

        {/* Registration Form Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Register New Patient
              </DialogTitle>
              <DialogDescription>
                Fill out the form below to register a new patient in the system.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Essential Information Only */}
              <div className="form-field">
                <Label className="form-label">Full Name *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter patient's full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label className="form-label">Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => {
                      const age = e.target.value;
                      const calculatedDob = age ? calculateDateOfBirthFromAge(parseInt(age)) : '';
                      setFormData({ ...formData, age, dateOfBirth: calculatedDob });
                    }}
                    placeholder="Enter age"
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">OR Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      const dateOfBirth = e.target.value;
                      const calculatedAge = dateOfBirth ? calculateAgeFromDateOfBirth(dateOfBirth).toString() : '';
                      setFormData({ ...formData, dateOfBirth, age: calculatedAge });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label className="form-label">Gender</Label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg bg-background text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <Label className="form-label">Phone Number</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-field">
                  <Label className="form-label">Occupation</Label>
                  <Input
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="e.g., Engineer, Driver"
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">Beneficiary Type</Label>
                  <select
                    value={formData.beneficiaryType}
                    onChange={(e) => setFormData({ ...formData, beneficiaryType: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg bg-background text-sm"
                  >
                    <option value="local_residents">Local Residents</option>
                    <option value="dpoc_staff">DPOC Staff</option>
                    <option value="contractors">Contractors</option>
                    <option value="arm_group">Arm Group (Police, NSS & SSPDF)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saving || !formData.fullName.trim()}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Register Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Queue Form Dialog */}
        <Dialog open={showQueueForm} onOpenChange={setShowQueueForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Patient to Queue
              </DialogTitle>
              <DialogDescription>
                Add the registered patient to a clinic queue for consultation.
              </DialogDescription>
            </DialogHeader>
            
            {registeredPatient && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Patient Information</p>
                  <p className="text-sm text-muted-foreground">
                    {registeredPatient.patientName} ({registeredPatient.patientId})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Age: {registeredPatient.age}
                  </p>
                </div>

                <form onSubmit={handleQueueSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic">Clinic/Department *</Label>
                    <select
                      id="clinic"
                      value={queueData.clinic}
                      onChange={(e) => setQueueData({ ...queueData, clinic: e.target.value })}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                      required
                    >
                      <option value="">Select a clinic...</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.name}>
                          {clinic.name}{clinic.department ? ` (${clinic.department})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor *</Label>
                    <select
                      id="doctor"
                      value={queueData.doctor}
                      onChange={(e) => setQueueData({ ...queueData, doctor: e.target.value })}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                      required
                    >
                      <option value="">Select a doctor...</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.displayName} value={doctor.displayName}>
                          {doctor.displayName} ({doctor.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={queueData.priority}
                      onChange={(e) => setQueueData({ ...queueData, priority: e.target.value })}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={queueData.notes}
                      onChange={(e) => setQueueData({ ...queueData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowQueueForm(false);
                        setRegisteredPatient(null);
                        setQueueData({ doctor: '', clinic: '', priority: 'normal', notes: '' });
                      }}
                      className="flex-1"
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Skip
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={saving || !queueData.doctor.trim() || !queueData.clinic.trim()}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Queue Patient
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Patients;
