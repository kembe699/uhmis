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
  sub_accounts?: LedgerAccount[];
}

const LedgerAccounts: React.FC = () => {
  console.log('[LedgerAccounts] Component is loading!');
  const { user } = useAuth();
  console.log('[LedgerAccounts] User logged in:', !!user, 'Role:', user?.role);
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

  const renderAccount = (account: LedgerAccount, level = 0) => (
    <div key={account.id}>
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 border-b" style={{ paddingLeft: `${level * 24 + 12}px` }}>
        <div className="flex items-center gap-2 flex-1">
          {account.sub_accounts && account.sub_accounts.length > 0 && (
            <button onClick={() => toggleExpand(account.id)} className="p-1">
              {expandedAccounts.has(account.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          <div className="flex-1">
            <div className="font-medium">{account.account_name}</div>
            <div className="text-sm text-muted-foreground">{account.account_code} • {account.account_type}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setEditingAccount(account); setFormData({ account_name: account.account_name, account_code: account.account_code, account_type: account.account_type, parent_account_id: account.parent_account_id?.toString() || '0', description: account.description }); setShowAddModal(true); }}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {expandedAccounts.has(account.id) && account.sub_accounts?.map(sub => renderAccount(sub, level + 1))}
    </div>
  );

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

        <Card>
          <CardHeader><CardTitle>Accounts</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div>Loading...</div> : accounts.length === 0 ? <div className="text-center py-8 text-muted-foreground">No accounts yet</div> : <div className="border rounded-lg">{accounts.map(acc => renderAccount(acc))}</div>}
          </CardContent>
        </Card>

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
