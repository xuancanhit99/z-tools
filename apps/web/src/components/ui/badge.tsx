import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}
