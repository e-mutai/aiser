import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  kycStatus: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<{ success: boolean; needsKyc?: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app load
    const storedUser = localStorage.getItem('aiser_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', { status: response.status, data });

      if (response.ok && data.token) {
        const userData = {
          id: data.user.id.toString(),
          email: data.user.email,
          firstName: '',
          lastName: '',
          role: 'user',
          kycStatus: data.user.kycStatus
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
        localStorage.setItem('aiser_user', JSON.stringify(userData));
        localStorage.setItem('aiser_token', data.token);
        return true;
      }
      console.log('Login failed - no token or bad response');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<{ success: boolean; needsKyc?: boolean }> => {
    try {
      console.log('Attempting registration for:', userData.email);
      const response = await fetch('http://localhost:5000/api/register', {
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
      console.log('Register response:', { status: response.status, data });

      if (response.ok && data.success && data.token) {
        const newUserData = {
          id: data.user.id.toString(),
          email: data.user.email,
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          role: 'user',
          kycStatus: data.user.kycStatus
        };
        
        console.log('Setting user data:', newUserData);
        setUser(newUserData);
        localStorage.setItem('aiser_user', JSON.stringify(newUserData));
        localStorage.setItem('aiser_token', data.token);
        
        // Return success with KYC requirement
        return { success: true, needsKyc: data.needsKyc };
      }
      console.log('Registration failed - no token or bad response');
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
