import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdTokenResult,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import { LocalAuthService, LocalUser } from '../services/auth/LocalAuthService';
import { UserRole, MemberProfile } from '@libraryos/shared';

interface AuthContextType {
  user: User | { uid: string; email: string | null } | null;
  profile: MemberProfile | null;
  role: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  setLocalSession: (localUser: LocalUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if an explicitly authenticated session exists
    const localUser = LocalAuthService.getCurrentUser();
    if (localUser) {
      setUser({ uid: localUser.uid, email: localUser.email });
      setProfile(localUser.profile);
      setRole(localUser.role);
      setIsLoading(false);
      return;
    }

    // Default clean unauthenticated public visitor state:
    setUser(null);
    setProfile(null);
    setRole('MEMBER');
    setIsLoading(false);
  }, []);

  const setLocalSession = (localUser: LocalUser) => {
    setUser({ uid: localUser.uid, email: localUser.email });
    setProfile(localUser.profile);
    setRole(localUser.role);
    LocalAuthService.setCurrentUser(localUser);
  };

  const signOut = async () => {
    LocalAuthService.logout();
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore offline firebase error
    }
    setUser(null);
    setProfile(null);
    setRole('MEMBER');
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (Array.isArray(roles)) {
      return roles.includes(role);
    }
    return role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        signOut,
        hasRole,
        setLocalSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
