import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Eye, Edit, Trash2, Check, CheckCircle, Shield, Download, X, FileText, PenTool, Filter, FileSpreadsheet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  town?: string;
}

interface InventoryItem {
  id: string;
  drug_name: string;
  generic_name: string;
  unit_of_measure: string;
  selling_price: number;
  unit_cost: number;
}

interface PurchaseOrderItem {
  id: number;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_of_measure: string;
  type?: 'inventory' | 'expense' | 'asset';
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: string;
  total_amount: number;
  status: 'draft' | 'check' | 'approved' | 'authorized' | 'received' | 'cancelled';
  notes: string;
  items?: PurchaseOrderItem[];
  check_signature?: string;
  check_signed_by?: string;
  check_signed_at?: string;
  approved_signature?: string;
  approved_signed_by?: string;
  approved_signed_at?: string;
  authorized_signature?: string;
  authorized_signed_by?: string;
  authorized_signed_at?: string;
}

const PurchaseOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    supplierSearch: ''
  });
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [itemFormData, setItemFormData] = useState({
    type: 'inventory',
    item_name: '',
    description: '',
    quantity: '',
    unit_price: '',
    unit_of_measure: 'Each',
    is_new_item: false
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchInventory();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/purchase-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/pharmacy/inventory/1'); // Default clinic
      if (response.ok) {
        const data = await response.json();
        setInventory(data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: parseInt(formData.supplier_id),
          order_date: formData.order_date,
          notes: formData.notes
        })
      });
      
      if (!response.ok) throw new Error('Failed to create order');
      
      toast.success('Purchase order created');
      setShowModal(false);
      setFormData({ supplier_id: '', order_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchOrders();
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const addToPendingItems = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem = {
      id: Date.now(), // Temporary ID
      type: itemFormData.type,
      item_name: itemFormData.item_name,
      description: itemFormData.description,
      quantity: parseInt(itemFormData.quantity),
      unit_price: parseFloat(itemFormData.unit_price),
      unit_of_measure: itemFormData.unit_of_measure,
      total_price: parseInt(itemFormData.quantity) * parseFloat(itemFormData.unit_price),
      is_new_item: itemFormData.is_new_item
    };
    
    setPendingItems([...pendingItems, newItem]);
    setItemFormData({
      type: 'inventory',
      item_name: '',
      description: '',
      quantity: '',
      unit_price: '',
      unit_of_measure: 'Each',
      is_new_item: false
    });
    toast.success('Item added to list');
  };

  const removePendingItem = (id: number) => {
    setPendingItems(pendingItems.filter(item => item.id !== id));
  };

  const saveAllItems = async () => {
    if (!selectedOrder || pendingItems.length === 0) return;

    try {
      for (const item of pendingItems) {
        const response = await fetch(`/api/purchase-orders/${selectedOrder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_name: item.item_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit_of_measure: item.unit_of_measure,
            type: item.type
          })
        });
        
        if (!response.ok) throw new Error('Failed to add item');
      }
      
      toast.success(`${pendingItems.length} items added to purchase order`);
      setShowItemModal(false);
      setPendingItems([]);
      setItemFormData({
        type: 'inventory',
        item_name: '',
        description: '',
        quantity: '',
        unit_price: '',
        unit_of_measure: 'Each',
        is_new_item: false
      });
      fetchOrders();
    } catch (error) {
      toast.error('Failed to add items');
    }
  };

  const downloadItemsTable = () => {
    if (pendingItems.length === 0) {
      toast.error('No items to download');
      return;
    }

    const csvContent = [
      ['Type', 'Item Name', 'Description', 'Quantity', 'Unit Price', 'Total Price', 'Unit of Measure'].join(','),
      ...pendingItems.map(item => [
        item.type,
        `"${item.item_name}"`,
        `"${item.description || ''}"`,
        item.quantity,
        item.unit_price,
        item.total_price.toFixed(2),
        item.unit_of_measure
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO-${selectedOrder?.po_number}-items.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPOReport = (order: PurchaseOrder) => {
    const statusLabels = {
      'draft': 'DRAFT - Pending Review',
      'check': 'UNDER REVIEW - Pending Approval',
      'approved': 'APPROVED - Pending Authorization',
      'authorized': 'AUTHORIZED - Ready for Processing',
      'received': 'RECEIVED - Completed',
      'cancelled': 'CANCELLED'
    };

    const currentDate = new Date().toLocaleDateString();
    const orderDate = new Date(order.order_date).toLocaleDateString();
    const supplier = suppliers.find(s => s.id === order.supplier_id);
    const supplierName = supplier ? supplier.name : 'Unknown';
    const supplierAddress = supplier ? supplier.address || '-' : '-';
    const supplierPhone = supplier ? supplier.phone || '-' : '-';
    const supplierEmail = supplier ? supplier.email || '-' : '-';
    const supplierTown = supplier ? supplier.town || '-' : '-';
    
    // Create HTML content for PDF generation matching the template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Purchase Order - ${order.po_number}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #000; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header-title {
            background-color: #87CEEB;
            text-align: center;
            padding: 8px;
            margin: 0 0 20px 0;
            font-weight: bold;
            font-size: 14px;
            color: #000;
          }
          .info-boxes {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-box {
            flex: 1;
            border: 2px solid #000;
            border-radius: 15px;
            padding: 15px;
            background-color: #fff;
          }
          .company-info {
            display: flex;
            align-items: flex-start;
            gap: 10px;
          }
          .logo-placeholder {
            width: 60px;
            height: 60px;
            border: 1px solid #ccc;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #666;
            flex-shrink: 0;
          }
          .company-details {
            flex: 1;
          }
          .company-name {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 3px;
          }
          .info-line {
            margin: 2px 0;
            font-size: 11px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
          }
          .order-info {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
          }
          .order-details {
            display: flex;
            gap: 30px;
          }
          .status-badge {
            background-color: ${order.status === 'draft' ? '#f0f0f0' : 
                              order.status === 'check' ? '#fff3cd' : 
                              order.status === 'approved' ? '#d1ecf1' : 
                              order.status === 'authorized' ? '#d4edda' : '#f0f0f0'};
            color: ${order.status === 'draft' ? '#666' : 
                    order.status === 'check' ? '#856404' : 
                    order.status === 'approved' ? '#0c5460' : 
                    order.status === 'authorized' ? '#155724' : '#666'};
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 14px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 8px 5px;
            text-align: left;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
          }
          .items-table .number-col {
            text-align: center;
            width: 30px;
          }
          .items-table .amount-col {
            text-align: right;
            width: 80px;
          }
          .total-row {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .signatures {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .signature-block {
            margin: 20px 0;
          }
          .signature-line {
            margin: 8px 0;
            display: flex;
            align-items: center;
          }
          .signature-label {
            font-weight: bold;
            width: 100px;
            margin-right: 10px;
          }
          .signature-underline {
            flex: 1;
            border-bottom: 1px solid #000;
            height: 20px;
            margin-right: 10px;
          }
          .signature-date {
            font-size: 11px;
          }
          .terms {
            text-align: center;
            margin-top: 40px;
            font-weight: bold;
            text-decoration: underline;
          }
          .page-number {
            text-align: center;
            margin-top: 30px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header-title">Purchase Order</div>
        
        <div class="info-boxes">
          <div class="info-box">
            <div class="company-info">
              <div class="logo-placeholder">LOGO</div>
              <div class="company-details">
                <div class="company-name">Universal HMIS</div>
                <div class="info-line">www.uhmis.com</div>
                <div class="info-line"><span class="info-label">Branch:</span> Main Hospital</div>
                <div class="info-line"><span class="info-label">Address:</span> Juba, South Sudan</div>
                <div class="info-line"><span class="info-label">Telephone:</span> +211-XXX-XXXX</div>
                <div class="info-line"><span class="info-label">Email:</span> info@uhmis.com</div>
              </div>
            </div>
          </div>
          
          <div class="info-box">
            <div class="info-line"><span class="info-label">Supplier:</span> ${supplierName}</div>
            <div class="info-line"><span class="info-label">Alias:</span> ${supplierName}</div>
            <div class="info-line"><span class="info-label">Address:</span> ${supplierAddress}</div>
            <div class="info-line"><span class="info-label">Telephone:</span> ${supplierPhone}</div>
            <div class="info-line"><span class="info-label">Email:</span> ${supplierEmail}</div>
            <div class="info-line"><span class="info-label">Town:</span> ${supplierTown}</div>
            <div class="info-line"><span class="info-label">Country:</span> South Sudan</div>
          </div>
        </div>

        <div class="order-info">
          <div class="order-details">
            <div><strong>Printed On:</strong> ${currentDate}</div>
            <div><strong>Purchase Order No:</strong> ${order.po_number}</div>
            <div><strong>Order Ref:</strong> ${order.notes || 'N/A'}</div>
          </div>
          <div>
            <div><strong>Order No:</strong> ${order.po_number}</div>
            <div><strong>Created On:</strong> ${orderDate}</div>
            <div><strong>Valid Until:</strong> ${new Date(new Date(order.order_date).getTime() + 30*24*60*60*1000).toLocaleDateString()}</div>
            <div class="status-badge">${statusLabels[order.status] || order.status}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th class="number-col">No</th>
              <th>Name</th>
              <th>Units</th>
              <th class="number-col">Qty</th>
              <th class="amount-col">Rate</th>
              <th class="amount-col">%Disc</th>
              <th class="amount-col">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map((item, index) => `
              <tr>
                <td class="number-col">${index + 1}</td>
                <td>${item.item_name}</td>
                <td>${item.unit_of_measure}</td>
                <td class="number-col">${item.quantity}</td>
                <td class="amount-col">${parseFloat(String(item.unit_price || '0')).toFixed(2)}</td>
                <td class="amount-col">0.00</td>
                <td class="amount-col">${parseFloat(String(item.total_price || '0')).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="6" style="text-align: right; font-weight: bold;">Total:</td>
              <td class="amount-col">${parseFloat(String(order.total_amount || '0')).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div class="signature-block">
              <div class="signature-line">
                <span class="signature-label">Prepared By:</span>
                <span class="signature-underline"></span>
              </div>
              <div class="signature-line">
                <span class="signature-label">Sign:</span>
                <span class="signature-underline"></span>
              </div>
              <div class="signature-line">
                <span class="signature-label">Date:</span>
                <span class="signature-date">${currentDate}</span>
              </div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line">
                <span class="signature-label">Checked By:</span>
                ${order.check_signed_by ? `<span class="signature-name">${order.check_signed_by}</span>` : '<span class="signature-underline"></span>'}
              </div>
              <div class="signature-line">
                <span class="signature-label">Sign:</span>
                ${order.check_signature ? 
                  `<div class="signature-image"><img src="${order.check_signature}" alt="Signature" style="max-height: 30px; max-width: 120px;" /></div>` : 
                  '<span class="signature-underline"></span>'
                }
              </div>
              <div class="signature-line">
                <span class="signature-label">Date:</span>
                <span class="signature-date">${order.check_signed_at ? new Date(order.check_signed_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div class="signature-block">
              <div class="signature-line">
                <span class="signature-label">Approved By:</span>
                ${order.approved_signed_by ? `<span class="signature-name">${order.approved_signed_by}</span>` : '<span class="signature-underline"></span>'}
              </div>
              <div class="signature-line">
                <span class="signature-label">Sign:</span>
                ${order.approved_signature ? 
                  `<div class="signature-image"><img src="${order.approved_signature}" alt="Signature" style="max-height: 30px; max-width: 120px;" /></div>` : 
                  '<span class="signature-underline"></span>'
                }
              </div>
              <div class="signature-line">
                <span class="signature-label">Date:</span>
                <span class="signature-date">${order.approved_signed_at ? new Date(order.approved_signed_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line">
                <span class="signature-label">Authorized By:</span>
                ${order.authorized_signed_by ? `<span class="signature-name">${order.authorized_signed_by}</span>` : '<span class="signature-underline"></span>'}
              </div>
              <div class="signature-line">
                <span class="signature-label">Sign:</span>
                ${order.authorized_signature ? 
                  `<div class="signature-image"><img src="${order.authorized_signature}" alt="Signature" style="max-height: 30px; max-width: 120px;" /></div>` : 
                  '<span class="signature-underline"></span>'
                }
              </div>
              <div class="signature-line">
                <span class="signature-label">Date:</span>
                <span class="signature-date">${order.authorized_signed_at ? new Date(order.authorized_signed_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="terms">Terms And Conditions</div>
        
        <div class="page-number">Page 1</div>
      </body>
      </html>
    `;

    // Create a new window and print to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      toast.success('PDF report generated - use browser print dialog to save as PDF');
    } else {
      toast.error('Unable to open print window. Please allow popups for this site.');
    }
  };

  const handleInventorySelection = (itemName: string) => {
    const selectedInventoryItem = inventory.find(item => item.drug_name === itemName);
    if (selectedInventoryItem) {
      console.log('Selected inventory item:', selectedInventoryItem);
      console.log('Unit of measure from inventory:', selectedInventoryItem.unit_of_measure);
      
      setItemFormData({
        ...itemFormData,
        item_name: itemName,
        unit_price: selectedInventoryItem.unit_cost?.toString() || '',
        unit_of_measure: selectedInventoryItem.unit_of_measure || 'Each',
        description: selectedInventoryItem.generic_name || ''
      });
    }
  };

  // Load user signature on component mount
  useEffect(() => {
    const loadUserSignature = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/users/${user.uid}/signature`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserSignature(data.signature);
        }
      } catch (error) {
        console.error('Error loading user signature:', error);
      }
    };
    loadUserSignature();
  }, [user]);

  // Filter orders based on date range and status
  useEffect(() => {
    let filtered = [...orders];

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.order_date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.order_date) <= new Date(filters.dateTo)
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filter by supplier search
    if (filters.supplierSearch) {
      filtered = filtered.filter(order => {
        const supplierName = getSupplierName(order.supplier_id).toLowerCase();
        return supplierName.includes(filters.supplierSearch.toLowerCase());
      });
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    if (!userSignature) {
      toast.error('Please add your electronic signature in your profile first');
      return;
    }

    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          signature: userSignature,
          signedBy: user?.displayName || 'Unknown User',
          signedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success(`Purchase order marked as ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const exportFilteredOrders = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const csvContent = [
      ['PO Number', 'Supplier', 'Order Date', 'Status', 'Total Amount', 'Items Count', 'Notes'].join(','),
      ...filteredOrders.map(order => [
        order.po_number,
        `"${getSupplierName(order.supplier_id)}"`,
        new Date(order.order_date).toLocaleDateString(),
        order.status,
        parseFloat(String(order.total_amount || '0')).toFixed(2),
        order.items?.length || 0,
        `"${order.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredOrders.length} purchase orders`);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      supplierSearch: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'check': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'authorized': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft': return 'check';
      case 'check': return 'approved';
      case 'approved': return 'authorized';
      case 'authorized': return 'received';
      default: return null;
    }
  };

  const getStatusAction = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft': return 'Mark as Check';
      case 'check': return 'Mark as Approved';
      case 'approved': return 'Mark as Authorized';
      case 'authorized': return 'Mark as Received';
      default: return null;
    }
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown';
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Purchase Orders
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportFilteredOrders}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export ({filteredOrders.length})
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Purchase Order
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="authorized">Authorized</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Search Supplier</Label>
                <Input
                  type="text"
                  placeholder="Search by supplier name..."
                  value={filters.supplierSearch}
                  onChange={(e) => setFilters({...filters, supplierSearch: e.target.value})}
                />
              </div>
              <div>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Order List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">PO Number</th>
                    <th className="p-3 text-left text-sm font-medium">Supplier</th>
                    <th className="p-3 text-left text-sm font-medium">Order Date</th>
                    <th className="p-3 text-left text-sm font-medium">Items</th>
                    <th className="p-3 text-left text-sm font-medium">Amount</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                    >
                      <td className="p-3 font-medium">{order.po_number}</td>
                      <td className="p-3">{getSupplierName(order.supplier_id)}</td>
                      <td className="p-3">{new Date(order.order_date).toLocaleDateString()}</td>
                      <td className="p-3">{order.items?.length || 0} items</td>
                      <td className="p-3 font-semibold">SSP {parseFloat(String(order.total_amount || '0')).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {order.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowItemModal(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Items
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPOReport(order)}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Download Report
                          </Button>
                          {getNextStatus(order.status) && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {order.status === 'draft' && <Check className="w-4 h-4 mr-1" />}
                              {order.status === 'check' && <CheckCircle className="w-4 h-4 mr-1" />}
                              {order.status === 'approved' && <Shield className="w-4 h-4 mr-1" />}
                              {getStatusAction(order.status)}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No purchase orders found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Supplier *</Label>
                <Select value={formData.supplier_id} onValueChange={value => setFormData({...formData, supplier_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order Date *</Label>
                <Input type="date" value={formData.order_date} onChange={e => setFormData({...formData, order_date: e.target.value})} required />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Order details, items, etc." />
              </div>
              <Button type="submit" className="w-full">Create Purchase Order</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Add Items to {selectedOrder?.po_number}</span>
                <div className="flex gap-2">
                  {pendingItems.length > 0 && (
                    <Button onClick={downloadItemsTable} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add New Item</h3>
                <form onSubmit={addToPendingItems} className="space-y-4">
                  <div>
                    <Label>Type *</Label>
                    <Select value={itemFormData.type} onValueChange={value => setItemFormData({...itemFormData, type: value as 'inventory' | 'expense' | 'asset', item_name: '', unit_price: '', description: '', is_new_item: false})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory">Inventory Items</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {itemFormData.type === 'inventory' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="new-item" 
                        checked={itemFormData.is_new_item}
                        onCheckedChange={(checked) => setItemFormData({...itemFormData, is_new_item: !!checked, item_name: '', unit_price: '', description: ''})}
                      />
                      <Label htmlFor="new-item">New item (not in inventory)</Label>
                    </div>
                  )}

                  <div>
                    <Label>Item Name *</Label>
                    {itemFormData.type === 'inventory' && !itemFormData.is_new_item ? (
                      <Select value={itemFormData.item_name} onValueChange={handleInventorySelection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select from inventory" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map(item => (
                            <SelectItem key={item.id} value={item.drug_name}>
                              {item.drug_name} {item.generic_name && `(${item.generic_name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={itemFormData.item_name} 
                        onChange={e => setItemFormData({...itemFormData, item_name: e.target.value})} 
                        required 
                        placeholder={itemFormData.type === 'expense' ? 'e.g., Office Supplies' : itemFormData.type === 'asset' ? 'e.g., Medical Equipment' : 'e.g., New Medicine'}
                      />
                    )}
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      value={itemFormData.description} 
                      onChange={e => setItemFormData({...itemFormData, description: e.target.value})} 
                      placeholder={itemFormData.type === 'expense' ? 'Expense details...' : itemFormData.type === 'asset' ? 'Asset specifications...' : 'Item description...'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity *</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={itemFormData.quantity} 
                        onChange={e => setItemFormData({...itemFormData, quantity: e.target.value})} 
                        required 
                      />
                    </div>
                    <div>
                      <Label>Unit Cost (SSP) *</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={itemFormData.unit_price} 
                        onChange={e => setItemFormData({...itemFormData, unit_price: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Unit of Measure</Label>
                    <Select value={itemFormData.unit_of_measure} onValueChange={value => setItemFormData({...itemFormData, unit_of_measure: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Each">Each</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                        <SelectItem value="Pack">Pack</SelectItem>
                        <SelectItem value="Bottle">Bottle</SelectItem>
                        <SelectItem value="Kg">Kilogram</SelectItem>
                        <SelectItem value="Liter">Liter</SelectItem>
                        <SelectItem value="Piece">Piece</SelectItem>
                        <SelectItem value="Set">Set</SelectItem>
                        <SelectItem value="Tablet">Tablet</SelectItem>
                        <SelectItem value="Capsule">Capsule</SelectItem>
                        <SelectItem value="Vial">Vial</SelectItem>
                        <SelectItem value="Tube">Tube</SelectItem>
                        <SelectItem value="Strip">Strip</SelectItem>
                        <SelectItem value="Sachet">Sachet</SelectItem>
                        <SelectItem value="Unit">Unit</SelectItem>
                        <SelectItem value="Gram">Gram</SelectItem>
                        <SelectItem value="ml">Milliliter</SelectItem>
                        <SelectItem value="Milliliter">Milliliter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {itemFormData.quantity && itemFormData.unit_price && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Price</div>
                      <div className="text-lg font-semibold">
                        SSP {(parseFloat(itemFormData.quantity || '0') * parseFloat(itemFormData.unit_price || '0')).toFixed(2)}
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add to List
                  </Button>
                </form>
              </div>

              {/* Items Table Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Items List ({pendingItems.length})</h3>
                  {pendingItems.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Total: SSP {pendingItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                    </div>
                  )}
                </div>
                
                {pendingItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Item</th>
                            <th className="p-2 text-left">Qty</th>
                            <th className="p-2 text-left">Price</th>
                            <th className="p-2 text-left">Total</th>
                            <th className="p-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingItems.map((item, index) => (
                            <tr key={item.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.type === 'inventory' ? 'bg-blue-100 text-blue-800' :
                                  item.type === 'expense' ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="p-2">
                                <div className="font-medium">{item.item_name}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                                )}
                              </td>
                              <td className="p-2">{item.quantity} {item.unit_of_measure}</td>
                              <td className="p-2">SSP {item.unit_price.toFixed(2)}</td>
                              <td className="p-2 font-semibold">SSP {item.total_price.toFixed(2)}</td>
                              <td className="p-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => removePendingItem(item.id)}
                                  className="text-red-600 hover:text-red-700"
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No items added yet. Use the form to add items.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowItemModal(false);
                  setPendingItems([]);
                  setItemFormData({
                    type: 'inventory',
                    item_name: '',
                    description: '',
                    quantity: '',
                    unit_price: '',
                    unit_of_measure: 'Each',
                    is_new_item: false
                  });
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveAllItems} 
                disabled={pendingItems.length === 0}
                className="flex-1"
              >
                Save All Items ({pendingItems.length})
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* PO Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Purchase Order Preview
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                  <Button onClick={() => downloadPOReport(selectedOrder!)} className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (() => {
              const statusLabels = {
                'draft': 'DRAFT - Pending Review',
                'check': 'UNDER REVIEW - Pending Approval',
                'approved': 'APPROVED - Pending Authorization',
                'authorized': 'AUTHORIZED - Ready for Processing',
                'received': 'RECEIVED - Completed',
                'cancelled': 'CANCELLED'
              };
              const currentDate = new Date().toLocaleDateString();
              const orderDate = new Date(selectedOrder.order_date).toLocaleDateString();
              const supplier = suppliers.find(s => s.id === selectedOrder.supplier_id);
              const supplierName = supplier ? supplier.name : 'Unknown';
              const supplierAddress = supplier ? supplier.address || '-' : '-';
              const supplierPhone = supplier ? supplier.phone || '-' : '-';
              const supplierEmail = supplier ? supplier.email || '-' : '-';
              const supplierTown = supplier ? supplier.town || '-' : '-';

              return (
                <div className="p-6" style={{backgroundColor: 'white'}}>
                  <style>{`
                    .po-preview {
                      font-family: Arial, sans-serif;
                      color: #000;
                      font-size: 12px;
                      line-height: 1.4;
                      background: white;
                      padding: 20px;
                      border-radius: 8px;
                    }
                    .po-preview .header-title {
                      background-color: #87CEEB;
                      text-align: center;
                      padding: 8px;
                      margin: 0 0 20px 0;
                      font-weight: bold;
                      font-size: 14px;
                      color: #000;
                      border-radius: 8px;
                    }
                    .po-preview .info-boxes {
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 20px;
                      margin-bottom: 20px;
                    }
                    .po-preview .info-box {
                      border: 1px solid #000;
                      padding: 15px;
                      border-radius: 8px;
                    }
                    .po-preview .company-info {
                      display: flex;
                      gap: 15px;
                      align-items: flex-start;
                    }
                    .po-preview .logo-placeholder {
                      width: 60px;
                      height: 60px;
                      border: 2px solid #000;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-weight: bold;
                      font-size: 10px;
                      flex-shrink: 0;
                      border-radius: 6px;
                    }
                    .po-preview .company-details {
                      flex: 1;
                    }
                    .po-preview .company-name {
                      font-weight: bold;
                      font-size: 16px;
                      margin-bottom: 5px;
                    }
                    .po-preview .info-line {
                      margin: 3px 0;
                      font-size: 11px;
                    }
                    .po-preview .info-label {
                      font-weight: bold;
                      margin-right: 5px;
                    }
                    .po-preview .order-info {
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 20px;
                      margin-bottom: 20px;
                      padding: 15px;
                      border: 1px solid #000;
                      border-radius: 8px;
                    }
                    .po-preview .order-details div {
                      margin: 5px 0;
                      font-size: 11px;
                    }
                    .po-preview .status-badge {
                      background-color: ${selectedOrder.status === 'draft' ? '#f0f0f0' : 
                                        selectedOrder.status === 'check' ? '#fff3cd' : 
                                        selectedOrder.status === 'approved' ? '#d1ecf1' : 
                                        selectedOrder.status === 'authorized' ? '#d4edda' : '#f0f0f0'};
                      color: ${selectedOrder.status === 'draft' ? '#666' : 
                              selectedOrder.status === 'check' ? '#856404' : 
                              selectedOrder.status === 'approved' ? '#0c5460' : 
                              selectedOrder.status === 'authorized' ? '#155724' : '#666'};
                      padding: 5px 10px;
                      border-radius: 8px;
                      font-weight: bold;
                      font-size: 14px;
                    }
                    .po-preview .items-table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 20px 0;
                      font-size: 11px;
                      border-radius: 8px;
                      overflow: hidden;
                    }
                    .po-preview .items-table th,
                    .po-preview .items-table td {
                      border: 1px solid #000;
                      padding: 8px 5px;
                      text-align: left;
                    }
                    .po-preview .items-table th {
                      background-color: #f5f5f5;
                      font-weight: bold;
                      text-align: center;
                    }
                    .po-preview .items-table .number-col {
                      text-align: center;
                      width: 30px;
                    }
                    .po-preview .items-table .amount-col {
                      text-align: right;
                      width: 80px;
                    }
                    .po-preview .total-row {
                      font-weight: bold;
                      background-color: #f0f0f0;
                    }
                    .po-preview .signatures {
                      margin-top: 30px;
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 20px;
                    }
                    .po-preview .signature-block {
                      margin: 20px 0;
                    }
                    .po-preview .signature-line {
                      margin: 8px 0;
                      display: flex;
                      align-items: center;
                    }
                    .po-preview .signature-label {
                      font-weight: bold;
                      width: 100px;
                      margin-right: 10px;
                    }
                    .po-preview .signature-underline {
                      flex: 1;
                      border-bottom: 1px solid #000;
                      height: 20px;
                      margin-right: 10px;
                    }
                    .po-preview .signature-date {
                      font-size: 11px;
                    }
                    .po-preview .signature-name {
                      flex: 1;
                      margin-right: 10px;
                      font-weight: normal;
                    }
                    .po-preview .signature-image {
                      flex: 1;
                      margin-right: 10px;
                    }
                    .po-preview .signature-image img {
                      max-height: 30px;
                      max-width: 120px;
                    }
                    .po-preview .terms {
                      text-align: center;
                      margin-top: 40px;
                      font-weight: bold;
                      text-decoration: underline;
                    }
                  `}</style>
                  
                  <div className="po-preview" style={{backgroundColor: 'white'}}>
                    <div className="header-title">Purchase Order</div>
                    
                    <div className="info-boxes">
                      <div className="info-box">
                        <div className="company-info">
                          <div className="logo-placeholder">LOGO</div>
                          <div className="company-details">
                            <div className="company-name">Universal HMIS</div>
                            <div className="info-line">www.uhmis.com</div>
                            <div className="info-line"><span className="info-label">Branch:</span> Main Hospital</div>
                            <div className="info-line"><span className="info-label">Address:</span> Juba, South Sudan</div>
                            <div className="info-line"><span className="info-label">Telephone:</span> +211-XXX-XXXX</div>
                            <div className="info-line"><span className="info-label">Email:</span> info@uhmis.com</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="info-box">
                        <div className="info-line"><span className="info-label">Supplier:</span> {supplierName}</div>
                        <div className="info-line"><span className="info-label">Alias:</span> {supplierName}</div>
                        <div className="info-line"><span className="info-label">Address:</span> {supplierAddress}</div>
                        <div className="info-line"><span className="info-label">Telephone:</span> {supplierPhone}</div>
                        <div className="info-line"><span className="info-label">Email:</span> {supplierEmail}</div>
                        <div className="info-line"><span className="info-label">Town:</span> {supplierTown}</div>
                        <div className="info-line"><span className="info-label">Country:</span> South Sudan</div>
                      </div>
                    </div>

                    <div className="order-info">
                      <div className="order-details">
                        <div><strong>Printed On:</strong> {currentDate}</div>
                        <div><strong>Purchase Order No:</strong> {selectedOrder.po_number}</div>
                        <div><strong>Order Ref:</strong> {selectedOrder.notes || 'N/A'}</div>
                      </div>
                      <div>
                        <div><strong>Order No:</strong> {selectedOrder.po_number}</div>
                        <div><strong>Created On:</strong> {orderDate}</div>
                        <div><strong>Valid Until:</strong> {new Date(new Date(selectedOrder.order_date).getTime() + 30*24*60*60*1000).toLocaleDateString()}</div>
                        <div className="status-badge">{statusLabels[selectedOrder.status] || selectedOrder.status}</div>
                      </div>
                    </div>

                    <table className="items-table">
                      <thead>
                        <tr>
                          <th className="number-col">No</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th className="number-col">Qty</th>
                          <th>Unit</th>
                          <th className="amount-col">Unit Cost</th>
                          <th className="amount-col">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td className="number-col">{index + 1}</td>
                              <td>{item.item_name}</td>
                              <td>{item.description || ''}</td>
                              <td className="number-col">{item.quantity}</td>
                              <td>{item.unit_of_measure || 'Each'}</td>
                              <td className="amount-col">SSP {parseFloat(String(item.unit_price || '0')).toFixed(2)}</td>
                              <td className="amount-col">SSP {parseFloat(String(item.total_price || '0')).toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
                              No items added to this purchase order
                            </td>
                          </tr>
                        )}
                        <tr className="total-row">
                          <td colSpan={6} style={{textAlign: 'right', padding: '8px'}}>
                            <strong>Total Amount:</strong>
                          </td>
                          <td className="amount-col">
                            <strong>SSP {parseFloat(String(selectedOrder.total_amount || '0')).toFixed(2)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="signatures">
                      <div>
                        <div className="signature-block">
                          <div className="signature-line">
                            <span className="signature-label">Prepared By:</span>
                            <span className="signature-underline"></span>
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Sign:</span>
                            <span className="signature-underline"></span>
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Date:</span>
                            <span className="signature-date">{currentDate}</span>
                          </div>
                        </div>
                        
                        <div className="signature-block">
                          <div className="signature-line">
                            <span className="signature-label">Checked By:</span>
                            {selectedOrder.check_signed_by ? <span className="signature-name">{selectedOrder.check_signed_by}</span> : <span className="signature-underline"></span>}
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Sign:</span>
                            {selectedOrder.check_signature ? 
                              <div className="signature-image"><img src={selectedOrder.check_signature} alt="Signature" /></div> : 
                              <span className="signature-underline"></span>
                            }
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Date:</span>
                            <span className="signature-date">{selectedOrder.check_signed_at ? new Date(selectedOrder.check_signed_at).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="signature-block">
                          <div className="signature-line">
                            <span className="signature-label">Approved By:</span>
                            {selectedOrder.approved_signed_by ? <span className="signature-name">{selectedOrder.approved_signed_by}</span> : <span className="signature-underline"></span>}
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Sign:</span>
                            {selectedOrder.approved_signature ? 
                              <div className="signature-image"><img src={selectedOrder.approved_signature} alt="Signature" /></div> : 
                              <span className="signature-underline"></span>
                            }
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Date:</span>
                            <span className="signature-date">{selectedOrder.approved_signed_at ? new Date(selectedOrder.approved_signed_at).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                        
                        <div className="signature-block">
                          <div className="signature-line">
                            <span className="signature-label">Authorized By:</span>
                            {selectedOrder.authorized_signed_by ? <span className="signature-name">{selectedOrder.authorized_signed_by}</span> : <span className="signature-underline"></span>}
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Sign:</span>
                            {selectedOrder.authorized_signature ? 
                              <div className="signature-image"><img src={selectedOrder.authorized_signature} alt="Signature" /></div> : 
                              <span className="signature-underline"></span>
                            }
                          </div>
                          <div className="signature-line">
                            <span className="signature-label">Date:</span>
                            <span className="signature-date">{selectedOrder.authorized_signed_at ? new Date(selectedOrder.authorized_signed_at).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="terms">Terms And Conditions</div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default PurchaseOrders;
