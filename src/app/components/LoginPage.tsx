import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Lock, Mail } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

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
      <nav className="bg-[#755f52] backdrop-blur-sm bg-opacity-95 fixed top-0 left-0 right-0 z-50 shadow-lg border-b border-[#5a4a3f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">{/* Reduced from h-20 */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="w-9 h-9 bg-[#c9a882] rounded-lg flex items-center justify-center">{/* Reduced from w-10 h-10 */}
                <Camera className="w-5 h-5 text-[#755f52]" />{/* Reduced from w-6 h-6 */}
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

      {/* Right Side - Login Form */}
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

          <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#755f52] mb-2">Sign In</h2>
                <p className="text-gray-600">Enter your credentials to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-[#755f52] font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0DD16]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
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
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0DD16]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#B0DD16] hover:bg-[#9ac514] text-white font-semibold text-base rounded-xl shadow-lg"
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