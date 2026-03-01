import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.mysql';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserRole } from '@/types';
import { 
  UserPlus, 
  Search, 
  Shield, 
  Users,
  Settings,
  Loader2
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
}

const Security: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('=== SIMPLE SECURITY PAGE: Component mounted ===');
    loadUsers();
  }, []);

  const loadUsers = async () => {
    console.log('=== SIMPLE SECURITY: loadUsers called ===');
    
    try {
      setLoading(true);
      
      // Try API first
      console.log('Attempting API call...');
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const apiUsers = await response.json();
        console.log('API users received:', apiUsers);
        
        const transformedUsers = apiUsers.map((apiUser: any) => ({
          id: apiUser.id,
          displayName: apiUser.display_name || apiUser.email,
          email: apiUser.email,
          role: apiUser.role,
          clinic: apiUser.clinic_id?.toString() || '1',
          isActive: apiUser.is_active !== false
        }));
        
        setUsers(transformedUsers);
        console.log('Successfully set users from API');
      } else {
        throw new Error('API failed');
      }
    } catch (error) {
      console.log('API failed, using fallback data:', error);
      
      // Fallback hardcoded users
      const fallbackUsers: UserWithStatus[] = [
        {
          id: '1',
          displayName: 'Universal Hospital Admin',
          email: 'admin@universalhospital.com',
          role: 'admin' as UserRole,
          clinic: '1',
          isActive: true
        },
        {
          id: '2',
          displayName: 'Jok Marol',
          email: 'jok@uhmis.com',
          role: 'doctor' as UserRole,
          clinic: '1',
          isActive: true
        }
      ];
      
      setUsers(fallbackUsers);
      console.log('Set fallback users');
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('=== RENDER: Security component rendering ===');
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        user.role === 'admin' ? 'bg-red-500' : 
                        user.role === 'doctor' ? 'bg-blue-500' : 
                        'bg-gray-500'
                      }`}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
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
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Security;
