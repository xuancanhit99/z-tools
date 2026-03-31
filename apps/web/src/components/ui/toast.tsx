"use client";

import { useEffect } from "react";

type ToastTone = "error" | "info";

type ToastProps = {
  message: string;
  onClose: () => void;
  tone?: ToastTone;
  autoHideMs?: number;
};

export function Toast({ message, onClose, tone = "error", autoHideMs = 4500 }: ToastProps) {
  useEffect(() => {
    if (!autoHideMs) {
      return;
    }

    const timeoutId = window.setTimeout(onClose, autoHideMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autoHideMs, onClose]);

  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button className="toast-close" type="button" onClick={onClose} aria-label="Dismiss notification">
        Dismiss
      </button>
    </div>
  );
}
