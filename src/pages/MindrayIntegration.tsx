import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FlaskConical, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  TestTube2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface LabRequest {
  id: string;
  patientId: string;
  patientName: string;
  testType: string;
  status: 'pending' | 'partial' | 'completed' | 'results_sent';
  requestedAt: string;
  clinic: string;
}

const MindrayIntegrationPage: React.FC = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [port, setPort] = useState('8080');
  const [isSaving, setIsSaving] = useState(false);

  // Simulate analyzer connection
  const handleConnect = async () => {
    if (!ipAddress.trim() || !port.trim()) {
      toast.error('Please enter IP address and port');
      return;
    }

    setConnectionStatus('connecting');
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
      toast.success(`Connected to Mindray Analyzer at ${ipAddress}:${port}`);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    // Update localStorage to reflect disconnected state
    try {
      const savedSettings = localStorage.getItem('mindray-connection-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        settings.isConnected = false;
        localStorage.setItem('mindray-connection-settings', JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Error updating connection state:', error);
    }
    
    toast.info('Disconnected from Mindray Analyzer');
  };

  // Load saved connection parameters and connection state
  const loadConnectionSettings = () => {
    try {
      const savedSettings = localStorage.getItem('mindray-connection-settings');
      if (savedSettings) {
        const { ipAddress: savedIp, port: savedPort, isConnected: savedConnected } = JSON.parse(savedSettings);
        if (savedIp) setIpAddress(savedIp);
        if (savedPort) setPort(savedPort);
        if (savedConnected) {
          setIsConnected(true);
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Error loading connection settings:', error);
    }
  };

  // Save connection parameters and establish connection
  const handleSaveSettings = async () => {
    if (!ipAddress.trim() || !port.trim()) {
      toast.error('Please enter IP address and port');
      return;
    }

    setIsSaving(true);
    
    try {
      // First save the settings
      const settings = {
        ipAddress: ipAddress.trim(),
        port: port.trim(),
        isConnected: true,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('mindray-connection-settings', JSON.stringify(settings));
      
      // Then establish connection
      setConnectionStatus('connecting');
      
      // Simulate connection delay
      setTimeout(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        toast.success(`Settings saved and connected to Mindray Analyzer at ${ipAddress}:${port}`);
        setIsSaving(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving connection settings:', error);
      toast.error('Failed to save connection settings');
      setIsSaving(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    loadConnectionSettings();
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mindray Analyzer Integration</h1>
            <p className="text-gray-600 mt-2">Connect and import CBC results from Mindray analyzer</p>
          </div>
          <Badge 
            variant={isConnected ? 'default' : 'secondary'}
            className={`px-3 py-1 ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
        </div>

      {/* Device Configuration Panel */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Mindray Analyzer Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Mindray BC-5000</p>
              <p className="text-sm text-gray-600">Hematology Analyzer</p>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connecting' && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              )}
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* IP and Port Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.100"
                disabled={isConnected}
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="8080"
                disabled={isConnected}
              />
            </div>
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <Label>Connection Status</Label>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">
                {connectionStatus === 'connecting' ? 'Connecting...' : 
                 isConnected ? `Connected to analyzer at ${ipAddress}:${port}` : 'Not connected'}
              </span>
            </div>
          </div>

          {/* Connection Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving || !ipAddress.trim() || !port.trim()}
              variant="outline"
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            {!isConnected ? (
              <Button 
                onClick={handleConnect}
                disabled={connectionStatus === 'connecting'}
                className="flex-1"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                className="flex-1"
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
};

export default MindrayIntegrationPage;
