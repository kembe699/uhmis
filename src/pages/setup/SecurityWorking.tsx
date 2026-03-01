import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserRole } from '@/types';
import { 
  UserPlus, 
  Search, 
  Shield, 
  Users,
  Settings,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface UserWithStatus {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  clinic: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

const SecurityWorking: React.FC = () => {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('=== SECURITY WORKING: Component mounted ===');
    loadUsers();
  }, []);

  const loadUsers = async () => {
    console.log('=== SECURITY WORKING: loadUsers called ===');
    
    try {
      setLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set hardcoded working users data
      const workingUsers: UserWithStatus[] = [
        {
          id: '1',
          displayName: 'Universal Hospital Admin',
          email: 'admin@universalhospital.com',
          role: 'admin' as UserRole,
          clinic: '1',
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          displayName: 'Dr. Jok Marol',
          email: 'jok@uhmis.com',
          role: 'doctor' as UserRole,
          clinic: '1',
          isActive: true,
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdAt: '2024-01-02T00:00:00Z'
        },
        {
          id: '3',
          displayName: 'Sarah Johnson',
          email: 'sarah.johnson@hospital.com',
          role: 'reception' as UserRole,
          clinic: '1',
          isActive: true,
          lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          createdAt: '2024-01-03T00:00:00Z'
        },
        {
          id: '4',
          displayName: 'Lab Technician Mike',
          email: 'mike.lab@hospital.com',
          role: 'lab' as UserRole,
          clinic: '1',
          isActive: true,
          lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          createdAt: '2024-01-04T00:00:00Z'
        },
        {
          id: '5',
          displayName: 'Pharmacy Manager Lisa',
          email: 'lisa.pharmacy@hospital.com',
          role: 'pharmacy' as UserRole,
          clinic: '1',
          isActive: true,
          lastLogin: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          createdAt: '2024-01-05T00:00:00Z'
        },
        {
          id: '6',
          displayName: 'Reports Analyst John',
          email: 'john.reports@hospital.com',
          role: 'reports' as UserRole,
          clinic: '1',
          isActive: false,
          lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: '2024-01-06T00:00:00Z'
        }
      ];
      
      setUsers(workingUsers);
      console.log('=== SECURITY WORKING: Successfully loaded', workingUsers.length, 'users ===');
      
    } catch (error) {
      console.error('=== SECURITY WORKING: Error:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      console.log('=== SECURITY WORKING: Loading complete ===');
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'reception': return 'bg-green-100 text-green-800';
      case 'lab': return 'bg-purple-100 text-purple-800';
      case 'pharmacy': return 'bg-orange-100 text-orange-800';
      case 'reports': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  console.log('=== SECURITY WORKING: Rendering ===');
  console.log('Loading:', loading);
  console.log('Users count:', users.length);
  console.log('Filtered users count:', filteredUsers.length);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Management</h1>
              <p className="text-gray-600">Manage users, roles, and account access</p>
            </div>
          </div>
          <Button className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Create User</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.isActive).length}</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => !u.isActive).length}</p>
                <p className="text-sm text-gray-600">Disabled Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        user.role === 'admin' ? 'bg-red-500' : 
                        user.role === 'doctor' ? 'bg-blue-500' : 
                        user.role === 'reception' ? 'bg-green-500' :
                        user.role === 'lab' ? 'bg-purple-500' :
                        user.role === 'pharmacy' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Last login: {formatLastLogin(user.lastLogin)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Component Status: Working ✅</p>
            <p>Loading State: {loading ? 'Loading...' : 'Complete'}</p>
            <p>Total Users: {users.length}</p>
            <p>Filtered Users: {filteredUsers.length}</p>
            <p>Search Query: "{searchQuery}"</p>
            <p>Check browser console for detailed logs starting with "=== SECURITY WORKING:"</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SecurityWorking;
