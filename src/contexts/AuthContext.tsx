import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  kycStatus: string;
  kycVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<{ success: boolean; needsKyc?: boolean }>;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app load and sync with server
    const initAuth = async () => {
      const storedUser = localStorage.getItem('aiser_user');
      const storedToken = localStorage.getItem('aiser_token');
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Sync with server to get latest KYC status
        try {
          const response = await fetch('http://localhost:5000/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const updatedUser = {
              ...parsedUser,
              kycStatus: data.user.kycStatus,
              kycVerified: data.user.kycVerified
            };
            setUser(updatedUser);
            localStorage.setItem('aiser_user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Failed to sync user data:', error);
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const userData = {
          id: data.user.id.toString(),
          email: data.user.email,
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          role: 'user',
          kycStatus: data.user.kycStatus,
          kycVerified: data.user.kycVerified || false
        };
        
        setUser(userData);
        localStorage.setItem('aiser_user', JSON.stringify(userData));
        localStorage.setItem('aiser_token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

    const updateUser = (patch: Partial<User>) => {
      setUser(prev => {
        const updated = { ...(prev || {}), ...(patch || {}) } as User;
        try {
          localStorage.setItem('aiser_user', JSON.stringify(updated));
        } catch (err) {
          // ignore localStorage errors
        }
        return updated;
      });
    };

  const register = async (userData: any): Promise<{ success: boolean; needsKyc?: boolean }> => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        const newUserData = {
          id: data.user.id.toString(),
          email: data.user.email,
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          role: 'user',
          kycStatus: data.user.kycStatus,
          kycVerified: data.user.kycVerified || false
        };
        
        setUser(newUserData);
        localStorage.setItem('aiser_user', JSON.stringify(newUserData));
        localStorage.setItem('aiser_token', data.token);
        
        return { success: true, needsKyc: data.needsKyc };
      }
      return { success: false };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aiser_user');
    localStorage.removeItem('aiser_token');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        updateUser,
        logout, 
        isAuthenticated: !!user, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
