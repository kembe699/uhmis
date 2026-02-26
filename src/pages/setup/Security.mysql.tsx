import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql';
import { useDatabase } from '@/contexts/DatabaseContext.browser';
import { AppLayout } from '@/components/layout/AppLayout';
import { User, UserRole } from '@/types';
import { 
  UserPlus, 
  Search, 
  Shield, 
  Eye, 
  EyeOff,
  Edit,
  Check,
  X,
  Loader2,
  Users,
  Settings,
  AlertCircle,
  Trash2
} from 'lucide-react';
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
import { toast } from 'sonner';

interface UserWithStatus extends User {
  id: string;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

const Security: React.FC = () => {
  const { user } = useAuth();
  const { userRepo } = useDatabase();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStatus | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithStatus | null>(null);
  const [saving, setSaving] = useState(false);

  // Create user form state
  const [createFormData, setCreateFormData] = useState({
    displayName: '',
    email: '',
    role: '' as UserRole | '',
    clinic: user?.clinic || ''
  });

  // Edit user form state
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    role: '' as UserRole | '',
    clinic: ''
  });

  const roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrator' },
    { value: 'reception', label: 'Reception' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'reports', label: 'Reports' }
  ];

  const clinics = [
    'Universal Hospital',
    
  ];

  useEffect(() => {
    fetchUsers();
  }, [user?.clinic]);

  const fetchUsers = async () => {
    if (!user?.clinic) return;
    
    try {
      // Find users by clinic using our repository
      const dbUsers = await userRepo.findByClinic(1); // This should be dynamically fetched based on clinic name
      
      // Convert to application user format
      const usersData = await Promise.all(
        dbUsers.map(async (dbUser) => {
          const appUser = await userRepo.toApplicationUser(dbUser);
          return {
            ...appUser,
            id: dbUser.id,
            isActive: dbUser.get('is_active') !== false
          } as UserWithStatus;
        })
      );
      
      setUsers(usersData.sort((a, b) => a.displayName.localeCompare(b.displayName)));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Check if user with this email already exists
      const existingUser = await userRepo.findByEmail(createFormData.email.toLowerCase());
      
      if (existingUser) {
        toast.error('A user with this email already exists');
        setSaving(false);
        return;
      }
      
      // Create user in MySQL database
      await userRepo.create({
        email: createFormData.email.toLowerCase().trim(),
        display_name: createFormData.displayName.trim(),
        role: createFormData.role,
        clinic_id: 1, // This should be dynamically fetched based on clinic name
        is_active: true,
        status: 'pending', // User needs to set password on first login
        created_at: new Date(),
        created_by: user.displayName
      });
      
      toast.success(`User ${createFormData.displayName} created successfully. They can now log in to set their password.`);
      setShowCreateForm(false);
      setCreateFormData({
        displayName: '',
        email: '',
        role: '',
        clinic: user?.clinic || ''
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setSaving(true);
    
    try {
      // Update user in MySQL database
      await userRepo.update(editingUser.id, {
        display_name: editFormData.displayName.trim(),
        role: editFormData.role,
        clinic_id: 1, // This should be dynamically fetched based on clinic name
        updated_at: new Date(),
        updated_by: user?.displayName
      });
      
      toast.success(`User ${editFormData.displayName} updated successfully`);
      setShowEditForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Update user status in MySQL database
      await userRepo.update(userId, {
        is_active: !currentStatus,
        updated_at: new Date(),
        updated_by: user?.displayName
      });
      
      toast.success(`User ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    setSaving(true);
    
    try {
      // Delete user from MySQL database
      await userRepo.delete(deletingUser.id);
      
      toast.success(`User ${deletingUser.displayName} deleted successfully`);
      setShowDeleteDialog(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (userToDelete: UserWithStatus) => {
    setDeletingUser(userToDelete);
    setShowDeleteDialog(true);
  };

  const openEditForm = (userToEdit: UserWithStatus) => {
    setEditingUser(userToEdit);
    setEditFormData({
      displayName: userToEdit.displayName,
      role: userToEdit.role,
      clinic: userToEdit.clinic
    });
    setShowEditForm(true);
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      doctor: 'bg-blue-100 text-blue-800',
      reception: 'bg-green-100 text-green-800',
      lab: 'bg-purple-100 text-purple-800',
      pharmacy: 'bg-orange-100 text-orange-800',
      reports: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="module-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Security Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and account access • {user?.clinic}
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="quick-action-btn">
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Create User</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => !u.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Disabled Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'No users match your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.displayName}</td>
                      <td className="text-muted-foreground">{u.email}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-muted-foreground">{u.clinic}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditForm(u)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={u.isActive ? "destructive" : "default"}
                            onClick={() => handleToggleUserStatus(u.id, u.isActive || false)}
                            className="h-8 w-8 p-0"
                          >
                            {u.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(u)}
                            className="h-8 w-8 p-0"
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

        {/* Create User Modal */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Create New User
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div className="form-field">
                <Label htmlFor="displayName" className="form-label">
                  Full Name *
                </Label>
                <Input
                  id="displayName"
                  value={createFormData.displayName}
                  onChange={(e) => setCreateFormData({ ...createFormData, displayName: e.target.value })}
                  placeholder="Enter full name"
                  required
                  autoFocus
                  className="h-12"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="email" className="form-label">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                  className="h-12"
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> The user will set their password when they first log in.
                </p>
              </div>

              <div className="form-field">
                <Label htmlFor="role" className="form-label">
                  Role *
                </Label>
                <Select
                  value={createFormData.role}
                  onValueChange={(value: UserRole) => setCreateFormData({ ...createFormData, role: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="clinic" className="form-label">
                  Branch *
                </Label>
                <Select
                  value={createFormData.clinic}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, clinic: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Universal Hospital">
                      Universal Hospital
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saving || !createFormData.displayName.trim() || !createFormData.email.trim() || !createFormData.role}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Create User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit User
              </DialogTitle>
            </DialogHeader>
            
            {editingUser && (
              <form onSubmit={handleEditUser} className="space-y-4 mt-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Email: {editingUser.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {editingUser.isActive ? 'Active' : 'Disabled'}
                  </p>
                </div>

                <div className="form-field">
                  <Label htmlFor="editDisplayName" className="form-label">
                    Full Name *
                  </Label>
                  <Input
                    id="editDisplayName"
                    value={editFormData.displayName}
                    onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                    placeholder="Enter full name"
                    required
                    autoFocus
                    className="h-12"
                  />
                </div>

                <div className="form-field">
                  <Label htmlFor="editRole" className="form-label">
                    Role *
                  </Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(value: UserRole) => setEditFormData({ ...editFormData, role: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-field">
                  <Label htmlFor="editClinic" className="form-label">
                    Branch *
                  </Label>
                  <Select
                    value={editFormData.clinic}
                    onValueChange={(value) => setEditFormData({ ...editFormData, clinic: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Universal Hospital">
                        Universal Hospital
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditForm(false)}
                    className="flex-1"
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={saving || !editFormData.displayName.trim() || !editFormData.role}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Update User
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Delete User
              </DialogTitle>
            </DialogHeader>
            
            {deletingUser && (
              <div className="space-y-4 mt-4">
                <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Warning: This action cannot be undone!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You are about to permanently delete the user account for:
                  </p>
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="font-medium">{deletingUser.displayName}</p>
                    <p className="text-sm text-muted-foreground">{deletingUser.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {deletingUser.role} • {deletingUser.clinic}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeletingUser(null);
                    }}
                    className="flex-1"
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteUser}
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete User
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

export default Security;
