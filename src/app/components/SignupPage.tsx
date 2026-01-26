import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Lock, Mail, User, Briefcase, Users } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface SignupPageProps {
  onSignup: (email: string, password: string, name: string, role: string, company?: string) => Promise<void>;
  onNavigate: (page: string) => void;
}

export default function SignupPage({ onSignup, onNavigate }: SignupPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: '',
    company: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await onSignup(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.company || undefined
      );
      toast.success('Account created successfully! Welcome to ECJ.');
    } catch (error: any) {
      console.error('[SignupPage] Signup failed:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1eb] via-[#ebe4d8] to-[#e8dfd1] flex items-center justify-center p-4 scroll-smooth">{/* Added scroll-smooth */}
      {/* Sticky minimal nav */}
      <nav className="glass-dark fixed top-0 left-0 right-0 z-50 shadow-premium-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="w-9 h-9 gradient-premium-gold rounded-xl flex items-center justify-center shadow-premium">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">{/* Reduced from text-xl */}
                  EventCoverageJamaica
                </h1>
                <p className="text-[10px] text-[#c9a882]">Professional Event Services</p>{/* Reduced from text-xs */}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#755f52] rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-[#c9a882]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#755f52]">EventCoverageJamaica</h1>
            </div>
          </div>

          <Card className="border-0 shadow-premium-xl bg-white rounded-2xl overflow-hidden card-premium">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#755f52] mb-2">Create Account</h2>
                <p className="text-gray-600">Join our platform and get started today</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-[#755f52] font-semibold mb-2 block">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0DD16]" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      className="pl-11 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-[#755f52] font-semibold mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0DD16]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="pl-11 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role" className="text-[#755f52] font-semibold mb-2 block">
                    I want to...
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                    <SelectTrigger className="min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#B0DD16]" />
                          <span>Book Event Coverage (Client)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="talent">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-[#B0DD16]" />
                          <span>Offer Services (Talent)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'client' && (
                  <div>
                    <Label htmlFor="company" className="text-[#755f52] font-semibold mb-2 block">
                      Company <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0DD16]" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Your Company Name"
                        value={formData.company}
                        onChange={(e) => updateFormData('company', e.target.value)}
                        className="pl-11 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="password" className="text-[#755f52] font-semibold mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0DD16]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className="pl-11 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-[#755f52] font-semibold mb-2 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0DD16]" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      className="pl-11 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="button-glow w-full min-h-[48px] sm:h-12 gradient-premium-green text-white font-semibold text-sm sm:text-base rounded-xl shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => onNavigate('login')}
                    className="text-[#755f52] font-bold hover:text-[#8b7263] transition"
                  >
                    Sign In
                  </button>
                </p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => onNavigate('home')}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#755f52] transition mx-auto font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}