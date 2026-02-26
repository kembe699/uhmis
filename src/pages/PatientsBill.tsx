import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import {
  Receipt,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentReceipt, printThermalReceipt } from '@/components/receipts/PaymentReceipt';

interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  billNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  billDate: string;
  dueDate: string;
  services: BillService[];
  createdAt: string;
  updatedAt: string;
}

interface BillService {
  id?: string;
  serviceName?: string;
  name?: string;
  service_name?: string;
  test_name?: string;
  quantity?: number;
  unitPrice?: number;
  unit_price?: number;
  totalPrice?: number;
  total_price?: number;
  price?: number;
}

interface Payment {
  id?: string;
  billId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'check' | 'lease' | 'insurance';
  paymentDate: string;
  notes?: string;
  fromLease: boolean;
  leaseDetails?: string;
  cashierName?: string;
  cashierId?: string;
  paidServiceIndexes?: string[];
}

const PatientsBill: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [paidServiceIndexes, setPaidServiceIndexes] = useState<Set<number>>(new Set());
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [quickPaymentData, setQuickPaymentData] = useState({
    paymentMethod: 'cash' as 'cash' | 'card' | 'check' | 'lease' | 'insurance',
    amountTendered: '',
    notes: ''
  });
  const [paymentData, setPaymentData] = useState<Payment>({
    billId: '',
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    fromLease: false,
    leaseDetails: '',
    cashierName: user?.displayName || 'Unknown',
    cashierId: user?.id || '',
    paidServiceIndexes: []
  });

  // New Bill state
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [newBillData, setNewBillData] = useState({
    patientId: '',
    isWalkIn: false,
    walkInPatient: {
      fullName: '',
      age: '',
      phone: '',
      gender: ''
    },
    selectedServices: [] as { serviceId: string; serviceName: string; price: number; quantity: number }[],
    notes: ''
  });
  const [creatingBill, setCreatingBill] = useState(false);

  // Add Item to Bill state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemSearchTerm, setAddItemSearchTerm] = useState('');
  const [addItemData, setAddItemData] = useState({
    selectedServices: [] as { serviceId: string; serviceName: string; price: number; quantity: number }[]
  });
  const [addingItems, setAddingItems] = useState(false);

  // API client for patient bills
  const patientBillsApi = {
    async getByClinic(clinicId: string): Promise<Bill[]> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/patient-bills/clinic/${clinicId}`);
        if (!response.ok) throw new Error('Failed to fetch patient bills');
        const data = await response.json();
        
        // Transform database data to frontend format
        return data.map((bill: any) => {
          let services = [];
          
          // Safely parse services field
          if (bill.services) {
            try {
              // If services is already an object/array, use it directly
              if (typeof bill.services === 'object') {
                services = Array.isArray(bill.services) ? bill.services : [bill.services];
              } else if (typeof bill.services === 'string') {
                // Only parse if it's a valid JSON string
                services = JSON.parse(bill.services);
              }
            } catch (error) {
              console.warn('Failed to parse services for bill:', bill.id, error);
              services = [];
            }
          }
          
          return {
            id: bill.id,
            patientId: bill.patient_id,
            patientName: bill.patient_name,
            billNumber: bill.bill_number,
            totalAmount: parseFloat(bill.total_amount) || 0,
            paidAmount: parseFloat(bill.paid_amount) || 0,
            balanceAmount: parseFloat(bill.balance_amount) || 0,
            status: bill.status,
            billDate: bill.bill_date,
            dueDate: bill.due_date,
            services: services,
            createdAt: bill.created_at,
            updatedAt: bill.updated_at
          };
        });
      } catch (error) {
        console.error('Error fetching patient bills:', error);
        throw error;
      }
    },

    async create(billData: any): Promise<Bill> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/patient-bills`, {
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
    },

    async update(billId: string, billData: any): Promise<Bill> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/patient-bills/${billId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billData),
        });
        if (!response.ok) throw new Error('Failed to update patient bill');
        return await response.json();
      } catch (error) {
        console.error('Error updating patient bill:', error);
        throw error;
      }
    },

    async delete(billId: string): Promise<void> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/patient-bills/${billId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete patient bill');
      } catch (error) {
        console.error('Error deleting patient bill:', error);
        throw error;
      }
    },

    async getReceipts(billId: string): Promise<any[]> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        
        const response = await fetch(`${baseUrl}/receipts/clinic/${user?.clinic}?bill_id=${billId}`);
        if (!response.ok) throw new Error('Failed to fetch receipts');
        const allReceipts = await response.json();
        // Filter receipts for this specific bill
        const billReceipts = allReceipts.filter((receipt: any) => receipt.bill_id === billId);
        console.log('Direct receipts fetch for bill:', billId, billReceipts);
        
        // Also try the original patient-bills endpoint as fallback
        try {
          const fallbackResponse = await fetch(`${baseUrl}/patient-bills/${billId}/receipts`);
          if (fallbackResponse.ok) {
            const fallbackReceipts = await fallbackResponse.json();
            console.log('Fallback receipts from patient-bills endpoint:', fallbackReceipts);
            
            // Merge receipts, avoiding duplicates
            const mergedReceipts = [...billReceipts];
            fallbackReceipts.forEach((fallbackReceipt: any) => {
              if (!billReceipts.find(r => r.id === fallbackReceipt.id)) {
                mergedReceipts.push(fallbackReceipt);
              }
            });
            console.log('Merged receipts:', mergedReceipts);
            return mergedReceipts;
          }
        } catch (fallbackError) {
          console.log('Fallback endpoint failed, using primary results');
        }
        
        return billReceipts;
      } catch (error) {
        console.error('Error fetching receipts:', error);
        throw error;
      }
    },

    async addPayment(payment: any): Promise<void> {
      try {
        const paymentPayload = {
          amount: payment.amount,
          payment_method: payment.paymentMethod,
          payment_date: payment.paymentDate,
          notes: payment.notes,
          from_lease: payment.fromLease,
          lease_details: payment.leaseDetails,
          paidServiceIndexes: payment.paidServiceIndexes, // Add the service indexes
          cashierName: payment.cashierName,
          cashierId: payment.cashierId
        };
        
        console.log('Payment payload being sent:', paymentPayload);
        console.log('paidServiceIndexes value:', payment.paidServiceIndexes);
        
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/patient-bills/${payment.billId}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentPayload),
        });
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Payment API Error Response:', errorData);
          console.error('Response Status:', response.status);
          console.error('Response Headers:', response.headers);
          throw new Error(`Failed to add payment: ${response.status} - ${errorData}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error adding payment:', error);
        throw error;
      }
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    if (!user?.clinic) return;
    
    try {
      setLoading(true);
      const bills = await patientBillsApi.getByClinic(user.clinic);
      setBills(bills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients for new bill modal
  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    }
  };

  // Fetch services for new bill modal
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setAvailableServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch services');
    }
  };

  // Handle opening new bill modal
  const handleOpenNewBillModal = () => {
    setShowNewBillModal(true);
    fetchPatients();
    fetchServices();
  };

  // Handle service selection for new bill
  const handleToggleService = (service: any) => {
    const existingIndex = newBillData.selectedServices.findIndex(s => s.serviceId === service.id);
    
    if (existingIndex >= 0) {
      // Remove service
      setNewBillData({
        ...newBillData,
        selectedServices: newBillData.selectedServices.filter(s => s.serviceId !== service.id)
      });
    } else {
      // Add service with default quantity 1
      setNewBillData({
        ...newBillData,
        selectedServices: [
          ...newBillData.selectedServices,
          {
            serviceId: service.id,
            serviceName: service.service_name || service.name,
            price: parseFloat(service.price),
            quantity: 1
          }
        ]
      });
    }
  };

  // Update service quantity
  const handleUpdateServiceQuantity = (serviceId: string, quantity: number) => {
    setNewBillData({
      ...newBillData,
      selectedServices: newBillData.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, quantity: Math.max(1, quantity) } : s
      )
    });
  };

  // Create new bill
  const handleCreateBill = async () => {
    // Validate patient information
    if (!newBillData.isWalkIn && !newBillData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    if (newBillData.isWalkIn) {
      if (!newBillData.walkInPatient.fullName.trim()) {
        toast.error('Please enter patient full name');
        return;
      }
    }

    if (newBillData.selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setCreatingBill(true);
    try {
      let patientId, patientName;

      if (newBillData.isWalkIn) {
        // For walk-in patients, use a temporary ID and the entered name
        patientId = `WALKIN-${Date.now()}`;
        patientName = newBillData.walkInPatient.fullName;
      } else {
        // For existing patients, get from database
        const patient = patients.find(p => p.id === newBillData.patientId);
        patientId = patient.patient_id || patient.id;
        patientName = `${patient.first_name} ${patient.last_name}`;
      }
      
      // Build services array
      const services = newBillData.selectedServices.map(s => ({
        serviceName: s.serviceName,
        name: s.serviceName,
        service_name: s.serviceName,
        quantity: s.quantity,
        unitPrice: s.price,
        unit_price: s.price,
        totalPrice: s.price * s.quantity,
        total_price: s.price * s.quantity,
        price: s.price * s.quantity,
        date: new Date().toISOString()
      }));

      const totalAmount = services.reduce((sum, s) => sum + s.totalPrice, 0);

      // Build notes with walk-in patient info if applicable
      let notes = newBillData.notes || 'Bill created from billing page';
      if (newBillData.isWalkIn) {
        notes += `\nWalk-in Patient - Age: ${newBillData.walkInPatient.age || 'N/A'}, Gender: ${newBillData.walkInPatient.gender || 'N/A'}, Phone: ${newBillData.walkInPatient.phone || 'N/A'}`;
      }

      const billData = {
        patient_id: patientId,
        patient_name: patientName,
        clinic_id: parseInt(user?.clinic || '1'),
        total_amount: totalAmount,
        paid_amount: 0,
        balance_amount: totalAmount,
        status: 'pending',
        services: JSON.stringify(services),
        notes: notes,
        created_by: user?.displayName || 'Unknown',
        bill_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await fetch('/api/patient-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      if (!response.ok) throw new Error('Failed to create bill');

      toast.success('Bill created successfully');
      setShowNewBillModal(false);
      setNewBillData({
        patientId: '',
        isWalkIn: false,
        walkInPatient: {
          fullName: '',
          age: '',
          phone: '',
          gender: ''
        },
        selectedServices: [],
        notes: ''
      });
      setServiceSearchTerm('');
      fetchBills();
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    } finally {
      setCreatingBill(false);
    }
  };

  // Handle service toggle for add item modal
  const handleToggleAddItemService = (service: any) => {
    const existingIndex = addItemData.selectedServices.findIndex(s => s.serviceId === service.id);
    
    if (existingIndex >= 0) {
      setAddItemData({
        selectedServices: addItemData.selectedServices.filter(s => s.serviceId !== service.id)
      });
    } else {
      setAddItemData({
        selectedServices: [
          ...addItemData.selectedServices,
          {
            serviceId: service.id,
            serviceName: service.service_name || service.name,
            price: parseFloat(service.price),
            quantity: 1
          }
        ]
      });
    }
  };

  // Update service quantity for add item modal
  const handleUpdateAddItemQuantity = (serviceId: string, quantity: number) => {
    setAddItemData({
      selectedServices: addItemData.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, quantity: Math.max(1, quantity) } : s
      )
    });
  };

  // Add items to existing bill
  const handleAddItemsToBill = async () => {
    if (!selectedBill) return;

    if (addItemData.selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setAddingItems(true);
    try {
      // Build new services array
      const newServices = addItemData.selectedServices.map(s => ({
        serviceName: s.serviceName,
        name: s.serviceName,
        service_name: s.serviceName,
        quantity: s.quantity,
        unitPrice: s.price,
        unit_price: s.price,
        totalPrice: s.price * s.quantity,
        total_price: s.price * s.quantity,
        price: s.price * s.quantity,
        date: new Date().toISOString()
      }));

      const response = await fetch(`/api/patient-bills/${selectedBill.id}/add-services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: newServices })
      });

      if (!response.ok) throw new Error('Failed to add items to bill');

      toast.success('Items added to bill successfully');
      setShowAddItemModal(false);
      setAddItemData({ selectedServices: [] });
      setAddItemSearchTerm('');
      
      // Refresh bills and update selected bill
      await fetchBills();
      const updatedBills = await patientBillsApi.getByClinic(user?.clinic || '1');
      const updatedBill = updatedBills.find(b => b.id === selectedBill.id);
      if (updatedBill) {
        setSelectedBill(updatedBill);
      }
    } catch (error) {
      console.error('Error adding items to bill:', error);
      toast.error('Failed to add items to bill');
    } finally {
      setAddingItems(false);
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Bill['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Partial</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const handleViewBill = async (bill: Bill) => {
    setSelectedBill(bill);
    setSelectedServices([]);
    
    // Fetch receipts to determine which services have been paid for
    try {
      const receipts = await patientBillsApi.getReceipts(bill.id);
      console.log('=== BILL SERVICES DEBUG ===');
      console.log('Bill ID:', bill.id);
      console.log('Bill services:', bill.services.map((s: any, i: number) => ({
        index: i,
        name: s.serviceName || s.name || s.service_name,
        price: s.totalPrice || s.total_price || s.price
      })));
      console.log('Fetched receipts for bill:', bill.id, receipts);
      
      const paidIndexes = new Set<number>();
      
      receipts.forEach((receipt: any) => {
        console.log('Processing receipt:', receipt.receipt_number, 'Status:', receipt.status);
        console.log('Receipt paid_services:', receipt.paid_services);
        console.log('Receipt service_details:', receipt.service_details);
        
        // Only process active receipts (not voided or refunded)
        if (receipt.status === 'active') {
          console.log('Processing active receipt:', receipt.receipt_number);
          
          if (receipt.paid_services && Array.isArray(receipt.paid_services)) {
            console.log('Found paid_services array:', receipt.paid_services);
            receipt.paid_services.forEach((indexStr: string | number) => {
              const index = typeof indexStr === 'string' ? parseInt(indexStr) : indexStr;
              if (!isNaN(index)) {
                console.log('Adding paid service index from paid_services:', index);
                paidIndexes.add(index);
              } else {
                console.log('Invalid service index:', indexStr);
              }
            });
          } else {
            console.log('No paid_services array found or not an array');
          }
          
          // Also check service_details for service names/indexes
          if (receipt.service_details && Array.isArray(receipt.service_details)) {
            console.log('Found service_details array:', receipt.service_details);
            receipt.service_details.forEach((serviceDetail: any) => {
              if (typeof serviceDetail.index === 'number') {
                console.log('Adding paid service index from service_details:', serviceDetail.index);
                paidIndexes.add(serviceDetail.index);
              } else {
                console.log('Service detail missing valid index:', serviceDetail);
              }
            });
          } else {
            console.log('No service_details array found or not an array');
          }
        } else {
          console.log('Skipping non-active receipt:', receipt.receipt_number, 'Status:', receipt.status);
        }
      });
      
      console.log('=== FINAL PAID INDEXES ===');
      console.log('Final paid service indexes:', Array.from(paidIndexes));
      console.log('Services that will show as PAID:');
      Array.from(paidIndexes).forEach(index => {
        const service = bill.services[index];
        if (service) {
          console.log(`  Index ${index}: ${service.serviceName || service.name || service.service_name}`);
        }
      });
      console.log('=== END DEBUG ===');
      
      setPaidServiceIndexes(paidIndexes);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setPaidServiceIndexes(new Set());
    }
    
    setShowBillDetails(true);
  };

  const handleAddPayment = (bill: Bill) => {
    // If no services are selected, auto-select all unpaid services
    let servicesToPay: string[];
    
    if (selectedServices.length === 0) {
      // Auto-select all unpaid services
      servicesToPay = bill.services
        .map((_, index) => index.toString())
        .filter(indexStr => !paidServiceIndexes.has(parseInt(indexStr)));
    } else {
      // Filter out already paid services from selected services
      servicesToPay = selectedServices.filter(indexStr => {
        const index = parseInt(indexStr);
        return !paidServiceIndexes.has(index);
      });
    }

    if (servicesToPay.length === 0) {
      toast.error('All selected services have already been paid for');
      return;
    }

    // Calculate amount for unpaid services
    const selectedAmount = servicesToPay.reduce((total, serviceIndex) => {
      const service = bill.services[parseInt(serviceIndex)];
      return total + (service?.totalPrice || 0);
    }, 0);

    setSelectedBill(bill);
    
    setPaymentData({
      billId: bill.id,
      amount: selectedAmount,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Payment for ${servicesToPay.length} selected services`,
      fromLease: false,
      leaseDetails: '',
      cashierName: user?.displayName || 'Unknown',
      cashierId: user?.id || '',
      paidServiceIndexes: servicesToPay // Services that will be paid for
    });
    setShowPaymentForm(true);
  };

  const handleSavePayment = async () => {
    if (!selectedBill || paymentData.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentData.amount > selectedBill.balanceAmount) {
      toast.error('Payment amount cannot exceed balance due');
      return;
    }

    if (paymentData.fromLease && !paymentData.leaseDetails.trim()) {
      toast.error('Please provide lease details when payment is from lease');
      return;
    }

    try {
      setPaymentLoading(true);
      
      console.log('Payment data before API call:', paymentData);
      console.log('Selected services:', selectedServices);
      console.log('paidServiceIndexes in paymentData:', paymentData.paidServiceIndexes);
      
      // CRITICAL: Use selectedServices (the checkboxes that are checked) as paidServiceIndexes
      // selectedServices contains the actual service indexes the user selected to pay for
      const finalPaymentData = {
        ...paymentData,
        paidServiceIndexes: selectedServices.length > 0 ? selectedServices : paymentData.paidServiceIndexes
      };
      
      console.log('Final payment data with service indexes:', finalPaymentData);
      console.log('paidServiceIndexes being sent to API:', finalPaymentData.paidServiceIndexes);
      console.log('Type of paidServiceIndexes:', typeof finalPaymentData.paidServiceIndexes, Array.isArray(finalPaymentData.paidServiceIndexes));
      
      const response = await patientBillsApi.addPayment(finalPaymentData);
      
      // Store payment data for receipt with only paid services
      // Use finalPaymentData.paidServiceIndexes which has the actual service indexes
      const paidServices = (finalPaymentData.paidServiceIndexes || []).map(indexStr => {
        const index = parseInt(indexStr);
        const service = selectedBill.services[index];
        if (!service) return null;
        return {
          id: service.id || `service-${index}`,
          serviceName: service.serviceName || service.name || service.service_name || service.test_name || 'Unknown Service',
          name: service.serviceName || service.name || service.service_name || service.test_name || 'Unknown Service',
          service_name: service.serviceName || service.name || service.service_name || service.test_name || 'Unknown Service',
          quantity: service.quantity || 1,
          unitPrice: service.unitPrice || service.unit_price || service.price || 0,
          unit_price: service.unitPrice || service.unit_price || service.price || 0,
          totalPrice: service.totalPrice || service.total_price || service.price || 0,
          total_price: service.totalPrice || service.total_price || service.price || 0,
          price: service.totalPrice || service.total_price || service.price || 0
        };
      }).filter(Boolean);

      setLastPayment({
        ...paymentData,
        id: `PAY-${Date.now()}`,
        cashierName: user?.displayName || 'Unknown',
        cashierId: user?.id || '',
        paidServices: paidServices // Only the services that were actually paid for
      });
      
      toast.success('Payment added successfully');
      setShowPaymentForm(false);
      setSelectedServices([]); // Clear selected services after payment
      await fetchBills(); // Refresh bills to show updated amounts
      
      // Refresh paid service status for the current bill
      if (selectedBill) {
        try {
          const receipts = await patientBillsApi.getReceipts(selectedBill.id);
          console.log('Refreshing receipts for bill:', selectedBill.id, receipts);
          
          const paidIndexes = new Set<number>();
          
          receipts.forEach((receipt: any) => {
            console.log('Refresh - Processing receipt:', receipt.receipt_number, 'Status:', receipt.status);
            console.log('Refresh - Receipt paid_services:', receipt.paid_services);
            console.log('Refresh - Receipt service_details:', receipt.service_details);
            
            // Only process active receipts (not voided or refunded)
            if (receipt.status === 'active') {
              if (receipt.paid_services && Array.isArray(receipt.paid_services)) {
                receipt.paid_services.forEach((indexStr: string | number) => {
                  const index = typeof indexStr === 'string' ? parseInt(indexStr) : indexStr;
                  console.log('Refresh - Adding paid service index:', index);
                  paidIndexes.add(index);
                });
              }
              
              // Also check service_details for service names/indexes
              if (receipt.service_details && Array.isArray(receipt.service_details)) {
                receipt.service_details.forEach((serviceDetail: any) => {
                  if (typeof serviceDetail.index === 'number') {
                    console.log('Refresh - Adding paid service index from service_details:', serviceDetail.index);
                    paidIndexes.add(serviceDetail.index);
                  }
                });
              }
            }
          });
          
          console.log('Refresh - Final paid service indexes:', Array.from(paidIndexes));
          setPaidServiceIndexes(paidIndexes);
        } catch (error) {
          console.error('Error refreshing paid service status:', error);
        }
      }
      
      // Show receipt after successful payment
      setShowReceipt(true);
    } catch (error: any) {
      console.error('Error saving payment:', error);
      
      // Check if error is due to missing active shift
      if (error?.response?.data?.requiresShift || error?.response?.status === 403) {
        toast.error('No active cashier shift found. Redirecting to start shift...');
        setTimeout(() => {
          window.location.href = '/cashier/shift';
        }, 2000);
      } else {
        toast.error(error?.response?.data?.error || 'Failed to save payment');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentData({
      billId: '',
      amount: 0,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
      fromLease: false,
      leaseDetails: '',
      cashierName: user?.displayName || 'Unknown',
      cashierId: user?.id || '',
      paidServiceIndexes: []
    });
    setShowPaymentForm(false);
  };

  const handlePrintReceipt = () => {
    const receiptElement = document.getElementById('payment-receipt');
    if (receiptElement) {
      printThermalReceipt(receiptElement);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastPayment(null);
  };

  const handleReprintReceipt = (bill: Bill) => {
    // Create a mock payment object for reprinting
    const mockPayment: Payment = {
      id: `REPRINT-${Date.now()}`,
      billId: bill.id,
      amount: bill.paidAmount, // Use the total paid amount
      paymentMethod: 'cash', // Default method for reprint
      paymentDate: new Date().toISOString().split('T')[0],
      notes: 'Receipt Reprint',
      fromLease: false,
      leaseDetails: '',
      cashierName: user?.displayName || 'System',
      cashierId: user?.id || ''
    };
    
    setSelectedBill(bill);
    setLastPayment(mockPayment);
    setShowReceipt(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patients Bill</h1>
            <p className="text-muted-foreground mt-1">
              Manage patient billing and payments • {user?.clinic}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{bills.length}</span>
              <span className="text-xs text-muted-foreground">Total Bills</span>
            </div>
            <Button className="quick-action-btn" onClick={handleOpenNewBillModal}>
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Bill</span>
            </Button>
          </div>
        </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by bill number, patient name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-9 px-4"
            >
              Clear Search
            </Button>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading bills...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? 'No bills found' : 'No bills recorded'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or clear the search to see all bills.'
                : 'Get started by creating your first bill.'
              }
            </p>
            {!searchTerm && (
              <Button className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Create First Bill
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Bill Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Patient Details</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Payment</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-primary text-sm">
                        {bill.billNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{bill.patientName}</span>
                        <span className="text-sm text-muted-foreground">
                          • ID: {bill.patientId}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {new Date(bill.billDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="font-medium text-foreground">
                          SSP {bill.totalAmount.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          • Total
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-green-600">SSP {bill.paidAmount.toFixed(2)}</span>
                          <span className="text-muted-foreground text-xs">paid</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${bill.balanceAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                            SSP {bill.balanceAmount.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground text-xs">balance</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleViewBill(bill)}
                          className="bg-success hover:bg-success/90 text-white shadow-sm"
                          title="View Bill Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {bill.balanceAmount > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleAddPayment(bill)}
                            className="bg-primary hover:bg-primary/90 text-white shadow-sm ml-1"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      <Dialog open={showBillDetails} onOpenChange={setShowBillDetails}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          {/* Header Section */}
          <div className="flex-shrink-0 border-b bg-muted/30 -mx-6 -mt-6 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-foreground">Bill Details</DialogTitle>
                {selectedBill && (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Bill Number:</span>
                      <span className="font-semibold">{selectedBill.billNumber}</span>
                      {getStatusBadge(selectedBill.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Patient:</span>
                      <span className="font-semibold">{selectedBill.patientName}</span>
                      <span className="text-muted-foreground">({selectedBill.patientId})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Bill Date:</span>
                      <span className="font-medium">
                        {new Date(selectedBill.billDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">
                        {selectedBill.dueDate ? new Date(selectedBill.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Not set'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Financial Summary & Action */}
              <div className="text-right space-y-2">
                {selectedBill && (
                  <div className="bg-background rounded-lg p-3 border shadow-sm min-w-[280px]">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">SSP {selectedBill.totalAmount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">SSP {selectedBill.paidAmount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Paid</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${selectedBill.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          SSP {selectedBill.balanceAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedBill?.balanceAmount > 0 && (
                  <Button
                    onClick={() => handleAddPayment(selectedBill)}
                    className="w-full gap-2"
                    disabled={selectedServices.length === 0}
                  >
                    <DollarSign className="w-4 h-4" />
                    Add Payment ({selectedServices.length} items)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          {selectedBill && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-12 gap-4 h-full">
                  {/* Services & Items Table - 8 columns */}
                  <div className="col-span-8">
                    <div className="bg-card rounded-lg border border-border overflow-hidden h-full flex flex-col">
                      <div className="bg-muted/50 px-4 py-3 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground">Services & Items</h3>
                            <span className="text-sm text-muted-foreground">({selectedBill.services.length} items)</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddItemModal(true);
                              if (availableServices.length === 0) {
                                fetchServices();
                              }
                            }}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full">
                          <thead className="bg-background border-b border-border sticky top-0">
                            <tr>
                              <th className="text-center py-3 px-4 font-semibold text-sm text-foreground w-12">
                                <Checkbox
                                  checked={selectedServices.length === selectedBill.services.length && selectedBill.services.length > 0}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedServices(selectedBill.services.map((_, index) => index.toString()));
                                    } else {
                                      setSelectedServices([]);
                                    }
                                  }}
                                />
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Status</th>
                              <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Service</th>
                              <th className="text-center py-3 px-4 font-semibold text-sm text-foreground">Qty</th>
                              <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Unit Price</th>
                              <th className="text-right py-3 px-4 font-semibold text-sm text-foreground">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {selectedBill.services.map((service: any, index) => {
                              // Check if this specific service has been paid for based on receipts
                              const isPaidFromReceipts = paidServiceIndexes.has(index);
                              const serviceStatus = isPaidFromReceipts ? 'paid' : 'pending';
                              
                              console.log(`Service ${index} (${service.serviceName || service.name || service.service_name}):`, {
                                index,
                                serviceName: service.serviceName || service.name || service.service_name,
                                isPaidFromReceipts,
                                serviceStatus,
                                paidServiceIndexes: Array.from(paidServiceIndexes),
                                serviceData: service
                              });
                              
                              const getStatusIndicator = (status: string) => {
                                switch (status) {
                                  case 'paid':
                                    return (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-xs font-medium text-green-700">Paid</span>
                                      </div>
                                    );
                                  case 'voided':
                                    return (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-xs font-medium text-red-700">Voided</span>
                                      </div>
                                    );
                                  default:
                                    return (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                                        <span className="text-xs font-medium text-gray-800">Pending</span>
                                      </div>
                                    );
                                }
                              };

                              const isPaid = serviceStatus === 'paid';
                              const rowClass = isPaid 
                                ? "bg-green-100 border-green-300 hover:bg-green-200 transition-colors border-l-4 border-l-green-600" 
                                : "hover:bg-muted/20 transition-colors";

                              return (
                                <tr key={service.id || index} className={rowClass}>
                                  <td className="py-3 px-4 text-center">
                                    <Checkbox
                                      checked={selectedServices.includes(index.toString())}
                                      disabled={isPaid}
                                      onCheckedChange={(checked) => {
                                        if (isPaid) return; // Don't allow selection of paid services
                                        if (checked) {
                                          setSelectedServices([...selectedServices, index.toString()]);
                                        } else {
                                          setSelectedServices(selectedServices.filter(id => id !== index.toString()));
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    {getStatusIndicator(serviceStatus)}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className={`font-medium ${isPaid ? 'text-green-700' : 'text-foreground'}`}>
                                      {service.serviceName || service.name || service.service_name || service.test_name || 'Unknown Service'}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center justify-center min-w-[32px] h-6 bg-muted rounded text-sm font-medium">
                                      {service.quantity}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`font-mono text-sm ${isPaid ? 'text-green-800' : ''}`}>
                                      SSP {(service.unitPrice || service.price || service.unit_price || 0).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`font-mono font-semibold ${isPaid ? 'text-green-800' : ''}`}>
                                      SSP {(service.totalPrice || service.total_price || service.price || 0).toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Payment Card - 4 columns */}
                  <div className="col-span-4">
                    <div className="bg-card rounded-lg border border-border h-full flex flex-col">
                      <div className="bg-muted/50 px-4 py-3 border-b flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-foreground">Payment</h3>
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 space-y-4">
                        {/* Selected Items Summary */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="text-sm font-medium text-foreground mb-2">Selected Items</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {selectedServices.length} of {selectedBill.services.length} items selected
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            SSP {selectedServices.reduce((total, serviceIndex) => {
                              const service = selectedBill.services[parseInt(serviceIndex)];
                              return total + (service?.totalPrice || 0);
                            }, 0).toFixed(2)}
                          </div>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Payment Method</Label>
                            <Select 
                              value={quickPaymentData.paymentMethod} 
                              onValueChange={(value: any) => setQuickPaymentData({...quickPaymentData, paymentMethod: value})}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="lease">Lease</SelectItem>
                                <SelectItem value="insurance">Insurance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Amount Tendered</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={quickPaymentData.amountTendered}
                              onChange={(e) => setQuickPaymentData({...quickPaymentData, amountTendered: e.target.value})}
                              className="font-mono"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Notes (Optional)</Label>
                            <Textarea
                              placeholder="Payment notes..."
                              value={quickPaymentData.notes}
                              onChange={(e) => setQuickPaymentData({...quickPaymentData, notes: e.target.value})}
                              rows={2}
                              className="text-sm"
                            />
                          </div>

                          {/* Change Calculation */}
                          {quickPaymentData.amountTendered && (
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="text-sm font-medium text-blue-900">Change Due</div>
                              <div className="text-lg font-bold text-blue-900">
                                SSP {Math.max(0, parseFloat(quickPaymentData.amountTendered) - selectedServices.reduce((total, serviceIndex) => {
                                  const service = selectedBill.services[parseInt(serviceIndex)];
                                  return total + (service?.totalPrice || 0);
                                }, 0)).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Save Payment Button */}
                        <div className="pt-2">
                          <Button 
                            className="w-full gap-2" 
                            disabled={selectedServices.length === 0 || !quickPaymentData.amountTendered || parseFloat(quickPaymentData.amountTendered) < selectedServices.reduce((total, serviceIndex) => {
                              const service = selectedBill.services[parseInt(serviceIndex)];
                              return total + (service?.totalPrice || 0);
                            }, 0)}
                            onClick={async () => {
                              const selectedAmount = selectedServices.reduce((total, serviceIndex) => {
                                const service = selectedBill.services[parseInt(serviceIndex)];
                                return total + (service?.totalPrice || 0);
                              }, 0);

                              console.log('Processing payment for selected services:', {
                                selectedServices,
                                selectedAmount,
                                billId: selectedBill.id
                              });

                              const paymentData: Payment = {
                                billId: selectedBill.id,
                                amount: selectedAmount,
                                paymentMethod: quickPaymentData.paymentMethod,
                                paymentDate: new Date().toISOString().split('T')[0],
                                notes: quickPaymentData.notes || `Payment for ${selectedServices.length} selected services`,
                                fromLease: quickPaymentData.paymentMethod === 'lease',
                                leaseDetails: quickPaymentData.paymentMethod === 'lease' ? quickPaymentData.notes : '',
                                cashierName: user?.displayName || 'Unknown',
                                cashierId: user?.id || '',
                                paidServiceIndexes: selectedServices
                              };

                              console.log('Payment data being sent:', paymentData);

                              try {
                                setPaymentLoading(true);
                                console.log('Calling addPayment API...');
                                const result = await patientBillsApi.addPayment(paymentData);
                                console.log('Payment API response:', result);
                                
                                // Get the services that were paid for in this quick payment
                                const quickPaidServices = selectedServices.map(indexStr => {
                                  const index = parseInt(indexStr);
                                  const service = selectedBill.services[index];
                                  return {
                                    id: service.id || `service-${index}`,
                                    serviceName: service.serviceName || service.name || service.service_name || service.test_name || 'Unknown Service',
                                    name: service.serviceName || service.name || service.service_name || service.test_name || 'Unknown Service',
                                    service_name: service.serviceName || service.name || service.service_name || service.test_name || 'Unknown Service',
                                    quantity: service.quantity || 1,
                                    unitPrice: service.unitPrice || service.unit_price || service.price || 0,
                                    unit_price: service.unitPrice || service.unit_price || service.price || 0,
                                    totalPrice: service.totalPrice || service.total_price || service.price || 0,
                                    total_price: service.totalPrice || service.total_price || service.price || 0,
                                    price: service.totalPrice || service.total_price || service.price || 0
                                  };
                                });

                                setLastPayment({
                                  ...paymentData,
                                  id: `PAY-${Date.now()}`,
                                  paidServices: quickPaidServices
                                });
                                
                                toast.success(`Payment of SSP ${selectedAmount.toFixed(2)} saved successfully`);
                                setQuickPaymentData({ paymentMethod: 'cash', amountTendered: '', notes: '' });
                                setSelectedServices([]);
                                
                                console.log('Refreshing bills data...');
                                await fetchBills();
                                
                                // Close the bill details modal and show receipt
                                setShowBillDetails(false);
                                setShowReceipt(true);
                              } catch (error) {
                                console.error('Payment save error:', error);
                                toast.error(`Failed to save payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
                              } finally {
                                setPaymentLoading(false);
                              }
                            }}
                          >
                            {paymentLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save Payment
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Form Modal */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedBill?.patientName}'s bill
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-4">
              {/* Bill Info */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Bill:</span> {selectedBill.billNumber}</div>
                  <div><span className="font-medium">Balance Due:</span> <span className="text-red-600 font-semibold">SSP {selectedBill.balanceAmount.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Services to Pay For</Label>
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {selectedBill.services.map((service: any, index: number) => {
                    const isPaid = paidServiceIndexes.has(index);
                    const isSelected = paymentData.paidServiceIndexes?.includes(index.toString());
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${isPaid ? 'bg-green-50 opacity-60' : 'hover:bg-muted/50'}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isPaid}
                          onCheckedChange={(checked) => {
                            const currentIndexes = paymentData.paidServiceIndexes || [];
                            let newIndexes: string[];
                            
                            if (checked) {
                              newIndexes = [...currentIndexes, index.toString()];
                            } else {
                              newIndexes = currentIndexes.filter(i => i !== index.toString());
                            }
                            
                            // Recalculate amount based on selected services
                            const newAmount = newIndexes.reduce((total, idx) => {
                              const svc = selectedBill.services[parseInt(idx)];
                              return total + (svc?.totalPrice || 0);
                            }, 0);
                            
                            setPaymentData({
                              ...paymentData,
                              paidServiceIndexes: newIndexes,
                              amount: newAmount
                            });
                          }}
                        />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isPaid ? 'text-green-700' : 'text-foreground'}`}>
                            {service.serviceName || service.name || service.service_name || 'Unknown Service'}
                            {isPaid && <span className="ml-2 text-xs text-green-600">(Paid)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Qty: {service.quantity || 1} × SSP {(service.unitPrice || service.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          SSP {(service.totalPrice || service.price || 0).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedBill.balanceAmount}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                  placeholder="Enter payment amount"
                  className="font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Amount is auto-calculated based on selected services. You can adjust if needed.
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value: Payment['paymentMethod']) => setPaymentData({...paymentData, paymentMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="lease">Lease Payment</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                />
              </div>

              {/* From Lease Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fromLease"
                  checked={paymentData.fromLease}
                  onCheckedChange={(checked) => setPaymentData({...paymentData, fromLease: checked as boolean})}
                />
                <Label htmlFor="fromLease" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Payment from lease agreement
                </Label>
              </div>

              {/* Lease Details */}
              {paymentData.fromLease && (
                <div className="space-y-2">
                  <Label htmlFor="leaseDetails">Lease Details *</Label>
                  <Textarea
                    id="leaseDetails"
                    value={paymentData.leaseDetails}
                    onChange={(e) => setPaymentData({...paymentData, leaseDetails: e.target.value})}
                    placeholder="Enter lease agreement details, reference number, etc."
                    rows={3}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  placeholder="Additional notes about this payment"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={resetPaymentForm}
                  disabled={paymentLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePayment}
                  disabled={paymentLoading || paymentData.amount <= 0}
                >
                  {paymentLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Payment processed successfully
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && lastPayment && (
            <div className="flex flex-col space-y-4 flex-1 min-h-0">
              {/* Receipt Preview */}
              <div className="border rounded-lg p-3 bg-gray-50 overflow-y-auto flex-1 min-h-0">
                <div id="payment-receipt" className="w-full">
                  <PaymentReceipt
                    bill={{
                      ...selectedBill,
                      services: lastPayment.paidServices || selectedBill.services || [], // Show paid services or all services as fallback
                      balanceAmount: selectedBill.balanceAmount // This will be the updated balance after payment
                    }}
                    payment={{
                      amount: lastPayment.amount,
                      method: lastPayment.paymentMethod,
                      date: lastPayment.paymentDate,
                      notes: lastPayment.notes,
                      from_lease: lastPayment.fromLease,
                      lease_details: lastPayment.leaseDetails,
                      cashierName: lastPayment.cashierName,
                      cashierId: lastPayment.cashierId
                    }}
                    clinicName={user?.clinic || 'Medical Clinic'}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 flex-shrink-0 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={handleCloseReceipt}
                >
                  Close
                </Button>
                <Button
                  onClick={handlePrintReceipt}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Bill Modal */}
      <Dialog open={showNewBillModal} onOpenChange={setShowNewBillModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
            <DialogDescription>
              Select a patient and services to create a new bill
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Patient Type Toggle */}
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <Label className="text-sm font-semibold">Patient Type:</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="patientType"
                    checked={!newBillData.isWalkIn}
                    onChange={() => setNewBillData({ ...newBillData, isWalkIn: false, patientId: '', walkInPatient: { fullName: '', age: '', phone: '', gender: '' } })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Existing Patient</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="patientType"
                    checked={newBillData.isWalkIn}
                    onChange={() => setNewBillData({ ...newBillData, isWalkIn: true, patientId: '' })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Walk-in Patient</span>
                </label>
              </div>
            </div>

            {/* Patient Information Section */}
            {!newBillData.isWalkIn ? (
              /* Existing Patient Selection */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={newBillData.patientId}
                    onValueChange={(value) => setNewBillData({ ...newBillData, patientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name} - {patient.patient_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newBillData.notes}
                    onChange={(e) => setNewBillData({ ...newBillData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              /* Walk-in Patient Form */
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={newBillData.walkInPatient.fullName}
                      onChange={(e) => setNewBillData({
                        ...newBillData,
                        walkInPatient: { ...newBillData.walkInPatient, fullName: e.target.value }
                      })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      value={newBillData.walkInPatient.age}
                      onChange={(e) => setNewBillData({
                        ...newBillData,
                        walkInPatient: { ...newBillData.walkInPatient, age: e.target.value }
                      })}
                      placeholder="Enter age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newBillData.walkInPatient.phone}
                      onChange={(e) => setNewBillData({
                        ...newBillData,
                        walkInPatient: { ...newBillData.walkInPatient, phone: e.target.value }
                      })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={newBillData.walkInPatient.gender}
                      onValueChange={(value) => setNewBillData({
                        ...newBillData,
                        walkInPatient: { ...newBillData.walkInPatient, gender: value }
                      })}
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newBillData.notes}
                    onChange={(e) => setNewBillData({ ...newBillData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Services Section - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Services Selection (6/12 width) */}
              <div className="lg:col-span-6 space-y-2">
                <Label>Services *</Label>
                {/* Search Field */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search services by name, category, or department..."
                    value={serviceSearchTerm}
                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {availableServices.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading services...
                    </div>
                  ) : (
                    availableServices
                      .filter((service) => {
                        const searchLower = serviceSearchTerm.toLowerCase();
                        const serviceName = (service.service_name || service.name || '').toLowerCase();
                        const category = (service.category || '').toLowerCase();
                        const department = (service.department || '').toLowerCase();
                        return serviceName.includes(searchLower) || 
                               category.includes(searchLower) || 
                               department.includes(searchLower);
                      })
                      .map((service) => {
                      const selected = newBillData.selectedServices.find(s => s.serviceId === service.id);
                      return (
                        <div
                          key={service.id}
                          className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                            selected ? 'bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => handleToggleService(service)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {service.service_name || service.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {service.category} • {service.department || 'N/A'}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            SSP {parseFloat(service.price).toFixed(2)}
                          </div>
                          {selected && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={selected.quantity}
                                onChange={(e) =>
                                  handleUpdateServiceQuantity(service.id, parseInt(e.target.value) || 1)
                                }
                                className="w-16 h-8 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column - Selected Services Summary (6/12 width) */}
              <div className="lg:col-span-6 space-y-2">
                <Label className="text-sm font-semibold">Selected Services Summary</Label>
                {newBillData.selectedServices.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-muted/20 text-center text-sm text-muted-foreground">
                    No services selected yet. Select services from the list to see the summary.
                  </div>
                ) : (
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg border max-h-96 overflow-y-auto">
                    <div className="space-y-1">
                      {newBillData.selectedServices.map((service) => (
                        <div key={service.serviceId} className="flex justify-between text-sm">
                          <span>
                            {service.serviceName} × {service.quantity}
                          </span>
                          <span className="font-semibold">
                            SSP {(service.price * service.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-base font-bold pt-2 border-t">
                        <span>Total Amount:</span>
                        <span>
                          SSP{' '}
                          {newBillData.selectedServices
                            .reduce((sum, s) => sum + s.price * s.quantity, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewBillModal(false);
                  setNewBillData({
                    patientId: '',
                    isWalkIn: false,
                    walkInPatient: {
                      fullName: '',
                      age: '',
                      phone: '',
                      gender: ''
                    },
                    selectedServices: [],
                    notes: ''
                  });
                  setServiceSearchTerm('');
                }}
                disabled={creatingBill}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBill}
                disabled={
                  creatingBill || 
                  (!newBillData.isWalkIn && !newBillData.patientId) ||
                  (newBillData.isWalkIn && !newBillData.walkInPatient.fullName.trim()) ||
                  newBillData.selectedServices.length === 0
                }
              >
                {creatingBill ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Bill
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item to Bill Modal */}
      <Dialog open={showAddItemModal} onOpenChange={setShowAddItemModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Items to Bill</DialogTitle>
            <DialogDescription>
              Select services to add to {selectedBill?.billNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Services Selection */}
            <div className="space-y-2">
              <Label>Services *</Label>
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services by name, category, or department..."
                  value={addItemSearchTerm}
                  onChange={(e) => setAddItemSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {availableServices.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading services...
                  </div>
                ) : (
                  availableServices
                    .filter((service) => {
                      const searchLower = addItemSearchTerm.toLowerCase();
                      const serviceName = (service.service_name || service.name || '').toLowerCase();
                      const category = (service.category || '').toLowerCase();
                      const department = (service.department || '').toLowerCase();
                      return serviceName.includes(searchLower) || 
                             category.includes(searchLower) || 
                             department.includes(searchLower);
                    })
                    .map((service) => {
                      const selected = addItemData.selectedServices.find(s => s.serviceId === service.id);
                      return (
                        <div
                          key={service.id}
                          className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                            selected ? 'bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => handleToggleAddItemService(service)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {service.service_name || service.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {service.category} • {service.department || 'N/A'}
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            SSP {parseFloat(service.price).toFixed(2)}
                          </div>
                          {selected && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={selected.quantity}
                                onChange={(e) =>
                                  handleUpdateAddItemQuantity(service.id, parseInt(e.target.value) || 1)
                                }
                                className="w-16 h-8 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Selected Services Summary */}
            {addItemData.selectedServices.length > 0 && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-semibold">Selected Items Summary</Label>
                <div className="space-y-1">
                  {addItemData.selectedServices.map((service) => (
                    <div key={service.serviceId} className="flex justify-between text-sm">
                      <span>
                        {service.serviceName} × {service.quantity}
                      </span>
                      <span className="font-semibold">
                        SSP {(service.price * service.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Total to Add:</span>
                    <span>
                      SSP{' '}
                      {addItemData.selectedServices
                        .reduce((sum, s) => sum + s.price * s.quantity, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddItemModal(false);
                  setAddItemData({ selectedServices: [] });
                  setAddItemSearchTerm('');
                }}
                disabled={addingItems}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItemsToBill}
                disabled={addingItems || addItemData.selectedServices.length === 0}
              >
                {addingItems ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Bill
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
};

export default PatientsBill;
