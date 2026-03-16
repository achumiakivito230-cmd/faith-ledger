import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, PlusCircle, Clock, ShieldCheck, LogOut, Menu, X, BarChart3 } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['treasurer', 'counter', 'pastor'] },
  { to: '/new-offering', icon: PlusCircle, label: 'New', roles: ['treasurer', 'counter'] },
  { to: '/history', icon: Clock, label: 'History', roles: ['treasurer', 'counter', 'pastor'] },
  { to: '/verify', icon: ShieldCheck, label: 'Verify', roles: ['treasurer', 'counter'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['treasurer', 'counter', 'pastor'] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#e0e0e0]">
      {/* Neumorphic Header */}
      <header className="sticky top-0 z-30 bg-[#e0e0e0] px-4 pt-3 pb-2">
        <div className="flex items-center justify-between rounded-2xl bg-[#e0e0e0] px-4 py-3 shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-500"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#e0e0e0] shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </div>
              <span className="font-bold text-gray-700 text-sm">Church Treasury</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {profile?.name && (
              <span className="hidden sm:block text-xs text-gray-500">
                {profile.name}
                {role && (
                  <span className="ml-1.5 rounded-lg bg-[#e0e0e0] shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {role}
                  </span>
                )}
              </span>
            )}
            <button
              onClick={signOut}
              title="Sign out"
              className="w-8 h-8 rounded-xl bg-[#e0e0e0] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center transition-all duration-200"
            >
              <LogOut className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop nav — neumorphic pills */}
      <nav className="hidden md:flex items-center gap-2 px-4 py-2">
        {filteredNav.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 bg-[#e0e0e0]",
                active
                  ? "shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-blue-500"
                  : "shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] text-gray-500 hover:text-blue-500 hover:shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="md:hidden px-4 py-2">
          <div className="bg-[#e0e0e0] rounded-2xl shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff] p-3 space-y-2">
            {filteredNav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 bg-[#e0e0e0]",
                    active
                      ? "shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] text-blue-500"
                      : "shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] text-gray-500 hover:text-blue-500"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom mobile nav — neumorphic tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#e0e0e0] px-3 pb-3 pt-2">
        <div className="flex items-center justify-around rounded-2xl bg-[#e0e0e0] shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff] py-2 px-1">
          {filteredNav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200 bg-[#e0e0e0]",
                  active
                    ? "shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] text-blue-500"
                    : "shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] text-gray-400 active:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff]"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-4 md:py-6">{children}</main>
    </div>
  );
}
