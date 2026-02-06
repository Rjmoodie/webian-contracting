import React, { useState, useEffect } from "react";
import { Camera, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import ECJLogo from "@/app/components/ECJLogo";

interface NavigationProps {
  user?: any;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  variant?: "public" | "dashboard";
  portalLabel?: string;
  showBrowseServices?: boolean;
  showNavLinks?: boolean;
}

// User Greeting (safe + consistent)
function UserGreeting({ user }: { user: { name: string } }) {
  return (
    <span
      title={`Hi, ${user.name}`}
      className="hidden lg:inline-flex items-center h-9 text-sm font-medium text-white/90 whitespace-nowrap leading-none"
    >
      Hi, {user.name}
    </span>
  );
}

// Logo — clickable, no text; logo only links to home. 2x smaller in headers.
function Logo({ onClick, isPublic }: { onClick: () => void; isPublic: boolean }) {
  const logoHeight = isPublic ? 'h-[50px]' : 'h-[60px]';
  return (
    <div
      onClick={onClick}
      className="flex items-center cursor-pointer shrink-0 group"
      role="link"
      aria-label="Event Coverage Jamaica – Home"
    >
      <div className={`flex-shrink-0 hover:scale-105 transition-transform duration-200 ${logoHeight} flex items-center`}>
        <ECJLogo
          size="xl"
          className="drop-shadow-sm max-h-full w-auto"
        />
      </div>
    </div>
  );
}

// Public links (desktop only)
function PublicLinks({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="hidden md:flex items-center gap-6 shrink-0">
      <button
        onClick={() => onNavigate("services")}
        className="inline-flex items-center h-9 leading-none text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap"
      >
        Services
      </button>
      <button
        onClick={() => onNavigate("portfolio")}
        className="inline-flex items-center h-9 leading-none text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap"
      >
        Portfolio
      </button>
      <button
        onClick={() => onNavigate("coverage-areas")}
        className="inline-flex items-center h-9 leading-none text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap"
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
  variant = "public",
  portalLabel,
  showBrowseServices = false,
  showNavLinks = true,
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isPublic = variant === "public";

  // Same header color as home page so logo shows well (brown #755f52)
  const navClass =
    "bg-[#755f52] fixed top-0 left-0 w-full z-50 shadow-md header-nav";

  const handleDashboardClick = () => {
    if (user?.role === "client") onNavigate("client-dashboard");
    else if (user?.role === "talent") onNavigate("talent-dashboard");
    else if (user?.role === "admin" || user?.role === "manager")
      onNavigate("admin-dashboard");
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Auto-close menu on desktop resize (when nav links become visible)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header row — taller on dashboard for larger logo */}
        <div className={`flex items-center justify-between gap-3 ${isPublic ? 'h-16' : 'h-16'}`}>
          {/* LEFT */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <Logo onClick={() => onNavigate("home")} isPublic={isPublic} />
            {isPublic && showNavLinks && <PublicLinks onNavigate={onNavigate} />}
            {!isPublic && portalLabel && (
              <span className="hidden lg:inline-flex text-sm sm:text-base text-white/90 font-medium whitespace-nowrap">
                {portalLabel}
              </span>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 shrink-0">
            {!isPublic && user && <UserGreeting user={user} />}

            {/* Desktop actions (md+) */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {user ? (
                <>
                  {showBrowseServices && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 border-white/40 text-white font-medium whitespace-nowrap"
                      onClick={() => onNavigate("services")}
                    >
                      Browse Services
                    </Button>
                  )}

                  {isPublic && (
                    <button
                      className="inline-flex items-center h-9 text-sm font-medium leading-none whitespace-nowrap text-white hover:text-[#c9a882] transition"
                      onClick={handleDashboardClick}
                    >
                      Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => onLogout?.()}
                    className="inline-flex items-center gap-2 h-9 text-white/90 hover:text-white text-sm font-medium leading-none whitespace-nowrap transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="inline-flex items-center h-9 text-sm font-medium leading-none whitespace-nowrap text-white hover:text-[#c9a882] transition"
                    onClick={() => onNavigate("login")}
                  >
                    Login
                  </button>

                  <Button
                    size="sm"
                    className="bg-[#BDFF1C] hover:bg-[#a5e00f] text-white font-semibold whitespace-nowrap"
                    onClick={() => onNavigate("signup")}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button — MOBILE ONLY (hidden on desktop) */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="burger-menu-button rounded-lg transition w-9 h-9 flex items-center justify-center shrink-0 text-white hover:bg-[#8b7263]"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu — Shows when nav links are hidden */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full z-50 bg-[#755f52] border-t border-[#8b7263] shadow-md">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex flex-col gap-2">
                {isPublic && showNavLinks && (
                  <>
                    <button
                      onClick={() => {
                        onNavigate("services");
                        closeMenu();
                      }}
                      className="w-full text-left px-2 py-3 rounded-md font-medium transition text-white hover:text-[#c9a882]"
                    >
                      Services
                    </button>
                    <button
                      onClick={() => {
                        onNavigate("portfolio");
                        closeMenu();
                      }}
                      className="w-full text-left px-2 py-3 rounded-md font-medium transition text-white hover:text-[#c9a882]"
                    >
                      Portfolio
                    </button>
                    <button
                      onClick={() => {
                        onNavigate("coverage-areas");
                        closeMenu();
                      }}
                      className="w-full text-left px-2 py-3 rounded-md font-medium transition text-white hover:text-[#c9a882]"
                    >
                      Coverage
                    </button>
                    <div className="my-2 border-t border-[#8b7263]" />
                  </>
                )}

                {user ? (
                  <>
                    {showBrowseServices && (
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-white/10 hover:bg-white/20 border-white/40 text-white rounded-lg"
                        onClick={() => {
                          onNavigate("services");
                          closeMenu();
                        }}
                      >
                        Browse Services
                      </Button>
                    )}

                    {isPublic && (
                      <button
                        className="w-full text-left px-2 py-3 rounded-md font-medium transition text-white hover:text-[#c9a882]"
                        onClick={() => {
                          handleDashboardClick();
                          closeMenu();
                        }}
                      >
                        Dashboard
                      </button>
                    )}

                    <button
                      className="w-full flex items-center gap-2 px-2 py-3 rounded-md font-medium transition text-white hover:text-[#c9a882]"
                      onClick={() => {
                        onLogout?.();
                        closeMenu();
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full text-left px-2 py-3 rounded-md font-medium transition text-white hover:text-[#c9a882]"
                      onClick={() => {
                        onNavigate("login");
                        closeMenu();
                      }}
                    >
                      Login
                    </button>

                    <Button
                      className="w-full rounded-lg bg-[#BDFF1C] hover:bg-[#a5e00f] text-white"
                      onClick={() => {
                        onNavigate("signup");
                        closeMenu();
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
