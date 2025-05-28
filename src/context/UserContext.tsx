import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userProfileService } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export type UserProfileContextType = {
  user: { name: string; email?: string; password?: string } | null;
  setUser: React.Dispatch<React.SetStateAction<{ name: string; email?: string; password?: string } | null>>;
  userLoading: boolean;
  setUserLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUserProfile: () => Promise<void>;
};

const UserContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ name: string; email?: string; password?: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const fetchUserProfile = async () => {
    setUserLoading(true);
    try {
      const profile = await userProfileService.getDefaultProfile();
      if (profile) {
        setUser({ name: profile.name || profile.email || 'Guest', email: profile.email });
      } else {
        setUser({ name: 'Guest' });
      }
    } catch {
      setUser({ name: 'Guest' });
    }
    setUserLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && mounted) fetchUserProfile();
      else if (mounted) {
        setUser(null);
        setUserLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && mounted) fetchUserProfile();
      else if (mounted) {
        setUser(null);
        setUserLoading(false);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, userLoading, setUserLoading, fetchUserProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}; 