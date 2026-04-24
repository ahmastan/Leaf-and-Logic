import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getProfile, upsertProfile } from '@/api/supabaseData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAuth();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const { data: { session } } = await supabase.auth.getSession();
      let u = session?.user ?? null;
      if (u?.id) {
        try {
          const metaName = u.user_metadata?.full_name;
          let profile = await getProfile(u.id);
          if (profile && !profile.full_name && metaName) {
            profile = await upsertProfile(u.id, { full_name: metaName });
          } else if (!profile && metaName) {
            profile = await upsertProfile(u.id, { full_name: metaName });
          }
          if (profile) u = { ...u, full_name: profile.full_name ?? metaName ?? u.email, ...profile };
          else if (metaName) u = { ...u, full_name: metaName };
        } catch (_) {}
      }
      setUser(u);
      setIsAuthenticated(!!session?.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError({ type: 'unknown', message: error?.message || 'Auth failed' });
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    supabase.auth.signOut();
    if (shouldRedirect) window.location.href = '/Login';
  };

  const navigateToLogin = () => {
    window.location.href = '/Login';
  };

  const updateMe = async (settings) => {
    if (!user?.id) return;
    await upsertProfile(user.id, settings);
    setUser((prev) => (prev ? { ...prev, ...settings } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState: checkAuth,
        updateMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
