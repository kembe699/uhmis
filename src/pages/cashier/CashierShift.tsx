import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DollarSign, Clock, XCircle, ArrowRightLeft, Receipt, TrendingUp } from 'lucide-react';

interface CashierShift {
  id: number;
  cashier_id: number;
  cashier_name: string;
  start_time: string;
  end_time: string | null;
  opening_balance: number;
  closing_balance: number | null;
  total_receipts: number;
  total_amount: number;
  status: 'open' | 'closed';
  notes: string | null;
}

interface ShiftReceipt {
  id: number;
  receipt_number: string;
  patient_name: string;
  payment_amount: number;
  payment_method: string;
  created_at: string;
}

interface LedgerAccount {
  id: number;
  account_name: string;
  account_code: string;
  balance: number;
}

const CashierShift: React.FC = () => {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState<CashierShift | null>(null);
  const [shiftReceipts, setShiftReceipts] = useState<ShiftReceipt[]>([]);
  const [allShifts, setAllShifts] = useState<CashierShift[]>([]);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
  const [cashAtHandAccount, setCashAtHandAccount] = useState<LedgerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showShiftDetailsModal, setShowShiftDetailsModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CashierShift | null>(null);
  const [selectedShiftReceipts, setSelectedShiftReceipts] = useState<ShiftReceipt[]>([]);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('0');
  const [closingNotes, setClosingNotes] = useState('');
  const [transferAmount, setTransferAmount] = useState('0');
  const [transferAccount, setTransferAccount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  useEffect(() => {
    fetchCurrentShift();
    fetchLedgerAccounts();
    fetchAllShifts();
  }, []);

  useEffect(() => {
    fetchAllShifts();
  }, [filterStatus, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (currentShift) {
      fetchShiftReceipts(currentShift.id);
    }
  }, [currentShift]);

  const fetchCurrentShift = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/cashier/current-shift', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data);
      } else {
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Failed to fetch current shift:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftReceipts = async (shiftId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/cashier/shift/${shiftId}/receipts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setShiftReceipts(data);
      }
    } catch (error) {
      toast.error('Failed to load shift receipts');
    }
  };

  const fetchLedgerAccounts = async () => {
    try {
      const response = await fetch('/api/ledger-accounts');
      if (response.ok) {
        const data = await response.json();
        setLedgerAccounts(data);
        
        // Find Cash at Hand sub-account (code 3, child of cash account 01)
        const cashAccount = data.find((acc: LedgerAccount) => acc.account_code === '3');
        if (cashAccount) {
          setCashAtHandAccount(cashAccount);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ledger accounts');
    }
  };

  const fetchAllShifts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Build query parameters for filters
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterStartDate) {
        params.append('startDate', filterStartDate);
      }
      if (filterEndDate) {
        params.append('endDate', filterEndDate);
      }
      
      const queryString = params.toString();
      const url = `/api/cashier/shifts${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllShifts(data);
      }
    } catch (error) {
      console.error('Failed to fetch shifts');
    }
  };

  const handleShiftClick = async (shift: CashierShift) => {
    setSelectedShift(shift);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/cashier/shift/${shift.id}/receipts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedShiftReceipts(data);
      }
    } catch (error) {
      console.error('Failed to fetch shift receipts');
    }
    setShowShiftDetailsModal(true);
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/cashier/start-shift', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ opening_balance: parseFloat(openingBalance) })
      });
      if (!response.ok) throw new Error('Failed to start shift');
      toast.success('Shift started successfully');
      setShowStartShiftModal(false);
      setOpeningBalance('0');
      fetchCurrentShift();
      fetchAllShifts();
    } catch (error) {
      toast.error('Failed to start shift');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/cashier/close-shift/${currentShift.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          closing_balance: parseFloat(closingBalance),
          notes: closingNotes
        })
      });
      if (!response.ok) throw new Error('Failed to close shift');
      toast.success('Shift closed successfully - Now transfer cash to account');
      
      // Store closing balance for transfer
      const closingBalanceValue = closingBalance;
      
      // Close the close shift modal
      setShowCloseShiftModal(false);
      setClosingBalance('0');
      setClosingNotes('');
      
      // Open transfer modal with pre-filled amount
      setTransferAmount(closingBalanceValue);
      setShowTransferModal(true);
      
      fetchCurrentShift();
      fetchAllShifts();
    } catch (error) {
      toast.error('Failed to close shift');
    }
  };

  const handleTransferCash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!transferAccount) {
      toast.error('Please select a destination account');
      return;
    }
    
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/cashier/transfer-cash', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shift_id: currentShift?.id || null,
          amount: parseFloat(transferAmount),
          to_account_id: parseInt(transferAccount),
          notes: transferNotes || 'Cash transfer'
        })
      });
      if (!response.ok) throw new Error('Failed to transfer cash');
      
      const data = await response.json();
      toast.success(`Cash transferred to ${data.to_account} - Cash at Hand updated`);
      
      setShowTransferModal(false);
      setTransferAmount('0');
      setTransferAccount('');
      setTransferNotes('');
      fetchCurrentShift();
      fetchLedgerAccounts(); // Refresh to show updated balances including Cash at Hand
    } catch (error) {
      toast.error('Failed to transfer cash');
    }
  };

  const totalCash = shiftReceipts
    .filter(r => r.payment_method === 'cash')
    .reduce((sum, r) => sum + parseFloat(String(r.payment_amount || '0')), 0);

  const totalMobile = shiftReceipts
    .filter(r => r.payment_method === 'mobile_money')
    .reduce((sum, r) => sum + parseFloat(String(r.payment_amount || '0')), 0);

  const totalCard = shiftReceipts
    .filter(r => r.payment_method === 'card')
    .reduce((sum, r) => sum + parseFloat(String(r.payment_amount || '0')), 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="w-8 h-8" />
              Cashier Shift
            </h1>
            <p className="text-muted-foreground">Manage your cashier shift and receipts</p>
          </div>
          {!currentShift ? (
            <Button onClick={() => setShowStartShiftModal(true)}>
              <Clock className="w-4 h-4 mr-2" />
              Start Shift
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTransferModal(true)}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer Cash
              </Button>
              <Button variant="destructive" onClick={() => setShowCloseShiftModal(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Close Shift
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : !currentShift ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No active shift</p>
                <p className="text-sm">Start a new shift to begin accepting payments</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Opening Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">SSP {parseFloat(String(currentShift.opening_balance || '0')).toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Receipts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{shiftReceipts.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    SSP {shiftReceipts.reduce((sum, r) => sum + parseFloat(String(r.payment_amount || '0')), 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Shift Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.floor((new Date().getTime() - new Date(currentShift.start_time).getTime()) / 3600000)}h
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cash Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">SSP {totalCash.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {shiftReceipts.filter(r => r.payment_method === 'cash').length} transactions
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Mobile Money</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">SSP {totalMobile.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {shiftReceipts.filter(r => r.payment_method === 'mobile_money').length} transactions
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Card Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">SSP {totalCard.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {shiftReceipts.filter(r => r.payment_method === 'card').length} transactions
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Shift Receipts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shiftReceipts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No receipts yet</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium">Receipt #</th>
                          <th className="p-3 text-left text-sm font-medium">Patient</th>
                          <th className="p-3 text-left text-sm font-medium">Amount</th>
                          <th className="p-3 text-left text-sm font-medium">Payment Method</th>
                          <th className="p-3 text-left text-sm font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shiftReceipts.map(receipt => (
                          <tr key={receipt.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-medium">{receipt.receipt_number}</td>
                            <td className="p-3">{receipt.patient_name}</td>
                            <td className="p-3 font-semibold">SSP {parseFloat(String(receipt.payment_amount || '0')).toFixed(2)}</td>
                            <td className="p-3 capitalize">{receipt.payment_method.replace('_', ' ')}</td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {new Date(receipt.created_at).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Shift History</CardTitle>
              {user?.role === 'admin' && (
                <div className="flex gap-2 items-center">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="w-[150px]"
                  />
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    placeholder="End Date"
                    className="w-[150px]"
                  />
                  {(filterStatus !== 'all' || filterStartDate || filterEndDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Cashier</th>
                    <th className="p-3 text-left text-sm font-medium">Start Time</th>
                    <th className="p-3 text-left text-sm font-medium">End Time</th>
                    <th className="p-3 text-left text-sm font-medium">Opening</th>
                    <th className="p-3 text-left text-sm font-medium">Closing</th>
                    <th className="p-3 text-left text-sm font-medium">Receipts</th>
                    <th className="p-3 text-left text-sm font-medium">Total</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allShifts.map(shift => (
                    <tr 
                      key={shift.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleShiftClick(shift)}
                    >
                      <td className="p-3">{shift.cashier_name}</td>
                      <td className="p-3 text-sm">
                        {new Date(shift.start_time).toLocaleString()}
                      </td>
                      <td className="p-3 text-sm">
                        {shift.end_time ? new Date(shift.end_time).toLocaleString() : '-'}
                      </td>
                      <td className="p-3">SSP {parseFloat(String(shift.opening_balance || '0')).toFixed(2)}</td>
                      <td className="p-3">
                        {shift.closing_balance ? `SSP ${parseFloat(String(shift.closing_balance)).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3">{shift.total_receipts}</td>
                      <td className="p-3 font-semibold">SSP {parseFloat(String(shift.total_amount || '0')).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          shift.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {shift.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showStartShiftModal} onOpenChange={setShowStartShiftModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Shift</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <Label>Opening Balance (SSP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Start Shift</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showCloseShiftModal} onOpenChange={setShowCloseShiftModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Shift</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <Label>Closing Balance (SSP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={closingBalance}
                  onChange={e => setClosingBalance(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="Any notes about this shift..."
                />
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Opening Balance:</span>
                    <span className="font-semibold">SSP {parseFloat(String(currentShift?.opening_balance || '0')).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Collected:</span>
                    <span className="font-semibold">SSP {shiftReceipts.reduce((sum, r) => sum + parseFloat(String(r.payment_amount || '0')), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-1 mt-1">
                    <span>Expected Balance:</span>
                    <span>SSP {(parseFloat(String(currentShift?.opening_balance || '0')) + shiftReceipts.reduce((sum, r) => sum + parseFloat(String(r.payment_amount || '0')), 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Button type="submit" variant="destructive" className="w-full">Close Shift</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Cash from Cash at Hand</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTransferCash} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-2">
                <div className="text-sm font-medium">Available: SSP {parseFloat(String(cashAtHandAccount?.balance || '0')).toFixed(2)}</div>
              </div>
              <div>
                <Label>Amount (SSP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Transfer To Account *</Label>
                <Select value={transferAccount} onValueChange={setTransferAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {ledgerAccounts
                      .filter(account => account.account_code !== '3')
                      .map(account => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.account_name} ({account.account_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  placeholder="Transfer notes (optional)..."
                />
              </div>
              <Button type="submit" className="w-full">Transfer Cash</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showShiftDetailsModal} onOpenChange={setShowShiftDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Shift Details - {selectedShift?.cashier_name}</DialogTitle>
            </DialogHeader>
            {selectedShift && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Cashier</div>
                    <div className="font-semibold">{selectedShift.cashier_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedShift.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedShift.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Start Time</div>
                    <div className="font-semibold">{new Date(selectedShift.start_time).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">End Time</div>
                    <div className="font-semibold">{selectedShift.end_time ? new Date(selectedShift.end_time).toLocaleString() : 'Ongoing'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Opening Balance</div>
                    <div className="font-semibold">SSP {parseFloat(String(selectedShift.opening_balance || '0')).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Closing Balance</div>
                    <div className="font-semibold">{selectedShift.closing_balance ? `SSP ${parseFloat(String(selectedShift.closing_balance)).toFixed(2)}` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Receipts</div>
                    <div className="font-semibold">{selectedShift.total_receipts}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-semibold text-green-600">SSP {parseFloat(String(selectedShift.total_amount || '0')).toFixed(2)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Shift Receipts</h3>
                  {selectedShiftReceipts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No receipts</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left text-sm">Receipt #</th>
                            <th className="p-2 text-left text-sm">Patient</th>
                            <th className="p-2 text-left text-sm">Amount</th>
                            <th className="p-2 text-left text-sm">Method</th>
                            <th className="p-2 text-left text-sm">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedShiftReceipts.map(receipt => (
                            <tr key={receipt.id} className="border-b">
                              <td className="p-2 text-sm">{receipt.receipt_number}</td>
                              <td className="p-2 text-sm">{receipt.patient_name}</td>
                              <td className="p-2 text-sm font-semibold">SSP {parseFloat(String(receipt.payment_amount || '0')).toFixed(2)}</td>
                              <td className="p-2 text-sm capitalize">{receipt.payment_method.replace('_', ' ')}</td>
                              <td className="p-2 text-sm">{new Date(receipt.created_at).toLocaleTimeString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default CashierShift;
