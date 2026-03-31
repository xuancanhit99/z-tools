"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { RequireAuth } from "../../../../components/auth/require-auth";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Field, Input, Select, Textarea } from "../../../../components/ui/field";
import {
  executeTool,
  getToolDetail,
  type ExecuteToolResponse,
  type ToolDetail,
  type ToolField
} from "../../../../lib/api";

type ExecutePageProps = {
  params: {
    toolSlug: string;
  };
};

type FormState = Record<string, string | number | boolean>;
type FieldErrors = Record<string, string>;
type SubmitState = "idle" | "running" | "success" | "failure";

function defaultValue(field: ToolField): string | number | boolean {
  if (field.type === "number") {
    return 1;
  }

  if (field.type === "boolean") {
    return false;
  }

  if (field.type === "select") {
    return field.options && field.options[0] ? field.options[0].value : "";
  }

  return "";
}

function validateField(field: ToolField, value: string | number | boolean): string | null {
  if (field.required && field.type !== "boolean") {
    const serialized = String(value ?? "").trim();
    if (!serialized) {
      return "This field is required.";
    }
  }

  if (field.type === "number") {
    const normalized = Number(value);
    if (Number.isNaN(normalized)) {
      return "Enter a valid number.";
    }
  }

  return null;
}

export default function ExecutePage({ params }: ExecutePageProps) {
  const [tool, setTool] = useState<ToolDetail | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<ExecuteToolResponse | null>(null);

  const loadTool = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setSubmitError(null);
    setResult(null);
    setSubmitState("idle");

    try {
      const detail = await getToolDetail(params.toolSlug);
      setTool(detail);

      const nextState: FormState = {};
      detail.inputSchema.forEach((field) => {
        nextState[field.key] = defaultValue(field);
      });
      setFormState(nextState);
      setFieldErrors({});
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load execute config");
    } finally {
      setIsLoading(false);
    }
  }, [params.toolSlug]);

  useEffect(() => {
    void loadTool();
  }, [loadTool]);

  const isDisabled = useMemo(() => {
    if (!tool) {
      return true;
    }

    if (tool.isEnabled === false) {
      return true;
    }

    return isSubmitting;
  }, [isSubmitting, tool]);

  function updateField(key: string, value: string | number | boolean) {
    setFormState((previous) => ({
      ...previous,
      [key]: value
    }));
  }

  function validateForm(): boolean {
    if (!tool) {
      return false;
    }

    const nextErrors: FieldErrors = {};

    tool.inputSchema.forEach((field) => {
      const error = validateField(field, formState[field.key]);
      if (error) {
        nextErrors[field.key] = error;
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateSingleField(field: ToolField, value: string | number | boolean) {
    const error = validateField(field, value);

    setFieldErrors((previous) => {
      const nextErrors = { ...previous };

      if (error) {
        nextErrors[field.key] = error;
      } else {
        delete nextErrors[field.key];
      }

      return nextErrors;
    });
  }

  async function runExecution() {
    if (!tool) {
      return;
    }

    if (!validateForm()) {
      setSubmitState("failure");
      setSubmitError("Please fix field validation errors and try again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);
    setSubmitState("running");

    try {
      const response = await executeTool(tool.slug, {
        input: formState,
        requestId: tool.slug + "-" + Date.now()
      });
      setResult(response);
      setSubmitState("success");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Execution failed");
      setSubmitState("failure");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExecute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runExecution();
  }

  function renderField(field: ToolField) {
    const value = formState[field.key];
    const hint = field.placeholder ? field.placeholder : "Provide a value for this input.";
    const fieldId = "execute-" + field.key;

    if (field.type === "textarea") {
      return (
        <Field
          key={field.key}
          label={field.label}
          hint={hint}
          required={field.required}
          error={fieldErrors[field.key]}
          inputId={fieldId}
        >
          <Textarea
            required={field.required}
            value={String(value ?? "")}
            disabled={isSubmitting}
            onBlur={(event) => validateSingleField(field, event.target.value)}
            onChange={(event) => updateField(field.key, event.target.value)}
          />
        </Field>
      );
    }

    if (field.type === "select") {
      return (
        <Field
          key={field.key}
          label={field.label}
          hint={hint}
          required={field.required}
          error={fieldErrors[field.key]}
          inputId={fieldId}
        >
          <Select
            required={field.required}
            value={String(value ?? "")}
            disabled={isSubmitting}
            onBlur={(event) => validateSingleField(field, event.target.value)}
            onChange={(event) => updateField(field.key, event.target.value)}
          >
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    }

    if (field.type === "boolean") {
      return (
        <Field key={field.key} label={field.label} hint="Toggle this option on or off." inputId={fieldId} error={fieldErrors[field.key]}>
          <input
            type="checkbox"
            className="checkbox"
            checked={Boolean(value)}
            disabled={isSubmitting}
            onBlur={(event) => validateSingleField(field, event.target.checked)}
            onChange={(event) => updateField(field.key, event.target.checked)}
          />
        </Field>
      );
    }

    return (
      <Field
        key={field.key}
        label={field.label}
        hint={hint}
        required={field.required}
        error={fieldErrors[field.key]}
        inputId={fieldId}
      >
        <Input
          type={field.type === "number" ? "number" : "text"}
          required={field.required}
          value={String(value ?? "")}
          disabled={isSubmitting}
          onBlur={(event) => {
            const nextValue = field.type === "number" ? Number(event.target.value) : event.target.value;
            validateSingleField(field, nextValue);
          }}
          onChange={(event) => {
            if (field.type === "number") {
              const rawValue = event.target.value;
              updateField(field.key, rawValue ? Number(rawValue) : "");
              return;
            }

            updateField(field.key, event.target.value);
          }}
        />
      </Field>
    );
  }

  const statusTone = submitState === "running" ? "info" : submitState === "success" ? "success" : submitState === "failure" ? "danger" : "neutral";
  const statusLabel =
    submitState === "running"
      ? "Running"
      : submitState === "success"
        ? "Completed"
        : submitState === "failure"
          ? "Failed"
          : "Idle";

  return (
    <RequireAuth>
      <div className="stack">
        <header className="page-header">
          <h1 className="page-title">Execute Tool</h1>
          <p className="page-subtitle">Fill required inputs and track result state in one place.</p>
        </header>

        <p>
          <Link className="inline-link" href={"/tools/" + params.toolSlug}>
            Back to tool detail
          </Link>
        </p>

        {isLoading ? (
          <div className="execute-layout" aria-live="polite">
            <div className="skeleton-card">
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
            <div className="skeleton-card">
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
          </div>
        ) : null}

        {loadError ? (
          <div className="alert alert-error" role="alert">
            Failed to load execute flow: {loadError}
          </div>
        ) : null}

        {!isLoading && tool ? (
          <div className="execute-layout">
            <Card title={tool.name} subtitle={tool.instructions}>
              {tool.isEnabled === false ? (
                <div className="alert alert-info">This tool is disabled. Contact an admin before running executions.</div>
              ) : null}

              <form className="stack" onSubmit={handleExecute} noValidate>
                {tool.inputSchema.map((field) => renderField(field))}

                <div className="form-actions">
                  <Button type="submit" disabled={isDisabled}>
                    {isSubmitting ? "Running..." : "Run tool"}
                  </Button>
                  {submitState === "failure" ? (
                    <Button type="button" variant="secondary" onClick={() => void runExecution()} disabled={isSubmitting}>
                      Retry
                    </Button>
                  ) : null}
                </div>
              </form>
            </Card>

            <Card className="execute-side" variant="glass" title="Execution status" subtitle="Live state and result summary.">
              <div className="stack" aria-live="polite">
                <Badge tone={statusTone}>{statusLabel}</Badge>

                {submitState === "running" ? (
                  <div className="alert alert-info">Execution is running. The form is temporarily locked.</div>
                ) : null}

                {submitError ? (
                  <div className="alert alert-error" role="alert">
                    {submitError}
                  </div>
                ) : null}

                {result ? (
                  <>
                    <div className="result-summary">
                      <article className="result-item">
                        <p className="result-label">Execution ID</p>
                        <p className="result-value">{result.executionId}</p>
                      </article>
                      <article className="result-item">
                        <p className="result-label">Duration</p>
                        <p className="result-value">{result.durationMs} ms</p>
                      </article>
                      <article className="result-item">
                        <p className="result-label">Executed at</p>
                        <p className="result-value">{new Date(result.executedAt).toLocaleString()}</p>
                      </article>
                    </div>
                    <details>
                      <summary>Raw output JSON</summary>
                      <pre className="output">{JSON.stringify(result.output, null, 2)}</pre>
                    </details>
                  </>
                ) : (
                  <p className="muted">No result yet. Run the tool to view response output.</p>
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {loadError ? (
          <div className="toolbar">
            <Button type="button" variant="secondary" onClick={() => void loadTool()}>
              Retry loading form
            </Button>
          </div>
        ) : null}
      </div>
    </RequireAuth>
  );
}
