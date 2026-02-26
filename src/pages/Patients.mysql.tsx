import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Patient } from '@/types';

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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const generatePatientId = (clinic: string) => {
  const prefix = clinic.split(' ')[0].substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
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

// MySQL API client for patients
class PatientApiClient {
  private baseUrl = '/api/patients';

  async getAll(): Promise<MySQLPatient[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
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

const patientApi = new PatientApiClient();
const userApi = new UserApiClient();

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
  const [queuedPatients, setQueuedPatients] = useState<Set<string>>(new Set());
  
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
    priority: 'normal',
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
    fetchUsers();
    fetchQueueStatus();
  }, [user?.clinic]);

  const fetchPatients = async () => {
    if (!user?.clinic) return;
    
    try {
      setLoading(true);
      // Use MySQL API to fetch patients by clinic
      const data = await patientApi.getByClinic(user.clinic);
      
      // Transform MySQL data to match frontend expectations
      const transformedData = data.map(patient => ({
        id: patient.id,
        patientId: patient.patient_id,
        fullName: `${patient.first_name} ${patient.last_name}`,
        firstName: patient.first_name,
        lastName: patient.last_name,
        age: calculateAgeFromDateOfBirth(patient.date_of_birth),
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phoneNumber: patient.phone || '',
        occupation: patient.occupation || '',
        address: patient.address || '',
        clinic: user.clinic,
        registeredAt: patient.createdAt || new Date().toISOString(),
        registeredBy: user?.displayName || 'System', // Add required field
        beneficiaryType: 'local_residents' // Default value
      })) as Patient[];
      
      setPatients(transformedData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients from MySQL database');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!user?.clinic) return;
    
    try {
      // Use MySQL API to fetch users by clinic
      const usersData = await userApi.getByClinic(user.clinic);
      
      // Filter users by admin and doctor roles
      const adminAndDoctorUsers = usersData
        .filter(userData => userData.role === 'admin' || userData.role === 'doctor')
        .map(userData => ({
          displayName: userData.display_name,
          role: userData.role
        }))
        .sort((a, b) => {
          // Sort by role (admin first, then doctor), then by name
          if (a.role !== b.role) {
            return a.role === 'admin' ? -1 : 1;
          }
          return a.displayName.localeCompare(b.displayName);
        });
      
      setDoctors(adminAndDoctorUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load doctors list');
    }
  };

  const fetchQueueStatus = async () => {
    // TODO: Implement queue status fetching from MySQL
    // For now, just set empty queue
    setQueuedPatients(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clinic) return;

    setSaving(true);
    try {
      // Generate patient ID
      const patientId = generatePatientId(user.clinic);
      
      // Prepare patient data for MySQL
      const patientData = {
        patient_id: patientId,
        first_name: formData.fullName.split(' ')[0] || '',
        last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
        date_of_birth: formData.dateOfBirth || calculateDateOfBirthFromAge(parseInt(formData.age)),
        gender: formData.gender,
        phone: formData.phoneNumber,
        occupation: formData.occupation,
        address: '', // Can be added to form later
        clinic_id: parseInt(user.clinic) || 1, // Convert clinic to number
      };

      // Create patient using MySQL API
      const newPatient = await patientApi.create(patientData);
      
      // Transform and add to local state
      const transformedPatient = {
        id: newPatient.id,
        patientId: newPatient.patient_id,
        fullName: formData.fullName,
        firstName: newPatient.first_name,
        lastName: newPatient.last_name,
        age: parseInt(formData.age) || calculateAgeFromDateOfBirth(newPatient.date_of_birth),
        dateOfBirth: newPatient.date_of_birth,
        gender: newPatient.gender,
        phoneNumber: newPatient.phone || '',
        occupation: newPatient.occupation || '',
        address: newPatient.address || '',
        clinic: user.clinic,
        registeredAt: newPatient.createdAt || new Date().toISOString(),
        registeredBy: user?.displayName || 'System', // Add required field
        beneficiaryType: formData.beneficiaryType
      } as Patient;

      setPatients(prev => [transformedPatient, ...prev]);
      setRegisteredPatient(transformedPatient);
      setShowForm(false);
      setShowQueueForm(true);
      
      // Reset form
      setFormData({
        fullName: '',
        age: '',
        dateOfBirth: '',
        gender: '',
        occupation: '',
        phoneNumber: '',
        beneficiaryType: 'local_residents'
      });
      
      toast.success('Patient registered successfully in MySQL database');
    } catch (error) {
      console.error('Error registering patient:', error);
      toast.error('Failed to register patient');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPatients();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await patientApi.search(searchQuery);
      
      // Transform search results
      const transformedResults = searchResults.map(patient => ({
        id: patient.id,
        patientId: patient.patient_id,
        fullName: `${patient.first_name} ${patient.last_name}`,
        firstName: patient.first_name,
        lastName: patient.last_name,
        age: calculateAgeFromDateOfBirth(patient.date_of_birth),
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        phoneNumber: patient.phone || '',
        occupation: patient.occupation || '',
        address: patient.address || '',
        clinic: user?.clinic || '',
        registeredAt: patient.createdAt || new Date().toISOString(),
        registeredBy: user?.displayName || 'System', // Add required field
        beneficiaryType: 'local_residents'
      })) as Patient[];
      
      setPatients(transformedResults);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = async () => {
    // TODO: Implement queue functionality with MySQL
    toast.success('Queue functionality will be implemented with MySQL');
    setShowQueueForm(false);
  };

  // Filter patients based on search and date range
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchQuery || 
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phoneNumber.includes(searchQuery);
    
    const patientDate = new Date(patient.registeredAt);
    const matchesDateRange = (!dateFrom || patientDate >= new Date(dateFrom)) &&
                            (!dateTo || patientDate <= new Date(dateTo));
    
    return matchesSearch && matchesDateRange;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
            <p className="text-muted-foreground">
              Manage patient records from MySQL database
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Register Patient
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search">Search Patients</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search by name, ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="dateFrom">From Date</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="dateTo">To Date</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total Patients</span>
            </div>
            <div className="text-2xl font-bold mt-2">{patients.length}</div>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Today's Registrations</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {patients.filter(p => {
                const today = new Date().toDateString();
                return new Date(p.registeredAt).toDateString() === today;
              }).length}
            </div>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">In Queue</span>
            </div>
            <div className="text-2xl font-bold mt-2">{queuedPatients.size}</div>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">With Phone</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {patients.filter(p => p.phoneNumber).length}
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Records (MySQL)</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading patients from MySQL...</span>
              </div>
            ) : paginatedPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No patients found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Patient ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Age</th>
                        <th className="text-left p-2">Gender</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="text-left p-2">Registered</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPatients.map((patient) => (
                        <tr key={patient.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-sm">{patient.patientId}</td>
                          <td className="p-2">{patient.fullName}</td>
                          <td className="p-2">{patient.age}</td>
                          <td className="p-2 capitalize">{patient.gender}</td>
                          <td className="p-2">{patient.phoneNumber || '-'}</td>
                          <td className="p-2">
                            {new Date(patient.registeredAt).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              {queuedPatients.has(patient.id) ? (
                                <span className="text-green-600 text-sm flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  In Queue
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRegisteredPatient(patient);
                                    setShowQueueForm(true);
                                  }}
                                >
                                  Add to Queue
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Register Patient Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => {
                      const age = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        age,
                        dateOfBirth: age ? calculateDateOfBirthFromAge(parseInt(age)) : ''
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      const dob = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        dateOfBirth: dob,
                        age: dob ? calculateAgeFromDateOfBirth(dob).toString() : ''
                      }));
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  className="w-full p-2 border rounded-md"
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Register Patient'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add to Queue Dialog */}
        <Dialog open={showQueueForm} onOpenChange={setShowQueueForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Patient to Queue</DialogTitle>
            </DialogHeader>
            {registeredPatient && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">{registeredPatient.fullName}</h3>
                  <p className="text-sm text-muted-foreground">ID: {registeredPatient.patientId}</p>
                </div>

                <div>
                  <Label htmlFor="doctor">Assign to Doctor</Label>
                  <select
                    id="doctor"
                    className="w-full p-2 border rounded-md"
                    value={queueData.doctor}
                    onChange={(e) => setQueueData(prev => ({ ...prev, doctor: e.target.value }))}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor, index) => (
                      <option key={index} value={doctor.displayName}>
                        {doctor.displayName} ({doctor.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full p-2 border rounded-md"
                    value={queueData.priority}
                    onChange={(e) => setQueueData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={queueData.notes}
                    onChange={(e) => setQueueData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special notes..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowQueueForm(false)} className="flex-1">
                    Skip Queue
                  </Button>
                  <Button onClick={handleAddToQueue} className="flex-1">
                    Add to Queue
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Patients;
