import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type CardVariant = "solid" | "glass";

type CardProps = {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: CardVariant;
};

export function Card({ children, title, subtitle, className, variant = "solid" }: CardProps) {
  return (
    <section className={cn("card", variant === "glass" && "card-glass", className)}>
      {title ? <h2 className="card-title">{title}</h2> : null}
      {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      <div>{children}</div>
    </section>
  );
}
