import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

const SecurityTest: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== SECURITY TEST: Component mounted ===');
    setMounted(true);
    
    // Test API call
    const testAPI = async () => {
      try {
        console.log('=== SECURITY TEST: Making API call ===');
        const response = await fetch('/api/users');
        console.log('=== SECURITY TEST: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('=== SECURITY TEST: API data received:', data);
          setApiData(data);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('=== SECURITY TEST: API error:', error);
        setApiError(error.message);
      }
    };
    
    testAPI();
  }, []);

  console.log('=== SECURITY TEST: Rendering component ===');
  console.log('Mounted:', mounted);
  console.log('API Data:', apiData);
  console.log('API Error:', apiError);

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Security Test Page</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <h2 className="font-semibold">Component Status</h2>
            <p>Mounted: {mounted ? 'YES' : 'NO'}</p>
            <p>Timestamp: {new Date().toISOString()}</p>
          </div>
          
          <div className="bg-white p-4 rounded border">
            <h2 className="font-semibold">API Test Results</h2>
            {apiError ? (
              <div className="text-red-600">
                <p>Error: {apiError}</p>
              </div>
            ) : apiData ? (
              <div className="text-green-600">
                <p>Success! Received {Array.isArray(apiData) ? apiData.length : 0} users</p>
                <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          
          <div className="bg-white p-4 rounded border">
            <h2 className="font-semibold">Console Logs</h2>
            <p>Check browser console (F12) for detailed logs starting with "=== SECURITY TEST:"</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SecurityTest;
