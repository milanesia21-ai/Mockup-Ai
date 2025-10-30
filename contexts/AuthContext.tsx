
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  deleteAccount: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  signup: () => {},
  logout: () => {},
  updateProfile: () => {},
  deleteAccount: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('authUser');
    }
  }, []);

  const login = useCallback((email: string) => {
    // This is a mock login function.
    const mockUser: User = {
      uid: 'mock-uid-123',
      email: email,
      displayName: 'Mock User',
      bio: 'Loves creating AI mockups.',
    };
    localStorage.setItem('authUser', JSON.stringify(mockUser));
    setUser(mockUser);
    toast.success('Login successful!');
  }, []);
  
  const signup = useCallback((email: string) => {
    // Mock signup is the same as login for this example.
    const mockUser: User = {
      uid: 'mock-uid-123',
      email: email,
      displayName: 'New User',
    };
    localStorage.setItem('authUser', JSON.stringify(mockUser));
    setUser(mockUser);
    toast.success('Account created successfully!');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authUser');
    setUser(null);
    toast.info('You have been logged out.');
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      toast.success('Profile updated!');
      return updatedUser;
    });
  }, []);

  const deleteAccount = useCallback(() => {
    if (window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
        localStorage.clear(); // Clear everything for simplicity
        setUser(null);
        toast.success('Your account has been deleted.');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
