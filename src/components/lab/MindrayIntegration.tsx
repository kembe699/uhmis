import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Download, Settings, RefreshCw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { LabIntegrationService } from '@/services/labIntegrationService';
import { MindrayResult } from '@/services/mindrayIntegration';

interface MindrayIntegrationProps {
  testRequestId?: string;
  onResultReceived?: (sampleId: string, results: MindrayResult) => void;
}

export const MindrayIntegration: React.FC<MindrayIntegrationProps> = ({ 
  testRequestId,
  onResultReceived 
}) => {
  const [integrationService, setIntegrationService] = useState<LabIntegrationService | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean; host: string; port: number} | null>(null);
  const [sampleId, setSampleId] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [host, setHost] = useState('192.168.1.100'); // Default IP for BC-10
  const [port, setPort] = useState(5100);
  const [lastResult, setLastResult] = useState<MindrayResult | null>(null);

  useEffect(() => {
    initializeIntegration();
    return () => {
      if (integrationService) {
        integrationService.disconnect();
      }
    };
  }, []);

  const initializeIntegration = async () => {
    setIsConnecting(true);
    try {
      const service = new LabIntegrationService(host, port);
      
      // Don't require actual connection for initialization
      setIntegrationService(service);
      
      const status = await service.getConnectionStatus();
      setConnectionStatus(status);
      
      if (status.connected) {
        toast.success('Connected to Mindray analyzer');
      } else {
        console.log('Mindray analyzer not connected - will use mock data for testing');
      }
    } catch (error) {
      console.error('Failed to initialize Mindray integration:', error);
      setConnectionStatus({ connected: false, host, port });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRequestResult = async () => {
    if (!integrationService || !sampleId.trim()) {
      toast.error('Please enter a sample ID');
      return;
    }

    setIsRequesting(true);
    try {
      const result = await integrationService.requestCBCResult(sampleId, testRequestId);
      
      if (result) {
        setLastResult(result);
        toast.success(`CBC results received for sample ${sampleId}`);
        
        if (onResultReceived) {
          onResultReceived(sampleId, result);
        }
        
        // Force a small delay to ensure database is updated before refreshing UI
        setTimeout(() => {
          if (onResultReceived) {
            onResultReceived(sampleId, result);
          }
        }, 500);
        
        // Clear sample ID after successful request
        setSampleId('');
      } else {
        toast.error('No results found for this sample ID');
      }
    } catch (error) {
      console.error('Error requesting result:', error);
      toast.error('Failed to request result from analyzer');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleReconnect = async () => {
    if (integrationService) {
      integrationService.disconnect();
    }
    await initializeIntegration();
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    try {
      // Create a new service with the current host/port settings
      const testService = new LabIntegrationService(host, port);
      
      // Try to initialize and connect to the real BC-10 device
      await testService.initialize();
      
      const status = await testService.getConnectionStatus();
      if (status.connected) {
        toast.success(`Successfully connected to Mindray BC-10 at ${host}:${port}`);
        
        // Update the main service with the working connection
        if (integrationService) {
          integrationService.disconnect();
        }
        setIntegrationService(testService);
        setConnectionStatus(status);
      } else {
        toast.error(`Failed to connect to BC-10 device at ${host}:${port}`);
      }
    } catch (error: any) {
      console.error('BC-10 connection test failed:', error);
      toast.error(`BC-10 Connection Failed: ${error.message || 'Device not reachable'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUpdateConnection = async () => {
    if (!host.trim()) {
      toast.error('Please enter a valid IP address');
      return;
    }
    
    if (port < 1 || port > 65535) {
      toast.error('Please enter a valid port number (1-65535)');
      return;
    }

    setIsConnecting(true);
    try {
      // Disconnect current service
      if (integrationService) {
        integrationService.disconnect();
      }

      // Create new service with updated settings
      const newService = new LabIntegrationService(host, port);
      setIntegrationService(newService);
      
      const status = await newService.getConnectionStatus();
      setConnectionStatus(status);
      
      toast.success(`Connection settings updated to ${host}:${port}`);
    } catch (error) {
      console.error('Failed to update connection:', error);
      toast.error('Failed to update connection settings');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClearResults = async () => {
    if (!integrationService || !testRequestId) {
      toast.error('No test request to clear');
      return;
    }

    try {
      await integrationService.clearComponentValues(testRequestId);
      setLastResult(null);
      toast.success('CBC results cleared from database');
      
      // Trigger callback to refresh UI
      if (onResultReceived) {
        onResultReceived('', null as any);
      }
    } catch (error) {
      console.error('Error clearing results:', error);
      toast.error('Failed to clear results');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Mindray Analyzer Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {connectionStatus?.connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              {connectionStatus?.connected ? 'Connected' : 'Mock Mode'}
            </span>
          </div>
          <Badge variant={connectionStatus?.connected ? 'default' : 'secondary'}>
            {connectionStatus?.host}:{connectionStatus?.port}
          </Badge>
        </div>

        {/* BC-10 Device Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">Mindray BC-10 Device Settings</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">IP Address</label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.100"
                disabled={isConnecting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 5100)}
                placeholder="5100"
                disabled={isConnecting}
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleUpdateConnection}
            disabled={isConnecting}
            className="w-full"
          >
            Update Connection Settings
          </Button>
        </div>

        {/* Sample ID Request */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sample ID</label>
          <div className="flex gap-2">
            <Input
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
              placeholder="Enter sample ID (e.g., CBC001)"
              onKeyPress={(e) => e.key === 'Enter' && handleRequestResult()}
              disabled={isRequesting}
            />
            <Button 
              onClick={handleRequestResult}
              disabled={isRequesting || !integrationService}
            >
              <Download className="w-4 h-4 mr-2" />
              {isRequesting ? 'Requesting...' : 'Get Results'}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={isConnecting}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
            {isConnecting ? 'Testing BC-10...' : 'Test BC-10 Connection'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClearResults}
            disabled={isConnecting || !lastResult}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReconnect}
            disabled={isConnecting}
          >
            Reset
          </Button>
        </div>

        {/* Last Result Summary */}
        {lastResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-2">
              Last Result: Sample {lastResult.sampleId}
            </div>
            <div className="text-xs text-green-600">
              {lastResult.components.length} parameters received at {new Date(lastResult.timestamp).toLocaleTimeString()}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Components: {lastResult.components.slice(0, 5).map(c => c.name).join(', ')}
              {lastResult.components.length > 5 && ` +${lastResult.components.length - 5} more`}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          <strong>BC-10 Setup:</strong> Enter your Mindray BC-10 device IP address and port (usually 5100). 
          Click "Test BC-10 Connection" to verify connectivity. Once connected, enter sample IDs to retrieve CBC results directly from the analyzer.
          {!connectionStatus?.connected && (
            <div className="mt-1 text-orange-600">
              <strong>Mock Mode:</strong> Device not connected - using test data for demonstration.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
