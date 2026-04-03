"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../components/auth/auth-provider";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Field, Input } from "../../components/ui/field";
import { Toast } from "../../components/ui/toast";
import { isApiError } from "../../lib/api";

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, status } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [networkToast, setNetworkToast] = useState<string | null>(null);

  const redirectPath = useMemo(() => {
    const raw = searchParams.get("redirect");
    return raw && raw.startsWith("/") ? raw : "/tools";
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectPath);
    }
  }, [redirectPath, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setNetworkToast(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      router.replace(redirectPath);
    } catch (submitError) {
      if (isApiError(submitError)) {
        setFieldErrors({
          email: submitError.fieldErrors.email,
          password: submitError.fieldErrors.password
        });

        if (submitError.isNetworkError) {
          setNetworkToast("Network error. Please try again in a moment.");
          return;
        }

        setError(submitError.message);
        return;
      }

      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-layout">
      {networkToast ? <Toast message={networkToast} onClose={() => setNetworkToast(null)} /> : null}

      <div className="login-wrap stack">
        <header className="page-header">
          <h1 className="page-title">Sign in</h1>
          <p className="page-subtitle">Secure access to HyperZ Tools with role-aware routing.</p>
        </header>

        <Card title="Welcome back" subtitle="Sign in to continue to your tool workspace." variant="glass">
          <form className="stack" onSubmit={handleSubmit} noValidate>
            <Field label="Work email" required error={fieldErrors.email}>
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, email: undefined }));
                }}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password" hint="Minimum length is 6 characters." required error={fieldErrors.password}>
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, password: undefined }));
                }}
                autoComplete="current-password"
                required
              />
            </Field>

            {error ? (
              <div className="alert alert-error" role="alert">
                Sign-in error: {error}
              </div>
            ) : null}

            <div className="form-actions">
              <Button type="submit" disabled={isSubmitting || status === "loading"}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <Link className="inline-link" href="/register">
                Create account
              </Link>
            </div>

            <div className="muted" aria-live="polite">
              {status === "loading" ? "Checking session..." : " "}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
