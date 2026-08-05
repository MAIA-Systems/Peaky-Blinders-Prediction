import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Briefcase, LogOut, Plus, Radio, Shield, User as UserIcon, Wallet as WalletIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { formatGbp } from "@/lib/utils";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Markets", href: "/", icon: BarChart3 },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Live Stream", href: "/stream", icon: Radio },
  { label: "Wallet", href: "/wallet", icon: WalletIcon },
];

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: wallet } = useWallet();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover-elevate",
                  isActive ? "text-gold" : "text-muted-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/create">
            <Button size="sm" className="gap-1.5 glow-gold" data-testid="button-create-market">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create Market</span>
            </Button>
          </Link>

          {isAuthenticated && user ? (
            <>
              <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs sm:flex">
                <span className="text-muted-foreground">Balance</span>
                <span className="num font-semibold text-gold-bright">{wallet ? formatGbp(wallet.balance) : "…"}</span>
              </div>

              <div className="relative">
                <button onClick={() => setMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-full" data-testid="button-user-menu">
                  <Avatar name={user.name} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-card-border bg-card p-1 shadow-lg">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover-elevate"
                      >
                        <UserIcon className="h-4 w-4" /> Profile
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gold hover-elevate"
                          data-testid="link-admin"
                        >
                          <Shield className="h-4 w-4" /> Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover-elevate"
                        data-testid="button-logout"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" data-testid="link-nav-sign-in">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 lg:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              cn(
                "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                isActive ? "bg-secondary text-gold" : "text-muted-foreground",
              )
            }
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
