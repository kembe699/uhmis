import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DrugInventory, Patient } from '@/types';
import type { Dispensing } from '@/types';
import { 
  Pill, 
  Search,
  Package,
  Check,
  Loader2,
  User,
  ArrowLeft,
  Clock,
  Zap,
  BarChart3,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Dispensing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [prescriptionQueue, setPrescriptionQueue] = useState<any[]>([]);
  const [inventory, setInventory] = useState<DrugInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [currentPrescription, setCurrentPrescription] = useState<any>(null);
  
  // Performance metrics
  const [todayDispensed, setTodayDispensed] = useState(0);
  const [avgTimePerPrescription, setAvgTimePerPrescription] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user?.clinic]);

  const fetchData = async () => {
    if (!user?.clinic) return;
    
    try {
      // Fetch active prescriptions grouped by patient
      const prescriptionsRef = collection(db, 'prescriptions');
      const prescriptionsQuery = query(
        prescriptionsRef, 
        where('clinic', '==', user.clinic),
        where('status', '==', 'active'),
        orderBy('prescribedAt', 'desc')
      );
      const prescriptionsSnapshot = await getDocs(prescriptionsQuery);
      const prescriptionsData = prescriptionsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Group prescriptions by patient for queue
      const groupedPrescriptions = prescriptionsData.reduce((groups: any, prescription: any) => {
        const key = prescription.visitId || `${prescription.patientName}-${prescription.prescribedAt.split('T')[0]}`;
        if (!groups[key]) {
          groups[key] = {
            id: key,
            patientName: prescription.patientName,
            patientId: prescription.patientId,
            prescribedBy: prescription.prescribedBy,
            prescribedAt: prescription.prescribedAt,
            medications: []
          };
        }
        groups[key].medications.push(prescription);
        return groups;
      }, {});

      setPrescriptionQueue(Object.values(groupedPrescriptions));
      setQueueLength(Object.keys(groupedPrescriptions).length);

      // Get today's dispensed count
      const today = new Date().toISOString().split('T')[0];
      const dispensingRef = collection(db, 'pharmacy_dispensing');
      const todayQuery = query(
        dispensingRef,
        where('clinic', '==', user.clinic),
        where('date', '>=', today),
        where('date', '<', today + 'T23:59:59')
      );
      const todaySnapshot = await getDocs(todayQuery);
      setTodayDispensed(todaySnapshot.size);
    } catch (error) {
      console.error('Error fetching dispensing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDispense = async (medication: any) => {
    setProcessing(true);
    
    try {
      // Create dispensing record
      const newDispensing: Omit<Dispensing, 'id'> = {
        drugId: medication.id,
        drugName: medication.medicationName,
        patientId: medication.patientId,
        patientName: medication.patientName,
        visitId: medication.visitId || '',
        quantity: parseInt(medication.quantity),
        prescribedBy: medication.prescribedBy,
        dispensedBy: user!.displayName,
        clinic: user!.clinic,
        date: new Date().toISOString()
      };

      await addDoc(collection(db, 'pharmacy_dispensing'), newDispensing);

      // Update prescription status
      await updateDoc(doc(db, 'prescriptions', medication.id), {
        status: 'dispensed',
        dispensedAt: new Date().toISOString(),
        dispensedBy: user?.displayName
      });

      toast.success(`${medication.medicationName} dispensed successfully`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error dispensing medication:', error);
      toast.error('Failed to dispense medication');
    } finally {
      setProcessing(false);
    }
  };

  const handleDispenseAll = async (prescription: any) => {
    if (!prescription || prescription.medications.length === 0) {
      toast.error('No medications to dispense');
      return;
    }

    setProcessing(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const medication of prescription.medications) {
        try {
          // Create dispensing record
          const newDispensing: Omit<Dispensing, 'id'> = {
            drugId: medication.id,
            drugName: medication.medicationName,
            patientId: medication.patientId,
            patientName: medication.patientName,
            visitId: medication.visitId || '',
            quantity: parseInt(medication.quantity),
            prescribedBy: medication.prescribedBy,
            dispensedBy: user!.displayName,
            clinic: user!.clinic,
            date: new Date().toISOString()
          };

          await addDoc(collection(db, 'pharmacy_dispensing'), newDispensing);

          // Update prescription status
          await updateDoc(doc(db, 'prescriptions', medication.id), {
            status: 'dispensed',
            dispensedAt: new Date().toISOString(),
            dispensedBy: user?.displayName
          });

          successCount++;
        } catch (error) {
          console.error(`Error dispensing ${medication.medicationName}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully dispensed ${successCount} medication${successCount !== 1 ? 's' : ''}`);
        // Clear current prescription and advance to next if auto-advance is enabled
        if (autoAdvance && prescriptionQueue.length > 1) {
          const nextIndex = prescriptionQueue.findIndex(p => p.id === prescription.id) + 1;
          if (nextIndex < prescriptionQueue.length) {
            setCurrentPrescription(prescriptionQueue[nextIndex]);
          } else {
            setCurrentPrescription(null);
          }
        }
        fetchData(); // Refresh inventory
      }
      if (errorCount > 0) {
        toast.error(`Failed to dispense ${errorCount} medication${errorCount !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error dispensing medications:', error);
      toast.error('Failed to dispense medications');
    } finally {
      setProcessing(false);
    }
  };

  // Quick search through prescription queue
  const filteredQueue = prescriptionQueue.filter(prescription =>
    prescription.patientName.toLowerCase().includes(quickSearch.toLowerCase()) ||
    prescription.patientId.toLowerCase().includes(quickSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/pharmacy')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Pharmacy
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dispense Medications</h1>
              <p className="text-muted-foreground mt-1">
                Select patient and medications to dispense
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Queue: {queueLength} prescriptions
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Today: {todayDispensed} dispensed
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Search patient name or ID..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="pl-10 text-lg h-12"
            />
          </div>
        </div>

        {/* Prescription Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Prescription Queue ({filteredQueue.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredQueue.map((prescription) => (
                    <button
                      key={prescription.id}
                      onClick={() => setCurrentPrescription(prescription)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        currentPrescription?.id === prescription.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-border hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-lg">{prescription.patientName}</p>
                          <p className="text-sm text-muted-foreground">ID: {prescription.patientId}</p>
                          <p className="text-sm text-muted-foreground">
                            Dr. {prescription.prescribedBy}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50">
                          {prescription.medications.length} meds
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Prescription Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                {currentPrescription ? `${currentPrescription.patientName} - Medications` : 'Select Prescription'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPrescription ? (
                <div className="space-y-4">
                  {/* Patient Info */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="font-medium">{currentPrescription.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {currentPrescription.patientId} • Dr. {currentPrescription.prescribedBy}
                    </p>
                  </div>

                  {/* Medications */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentPrescription.medications.map((medication: any) => (
                      <div key={medication.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{medication.medicationName}</p>
                            <p className="text-sm text-muted-foreground">
                              {medication.quantity} • {medication.frequency === '1' ? 'Once daily' : 
                               medication.frequency === '2' ? 'Twice daily' :
                               medication.frequency === '3' ? 'Three times daily' : medication.frequency}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleQuickDispense(medication)}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dispense All Button */}
                  <Button
                    onClick={() => handleDispenseAll(currentPrescription)}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5 mr-2" />
                    )}
                    Dispense All ({currentPrescription.medications.length} medications)
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a prescription from the queue to start dispensing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dispensing;
