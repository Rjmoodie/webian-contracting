import { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Lock, Mail, User, Briefcase, Shield, Users } from 'lucide-react';
import BrandLogo from '@/app/components/ECJLogo';
import { getBranding, getContent } from '@/app/config';

interface SignupPageProps {
  onSignup: (email: string, password: string, name: string, role: string, company?: string, adminSignup?: boolean) => Promise<void>;
  onNavigate: (page: string) => void;
  adminOnly?: boolean; // If true, only show admin role option and send adminSignup to backend
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

const ROLE_ICONS = { client: Users, talent: Camera, admin: Shield } as const;

export default function SignupPage({ onSignup, onNavigate, adminOnly = false }: SignupPageProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const branding = getBranding();
  const content = getContent();
  const signupContent = content?.signup;

  const roleOptions = useMemo(() => {
    const roles = signupContent?.roles;
    const base = [
      {
        value: 'client' as const,
        label: roles?.client?.label ?? 'Book Event Coverage',
        description: roles?.client?.description ?? 'Find & hire talent',
        Icon: ROLE_ICONS.client,
        iconClass: 'text-primary',
        visible: !adminOnly,
      },
      {
        value: 'talent' as const,
        label: roles?.talent?.label ?? 'Offer My Services',
        description: roles?.talent?.description ?? 'Photography & video',
        Icon: ROLE_ICONS.talent,
        iconClass: 'text-primary',
        visible: !adminOnly,
      },
      {
        value: 'admin' as const,
        label: roles?.admin?.label ?? 'Admin Access',
        description: roles?.admin?.description ?? 'Manage platform',
        Icon: ROLE_ICONS.admin,
        iconClass: 'text-secondary',
        visible: true,
      },
    ];
    return base.filter((r) => r.visible);
  }, [adminOnly, signupContent?.roles]);

  const showCompany = form.role === 'client' || form.role === 'admin';
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
      toast.success('Account created successfully.');
    } catch (error: any) {
      console.error('[SignupPage] Signup failed:', error);
      toast.error(error?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Top Nav — matches site header (white) */}
      <nav className="bg-white fixed top-0 left-0 right-0 z-50 border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center cursor-pointer select-none"
              aria-label={`${branding.companyName} – Home`}
            >
              <BrandLogo size="xl" className="flex-shrink-0 max-h-full" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-sm font-medium text-foreground/90 hover:text-primary transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-14" />

      {/* Centered form card */}
      <div className="flex items-start justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg">
          <Card className="border-0 shadow-premium-xl bg-white rounded-2xl card-premium">
            <div className="p-5 sm:p-7">
              <header className="mb-5">
<h2 className="typography-page-title mb-1">
                {adminOnly
                  ? (signupContent?.adminHeading ?? 'Admin Signup')
                  : (signupContent?.heading ?? 'Create Account')}
                </h2>
                <p className="typography-body-sm-muted">
                  {adminOnly
                    ? (signupContent?.adminSubheading ?? 'Create an admin account')
                    : (signupContent?.subheading ?? 'Join our platform and get started today')}
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Row 1: Name + Email side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name" className="typography-label mb-1.5 block">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-primary rounded-xl text-sm"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="typography-label mb-1.5 block">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-primary rounded-xl text-sm"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Role — visual card selector */}
                <div>
                  <Label className="typography-label mb-2 block">
                    {signupContent?.roleLabel ?? 'I want to...'}
                  </Label>
                  <div className={`grid gap-2 ${adminOnly ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {roleOptions.map(({ value, label, description, Icon, iconClass }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField('role', value)}
                        className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-left transition-all ${
                          form.role === value
                            ? 'border-primary bg-primary/10 text-secondary shadow-sm'
                            : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${form.role === value ? 'text-primary' : iconClass}`} />
                        <div className="min-w-0">
                          <span className="text-sm font-medium leading-tight block">{label}</span>
                          <span className="typography-caption leading-tight">{description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Company (conditional, animated) */}
                {showCompany && (
                  <div>
                    <Label htmlFor="company" className="typography-label mb-1.5 block">
                      {signupContent?.companyLabel ?? 'Company'}{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        id="company"
                        type="text"
                        placeholder={signupContent?.companyPlaceholder ?? 'Your Company Name'}
                        value={form.company}
                        onChange={(e) => setField('company', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-primary rounded-xl text-sm cursor-text"
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                )}

                {/* Row 4: Password + Confirm side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="password" className="typography-label mb-1.5 block">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={(e) => setField('password', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-primary rounded-xl text-sm"
                        autoComplete="new-password"
                        required
                        aria-invalid={passwordTooShort ? 'true' : 'false'}
                      />
                    </div>
                    {passwordTooShort && (
                      <p className="mt-1 text-xs text-red-600">At least 6 characters.</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="typography-label mb-1.5 block">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={(e) => setField('confirmPassword', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-primary rounded-xl text-sm"
                        autoComplete="new-password"
                        required
                        aria-invalid={passwordsMismatch ? 'true' : 'false'}
                      />
                    </div>
                    {passwordsMismatch && (
                      <p className="mt-1 text-xs text-red-600">Passwords don't match.</p>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full min-h-[48px] bg-primary text-white font-semibold text-sm rounded-xl shadow-lg hover:opacity-90 transition-all"
                  disabled={!canSubmit}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      {signupContent?.creatingLabel ?? 'Creating account...'}
                    </div>
                  ) : (
                    signupContent?.submitButton ?? 'Create Account'
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="typography-body-muted">
                  Have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="typography-label hover:text-primary transition cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="flex items-center gap-1 typography-body-sm-muted hover:text-secondary transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Home
                </button>
              </div>
            </div>
          </Card>

          <p className="mt-3 text-center typography-caption">
            {signupContent?.termsPrefix ?? 'By creating an account, you agree to our'}{' '}
            <button
              type="button"
              onClick={() => onNavigate('terms-policies')}
              className="text-secondary font-medium hover:underline focus:outline-none focus:underline"
            >
              {signupContent?.termsLinkText ?? 'Terms & Policies'}
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
