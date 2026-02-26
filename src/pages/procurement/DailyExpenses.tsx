import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Receipt, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LedgerAccount {
  id: number;
  account_name: string;
  account_code: string;
  balance: number;
}

interface DailyExpense {
  id: number;
  expense_date: string;
  description: string;
  amount: number;
  account_name: string;
  category: string;
  notes: string;
  created_by: string;
}

const DailyExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    account_id: '',
    category: '',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/daily-expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses');
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/daily-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_date: formData.expense_date,
          description: formData.description,
          amount: parseFloat(formData.amount),
          account_id: parseInt(formData.account_id),
          category: formData.category,
          notes: formData.notes,
          created_by: 'admin'
        })
      });
      
      if (!response.ok) throw new Error('Failed to create expense');
      
      toast.success('Expense recorded successfully');
      setShowModal(false);
      setFormData({ expense_date: new Date().toISOString().split('T')[0], description: '', amount: '', account_id: '', category: '', notes: '' });
      fetchExpenses();
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to record expense');
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-8 h-8" />
            Daily Expenses
          </h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                    <th className="p-3 text-left text-sm font-medium">Description</th>
                    <th className="p-3 text-left text-sm font-medium">Category</th>
                    <th className="p-3 text-left text-sm font-medium">Account</th>
                    <th className="p-3 text-left text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{new Date(expense.expense_date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium">{expense.description}</td>
                      <td className="p-3">{expense.category}</td>
                      <td className="p-3">{expense.account_name}</td>
                      <td className="p-3 font-semibold text-red-600">SSP {parseFloat(String(expense.amount || '0')).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Daily Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Expense Date *</Label>
                <Input type="date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} required />
              </div>
              <div>
                <Label>Description *</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What was purchased/paid for" required />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g., Office Supplies, Utilities" />
              </div>
              <div>
                <Label>Amount (SSP) *</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div>
                <Label>Deduct From Account *</Label>
                <Select value={formData.account_id} onValueChange={value => setFormData({...formData, account_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.account_name} ({account.account_code}) - SSP {parseFloat(String(account.balance || '0')).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional details" />
              </div>
              <Button type="submit" className="w-full">Record Expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DailyExpenses;
