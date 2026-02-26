import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql.pure';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

interface LedgerAccount {
  id: number;
  account_name: string;
  account_code: string;
  account_type: string;
  parent_account_id: number | null;
  description: string;
  balance: number;
  sub_accounts?: LedgerAccount[];
}

const LedgerAccounts: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LedgerAccount | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: '',
    account_code: '',
    account_type: 'asset',
    parent_account_id: '0',
    description: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/ledger-accounts');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAccounts(organizeHierarchy(data));
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const organizeHierarchy = (flat: LedgerAccount[]): LedgerAccount[] => {
    const map = new Map<number, LedgerAccount>();
    const roots: LedgerAccount[] = [];
    flat.forEach(acc => map.set(acc.id, { ...acc, sub_accounts: [] }));
    flat.forEach(acc => {
      const node = map.get(acc.id)!;
      if (acc.parent_account_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(acc.parent_account_id);
        if (parent) parent.sub_accounts!.push(node);
      }
    });
    return roots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, parent_account_id: formData.parent_account_id && formData.parent_account_id !== '0' ? parseInt(formData.parent_account_id) : null };
      const url = editingAccount ? `/api/ledger-accounts/${editingAccount.id}` : '/api/ledger-accounts';
      const response = await fetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed');
      toast.success(editingAccount ? 'Updated' : 'Created');
      setShowAddModal(false);
      setEditingAccount(null);
      setFormData({ account_name: '', account_code: '', account_type: 'asset', parent_account_id: '0', description: '' });
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this account?')) return;
    try {
      await fetch(`/api/ledger-accounts/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleAddSubAccount = () => {
    if (!selectedAccount) return;
    setEditingAccount(null);
    setFormData({ 
      account_name: '', 
      account_code: '', 
      account_type: selectedAccount.account_type, 
      parent_account_id: selectedAccount.id.toString(), 
      description: '' 
    });
    setShowAddModal(true);
  };

  const getAllFlat = (accs: LedgerAccount[]): LedgerAccount[] => {
    const flat: LedgerAccount[] = [];
    const traverse = (list: LedgerAccount[]) => {
      list.forEach(acc => {
        flat.push(acc);
        if (acc.sub_accounts) traverse(acc.sub_accounts);
      });
    };
    traverse(accs);
    return flat;
  };

  const renderAccount = (account: LedgerAccount) => {
    const isSelected = selectedAccount?.id === account.id;
    const hasSubAccounts = account.sub_accounts && account.sub_accounts.length > 0;
    
    return (
      <div 
        key={account.id}
        className={`flex items-center justify-between p-3 hover:bg-muted/50 border-b cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
        }`}
        onClick={() => setSelectedAccount(account)}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              {account.account_name}
              {hasSubAccounts && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {account.sub_accounts!.length}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{account.account_code} • {account.account_type}</div>
          </div>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => { setEditingAccount(account); setFormData({ account_name: account.account_name, account_code: account.account_code, account_type: account.account_type, parent_account_id: account.parent_account_id?.toString() || '0', description: account.description }); setShowAddModal(true); }}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="w-8 h-8" />Ledger Accounts</h1>
            <p className="text-muted-foreground">Manage chart of accounts</p>
          </div>
          <Button onClick={() => { setEditingAccount(null); setFormData({ account_name: '', account_code: '', account_type: 'asset', parent_account_id: '0', description: '' }); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />Add Account
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Main Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div>Loading...</div> : accounts.length === 0 ? <div className="text-center py-8 text-muted-foreground">No accounts yet</div> : <div className="border rounded-lg">{accounts.map(acc => renderAccount(acc))}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sub-Accounts</CardTitle>
              {selectedAccount && (
                <Button size="sm" onClick={handleAddSubAccount}>
                  <Plus className="w-4 h-4 mr-1" />Add Sub-Account
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!selectedAccount ? (
                <div className="text-center py-8 text-muted-foreground">Select a main account to view sub-accounts</div>
              ) : selectedAccount.sub_accounts && selectedAccount.sub_accounts.length > 0 ? (
                <div className="border rounded-lg">
                  {selectedAccount.sub_accounts.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 hover:bg-muted/50 border-b">
                      <div className="flex-1">
                        <div className="font-medium">{sub.account_name}</div>
                        <div className="text-sm text-muted-foreground">{sub.account_code} • {sub.account_type}</div>
                        <div className="text-sm font-semibold text-primary mt-1">
                          Balance: SSP {parseFloat(String(sub.balance || '0')).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingAccount(sub); setFormData({ account_name: sub.account_name, account_code: sub.account_code, account_type: sub.account_type, parent_account_id: sub.parent_account_id?.toString() || '0', description: sub.description }); setShowAddModal(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(sub.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No sub-accounts for {selectedAccount.account_name}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingAccount ? 'Edit' : 'Add'} Account</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Account Name *</Label><Input value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})} required /></div>
              <div><Label>Account Code *</Label><Input value={formData.account_code} onChange={e => setFormData({...formData, account_code: e.target.value})} required /></div>
              <div><Label>Type</Label><Select value={formData.account_type} onValueChange={v => setFormData({...formData, account_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asset">Asset</SelectItem><SelectItem value="liability">Liability</SelectItem><SelectItem value="equity">Equity</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select></div>
              <div><Label>Parent Account</Label><Select value={formData.parent_account_id} onValueChange={v => setFormData({...formData, parent_account_id: v})}><SelectTrigger><SelectValue placeholder="None (Root)" /></SelectTrigger><SelectContent><SelectItem value="0">None (Root Account)</SelectItem>{getAllFlat(accounts).map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.account_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Description</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default LedgerAccounts;
