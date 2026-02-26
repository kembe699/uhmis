import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
// MySQL API imports - Firebase removed
// import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
import { DrugInventory, Dispensing, Patient } from '@/types';

// MySQL API Client for Pharmacy
class PharmacyApiClient {
  private baseUrl = 'http://localhost:3001/api/pharmacy';

  async getInventory(clinicId: string): Promise<DrugInventory[]> {
    try {
      console.log('Fetching inventory for clinic:', clinicId);
      const response = await fetch(`${this.baseUrl}/inventory/${clinicId}`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch inventory: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Inventory data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async addInventoryItem(item: any): Promise<any> {
    try {
      console.log('Sending inventory item to API:', item);
      const response = await fetch(`${this.baseUrl}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to add inventory item: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Success Response:', result);
      return result;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  async getPrescriptions(clinicId: string): Promise<any[]> {
    try {
      console.log('Fetching prescriptions for clinic:', clinicId);
      const response = await fetch(`${this.baseUrl}/prescriptions/${clinicId}`);
      console.log('Prescriptions response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prescriptions response error:', errorText);
        throw new Error(`Failed to fetch prescriptions: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Prescriptions data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  async updatePrescriptionStatus(prescriptionId: string, status: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update prescription status');
      return await response.json();
    } catch (error) {
      console.error('Error updating prescription status:', error);
      throw error;
    }
  }

  async updateInventoryItem(id: string, updates: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update inventory item');
      return await response.json();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  async getDispensingHistory(clinicId: string): Promise<Dispensing[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dispensing/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch dispensing history');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dispensing history:', error);
      throw error;
    }
  }

  async addDispensingRecord(dispensing: any): Promise<any> {
    try {
      console.log('Adding dispensing record:', dispensing);
      const response = await fetch(`${this.baseUrl}/dispensing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispensing),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to add dispensing record: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      console.log('Dispensing record created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding dispensing record:', error);
      throw error;
    }
  }


  async getPatients(clinicId: string): Promise<Patient[]> {
    try {
      const response = await fetch(`http://localhost:3001/api/patients/clinic/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }
}
import {
  Package,
  Plus,
  Search,
  Edit,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Activity,
  TrendingUp,
  BarChart3,
  Pill,
  FileText,
  Eye,
  Loader2,
  Upload,
  Download,
  ShoppingCart,
  Clock,
  Database,
  User,
  ChevronDown,
  ArrowLeft,
  TrendingDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ReturnModal } from './ReturnModal';

const unitTypes = ['Tablets', 'Capsules', 'Bottles', 'Vials', 'Ampules', 'Tubes', 'Sachets', 'Boxes'];

const Pharmacy: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Initialize MySQL API client
  const pharmacyApi = new PharmacyApiClient();
  const [inventory, setInventory] = useState<DrugInventory[]>([]);
  const [dispensingHistory, setDispensingHistory] = useState<Dispensing[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired' | 'near-expiry'>('all');
  const [editingItems, setEditingItems] = useState<{[key: string]: {currentStock: string, expiryDate: string}}>({});
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showStockTakeModal, setShowStockTakeModal] = useState(false);
  const [stockTakeFile, setStockTakeFile] = useState<File | null>(null);
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);
  const [hasShownStockAlert, setHasShownStockAlert] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false);
  const [selectedPrescriptionGroup, setSelectedPrescriptionGroup] = useState<any[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugInventory | null>(null);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [dispensePatientSearch, setDispensePatientSearch] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<Array<{
    drug: DrugInventory;
    quantity: string;
    prescribedBy: string;
  }>>([]);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [manualPatientName, setManualPatientName] = useState('');
  
  // Return states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnPatientSearch, setReturnPatientSearch] = useState('');
  const [selectedReturnPatient, setSelectedReturnPatient] = useState<Patient | null>(null);
  const [patientDispensedMedicines, setPatientDispensedMedicines] = useState<Dispensing[]>([]);
  const [selectedReturnMedicine, setSelectedReturnMedicine] = useState<Dispensing | null>(null);
  const [returnQuantity, setReturnQuantity] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);
  
  // Inventory Report states
  const [reportStartDate, setReportStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredInventoryData, setFilteredInventoryData] = useState<DrugInventory[]>([]);
  const [filteredDispensingData, setFilteredDispensingData] = useState<Dispensing[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Dispensing Report states
  const [dispensingStartDate, setDispensingStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dispensingEndDate, setDispensingEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredDispensingReportData, setFilteredDispensingReportData] = useState<Dispensing[]>([]);
  const [generatingDispensingReport, setGeneratingDispensingReport] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<DrugInventory[]>([]);
  const [expiringItems, setExpiringItems] = useState<DrugInventory[]>([]);

  const [stockForm, setStockForm] = useState({
    drugName: '',
    unitOfMeasure: 'Tablets',
    quantityReceived: '',
    expiryDate: '',
    batchNumber: '',
    reorderLevel: '50',
    unitCost: '',
    margin: '',
    sellingPrice: ''
  });

  const [dispenseForm, setDispenseForm] = useState({
    quantity: '',
    prescribedBy: ''
  });

  // Calculate selling price based on unit cost and margin
  const calculateSellingPrice = (unitCost: string, margin: string) => {
    const cost = parseFloat(unitCost) || 0;
    const marginPercent = parseFloat(margin) || 0;
    
    if (cost > 0 && marginPercent > 0) {
      const sellingPrice = cost + (cost * marginPercent / 100);
      return sellingPrice.toFixed(2);
    }
    return '';
  };

  useEffect(() => {
    fetchData();
  }, [user?.clinic]);

  // Check session storage on component mount to see if alert was already shown
  useEffect(() => {
    const alertShown = sessionStorage.getItem(`stockAlertShown_${user?.clinic}`);
    if (alertShown === 'true') {
      setHasShownStockAlert(true);
    }
  }, [user?.clinic]);

  const fetchData = async () => {
    if (!user?.clinic) return;
    
    setLoading(true);
    try {
      // Fetch inventory from MySQL
      const inventoryData = await pharmacyApi.getInventory(user.clinic);
      setInventory(inventoryData);
      setFilteredInventoryData(inventoryData); // Initialize filtered data

      // Fetch dispensing history from MySQL
      const dispensingData = await pharmacyApi.getDispensingHistory(user.clinic);
      console.log('Fetched dispensing data:', dispensingData);
      console.log('Number of dispensing records:', dispensingData?.length || 0);
      if (dispensingData?.length > 0) {
        console.log('First dispensing record structure:', dispensingData[0]);
      }
      setDispensingHistory(dispensingData);
      setFilteredDispensingData(dispensingData); // Initialize filtered data
      setFilteredDispensingReportData(dispensingData); // Initialize dispensing report filtered data

      // Fetch prescriptions from MySQL
      const prescriptionsData = await pharmacyApi.getPrescriptions(user.clinic);
      setPrescriptions(prescriptionsData);

      // Fetch patients from MySQL
      const patientsData = await pharmacyApi.getPatients(user.clinic);
      console.log('Fetched patients data:', patientsData);
      console.log('Number of patients:', patientsData?.length || 0);
      if (patientsData?.length > 0) {
        console.log('First patient structure:', patientsData[0]);
      }
      setPatients(patientsData);

      // Check for stock alerts after data is loaded
      checkStockAlerts(inventoryData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load pharmacy data');
    } finally {
      setLoading(false);
    }
  };

  // Function to check for stock alerts and show modal
  const checkStockAlerts = (inventoryData: DrugInventory[]) => {
    const lowStockItems = inventoryData.filter(item => item.current_stock <= item.reorderLevel);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const expiringItems = inventoryData.filter(item => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      return expiryDate <= thirtyDaysFromNow;
    });

    setLowStockItems(lowStockItems);
    setExpiringItems(expiringItems);

    // Show modal only if there are alerts AND it hasn't been shown in this session
    if ((lowStockItems.length > 0 || expiringItems.length > 0) && !hasShownStockAlert) {
      setShowStockAlertModal(true);
      setHasShownStockAlert(true);
      // Store in session storage to persist across page refreshes within the same session
      sessionStorage.setItem(`stockAlertShown_${user?.clinic}`, 'true');
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Auto-generate batch number
      const autoBatchNumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const newStock = {
        drug_name: stockForm.drugName,
        unit_of_measure: stockForm.unitOfMeasure,
        quantity_received: parseInt(stockForm.quantityReceived) || 0,
        current_stock: parseInt(stockForm.quantityReceived) || 0,
        expiry_date: stockForm.expiryDate,
        batch_number: autoBatchNumber,
        reorder_level: parseInt(stockForm.reorderLevel) || 50,
        unit_cost: parseFloat(stockForm.unitCost) || 0.00,
        selling_price: parseFloat(stockForm.sellingPrice) || 0.00,
        clinic_id: parseInt(user.clinic),
        date_received: new Date().toISOString().split('T')[0], // DATE format
        received_by: user.uid
      };

      await pharmacyApi.addInventoryItem(newStock);
      
      toast.success('Stock added successfully');
      setShowAddStock(false);
      setStockForm({
        drugName: '',
        unitOfMeasure: 'Tablets',
        quantityReceived: '',
        expiryDate: '',
        batchNumber: '',
        reorderLevel: '50',
        unitCost: '',
        margin: '',
        sellingPrice: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    } finally {
      setSaving(false);
    }
  };

  // Seed data function to add 50 different medications
  const handleSeedData = async () => {
    if (!user?.clinic) return;
    
    setSeeding(true);
    
    try {
      const medications = [
        // 5 Expired medications with low stock (below reorder level)
        { name: 'Paracetamol', unit: 'Tablets', stock: 25, reorder: 50, expiry: '2024-06-15' },
        { name: 'Ibuprofen', unit: 'Tablets', stock: 15, reorder: 30, expiry: '2024-03-20' },
        { name: 'Amoxicillin', unit: 'Capsules', stock: 10, reorder: 25, expiry: '2024-08-10' },
        { name: 'Aspirin', unit: 'Tablets', stock: 20, reorder: 40, expiry: '2024-01-30' },
        { name: 'Metformin', unit: 'Tablets', stock: 12, reorder: 30, expiry: '2024-11-05' },
        
        // Remaining 45 medications expiring in 2027 with good stock levels
        { name: 'Lisinopril', unit: 'Tablets', stock: 180, reorder: 20, expiry: '2027-08-15' },
        { name: 'Atorvastatin', unit: 'Tablets', stock: 150, reorder: 20, expiry: '2027-12-25' },
        { name: 'Omeprazole', unit: 'Capsules', stock: 220, reorder: 25, expiry: '2027-11-10' },
        { name: 'Amlodipine', unit: 'Tablets', stock: 160, reorder: 20, expiry: '2027-02-28' },
        { name: 'Simvastatin', unit: 'Tablets', stock: 140, reorder: 15, expiry: '2027-07-20' },
        { name: 'Losartan', unit: 'Tablets', stock: 130, reorder: 15, expiry: '2027-10-05' },
        { name: 'Hydrochlorothiazide', unit: 'Tablets', stock: 170, reorder: 20, expiry: '2027-12-15' },
        { name: 'Furosemide', unit: 'Tablets', stock: 120, reorder: 15, expiry: '2027-09-10' },
        { name: 'Warfarin', unit: 'Tablets', stock: 80, reorder: 10, expiry: '2027-11-25' },
        { name: 'Digoxin', unit: 'Tablets', stock: 60, reorder: 10, expiry: '2027-08-30' },
        { name: 'Insulin Glargine', unit: 'Vials', stock: 50, reorder: 10, expiry: '2027-06-15' },
        { name: 'Salbutamol Inhaler', unit: 'Bottles', stock: 75, reorder: 10, expiry: '2027-12-31' },
        { name: 'Prednisolone', unit: 'Tablets', stock: 100, reorder: 15, expiry: '2027-10-20' },
        { name: 'Cetirizine', unit: 'Tablets', stock: 200, reorder: 25, expiry: '2027-01-10' },
        { name: 'Loratadine', unit: 'Tablets', stock: 180, reorder: 20, expiry: '2027-11-15' },
        { name: 'Diclofenac', unit: 'Tablets', stock: 150, reorder: 20, expiry: '2027-09-25' },
        { name: 'Tramadol', unit: 'Capsules', stock: 90, reorder: 15, expiry: '2027-08-10' },
        { name: 'Codeine', unit: 'Tablets', stock: 70, reorder: 10, expiry: '2027-07-30' },
        { name: 'Morphine', unit: 'Ampules', stock: 40, reorder: 8, expiry: '2027-12-20' },
        { name: 'Diazepam', unit: 'Tablets', stock: 60, reorder: 10, expiry: '2027-10-30' },
        { name: 'Lorazepam', unit: 'Tablets', stock: 50, reorder: 8, expiry: '2027-09-15' },
        { name: 'Sertraline', unit: 'Tablets', stock: 120, reorder: 15, expiry: '2027-11-05' },
        { name: 'Fluoxetine', unit: 'Capsules', stock: 110, reorder: 15, expiry: '2027-12-10' },
        { name: 'Citalopram', unit: 'Tablets', stock: 100, reorder: 12, expiry: '2027-08-25' },
        { name: 'Levothyroxine', unit: 'Tablets', stock: 200, reorder: 25, expiry: '2027-02-15' },
        { name: 'Metoprolol', unit: 'Tablets', stock: 140, reorder: 18, expiry: '2027-10-12' },
        { name: 'Propranolol', unit: 'Tablets', stock: 130, reorder: 15, expiry: '2027-09-08' },
        { name: 'Carvedilol', unit: 'Tablets', stock: 90, reorder: 12, expiry: '2027-11-20' },
        { name: 'Bisoprolol', unit: 'Tablets', stock: 85, reorder: 10, expiry: '2027-12-05' },
        { name: 'Ramipril', unit: 'Capsules', stock: 160, reorder: 20, expiry: '2027-07-15' },
        { name: 'Enalapril', unit: 'Tablets', stock: 140, reorder: 18, expiry: '2027-08-20' },
        { name: 'Captopril', unit: 'Tablets', stock: 120, reorder: 15, expiry: '2027-10-25' },
        { name: 'Nifedipine', unit: 'Tablets', stock: 110, reorder: 15, expiry: '2027-09-30' },
        { name: 'Diltiazem', unit: 'Tablets', stock: 95, reorder: 12, expiry: '2027-11-12' },
        { name: 'Verapamil', unit: 'Tablets', stock: 80, reorder: 10, expiry: '2027-12-28' },
        { name: 'Clopidogrel', unit: 'Tablets', stock: 150, reorder: 20, expiry: '2027-08-05' },
        { name: 'Rivaroxaban', unit: 'Tablets', stock: 70, reorder: 10, expiry: '2027-07-25' },
        { name: 'Apixaban', unit: 'Tablets', stock: 65, reorder: 8, expiry: '2027-09-20' },
        { name: 'Pantoprazole', unit: 'Tablets', stock: 180, reorder: 22, expiry: '2027-10-18' },
        { name: 'Lansoprazole', unit: 'Capsules', stock: 160, reorder: 20, expiry: '2027-11-28' },
        { name: 'Ranitidine', unit: 'Tablets', stock: 140, reorder: 18, expiry: '2027-12-12' },
        { name: 'Domperidone', unit: 'Tablets', stock: 120, reorder: 15, expiry: '2027-08-15' },
        { name: 'Loperamide', unit: 'Capsules', stock: 100, reorder: 12, expiry: '2027-09-22' },
        { name: 'Mebeverine', unit: 'Tablets', stock: 90, reorder: 12, expiry: '2027-10-08' },
        { name: 'Lactulose', unit: 'Bottles', stock: 80, reorder: 10, expiry: '2027-11-30' }
      ];

      const batch = [];
      for (const med of medications) {
        const newStock = {
          drugName: med.name,
          unitOfMeasure: med.unit,
          quantityReceived: med.stock,
          currentStock: med.stock,
          expiryDate: med.expiry,
          batchNumber: `BATCH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          reorderLevel: med.reorder,
          clinic: user.clinic,
          dateReceived: new Date().toISOString(),
          receivedBy: user.displayName
        };
        batch.push(pharmacyApi.addInventoryItem(newStock));
      }

      await Promise.all(batch);
      
      toast.success(`Successfully added ${medications.length} medications to inventory`);
      fetchData();
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed inventory data');
    } finally {
      setSeeding(false);
    }
  };

  // Handle editing inventory items
  const handleEditItem = (item: DrugInventory) => {
    setEditingItems(prev => ({
      ...prev,
      [item.id]: {
        currentStock: item.current_stock.toString(),
        expiryDate: item.expiry_date
      }
    }));
  };

  const handleCancelEdit = (itemId: string) => {
    setEditingItems(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  };

  const handleUpdateItem = async (item: DrugInventory) => {
    const editData = editingItems[item.id];
    if (!editData || !user?.clinic) return;

    const newStock = parseInt(editData.currentStock);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    if (!editData.expiryDate) {
      toast.error('Please enter a valid expiry date');
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(item.id));

    try {
      await pharmacyApi.updateInventoryItem(item.id, {
        current_stock: newStock,
        expiry_date: editData.expiryDate
      });

      toast.success('Item updated successfully');
      handleCancelEdit(item.id);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Generate Inventory Report with date filtering
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    
    try {
      // Set time to start of day for start date and end of day for end date
      const startDate = new Date(reportStartDate + 'T00:00:00.000Z');
      const endDate = new Date(reportEndDate + 'T23:59:59.999Z');
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter dispensing data by date range
      const filteredDispensing = dispensingHistory.filter(record => {
        const recordDate = new Date(record.dispensedAt || record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      // Filter inventory data by date received within the range
      const filteredInventory = inventory.filter(item => {
        const receivedDate = new Date(item.date_received);
        return receivedDate >= startDate && receivedDate <= endDate;
      });
      
      setFilteredDispensingData(filteredDispensing);
      setFilteredInventoryData(filteredInventory);
      
      toast.success(`Report generated: ${filteredDispensing.length} dispensing records and ${filteredInventory.length} inventory items for ${reportStartDate} to ${reportEndDate}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Handle Return Patient Search
  const handleReturnPatientSearch = async (patientId: string) => {
    if (!user?.clinic) return;
    
    try {
      // Find patient
      const patient = patients.find(p => p.id === patientId);
      if (!patient) {
        toast.error('Patient not found');
        return;
      }
      
      setSelectedReturnPatient(patient);
      
      // TODO: Replace with MySQL API call to fetch dispensed medicines
      // For now, use empty array to prevent errors
      const dispensedMedicines = [] as Dispensing[];
      
      // Filter to recent dispensing (last 30 days) for returns
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentDispensing = dispensedMedicines.filter(record => {
        const dispensingDate = new Date(record.dispensedAt || record.date);
        return dispensingDate >= thirtyDaysAgo;
      });
      
      setPatientDispensedMedicines(recentDispensing);
      
      if (recentDispensing.length === 0) {
        toast.info('No recent dispensing records found for this patient (last 30 days)');
      }
    } catch (error) {
      console.error('Error fetching patient dispensing history:', error);
      toast.error('Failed to fetch patient dispensing history');
    }
  };

  // Handle Medicine Return
  const handleMedicineReturn = async () => {
    if (!selectedReturnMedicine || !selectedReturnPatient || !user?.clinic) return;
    
    const quantity = parseInt(returnQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid return quantity');
      return;
    }
    
    if (quantity > selectedReturnMedicine.quantity) {
      toast.error('Return quantity cannot exceed dispensed quantity');
      return;
    }
    
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for the return');
      return;
    }
    
    setProcessingReturn(true);
    
    try {
      // Find the corresponding inventory item
      const inventoryItem = inventory.find(item => 
        item.drugName === selectedReturnMedicine.drugName
      );
      
      if (!inventoryItem) {
        toast.error('Inventory item not found');
        return;
      }
      
      // Create return record
      const returnRecord = {
        originalDispensingId: selectedReturnMedicine.id,
        patientId: selectedReturnPatient.id,
        patientName: selectedReturnPatient.fullName,
        drugId: inventoryItem.id,
        drugName: selectedReturnMedicine.drugName,
        quantityReturned: quantity,
        originalQuantity: selectedReturnMedicine.quantity,
        returnReason: returnReason.trim(),
        returnDate: new Date().toISOString(),
        returnedBy: user.displayName,
        clinic: user.clinic,
        status: 'accepted'
      };
      
      // TODO: Add return record to database via MySQL API
      // await pharmacyApi.addReturnRecord(returnRecord);
      
      // Update inventory stock (add returned quantity back)
      await pharmacyApi.updateInventoryItem(inventoryItem.id, {
        current_stock: inventoryItem.current_stock + quantity
      });
      
      toast.success(`Return processed successfully. ${quantity} units of ${selectedReturnMedicine.drugName} returned to inventory.`);
      
      // Reset form
      setSelectedReturnMedicine(null);
      setReturnQuantity('');
      setReturnReason('');
      setShowReturnModal(false);
      setSelectedReturnPatient(null);
      setReturnPatientSearch('');
      setPatientDispensedMedicines([]);
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Failed to process return');
    } finally {
      setProcessingReturn(false);
    }
  };

  // Export Inventory Report to CSV
  const handleExportInventoryReport = () => {
    try {
      // Use filtered inventory data if available, otherwise use all inventory
      const dataToExport = filteredInventoryData.length > 0 ? filteredInventoryData : inventory;
      
      // Calculate velocity for each item to determine fast/slow moving
      const reportData = dataToExport.map(item => {
        // Calculate stock movements using filtered dispensing data
        const stockDispensed = filteredDispensingData
          .filter(record => record.drugName === item.drugName)
          .reduce((sum, record) => sum + record.quantity, 0);
        
        const openingStock = item.current_stock + stockDispensed;
        const stockMovement = item.quantity_received - stockDispensed;
        const isLowStock = item.current_stock <= item.reorderLevel;
        const isExpiring = new Date(item.expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        
        // Calculate velocity (dispensed / current stock ratio)
        const velocity = item.current_stock > 0 ? (stockDispensed / item.current_stock) : 0;
        let movementCategory = 'No Movement';
        if (velocity > 2) movementCategory = 'Fast Moving';
        else if (velocity > 0.5) movementCategory = 'Medium Moving';
        else if (velocity > 0) movementCategory = 'Slow Moving';
        
        // Calculate days to stock out
        const daysToStockOut = velocity > 0 ? Math.round(item.current_stock / (stockDispensed / 30)) : 'N/A';
        
        // Calculate stock value
        const estimatedUnitCost = 10; // Default unit cost
        const stockValue = item.current_stock * estimatedUnitCost;
        
        return {
          'Drug Name': item.drugName,
          'Unit of Measure': item.unitOfMeasure,
          'Opening Stock': openingStock,
          'Stock Received': item.quantity_received,
          'Stock Dispensed': stockDispensed,
          'Closing Stock': item.current_stock,
          'Stock Movement': stockMovement,
          'Velocity Ratio': velocity.toFixed(2),
          'Movement Category': movementCategory,
          'Days to Stock Out': daysToStockOut,
          'Reorder Level': item.reorderLevel,
          'Reorder Status': isLowStock ? 'Low Stock' : 'Adequate',
          'Stock Value ($)': stockValue,
          'Expiry Date': item.expiry_date,
          'Days to Expiry': Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          'Expiry Status': isExpiring ? 'Expiring Soon' : 'Good',
          'Batch Number': item.batch_number,
          'Date Received': new Date(item.date_received).toLocaleDateString(),
          'Received By': item.received_by,
          'Last Updated': (item as any).updatedAt ? new Date((item as any).updatedAt).toLocaleDateString() : new Date(item.date_received).toLocaleDateString()
        };
      });

      if (reportData.length === 0) {
        toast.error('No data available to export');
        return;
      }

      // Sort by movement category and velocity for better analysis
      reportData.sort((a, b) => {
        const categoryOrder = { 'Fast Moving': 0, 'Medium Moving': 1, 'Slow Moving': 2, 'No Movement': 3 };
        return categoryOrder[a['Movement Category']] - categoryOrder[b['Movement Category']] || 
               parseFloat(b['Velocity Ratio']) - parseFloat(a['Velocity Ratio']);
      });

      // Calculate summary statistics
      const totalItems = reportData.length;
      const totalStockReceived = reportData.reduce((sum, item) => sum + item['Stock Received'], 0);
      const totalStockDispensed = reportData.reduce((sum, item) => sum + item['Stock Dispensed'], 0);
      const totalCurrentStock = reportData.reduce((sum, item) => sum + item['Closing Stock'], 0);
      const totalStockValue = reportData.reduce((sum, item) => sum + item['Stock Value ($)'], 0);
      const fastMovingCount = reportData.filter(item => item['Movement Category'] === 'Fast Moving').length;
      const slowMovingCount = reportData.filter(item => item['Movement Category'] === 'Slow Moving').length;
      const lowStockCount = reportData.filter(item => item['Reorder Status'] === 'Low Stock').length;
      const expiringCount = reportData.filter(item => item['Expiry Status'] === 'Expiring Soon').length;

      // Create comprehensive CSV content with report header
      const reportDate = new Date().toLocaleDateString();
      const reportTime = new Date().toLocaleTimeString();
      
      const csvLines = [
        // Report Header
        `"COMPREHENSIVE INVENTORY REPORT"`,
        `"Generated on: ${reportDate} at ${reportTime}"`,
        `"Report Period: ${reportStartDate} to ${reportEndDate}"`,
        `"Clinic: ${user?.clinic || 'N/A'}"`,
        `"Generated by: ${user?.displayName || 'System'}"`,
        `""`, // Empty line
        
        // Summary Statistics
        `"SUMMARY STATISTICS"`,
        `"Total Inventory Items","${totalItems}"`,
        `"Total Stock Received","${totalStockReceived}"`,
        `"Total Stock Dispensed","${totalStockDispensed}"`,
        `"Total Current Stock","${totalCurrentStock}"`,
        `"Total Stock Value","$${totalStockValue.toLocaleString()}"`,
        `"Fast Moving Items","${fastMovingCount}"`,
        `"Slow Moving Items","${slowMovingCount}"`,
        `"Low Stock Items","${lowStockCount}"`,
        `"Items Expiring Soon","${expiringCount}"`,
        `""`, // Empty line
        
        // Movement Analysis
        `"MOVEMENT ANALYSIS"`,
        `"Fast Moving Drugs (Velocity > 2.0)"`,
        ...reportData
          .filter(item => item['Movement Category'] === 'Fast Moving')
          .slice(0, 10)
          .map(item => `"${item['Drug Name']}","Velocity: ${item['Velocity Ratio']}","Stock: ${item['Closing Stock']}"`),
        `""`,
        `"Slow Moving Drugs (Velocity < 0.5)"`,
        ...reportData
          .filter(item => item['Movement Category'] === 'Slow Moving')
          .slice(0, 10)
          .map(item => `"${item['Drug Name']}","Velocity: ${item['Velocity Ratio']}","Stock: ${item['Closing Stock']}"`),
        `""`, // Empty line
        
        // Detailed Data Headers
        `"DETAILED INVENTORY DATA"`,
        Object.keys(reportData[0]).map(header => `"${header}"`).join(','),
        
        // Detailed Data Rows
        ...reportData.map(row => 
          Object.values(row).map(value => `"${value}"`).join(',')
        )
      ];

      const csvContent = csvLines.join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Comprehensive_Inventory_Report_${reportStartDate}_to_${reportEndDate}_${user?.clinic?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Comprehensive inventory report exported successfully');
    } catch (error) {
      console.error('Error exporting inventory report:', error);
      toast.error('Failed to export inventory report');
    }
  };

  // Export Inventory Report to PDF
  const handleExportInventoryReportPDF = () => {
    try {
      // Use filtered inventory data if available, otherwise use all inventory
      const dataToExport = filteredInventoryData.length > 0 ? filteredInventoryData : inventory;
      
      // Calculate velocity for each item to determine fast/slow moving
      const reportData = dataToExport.map(item => {
        // Calculate stock movements using filtered dispensing data
        const stockDispensed = filteredDispensingData
          .filter(record => record.drugName === item.drugName)
          .reduce((sum, record) => sum + record.quantity, 0);
        
        const openingStock = item.current_stock + stockDispensed;
        const stockMovement = item.quantity_received - stockDispensed;
        const isLowStock = item.current_stock <= item.reorderLevel;
        const isExpiring = new Date(item.expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        
        // Calculate velocity (dispensed / current stock ratio)
        const velocity = item.current_stock > 0 ? (stockDispensed / item.current_stock) : 0;
        let movementCategory = 'No Movement';
        if (velocity > 2) movementCategory = 'Fast Moving';
        else if (velocity > 0.5) movementCategory = 'Medium Moving';
        else if (velocity > 0) movementCategory = 'Slow Moving';
        
        // Calculate days to stock out
        const daysToStockOut = velocity > 0 ? Math.round(item.current_stock / (stockDispensed / 30)) : 'N/A';
        
        // Calculate stock value
        const estimatedUnitCost = 10; // Default unit cost
        const stockValue = item.current_stock * estimatedUnitCost;
        
        return {
          drugName: item.drugName,
          unitOfMeasure: item.unitOfMeasure,
          openingStock: openingStock,
          stockReceived: item.quantity_received,
          stockDispensed: stockDispensed,
          closingStock: item.current_stock,
          stockMovement: stockMovement,
          velocityRatio: velocity.toFixed(2),
          movementCategory: movementCategory,
          daysToStockOut: daysToStockOut,
          reorderLevel: item.reorderLevel,
          reorderStatus: isLowStock ? 'Low Stock' : 'Adequate',
          stockValue: stockValue,
          expiryDate: item.expiry_date,
          daysToExpiry: Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          expiryStatus: isExpiring ? 'Expiring Soon' : 'Good',
          batchNumber: item.batch_number,
          dateReceived: new Date(item.date_received).toLocaleDateString(),
          receivedBy: item.received_by
        };
      });

      if (reportData.length === 0) {
        toast.error('No data available to export');
        return;
      }

      // Sort by movement category and velocity for better analysis
      reportData.sort((a, b) => {
        const categoryOrder = { 'Fast Moving': 0, 'Medium Moving': 1, 'Slow Moving': 2, 'No Movement': 3 };
        return categoryOrder[a.movementCategory] - categoryOrder[b.movementCategory] || 
               parseFloat(b.velocityRatio) - parseFloat(a.velocityRatio);
      });

      // Calculate summary statistics
      const totalItems = reportData.length;
      const totalStockReceived = reportData.reduce((sum, item) => sum + item.stockReceived, 0);
      const totalStockDispensed = reportData.reduce((sum, item) => sum + item.stockDispensed, 0);
      const totalCurrentStock = reportData.reduce((sum, item) => sum + item.closingStock, 0);
      const totalStockValue = reportData.reduce((sum, item) => sum + item.stockValue, 0);
      const fastMovingCount = reportData.filter(item => item.movementCategory === 'Fast Moving').length;
      const slowMovingCount = reportData.filter(item => item.movementCategory === 'Slow Moving').length;
      const lowStockCount = reportData.filter(item => item.reorderStatus === 'Low Stock').length;
      const expiringCount = reportData.filter(item => item.expiryStatus === 'Expiring Soon').length;

      // Create PDF
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Report Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPREHENSIVE INVENTORY REPORT', pageWidth / 2, 20, { align: 'center' });
      
      // Report metadata
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const reportDate = new Date().toLocaleDateString();
      const reportTime = new Date().toLocaleTimeString();
      
      pdf.text(`Generated on: ${reportDate} at ${reportTime}`, 20, 35);
      pdf.text(`Report Period: ${reportStartDate} to ${reportEndDate}`, 20, 42);
      pdf.text(`Clinic: ${user?.clinic || 'N/A'}`, 20, 49);
      pdf.text(`Generated by: ${user?.displayName || 'System'}`, 20, 56);
      
      // Summary Statistics
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUMMARY STATISTICS', 20, 70);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Inventory Items', totalItems.toString()],
        ['Total Stock Received', totalStockReceived.toString()],
        ['Total Stock Dispensed', totalStockDispensed.toString()],
        ['Total Current Stock', totalCurrentStock.toString()],
        ['Total Stock Value', `$${totalStockValue.toLocaleString()}`],
        ['Fast Moving Items', fastMovingCount.toString()],
        ['Slow Moving Items', slowMovingCount.toString()],
        ['Low Stock Items', lowStockCount.toString()],
        ['Items Expiring Soon', expiringCount.toString()]
      ];
      
      autoTable(pdf, {
        startY: 75,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40 } }
      });
      
      // Movement Analysis
      let currentY = (pdf as any).lastAutoTable.finalY + 15;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MOVEMENT ANALYSIS', 20, currentY);
      
      // Fast Moving Drugs
      currentY += 10;
      pdf.setFontSize(12);
      pdf.text('Fast Moving Drugs (Velocity > 2.0)', 20, currentY);
      
      const fastMovingData = reportData
        .filter(item => item.movementCategory === 'Fast Moving')
        .slice(0, 10)
        .map(item => [item.drugName, item.velocityRatio, item.closingStock.toString()]);
      
      if (fastMovingData.length > 0) {
        autoTable(pdf, {
          startY: currentY + 5,
          head: [['Drug Name', 'Velocity', 'Current Stock']],
          body: fastMovingData,
          theme: 'striped',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          styles: { fontSize: 8 },
          columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } }
        });
        currentY = (pdf as any).lastAutoTable.finalY + 10;
      } else {
        currentY += 15;
        pdf.setFontSize(10);
        pdf.text('No fast moving drugs in this period', 25, currentY);
        currentY += 10;
      }
      
      // Slow Moving Drugs
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Slow Moving Drugs (Velocity < 0.5)', 20, currentY);
      
      const slowMovingData = reportData
        .filter(item => item.movementCategory === 'Slow Moving')
        .slice(0, 10)
        .map(item => [item.drugName, item.velocityRatio, item.closingStock.toString()]);
      
      if (slowMovingData.length > 0) {
        autoTable(pdf, {
          startY: currentY + 5,
          head: [['Drug Name', 'Velocity', 'Current Stock']],
          body: slowMovingData,
          theme: 'striped',
          headStyles: { fillColor: [231, 76, 60], textColor: 255 },
          styles: { fontSize: 8 },
          columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } }
        });
        currentY = (pdf as any).lastAutoTable.finalY + 15;
      } else {
        currentY += 15;
        pdf.setFontSize(10);
        pdf.text('No slow moving drugs in this period', 25, currentY);
        currentY += 15;
      }
      
      // Check if we need a new page for detailed data
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Detailed Inventory Data
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETAILED INVENTORY DATA', 20, currentY);
      
      const detailedHeaders = [
        'Drug Name', 'Unit', 'Opening', 'Received', 'Dispensed', 'Closing', 
        'Movement', 'Velocity', 'Category', 'Reorder', 'Status', 'Value', 'Expiry'
      ];
      
      const detailedData = reportData.map(item => [
        item.drugName.length > 15 ? item.drugName.substring(0, 12) + '...' : item.drugName,
        item.unitOfMeasure.length > 8 ? item.unitOfMeasure.substring(0, 5) + '...' : item.unitOfMeasure,
        item.openingStock.toString(),
        item.stockReceived.toString(),
        item.stockDispensed.toString(),
        item.closingStock.toString(),
        item.stockMovement.toString(),
        item.velocityRatio,
        item.movementCategory.substring(0, 6),
        item.reorderLevel.toString(),
        item.reorderStatus === 'Low Stock' ? 'Low' : 'OK',
        `$${item.stockValue}`,
        item.expiryStatus === 'Expiring Soon' ? 'Exp' : 'OK'
      ]);
      
      autoTable(pdf, {
        startY: currentY + 5,
        head: [detailedHeaders],
        body: detailedData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 7 },
        styles: { fontSize: 6, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 25 }, // Drug Name
          1: { cellWidth: 15 }, // Unit
          2: { cellWidth: 15 }, // Opening
          3: { cellWidth: 15 }, // Received
          4: { cellWidth: 15 }, // Dispensed
          5: { cellWidth: 15 }, // Closing
          6: { cellWidth: 15 }, // Movement
          7: { cellWidth: 15 }, // Velocity
          8: { cellWidth: 20 }, // Category
          9: { cellWidth: 15 }, // Reorder
          10: { cellWidth: 12 }, // Status
          11: { cellWidth: 18 }, // Value
          12: { cellWidth: 12 }  // Expiry
        }
      });
      
      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text(`Generated by Clinic Buddy - Inventory Management System`, 20, pageHeight - 10);
      }
      
      // Save PDF
      const filename = `Comprehensive_Inventory_Report_${reportStartDate}_to_${reportEndDate}_${user?.clinic?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast.success('PDF inventory report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF inventory report:', error);
      toast.error('Failed to export PDF inventory report');
    }
  };

  // Generate Dispensing Report with date filtering
  const handleGenerateDispensingReport = async () => {
    setGeneratingDispensingReport(true);
    
    try {
      // Set time to start of day for start date and end of day for end date
      const startDate = new Date(dispensingStartDate + 'T00:00:00.000Z');
      const endDate = new Date(dispensingEndDate + 'T23:59:59.999Z');
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter dispensing data by date range
      const filteredDispensing = dispensingHistory.filter(record => {
        const recordDate = new Date(record.dispensedAt || record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      setFilteredDispensingReportData(filteredDispensing);
      
      toast.success(`Dispensing report generated: ${filteredDispensing.length} records for ${dispensingStartDate} to ${dispensingEndDate}`);
    } catch (error) {
      console.error('Error generating dispensing report:', error);
      toast.error('Failed to generate dispensing report');
    } finally {
      setGeneratingDispensingReport(false);
    }
  };

  // Export Dispensing Report to CSV
  const handleExportDispensingReportCSV = () => {
    try {
      const dataToExport = filteredDispensingReportData.length > 0 ? filteredDispensingReportData : dispensingHistory;
      
      if (dataToExport.length === 0) {
        toast.error('No dispensing data available to export');
        return;
      }

      // Calculate summary statistics
      const totalDispensed = dataToExport.reduce((sum, record) => sum + record.quantity, 0);
      const uniqueDrugs = new Set(dataToExport.map(record => record.drugName)).size;
      const uniquePatients = new Set(dataToExport.map(record => record.patientName)).size;
      const totalTransactions = dataToExport.length;

      // Group by drug for analysis
      const drugAnalysis = dataToExport.reduce((acc, record) => {
        if (!acc[record.drugName]) {
          acc[record.drugName] = { quantity: 0, transactions: 0 };
        }
        acc[record.drugName].quantity += record.quantity;
        acc[record.drugName].transactions += 1;
        return acc;
      }, {} as Record<string, { quantity: number; transactions: number }>);

      // Sort drugs by quantity dispensed
      const sortedDrugs = Object.entries(drugAnalysis)
        .sort(([,a], [,b]) => b.quantity - a.quantity)
        .slice(0, 10);

      // Create comprehensive CSV content with report header
      const reportDate = new Date().toLocaleDateString();
      const reportTime = new Date().toLocaleTimeString();
      
      const csvLines = [
        // Report Header
        `"COMPREHENSIVE DISPENSING REPORT"`,
        `"Generated on: ${reportDate} at ${reportTime}"`,
        `"Report Period: ${dispensingStartDate} to ${dispensingEndDate}"`,
        `"Clinic: ${user?.clinic || 'N/A'}"`,
        `"Generated by: ${user?.displayName || 'System'}"`,
        `""`, // Empty line
        
        // Summary Statistics
        `"SUMMARY STATISTICS"`,
        `"Total Dispensing Transactions","${totalTransactions}"`,
        `"Total Quantity Dispensed","${totalDispensed}"`,
        `"Unique Drugs Dispensed","${uniqueDrugs}"`,
        `"Unique Patients Served","${uniquePatients}"`,
        `"Average Quantity per Transaction","${(totalDispensed / totalTransactions).toFixed(2)}"`,
        `""`, // Empty line
        
        // Top Dispensed Drugs
        `"TOP 10 DISPENSED DRUGS"`,
        `"Drug Name","Total Quantity","Transactions","Avg per Transaction"`,
        ...sortedDrugs.map(([drugName, data]) => 
          `"${drugName}","${data.quantity}","${data.transactions}","${(data.quantity / data.transactions).toFixed(2)}"`
        ),
        `""`, // Empty line
        
        // Detailed Dispensing Data
        `"DETAILED DISPENSING DATA"`,
        `"Date","Patient Name","Drug Name","Quantity","Unit","Prescribed By","Dispensed By","Notes"`,
        
        // Detailed Data Rows
        ...dataToExport.map(record => 
          `"${new Date(record.date).toLocaleDateString()}","${record.patientName}","${record.drugName}","${record.quantity}","${(record as any).unit || 'N/A'}","${record.prescribedBy}","${record.dispensedBy}","${(record as any).notes || ''}"`
        )
      ];

      const csvContent = csvLines.join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Dispensing_Report_${dispensingStartDate}_to_${dispensingEndDate}_${user?.clinic?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Dispensing report CSV exported successfully');
    } catch (error) {
      console.error('Error exporting dispensing report CSV:', error);
      toast.error('Failed to export dispensing report CSV');
    }
  };

  // Export Dispensing Report to PDF
  const handleExportDispensingReportPDF = () => {
    try {
      const dataToExport = filteredDispensingReportData.length > 0 ? filteredDispensingReportData : dispensingHistory;
      
      if (dataToExport.length === 0) {
        toast.error('No dispensing data available to export');
        return;
      }

      // Calculate summary statistics
      const totalDispensed = dataToExport.reduce((sum, record) => sum + record.quantity, 0);
      const uniqueDrugs = new Set(dataToExport.map(record => record.drugName)).size;
      const uniquePatients = new Set(dataToExport.map(record => record.patientName)).size;
      const totalTransactions = dataToExport.length;

      // Group by drug for analysis
      const drugAnalysis = dataToExport.reduce((acc, record) => {
        if (!acc[record.drugName]) {
          acc[record.drugName] = { quantity: 0, transactions: 0 };
        }
        acc[record.drugName].quantity += record.quantity;
        acc[record.drugName].transactions += 1;
        return acc;
      }, {} as Record<string, { quantity: number; transactions: number }>);

      // Sort drugs by quantity dispensed
      const sortedDrugs = Object.entries(drugAnalysis)
        .sort(([,a], [,b]) => b.quantity - a.quantity)
        .slice(0, 10);

      // Create PDF
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Report Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPREHENSIVE DISPENSING REPORT', pageWidth / 2, 20, { align: 'center' });
      
      // Report metadata
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const reportDate = new Date().toLocaleDateString();
      const reportTime = new Date().toLocaleTimeString();
      
      pdf.text(`Generated on: ${reportDate} at ${reportTime}`, 20, 35);
      pdf.text(`Report Period: ${dispensingStartDate} to ${dispensingEndDate}`, 20, 42);
      pdf.text(`Clinic: ${user?.clinic || 'N/A'}`, 20, 49);
      pdf.text(`Generated by: ${user?.displayName || 'System'}`, 20, 56);
      
      // Summary Statistics
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUMMARY STATISTICS', 20, 70);
      
      const summaryData = [
        ['Total Dispensing Transactions', totalTransactions.toString()],
        ['Total Quantity Dispensed', totalDispensed.toString()],
        ['Unique Drugs Dispensed', uniqueDrugs.toString()],
        ['Unique Patients Served', uniquePatients.toString()],
        ['Average Quantity per Transaction', (totalDispensed / totalTransactions).toFixed(2)]
      ];
      
      autoTable(pdf, {
        startY: 75,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 } }
      });
      
      // Top Dispensed Drugs
      let currentY = (pdf as any).lastAutoTable.finalY + 15;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOP 10 DISPENSED DRUGS', 20, currentY);
      
      const topDrugsData = sortedDrugs.map(([drugName, data]) => [
        drugName.length > 25 ? drugName.substring(0, 22) + '...' : drugName,
        data.quantity.toString(),
        data.transactions.toString(),
        (data.quantity / data.transactions).toFixed(2)
      ]);
      
      autoTable(pdf, {
        startY: currentY + 5,
        head: [['Drug Name', 'Total Qty', 'Transactions', 'Avg per Transaction']],
        body: topDrugsData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: { 
          0: { cellWidth: 70 }, 
          1: { cellWidth: 30 }, 
          2: { cellWidth: 30 }, 
          3: { cellWidth: 40 } 
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 15;
      
      // Check if we need a new page for detailed data
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Detailed Dispensing Data
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETAILED DISPENSING DATA', 20, currentY);
      
      const detailedHeaders = [
        'Date', 'Patient', 'Drug Name', 'Quantity', 'Unit', 'Prescribed By', 'Dispensed By'
      ];
      
      const detailedData = dataToExport.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.patientName.length > 15 ? record.patientName.substring(0, 12) + '...' : record.patientName,
        record.drugName.length > 20 ? record.drugName.substring(0, 17) + '...' : record.drugName,
        record.quantity.toString(),
        (record as any).unit || 'N/A',
        record.prescribedBy.length > 15 ? record.prescribedBy.substring(0, 12) + '...' : record.prescribedBy,
        record.dispensedBy.length > 15 ? record.dispensedBy.substring(0, 12) + '...' : record.dispensedBy
      ]);
      
      autoTable(pdf, {
        startY: currentY + 5,
        head: [detailedHeaders],
        body: detailedData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94], textColor: 255, fontSize: 7 },
        styles: { fontSize: 6, cellPadding: 1 },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 35 }, // Patient
          2: { cellWidth: 40 }, // Drug Name
          3: { cellWidth: 20 }, // Quantity
          4: { cellWidth: 20 }, // Unit
          5: { cellWidth: 35 }, // Prescribed By
          6: { cellWidth: 35 }  // Dispensed By
        }
      });
      
      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text(`Generated by Clinic Buddy - Dispensing Management System`, 20, pageHeight - 10);
      }
      
      // Save PDF
      const filename = `Dispensing_Report_${dispensingStartDate}_to_${dispensingEndDate}_${user?.clinic?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast.success('Dispensing report PDF exported successfully');
    } catch (error) {
      console.error('Error exporting dispensing report PDF:', error);
      toast.error('Failed to export dispensing report PDF');
    }
  };

  // CSV Download functionality
  const handleDownloadCSV = async () => {
    try {
      // Define CSV headers
      const headers = [
        'Drug Name',
        'Current Stock',
        'Unit',
        'Reorder Level',
        'Expiry Date',
        'Batch Number',
        'Date Received',
        'Status'
      ];

      // Prepare data rows
      const rows = inventory.map(item => {
        const isLow = item.current_stock <= item.reorderLevel;
        const isExpiring = new Date(item.expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        
        let status = 'In Stock';
        if (item.current_stock === 0) status = 'Out of Stock';
        else if (isLow && isExpiring) status = 'Low Stock & Expiring';
        else if (isLow) status = 'Low Stock';
        else if (isExpiring) status = 'Expiring Soon';

        return [
          item.drugName,
          item.current_stock,
          item.unitOfMeasure,
          item.reorderLevel,
          new Date(item.expiry_date).toLocaleDateString(),
          item.batch_number || 'N/A',
          new Date(item.date_received).toLocaleDateString(),
          status
        ];
      });

      if (rows.length === 0) {
        toast.error('No data available to export');
        return;
      }

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pharmacy_inventory_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Inventory exported successfully');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      toast.error('Failed to export inventory');
    }
  };

  // Handle inventory export (alias for handleDownloadCSV)
  const handleExportInventory = handleDownloadCSV;

  // Template download functionality
  const handleDownloadTemplate = () => {
    try {
      const templateHeaders = [
        'Drug Name',
        'Unit of Measure',
        'Current Stock',
        'Reorder Level',
        'Expiry Date (Multiple formats accepted)',
        'Batch Number'
      ];

      const sampleData = [
        ['Paracetamol', 'Tablets', '500', '50', '31/12/2027', 'BATCH-001'],
        ['Ibuprofen', 'Tablets', '300', '30', '2027-11-30', 'BATCH-002'],
        ['Amoxicillin', 'Capsules', '200', '25', '15.10.2027', 'BATCH-003']
      ];

      const csvContent = [templateHeaders, ...sampleData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'pharmacy-inventory-template.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  // Import inventory functionality
  const handleImportInventory = async () => {
    if (!importFile || !user?.clinic) {
      toast.error('Please select a file to import');
      return;
    }

    setImporting(true);

    try {
      // Use FileReader API for better compatibility and error handling
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error('Failed to read file content'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('File reading failed. Please try selecting the file again.'));
        };
        
        reader.onabort = () => {
          reject(new Error('File reading was aborted. Please try again.'));
        };
        
        // Read file as text with UTF-8 encoding
        reader.readAsText(importFile, 'UTF-8');
      });

      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Invalid file format. Please use the provided template.');
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      const importData = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        if (!line.trim()) continue; // Skip empty lines
        
        try {
          // Handle both comma and tab separated values
          let columns = [];
          if (line.includes('\t')) {
            columns = line.split('\t').map(col => col.trim());
          } else {
            columns = line.split(',').map(col => col.replace(/"/g, '').trim());
          }
          
          // Skip if not enough columns
          if (columns.length < 4) continue;

          // Extract data with fallbacks - matching template format:
          // Drug Name,Unit of Measure,Quantity Received,Expiry Date,Reorder Level,Unit Cost,Selling Price
          const drugName = columns[0] || `Drug-${i + 1}`;
          const unitOfMeasure = columns[1] || 'Units';
          const quantityReceived = columns[2] || '0';
          const expiryDate = columns[3] || '2027-12-31';
          const reorderLevel = columns[4] || '10';
          const unitCost = columns[5] || '0.00';
          const sellingPrice = columns[6] || '0.00';
          const batchNumber = `BATCH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`; // Auto-generate

          // Skip if drug name is empty or invalid
          if (!drugName || drugName.length < 2) continue;

          // Parse stock numbers with defaults
          let stock = parseInt(quantityReceived) || 0;
          let reorder = parseInt(reorderLevel) || 10;
          let cost = parseFloat(unitCost) || 0.00;
          let price = parseFloat(sellingPrice) || 0.00;
          
          // Ensure positive numbers
          if (stock < 0) stock = 0;
          if (reorder < 0) reorder = 10;
          if (cost < 0) cost = 0.00;
          if (price < 0) price = 0.00;

          // Simple date parsing - try multiple formats
          let isoDate = '2027-12-31'; // Default date
          
          if (expiryDate && expiryDate.trim()) {
            const dateStr = expiryDate.trim();
            
            // Try YYYY-MM-DD format first (most common in your data)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              // Validate the date components
              const [year, month, day] = dateStr.split('-').map(Number);
              if (year >= 2020 && year <= 2050 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                isoDate = dateStr;
              }
            }
            // Try dd/mm/yyyy format
            else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
              const [day, month, year] = dateStr.split('/').map(Number);
              if (year >= 2020 && year <= 2050 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              }
            }
            // Try dd-mm-yyyy format
            else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
              const [day, month, year] = dateStr.split('-').map(Number);
              if (year >= 2020 && year <= 2050 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              }
            }
          }

          const itemData = {
            drug_name: drugName.trim(),
            unit_of_measure: unitOfMeasure.trim(),
            quantity_received: stock,
            current_stock: stock,
            expiry_date: isoDate,
            batch_number: batchNumber.trim(),
            reorder_level: reorder,
            unit_cost: cost,
            selling_price: price,
            clinic_id: parseInt(user.clinic),
            date_received: new Date().toISOString().split('T')[0],
            received_by: user.uid
          };
          
          console.log('Parsed item data:', itemData);
          importData.push(itemData);
        } catch (error) {
          console.log(`Skipping row ${i + 1} due to parsing error:`, error);
          continue; // Skip problematic rows instead of failing
        }
      }

      if (importData.length === 0) {
        toast.error('No valid data found in the file');
        return;
      }

      // Batch import to MySQL via API
      const batch = [];
      for (const item of importData) {
        batch.push(pharmacyApi.addInventoryItem(item));
      }

      await Promise.all(batch);

      toast.success(`Successfully imported ${importData.length} inventory items`);
      setShowImportModal(false);
      setImportFile(null);
      fetchData();
    } catch (error) {
      console.error('Error importing inventory:', error);
      
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('File reading failed') || error.message.includes('aborted')) {
          toast.error(error.message);
        } else if (error.message.includes('Invalid data') || error.message.includes('Invalid date')) {
          toast.error(error.message);
        } else {
          toast.error('Failed to import inventory. Please check your file format and try again.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try selecting the file again.');
      }
    } finally {
      setImporting(false);
    }
  };

  // Stock Take Functions
  const downloadStockTakeTemplate = () => {
    const csvContent = [
      ['Drug Name', 'Unit of Measure', 'Current Stock', 'Expiry Date', 'Batch Number', 'Reorder Level', 'New Stock Count', 'Notes'],
      ...inventory.map(item => [
        item.drugName,
        item.unitOfMeasure,
        item.current_stock.toString(),
        item.expiry_date,
        item.batch_number || '',
        item.reorderLevel.toString(),
        '', // Empty column for new stock count
        '' // Empty column for notes
      ])
    ];

    const csvString = csvContent.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Take_${user?.clinic?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Stock take template downloaded successfully');
  };

  const handleStockTakeUpload = async (file: File) => {
    if (!user?.clinic) return;
    
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('File appears to be empty or invalid');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const expectedHeaders = ['Drug Name', 'Unit of Measure', 'Current Stock', 'Expiry Date', 'Batch Number', 'Reorder Level', 'New Stock Count', 'Notes'];
      
      // Check if headers match
      const hasRequiredHeaders = expectedHeaders.slice(0, 7).every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );
      
      if (!hasRequiredHeaders) {
        throw new Error('Invalid file format. Please use the downloaded stock take template.');
      }

      let updatedCount = 0;
      const updates = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length < 7) continue;
        
        const drugName = values[0];
        const newStockCount = values[6];
        
        if (!drugName || !newStockCount || newStockCount === '') continue;
        
        const newStock = parseInt(newStockCount);
        if (isNaN(newStock) || newStock < 0) continue;
        
        // Find the drug in inventory
        const drugItem = inventory.find(item => 
          item.drugName.toLowerCase() === drugName.toLowerCase()
        );
        
        if (drugItem && drugItem.current_stock !== newStock) {
          updates.push({
            id: drugItem.id,
            drugName: drugItem.drug_name,
            oldStock: drugItem.current_stock,
            newStock: newStock
          });
        }
      }

      if (updates.length === 0) {
        toast.info('No stock changes detected in the uploaded file');
        return;
      }

      // Update inventory items
      for (const update of updates) {
        await pharmacyApi.updateInventoryItem(update.id, {
          current_stock: update.newStock
        });
      }

      updatedCount = updates.length;

      toast.success(`Stock take completed! Updated ${updatedCount} items.`);
      fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Error processing stock take:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process stock take file');
    } finally {
      setImporting(false);
    }
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPatient || !selectedDrug) return;
    
    const quantity = parseInt(dispenseForm.quantity);
    if (quantity > selectedDrug.currentStock) {
      toast.error('Insufficient stock');
      return;
    }

    setSaving(true);
    
    try {
      // Create dispensing record
      const newDispensing: Omit<Dispensing, 'id'> = {
        drugId: selectedDrug.id,
        drugName: selectedDrug.drugName,
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        visitId: '', // Optional
        quantity,
        prescribedBy: dispenseForm.prescribedBy,
        dispensedBy: user.displayName,
        clinic: user.clinic,
        date: new Date().toISOString()
      };

      // TODO: Add dispensing record via MySQL API
      // await pharmacyApi.addDispensingRecord(newDispensing);

      // Update stock
      await pharmacyApi.updateInventoryItem(selectedDrug.id, {
        current_stock: selectedDrug.current_stock - quantity
      });

      // Mark corresponding prescription as dispensed
      const matchingPrescription = prescriptions.find(p => 
        p.medicationName.toLowerCase() === selectedDrug.drugName.toLowerCase() &&
        p.patientName === selectedPatient.fullName &&
        p.status === 'active'
      );

      if (matchingPrescription) {
        await pharmacyApi.updatePrescriptionStatus(matchingPrescription.id, 'completed');
      }

      toast.success('Medication dispensed successfully');
      setShowDispense(false);
      setSelectedPatient(null);
      setSelectedDrug(null);
      setDispenseForm({ quantity: '', prescribedBy: '' });
      setPatientSearch('');
      fetchData();
    } catch (error) {
      console.error('Error dispensing:', error);
      toast.error('Failed to dispense medication');
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for inventory categorization
  const isExpired = (item: DrugInventory): boolean => {
    return new Date(item.expiry_date) < new Date();
  };

  const isNearExpiry = (item: DrugInventory): boolean => {
    const expiryDate = new Date(item.expiry_date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow && expiryDate > new Date();
  };

  // Filter inventory based on selected filter
  const getFilteredInventory = () => {
    const searchFiltered = inventory.filter(item =>
      (item.drugName?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
    );

    switch (inventoryFilter) {
      case 'in-stock':
        return searchFiltered.filter(item => 
          item.current_stock > item.reorderLevel && !isExpired(item) && !isNearExpiry(item)
        );
      case 'low-stock':
        return searchFiltered.filter(item => 
          item.current_stock <= item.reorderLevel && item.current_stock > 0
        );
      case 'out-of-stock':
        return searchFiltered.filter(item => item.current_stock === 0);
      case 'expired':
        return searchFiltered.filter(item => isExpired(item));
      case 'near-expiry':
        return searchFiltered.filter(item => isNearExpiry(item) && !isExpired(item));
      default:
        return searchFiltered;
    }
  };

  const filteredInventory = getFilteredInventory();

  // Use state variables instead of redeclaring
  const currentLowStockItems = inventory.filter(item => item.current_stock <= item.reorderLevel);
  const currentExpiringItems = inventory.filter(item => {
    const expiryDate = new Date(item.expiry_date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  });


  const filteredPatients = patients.filter(p =>
    (p.fullName?.toLowerCase() || '').includes((patientSearch || '').toLowerCase()) ||
    (p.patientId?.toLowerCase() || '').includes((patientSearch || '').toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pharmacy Management</h1>
            <p className="text-muted-foreground mt-1">
              Complete medication inventory and dispensing system â€¢ {user?.clinic}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">
                Active medications in stock
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{currentLowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Items below reorder level
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{currentExpiringItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Items expiring within 3 months
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Dispensing</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dispensingHistory.filter(d => (d.dispensedAt || d.date || '').toString().startsWith(new Date().toISOString().split('T')[0])).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Medications dispensed today
              </p>
            </CardContent>
          </Card>
        </div>


        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Prescriptions ({prescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="dispensing" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Dispensing Report
            </TabsTrigger>
            <TabsTrigger value="inventory-report" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Inventory Report
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alerts ({currentLowStockItems.length + currentExpiringItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Drug Inventory</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowImportModal(true)} variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                    <Button onClick={handleExportInventory} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button onClick={() => setShowDispenseModal(true)} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Dispense Medicine
                    </Button>
                    <Button onClick={() => setShowReturnModal(true)} size="sm" variant="outline">
                      <Package className="w-4 h-4 mr-2" />
                      Accept Return
                    </Button>
                    <Button onClick={() => setShowAddStock(true)} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Stock
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search drugs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="w-64">
                    <Select
                      value={inventoryFilter}
                      onValueChange={(value) => setInventoryFilter(value as typeof inventoryFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter inventory..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Items ({inventory.length})
                        </SelectItem>
                        <SelectItem value="in-stock">
                          In Stock ({inventory.filter(item => 
                            item.current_stock > item.reorderLevel && !isExpired(item) && !isNearExpiry(item)
                          ).length})
                        </SelectItem>
                        <SelectItem value="low-stock">
                          Low Stock ({inventory.filter(item => 
                            item.current_stock <= item.reorderLevel && item.current_stock > 0
                          ).length})
                        </SelectItem>
                        <SelectItem value="out-of-stock">
                          Out of Stock ({inventory.filter(item => item.current_stock === 0).length})
                        </SelectItem>
                        <SelectItem value="expired">
                          Expired ({inventory.filter(item => isExpired(item)).length})
                        </SelectItem>
                        <SelectItem value="near-expiry">
                          Near Expiry ({inventory.filter(item => isNearExpiry(item) && !isExpired(item)).length})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="max-h-[480px] overflow-y-auto">
                  <table className="data-table">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr>
                        <th>Drug Name</th>
                        <th>Current Stock</th>
                        <th>Unit</th>
                        <th>Unit Cost</th>
                        <th>Selling Price</th>
                        <th>Reorder Level</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item) => {
                      const isLow = item.current_stock <= item.reorderLevel;
                      const isExpiring = new Date(item.expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                      
                      const isEditing = editingItems[item.id];
                      const isUpdating = updatingItems.has(item.id);
                      
                      return (
                        <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${
                          isLow ? 'bg-warning/5' : 
                          isExpiring ? 'bg-destructive/5' : ''
                        }`}>
                          <td className="font-medium">{item.drugName}</td>
                          <td className={`font-semibold ${
                            isLow ? 'text-warning' : 'text-foreground'
                          }`}>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editingItems[item.id].currentStock}
                                onChange={(e) => setEditingItems(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    currentStock: e.target.value
                                  }
                                }))}
                                className="h-8 w-20"
                                min="0"
                              />
                            ) : (
                              item.current_stock
                            )}
                          </td>
                          <td>{item.unitOfMeasure}</td>
                          <td className="text-green-600 font-medium">
                            ${(parseFloat(item.unit_cost) || 0).toFixed(2)}
                          </td>
                          <td className="text-blue-600 font-medium">
                            ${(parseFloat(item.selling_price) || 0).toFixed(2)}
                          </td>
                          <td>{item.reorderLevel}</td>
                          <td className={isExpiring ? 'text-destructive font-medium' : ''}>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editingItems[item.id].expiryDate}
                                onChange={(e) => setEditingItems(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    expiryDate: e.target.value
                                  }
                                }))}
                                className="h-8 w-36"
                              />
                            ) : (
                              new Date(item.expiry_date).toLocaleDateString()
                            )}
                          </td>
                          <td>
                            {isLow ? (
                              <Badge variant="destructive" className="bg-warning text-warning-foreground">
                                Low Stock
                              </Badge>
                            ) : isExpiring ? (
                              <Badge variant="destructive">
                                Expiring
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                In Stock
                              </Badge>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateItem(item)}
                                    disabled={isUpdating}
                                    className="h-8 px-2 bg-green-600 hover:bg-green-700"
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingItems(prev => {
                                        const newItems = { ...prev };
                                        delete newItems[item.id];
                                        return newItems;
                                      });
                                    }}
                                    className="h-8 px-2"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleEditItem(item)}
                                  className="h-8 px-2"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="prescriptions">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {prescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active prescriptions</p>
                  <p className="text-sm text-muted-foreground mt-2">Prescriptions will appear here when doctors create them</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Prescribed By</th>
                        <th>Date</th>
                        <th>Medications</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Group prescriptions by visit_id or by patient+date if no visit_id
                        const groupedPrescriptions = prescriptions.reduce((groups: any, prescription: any) => {
                          const key = prescription.visit_id || `${prescription.patient_name}-${prescription.prescribed_at.split('T')[0]}`;
                          if (!groups[key]) {
                            groups[key] = [];
                          }
                          groups[key].push(prescription);
                          return groups;
                        }, {});

                        return Object.entries(groupedPrescriptions).map(([key, prescriptionGroup]: [string, any]) => {
                          const firstPrescription = prescriptionGroup[0];
                          return (
                            <tr 
                              key={key}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedPrescriptionGroup(prescriptionGroup);
                                setShowPrescriptionDetails(true);
                              }}
                            >
                              <td className="font-medium">{firstPrescription.patient_name}</td>
                              <td>{firstPrescription.prescribed_by}</td>
                              <td className="text-muted-foreground">
                                {new Date(firstPrescription.prescribed_at).toLocaleDateString()}
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {prescriptionGroup.length} medication{prescriptionGroup.length !== 1 ? 's' : ''}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {prescriptionGroup.slice(0, 2).map((p: any) => p.medication_name).join(', ')}
                                    {prescriptionGroup.length > 2 && ` +${prescriptionGroup.length - 2} more`}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPrescriptionGroup(prescriptionGroup);
                                    setShowPrescriptionDetails(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="space-y-6">
              {currentLowStockItems.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold text-warning mb-4">Low Stock Items</h3>
                  <div className="space-y-2">
                    {currentLowStockItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{item.drugName}</span>
                        <span className="text-warning">{item.current_stock} / {item.reorderLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentExpiringItems.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold text-destructive mb-4">Expiring Soon</h3>
                  <div className="space-y-2">
                    {currentExpiringItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{item.drugName}</span>
                        <span className="text-destructive">
                          Expires: {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dispensing">
            <div className="space-y-6">
              {/* Dispensing Report Header */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Dispensing Report</h3>
                    <p className="text-muted-foreground">Track all medication dispensing activities and history</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportDispensingReportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportDispensingReportPDF}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Date Range Selection for Dispensing Report */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <Label className="font-medium">Report Period:</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dispensing-start-date" className="text-sm">From:</Label>
                    <Input
                      id="dispensing-start-date"
                      type="date"
                      className="w-40"
                      value={dispensingStartDate}
                      onChange={(e) => setDispensingStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dispensing-end-date" className="text-sm">To:</Label>
                    <Input
                      id="dispensing-end-date"
                      type="date"
                      className="w-40"
                      value={dispensingEndDate}
                      onChange={(e) => setDispensingEndDate(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleGenerateDispensingReport} disabled={generatingDispensingReport}>
                    {generatingDispensingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Dispensing Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Filtered Records</CardTitle>
                    <Activity className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {filteredDispensingReportData.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Records in selected period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredDispensingReportData.reduce((sum, record) => sum + record.quantity, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Units dispensed in period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Patients</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {new Set(filteredDispensingReportData.map(record => record.patientName)).size}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Patients served in period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Dispensing History Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Dispensing History</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search dispensing records..."
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="data-table">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr>
                          <th>Date & Time</th>
                          <th>Patient</th>
                          <th>Medication</th>
                          <th>Quantity</th>
                          <th>Prescribed By</th>
                          <th>Dispensed By</th>
                          <th>Visit ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDispensingReportData.length > 0 ? (
                          filteredDispensingReportData.map((record) => (
                            <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                              <td className="font-medium">
                                {new Date(record.dispensedAt || record.date).toLocaleString()}
                              </td>
                              <td>
                                <div>
                                  <p className="font-medium">{record.patient_name || record.patientName}</p>
                                  <p className="text-sm text-muted-foreground">ID: {record.patient_id || record.patientId || 'N/A'}</p>
                                </div>
                              </td>
                              <td className="font-medium text-primary">{record.drug_name || record.drugName}</td>
                              <td className="text-center">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {record.quantity}
                                </Badge>
                              </td>
                              <td className="text-muted-foreground">{record.prescribed_by || record.prescribedBy || 'N/A'}</td>
                              <td className="text-muted-foreground">{record.dispensed_by || record.dispensedBy}</td>
                              <td className="text-xs text-muted-foreground font-mono">
                                {record.visit_id || record.visitId || 'N/A'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Activity className="w-8 h-8 opacity-50" />
                                <p>No dispensing records found for the selected date range</p>
                                <p className="text-sm">Try adjusting your date range or generate a new report</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent Activity Summary */}
              {dispensingHistory.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Most Dispensed Medications */}
                    <div>
                      <h4 className="font-medium mb-3 text-muted-foreground">Most Dispensed Medications</h4>
                      <div className="space-y-2">
                        {(() => {
                          const drugCounts = dispensingHistory.reduce((acc, record) => {
                            const drugName = record.drug_name || record.drugName;
                            acc[drugName] = (acc[drugName] || 0) + record.quantity;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          return Object.entries(drugCounts)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([drugName, count]) => (
                              <div key={drugName} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                <span className="font-medium">{drugName}</span>
                                <Badge variant="secondary">{count} units</Badge>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>

                    {/* Top Prescribers */}
                    <div>
                      <h4 className="font-medium mb-3 text-muted-foreground">Top Prescribers</h4>
                      <div className="space-y-2">
                        {(() => {
                          const prescriberCounts = dispensingHistory.reduce((acc, record) => {
                            const prescriber = record.prescribed_by || record.prescribedBy || 'Unknown';
                            acc[prescriber] = (acc[prescriber] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          return Object.entries(prescriberCounts)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([prescriber, count]) => (
                              <div key={prescriber} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                <span className="font-medium">{prescriber}</span>
                                <Badge variant="secondary">{count} prescriptions</Badge>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inventory-report">
            <div className="space-y-6">
              {/* Inventory Report Header */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Inventory Report</h3>
                    <p className="text-muted-foreground">Track opening stock, closing stock, and inventory movements over time</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportInventoryReport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportInventoryReportPDF}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <Label className="font-medium">Report Period:</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="start-date" className="text-sm">From:</Label>
                    <Input
                      id="start-date"
                      type="date"
                      className="w-40"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="end-date" className="text-sm">To:</Label>
                    <Input
                      id="end-date"
                      type="date"
                      className="w-40"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleGenerateReport} disabled={generatingReport}>
                    {generatingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{filteredInventoryData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Filtered inventory items
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Stock Received</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {filteredInventoryData.reduce((sum, item) => sum + item.quantity_received, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Units received in period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Dispensed</CardTitle>
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {filteredDispensingData.reduce((sum, record) => sum + record.quantity, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Units dispensed in period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Stock Value</CardTitle>
                    <Database className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      ${filteredInventoryData.reduce((sum, item) => sum + (item.current_stock * 10), 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estimated inventory value
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Inventory Report Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Stock Movement Report</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search medications..."
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="data-table">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr>
                          <th>Drug Name</th>
                          <th>Opening Stock</th>
                          <th>Stock Received</th>
                          <th>Stock Dispensed</th>
                          <th>Closing Stock</th>
                          <th>Stock Movement</th>
                          <th>Reorder Status</th>
                          <th>Expiry Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventoryData.length > 0 ? (
                          filteredInventoryData.map((item) => {
                            // Calculate stock movements using filtered dispensing data
                            const stockDispensed = filteredDispensingData
                              .filter(record => record.drugName === item.drugName)
                              .reduce((sum, record) => sum + record.quantity, 0);
                          
                          const openingStock = item.current_stock + stockDispensed;
                          const stockMovement = item.quantity_received - stockDispensed;
                          const isLowStock = item.current_stock <= item.reorderLevel;
                          const isExpiring = new Date(item.expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                          
                          return (
                            <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                              <td className="font-medium">{item.drugName}</td>
                              <td className="text-center font-medium">{openingStock}</td>
                              <td className="text-center text-green-600 font-medium">+{item.quantity_received}</td>
                              <td className="text-center text-orange-600 font-medium">-{stockDispensed}</td>
                              <td className="text-center font-bold text-primary">{item.current_stock}</td>
                              <td className="text-center">
                                <span className={`font-medium ${stockMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {stockMovement >= 0 ? '+' : ''}{stockMovement}
                                </span>
                              </td>
                              <td className="text-center">
                                {isLowStock ? (
                                  <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                                    Low Stock
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    Adequate
                                  </Badge>
                                )}
                              </td>
                              <td className="text-center">
                                {isExpiring ? (
                                  <Badge variant="destructive">
                                    Expiring Soon
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    Good
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })
                        ) : (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Package className="w-8 h-8 opacity-50" />
                                <p>No inventory items found for the selected date range</p>
                                <p className="text-sm">Try adjusting your date range or generate a new report</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Stock Movement Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Moving Items */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Moving Items</h3>
                  <div className="space-y-3">
                    {inventory
                      .map(item => ({
                        ...item,
                        dispensed: dispensingHistory
                          .filter(record => record.drugName === item.drugName)
                          .reduce((sum, record) => sum + record.quantity, 0)
                      }))
                      .sort((a, b) => b.dispensed - a.dispensed)
                      .slice(0, 5)
                      .map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium">{item.drugName}</p>
                            <p className="text-sm text-muted-foreground">{item.unitOfMeasure}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">{item.dispensed} dispensed</p>
                            <p className="text-sm text-muted-foreground">{item.current_stock} remaining</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Stock Alerts Summary */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Stock Alerts Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Low Stock Items</span>
                      </div>
                      <Badge variant="destructive">{currentLowStockItems.length}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Expiring Soon</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700">{currentExpiringItems.length}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Out of Stock</span>
                      </div>
                      <Badge variant="destructive">{inventory.filter(item => item.current_stock === 0).length}</Badge>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {currentLowStockItems.length > 0 && (
                          <li>â€¢ Reorder {currentLowStockItems.length} low stock items</li>
                        )}
                        {currentExpiringItems.length > 0 && (
                          <li>â€¢ Review {currentExpiringItems.length} expiring items</li>
                        )}
                        {inventory.filter(item => item.current_stock === 0).length > 0 && (
                          <li>â€¢ Urgent: Restock {inventory.filter(item => item.current_stock === 0).length} out-of-stock items</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Import Modal */}
        <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import Inventory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Upload a CSV file with inventory data. Download the template below to ensure correct format.
              </div>
              
              {/* Download Template Button */}
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const csvTemplate = [
                      'Drug Name,Unit of Measure,Quantity Received,Expiry Date,Reorder Level,Unit Cost,Selling Price',
                      'Paracetamol 500mg,Tablets,100,2025-12-31,20,2.50,5.00',
                      'Amoxicillin 250mg,Capsules,50,2025-06-30,10,3.75,7.50',
                      'Ibuprofen 400mg,Tablets,75,2025-09-15,15,1.25,3.00'
                    ].join('\n');
                    
                    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', 'inventory_import_template.csv');
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="import-file">Select CSV File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => importFile && handleImportInventory()}
                  disabled={!importFile || importing}
                >
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Import
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Take Upload Modal */}
        <Dialog open={showStockTakeModal} onOpenChange={setShowStockTakeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Stock Take</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Upload the completed stock take CSV file. Make sure you've filled in the "New Stock Count" column with actual counted quantities.
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-take-file">Select Completed Stock Take CSV</Label>
                <Input
                  id="stock-take-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setStockTakeFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowStockTakeModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => stockTakeFile && handleStockTakeUpload(stockTakeFile)}
                  disabled={!stockTakeFile || importing}
                >
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Update Stock
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Prescription Details Modal */}
        <Dialog open={showPrescriptionDetails} onOpenChange={setShowPrescriptionDetails}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                Prescription Details - {selectedPrescriptionGroup.length > 0 ? selectedPrescriptionGroup[0].patient_name : ''}
              </DialogTitle>
            </DialogHeader>
            
            {selectedPrescriptionGroup.length > 0 && (
              <div className="space-y-6">
                {/* Patient Information */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedPrescriptionGroup[0].patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Prescribed by Dr. {selectedPrescriptionGroup[0].prescribed_by} on {new Date(selectedPrescriptionGroup[0].prescribed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Medications to Dispense</h3>
                  <Button
                    onClick={async () => {
                      // Dispense all active medications at once
                      const activemedications = selectedPrescriptionGroup.filter((p: any) => p.status !== 'dispensed');
                      
                      if (activemedications.length === 0) {
                        toast.info('All medications have already been dispensed');
                        return;
                      }

                      let successCount = 0;
                      let errorCount = 0;

                      for (const prescription of activemedications) {
                        try {
                          // Find the medication in inventory
                          const medication = inventory.find(item => 
                            item.drugName.toLowerCase() === prescription.medication_name.toLowerCase()
                          );

                          if (!medication) {
                            toast.error(`${prescription.medication_name} not found in inventory`);
                            errorCount++;
                            continue;
                          }

                          const quantity = parseInt(prescription.quantity);
                          if (quantity > medication.current_stock) {
                            toast.error(`Insufficient stock for ${prescription.medication_name}. Available: ${medication.current_stock}`);
                            errorCount++;
                            continue;
                          }

                          // Create dispensing record
                          const dispensingRecord = {
                            drug_id: medication.id,
                            drug_name: medication.drug_name,
                            patient_id: prescription.patient_id || null,
                            patient_name: prescription.patient_name,
                            visit_id: prescription.visit_id || null,
                            quantity: quantity,
                            unit_of_measure: medication.unit_of_measure,
                            prescribed_by: prescription.prescribed_by || 'Unknown',
                            dispensed_by: user?.displayName || '',
                            clinic_id: parseInt(user!.clinic),
                            dispensed_at: new Date().toISOString()
                          };

                          // Add dispensing record to database
                          await pharmacyApi.addDispensingRecord(dispensingRecord);

                          // Update inventory stock
                          await pharmacyApi.updateInventoryItem(medication.id, {
                            current_stock: medication.current_stock - quantity
                          });

                          // Update prescription status to dispensed
                          await pharmacyApi.updatePrescriptionStatus(prescription.id, 'completed');

                          successCount++;
                        } catch (error) {
                          console.error(`Error dispensing ${prescription.medication_name}:`, error);
                          errorCount++;
                        }
                      }

                      if (successCount > 0) {
                        toast.success(`Successfully dispensed ${successCount} medication${successCount !== 1 ? 's' : ''}`);
                      }
                      if (errorCount > 0) {
                        toast.error(`Failed to dispense ${errorCount} medication${errorCount !== 1 ? 's' : ''}`);
                      }

                      // Refresh data and close modal
                      fetchData();
                      setShowPrescriptionDetails(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={selectedPrescriptionGroup.filter((p: any) => p.status !== 'dispensed').length === 0}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Dispense All ({selectedPrescriptionGroup.filter((p: any) => p.status !== 'dispensed').length})
                  </Button>
                </div>

                {/* Medications Table */}
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescriptionGroup.map((prescription: any) => (
                          <tr key={prescription.id}>
                            <td className="font-medium text-primary">{prescription.medication_name}</td>
                            <td>
                              <Badge variant="outline" className="text-xs">
                                {prescription.take_instructions}
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
                            <td>
                              {prescription.status !== 'dispensed' && (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      // Find the medication in inventory
                                      const medication = inventory.find(item => 
                                        item.drugName.toLowerCase() === prescription.medication_name.toLowerCase()
                                      );

                                      if (!medication) {
                                        toast.error(`${prescription.medication_name} not found in inventory`);
                                        return;
                                      }

                                      const quantity = parseInt(prescription.quantity);
                                      if (quantity > medication.current_stock) {
                                        toast.error(`Insufficient stock for ${prescription.medication_name}. Available: ${medication.current_stock}`);
                                        return;
                                      }

                                      // Create dispensing record
                                      const dispensingRecord = {
                                        drug_id: medication.id,
                                        drug_name: medication.drug_name,
                                        patient_id: prescription.patient_id || null,
                                        patient_name: prescription.patient_name,
                                        visit_id: prescription.visit_id || null,
                                        quantity: quantity,
                                        unit_of_measure: medication.unit_of_measure,
                                        prescribed_by: prescription.prescribed_by || 'Unknown',
                                        dispensed_by: user?.displayName || '',
                                        clinic_id: parseInt(user!.clinic),
                                        dispensed_at: new Date().toISOString()
                                      };

                                      // Add dispensing record to database
                                      await pharmacyApi.addDispensingRecord(dispensingRecord);

                                      // Update inventory stock
                                      await pharmacyApi.updateInventoryItem(medication.id, {
                                        current_stock: medication.current_stock - quantity
                                      });

                                      // Update prescription status to completed
                                      await pharmacyApi.updatePrescriptionStatus(prescription.id, 'completed');

                                      toast.success(`Successfully dispensed ${prescription.medication_name}`);
                                      
                                      // Refresh data to show updated inventory and prescription status
                                      fetchData();
                                      
                                    } catch (error) {
                                      console.error(`Error dispensing ${prescription.medication_name}:`, error);
                                      toast.error(`Failed to dispense ${prescription.medication_name}`);
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Dispense
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowPrescriptionDetails(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Alert Modal */}
        <Dialog open={showStockAlertModal} onOpenChange={setShowStockAlertModal}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Stock Alert Report
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Alert Summary */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-medium">Immediate Attention Required</h4>
                    <p className="text-sm text-muted-foreground">
                      {lowStockItems.length + expiringItems.length} items need your attention
                    </p>
                  </div>
                </div>
              </div>

              {/* Low Stock Items */}
              {lowStockItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <h4 className="font-semibold text-red-700">Low Stock Items ({lowStockItems.length})</h4>
                  </div>
                  <div className="bg-card rounded-xl border border-red-200 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium text-red-800">Medication</th>
                            <th className="text-left p-3 text-sm font-medium text-red-800">Current Stock</th>
                            <th className="text-left p-3 text-sm font-medium text-red-800">Reorder Level</th>
                            <th className="text-left p-3 text-sm font-medium text-red-800">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStockItems.map(item => (
                            <tr key={item.id} className="border-b border-red-100">
                              <td className="p-3 text-sm font-medium">{item.drugName}</td>
                              <td className="p-3 text-sm text-red-600 font-medium">{item.current_stock}</td>
                              <td className="p-3 text-sm">{item.reorderLevel}</td>
                              <td className="p-3">
                                {item.current_stock === 0 ? (
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                                    OUT OF STOCK
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                                    LOW STOCK
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiring Items */}
              {expiringItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <h4 className="font-semibold text-orange-700">Items Expiring Soon ({expiringItems.length})</h4>
                  </div>
                  <div className="bg-card rounded-xl border border-orange-200 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-orange-50">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium text-orange-800">Medication</th>
                            <th className="text-left p-3 text-sm font-medium text-orange-800">Stock</th>
                            <th className="text-left p-3 text-sm font-medium text-orange-800">Expiry Date</th>
                            <th className="text-left p-3 text-sm font-medium text-orange-800">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expiringItems
                            .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                            .map(item => {
                              const isExp = isExpired(item);
                              return (
                                <tr key={item.id} className="border-b border-orange-100">
                                  <td className="p-3 text-sm font-medium">{item.drugName}</td>
                                  <td className="p-3 text-sm">{item.current_stock}</td>
                                  <td className="p-3 text-sm font-medium">
                                    {new Date(item.expiry_date).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                    {isExp ? (
                                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                                        EXPIRED
                                      </span>
                                    ) : (
                                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                                        EXPIRES SOON
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Recommended Actions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {lowStockItems.length > 0 && (
                    <li>â€¢ Contact suppliers to reorder {lowStockItems.length} low stock items</li>
                  )}
                  {expiringItems.filter(item => isExpired(item)).length > 0 && (
                    <li>â€¢ Remove {expiringItems.filter(item => isExpired(item)).length} expired items from inventory</li>
                  )}
                  {expiringItems.filter(item => !isExpired(item)).length > 0 && (
                    <li>â€¢ Prioritize dispensing {expiringItems.filter(item => !isExpired(item)).length} items expiring soon</li>
                  )}
                  <li>â€¢ Review inventory levels and adjust reorder points if needed</li>
                </ul>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setInventoryFilter('low-stock');
                    setShowStockAlertModal(false);
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Package className="w-4 h-4 mr-2" />
                  View Low Stock
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setInventoryFilter('near-expiry');
                      setShowStockAlertModal(false);
                    }}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Expiring
                  </Button>
                  <Button onClick={() => setShowStockAlertModal(false)}>
                    <Check className="w-4 h-4 mr-2" />
                    Acknowledge
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Walk-in Patient Dispense Modal */}
        <Dialog open={showDispenseModal} onOpenChange={setShowDispenseModal}>
          <DialogContent className="max-w-6xl h-[90vh] w-[95vw] flex flex-col">
            <DialogHeader className="pb-3 border-b border-border bg-gradient-to-r from-blue-50 to-green-50 -m-6 mb-0 p-4 rounded-t-lg">
              <DialogTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-md shadow-sm border">
                  <Pill className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Pharmacy Dispensing</h2>
                  <p className="text-xs text-gray-600">Patient & Medication Management</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-6 py-6">
              {/* Combined Patient & Item Selection Section */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium">Patient Selection</h3>
                    <p className="text-xs text-muted-foreground">Select patient type and enter details</p>
                  </div>
                </div>
                
                {/* Patient Type Toggle */}
                <div className="mb-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="patientType"
                        value="registered"
                        checked={!manualPatientName}
                        onChange={() => {
                          setManualPatientName('');
                          setSelectedPatient(null);
                          setDispensePatientSearch('');
                        }}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm font-medium">Registered Patient</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="patientType"
                        value="walking"
                        checked={!!manualPatientName}
                        onChange={() => {
                          setSelectedPatient(null);
                          setDispensePatientSearch('');
                        }}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm font-medium">Walking Patient</span>
                    </label>
                  </div>
                </div>

                {/* Patient Input Fields */}
                {!manualPatientName ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Search Registered Patient</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search by name or patient ID..."
                        value={dispensePatientSearch}
                        onChange={(e) => setDispensePatientSearch(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Walking Patient Name</label>
                    <Input
                      placeholder="Enter walking patient name"
                      value={manualPatientName}
                      onChange={(e) => setManualPatientName(e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">Payment Scheme: Cash</p>
                  </div>
                )}

                {/* Patient Search Results */}
                {dispensePatientSearch && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-foreground mb-2 block">Search Results</label>
                    <div className="max-h-40 overflow-y-auto border rounded-lg bg-background">
                      {patients
                        .filter(patient => 
                          (`${patient.first_name} ${patient.last_name}`.toLowerCase() || '').includes(dispensePatientSearch.toLowerCase()) ||
                          (patient.patient_id?.toLowerCase() || '').includes(dispensePatientSearch.toLowerCase())
                        )
                        .slice(0, 5)
                        .map(patient => (
                          <button
                            key={patient.id}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setDispensePatientSearch(`${patient.first_name} ${patient.last_name}` || '');
                              setManualPatientName('');
                            }}
                            className={`w-full text-left p-4 hover:bg-muted/50 border-b border-border/50 transition-colors ${
                              selectedPatient?.id === patient.id ? 'bg-primary/10 border-primary/20' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-base">{`${patient.first_name} ${patient.last_name}` || 'Unknown Name'}</p>
                                <p className="text-sm text-muted-foreground">Patient ID: {patient.patient_id || 'N/A'}</p>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {(() => {
                                  if (patient.date_of_birth) {
                                    const birthDate = new Date(patient.date_of_birth);
                                    const today = new Date();
                                    const age = today.getFullYear() - birthDate.getFullYear();
                                    const monthDiff = today.getMonth() - birthDate.getMonth();
                                    const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                                    return `${finalAge} years`;
                                  }
                                  return patient.age ? `${patient.age} years` : 'Age unknown';
                                })()} â€¢ {patient.gender || 'N/A'}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Patient Summary Card */}
                {selectedPatient && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{`${selectedPatient.firstName} ${selectedPatient.lastName}`}</h4>
                        <p className="text-sm text-muted-foreground">ID: {selectedPatient.patientId}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          if (selectedPatient.dateOfBirth) {
                            const birthDate = new Date(selectedPatient.dateOfBirth);
                            const today = new Date();
                            const age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                            return `${finalAge} years`;
                          }
                          return selectedPatient.age ? `${selectedPatient.age} years` : 'Age unknown';
                        })()} â€¢ {selectedPatient.gender || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Medication Selection */}
                {(selectedPatient || manualPatientName) && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-green-100 rounded-md">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium">Medication Selection</h3>
                        <p className="text-xs text-muted-foreground">Search and add medications to bill</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Medication Dropdown */}
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-foreground mb-2 block">Select Medication</label>
                        <div className="relative">
                          <button
                            onClick={() => setShowMedicationDropdown(!showMedicationDropdown)}
                            className="w-full flex items-center justify-between p-3 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors text-left text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span>Select medication to add...</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Quantity</label>
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          className="h-11"
                        />
                      </div>

                      {/* Add to Bill Button */}
                      <div className="flex items-end">
                        <Button className="w-full h-11">
                          Add to Bill
                        </Button>
                      </div>
                    </div>

                    {/* Selected Medication Details (Read-only display) */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Available Stock</label>
                        <div className="p-3 bg-muted/30 rounded-md text-sm">-</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Selling Price</label>
                        <div className="p-3 bg-muted/30 rounded-md text-sm">-</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bill Items Section */}
              {(selectedPatient || manualPatientName) && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-orange-100 rounded-md">
                      <ShoppingCart className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium">Bill Items</h3>
                      <p className="text-xs text-muted-foreground">Items added to the current bill</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 px-2 py-0.5 text-xs">
                      {selectedMedications.length} items
                    </Badge>
                  </div>

                  {/* Bill Items Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Item Name</th>
                          <th className="text-center p-3 text-sm font-medium">Quantity</th>
                          <th className="text-right p-3 text-sm font-medium">Unit Selling Price</th>
                          <th className="text-right p-3 text-sm font-medium">Amount</th>
                          <th className="text-center p-3 text-sm font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMedications.length > 0 ? (
                          selectedMedications.map((medication, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 text-sm">{medication.drug.drugName}</td>
                              <td className="p-3 text-sm text-center">{medication.quantity}</td>
                              <td className="p-3 text-sm text-right">â‚¦{(medication.drug.sellingPrice || 0).toFixed(2)}</td>
                              <td className="p-3 text-sm text-right font-medium">â‚¦{((medication.drug.sellingPrice || 0) * parseInt(medication.quantity)).toFixed(2)}</td>
                              <td className="p-3 text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedMedications(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                              No items added to bill yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Billing & Payment Summary Section */}
              {(selectedPatient || manualPatientName) && selectedMedications.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-purple-100 rounded-md">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium">Billing & Payment Summary</h3>
                      <p className="text-xs text-muted-foreground">Review totals and process payment</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Billing Summary */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Billing Summary</h4>
                      <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₦{selectedMedications.reduce((sum, med) => sum + ((med.drug.selling_price || 0) * parseInt(med.quantity)), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span>₦0.00</span>
                        </div>
                        <hr className="border-border" />
                        <div className="flex justify-between text-base font-medium">
                          <span>Total Amount to Pay:</span>
                          <span className="text-primary">₦{selectedMedications.reduce((sum, med) => sum + ((med.drug.selling_price || 0) * parseInt(med.quantity)), 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Inputs */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Payment Details</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Payment Mode</label>
                          <select className="w-full p-3 border border-border rounded-md bg-card text-sm">
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="transfer">Bank Transfer</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Amount Tendered</label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="h-11"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Change</label>
                          <div className="p-3 bg-muted/30 rounded-md text-sm">₦0.00</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border p-4 bg-card">
              <div className="flex justify-between items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDispenseModal(false);
                    setSelectedPatient(null);
                    setSelectedMedications([]);
                    setDispensePatientSearch('');
                    setManualPatientName('');
                    setSearchQuery('');
                  }}
                  className="h-9"
                >
                  Cancel
                </Button>
                
                {selectedMedications.length > 0 && (
                  <Button 
                    onClick={async () => {
                      setSaving(true);
                      try {
                        // TODO: Implement payment processing logic here
                        // This would validate payment details, process payment,
                        // save dispensing records, and update inventory
                        
                        toast.success('Payment processed and medications dispensed successfully!');
                        
                        // Reset form
                        setShowDispenseModal(false);
                        setSelectedPatient(null);
                        setSelectedMedications([]);
                        setDispensePatientSearch('');
                        setManualPatientName('');
                        setSearchQuery('');
                        
                        // Refresh data
                        fetchData();
                      } catch (error) {
                        console.error('Error processing payment:', error);
                        toast.error('Failed to process payment');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || selectedMedications.length === 0}
                    className="bg-green-600 hover:bg-green-700 h-9"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Finalize & Save Payment
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Stock Modal */}
        <Dialog open={showAddStock} onOpenChange={setShowAddStock}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Stock</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Drug Selection */}
              <div className="space-y-2">
                <Label htmlFor="drugSelect">Select Drug *</Label>
                <Select
                  value={stockForm.selectedDrug}
                  onValueChange={(value) => setStockForm(prev => ({ ...prev, selectedDrug: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a drug to add stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map(drug => (
                      <SelectItem key={drug.id} value={drug.id}>
                        {drug.drug_name} - Current Stock: {drug.current_stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 1: Drug Name & Unit of Measure */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drugName">Drug Name *</Label>
                  <Input
                    id="drugName"
                    value={stockForm.drugName}
                    onChange={(e) => setStockForm(prev => ({ ...prev, drugName: e.target.value }))}
                    placeholder="Enter drug name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                  <Select
                    value={stockForm.unitOfMeasure}
                    onValueChange={(value) => setStockForm(prev => ({ ...prev, unitOfMeasure: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Quantity Received & Reorder Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantityReceived">Quantity Received *</Label>
                  <Input
                    id="quantityReceived"
                    type="number"
                    value={stockForm.quantityReceived}
                    onChange={(e) => setStockForm(prev => ({ ...prev, quantityReceived: e.target.value }))}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level *</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    value={stockForm.reorderLevel}
                    onChange={(e) => setStockForm(prev => ({ ...prev, reorderLevel: e.target.value }))}
                    placeholder="Enter reorder level"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAddStock(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStock}
                  disabled={!stockForm.drugName || !stockForm.quantityReceived}
                >
                  Add Stock
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Medicine Return Modal */}
        <MedicineReturnModal
          showReturnModal={showReturnModal}
          setShowReturnModal={setShowReturnModal}
          selectedReturnMedicine={selectedReturnMedicine}
          setSelectedReturnMedicine={setSelectedReturnMedicine}
          returnQuantity={returnQuantity}
          setReturnQuantity={setReturnQuantity}
          returnReason={returnReason}
          setReturnReason={setReturnReason}
          processingReturn={processingReturn}
          patients={patients}
          handleReturnPatientSearch={handleReturnPatientSearch}
          handleMedicineReturn={handleMedicineReturn}
        />
      </div>
    </AppLayout>
  );
};

export default Pharmacy;
