import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Toaster } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import LoginPage from '@/app/components/LoginPage';
import SignupPage from '@/app/components/SignupPage';
import ClientDashboard from '@/app/components/client/ClientDashboard';
import TalentDashboard from '@/app/components/talent/TalentDashboard';
import AdminDashboard from '@/app/components/admin/AdminDashboard';
import HomePage from '@/app/components/HomePage';
import ServicesPage from '@/app/components/ServicesPage';
import AboutPage from '@/app/components/AboutPage';
import CoverageAreasPage from '@/app/components/CoverageAreasPage';
import VettingProcessPage from '@/app/components/VettingProcessPage';
import TermsPoliciesPage from '@/app/components/TermsPoliciesPage';

const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-d8ea749c`;

// Create singleton Supabase client to avoid multiple instances warning
let supabaseInstance: SupabaseClient | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseInstance;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const supabase = getSupabase();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.access_token) {
        setAccessToken(session.access_token);
        await fetchUserProfile(session.access_token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${serverUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Navigate to appropriate dashboard based on role
        if (data.user.role === 'client') {
          setCurrentPage('client-dashboard');
        } else if (data.user.role === 'talent') {
          setCurrentPage('talent-dashboard');
        } else if (data.user.role === 'admin' || data.user.role === 'manager') {
          setCurrentPage('admin-dashboard');
        }
      } else {
        // Fallback: get user data from Supabase auth metadata
        console.warn('[FRONTEND] Backend profile fetch failed, using auth metadata');
        const supabase = getSupabase();
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        
        if (authUser && authUser.user_metadata) {
          const userProfile = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata.name,
            role: authUser.user_metadata.role,
            company: authUser.user_metadata.company || null,
          };
          setUser(userProfile);
          
          // Navigate based on role
          if (userProfile.role === 'client') {
            setCurrentPage('client-dashboard');
          } else if (userProfile.role === 'talent') {
            setCurrentPage('talent-dashboard');
          } else if (userProfile.role === 'admin' || userProfile.role === 'manager') {
            setCurrentPage('admin-dashboard');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSignup = async (email: string, password: string, name: string, role: string, company?: string) => {
    try {
      console.log('[FRONTEND] Attempting signup:', { email, role });
      
      // Call backend to create user with email_confirm: true
      const signupResponse = await fetch(`${serverUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          company: company || null,
        }),
      });

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        console.error('[FRONTEND] Backend signup error:', errorData);
        throw new Error(errorData.error || 'Signup failed');
      }

      const signupData = await signupResponse.json();
      console.log('[FRONTEND] User created successfully:', signupData.user?.id);

      // Sign in immediately
      console.log('[FRONTEND] Attempting auto-login...');
      const supabase = getSupabase();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[FRONTEND] Auto-login error:', signInError);
        setCurrentPage('login');
        throw new Error('Account created! Please log in manually.');
      }

      if (signInData?.session) {
        console.log('[FRONTEND] Auto-login successful');
        setAccessToken(signInData.session.access_token);
        setUser(signupData.user);

        // Navigate to appropriate dashboard
        if (role === 'client') {
          setCurrentPage('client-dashboard');
        } else if (role === 'talent') {
          setCurrentPage('talent-dashboard');
        } else if (role === 'admin' || role === 'manager') {
          setCurrentPage('admin-dashboard');
        }
      }
    } catch (error: any) {
      console.error('[FRONTEND] Signup error:', error);
      throw error;
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        setAccessToken(data.session.access_token);
        await fetchUserProfile(data.session.access_token);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case 'signup':
        return <SignupPage onSignup={handleSignup} onNavigate={setCurrentPage} />;
      case 'services':
        return <ServicesPage serverUrl={serverUrl} onNavigate={setCurrentPage} user={user} publicAnonKey={publicAnonKey} onLogout={handleLogout} />;
      case 'client-dashboard':
        return user && user.role === 'client' ? (
          <ClientDashboard 
            user={user} 
            serverUrl={serverUrl} 
            accessToken={accessToken!}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
          />
        ) : <HomePage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
      case 'talent-dashboard':
        return user && user.role === 'talent' ? (
          <TalentDashboard 
            user={user} 
            serverUrl={serverUrl} 
            accessToken={accessToken!}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
          />
        ) : <HomePage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
      case 'admin-dashboard':
        return user && (user.role === 'admin' || user.role === 'manager') ? (
          <AdminDashboard 
            user={user} 
            serverUrl={serverUrl} 
            accessToken={accessToken!}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
          />
        ) : <HomePage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
      case 'about':
        return <AboutPage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
      case 'coverage-areas':
        return <CoverageAreasPage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
      case 'vetting-process':
        return <VettingProcessPage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
      case 'terms-policies':
        return <TermsPoliciesPage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
      default:
        return <HomePage onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div>
      <Toaster position="top-right" richColors />
      {renderPage()}
    </div>
  );
}