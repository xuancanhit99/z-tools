"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import type { UserRole } from "../../lib/api";
import { Card } from "../ui/card";
import { useAuth } from "./auth-provider";

type RequireAuthProps = {
  children: ReactNode;
  role?: UserRole;
};

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isRoleMismatch = Boolean(role && status === "authenticated" && user?.role !== role);

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    const redirectPath = pathname || "/tools";
    router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }, [pathname, router, status]);

  useEffect(() => {
    if (!isRoleMismatch) {
      return;
    }

    router.replace("/tools");
  }, [isRoleMismatch, router]);

  if (status === "loading" || status === "unauthenticated" || isRoleMismatch) {
    return (
      <Card title="Checking session" subtitle="Redirecting to login if needed.">
        <p className="muted">{isRoleMismatch ? "Admin role required. Redirecting..." : "Please wait..."}</p>
      </Card>
    );
  }

  return <>{children}</>;
}
