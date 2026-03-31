"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "../../components/auth/auth-provider";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Field, Input } from "../../components/ui/field";
import { Toast } from "../../components/ui/toast";
import { isApiError } from "../../lib/api";

type RegisterFieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, status } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [networkToast, setNetworkToast] = useState<string | null>(null);

  const redirectPath = useMemo(() => {
    const raw = searchParams.get("redirect");
    return raw && raw.startsWith("/") ? raw : "/tools";
  }, [searchParams]);

  function validateForm(): RegisterFieldErrors {
    const nextErrors: RegisterFieldErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!email.includes("@")) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (password.trim().length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setNetworkToast(null);

    const localErrors = validateForm();
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(fullName, email, password);
      router.replace(redirectPath);
    } catch (submitError) {
      if (isApiError(submitError)) {
        setFieldErrors({
          fullName: submitError.fieldErrors.fullName,
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

      setError(submitError instanceof Error ? submitError.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-layout">
      {networkToast ? <Toast message={networkToast} onClose={() => setNetworkToast(null)} /> : null}

      <div className="login-wrap stack">
        <header className="page-header">
          <h1 className="page-title">Create account</h1>
          <p className="page-subtitle">Register a workspace account to access tools and execution history.</p>
        </header>

        <Card title="Set up your account" subtitle="Use your work details to create a new profile." variant="glass">
          <form className="stack" onSubmit={handleSubmit} noValidate>
            <Field label="Full name" required error={fieldErrors.fullName}>
              <Input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, fullName: undefined }));
                }}
                autoComplete="name"
                required
              />
            </Field>

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

            <Field label="Password" hint="Minimum length is 8 characters." required error={fieldErrors.password}>
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, password: undefined }));
                }}
                autoComplete="new-password"
                required
              />
            </Field>

            {error ? (
              <div className="alert alert-error" role="alert">
                Registration error: {error}
              </div>
            ) : null}

            <div className="form-actions">
              <Button type="submit" disabled={isSubmitting || status === "loading"}>
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
              <Link className="inline-link" href="/login">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
