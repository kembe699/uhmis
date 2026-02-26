import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import '@/styles/instant-performance.css';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { DrugInventory, Dispensing, Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Bell,
  Download,
  Upload,
  FileText,
  BarChart3,
  Pill,
  User,
  Calendar,
  DollarSign,
  Eye,
  Loader2,
  Printer,
  X,
  TrendingDown,
  XCircle,
  Filter,
  ChevronDown
} from 'lucide-react';

class PharmacyApiClient {
  private baseUrl = '/api/pharmacy';

  async getInventory(clinicId: string): Promise<DrugInventory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return await response.json();
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async addInventoryItem(item: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to add inventory item');
      return await response.json();
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(itemId: string, item: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to update inventory item');
      return await response.json();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  async deleteInventoryItem(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/inventory/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete inventory item');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
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

  async addDispensingRecord(dispensingData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/dispensing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dispensingData),
      });
      if (!response.ok) throw new Error('Failed to add dispensing record');
      return await response.json();
    } catch (error) {
      console.error('Error adding dispensing record:', error);
      throw error;
    }
  }

  async getPatients(clinicId: string): Promise<Patient[]> {
    try {
      const response = await fetch(`/api/patients/clinic/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async getPrescriptions(clinicId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions/${clinicId}`);
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  async cancelPrescription(prescriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!response.ok) throw new Error('Failed to cancel prescription');
    } catch (error) {
      console.error('Error cancelling prescription:', error);
      throw error;
    }
  }

  async findActivePatientBill(patientId: string, clinicId: string): Promise<any> {
    try {
      const response = await fetch(`/api/patient-bills/active/${patientId}/${clinicId}`);
      if (!response.ok) {
        if (response.status === 404) return null; // No active bill found
        throw new Error('Failed to find active patient bill');
      }
      return await response.json();
    } catch (error) {
      console.error('Error finding active patient bill:', error);
      return null;
    }
  }

  async createOrUpdatePatientBill(billData: any): Promise<any> {
    try {
      const response = await fetch('/api/patient-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });
      if (!response.ok) throw new Error('Failed to create/update patient bill');
      return await response.json();
    } catch (error) {
      console.error('Error creating/updating patient bill:', error);
      throw error;
    }
  }

  async addServicesToBill(billId: string, services: any[]): Promise<any> {
    try {
      const response = await fetch(`/api/patient-bills/${billId}/add-services`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ services }),
      });
      
      if (!response.ok) throw new Error('Failed to add services to bill');
      return await response.json();
    } catch (error) {
      console.error('Error adding services to bill:', error);
      throw error;
    }
  }

  async createPharmacyReceipt(receiptData: any): Promise<any> {
    try {
      const response = await fetch('/api/pharmacy/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
      });
      if (!response.ok) throw new Error('Failed to create pharmacy receipt');
      return await response.json();
    } catch (error) {
      console.error('Error creating pharmacy receipt:', error);
      throw error;
    }
  }

  async getPatientBills(clinicId: string, patientId?: string): Promise<any[]> {
    try {
      const url = patientId 
        ? `/api/patient-bills/clinic/${clinicId}?patientId=${patientId}`
        : `/api/patient-bills/clinic/${clinicId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch patient bills');
      return await response.json();
    } catch (error) {
      console.error('Error fetching patient bills:', error);
      throw error;
    }
  }
}

// Memoized Medicine Row Component for better performance
const MedicineRow = memo(({ 
  item, 
  onAdd, 
  isAdded 
}: { 
  item: DrugInventory; 
  onAdd: (item: DrugInventory) => void;
  isAdded: boolean;
}) => (
  <tr className="hover:bg-muted/20">
    <td className="p-2">
      <div className="font-medium">{item.drug_name}</div>
      {item.generic_name && (
        <div className="text-xs text-muted-foreground">Generic: {item.generic_name}</div>
      )}
    </td>
    <td className="p-2">{item.current_stock}</td>
    <td className="p-2">SSP {parseFloat(item.selling_price || '0').toFixed(2)}</td>
    <td className="p-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAdd(item)}
        disabled={isAdded}
        className="h-7 px-2 text-xs"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add
      </Button>
    </td>
  </tr>
));

MedicineRow.displayName = 'MedicineRow';

interface PharmacyProps {
  inventoryOnly?: boolean;
}

const Pharmacy: React.FC<PharmacyProps> = ({ inventoryOnly = false }) => {
  const { user } = useAuth();
  const pharmacyApi = new PharmacyApiClient();
  
  const isInventoryPage = inventoryOnly;
  
  const [inventory, setInventory] = useState<DrugInventory[]>([]);
  const [dispensingHistory, setDispensingHistory] = useState<Dispensing[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);
  const [dispensingDateRange, setDispensingDateRange] = useState({ from: '', to: '' });
  const [dispensingUserFilter, setDispensingUserFilter] = useState('all');
  const [uniqueDispensers, setUniqueDispensers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadInventory, setLoadInventory] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStock, setShowAddStock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<DrugInventory | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isWalkInClient, setIsWalkInClient] = useState(false);
  const [walkInClientName, setWalkInClientName] = useState('');
  const [dispensingItems, setDispensingItems] = useState<Array<{
    inventoryId: string;
    drugName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    availableStock: number;
  }>>([]);
  const [dispensing, setDispensing] = useState(false);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'expiring' | 'low-stock' | 'out-of-stock'>('all');
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [debouncedMedicineSearch, setDebouncedMedicineSearch] = useState('');
  const [newStock, setNewStock] = useState({
    drug_name: '',
    generic_name: '',
    current_stock: '',
    unit_of_measure: 'Tablets',
    reorder_level: '',
    expiry_date: '',
    batch_number: '',
    date_received: new Date().toISOString().split('T')[0],
    unit_cost: '',
    margin_percentage: '',
    selling_price: ''
  });

  // Instant search - no debounce for 0ms response
  useEffect(() => {
    setDebouncedPatientSearch(patientSearchQuery);
  }, [patientSearchQuery]);

  useEffect(() => {
    setDebouncedMedicineSearch(medicineSearchQuery);
  }, [medicineSearchQuery]);

  // Calculate selling price when unit cost or margin percentage changes
  const calculateSellingPrice = (cost: string, margin: string) => {
    const costValue = parseFloat(cost);
    const marginValue = parseFloat(margin);
    
    if (!isNaN(costValue) && !isNaN(marginValue) && costValue > 0 && marginValue >= 0) {
      const sellingPrice = costValue + (costValue * marginValue / 100);
      return sellingPrice.toFixed(2);
    }
    return '';
  };

  // Calculate margin percentage when selling price changes
  const calculateMarginPercentage = (cost: string, sellingPrice: string) => {
    const costValue = parseFloat(cost);
    const priceValue = parseFloat(sellingPrice);
    
    if (!isNaN(costValue) && !isNaN(priceValue) && costValue > 0 && priceValue >= costValue) {
      const margin = ((priceValue - costValue) / costValue) * 100;
      return margin.toFixed(1);
    }
    return '';
  };

  // Generate batch number when form opens
  const generateBatchNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BATCH-${year}${month}${day}-${random}`;
  };

  // Auto-generate batch number when modal opens (only for new items)
  useEffect(() => {
    if (showAddStock && !isEditMode && !newStock.batch_number) {
      setNewStock(prev => ({
        ...prev,
        batch_number: generateBatchNumber()
      }));
    }
  }, [showAddStock, isEditMode]);

  // Handle edit item
  const handleEditItem = (item: DrugInventory) => {
    setEditingItem(item);
    setIsEditMode(true);
    
    const unitCost = item.unit_cost?.toString() || '';
    const sellingPrice = item.selling_price?.toString() || '';
    const marginPercentage = unitCost && sellingPrice 
      ? calculateMarginPercentage(unitCost, sellingPrice)
      : '';
    
    setNewStock({
      drug_name: item.drug_name,
      generic_name: item.generic_name || '',
      current_stock: item.current_stock.toString(),
      unit_of_measure: item.unit_of_measure || 'Tablets',
      reorder_level: item.reorder_level.toString(),
      expiry_date: item.expiry_date || '',
      batch_number: item.batch_number || '',
      date_received: item.date_received || new Date().toISOString().split('T')[0],
      unit_cost: unitCost,
      margin_percentage: marginPercentage,
      selling_price: sellingPrice
    });
    setShowAddStock(true);
  };

  // Handle delete item
  const handleDeleteItem = async (item: DrugInventory) => {
    if (!confirm(`Are you sure you want to delete "${item.drug_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await pharmacyApi.deleteInventoryItem(item.id);
      // Remove item from local state without refetching
      setInventory(prevInventory => prevInventory.filter(inv => inv.id !== item.id));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Handle add new item
  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsEditMode(false);
    setNewStock({
      drug_name: '',
      generic_name: '',
      current_stock: '',
      unit_of_measure: 'Tablets',
      reorder_level: '',
      expiry_date: '',
      batch_number: '',
      date_received: new Date().toISOString().split('T')[0],
      unit_cost: '',
      margin_percentage: '',
      selling_price: ''
    });
    setShowAddStock(true);
  };

  // Parse date from month-year format (e.g., "juk-26" = July 2026)
  const parseMonthYearDate = (dateStr: string): string => {
    if (!dateStr || dateStr.trim() === '') {
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Parse month-year format (e.g., "juk-26", "jan-25")
    const monthMap: { [key: string]: string } = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'juk': '07', // juk is July
      'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };

    const parts = dateStr.toLowerCase().trim().split('-');
    if (parts.length === 2) {
      const monthAbbr = parts[0];
      const yearPart = parts[1];
      
      const month = monthMap[monthAbbr];
      if (month) {
        // Convert 2-digit year to 4-digit (26 -> 2026)
        const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
        // Use last day of the month for expiry dates
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        return `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
      }
    }

    // Fallback: return 1 year from now
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = [
      'drug_name',
      'generic_name',
      'current_stock',
      'unit_of_measure',
      'reorder_level',
      'expiry_date',
      'batch_number',
      'date_received',
      'unit_cost',
      'selling_price'
    ];
    
    const sampleData = [
      'Paracetamol 500mg',
      'Acetaminophen',
      '100',
      'Tablets',
      '20',
      'dec-25',
      'BATCH-260111-001',
      'jan-26',
      '10.00',
      '12.50'
    ];

    const csvContent = [
      headers.join(','),
      sampleData.join(','),
      // Add empty row for user to fill
      headers.map(() => '').join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pharmacy_inventory_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  // Handle CSV file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSVPreview(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  // Parse CSV for preview
  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => { // Preview all rows
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      setImportPreview(data);
    };
    reader.readAsText(file);
  };

  // Handle CSV import
  const handleImportCSV = async () => {
    if (!csvFile || !user?.clinic) return;

    try {
      setImporting(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const importData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Transform data to match API requirements
          return {
            drug_name: row.drug_name,
            generic_name: row.generic_name || '',
            unit_of_measure: row.unit_of_measure || 'Tablets',
            quantity_received: parseInt(row.current_stock) || 0,
            current_stock: parseInt(row.current_stock) || 0,
            expiry_date: parseMonthYearDate(row.expiry_date),
            batch_number: row.batch_number || generateBatchNumber(),
            reorder_level: parseInt(row.reorder_level) || 10,
            clinic_id: parseInt(user.clinic),
            date_received: parseMonthYearDate(row.date_received),
            received_by: user.uid || user.id || 'system',
            unit_cost: parseFloat(row.unit_cost) || 0,
            selling_price: parseFloat(row.selling_price) || 0
          };
        }).filter(item => item.drug_name); // Filter out empty rows

        // Import each item
        let successCount = 0;
        let errorCount = 0;
        
        for (const item of importData) {
          try {
            await pharmacyApi.addInventoryItem(item);
            successCount++;
          } catch (error) {
            console.error('Error importing item:', item.drug_name, error);
            errorCount++;
          }
        }

        toast.success(`Import completed: ${successCount} items added${errorCount > 0 ? `, ${errorCount} errors` : ''}`);
        setShowImportModal(false);
        setCsvFile(null);
        setImportPreview([]);
        fetchData();
      };
      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV file');
    } finally {
      setImporting(false);
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (filteredInventory.length === 0) {
      toast.error('No inventory data to export');
      return;
    }

    try {
      // Define CSV headers
      const headers = [
        'drug_name',
        'current_stock',
        'unit_of_measure',
        'reorder_level',
        'expiry_date',
        'batch_number',
        'date_received',
        'unit_cost',
        'selling_price',
        'status'
      ];

      // Convert inventory data to CSV format
      const csvData = filteredInventory.map(item => [
        item.drug_name,
        item.current_stock,
        item.unit_of_measure || 'Tablets',
        item.reorder_level,
        item.expiry_date || '',
        item.batch_number || '',
        item.date_received || '',
        item.unit_cost || '0.00',
        item.selling_price || '0.00',
        item.current_stock <= item.reorder_level ? 'Low Stock' : 
        (item.expiry_date && new Date(item.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) ? 'Expiring' : 'In Stock'
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => 
          // Escape fields that contain commas or quotes
          typeof field === 'string' && (field.includes(',') || field.includes('"')) 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = searchQuery 
        ? `pharmacy_inventory_filtered_${currentDate}.csv`
        : `pharmacy_inventory_${currentDate}.csv`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredInventory.length} items to CSV`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV file');
    }
  };

  // Filter patients based on search query (instant response)
  const filteredPatients = useMemo(() => {
    if (!debouncedPatientSearch) return patients.slice(0, 15); // Show first 15 when no search
    const searchLower = debouncedPatientSearch.toLowerCase();
    const filtered = patients.filter(patient => (
      patient.fullName?.toLowerCase().includes(searchLower) ||
      patient.patientId?.toLowerCase().includes(searchLower) ||
      patient.phoneNumber?.toLowerCase().includes(searchLower)
    ));
    return filtered.slice(0, 15); // Limit to 15 results for instant response
  }, [patients, debouncedPatientSearch]);

  // Handle patient selection from dropdown
  const handlePatientSelect = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchQuery(patient.fullName || '');
    setShowPatientDropdown(false);
  }, []);

  // Handle dispense medicine
  const handleDispenseMedicine = useCallback(() => {
    setShowDispenseModal(true);
    setSelectedPatient(null);
    setIsWalkInClient(false);
    setWalkInClientName('');
    setDispensingItems([]);
    setShowPaymentStep(false);
    setPaymentMethod('cash');
    setPaymentAmount('');
    setPaymentReceived(false);
    setPatientSearchQuery('');
    setShowPatientDropdown(false);
    setShowReceipt(false);
    setLastReceipt(null);
  }, []);

  // Handle cancel prescription
  const handleCancelPrescription = async (prescriptionGroup: any) => {
    if (!confirm(`Are you sure you want to cancel all prescriptions for ${prescriptionGroup.patient_name}?`)) {
      return;
    }

    try {
      // Cancel all active prescriptions in the group
      const activePrescriptions = prescriptionGroup.prescriptions.filter((p: any) => p.status !== 'dispensed');
      
      for (const prescription of activePrescriptions) {
        await pharmacyApi.cancelPrescription(prescription.id);
      }

      // Remove cancelled prescriptions from local state
      setPrescriptions(prevPrescriptions => 
        prevPrescriptions.filter(p => 
          !activePrescriptions.some((ap: any) => ap.id === p.id)
        )
      );

      toast.success('Prescriptions cancelled successfully');
    } catch (error) {
      console.error('Error cancelling prescriptions:', error);
      toast.error('Failed to cancel prescriptions');
    }
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    if (dispensingItems.length === 0) {
      toast.error('Please add items to dispense');
      return;
    }
    if (!isWalkInClient && !selectedPatient) {
      toast.error('Please select a patient or choose walk-in client');
      return;
    }
    if (isWalkInClient && !walkInClientName.trim()) {
      toast.error('Please enter walk-in client name');
      return;
    }

    const totalAmount = dispensingItems.reduce((sum, item) => sum + item.totalPrice, 0);
    setPaymentAmount(totalAmount.toFixed(2));
    setShowPaymentStep(true);
  };

  // Handle payment confirmation
  const handlePaymentConfirmation = () => {
    const totalAmount = dispensingItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const receivedAmount = parseFloat(paymentAmount);

    if (receivedAmount < totalAmount) {
      toast.error('Payment amount is insufficient');
      return;
    }

    setPaymentReceived(true);
    toast.success('Payment received successfully');
  };

  // Add item to dispensing list
  const addItemToDispensing = useCallback((item: DrugInventory) => {
    setDispensingItems(prevItems => {
      const existingItem = prevItems.find(di => di.inventoryId === item.id);
      if (existingItem) {
        toast.error('Item already added to dispensing list');
        return prevItems;
      }

      const unitPrice = parseFloat(item.selling_price?.toString() || '0');
      const newItem = {
        inventoryId: item.id,
        drugName: item.drug_name,
        quantity: 1,
        unitPrice: unitPrice,
        totalPrice: unitPrice,
        availableStock: item.current_stock
      };

      return [...prevItems, newItem];
    });
  }, []);

  // Update dispensing item quantity (instant response)
  const updateDispensingQuantity = useCallback((inventoryId: string, quantity: number) => {
    setDispensingItems(items => 
      items.map(item => 
        item.inventoryId === inventoryId 
          ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
          : item
      )
    );
  }, []);

  // Remove item from dispensing list (instant response)
  const removeDispensingItem = useCallback((inventoryId: string) => {
    setDispensingItems(items => items.filter(item => item.inventoryId !== inventoryId));
  }, []);

  // Handle dispensing submission
  const handleDispenseSubmit = async () => {
    if (!user?.clinic) return;
    if (dispensingItems.length === 0) {
      toast.error('Please add items to dispense');
      return;
    }
    if (!isWalkInClient && !selectedPatient) {
      toast.error('Please select a patient or choose walk-in client');
      return;
    }
    if (isWalkInClient && !walkInClientName.trim()) {
      toast.error('Please enter walk-in client name');
      return;
    }

    try {
      setDispensing(true);

      // Check stock availability
      for (const item of dispensingItems) {
        const inventoryItem = inventory.find(inv => inv.id === item.inventoryId);
        if (!inventoryItem || inventoryItem.current_stock < item.quantity) {
          toast.error(`Insufficient stock for ${item.drugName}`);
          return;
        }
      }

      // Calculate totals
      const totalAmount = dispensingItems.reduce((sum, item) => sum + item.totalPrice, 0);

      const patientId = isWalkInClient ? `WALK-IN-${Date.now()}` : selectedPatient?.patientId;
      const patientName = isWalkInClient ? walkInClientName.trim() : selectedPatient?.fullName;

      // Prepare pharmacy services
      const pharmacyServices = dispensingItems.map(item => ({
        serviceName: item.drugName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        serviceType: 'pharmacy'
      }));

      let bill;

      // Debug logging
      console.log('Dispensing for patient:', { patientId, patientName, clinicId: user.clinic });
      
      // Check for existing active bill for this patient
      const existingBill = await pharmacyApi.findActivePatientBill(patientId, user.clinic);
      console.log('Found existing bill:', existingBill);

      if (existingBill) {
        // Add services to existing bill
        console.log('Adding services to existing bill:', existingBill.id);
        console.log('Existing bill services count:', existingBill.services?.length || 0);
        bill = await pharmacyApi.addServicesToBill(existingBill.id, pharmacyServices);
        console.log('Updated bill after adding services:', bill);
        toast.success(`Services added to existing bill #${existingBill.bill_number}`);
      } else {
        // Create new bill with status 'active' instead of 'paid'
        console.log('Creating new bill for patient:', patientId);
        const billData = {
          patient_id: patientId,
          patient_name: patientName,
          clinic_id: parseInt(user.clinic),
          services: pharmacyServices,
          total_amount: totalAmount,
          paid_amount: totalAmount, // Require full payment before dispensing
          balance_amount: 0,
          status: 'pending', // Use pending status for new bills
          bill_date: new Date().toISOString(),
          created_by: user.displayName || user.uid || 'system'
        };

        bill = await pharmacyApi.createOrUpdatePatientBill(billData);
        toast.success(`New bill created #${bill.bill_number}`);
      }

      // Create visit and dispensing records for both registered patients and walk-in clients
      let actualPatientId = selectedPatient?.id;
      
      // For walk-in clients, create a temporary patient record
      if (isWalkInClient) {
        const walkInPatientData = {
          patient_id: `WALK-${Date.now().toString().slice(-8)}`,
          first_name: walkInClientName.trim(),
          last_name: 'Walk-in',
          date_of_birth: '1900-01-01',
          gender: 'other',
          contact_number: 'N/A',
          clinic_id: parseInt(user.clinic),
          registration_date: new Date().toISOString()
        };
        
        const patientResponse = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(walkInPatientData)
        });
        
        if (patientResponse.ok) {
          const createdPatient = await patientResponse.json();
          actualPatientId = createdPatient.id;
        }
      }
      
      if (actualPatientId) {
        // Create a visit record for the dispensing (required by foreign key)
        const visitData = {
          patient_id: actualPatientId,
          visit_date: new Date().toISOString(),
          clinic_id: parseInt(user.clinic),
          status: 'completed',
          chief_complaint: isWalkInClient ? 'Walk-in pharmacy dispensing' : 'Pharmacy dispensing'
        };
        
        const visitResponse = await fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitData)
        });
        
        if (!visitResponse.ok) {
          throw new Error('Failed to create visit record');
        }
        
        const visit = await visitResponse.json();
        
        // Create dispensing records for each item
        for (const item of dispensingItems) {
          // Get the actual unit of measure from inventory
          const inventoryItem = inventory.find(inv => inv.id === item.inventoryId);
          const unitOfMeasure = inventoryItem?.unit_of_measure || 'units';
          
          const dispensingRecord = {
            drug_id: item.inventoryId,
            patient_id: actualPatientId,
            visit_id: visit.id,
            prescription_id: null,
            quantity_dispensed: item.quantity,
            unit_of_measure: unitOfMeasure,
            dosage: null,
            frequency: null,
            duration: null,
            instructions: null,
            dispensed_at: new Date().toISOString(),
            dispensed_by: user?.uid || user?.id || 'system',
            clinic_id: parseInt(user.clinic),
            status: 'dispensed'
          };
          
          await pharmacyApi.addDispensingRecord(dispensingRecord);
        }
      }

      // Update inventory stock only after successful bill creation
      for (const item of dispensingItems) {
        const inventoryItem = inventory.find(inv => inv.id === item.inventoryId);
        if (inventoryItem) {
          const updatedStock = {
            current_stock: inventoryItem.current_stock - item.quantity
          };
          await pharmacyApi.updateInventoryItem(item.inventoryId, updatedStock);
        }
      }

      // Create receipt record for pharmacy payment
      try {
        // Calculate the correct service indexes based on the updated bill
        const billServices = bill.services || [];
        console.log('Bill services for receipt indexing:', billServices);
        
        // Find the indexes of the newly added pharmacy services
        const paidServiceIndexes = [];
        const serviceDetails = [];
        
        // If we added to existing bill, the new services are at the end
        if (existingBill) {
          const startIndex = existingBill.services?.length || 0;
          console.log('New services start at index:', startIndex);
          
          dispensingItems.forEach((item, itemIndex) => {
            const serviceIndex = startIndex + itemIndex;
            paidServiceIndexes.push(serviceIndex.toString());
            serviceDetails.push({
              index: serviceIndex,
              serviceName: item.drugName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              department: 'Pharmacy'
            });
          });
        } else {
          // For new bill, services start at index 0
          dispensingItems.forEach((item, itemIndex) => {
            paidServiceIndexes.push(itemIndex.toString());
            serviceDetails.push({
              index: itemIndex,
              serviceName: item.drugName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              department: 'Pharmacy'
            });
          });
        }
        
        console.log('Calculated paid service indexes:', paidServiceIndexes);
        console.log('Service details for receipt:', serviceDetails);
        console.log('Final bill services after adding pharmacy items:', bill.services);
        
        const receiptData = {
          bill_id: bill.id,
          patient_id: patientId,
          patient_name: patientName,
          clinic_id: parseInt(user.clinic),
          payment_amount: totalAmount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          paid_services: paidServiceIndexes,
          service_details: serviceDetails,
          notes: `Pharmacy dispensing - ${dispensingItems.length} items`,
          from_lease: false,
          cashier_name: user?.displayName || 'Unknown',
          cashier_id: user?.uid || user?.id,
          status: 'active'
        };

        const createdReceipt = await pharmacyApi.createPharmacyReceipt(receiptData);
        console.log('Pharmacy receipt created successfully', createdReceipt);
        console.log('Receipt data sent to API:', receiptData);
        
        // Store receipt data for display
        const receiptForDisplay = {
          ...receiptData,
          receipt_number: createdReceipt.receipt_number || `RCP-${Date.now().toString().slice(-8)}`,
          bill_number: bill.bill_number || bill.billNumber,
          dispensingItems: dispensingItems
        };
        
        console.log('Setting receipt data for display:', receiptForDisplay);
        setLastReceipt(receiptForDisplay);
        
      } catch (receiptError: any) {
        console.error('Error creating pharmacy receipt:', receiptError);
        
        // Check if error is due to missing active shift
        if (receiptError?.response?.data?.requiresShift || receiptError?.response?.status === 403) {
          toast.error('No active cashier shift found. Redirecting to start shift...');
          setTimeout(() => {
            window.location.href = '/cashier/shift';
          }, 2000);
          return; // Exit the function to prevent further processing
        }
        
        // Don't fail the dispensing if receipt creation fails
        
        // Recalculate service indexes for fallback (since variables are in try block)
        const fallbackPaidServiceIndexes = [];
        const fallbackServiceDetails = [];
        
        if (existingBill) {
          const startIndex = existingBill.services?.length || 0;
          dispensingItems.forEach((item, itemIndex) => {
            const serviceIndex = startIndex + itemIndex;
            fallbackPaidServiceIndexes.push(serviceIndex.toString());
            fallbackServiceDetails.push({
              index: serviceIndex,
              serviceName: item.drugName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              department: 'Pharmacy'
            });
          });
        } else {
          dispensingItems.forEach((item, itemIndex) => {
            fallbackPaidServiceIndexes.push(itemIndex.toString());
            fallbackServiceDetails.push({
              index: itemIndex,
              serviceName: item.drugName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              department: 'Pharmacy'
            });
          });
        }
        
        // Still create receipt data for display even if API fails
        const fallbackReceipt = {
          bill_id: bill.id,
          patient_id: patientId,
          patient_name: patientName,
          clinic_id: parseInt(user.clinic),
          payment_amount: totalAmount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          paid_services: fallbackPaidServiceIndexes,
          service_details: fallbackServiceDetails,
          notes: `Pharmacy dispensing - ${dispensingItems.length} items`,
          from_lease: false,
          cashier_name: user?.displayName || 'Unknown',
          cashier_id: user?.uid || user?.id,
          status: 'active',
          receipt_number: `RCP-${Date.now().toString().slice(-8)}`,
          bill_number: bill.bill_number || bill.billNumber,
          dispensingItems: dispensingItems
        };
        console.log('Using fallback receipt data:', fallbackReceipt);
        setLastReceipt(fallbackReceipt);
      }

      // Update prescription status to 'dispensed' if this was from a prescription
      if (currentPrescriptionId) {
        try {
          // Handle multiple prescription IDs (comma-separated)
          const prescriptionIds = currentPrescriptionId.split(',');
          
          for (const prescriptionId of prescriptionIds) {
            const response = await fetch(`/api/pharmacy/prescriptions/${prescriptionId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'dispensed' })
            });
            
            if (response.ok) {
              console.log('Prescription status updated to dispensed:', prescriptionId);
            }
          }
        } catch (error) {
          console.error('Error updating prescription status:', error);
          // Don't fail the dispensing if prescription update fails
        }
        setCurrentPrescriptionId(null); // Clear prescription ID
      }

      toast.success(`Medicine dispensed successfully. Payment of SSP ${totalAmount.toFixed(2)} received. Bill #${bill.bill_number || bill.billNumber}`);
      
      console.log('About to close dispense modal and show receipt');
      setShowDispenseModal(false);
      
      // Add a small delay to ensure modal state updates properly
      setTimeout(() => {
        console.log('Setting showReceipt to true');
        setShowReceipt(true);
      }, 100);
      
      fetchData(); // Refresh inventory and prescriptions
    } catch (error) {
      console.error('Error dispensing medicine:', error);
      toast.error('Failed to dispense medicine');
    } finally {
      setDispensing(false);
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    if (!lastReceipt) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the receipt');
      return;
    }

    const currentDate = new Date();
    const receiptId = lastReceipt.receipt_number;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
            }
            .thermal-receipt {
              width: 80mm !important;
              max-width: none !important;
            }
          }
          body {
            margin: 0;
            padding: 8px;
            font-family: 'Courier New', monospace;
          }
        </style>
      </head>
      <body>
        <div class="thermal-receipt" style="
          width: 100%;
          max-width: 302px;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          background-color: #fff;
          padding: 12px;
          margin: 0 auto;
          box-sizing: border-box;
        ">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">
              UNIVERSAL HOSPITAL
            </div>
            <div style="font-size: 9px; margin-bottom: 1px; color: #666;">
              Hai Jerusalem, Juba, South Sudan
            </div>
            <div style="font-size: 9px; margin-bottom: 1px; color: #666;">
              Tel: 0922123463
            </div>
            <div style="font-size: 9px; margin-bottom: 6px; color: #666;">
              Email: info@universalhospital.com
            </div>
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">
              PHARMACY RECEIPT
            </div>
            <div style="font-size: 10px;">
              ${currentDate.toLocaleDateString('en-GB')} ${currentDate.toLocaleTimeString('en-GB')}
            </div>
          </div>

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Receipt Info -->
          <div style="margin-bottom: 12px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Receipt No:</span>
              <span style="font-weight: bold;">${receiptId}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Bill No:</span>
              <span>${lastReceipt.bill_number}</span>
            </div>
          </div>

          <!-- Patient Info -->
          <div style="margin-bottom: 12px; font-size: 11px;">
            <div style="font-weight: bold; margin-bottom: 2px;">PATIENT DETAILS:</div>
            <div>Name: ${lastReceipt.patient_name}</div>
            <div>ID: ${lastReceipt.patient_id}</div>
            <div>Date: ${new Date(lastReceipt.payment_date).toLocaleDateString('en-GB')}</div>
          </div>

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Medications -->
          <div style="margin-bottom: 12px; font-size: 10px;">
            <div style="font-weight: bold; margin-bottom: 4px;">MEDICATIONS:</div>
            ${lastReceipt.dispensingItems ? 
              lastReceipt.dispensingItems.map((item: any) => `
                <div style="margin-bottom: 3px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1; padding-right: 4px;">
                      ${item.drugName.toUpperCase()}
                    </span>
                    <span style="min-width: 60px; text-align: right;">
                      SSP ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div style="font-size: 9px; color: #666; padding-left: 4px;">
                    ${item.quantity} x SSP ${item.unitPrice.toFixed(2)}
                  </div>
                </div>
              `).join('') : 
              '<div>No medication details available</div>'
            }
          </div>

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Payment Details -->
          <div style="margin-bottom: 12px; font-size: 11px;">
            <div style="font-weight: bold; margin-bottom: 2px;">PAYMENT DETAILS:</div>
            <div style="display: flex; justify-content: space-between;">
              <span>Method:</span>
              <span style="text-transform: capitalize;">${lastReceipt.payment_method}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Date:</span>
              <span>${new Date(lastReceipt.payment_date).toLocaleDateString('en-GB')}</span>
            </div>
            <div style="border-top: 1px solid #000; padding-top: 2px; margin-top: 4px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>TOTAL AMOUNT:</span>
                <span>SSP ${lastReceipt.payment_amount.toFixed(2)}</span>
              </div>
            </div>
            ${lastReceipt.notes ? `
              <div style="margin-top: 4px;">
                <div style="font-weight: bold; font-size: 10px;">Notes:</div>
                <div style="font-size: 9px; word-wrap: break-word;">
                  ${lastReceipt.notes}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Cashier Information -->
          ${lastReceipt.cashier_name ? `
            <div style="margin-bottom: 12px; font-size: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-weight: bold;">DISPENSED BY:</span>
                <span style="font-weight: bold;">${lastReceipt.cashier_name}</span>
              </div>
            </div>
          ` : ''}

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Footer -->
          <div style="text-align: center; font-size: 10px; margin-top: 12px;">
            <div style="margin-bottom: 4px;">
              Thank you for your payment!
            </div>
            <div style="font-size: 9px; color: #666;">
              Keep this receipt for your records
            </div>
            <div style="font-size: 9px; color: #666; margin-top: 4px;">
              Department: Pharmacy
            </div>
          </div>

          <!-- Bottom spacing for tear-off -->
          <div style="height: 20px;"></div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastReceipt(null);
  };

  // Export dispensing report to CSV
  const handleExportDispensingReport = () => {
    if (dispensingHistory.length === 0) {
      toast.error('No dispensing data to export');
      return;
    }

    try {
      // Apply filters
      const filteredHistory = dispensingHistory.filter((record: any) => {
        if (dispensingDateRange.from || dispensingDateRange.to) {
          const recordDate = new Date(record.dispensed_at);
          if (dispensingDateRange.from) {
            const fromDate = new Date(dispensingDateRange.from);
            if (recordDate < fromDate) return false;
          }
          if (dispensingDateRange.to) {
            const toDate = new Date(dispensingDateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (recordDate > toDate) return false;
          }
        }
        
        if (dispensingUserFilter !== 'all') {
          const dispensedBy = record.dispensed_by_name || record.dispensed_by;
          if (dispensedBy !== dispensingUserFilter) return false;
        }
        
        return true;
      });

      if (filteredHistory.length === 0) {
        toast.error('No records match the selected filters');
        return;
      }

      // Aggregate by drug name
      const aggregatedData = filteredHistory.reduce((acc: any, record: any) => {
        const drugName = record.drug_name || record.drug_id || 'Unknown';
        const unit = record.unit_of_measure || 'units';
        const key = `${drugName}_${unit}`;
        
        if (!acc[key]) {
          acc[key] = {
            drug_name: drugName,
            unit_of_measure: unit,
            total_quantity: 0,
            dispensing_count: 0,
            last_dispensed: record.dispensed_at
          };
        }
        
        acc[key].total_quantity += parseInt(record.quantity_dispensed) || 0;
        acc[key].dispensing_count += 1;
        
        if (new Date(record.dispensed_at) > new Date(acc[key].last_dispensed)) {
          acc[key].last_dispensed = record.dispensed_at;
        }
        
        return acc;
      }, {});
      
      const aggregatedArray = Object.values(aggregatedData);

      const headers = ['Drug Name', 'Total Quantity Dispensed', 'Unit', 'Times Dispensed', 'Last Dispensed'];
      const csvData = aggregatedArray.map((item: any) => [
        item.drug_name,
        item.total_quantity,
        item.unit_of_measure,
        item.dispensing_count,
        item.last_dispensed ? new Date(item.last_dispensed).toLocaleDateString('en-US') : '-'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => 
          typeof field === 'string' && (field.includes(',') || field.includes('"')) 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const currentDate = new Date().toISOString().split('T')[0];
      let filename = `dispensing_report_${currentDate}`;
      if (dispensingDateRange.from || dispensingDateRange.to) {
        filename += `_${dispensingDateRange.from || 'start'}_to_${dispensingDateRange.to || 'end'}`;
      }
      if (dispensingUserFilter !== 'all') {
        filename += `_${dispensingUserFilter}`;
      }
      filename += '.csv';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredHistory.length} dispensing records to CSV`);
    } catch (error) {
      console.error('Error exporting dispensing report:', error);
      toast.error('Failed to export dispensing report');
    }
  };

  useEffect(() => {
    if (user?.clinic) {
      fetchData();
    }
  }, [user?.clinic]);

  // Load inventory manually when checkbox is checked
  useEffect(() => {
    const loadInventoryData = async () => {
      if (loadInventory && !inventoryLoading && inventory.length === 0 && user?.clinic) {
        setInventoryLoading(true);
        try {
          const inventoryData = await pharmacyApi.getInventory(user.clinic);
          setInventory(inventoryData);
        } catch (error) {
          console.error('Error loading inventory:', error);
          toast.error('Failed to load inventory');
        } finally {
          setInventoryLoading(false);
        }
      }
    };
    loadInventoryData();
  }, [loadInventory]);

  const fetchData = async () => {
    if (!user?.clinic) return;
    
    setLoading(true);
    try {
      // Load inventory immediately for dispense modal
      const inventoryData = await pharmacyApi.getInventory(user.clinic);
      setInventory(inventoryData);
      setLoading(false);
      
      // Lazy load other data in the background
      Promise.all([
        pharmacyApi.getDispensingHistory(user.clinic),
        pharmacyApi.getPatients(user.clinic),
        pharmacyApi.getPrescriptions(user.clinic)
      ]).then(([dispensingData, patientsData, prescriptionsData]) => {
        setDispensingHistory(Array.isArray(dispensingData) ? dispensingData : []);
        setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
        
        // Extract unique dispensers for filter
        const dispensers = Array.isArray(dispensingData) 
          ? [...new Set(dispensingData.map((d: any) => d.dispensed_by_name || d.dispensed_by).filter(Boolean))]
          : [];
        setUniqueDispensers(dispensers);
        
        // Transform patient data to match expected structure
        const transformedPatients = patientsData.map((patient: any) => {
          const firstName = patient.first_name || '';
          const lastName = patient.last_name || '';
          const fullName = firstName && lastName 
            ? `${firstName} ${lastName}`.trim()
            : firstName || lastName || patient.full_name || patient.name || 'Unknown Patient';
          
          return {
            id: patient.id,
            patientId: patient.patient_id,
            fullName: fullName.trim(),
            firstName: firstName,
            lastName: lastName,
            age: patient.age || 0,
            phoneNumber: patient.phone || patient.phone_number || '',
            clinic: user.clinic
          };
        });
        
        setPatients(transformedPatients);
      }).catch(error => {
        console.error('Error loading background data:', error);
        // Don't show error toast for background loading
      });
      
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
      toast.error('Failed to load pharmacy data');
      setLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clinic) return;

    try {
      setSaving(true);
      
      // Check for duplicate brand name when adding new stock
      if (!isEditMode) {
        const duplicateDrug = inventory.find(
          item => item.drug_name.toLowerCase().trim() === newStock.drug_name.toLowerCase().trim()
        );
        
        if (duplicateDrug) {
          toast.error(`Drug "${newStock.drug_name}" already exists in inventory. Please update the existing stock instead.`);
          setSaving(false);
          return;
        }
      }
      
      // Prepare data to match DrugInventory model requirements
      const stockData = {
        drug_name: newStock.drug_name.trim(),
        generic_name: newStock.generic_name.trim() || null,
        unit_of_measure: newStock.unit_of_measure,
        quantity_received: parseInt(newStock.current_stock), // Use current_stock as quantity_received
        current_stock: parseInt(newStock.current_stock),
        expiry_date: newStock.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year from now if not provided
        batch_number: newStock.batch_number,
        reorder_level: parseInt(newStock.reorder_level),
        clinic_id: parseInt(user.clinic),
        date_received: newStock.date_received,
        received_by: user.uid || user.id || 'system', // Use user ID
        unit_cost: newStock.unit_cost ? parseFloat(newStock.unit_cost) : 0,
        selling_price: newStock.selling_price ? parseFloat(newStock.selling_price) : 0
      };

      console.log('Sending stock data:', stockData);
      
      if (isEditMode && editingItem) {
        // Update existing item
        await pharmacyApi.updateInventoryItem(editingItem.id, stockData);
        toast.success('Stock updated successfully');
      } else {
        // Add new item
        await pharmacyApi.addInventoryItem(stockData);
        toast.success('Stock added successfully');
      }
      
      setShowAddStock(false);
      setIsEditMode(false);
      setEditingItem(null);
      setNewStock({
        drug_name: '',
        generic_name: '',
        current_stock: '',
        unit_of_measure: 'Tablets',
        reorder_level: '',
        expiry_date: '',
        batch_number: '',
        date_received: new Date().toISOString().split('T')[0],
        unit_cost: '',
        margin_percentage: '',
        selling_price: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving stock:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'add'} stock. Please check all required fields.`);
    } finally {
      setSaving(false);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Apply search filter
      const matchesSearch = item.drug_name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Apply active filter
      if (activeFilter === 'all') return true;
      
      if (activeFilter === 'expiring') {
        if (!item.expiry_date) return false;
        const expiryDate = new Date(item.expiry_date);
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return expiryDate <= threeMonthsFromNow || expiryDate < today;
      }
      
      if (activeFilter === 'low-stock') {
        return item.current_stock > 0 && item.current_stock <= item.reorder_level;
      }
      
      if (activeFilter === 'out-of-stock') {
        return item.current_stock === 0;
      }
      
      return true;
    });
  }, [inventory, searchQuery, activeFilter]);

  const lowStockItems = useMemo(() => 
    inventory.filter(item => item.current_stock <= item.reorder_level),
    [inventory]
  );

  const expiringSoonItems = useMemo(() => 
    inventory.filter(item => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Include items that are already expired OR will expire within 3 months
      return expiryDate <= threeMonthsFromNow;
    }),
    [inventory]
  );

  // Memoized filtered medicines for the dispense modal (debounced for performance)
  const availableMedicines = useMemo(() => {
    const filtered = filteredInventory
      .filter(item => item.current_stock > 0)
      .filter(item => 
        debouncedMedicineSearch === '' || 
        item.drug_name.toLowerCase().includes(debouncedMedicineSearch.toLowerCase()) ||
        (item.generic_name && item.generic_name.toLowerCase().includes(debouncedMedicineSearch.toLowerCase()))
      );
    
    // Limit to 30 items when no search query for instant render
    // Full list shows when searching
    return debouncedMedicineSearch === '' ? filtered.slice(0, 30) : filtered.slice(0, 100);
  }, [filteredInventory, debouncedMedicineSearch]);

  // Memoized set of added item IDs for O(1) lookup performance
  const addedItemIds = useMemo(() => 
    new Set(dispensingItems.map(item => item.inventoryId)),
    [dispensingItems]
  );

  // Memoized total amount for instant display
  const totalAmount = useMemo(() => 
    dispensingItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [dispensingItems]
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading pharmacy data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {!isInventoryPage ? 'Pharmacy Dispensing' : 'Pharmacy Inventory'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {!isInventoryPage ? 'Manage prescriptions and dispense medications' : 'Manage drug stock and inventory'}
          </p>
        </div>

        {/* Stats Cards - Only show on inventory page */}
        {isInventoryPage && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory.length}</div>
                <p className="text-xs text-muted-foreground">Active medications in stock</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">Items below reorder level</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                <Bell className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{expiringSoonItems.length}</div>
                <p className="text-xs text-muted-foreground">Items expiring within 3 months</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Dispensing</CardTitle>
                <Pill className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Array.isArray(dispensingHistory) ? dispensingHistory.filter(d => {
                    const dispensedDate = new Date(d.dispensed_at || d.date || '');
                    const today = new Date();
                    return dispensedDate.toDateString() === today.toDateString();
                  }).length : 0}
                </div>
                <p className="text-xs text-muted-foreground">Medications dispensed today</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dispense Medicine Button - Only on main pharmacy page */}
        {!isInventoryPage && (
          <div className="flex justify-end">
            <Button size="lg" className="gap-2" onClick={handleDispenseMedicine}>
              <Pill className="w-5 h-5" />
              Dispense Medicine
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue={isInventoryPage ? "inventory" : "prescriptions"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            {isInventoryPage && (
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory
              </TabsTrigger>
            )}
            {isInventoryPage && (
              <TabsTrigger value="inventory-report" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Inventory Report
              </TabsTrigger>
            )}
            {!isInventoryPage && (
              <TabsTrigger value="prescriptions" className="flex items-center gap-2 text-base font-medium">
                <FileText className="w-5 h-5" />
                Prescriptions ({prescriptions.length})
              </TabsTrigger>
            )}
            {!isInventoryPage && (
              <TabsTrigger value="dispensing-report" className="flex items-center gap-2 text-base font-medium">
                <Pill className="w-5 h-5" />
                Dispensing History
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            {isInventoryPage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Drug Inventory</h2>
                </div>

                <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search drugs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  
                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="w-4 h-4" />
                        {activeFilter === 'all' && `All Items (${inventory.length})`}
                        {activeFilter === 'expiring' && `Expiring (${expiringSoonItems.length})`}
                        {activeFilter === 'low-stock' && `Low Stock (${lowStockItems.filter(i => i.current_stock > 0).length})`}
                        {activeFilter === 'out-of-stock' && `Out of Stock (${inventory.filter(i => i.current_stock === 0).length})`}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setActiveFilter('all')} className="gap-2">
                        <Package className="w-4 h-4" />
                        <span>All Items ({inventory.length})</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveFilter('expiring')} className="gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Expiring Soon ({expiringSoonItems.length})</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveFilter('low-stock')} className="gap-2">
                        <TrendingDown className="w-4 h-4" />
                        <span>Low Stock ({lowStockItems.filter(i => i.current_stock > 0).length})</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveFilter('out-of-stock')} className="gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>Out of Stock ({inventory.filter(i => i.current_stock === 0).length})</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleDispenseMedicine}>
                    <Pill className="w-4 h-4" />
                    Dispense Medicine
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Package className="w-4 h-4" />
                    Accept Return
                  </Button>
                  <Button size="sm" className="gap-2" onClick={handleAddNewItem}>
                    <Plus className="w-4 h-4" />
                    Add Stock
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                {!loadInventory && inventory.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Inventory Not Loaded
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Check the "Load Products" checkbox below to load the inventory data.
                    </p>
                  </div>
                ) : inventoryLoading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading inventory...</p>
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {searchQuery ? 'No drugs found' : 'No drugs in inventory'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search terms or clear the search to see all drugs.'
                        : 'Get started by adding your first drug to inventory.'
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={handleAddNewItem} className="mt-2">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Drug
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-background border-b border-border sticky top-0 z-10">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Drug Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Generic Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Current Stock</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Unit</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Reorder Level</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Expiry Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Batch Number</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Received Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Status</th>
                          <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredInventory.map((item, index) => (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground uppercase">{item.drug_name}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-muted-foreground">{item.generic_name || '-'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-foreground">{item.current_stock}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-muted-foreground">{item.unit_of_measure}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-muted-foreground">{item.reorder_level}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-muted-foreground">
                                {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-muted-foreground font-mono">
                                {item.batch_number || 'N/A'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-muted-foreground">
                                {item.date_received ? new Date(item.date_received).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {item.current_stock <= item.reorder_level ? (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                              ) : new Date(item.expiry_date || '') < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? (
                                <Badge variant="destructive">Expiring</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="hover:bg-muted/50"
                                  onClick={() => handleEditItem(item)}
                                  title="Edit Item"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleDeleteItem(item)}
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Load Products Checkbox */}
              <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="loadInventory"
                  checked={loadInventory}
                  onChange={(e) => setLoadInventory(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
                <label
                  htmlFor="loadInventory"
                  className="text-sm font-medium text-foreground cursor-pointer select-none"
                >
                  Load Products {inventoryLoading && '(Loading...)'}
                </label>
                {loadInventory && inventory.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({inventory.length} items loaded)
                  </span>
                )}
              </div>
            </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Inventory is available on the dedicated Inventory page.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prescriptions ({prescriptions.length})</CardTitle>
                <CardDescription>Manage patient prescriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {prescriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No prescriptions available
                  </div>
                ) : (() => {
                  // Group prescriptions by patient
                  const groupedPrescriptions = prescriptions.reduce((acc: any, prescription: any) => {
                    const key = prescription.patient_id;
                    if (!acc[key]) {
                      acc[key] = {
                        patient_id: prescription.patient_id,
                        patient_name: prescription.patient_name,
                        prescribed_by: prescription.prescribed_by,
                        prescribed_at: prescription.prescribed_at,
                        prescriptions: []
                      };
                    }
                    acc[key].prescriptions.push(prescription);
                    return acc;
                  }, {});

                  const groupedArray = Object.values(groupedPrescriptions);

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Patient</th>
                            <th className="text-left p-3 font-semibold">Medications</th>
                            <th className="text-left p-3 font-semibold">Prescribed By</th>
                            <th className="text-left p-3 font-semibold">Date</th>
                            <th className="text-left p-3 font-semibold">Status</th>
                            <th className="text-left p-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedArray.map((group: any) => {
                            const allDispensed = group.prescriptions.every((p: any) => p.status === 'dispensed');
                            const hasActive = group.prescriptions.some((p: any) => p.status !== 'dispensed');

                            return (
                              <tr key={group.patient_id} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  <div className="font-medium">{group.patient_name}</div>
                                  <div className="text-sm text-muted-foreground">{group.patient_id}</div>
                                </td>
                                <td className="p-3">
                                  <div className="space-y-1">
                                    {group.prescriptions.map((prescription: any, index: number) => (
                                      <div key={prescription.id} className="text-sm">
                                        <span className="font-medium text-primary">
                                          {index > 0 && '... '}
                                          {prescription.medication_name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3 text-sm">{group.prescribed_by}</td>
                                <td className="p-3 text-sm">
                                  {new Date(group.prescribed_at).toLocaleDateString()}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    allDispensed
                                      ? 'bg-green-50 text-green-700' 
                                      : 'bg-yellow-50 text-yellow-700'
                                  }`}>
                                    {allDispensed ? 'Dispensed' : 'Active'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {hasActive && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          // Find the patient
                                          const patient = patients.find(p => p.id === group.patient_id);
                                          
                                          if (patient) {
                                            // Get all active prescriptions for this patient
                                            const activePrescriptions = group.prescriptions.filter((p: any) => p.status !== 'dispensed');
                                            
                                            // Find all drugs in inventory and create dispensing items
                                            const dispensingItemsToAdd = [];
                                            const prescriptionIds = [];
                                            
                                            for (const prescription of activePrescriptions) {
                                              const drug = inventory.find(item => 
                                                item.drug_name.toLowerCase() === prescription.medication_name.toLowerCase()
                                              );
                                              
                                              if (drug) {
                                                dispensingItemsToAdd.push({
                                                  inventoryId: drug.id,
                                                  drugName: drug.drug_name,
                                                  quantity: parseInt(prescription.quantity) || 1,
                                                  unitPrice: typeof drug.selling_price === 'number' ? drug.selling_price : parseFloat(drug.selling_price.toString()) || 0,
                                                  totalPrice: (parseInt(prescription.quantity) || 1) * (typeof drug.selling_price === 'number' ? drug.selling_price : parseFloat(drug.selling_price.toString()) || 0),
                                                  availableStock: drug.current_stock
                                                });
                                                prescriptionIds.push(prescription.id);
                                              } else {
                                                toast.error(`Drug "${prescription.medication_name}" not found in inventory`);
                                              }
                                            }
                                            
                                            if (dispensingItemsToAdd.length > 0) {
                                              // Pre-fill dispensing modal with all prescription data
                                              setSelectedPatient(patient);
                                              setIsWalkInClient(false);
                                              setCurrentPrescriptionId(prescriptionIds.join(',')); // Track all prescriptions being dispensed
                                              setDispensingItems(dispensingItemsToAdd);
                                              setShowDispenseModal(true);
                                            }
                                          } else {
                                            toast.error('Patient not found');
                                          }
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Pill className="w-4 h-4 mr-1" />
                                        Dispense All
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCancelPrescription(group)}
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispensing-report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dispensing Report</CardTitle>
                <CardDescription>Track medication dispensing activities</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters and Export */}
                <div className="mb-4 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-sm font-medium mb-2">From Date</Label>
                    <Input
                      type="date"
                      value={dispensingDateRange.from}
                      onChange={(e) => setDispensingDateRange({ ...dispensingDateRange, from: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-sm font-medium mb-2">To Date</Label>
                    <Input
                      type="date"
                      value={dispensingDateRange.to}
                      onChange={(e) => setDispensingDateRange({ ...dispensingDateRange, to: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-sm font-medium mb-2">Dispensed By</Label>
                    <select
                      value={dispensingUserFilter}
                      onChange={(e) => setDispensingUserFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="all">All Users</option>
                      {uniqueDispensers.map(dispenser => (
                        <option key={dispenser} value={dispenser}>{dispenser}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => {
                      setDispensingDateRange({ from: '', to: '' });
                      setDispensingUserFilter('all');
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={handleExportDispensingReport}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>

                {(() => {
                  // Apply filters
                  const filteredHistory = dispensingHistory.filter((record: any) => {
                    // Date range filter
                    if (dispensingDateRange.from || dispensingDateRange.to) {
                      const recordDate = new Date(record.dispensed_at);
                      if (dispensingDateRange.from) {
                        const fromDate = new Date(dispensingDateRange.from);
                        if (recordDate < fromDate) return false;
                      }
                      if (dispensingDateRange.to) {
                        const toDate = new Date(dispensingDateRange.to);
                        toDate.setHours(23, 59, 59, 999);
                        if (recordDate > toDate) return false;
                      }
                    }
                    
                    // User filter
                    if (dispensingUserFilter !== 'all') {
                      const dispensedBy = record.dispensed_by_name || record.dispensed_by;
                      if (dispensedBy !== dispensingUserFilter) return false;
                    }
                    
                    return true;
                  });

                  // Aggregate by drug name
                  const aggregatedData = filteredHistory.reduce((acc: any, record: any) => {
                    const drugName = record.drug_name || record.drug_id || 'Unknown';
                    const unit = record.unit_of_measure || 'units';
                    const key = `${drugName}_${unit}`;
                    
                    if (!acc[key]) {
                      acc[key] = {
                        drug_name: drugName,
                        unit_of_measure: unit,
                        total_quantity: 0,
                        dispensing_count: 0,
                        last_dispensed: record.dispensed_at
                      };
                    }
                    
                    acc[key].total_quantity += parseInt(record.quantity_dispensed) || 0;
                    acc[key].dispensing_count += 1;
                    
                    // Keep the most recent dispensing date
                    if (new Date(record.dispensed_at) > new Date(acc[key].last_dispensed)) {
                      acc[key].last_dispensed = record.dispensed_at;
                    }
                    
                    return acc;
                  }, {});
                  
                  const aggregatedArray = Object.values(aggregatedData);

                  return aggregatedArray.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No dispensing records found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Drug Name</th>
                          <th className="text-left p-3 font-medium">Total Quantity Dispensed</th>
                          <th className="text-left p-3 font-medium">Unit</th>
                          <th className="text-left p-3 font-medium">Times Dispensed</th>
                          <th className="text-left p-3 font-medium">Last Dispensed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {aggregatedArray.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-muted/20">
                            <td className="p-3 font-medium uppercase">{item.drug_name}</td>
                            <td className="p-3 text-lg font-bold text-primary">{item.total_quantity}</td>
                            <td className="p-3">{item.unit_of_measure}</td>
                            <td className="p-3">{item.dispensing_count}</td>
                            <td className="p-3">
                              {item.last_dispensed ? new Date(item.last_dispensed).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory-report" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventory.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique drugs</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stock Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">SSP {inventory.reduce((sum, item) => sum + (item.current_stock * (typeof item.selling_price === 'number' ? item.selling_price : parseFloat(item.selling_price?.toString() || '0'))), 0).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total value</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{inventory.filter(item => item.current_stock <= item.reorder_level).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Need reorder</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{inventory.filter(item => item.current_stock === 0).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unavailable</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Complete Inventory Report</CardTitle>
                    <CardDescription>All inventory items with stock levels and values</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Generate CSV content
                      const headers = ['Drug Name', 'Generic Name', 'Current Stock', 'Unit', 'Reorder Level', 'Unit Cost (Purchase)', 'Selling Price', 'Stock Value', 'Batch Number', 'Expiry Date', 'Status'];
                      const csvRows = [headers.join(',')];
                      
                      inventory.forEach(item => {
                        const stockValue = item.current_stock * (typeof item.selling_price === 'number' ? item.selling_price : parseFloat(item.selling_price?.toString() || '0'));
                        const isLow = item.current_stock <= item.reorder_level;
                        const isOut = item.current_stock === 0;
                        const status = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
                        
                        const row = [
                          `"${item.drug_name}"`,
                          `"${item.generic_name || '-'}"`,
                          item.current_stock,
                          item.unit_of_measure,
                          item.reorder_level,
                          (typeof item.unit_cost === 'number' ? item.unit_cost : parseFloat(item.unit_cost?.toString() || '0')).toFixed(2),
                          (typeof item.selling_price === 'number' ? item.selling_price : parseFloat(item.selling_price?.toString() || '0')).toFixed(2),
                          stockValue.toFixed(2),
                          `"${item.batch_number || '-'}"`,
                          item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-',
                          status
                        ];
                        csvRows.push(row.join(','));
                      });
                      
                      const csvContent = csvRows.join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      const currentDate = new Date().toISOString().split('T')[0];
                      link.download = `inventory_report_${currentDate}.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      toast.success('Inventory report exported successfully');
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inventory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No inventory items</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-semibold">Drug Name</th>
                          <th className="text-left p-2 font-semibold">Generic</th>
                          <th className="text-left p-2 font-semibold">Stock</th>
                          <th className="text-left p-2 font-semibold">Unit</th>
                          <th className="text-left p-2 font-semibold">Reorder</th>
                          <th className="text-left p-2 font-semibold">Unit Cost</th>
                          <th className="text-left p-2 font-semibold">Selling</th>
                          <th className="text-left p-2 font-semibold">Value</th>
                          <th className="text-left p-2 font-semibold">Batch</th>
                          <th className="text-left p-2 font-semibold">Expiry</th>
                          <th className="text-left p-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item) => {
                          const stockValue = item.current_stock * (typeof item.selling_price === 'number' ? item.selling_price : parseFloat(item.selling_price?.toString() || '0'));
                          const isLow = item.current_stock <= item.reorder_level;
                          const isOut = item.current_stock === 0;
                          return (
                            <tr key={item.id} className="border-b hover:bg-muted/30">
                              <td className="p-2 font-medium">{item.drug_name}</td>
                              <td className="p-2 text-muted-foreground">{item.generic_name || '-'}</td>
                              <td className="p-2"><span className={`font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-600'}`}>{item.current_stock}</span></td>
                              <td className="p-2">{item.unit_of_measure}</td>
                              <td className="p-2">{item.reorder_level}</td>
                              <td className="p-2">SSP {(typeof item.unit_cost === 'number' ? item.unit_cost : parseFloat(item.unit_cost?.toString() || '0')).toFixed(2)}</td>
                              <td className="p-2">SSP {(typeof item.selling_price === 'number' ? item.selling_price : parseFloat(item.selling_price?.toString() || '0')).toFixed(2)}</td>
                              <td className="p-2 font-semibold">SSP {stockValue.toFixed(2)}</td>
                              <td className="p-2 text-xs">{item.batch_number || '-'}</td>
                              <td className="p-2 text-xs">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                              <td className="p-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isOut ? 'bg-red-100 text-red-800' : isLow ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                  {isOut ? 'Out' : isLow ? 'Low' : 'In Stock'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Add Stock Modal */}
        <Dialog open={showAddStock} onOpenChange={setShowAddStock}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Edit className="w-5 h-5 text-primary" />
                    Edit Stock Item
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-primary" />
                    Add New Stock
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddStock} className="space-y-4">
              {/* Drug Name */}
              <div className="form-field">
                <Label className="form-label">Drug Name *</Label>
                <Input
                  value={newStock.drug_name}
                  onChange={(e) => setNewStock({...newStock, drug_name: e.target.value})}
                  placeholder="Enter drug name"
                  className="h-9"
                  required
                />
              </div>

              {/* Generic Name */}
              <div className="form-field">
                <Label className="form-label">Generic Name</Label>
                <Input
                  value={newStock.generic_name}
                  onChange={(e) => setNewStock({...newStock, generic_name: e.target.value})}
                  placeholder="Enter generic name"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-field">
                  <Label className="form-label">Current Stock *</Label>
                  <Input
                    type="number"
                    value={newStock.current_stock}
                    onChange={(e) => setNewStock({...newStock, current_stock: e.target.value})}
                    placeholder="Enter current stock"
                    className="h-9"
                    required
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">Unit of Measure</Label>
                  <select
                    value={newStock.unit_of_measure}
                    onChange={(e) => setNewStock({...newStock, unit_of_measure: e.target.value})}
                    className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Strips">Strips</option>
                    <option value="Sachets">Sachets</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Vials">Vials</option>
                    <option value="Ampoules">Ampoules</option>
                    <option value="Tubes">Tubes</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Packs">Packs</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Units">Units</option>
                    <option value="Drops">Drops</option>
                    <option value="Sprays">Sprays</option>
                    <option value="Patches">Patches</option>
                    <option value="Injections">Injections</option>
                    <option value="Syringes">Syringes</option>
                    <option value="ml">ml (milliliters)</option>
                    <option value="L">L (liters)</option>
                    <option value="mg">mg (milligrams)</option>
                    <option value="g">g (grams)</option>
                    <option value="kg">kg (kilograms)</option>
                    <option value="mcg">mcg (micrograms)</option>
                    <option value="IU">IU (International Units)</option>
                    <option value="mEq">mEq (milliequivalents)</option>
                  </select>
                </div>
                <div className="form-field">
                  <Label className="form-label">Reorder Level *</Label>
                  <Input
                    type="number"
                    value={newStock.reorder_level}
                    onChange={(e) => setNewStock({...newStock, reorder_level: e.target.value})}
                    placeholder="Minimum stock level"
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-field">
                  <Label className="form-label">Expiry Date</Label>
                  <Input
                    type="date"
                    value={newStock.expiry_date}
                    onChange={(e) => setNewStock({...newStock, expiry_date: e.target.value})}
                    className="h-9"
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">Batch Number</Label>
                  <Input
                    value={newStock.batch_number || ''}
                    onChange={(e) => setNewStock({...newStock, batch_number: e.target.value})}
                    placeholder="Auto-generated"
                    readOnly
                    className="bg-muted/50 h-9"
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">Received Date</Label>
                  <Input
                    type="date"
                    value={newStock.date_received || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewStock({...newStock, date_received: e.target.value})}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-field">
                  <Label className="form-label">Unit Cost ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newStock.unit_cost}
                    onChange={(e) => {
                      const newCost = e.target.value;
                      const calculatedPrice = calculateSellingPrice(newCost, newStock.margin_percentage);
                      setNewStock({
                        ...newStock, 
                        unit_cost: newCost,
                        selling_price: calculatedPrice
                      });
                    }}
                    placeholder="0.00"
                    className="h-9"
                    required
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">Margin %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newStock.margin_percentage}
                    onChange={(e) => {
                      const newMargin = e.target.value;
                      const calculatedPrice = calculateSellingPrice(newStock.unit_cost, newMargin);
                      setNewStock({
                        ...newStock, 
                        margin_percentage: newMargin,
                        selling_price: calculatedPrice
                      });
                    }}
                    placeholder="e.g., 25"
                    className="h-9"
                  />
                </div>
                <div className="form-field">
                  <Label className="form-label">Selling Price ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newStock.selling_price}
                    onChange={(e) => {
                      const newPrice = e.target.value;
                      const calculatedMargin = calculateMarginPercentage(newStock.unit_cost, newPrice);
                      setNewStock({
                        ...newStock, 
                        selling_price: newPrice,
                        margin_percentage: calculatedMargin
                      });
                    }}
                    placeholder="Auto-calculated"
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddStock(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Stock
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Stock
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* CSV Import Modal */}
        <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Import Inventory from CSV
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Template Download Section */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Need a template?</h3>
                    <p className="text-sm text-muted-foreground">Download our CSV template to get started</p>
                  </div>
                  <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Select CSV File</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  {csvFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>

                {/* Preview Section */}
                {importPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preview ({importPreview.length} rows)</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Drug Name</th>
                              <th className="text-left p-2 font-medium">Generic Name</th>
                              <th className="text-left p-2 font-medium">Stock</th>
                              <th className="text-left p-2 font-medium">Unit</th>
                              <th className="text-left p-2 font-medium">Reorder Level</th>
                              <th className="text-left p-2 font-medium">Unit Cost</th>
                              <th className="text-left p-2 font-medium">Selling Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {importPreview.map((row, index) => (
                              <tr key={index} className="hover:bg-muted/20">
                                <td className="p-2 uppercase">{row.drug_name || '-'}</td>
                                <td className="p-2">{row.generic_name || '-'}</td>
                                <td className="p-2">{row.current_stock || '-'}</td>
                                <td className="p-2">{row.unit_of_measure || '-'}</td>
                                <td className="p-2">{row.reorder_level || '-'}</td>
                                <td className="p-2">{row.unit_cost || '-'}</td>
                                <td className="p-2">{row.selling_price || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setImportPreview([]);
                  }}
                  className="flex-1"
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportCSV}
                  className="flex-1"
                  disabled={!csvFile || importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {importPreview.length > 0 ? `${importPreview.length}` : ''} Items
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dispense Medicine Modal */}
        <Dialog open={showDispenseModal} onOpenChange={(open) => {
          setShowDispenseModal(open);
          if (!open) {
            setCurrentPrescriptionId(null); // Clear prescription ID when modal closes
          }
        }}>
          <DialogContent className="sm:max-w-6xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Dispense Medicine
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Patient Selection & Items */}
              <div className="space-y-6">
                {/* Patient Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Patient Selection</h3>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={!isWalkInClient}
                        onChange={() => setIsWalkInClient(false)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Existing Patient</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={isWalkInClient}
                        onChange={() => setIsWalkInClient(true)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Walk-in Client</span>
                    </label>
                  </div>

                  {isWalkInClient ? (
                    <div>
                      <Label className="text-sm font-medium">Client Name</Label>
                      <Input
                        value={walkInClientName}
                        onChange={(e) => setWalkInClientName(e.target.value)}
                        placeholder="Enter client name"
                        className="h-9"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Label className="text-sm font-medium">Select Patient</Label>
                      <div className="relative">
                        <Input
                          value={patientSearchQuery}
                          onChange={(e) => {
                            setPatientSearchQuery(e.target.value);
                            setShowPatientDropdown(true);
                            if (!e.target.value) {
                              setSelectedPatient(null);
                            }
                          }}
                          onFocus={() => setShowPatientDropdown(true)}
                          placeholder={patients.length === 0 ? 'No patients found...' : 'Search patients...'}
                          className="h-9"
                          disabled={patients.length === 0}
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        
                        {showPatientDropdown && filteredPatients.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredPatients.map(patient => (
                              <div
                                key={patient.id}
                                onClick={() => handlePatientSelect(patient)}
                                className="px-3 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                              >
                                <div className="font-medium text-sm">
                                  {patient.fullName || 'Unnamed Patient'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {patient.patientId || 'No ID'} • Phone: {patient.phoneNumber || 'No phone'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {showPatientDropdown && patientSearchQuery && filteredPatients.length === 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg p-3">
                            <div className="text-sm text-muted-foreground text-center">
                              No patients found matching "{patientSearchQuery}"
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedPatient && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <div className="font-medium text-green-800">
                            Selected: {selectedPatient.fullName}
                          </div>
                          <div className="text-green-600 text-xs">
                            ID: {selectedPatient.patientId} • Phone: {selectedPatient.phoneNumber}
                          </div>
                        </div>
                      )}
                      
                      {patients.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No patients found. Please register patients first.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Available Inventory */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-medium text-foreground">Available Medicines</h3>
                    <div className="flex items-center space-x-2 w-64">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search medicines..."
                        value={medicineSearchQuery}
                        onChange={(e) => setMedicineSearchQuery(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="border rounded-lg max-h-64 min-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">Drug Name</th>
                          <th className="text-left p-2 font-medium">Stock</th>
                          <th className="text-left p-2 font-medium">Price</th>
                          <th className="text-left p-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {availableMedicines.map(item => (
                          <MedicineRow
                            key={item.id}
                            item={item}
                            onAdd={addItemToDispensing}
                            isAdded={addedItemIds.has(item.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                    {debouncedMedicineSearch === '' && availableMedicines.length === 30 && (
                      <div className="text-xs text-center text-muted-foreground p-2 bg-muted/30">
                        Showing first 30 medicines. Type to search for more.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side - Dispensing List */}
              <div className="space-y-6">
                <h3 className="font-medium text-foreground">Items to Dispense</h3>
                
                {dispensingItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No items selected for dispensing</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Drug</th>
                            <th className="text-left p-2 font-medium">Qty</th>
                            <th className="text-left p-2 font-medium">Price</th>
                            <th className="text-left p-2 font-medium">Total</th>
                            <th className="text-left p-2 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {dispensingItems.map(item => (
                            <tr key={item.inventoryId}>
                              <td className="p-2 font-medium uppercase">{item.drugName}</td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max={item.availableStock}
                                  value={item.quantity}
                                  onChange={(e) => updateDispensingQuantity(item.inventoryId, parseInt(e.target.value) || 1)}
                                  className="h-7 w-16 text-xs"
                                />
                              </td>
                              <td className="p-2">SSP {item.unitPrice.toFixed(2)}</td>
                              <td className="p-2 font-medium">SSP {item.totalPrice.toFixed(2)}</td>
                              <td className="p-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeDispensingItem(item.inventoryId)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Amount:</span>
                        <span className="text-lg font-bold">
                          SSP {totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Step */}
                {showPaymentStep && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Payment Processing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full h-9 px-3 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="transfer">Bank Transfer</option>
                          <option value="mobile">Mobile Money</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Amount Received ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="h-9"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {!paymentReceived && (
                      <Button
                        onClick={handlePaymentConfirmation}
                        className="mt-3 w-full"
                        disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                      >
                        Confirm Payment Received
                      </Button>
                    )}
                    {paymentReceived && (
                      <div className="mt-3 p-2 bg-green-100 text-green-800 rounded text-sm text-center">
                        ✓ Payment confirmed - Ready to dispense
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDispenseModal(false);
                      setSelectedPatient(null);
                      setIsWalkInClient(false);
                      setWalkInClientName('');
                      setCurrentPrescriptionId(null);
                      setDispensingItems([]);
                      setShowPaymentStep(false);
                      setPaymentReceived(false);
                      setPatientSearchQuery('');
                      setShowPatientDropdown(false);
                    }}
                    className="flex-1"
                    disabled={dispensing}
                  >
                    Cancel
                  </Button>
                  
                  {!showPaymentStep ? (
                    <Button
                      onClick={handleProceedToPayment}
                      className="flex-1"
                      disabled={dispensingItems.length === 0}
                    >
                      <Pill className="w-4 h-4 mr-2" />
                      Proceed to Payment
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDispenseSubmit}
                      className="flex-1"
                      disabled={dispensing || !paymentReceived}
                    >
                      {dispensing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Dispensing...
                        </>
                      ) : (
                        <>
                          <Pill className="w-4 h-4 mr-2" />
                          Dispense Medicine
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Modal */}
        <Dialog open={showReceipt} onOpenChange={(open) => {
          console.log('Receipt modal open state changed:', open);
          setShowReceipt(open);
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Pharmacy Receipt</DialogTitle>
              <DialogDescription>
                Payment processed successfully
              </DialogDescription>
            </DialogHeader>
            
            {lastReceipt && (
              <div className="flex flex-col space-y-4 flex-1 min-h-0">
                {/* Receipt Preview */}
                <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-muted/20">
                  <div className="space-y-3 text-sm">
                    <div className="text-center border-b pb-3">
                      <h3 className="font-bold text-lg">UNIVERSAL HOSPITAL</h3>
                      <p className="text-xs text-muted-foreground">Pharmacy Department</p>
                      <p className="text-xs text-muted-foreground">Receipt #{lastReceipt.receipt_number}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Patient:</span>
                        <span className="font-medium">{lastReceipt.patient_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Patient ID:</span>
                        <span>{lastReceipt.patient_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bill Number:</span>
                        <span>{lastReceipt.bill_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(lastReceipt.payment_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Medications Dispensed:</h4>
                      <div className="space-y-2">
                        {lastReceipt.dispensingItems?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <div className="font-medium uppercase">{item.drugName}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.quantity} × SSP {item.unitPrice.toFixed(2)}
                              </div>
                            </div>
                            <div className="font-medium">SSP {item.totalPrice.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="capitalize">{lastReceipt.payment_method}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>SSP {lastReceipt.payment_amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t pt-3 text-center text-xs text-muted-foreground">
                      <p>Dispensed by: {lastReceipt.cashier_name}</p>
                      <p>Thank you for your payment!</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between gap-3 flex-shrink-0">
                  <Button variant="outline" onClick={handleCloseReceipt} className="flex-1">
                    Close
                  </Button>
                  <Button onClick={handlePrintReceipt} className="flex-1 gap-2">
                    <Printer className="w-4 h-4" />
                    Print Receipt
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

export default Pharmacy;
