"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { useAuth } from "../auth/auth-provider";
import { Button } from "../ui/button";

const links = [
  { href: "/tools", label: "Catalog" }
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { status, user, signOut } = useAuth();
  const navLinks = user?.role === "admin" ? [...links, { href: "/admin", label: "Admin" }] : links;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-content">
          <div className="brand-row">
            <Link href="/" className="brand-link">
              HyperZ Tools
            </Link>
            <span className="brand-kicker">Internal tool workspace</span>
          </div>

          <nav className="nav-links" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("nav-link", pathname?.startsWith(link.href) && "is-active")}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="session-zone">
            {status === "authenticated" ? (
              <>
                <span className="session-label">{user?.email}</span>
                <span className="session-role">{user?.role}</span>
                <Button variant="secondary" type="button" onClick={() => void signOut()}>
                  Sign out
                </Button>
              </>
            ) : status === "loading" ? (
              <span className="session-label">Checking session...</span>
            ) : (
              <Link href="/login" className="inline-link">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container page-space">{children}</main>
    </div>
  );
}
