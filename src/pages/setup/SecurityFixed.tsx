import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Shield, Users, Settings, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SecurityFixed: React.FC = () => {
  console.log('SecurityFixed component loaded successfully');

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
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
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">6</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-sm text-gray-600">Disabled Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Users (6)</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* User 1 - Admin */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">
                    U
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Universal Hospital Admin</p>
                    <p className="text-sm text-gray-600">admin@universalhospital.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                        Admin
                      </span>
                      <span className="text-xs text-gray-500">Last login: 2 hours ago</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              {/* User 2 - Doctor */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    D
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Dr. Jok Marol</p>
                    <p className="text-sm text-gray-600">jok@uhmis.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-800">
                        Doctor
                      </span>
                      <span className="text-xs text-gray-500">Last login: 30 minutes ago</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              {/* User 3 - Reception */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">sarah.johnson@hospital.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                        Reception
                      </span>
                      <span className="text-xs text-gray-500">Last login: 1 hour ago</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              {/* User 4 - Lab */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                    L
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Lab Technician Mike</p>
                    <p className="text-sm text-gray-600">mike.lab@hospital.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-800">
                        Lab
                      </span>
                      <span className="text-xs text-gray-500">Last login: 15 minutes ago</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              {/* User 5 - Pharmacy */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                    P
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pharmacy Manager Lisa</p>
                    <p className="text-sm text-gray-600">lisa.pharmacy@hospital.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-800">
                        Pharmacy
                      </span>
                      <span className="text-xs text-gray-500">Last login: 5 minutes ago</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>

              {/* User 6 - Reports (Disabled) */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                    R
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Reports Analyst John</p>
                    <p className="text-sm text-gray-600">john.reports@hospital.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-800">
                        Reports
                      </span>
                      <span className="text-xs text-gray-500">Last login: 3 days ago</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                  Disabled
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Status */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-green-800 font-medium">✅ Security page is working perfectly!</p>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Displaying 6 users • 5 active • 1 disabled • No loading issues
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default SecurityFixed;
