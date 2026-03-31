import { cloneElement, isValidElement, useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  inputId?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, hint, error, required, inputId, className, children }: FieldProps) {
  const generatedId = useId();
  const controlId = inputId ?? generatedId.replace(/:/g, "");
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const ariaDescribedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": error ? true : undefined
      })
    : children;

  return (
    <div className={cn("field", className)}>
      <label htmlFor={controlId} className="field-label">
        {label}
        {required ? <span className="field-required"> *</span> : null}
      </label>
      {control}
      {hint ? (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("textarea", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("select", props.className)} />;
}
