import React, { useState } from 'react';
import { Camera, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface NavigationProps {
  user?: any;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  variant?: 'public' | 'dashboard';
  portalLabel?: string;
  showBrowseServices?: boolean;
  showNavLinks?: boolean;
}

// User Greeting Component - Bulletproof for any name length
function UserGreeting({ user }: { user: { name: string } }) {
  return (
    <span
      title={`Hi, ${user.name}`}
      className="text-xs sm:text-sm font-medium text-[#755f52] max-w-[5rem] sm:max-w-[7rem] md:max-w-[9rem] truncate whitespace-nowrap shrink-0 inline-block"
    >
      Hi, {user.name}
    </span>
  );
}

// Logo Component
function Logo({ onClick, isPublic }: { onClick: () => void; isPublic: boolean }) {
  return (
    <div onClick={onClick} className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0">
      <div className={`${isPublic ? 'w-8 h-8 sm:w-9 sm:h-9 gradient-premium-gold' : 'w-8 h-8 sm:w-10 sm:h-10 gradient-premium'} rounded-xl flex items-center justify-center shadow-premium hover:scale-105 transition-transform`}>
        <Camera className={`${isPublic ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-4 h-4 sm:w-6 sm:h-6'} text-white`} />
      </div>
      <div className="min-w-0">
        <h1 className={`${isPublic ? 'text-base sm:text-lg font-bold text-white' : 'text-lg sm:text-xl md:text-2xl font-bold text-[#B0DD16]'} tracking-tight truncate`}>
          <span className="hidden sm:inline">EventCoverageJamaica</span>
          <span className="sm:hidden">ECJ</span>
        </h1>
        {isPublic && (
          <p className="text-[9px] sm:text-[10px] text-[#c9a882] hidden sm:block truncate">
            Professional Event Services
          </p>
        )}
      </div>
    </div>
  );
}

// Public Navigation Links Component
function PublicLinks({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="hidden md:flex gap-6 shrink-0">
      <button
        onClick={() => onNavigate('services')}
        className="text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap h-8 flex items-center"
      >
        Services
      </button>
      <button
        onClick={() => {/* scroll to how it works */}}
        className="text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap h-8 flex items-center"
      >
        How It Works
      </button>
      <button
        onClick={() => {/* scroll to coverage */}}
        className="text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap h-8 flex items-center"
      >
        Coverage
      </button>
    </div>
  );
}

export default function Navigation({
  user,
  onNavigate,
  onLogout,
  variant = 'public',
  portalLabel,
  showBrowseServices = false,
  showNavLinks = true
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isPublic = variant === 'public';

  const navClass = isPublic
    ? 'glass-dark fixed top-0 left-0 w-full z-50 shadow-premium-lg border-b border-white/10'
    : 'glass bg-white fixed top-0 left-0 w-full z-50 border-b border-[#755f5233] shadow-premium';

  const handleDashboardClick = () => {
    if (user?.role === 'client') onNavigate('client-dashboard');
    else if (user?.role === 'talent') onNavigate('talent-dashboard');
    else if (user?.role === 'admin' || user?.role === 'manager') onNavigate('admin-dashboard');
    setIsMenuOpen(false);
  };

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className={`${isPublic ? 'h-16' : 'h-16'} flex items-center justify-between min-w-0 gap-4 overflow-hidden`}>
          
          {/* LEFT SECTION */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1 overflow-hidden">
            <Logo onClick={() => onNavigate('home')} isPublic={isPublic} />
            
            {isPublic && showNavLinks && <PublicLinks onNavigate={onNavigate} />}
            
            {!isPublic && portalLabel && (
              <Badge className="gradient-premium text-white border-0 shadow-premium text-xs sm:text-sm whitespace-nowrap shrink-0">
                {portalLabel}
              </Badge>
            )}
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* User Greeting (Dashboard only) */}
            {!isPublic && user && (
              <div className="shrink-0 min-w-0">
                <UserGreeting user={user} />
              </div>
            )}

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {user ? (
                <>
                  {showBrowseServices && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="!h-8 !min-h-0 text-xs sm:text-sm border-2 border-[#755f52] text-[#755f52] hover:bg-[#755f52] hover:text-white transition-all whitespace-nowrap shrink-0"
                      onClick={() => onNavigate('services')}
                    >
                      <span className="hidden sm:inline">Browse Services</span>
                      <span className="sm:hidden">Services</span>
                    </Button>
                  )}
                  {isPublic && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!h-8 !min-h-0 text-white hover:text-[#c9a882] hover:bg-[#8b7263] text-xs sm:text-sm whitespace-nowrap shrink-0"
                      onClick={handleDashboardClick}
                    >
                      Dashboard
                    </Button>
                  )}
                  <Button
                    variant={isPublic ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => onLogout?.()}
                    className={`!h-8 !min-h-0 text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                      isPublic
                        ? "border-[#c9a882] text-[#c9a882] hover:bg-[#c9a882] hover:text-[#755f52]"
                        : "text-[#755f52] hover:text-[#8b7263] hover:bg-[#f5f1eb]"
                    }`}
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 shrink-0" />
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`!h-8 !min-h-0 text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                      isPublic
                        ? "text-white hover:text-[#c9a882] hover:bg-[#8b7263]"
                        : "text-[#755f52] hover:text-[#8b7263] hover:bg-[#f5f1eb]"
                    }`}
                    onClick={() => onNavigate('login')}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className={`!h-8 !min-h-0 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                      isPublic
                        ? "bg-[#B0DD16] hover:bg-[#9ac514] text-white"
                        : "gradient-premium-green text-white hover:shadow-premium-lg"
                    }`}
                    onClick={() => onNavigate('signup')}
                  >
                    {isPublic ? 'Get Started' : 'Sign Up'}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${isPublic ? 'md:hidden text-white' : 'sm:hidden text-[#755f52]'} ${isPublic ? 'hover:bg-[#8b7263]' : 'hover:bg-[#f5f1eb]'} rounded-lg transition !h-8 !w-8 shrink-0 flex items-center justify-center p-0`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`${isPublic ? 'md:hidden border-t border-[#5a4a3f]' : 'sm:hidden border-t border-gray-200'} py-4`}>
            <div className="flex flex-col gap-3">
              {isPublic && showNavLinks && (
                <>
                  <button
                    onClick={() => {
                      onNavigate('services');
                      setIsMenuOpen(false);
                    }}
                    className={`text-left font-medium transition px-2 py-2 min-h-[44px] ${
                      isPublic
                        ? "text-white hover:text-[#c9a882]"
                        : "text-[#755f52] hover:text-[#8b7263]"
                    }`}
                  >
                    Services
                  </button>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-left font-medium transition px-2 py-2 min-h-[44px] ${
                      isPublic
                        ? "text-white hover:text-[#c9a882]"
                        : "text-[#755f52] hover:text-[#8b7263]"
                    }`}
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-left font-medium transition px-2 py-2 min-h-[44px] ${
                      isPublic
                        ? "text-white hover:text-[#c9a882]"
                        : "text-[#755f52] hover:text-[#8b7263]"
                    }`}
                  >
                    Coverage
                  </button>
                  <div className={`border-t ${isPublic ? 'border-[#5a4a3f]' : 'border-gray-200'} pt-3 mt-2`} />
                </>
              )}

              {user ? (
                <>
                  {showBrowseServices && (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-2 border-[#755f52] text-[#755f52] hover:bg-[#755f52] hover:text-white mb-2 min-h-[44px]"
                      onClick={() => {
                        onNavigate('services');
                        setIsMenuOpen(false);
                      }}
                    >
                      Browse Services
                    </Button>
                  )}
                  {isPublic && (
                    <Button
                      variant="ghost"
                      className={`w-full justify-start mb-2 min-h-[44px] ${
                        isPublic
                          ? "text-white hover:text-[#c9a882] hover:bg-[#8b7263]"
                          : "text-[#755f52] hover:text-[#8b7263] hover:bg-[#f5f1eb]"
                      }`}
                      onClick={() => {
                        handleDashboardClick();
                      }}
                    >
                      Dashboard
                    </Button>
                  )}
                  <Button
                    variant={isPublic ? "outline" : "ghost"}
                    className={`w-full min-h-[44px] ${
                      isPublic
                        ? "border-[#c9a882] text-[#c9a882] hover:bg-[#c9a882] hover:text-[#755f52]"
                        : "text-[#755f52] hover:text-[#8b7263] hover:bg-[#f5f1eb]"
                    }`}
                    onClick={() => {
                      onLogout?.();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start mb-2 min-h-[44px] ${
                      isPublic
                        ? "text-white hover:text-[#c9a882] hover:bg-[#8b7263]"
                        : "text-[#755f52] hover:text-[#8b7263] hover:bg-[#f5f1eb]"
                    }`}
                    onClick={() => {
                      onNavigate('login');
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className={`w-full min-h-[44px] ${
                      isPublic
                        ? "bg-[#B0DD16] hover:bg-[#9ac514] text-white"
                        : "gradient-premium-green text-white"
                    }`}
                    onClick={() => {
                      onNavigate('signup');
                      setIsMenuOpen(false);
                    }}
                  >
                    {isPublic ? 'Get Started' : 'Sign Up'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
