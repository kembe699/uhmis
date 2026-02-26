import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Browser-safe auth API client that uses HTTP calls to MySQL backend
class AuthApiClient {
  private getBaseUrl() {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      return 'http://localhost:3001/api/auth';
    } else {
      return `http://${hostname}:3001/api/auth`;
    }
  }
  
  private get baseUrl() {
    return this.getBaseUrl();
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { error: 'Login failed' };
      }
      throw new Error(error.error || 'Login failed');
    }

    return await response.json();
  }

  async verifyToken(token: string): Promise<{ user: any }> {
    const response = await fetch(`${this.baseUrl}/verify`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return await response.json();
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

const authApi = new AuthApiClient();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
          const { user: userData } = await authApi.verifyToken(savedToken);
          setToken(savedToken);
          setUser({
            uid: userData.id,
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
            clinic: userData.clinicId?.toString() || '',
          });
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { token: authToken, user: userData } = await authApi.login(email, password);
      
      // Save token to localStorage
      localStorage.setItem('auth_token', authToken);
      setToken(authToken);
      
      // Set user data
      setUser({
        uid: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        clinic: userData.clinicId?.toString() || '',
      });

      // Don't call toast here to avoid render warnings
    } catch (error: any) {
      console.error('Sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      // Don't call toast here to avoid render warnings
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, token }}>
      {children}
    </AuthContext.Provider>
  );
};
