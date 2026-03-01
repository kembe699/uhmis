import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Calendar,
  User,
  DollarSign,
  Filter,
  Download,
  Eye,
  Loader2,
  X,
  Printer
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Receipt {
  id: string;
  receipt_number: string;
  bill_id: string;
  patient_id: string;
  patient_name: string;
  clinic_id: number;
  payment_amount: number;
  payment_method: 'cash' | 'card' | 'check' | 'lease' | 'insurance';
  payment_date: string;
  paid_services: string[];
  service_details: Array<{
    index: number;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    department: string;
  }>;
  notes?: string;
  from_lease: boolean;
  lease_details?: string;
  cashier_name?: string;
  cashier_id?: string;
  status: 'active' | 'voided' | 'refunded';
  created_at: string;
  updated_at: string;
}

const Receipts: React.FC = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterCashier, setFilterCashier] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cashiers, setCashiers] = useState<string[]>([]);

  // API client for receipts
  const receiptsApi = {
    async getByClinic(clinicId: string): Promise<Receipt[]> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/receipts/clinic/${clinicId}`);
        if (!response.ok) throw new Error('Failed to fetch receipts');
        return await response.json();
      } catch (error) {
        console.error('Error fetching receipts:', error);
        throw error;
      }
    },

    async getById(receiptId: string): Promise<Receipt> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/receipts/${receiptId}`);
        if (!response.ok) throw new Error('Failed to fetch receipt');
        return await response.json();
      } catch (error) {
        console.error('Error fetching receipt:', error);
        throw error;
      }
    },

    async cancelReceipt(receiptId: string, reason: string): Promise<void> {
      try {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const baseUrl = isLocalhost ? '/api' : `/api`;
        const response = await fetch(`${baseUrl}/receipts/${receiptId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'voided',
            reason: reason
          })
        });
        if (!response.ok) throw new Error('Failed to cancel receipt');
      } catch (error) {
        console.error('Error cancelling receipt:', error);
        throw error;
      }
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    console.log('Receipts fetchReceipts called, user:', user);
    
    try {
      setLoading(true);
      
      // Use default clinic if user clinic not available
      const clinicId = user?.clinic || '1';
      console.log('Fetching receipts for clinic:', clinicId);
      
      const data = await receiptsApi.getByClinic(clinicId);
      console.log('Receipts data received:', data);
      
      setReceipts(data || []);
      
      // Extract unique cashiers from receipts
      const uniqueCashiers = [...new Set((data || []).map(receipt => receipt.cashier_name).filter(Boolean))];
      setCashiers(uniqueCashiers);
      
      console.log('Successfully loaded', (data || []).length, 'receipts');
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setReceipts([]); // Set empty array on error
      setCashiers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || receipt.status === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || receipt.payment_method === filterPaymentMethod;
    const matchesCashier = filterCashier === 'all' || receipt.cashier_name === filterCashier;

    let matchesDateRange = true;
    if (dateRange.from && dateRange.to) {
      const receiptDate = new Date(receipt.payment_date);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDateRange = receiptDate >= fromDate && receiptDate <= toDate;
    }

    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesCashier && matchesDateRange;
  });

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'voided':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Voided</Badge>;
      case 'refunded':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Refunded</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: Receipt['payment_method']) => {
    const colors = {
      cash: 'bg-blue-100 text-blue-800 border-blue-200',
      card: 'bg-purple-100 text-purple-800 border-purple-200',
      check: 'bg-orange-100 text-orange-800 border-orange-200',
      lease: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      insurance: 'bg-teal-100 text-teal-800 border-teal-200'
    };
    
    return <Badge className={colors[method]}>{method.charAt(0).toUpperCase() + method.slice(1)}</Badge>;
  };

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptDetails(true);
  };

  const handleCancelReceipt = async () => {
    if (!selectedReceipt || !cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      await receiptsApi.cancelReceipt(selectedReceipt.id, cancellationReason);
      toast.success('Receipt cancelled successfully');
      setShowCancelModal(false);
      setCancellationReason('');
      fetchReceipts(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling receipt:', error);
      toast.error('Failed to cancel receipt');
    }
  };

  const handleClearSelection = () => {
    setSelectedReceipt(null);
  };

  const handlePrintReceipt = () => {
    if (!selectedReceipt) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the receipt');
      return;
    }

    const currentDate = new Date();
    const receiptId = selectedReceipt.receipt_number;

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
              PAYMENT RECEIPT
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
          </div>

          <!-- Patient Info -->
          <div style="margin-bottom: 12px; font-size: 11px;">
            <div style="font-weight: bold; margin-bottom: 2px;">PATIENT DETAILS:</div>
            <div>Name: ${selectedReceipt.patient_name}</div>
            <div>ID: ${selectedReceipt.patient_id}</div>
            <div>Date: ${new Date(selectedReceipt.payment_date).toLocaleDateString('en-GB')}</div>
          </div>

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Services -->
          <div style="margin-bottom: 12px; font-size: 10px;">
            <div style="font-weight: bold; margin-bottom: 4px;">SERVICES:</div>
            ${selectedReceipt.service_details && selectedReceipt.service_details.length > 0 ? 
              selectedReceipt.service_details.map(service => `
                <div style="margin-bottom: 3px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1; padding-right: 4px;">
                      ${service.serviceName || 'Unknown Service'}
                    </span>
                    <span style="min-width: 60px; text-align: right;">
                      SSP ${(typeof service.totalPrice === 'number' ? service.totalPrice : parseFloat(service.totalPrice) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div style="font-size: 9px; color: #666; padding-left: 4px;">
                    ${service.quantity || 1} x SSP ${(typeof service.unitPrice === 'number' ? service.unitPrice : parseFloat(service.unitPrice) || 0).toFixed(2)}
                  </div>
                </div>
              `).join('') : 
              '<div>No service details available</div>'
            }
          </div>

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Payment Details -->
          <div style="margin-bottom: 12px; font-size: 11px;">
            <div style="font-weight: bold; margin-bottom: 2px;">PAYMENT DETAILS:</div>
            <div style="display: flex; justify-content: space-between;">
              <span>Method:</span>
              <span style="text-transform: capitalize;">${selectedReceipt.payment_method}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Date:</span>
              <span>${new Date(selectedReceipt.payment_date).toLocaleDateString('en-GB')}</span>
            </div>
            <div style="border-top: 1px solid #000; padding-top: 2px; margin-top: 4px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>TOTAL AMOUNT:</span>
                <span>SSP ${(typeof selectedReceipt.payment_amount === 'number' ? selectedReceipt.payment_amount : parseFloat(selectedReceipt.payment_amount) || 0).toFixed(2)}</span>
              </div>
            </div>
            ${selectedReceipt.notes ? `
              <div style="margin-top: 4px;">
                <div style="font-weight: bold; font-size: 10px;">Notes:</div>
                <div style="font-size: 9px; word-wrap: break-word;">
                  ${selectedReceipt.notes}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Divider -->
          <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

          <!-- Cashier Information -->
          ${selectedReceipt.cashier_name ? `
            <div style="margin-bottom: 12px; font-size: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-weight: bold;">RECEIVED BY:</span>
                <span style="font-weight: bold;">${selectedReceipt.cashier_name}</span>
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
              Status: ${selectedReceipt.status.toUpperCase()}
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

  const totalAmount = filteredReceipts.reduce((sum, receipt) => {
    const amount = typeof receipt.payment_amount === 'number' 
      ? receipt.payment_amount 
      : parseFloat(receipt.payment_amount) || 0;
    return sum + amount;
  }, 0);
  const totalReceipts = filteredReceipts.length;

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receipts Management</h1>
            <p className="text-muted-foreground">Complete payment receipt tracking and management system</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Receipts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReceipts}</div>
              <p className="text-xs text-muted-foreground">
                {receipts.filter(r => new Date(r.payment_date).toDateString() === new Date().toDateString()).length} today
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">SSP {totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {totalReceipts} receipts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Receipts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {receipts.filter(r => r.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Active payment receipts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Receipts</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {receipts.filter(r => new Date(r.payment_date).toDateString() === new Date().toDateString()).length}
              </div>
              <p className="text-xs text-muted-foreground">Receipts generated today</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Receipt Records</h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCashier} onValueChange={setFilterCashier}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Cashier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers</SelectItem>
                  {cashiers.map((cashier) => (
                    <SelectItem key={cashier} value={cashier}>
                      {cashier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From Date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-40"
              />

              <Input
                type="date"
                placeholder="To Date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-40"
              />

              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">
                {searchTerm ? 'No receipts found' : 'No receipts available'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search terms or clear the search to see all receipts.'
                  : 'Receipts will appear here as payments are processed.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-32">Receipt #</th>
                      <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-48">Patient</th>
                      <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-32">Amount</th>
                      <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-32">Method</th>
                      <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-32">Date</th>
                      <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-32">Cashier</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {filteredReceipts.slice(0, 10).map((receipt, index) => (
                      <tr 
                        key={receipt.id} 
                        className="hover:bg-muted/10 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setShowReceiptDetails(true);
                        }}
                      >
                        <td className="py-2.5 px-3 w-32">
                          <div className="text-sm font-medium text-foreground truncate">{receipt.receipt_number}</div>
                        </td>
                        <td className="py-2.5 px-3 w-48">
                          <div className="text-sm font-medium text-foreground truncate">{receipt.patient_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{receipt.patient_id}</div>
                        </td>
                        <td className="py-2.5 px-3 w-32">
                          <div className="text-sm font-semibold text-foreground">SSP {(typeof receipt.payment_amount === 'number' ? receipt.payment_amount : parseFloat(receipt.payment_amount) || 0).toFixed(2)}</div>
                        </td>
                        <td className="py-2.5 px-3 w-32">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {receipt.payment_method.charAt(0).toUpperCase() + receipt.payment_method.slice(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 w-32">
                          <div className="text-xs text-muted-foreground">
                            {new Date(receipt.payment_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 w-32">
                          <div className="text-xs text-muted-foreground truncate">{receipt.cashier_name || 'Unknown'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredReceipts.length > 10 && (
                <div className="px-3 py-2 bg-muted/20 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Showing 10 of {filteredReceipts.length} receipts. Scroll to view more or use filters to narrow results.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Receipt Details Modal */}
        <Dialog open={showReceiptDetails} onOpenChange={setShowReceiptDetails}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Receipt Details - {selectedReceipt?.receipt_number}
                  </DialogTitle>
                  <DialogDescription>
                    Items and services for receipt {selectedReceipt?.receipt_number}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintReceipt}
                    className="gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </Button>
                  {selectedReceipt?.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowCancelModal(true)}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel Receipt
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>
            
            {selectedReceipt && (
              <div className="space-y-6">
                {/* Receipt Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receipt Number</p>
                    <p className="text-sm font-semibold text-foreground">{selectedReceipt.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</p>
                    <p className="text-sm font-semibold text-foreground">{selectedReceipt.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedReceipt.patient_id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Amount</p>
                    <p className="text-sm font-semibold text-foreground">SSP {(typeof selectedReceipt.payment_amount === 'number' ? selectedReceipt.payment_amount : parseFloat(selectedReceipt.payment_amount) || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Date</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedReceipt.payment_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Service Items */}
                <div>
                  <h4 className="text-base font-semibold text-foreground mb-3">Service Items</h4>
                  {selectedReceipt.service_details && selectedReceipt.service_details.length > 0 ? (
                    <div className="bg-white rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                          <tr>
                            <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Service</th>
                            <th className="text-left py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Department</th>
                            <th className="text-center py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Qty</th>
                            <th className="text-right py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Unit Price</th>
                            <th className="text-right py-2.5 px-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedReceipt.service_details.map((service, index) => (
                            <tr key={index} className="hover:bg-muted/10">
                              <td className="py-2.5 px-3">
                                <div className="text-sm font-medium text-foreground">{service.serviceName}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="text-sm text-muted-foreground">{service.department || 'General'}</div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="text-sm text-foreground">{service.quantity}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="text-sm text-foreground">SSP {(typeof service.unitPrice === 'number' ? service.unitPrice : parseFloat(service.unitPrice) || 0).toFixed(2)}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="text-sm font-semibold text-foreground">SSP {(typeof service.totalPrice === 'number' ? service.totalPrice : parseFloat(service.totalPrice) || 0).toFixed(2)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/10 rounded-lg">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No service details available for this receipt</p>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Method</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mt-1">
                      {selectedReceipt.payment_method.charAt(0).toUpperCase() + selectedReceipt.payment_method.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cashier</p>
                    <p className="text-sm text-foreground mt-1">{selectedReceipt.cashier_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                    <div className="mt-1">
                      {selectedReceipt.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Active
                        </span>
                      ) : selectedReceipt.status === 'voided' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          Refunded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedReceipt.notes && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</p>
                    <p className="text-sm text-foreground mt-1">{selectedReceipt.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Receipt Modal */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <X className="w-5 h-5 text-destructive" />
                Cancel Receipt
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel receipt {selectedReceipt?.receipt_number}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Cancellation Reason *</label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this receipt..."
                  className="w-full mt-1 p-3 border border-border rounded-md resize-none h-24 text-sm"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelReceipt}
                  disabled={!cancellationReason.trim()}
                >
                  Cancel Receipt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Receipts;
