import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRightLeft, Download } from 'lucide-react';

interface LedgerAccount {
  id: number;
  account_name: string;
  account_code: string;
  balance: number;
}

interface Transfer {
  id: number;
  from_account_name: string;
  to_account_name: string;
  amount: number;
  notes: string;
  created_at: string;
}

const CashTransfer: React.FC = () => {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchTransfers();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/ledger-accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts');
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/cash-transfers');
      if (response.ok) {
        const data = await response.json();
        setTransfers(data);
      }
    } catch (error) {
      console.error('Failed to fetch transfers');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAccount || !toAccount) {
      toast.error('Please select both accounts');
      return;
    }
    
    if (fromAccount === toAccount) {
      toast.error('Source and destination must be different');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      const response = await fetch('/api/cash-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_account_id: parseInt(fromAccount),
          to_account_id: parseInt(toAccount),
          amount: parseFloat(amount),
          notes: notes || 'Cash transfer'
        })
      });
      
      if (!response.ok) throw new Error('Transfer failed');
      
      toast.success('Transfer completed successfully');
      setFromAccount('');
      setToAccount('');
      setAmount('');
      setNotes('');
      fetchAccounts();
      fetchTransfers();
    } catch (error) {
      toast.error('Failed to complete transfer');
    }
  };

  const downloadCSV = () => {
    const csv = [
      ['Date', 'From Account', 'To Account', 'Amount', 'Notes'],
      ...transfers.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.from_account_name,
        t.to_account_name,
        parseFloat(String(t.amount)).toFixed(2),
        t.notes
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-transfers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === parseInt(accountId));
    return account ? parseFloat(String(account.balance || '0')).toFixed(2) : '0.00';
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-8 h-8" />
            Cash Transfer
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <Label>From Account</Label>
                  <Select value={fromAccount} onValueChange={setFromAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.account_name} ({account.account_code}) - SSP {parseFloat(String(account.balance || '0')).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fromAccount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: SSP {getAccountBalance(fromAccount)}
                    </p>
                  )}
                </div>

                <div>
                  <Label>To Account</Label>
                  <Select value={toAccount} onValueChange={setToAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.id.toString() !== fromAccount).map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.account_name} ({account.account_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Amount (SSP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Transfer notes..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Transfer Funds
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transfer History</CardTitle>
              <Button size="sm" variant="outline" onClick={downloadCSV}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                {transfers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transfers yet</p>
                ) : (
                  <div className="space-y-3">
                    {transfers.map(transfer => (
                      <div key={transfer.id} className="border rounded-lg p-3 hover:bg-muted/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {transfer.from_account_name} → {transfer.to_account_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(transfer.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            SSP {parseFloat(String(transfer.amount || '0')).toFixed(2)}
                          </div>
                        </div>
                        {transfer.notes && (
                          <div className="text-sm text-muted-foreground">
                            {transfer.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CashTransfer;
