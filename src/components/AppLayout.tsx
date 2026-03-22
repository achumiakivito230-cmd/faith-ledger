import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, PlusCircle, Clock, LogOut, BarChart3, Wallet, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['treasurer', 'counter', 'pastor'] },
  { to: '/new-offering', icon: PlusCircle, label: 'Offering', roles: ['treasurer', 'counter'] },
  { to: '/history', icon: Clock, label: 'History', roles: ['treasurer', 'counter', 'pastor'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['treasurer', 'counter', 'pastor'] },
  { to: '/new-expense', icon: Wallet, label: 'Expenses', roles: ['treasurer', 'counter', 'pastor'] },
  { to: '/loans', icon: Landmark, label: 'Loans', roles: ['treasurer', 'counter', 'pastor'] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();

  const filteredNav = navItems.filter((item) => role && item.roles.includes(role));
  const mobileNav = filteredNav.filter((item) => !('mobileHidden' in item && item.mobileHidden));

  return (
    <div className="min-h-screen bg-background">
      {/* Header — desktop: full nav, mobile: just logo + sign out */}
      <header className="sticky top-0 z-30 bg-card shadow-card">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="font-semibold text-card-foreground text-sm">Church Treasury</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredNav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground">
              {profile?.name}
              {role && (
                <span className="ml-1.5 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {role}
                </span>
              )}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content — extra bottom padding on mobile for the tab bar */}
      <main className="container py-4 md:py-6 pb-20 md:pb-6">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border/40 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileNav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 min-w-0 transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                <span className={`text-[10px] leading-tight truncate ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
