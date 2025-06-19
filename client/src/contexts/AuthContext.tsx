import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  avatar_url?: string | null;
  preferences: any;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isCommercial: boolean;
  isClient: boolean;
  userRoles: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  // Computed properties based on roles
  const isAdmin = userRoles.includes('admin');
  const isCommercial = userRoles.includes('commercial');
  const isClient = userRoles.includes('client');

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      console.log('Auth state changed:', session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
      setUser(session?.user ?? null);
      setLoading(false);
      setIsInitialized(true);

      if (session?.user && !profile) {
        fetchUserProfile(session.user.id);
        fetchUserRoles(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted || !isInitialized) return;

      console.log('Auth state changed:', event, session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user && !profile) {
        fetchUserProfile(session.user.id);
        fetchUserRoles(session.user.id);
      } else if (!session?.user) {
        setProfile(null);
        setUserRoles([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [profile, isInitialized]);

  const createProfile = async (userId: string, email: string, firstName?: string, lastName?: string) => {
    try {
      console.log('Creating profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          first_name: firstName || null,
          last_name: lastName || null,
          preferences: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      console.log('Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    if (profile?.id === userId) return;

    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (!data && user) {
        console.log('Profile not found, creating one...');
        try {
          const newProfile = await createProfile(
            userId, 
            user.email || '', 
            user.user_metadata?.first_name,
            user.user_metadata?.last_name
          );
          const profileData: Profile = {
            id: newProfile.id,
            email: newProfile.email,
            first_name: newProfile.first_name || undefined,
            last_name: newProfile.last_name || undefined,
            company: newProfile.company || undefined,
            avatar_url: newProfile.avatar_url || undefined,
            preferences: newProfile.preferences || {},
            created_at: newProfile.created_at || new Date().toISOString(),
            updated_at: newProfile.updated_at || new Date().toISOString()
          };
          setProfile(profileData);
        } catch (createError) {
          console.error('Error creating profile:', createError);
        }
      } else if (data) {
        console.log('Profile found:', data);
        const profileData: Profile = {
          id: data.id,
          email: data.email,
          first_name: data.first_name || undefined,
          last_name: data.last_name || undefined,
          company: data.company || undefined,
          avatar_url: data.avatar_url || undefined,
          preferences: data.preferences || {},
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        setProfile(profileData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    if (userRoles.length > 0 && user?.id === userId) return;

    try {
      console.log('Fetching roles for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return;
      }

      const roles = data?.map(r => r.role) || [];
      console.log('User roles:', roles);
      setUserRoles(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setUserRoles([]);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: error.message,
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue !",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: error.message,
        });
      } else {
        toast({
          title: "Inscription réussie",
          description: "Vérifiez votre email pour confirmer votre compte.",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRoles([]);
      toast({
        title: "Déconnexion",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('Updating profile with:', updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return { error };
      }

      console.log('Profile updated successfully:', data);
      const profileData: Profile = {
        id: data.id,
        email: data.email,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        company: data.company || undefined,
        avatar_url: data.avatar_url || undefined,
        preferences: data.preferences || {},
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };
      setProfile(profileData);

      return { error: null };
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    isAdmin,
    isCommercial,
    isClient,
    userRoles,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
