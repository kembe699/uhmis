import React, { useState, useEffect } from 'react';

const SecurityMinimal: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== MINIMAL SECURITY: Component mounted ===');
    
    const loadData = async () => {
      try {
        console.log('=== MINIMAL SECURITY: Starting data load ===');
        setLoading(true);
        
        // Force a delay to see loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('=== MINIMAL SECURITY: Making API call ===');
        const response = await fetch('/api/users');
        console.log('=== MINIMAL SECURITY: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('=== MINIMAL SECURITY: Data received:', data);
          setUsers(data);
          setError(null);
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (err) {
        console.error('=== MINIMAL SECURITY: Error:', err);
        setError(err.message);
        
        // Set fallback data
        const fallbackUsers = [
          {
            id: '1',
            display_name: 'Admin User',
            email: 'admin@test.com',
            role: 'admin',
            is_active: true
          },
          {
            id: '2',
            display_name: 'Doctor User', 
            email: 'doctor@test.com',
            role: 'doctor',
            is_active: true
          }
        ];
        setUsers(fallbackUsers);
        console.log('=== MINIMAL SECURITY: Set fallback data ===');
      } finally {
        console.log('=== MINIMAL SECURITY: Setting loading to false ===');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  console.log('=== MINIMAL SECURITY: Rendering ===');
  console.log('Loading:', loading);
  console.log('Users count:', users.length);
  console.log('Error:', error);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Minimal Security Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Status</h2>
        <p>Loading: {loading ? 'YES' : 'NO'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Users count: {users.length}</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading users...</p>
        </div>
      ) : (
        <div>
          <h2>Users ({users.length})</h2>
          {users.length === 0 ? (
            <p>No users found</p>
          ) : (
            <div>
              {users.map((user, index) => (
                <div key={user.id || index} style={{ 
                  padding: '10px', 
                  margin: '10px 0', 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <strong>{user.display_name || user.displayName || 'Unknown'}</strong><br/>
                  <span style={{ color: '#666' }}>{user.email}</span><br/>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    backgroundColor: user.role === 'admin' ? '#ff6b6b' : '#4ecdc4',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {user.role}
                  </span>
                  <span style={{ 
                    marginLeft: '10px',
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    backgroundColor: user.is_active ? '#51cf66' : '#ff6b6b',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>Debug Info</h3>
        <p>Check browser console for detailed logs starting with "=== MINIMAL SECURITY:"</p>
        <p>Current URL: {window.location.href}</p>
        <p>Pathname: {window.location.pathname}</p>
      </div>
    </div>
  );
};

export default SecurityMinimal;
