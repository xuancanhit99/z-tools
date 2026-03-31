import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const normalizedVariant = variant === "ghost" ? "secondary" : variant;
  return <button className={cn("btn", `btn-${normalizedVariant}`, className)} {...props} />;
}
