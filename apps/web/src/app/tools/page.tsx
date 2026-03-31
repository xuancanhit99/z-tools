"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RequireAuth } from "../../components/auth/require-auth";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Field, Input, Select } from "../../components/ui/field";
import { listTools, type ToolSummary } from "../../lib/api";

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function loadTools() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listTools();
      setTools(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tools");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTools();
  }, []);

  const filteredTools = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tools.filter((tool) => {
      if (enabledFilter === "enabled" && !tool.isEnabled) {
        return false;
      }

      if (enabledFilter === "disabled" && tool.isEnabled) {
        return false;
      }

      if (categoryFilter !== "all" && tool.category !== categoryFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        tool.name.toLowerCase().includes(keyword) ||
        tool.slug.toLowerCase().includes(keyword) ||
        tool.category.toLowerCase().includes(keyword)
      );
    });
  }, [categoryFilter, enabledFilter, search, tools]);

  const categories = useMemo(() => {
    return Array.from(new Set(tools.map((tool) => tool.category))).sort();
  }, [tools]);

  const hasActiveFilters = search.trim() || enabledFilter !== "all" || categoryFilter !== "all";

  function clearFilters() {
    setSearch("");
    setEnabledFilter("all");
    setCategoryFilter("all");
  }

  return (
    <RequireAuth>
      <div className="stack">
        <header className="page-header">
          <h1 className="page-title">Tool Catalog</h1>
          <p className="page-subtitle">Find tools quickly, inspect details, and run actions from one unified flow.</p>
        </header>

        <Card variant="glass">
          <div className="catalog-toolbar">
            <Field label="Search tools" hint="Filter by name, slug, or category.">
              <Input
                type="search"
                placeholder="Search: json, uuid, encoding..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Field>
            <Button type="button" variant="secondary" onClick={() => void loadTools()} disabled={isLoading}>
              Refresh
            </Button>
          </div>

          <div className="filters-row">
            <Field label="Status" className="filter-mini">
              <Select value={enabledFilter} onChange={(event) => setEnabledFilter(event.target.value as "all" | "enabled" | "disabled")}>
                <option value="all">All statuses</option>
                <option value="enabled">Enabled only</option>
                <option value="disabled">Disabled only</option>
              </Select>
            </Field>

            <Field label="Category" className="filter-mini">
              <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>

            {hasActiveFilters ? (
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>

          <div className="muted" aria-live="polite">
            {isLoading ? "Loading catalog..." : `Showing ${filteredTools.length} of ${tools.length} tools.`}
          </div>
        </Card>

        {error ? (
          <div className="alert alert-error" role="alert">
            Could not load catalog: {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="tool-grid" aria-live="polite">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && filteredTools.length === 0 ? (
          <div className="empty-state">
            <h2 className="card-title">No tools match this filter</h2>
            <p className="muted">Try a broader search or reset status/category filters.</p>
            <div className="toolbar">
              {hasActiveFilters ? (
                <Button type="button" variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => void loadTools()}>
                Refresh catalog
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && filteredTools.length > 0 ? (
          <div className="tool-grid">
            {filteredTools.map((tool) => (
              <Card key={tool.id} className="tool-card">
                <div>
                  <h2 className="tool-title">{tool.name}</h2>
                  <p className="tool-description">{tool.description}</p>
                </div>

                <div className="toolbar">
                  <Badge tone="info">{tool.category}</Badge>
                  <Badge tone={tool.isEnabled ? "success" : "warning"}>
                    {tool.isEnabled ? "Status: enabled" : "Status: disabled"}
                  </Badge>
                </div>

                <div className="tool-actions">
                  <Link className="btn btn-secondary" href={`/tools/${tool.slug}`}>
                    View
                  </Link>
                  {tool.isEnabled ? (
                    <Link className="btn btn-primary" href={`/tools/${tool.slug}/execute`}>
                      Run
                    </Link>
                  ) : (
                    <span className="btn btn-secondary" aria-disabled="true">
                      Run unavailable
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="toolbar">
            <Button type="button" variant="secondary" onClick={() => void loadTools()}>
              Retry loading catalog
            </Button>
          </div>
        ) : null}
      </div>
    </RequireAuth>
  );
}
