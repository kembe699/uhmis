import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
// MySQL API client for dashboard statistics
class DashboardApiClient {
  private baseUrl = '/api/dashboard';

  async getStats(clinicId: string): Promise<DashboardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

// MySQL API client for patients
class PatientApiClient {
  private baseUrl = '/api/patients';

  async create(patientData: any): Promise<any> {
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
}
import { 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
  UserPlus,
  Calendar
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

interface DashboardStats {
  totalPatients: number;
  todayPatients: number;
  todayVisits: number;
  pendingLabTests: number;
  completedLabTests: number;
  lowStockItems: number;
  queuePatients: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayPatients: 0,
    todayVisits: 0,
    pendingLabTests: 0,
    completedLabTests: 0,
    lowStockItems: 0,
    queuePatients: 0
  });
  const [loading, setLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Patient registration form state
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    phoneNumber: ''
  });

  // API clients
  const dashboardApi = new DashboardApiClient();
  const patientApi = new PatientApiClient();

  // Helper functions for age/date of birth calculation
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
    return `${birthYear}-01-01`;
  };

  // Handle patient registration
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clinic) return;
    
    setSaving(true);
    
    try {
      const patientData = {
        patient_id: generatePatientId(user.clinic),
        full_name: formData.fullName.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        occupation: formData.occupation.trim(),
        phone_number: formData.phoneNumber.trim(),
        clinic_id: parseInt(user.clinic) || 1,
        registered_by: user.displayName
      };

      await patientApi.create(patientData);
      
      toast.success(`Patient ${formData.fullName} registered successfully!`);
      
      // Reset form
      setFormData({
        fullName: '',
        age: '',
        dateOfBirth: '',
        gender: '',
        occupation: '',
        phoneNumber: ''
      });
      
      setShowRegistrationForm(false);
      
      // Refresh stats
      fetchStats();
      
      // Navigate to patients page for queuing
      navigate('/patients');
      
    } catch (error) {
      console.error('Error registering patient:', error);
      toast.error('Failed to register patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fetchStats = async () => {
    console.log('fetchStats called, user:', user);
    
    try {
      setLoading(true);
      
      // Use user's clinic or default to 1 if not set
      const clinicId = user?.clinic || '1';
      console.log('Fetching stats for clinic:', clinicId);
      
      const stats = await dashboardApi.getStats(clinicId);
      console.log('Stats data received:', stats);
      
      setStats(stats);
      console.log('Successfully loaded dashboard stats');
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({
        totalPatients: 0,
        todayPatients: 0,
        todayVisits: 0,
        pendingLabTests: 0,
        completedLabTests: 0,
        lowStockItems: 0,
        queuePatients: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const allStatCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/patients',
      roles: ['admin', 'reception', 'doctor', 'lab', 'pharmacy', 'reports']
    },
    {
      title: "Today's Registrations",
      value: stats.todayPatients,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/patients',
      roles: ['admin', 'reception', 'doctor', 'lab', 'pharmacy', 'reports']
    },
    {
      title: "Today's Visits",
      value: stats.todayVisits,
      icon: Stethoscope,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/clinical',
      roles: ['admin', 'reception', 'doctor', 'lab', 'pharmacy', 'reports']
    },
    {
      title: 'Queue Patients',
      value: stats.queuePatients,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/patients',
      roles: ['admin', 'reception', 'doctor', 'lab', 'pharmacy', 'reports']
    },
    {
      title: 'Pending Lab Tests',
      value: stats.pendingLabTests,
      icon: FlaskConical,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/laboratory',
      roles: ['admin', 'doctor', 'lab', 'pharmacy', 'reports']
    },
    {
      title: 'Completed Lab Tests',
      value: stats.completedLabTests,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/laboratory',
      roles: ['admin', 'doctor', 'lab', 'pharmacy', 'reports']
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      link: '/pharmacy',
      roles: ['admin', 'doctor', 'pharmacy', 'reports']
    }
  ];

  // Filter stat cards based on user role
  const statCards = allStatCards.filter(card => 
    user?.role && card.roles.includes(user.role)
  );

  const quickActions = [
    { label: 'Register Patient', icon: UserPlus, action: () => setShowRegistrationForm(true), roles: ['admin', 'reception'] },
    { label: 'Clinical Visit', icon: Stethoscope, href: '/clinical', roles: ['admin', 'doctor'] },
    { label: 'Lab Queue', icon: FlaskConical, href: '/laboratory', roles: ['admin', 'lab'] },
    { label: 'Dispense Drugs', icon: Pill, href: '/pharmacy', roles: ['admin', 'pharmacy'] },
  ];

  const filteredActions = quickActions.filter(action => 
    user?.role && action.roles.includes(user.role)
  );

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.displayName} • {user?.clinic}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.link} className="stat-card group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '—' : stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredActions.map((action) => {
              const Icon = action.icon;
              
              if (action.action) {
                // Render as button for actions
                return (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex flex-col items-center justify-center p-6 bg-card rounded-xl border border-border hover:border-primary hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{action.label}</span>
                  </button>
                );
              } else {
                // Render as link for navigation
                return (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex flex-col items-center justify-center p-6 bg-card rounded-xl border border-border hover:border-primary hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{action.label}</span>
                  </Link>
                );
              }
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">System Status</h2>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse-soft" />
            <span className="text-foreground">All systems operational</span>
          </div>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <Activity className="w-4 h-4 inline mr-2" />
              Offline mode enabled - data will sync when connected
            </p>
          </div>
        </div>

        {/* Patient Registration Modal */}
        <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Patient Registration</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleRegistration} className="space-y-4 mt-4">
              <div className="form-field">
                <Label htmlFor="fullName" className="form-label">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter patient's full name"
                  required
                  autoFocus
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <Label htmlFor="age" className="form-label">
                    Age
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => {
                        const age = e.target.value;
                        const calculatedDob = age ? calculateDateOfBirthFromAge(parseInt(age)) : '';
                        setFormData({ ...formData, age, dateOfBirth: calculatedDob });
                      }}
                      placeholder="Years"
                      min="0"
                      max="150"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <Label htmlFor="dob" className="form-label">
                    OR Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      const dateOfBirth = e.target.value;
                      const calculatedAge = dateOfBirth ? calculateAgeFromDateOfBirth(dateOfBirth).toString() : '';
                      setFormData({ ...formData, dateOfBirth, age: calculatedAge });
                    }}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="form-field">
                <Label htmlFor="gender" className="form-label">
                  Gender
                </Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-12 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <Label htmlFor="occupation" className="form-label">
                  Occupation
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="Patient's occupation"
                  className="h-12"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="phoneNumber" className="form-label">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Patient's phone number"
                  className="h-12"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegistrationForm(false)}
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
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register & Queue
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
