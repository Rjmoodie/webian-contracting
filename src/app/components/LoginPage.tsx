import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Lock, Mail } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import ECJLogo from '@/app/components/ECJLogo';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onLogin(email, password);
      toast.success('Welcome back! Logged in successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1eb] via-[#ebe4d8] to-[#e8dfd1] flex items-center justify-center p-4 scroll-smooth">{/* Added scroll-smooth */}
      {/* Sticky minimal nav */}
      <nav className="glass-dark fixed top-0 left-0 right-0 z-50 shadow-premium-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')} aria-label="Event Coverage Jamaica – Home">
              <ECJLogo size="xl" className="flex-shrink-0 max-h-full" />
            </div>
          </div>
        </div>
      </nav>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <ECJLogo size="xl" />
          </div>

          <Card className="border-0 shadow-premium-xl bg-white rounded-2xl overflow-hidden card-premium">
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#755f52] mb-2">Sign In</h2>
                <p className="text-sm sm:text-base text-gray-600">Enter your credentials to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-[#755f52] font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BDFF1C]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password" className="text-[#755f52] font-semibold">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BDFF1C]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="button-glow w-full min-h-[48px] sm:h-12 gradient-premium-green text-white font-semibold text-sm sm:text-base rounded-xl shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => onNavigate('signup')}
                    className="text-[#755f52] font-bold hover:text-[#8b7263] transition"
                  >
                    Create Account
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