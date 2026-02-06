import React, { useState } from "react";
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

function UserGreeting({ user }: { user: { name: string } }) {
  return (
    <span
      title={`Hi, ${user.name}`}
      className="hidden lg:inline-flex items-center h-9 text-sm font-medium text-gray-600 whitespace-nowrap leading-none max-w-[16rem] truncate"
    >
      Hi, {user.name}
    </span>
  );
}

function Logo({ onClick, isPublic }: { onClick: () => void; isPublic: boolean }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center cursor-pointer shrink-0"
      role="link"
      aria-label="Event Coverage Jamaica – Home"
    >
      <ECJLogo size="xl" className="drop-shadow-sm max-h-[44px] w-auto" />
    </div>
  );
}

function PublicLinks({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="hidden xl:flex items-center gap-6 shrink-0">
      <button
        onClick={() => onNavigate("services")}
        className="inline-flex items-center h-9 leading-none text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap"
      >
        Services
      </button>
      <button
        onClick={() => {}}
        className="inline-flex items-center h-9 leading-none text-white hover:text-[#c9a882] font-medium transition whitespace-nowrap"
      >
        How It Works
      </button>
      <button
        onClick={() => {}}
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

  const navClass = isPublic
    ? "bg-[#755f52] fixed top-0 left-0 w-full z-50 shadow-md header-nav"
    : "bg-white fixed top-0 left-0 w-full z-50 border-b border-gray-200 shadow-sm header-nav";

  const handleDashboardClick = () => {
    if (user?.role === "client") onNavigate("client-dashboard");
    else if (user?.role === "talent") onNavigate("talent-dashboard");
    else if (user?.role === "admin" || user?.role === "manager")
      onNavigate("admin-dashboard");
    setIsMenuOpen(false);
  };

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* IMPORTANT: relative wrapper so dropdown can be absolute and never clipped */}
        <div className="relative">
          {/* Main Header Row (grid = more stable than flex at awkward widths) */}
          <div className="h-16 grid grid-cols-[1fr_auto] items-center gap-3">
            {/* LEFT */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Logo onClick={() => onNavigate("home")} isPublic={isPublic} />
              {isPublic && showNavLinks && <PublicLinks onNavigate={onNavigate} />}

              {!isPublic && portalLabel && (
                <span className="hidden md:inline-flex text-sm sm:text-base text-gray-600 font-medium whitespace-nowrap">
                  {portalLabel}
                </span>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 sm:gap-3 justify-end">
              {/* Greeting only on lg+ to avoid any collisions */}
              {!isPublic && user && <UserGreeting user={user} />}

              {/* Desktop actions (only on lg+ for stability) */}
              <div className="hidden lg:flex items-center gap-3">
                {user ? (
                  <>
                    {showBrowseServices && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 font-medium whitespace-nowrap"
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
                      className="inline-flex items-center gap-2 h-9 text-gray-600 hover:text-gray-800 text-sm font-medium leading-none whitespace-nowrap transition"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Login only on lg+ (this is what stops the overlap) */}
                    <button
                      className={`inline-flex items-center h-9 text-sm font-medium leading-none whitespace-nowrap transition ${
                        isPublic
                          ? "text-white hover:text-[#c9a882]"
                          : "text-[#755f52] hover:text-[#8b7263]"
                      }`}
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

              {/* Burger: visible below lg */}
              <button
                onClick={() => setIsMenuOpen((v) => !v)}
                className={`lg:hidden ${
                  isPublic ? "text-white hover:bg-[#8b7263]" : "text-gray-700 hover:bg-gray-100"
                } rounded-lg transition w-10 h-10 flex items-center justify-center`}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Dropdown Panel (absolute so it can’t be clipped) */}
          {isMenuOpen && (
            <div
              className={`lg:hidden absolute top-full left-0 right-0 ${
                isPublic ? "bg-[#755f52] border-t border-[#8b7263]" : "bg-white border-t border-gray-200"
              } shadow-md`}
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {/* Public links show in menu on <xl */}
                {isPublic && showNavLinks && (
                  <>
                    <button
                      onClick={() => {
                        onNavigate("services");
                        setIsMenuOpen(false);
                      }}
                      className={`text-left font-medium transition px-2 py-2 min-h-[44px] ${
                        isPublic ? "text-white hover:text-[#c9a882]" : "text-[#755f52] hover:text-[#8b7263]"
                      }`}
                    >
                      Services
                    </button>

                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-left font-medium transition px-2 py-2 min-h-[44px] ${
                        isPublic ? "text-white hover:text-[#c9a882]" : "text-[#755f52] hover:text-[#8b7263]"
                      }`}
                    >
                      How It Works
                    </button>

                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-left font-medium transition px-2 py-2 min-h-[44px] ${
                        isPublic ? "text-white hover:text-[#c9a882]" : "text-[#755f52] hover:text-[#8b7263]"
                      }`}
                    >
                      Coverage
                    </button>

                    <div className={`border-t ${isPublic ? "border-[#8b7263]" : "border-gray-200"} pt-3 mt-2`} />
                  </>
                )}

                {user ? (
                  <>
                    {showBrowseServices && (
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 min-h-[44px]"
                        onClick={() => {
                          onNavigate("services");
                          setIsMenuOpen(false);
                        }}
                      >
                        Browse Services
                      </Button>
                    )}

                    {isPublic && (
                      <button
                        className={`w-full text-left px-2 py-2 min-h-[44px] font-medium transition ${
                          isPublic ? "text-white hover:text-[#c9a882]" : "text-[#755f52] hover:text-[#8b7263]"
                        }`}
                        onClick={() => {
                          handleDashboardClick();
                        }}
                      >
                        Dashboard
                      </button>
                    )}

                    <button
                      className={`w-full flex items-center gap-2 px-2 py-2 min-h-[44px] font-medium transition ${
                        isPublic ? "text-white hover:text-[#c9a882]" : "text-gray-700 hover:text-gray-900"
                      }`}
                      onClick={() => {
                        onLogout?.();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    {/* Login moved into dropdown for <lg */}
                    <button
                      className={`w-full text-left px-2 py-2 min-h-[44px] font-medium transition ${
                        isPublic ? "text-white hover:text-[#c9a882]" : "text-[#755f52] hover:text-[#8b7263]"
                      }`}
                      onClick={() => {
                        onNavigate("login");
                        setIsMenuOpen(false);
                      }}
                    >
                      Login
                    </button>

                    <Button
                      className={`w-full min-h-[44px] ${
                        isPublic ? "bg-[#BDFF1C] hover:bg-[#a5e00f] text-white" : "gradient-premium-green text-white"
                      }`}
                      onClick={() => {
                        onNavigate("signup");
                        setIsMenuOpen(false);
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
