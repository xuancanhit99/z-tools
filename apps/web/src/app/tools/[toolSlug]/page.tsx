"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { RequireAuth } from "../../../components/auth/require-auth";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { getToolDetail, type ToolDetail } from "../../../lib/api";

type ToolDetailPageProps = {
  params: {
    toolSlug: string;
  };
};

export default function ToolDetailPage({ params }: ToolDetailPageProps) {
  const [tool, setTool] = useState<ToolDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTool = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getToolDetail(params.toolSlug);
      setTool(detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tool detail");
    } finally {
      setIsLoading(false);
    }
  }, [params.toolSlug]);

  useEffect(() => {
    void loadTool();
  }, [loadTool]);

  return (
    <RequireAuth>
      <div className="stack">
        <header className="page-header">
          <h1 className="page-title">Tool Detail</h1>
          <p className="page-subtitle">Review metadata and input contract before running the tool.</p>
        </header>

        <p>
          <Link className="inline-link" href="/tools">
            Back to catalog
          </Link>
        </p>

        {isLoading ? (
          <div className="tool-grid" aria-live="polite">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`detail-skeleton-${index}`} className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-error" role="alert">
            Unable to load detail: {error}
          </div>
        ) : null}

        {!isLoading && !error && tool ? (
          <>
            <Card variant="glass">
              <div className="detail-hero">
                <div>
                  <h2 className="detail-title">{tool.name}</h2>
                  <p className="detail-subtitle">{tool.description}</p>
                </div>
                <div className="tool-actions">
                  <Badge tone="info">{tool.category}</Badge>
                  <Badge tone={tool.isEnabled ? "success" : "warning"}>
                    {tool.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Link className="btn btn-primary" href={`/tools/${tool.slug}/execute`}>
                    Run tool
                  </Link>
                </div>
              </div>
            </Card>

            <Card title="Metadata" subtitle="Contract and behavior overview.">
              <div className="meta-grid">
                <article className="meta-item">
                  <p className="meta-label">Slug</p>
                  <p className="meta-value">
                    <code>{tool.slug}</code>
                  </p>
                </article>
                <article className="meta-item">
                  <p className="meta-label">Category</p>
                  <p className="meta-value">{tool.category}</p>
                </article>
                <article className="meta-item">
                  <p className="meta-label">Status</p>
                  <p className="meta-value">{tool.isEnabled ? "Enabled and runnable" : "Disabled until admin enables"}</p>
                </article>
                <article className="meta-item">
                  <p className="meta-label">Output type</p>
                  <p className="meta-value">{tool.outputSchema.type}</p>
                </article>
              </div>
              <p className="muted">{tool.instructions}</p>
            </Card>

            <Card title="Input schema" subtitle="Required fields are marked for fast validation.">
              {tool.inputSchema.length === 0 ? (
                <p className="muted">This tool does not require input fields.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="schema-table">
                    <thead>
                      <tr>
                        <th scope="col">Field</th>
                        <th scope="col">Label</th>
                        <th scope="col">Type</th>
                        <th scope="col">Required</th>
                        <th scope="col">Hint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tool.inputSchema.map((field) => (
                        <tr key={field.key}>
                          <td>
                            <code>{field.key}</code>
                          </td>
                          <td>{field.label}</td>
                          <td>{field.type}</td>
                          <td>{field.required ? <Badge tone="danger">Required</Badge> : <Badge tone="neutral">Optional</Badge>}</td>
                          <td>{field.placeholder ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : null}

        {error ? (
          <div className="toolbar">
            <Button type="button" variant="secondary" onClick={() => void loadTool()}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </RequireAuth>
  );
}
