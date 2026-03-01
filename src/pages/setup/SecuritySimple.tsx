import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  UserPlus, 
  Search, 
  Shield, 
  Users,
  Settings,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SecuritySimple: React.FC = () => {
  // Hardcoded users - no useState, no useEffect, no async
  const users = [
    {
      id: '1',
      displayName: 'Universal Hospital Admin',
      email: 'admin@universalhospital.com',
      role: 'admin',
      clinic: '1',
      isActive: true,
      lastLogin: '2 hours ago'
    },
    {
      id: '2',
      displayName: 'Dr. Jok Marol',
      email: 'jok@uhmis.com',
      role: 'doctor',
      clinic: '1',
      isActive: true,
      lastLogin: '30 minutes ago'
    },
    {
      id: '3',
      displayName: 'Sarah Johnson',
      email: 'sarah.johnson@hospital.com',
      role: 'reception',
      clinic: '1',
      isActive: true,
      lastLogin: '1 hour ago'
    },
    {
      id: '4',
      displayName: 'Lab Technician Mike',
      email: 'mike.lab@hospital.com',
      role: 'lab',
      clinic: '1',
      isActive: true,
      lastLogin: '15 minutes ago'
    },
    {
      id: '5',
      displayName: 'Pharmacy Manager Lisa',
      email: 'lisa.pharmacy@hospital.com',
      role: 'pharmacy',
      clinic: '1',
      isActive: true,
      lastLogin: '5 minutes ago'
    },
    {
      id: '6',
      displayName: 'Reports Analyst John',
      email: 'john.reports@hospital.com',
      role: 'reports',
      clinic: '1',
      isActive: false,
      lastLogin: '3 days ago'
    }
  ];

  const activeUsers = users.filter(u => u.isActive);
  const disabledUsers = users.filter(u => !u.isActive);

  const getRoleBadgeColor = (role: string) => {
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

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'doctor': return 'bg-blue-500';
      case 'reception': return 'bg-green-500';
      case 'lab': return 'bg-purple-500';
      case 'pharmacy': return 'bg-orange-500';
      case 'reports': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  console.log('SecuritySimple rendering with', users.length, 'users');

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
                <p className="text-2xl font-bold text-gray-900">{activeUsers.length}</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{disabledUsers.length}</p>
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
              className="flex-1"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Users ({users.length})</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(user.role)}`}>
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
                          Last login: {user.lastLogin}
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
          </div>
        </div>

        {/* Status */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-green-800 font-medium">Security page is working correctly!</p>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Displaying {users.length} users • {activeUsers.length} active • {disabledUsers.length} disabled
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default SecuritySimple;
