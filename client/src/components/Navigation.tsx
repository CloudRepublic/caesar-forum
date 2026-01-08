import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const { user, login, logout, isLoading } = useUser();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/mijn-sessies", label: "Mijn Sessies" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-sm font-bold text-primary-foreground">CF</span>
            </div>
            <span className="text-lg font-semibold" data-testid="text-logo">
              Caesar Forum
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="hidden items-center gap-4 md:flex">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col lg:flex">
                  <span className="text-sm font-medium" data-testid="text-user-name">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid="text-user-email">
                    {user.email}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                data-testid="button-logout"
                aria-label="Uitloggen"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={login}
              data-testid="button-login"
              className="hidden md:flex"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Inloggen met Microsoft
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
            aria-label={mobileMenuOpen ? "Menu sluiten" : "Menu openen"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-16 border-b bg-background p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <>
                <div className="my-2 border-t" />
                <div className="flex items-center gap-2 px-4 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Uitloggen
                </Button>
              </>
            ) : (
              <>
                <div className="my-2 border-t" />
                <Button
                  variant="default"
                  className="w-full justify-start"
                  onClick={() => {
                    login();
                    setMobileMenuOpen(false);
                  }}
                  data-testid="button-mobile-login"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Inloggen met Microsoft
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
