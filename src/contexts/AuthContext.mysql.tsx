import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

// Browser-safe user API client
class UserApiClient {
  private baseUrl = 'http://localhost:3001/api/users';

  async findByEmail(email: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/email/${email}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async create(userData: any): Promise<User> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, userData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  async verifyPassword(user: any, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid || user.id, password }),
      });
      if (!response.ok) return false;
      const result = await response.json();
      return result.valid;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async toApplicationUser(dbUser: any): Promise<User> {
    return {
      uid: dbUser.id || dbUser.uid,
      email: dbUser.email,
      displayName: dbUser.display_name || dbUser.displayName,
      role: dbUser.role,
      clinic: dbUser.clinic_id?.toString() || dbUser.clinic,
      isActive: dbUser.is_active !== false
    };
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Initialize user API client
const userRepository = new UserApiClient();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      try {
        const sessionUser = localStorage.getItem('currentUser');
        if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          // Verify user still exists in database
          const dbUser = await userRepository.findById(userData.uid);
          if (dbUser) {
            const appUser = await userRepository.toApplicationUser(dbUser);
            setUser(appUser);
          } else {
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Find user by email
      const userData = await userRepository.findByEmail(email.toLowerCase());
      
      if (!userData) {
        toast.error('Invalid email or password');
        throw new Error('User not found');
      }

      // Verify password (you'll need to implement password hashing/verification)
      const isValidPassword = await userRepository.verifyPassword(userData.id, password);
      
      if (!isValidPassword) {
        toast.error('Invalid email or password');
        throw new Error('Invalid password');
      }

      // Convert to application user model
      const appUser = await userRepository.toApplicationUser(userData);
      setUser(appUser);
      
      // Store session
      localStorage.setItem('currentUser', JSON.stringify(appUser));
      
      console.log('Signed in:', appUser.email);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast.error(error.message || 'Invalid email or password');
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
