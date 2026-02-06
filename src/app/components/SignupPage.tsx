import { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Lock, Mail, User, Briefcase, Shield, Users } from 'lucide-react';
import ECJLogo from '@/app/components/ECJLogo';

interface SignupPageProps {
  onSignup: (email: string, password: string, name: string, role: string, company?: string) => Promise<void>;
  onNavigate: (page: string) => void;
  adminOnly?: boolean; // If true, only show admin role option
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
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  const roleOptions = useMemo(() => {
    const base = [
      {
        value: 'client',
        label: 'Book Event Coverage',
        description: 'Find & hire talent',
        Icon: Users,
        iconClass: 'text-[#BDFF1C]',
        visible: !adminOnly,
      },
      {
        value: 'talent',
        label: 'Offer My Services',
        description: 'Photography & video',
        Icon: Camera,
        iconClass: 'text-[#BDFF1C]',
        visible: !adminOnly,
      },
      {
        value: 'admin',
        label: 'Admin Access',
        description: 'Manage platform',
        Icon: Shield,
        iconClass: 'text-[#755f52]',
        visible: true,
      },
    ];

    return base.filter((r) => r.visible);
  }, [adminOnly]);

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
      );
      toast.success('Account created successfully! Welcome to ECJ.');
    } catch (error: any) {
      console.error('[SignupPage] Signup failed:', error);
      toast.error(error?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1eb] via-[#ebe4d8] to-[#e8dfd1] scroll-smooth">
      {/* Top Nav — solid brown matching home */}
      <nav className="bg-[#755f52] fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center cursor-pointer select-none"
              aria-label="Event Coverage Jamaica – Home"
            >
              <ECJLogo size="xl" className="flex-shrink-0 max-h-full" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-sm font-medium text-white/90 hover:text-white transition"
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
                <h2 className="text-2xl font-bold text-[#755f52] mb-1">
                  {adminOnly ? 'Admin Signup' : 'Create Account'}
                </h2>
                <p className="text-sm text-gray-500">
                  {adminOnly ? 'Create an admin account' : 'Join our platform and get started today'}
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Row 1: Name + Email side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name" className="text-[#755f52] font-semibold text-sm mb-1.5 block">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDFF1C]" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl text-sm"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-[#755f52] font-semibold text-sm mb-1.5 block">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDFF1C]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl text-sm"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Role — visual card selector */}
                <div>
                  <Label className="text-[#755f52] font-semibold text-sm mb-2 block">I want to...</Label>
                  <div className={`grid gap-2 ${adminOnly ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {roleOptions.map(({ value, label, description, Icon, iconClass }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField('role', value)}
                        className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-left transition-all ${
                          form.role === value
                            ? 'border-[#BDFF1C] bg-[#BDFF1C]/10 text-[#755f52] shadow-sm'
                            : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${form.role === value ? 'text-[#BDFF1C]' : iconClass}`} />
                        <div className="min-w-0">
                          <span className="text-sm font-medium leading-tight block">{label}</span>
                          <span className="text-xs text-gray-400 leading-tight">{description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Company (conditional, animated) */}
                {showCompany && (
                  <div>
                    <Label htmlFor="company" className="text-[#755f52] font-semibold text-sm mb-1.5 block">
                      Company <span className="text-gray-400 font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDFF1C]" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Your Company Name"
                        value={form.company}
                        onChange={(e) => setField('company', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl text-sm"
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                )}

                {/* Row 4: Password + Confirm side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="password" className="text-[#755f52] font-semibold text-sm mb-1.5 block">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDFF1C]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={(e) => setField('password', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl text-sm"
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
                    <Label htmlFor="confirmPassword" className="text-[#755f52] font-semibold text-sm mb-1.5 block">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDFF1C]" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={(e) => setField('confirmPassword', e.target.value)}
                        className="pl-10 h-11 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl text-sm"
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
                  className="button-glow w-full h-11 gradient-premium-green text-white font-semibold text-sm rounded-xl shadow-premium hover:shadow-premium-lg hover:scale-[1.02] transition-all"
                  disabled={!canSubmit}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="text-gray-500">
                  Have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-[#755f52] font-bold hover:text-[#8b7263] transition"
                  >
                    Sign In
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="flex items-center gap-1 text-gray-400 hover:text-[#755f52] transition font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Home
                </button>
              </div>
            </div>
          </Card>

          <p className="mt-3 text-center text-xs text-gray-400">
            By creating an account, you agree to ECJ's terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
