import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import BrandLogo from '@/app/components/ECJLogo';
import { getBranding, getContent } from '@/app/config';

interface SignupPageProps {
  onSignup: (email: string, password: string, name: string, role: string, company?: string, adminSignup?: boolean) => Promise<void>;
  onNavigate: (page: string) => void;
  adminOnly?: boolean;
}

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: string;
  company: string;
};

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  role: '',
  company: '',
};

export default function SignupPage({ onSignup, onNavigate, adminOnly = false }: SignupPageProps) {
  // Auto-set role: public signup is always 'client', admin-only route is always 'admin'
  const [form, setForm] = useState<FormState>({
    ...INITIAL_STATE,
    role: adminOnly ? 'admin' : 'client',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const branding = getBranding();
  const content = getContent();
  const signupContent = content?.signup;

  const showCompany = true;
  const passwordTooShort = form.password.length > 0 && form.password.length < 6;
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password.length > 0 && form.password !== form.confirmPassword;

  const canSubmit =
    !loading &&
    form.email.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.role.trim().length > 0 &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!form.role) return toast.error('Please select a role');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await onSignup(
        form.email.trim(),
        form.password,
        form.name.trim(),
        form.role,
        form.company.trim() ? form.company.trim() : undefined,
        adminOnly,
      );
      toast.success(
        adminOnly
          ? 'Request submitted. An admin will review and approve your access.'
          : 'Account created successfully.'
      );
    } catch (error: any) {
      console.error('[SignupPage] Signup failed:', error);
      toast.error(error?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Back to home — top-left */}
      <div className="p-4 sm:p-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
      </div>

      {/* Centered form */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="cursor-pointer"
              aria-label={`${branding.companyName} — Home`}
            >
              <BrandLogo size="lg" />
            </button>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">
                {adminOnly
                  ? 'Request Admin Access'
                  : (signupContent?.heading ?? 'Create your account')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {adminOnly
                  ? 'Submit your details below. An existing admin will review and approve your request.'
                  : (signupContent?.subheading ?? 'Fill in the details below to get started.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Full name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="h-11 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary cursor-text"
                  autoComplete="name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email address
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className="h-11 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary cursor-text"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Company */}
              {showCompany && (
                <div>
                  <Label htmlFor="signup-company" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    {signupContent?.companyLabel ?? 'Company'}
                    <span className="font-normal text-gray-400 ml-1">(optional)</span>
                  </Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder={signupContent?.companyPlaceholder ?? 'Your Company Name'}
                    value={form.company}
                    onChange={(e) => setField('company', e.target.value)}
                    className="h-11 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary cursor-text"
                    autoComplete="organization"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    className="h-11 pr-10 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary cursor-text"
                    autoComplete="new-password"
                    required
                    aria-invalid={passwordTooShort ? 'true' : 'false'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordTooShort && (
                  <p className="mt-1.5 text-xs text-red-500">Password must be at least 6 characters.</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="signup-confirm" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirm password
                </Label>
                <Input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  className="h-11 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary cursor-text"
                  autoComplete="new-password"
                  required
                  aria-invalid={passwordsMismatch ? 'true' : 'false'}
                />
                {passwordsMismatch && (
                  <p className="mt-1.5 text-xs text-red-500">Passwords don't match.</p>
                )}
              </div>

              {/* Terms agreement */}
              <p className="text-xs text-gray-400 leading-relaxed">
                {signupContent?.termsPrefix ?? 'By creating an account, you agree to our'}{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('terms-policies')}
                  className="text-gray-600 underline hover:text-gray-900 cursor-pointer"
                >
                  {signupContent?.termsLinkText ?? 'Terms & Policies'}
                </button>
                .
              </p>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium text-sm rounded-lg transition-colors"
                disabled={!canSubmit}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {adminOnly ? 'Submitting request...' : (signupContent?.creatingLabel ?? 'Creating account...')}
                  </span>
                ) : adminOnly ? (
                  'Submit request'
                ) : (
                  signupContent?.submitButton ?? 'Create account'
                )}
              </Button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
