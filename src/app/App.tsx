import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getSupabase, getFreshToken } from '/utils/supabase/client';
import LoginPage from '@/app/components/LoginPage';
import SignupPage from '@/app/components/SignupPage';
import ClientDashboard from '@/app/components/client/ClientDashboard';
import TalentDashboard from '@/app/components/talent/TalentDashboard';
import AdminDashboard from '@/app/components/admin/AdminDashboard';
import HomePage from '@/app/components/HomePage';
import ServicesPage from '@/app/components/ServicesPage';
import PortfolioPage from '@/app/components/PortfolioPage';
import AboutPage from '@/app/components/AboutPage';
import CoverageAreasPage from '@/app/components/CoverageAreasPage';
import VettingProcessPage from '@/app/components/VettingProcessPage';
import TermsPoliciesPage from '@/app/components/TermsPoliciesPage';
import { updateDocumentMeta } from '@/app/utils/seo';

const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-d8ea749c`;

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check for existing session on mount & keep token in sync
  useEffect(() => {
    checkSession();

    // Listen for auth state changes (e.g. background token refresh)
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          setAccessToken(session.access_token);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle URL-based routing on mount
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');
    
    // Map URL paths to page names
    const routeMap: Record<string, string> = {
      '/admin-signup': 'admin-signup',
      '/signup': 'signup',
      '/login': 'login',
      '/services': 'services',
      '/portfolio': 'portfolio',
      '/about': 'about',
      '/coverage-areas': 'coverage-areas',
      '/vetting-process': 'vetting-process',
      '/terms-policies': 'terms-policies',
    };

    // Check hash first (for hash-based routing)
    if (hash && routeMap[`/${hash}`]) {
      setCurrentPage(routeMap[`/${hash}`]);
    }
    // Then check pathname (for path-based routing)
    else if (path !== '/' && routeMap[path]) {
      setCurrentPage(routeMap[path]);
      // Update URL to use hash for consistency (SPA routing)
      window.history.replaceState(null, '', `#${path.substring(1)}`);
    }
  }, []);

  // Update document title and meta for SEO when page changes
  useEffect(() => {
    updateDocumentMeta(currentPage);
  }, [currentPage]);

  const checkSession = async () => {
    try {
      // Use getFreshToken which checks JWT expiry and refreshes if needed
      const token = await getFreshToken();
      
      if (token) {
        setAccessToken(token);
        await fetchUserProfile(token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper: build a user profile from Supabase auth metadata.
   * Used when the backend /auth/me endpoint is unreachable or returns an error.
   */
  const buildProfileFromAuth = async (): Promise<any | null> => {
    const supabase = getSupabase();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.user_metadata) return null;

    // Make sure accessToken state has the current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) setAccessToken(session.access_token);

    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata.name,
      role: authUser.user_metadata.role,
      company: authUser.user_metadata.company || null,
    };
  };

  /** Navigate to the correct dashboard based on user role */
  const navigateByRole = (role: string) => {
    if (role === 'client') handleNavigate('client-dashboard');
    else if (role === 'talent') handleNavigate('talent-dashboard');
    else if (role === 'admin' || role === 'manager') handleNavigate('admin-dashboard');
  };

  const fetchUserProfile = async (token: string) => {
    try {
      // Single attempt against the backend
      const response = await fetch(`${serverUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        navigateByRole(data.user.role);
        return;
      }

      // Backend returned an error (401, 404, 500, etc.)
      // Don't retry — fall through to Supabase auth metadata
      if (response.status !== 401) {
        console.warn('[App] Backend /auth/me returned', response.status);
      }
    } catch (error) {
      // Network error — backend unreachable
      console.warn('[App] Backend unreachable, using auth metadata');
    }

    // ---- Fallback: use Supabase auth metadata ----
    try {
      const profile = await buildProfileFromAuth();
      if (profile) {
        setUser(profile);
        navigateByRole(profile.role);
      }
    } catch (authError) {
      console.error('[App] Unable to get user from auth:', authError);
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

  // Enhanced navigation that updates URL
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Update URL hash for bookmarkable URLs
    if (page === 'home') {
      window.history.replaceState(null, '', '#');
    } else {
      window.history.replaceState(null, '', `#${page}`);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    handleNavigate('home');
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
        return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'signup':
        return <SignupPage onSignup={handleSignup} onNavigate={handleNavigate} />;
      case 'admin-signup':
        return <SignupPage onSignup={handleSignup} onNavigate={handleNavigate} adminOnly={true} />;
      case 'services':
        return <ServicesPage serverUrl={serverUrl} onNavigate={setCurrentPage} user={user} publicAnonKey={publicAnonKey} onLogout={handleLogout} />;
      case 'portfolio':
        return <PortfolioPage serverUrl={serverUrl} onNavigate={setCurrentPage} user={user} publicAnonKey={publicAnonKey} onLogout={handleLogout} />;
      case 'client-dashboard':
        return user && user.role === 'client' ? (
          <ClientDashboard 
            user={user} 
            serverUrl={serverUrl} 
            accessToken={accessToken!}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        ) : <HomePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      case 'talent-dashboard':
        return user && user.role === 'talent' ? (
          <TalentDashboard 
            user={user} 
            serverUrl={serverUrl} 
            accessToken={accessToken!}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        ) : <HomePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      case 'admin-dashboard':
        return user && (user.role === 'admin' || user.role === 'manager') ? (
          <AdminDashboard 
            user={user} 
            serverUrl={serverUrl} 
            accessToken={accessToken!}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        ) : <HomePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      case 'coverage-areas':
        return <CoverageAreasPage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      case 'vetting-process':
        return <VettingProcessPage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      case 'terms-policies':
        return <TermsPoliciesPage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      default:
        return <HomePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div>
      <Toaster position="top-right" richColors />
      <main id="main-content">{renderPage()}</main>
    </div>
  );
}