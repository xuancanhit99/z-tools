"use client";

import { useEffect, useMemo, useState } from "react";

import { RequireAuth } from "../../components/auth/require-auth";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Toast } from "../../components/ui/toast";
import {
  deleteAdminUser,
  getAdminStats,
  listAdminTools,
  listAdminUsers,
  updateAdminToolStatus,
  updateAdminUser,
  type AdminStatsResponse,
  type AdminUserListItem,
  type ToolSummary,
  type UserRole
} from "../../lib/api";

const USERS_PAGE_SIZE = 8;

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short"
});

type DialogState =
  | {
      kind: "delete-user" | "deactivate-user";
      userId: string;
      userLabel: string;
    }
  | null;

function formatDate(value: string | null, fallback = "Not available") {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return dateTimeFormatter.format(parsed);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [toolsError, setToolsError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [pendingActionKeys, setPendingActionKeys] = useState<string[]>([]);

  const userTotalPages = useMemo(() => {
    const pages = Math.ceil(usersTotal / USERS_PAGE_SIZE);
    return pages > 0 ? pages : 1;
  }, [usersTotal]);

  const enabledToolsCount = useMemo(() => {
    return tools.filter((tool) => tool.isEnabled).length;
  }, [tools]);

  function setPending(key: string, isPending: boolean) {
    setPendingActionKeys((previous) => {
      if (isPending) {
        if (previous.includes(key)) {
          return previous;
        }

        return [...previous, key];
      }

      return previous.filter((item) => item !== key);
    });
  }

  function isPending(key: string) {
    return pendingActionKeys.includes(key);
  }

  async function loadUsers(page: number) {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await listAdminUsers({
        page,
        limit: USERS_PAGE_SIZE
      });

      setUsers(response.data);
      setUsersTotal(response.total);
    } catch (error) {
      setUsersError(getErrorMessage(error, "Failed to load users."));
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadTools() {
    setToolsLoading(true);
    setToolsError(null);

    try {
      const response = await listAdminTools();
      setTools(response.items);
    } catch (error) {
      setToolsError(getErrorMessage(error, "Failed to load tools."));
    } finally {
      setToolsLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const response = await getAdminStats();
      setStats(response);
    } catch (error) {
      setStatsError(getErrorMessage(error, "Failed to load stats."));
    } finally {
      setStatsLoading(false);
    }
  }

  async function refreshAll() {
    setIsRefreshing(true);

    await Promise.allSettled([loadUsers(userPage), loadTools(), loadStats()]);

    setIsRefreshing(false);
  }

  useEffect(() => {
    void loadUsers(userPage);
  }, [userPage]);

  useEffect(() => {
    void Promise.allSettled([loadTools(), loadStats()]);
  }, []);

  useEffect(() => {
    if (!dialogState) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialogState(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dialogState]);

  async function handleRoleChange(userId: string, nextRole: UserRole) {
    const current = users.find((user) => user.id === userId);
    if (!current || current.role === nextRole) {
      return;
    }

    const actionKey = `user-role-${userId}`;
    setPending(actionKey, true);
    setUsers((previous) => previous.map((user) => (user.id === userId ? { ...user, role: nextRole } : user)));

    try {
      const updated = await updateAdminUser(userId, {
        role: nextRole
      });

      setUsers((previous) =>
        previous.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: updated.role,
                isActive: updated.isActive
              }
            : user
        )
      );
    } catch (error) {
      setUsers((previous) => previous.map((user) => (user.id === userId ? { ...user, role: current.role } : user)));
      setToastMessage(getErrorMessage(error, "Could not update role."));
    } finally {
      setPending(actionKey, false);
    }
  }

  async function handleActiveStateChange(userId: string, nextIsActive: boolean) {
    const current = users.find((user) => user.id === userId);
    if (!current || current.isActive === nextIsActive) {
      return;
    }

    const actionKey = `user-active-${userId}`;
    setPending(actionKey, true);
    setUsers((previous) => previous.map((user) => (user.id === userId ? { ...user, isActive: nextIsActive } : user)));

    try {
      const updated = await updateAdminUser(userId, {
        isActive: nextIsActive
      });

      setUsers((previous) =>
        previous.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: updated.role,
                isActive: updated.isActive
              }
            : user
        )
      );
    } catch (error) {
      setUsers((previous) =>
        previous.map((user) => (user.id === userId ? { ...user, isActive: current.isActive } : user))
      );
      setToastMessage(getErrorMessage(error, "Could not update user status."));
    } finally {
      setPending(actionKey, false);
    }
  }

  async function handleDeleteUser(userId: string) {
    const snapshotUsers = users;
    const snapshotTotal = usersTotal;

    const actionKey = `user-delete-${userId}`;
    setPending(actionKey, true);
    setUsers((previous) => previous.filter((user) => user.id !== userId));
    setUsersTotal((previous) => Math.max(0, previous - 1));

    try {
      await deleteAdminUser(userId);

      const nextTotal = Math.max(0, snapshotTotal - 1);
      const nextMaxPage = Math.max(1, Math.ceil(nextTotal / USERS_PAGE_SIZE));

      if (userPage > nextMaxPage) {
        setUserPage(nextMaxPage);
      } else {
        void loadUsers(userPage);
      }

      void loadStats();
    } catch (error) {
      setUsers(snapshotUsers);
      setUsersTotal(snapshotTotal);
      setToastMessage(getErrorMessage(error, "Could not delete user."));
    } finally {
      setPending(actionKey, false);
    }
  }

  async function handleToggleTool(toolId: string) {
    const current = tools.find((tool) => tool.id === toolId);
    if (!current) {
      return;
    }

    const nextIsEnabled = !current.isEnabled;
    const actionKey = `tool-toggle-${toolId}`;

    setPending(actionKey, true);
    setTools((previous) =>
      previous.map((tool) =>
        tool.id === toolId
          ? {
              ...tool,
              isEnabled: nextIsEnabled
            }
          : tool
      )
    );

    try {
      const updated = await updateAdminToolStatus(toolId, nextIsEnabled);
      setTools((previous) => previous.map((tool) => (tool.id === toolId ? { ...tool, isEnabled: updated.isEnabled } : tool)));
    } catch (error) {
      setTools((previous) => previous.map((tool) => (tool.id === toolId ? { ...tool, isEnabled: current.isEnabled } : tool)));
      setToastMessage(getErrorMessage(error, "Could not update tool status."));
    } finally {
      setPending(actionKey, false);
    }
  }

  function moveTool(toolId: string, direction: "up" | "down") {
    setTools((previous) => {
      const index = previous.findIndex((tool) => tool.id === toolId);
      if (index < 0) {
        return previous;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    setToastMessage("Tool order updated locally for this session.");
  }

  async function confirmDialog() {
    if (!dialogState) {
      return;
    }

    const { kind, userId } = dialogState;
    setDialogState(null);

    if (kind === "deactivate-user") {
      await handleActiveStateChange(userId, false);
      return;
    }

    await handleDeleteUser(userId);
  }

  return (
    <RequireAuth role="admin">
      <div className="stack">
        <header className="page-header admin-header-row">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Manage users, tools, and platform usage from one place.</p>
          </div>

          <Button type="button" variant="secondary" onClick={() => void refreshAll()} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh all"}
          </Button>
        </header>

        <Card variant="glass" title="Platform Stats" subtitle="Current totals and execution distribution across Sprint 1 tools.">
          {statsError ? (
            <div className="alert alert-error" role="alert">
              Could not load stats: {statsError}
            </div>
          ) : null}

          {statsLoading ? (
            <div className="stats-grid" aria-live="polite">
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <article className="stat-card">
                  <p className="stat-label">Total users</p>
                  <p className="stat-value">{stats?.totalUsers ?? usersTotal}</p>
                </article>
                <article className="stat-card">
                  <p className="stat-label">Loaded users</p>
                  <p className="stat-value">{users.length}</p>
                </article>
                <article className="stat-card">
                  <p className="stat-label">Total executions</p>
                  <p className="stat-value">{stats?.totalExecutions ?? 0}</p>
                </article>
                <article className="stat-card">
                  <p className="stat-label">Enabled tools</p>
                  <p className="stat-value">
                    {enabledToolsCount} / {tools.length}
                  </p>
                </article>
              </div>

              <div className="admin-usage-list-wrap">
                <h3 className="admin-subtitle">Per-tool usage</h3>
                {stats?.toolUsage.length ? (
                  <ul className="list-reset admin-usage-list">
                    {stats.toolUsage.map((item) => (
                      <li key={item.slug} className="admin-usage-item">
                        <span>
                          <code>{item.slug}</code>
                        </span>
                        <Badge tone="info">{item.count}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No execution data available yet.</p>
                )}
              </div>
            </>
          )}
        </Card>

        <Card title="Users" subtitle="Role and account status controls with optimistic updates.">
          {usersError ? (
            <div className="alert alert-error" role="alert">
              Could not load users: {usersError}
            </div>
          ) : null}

          {usersLoading ? (
            <div className="admin-table-wrap" aria-live="polite">
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <h3 className="card-title">No users found</h3>
              <p className="muted">New users will appear here after registration.</p>
            </div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Email</th>
                      <th scope="col">Name</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Joined</th>
                      <th scope="col">Last login</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const roleActionKey = `user-role-${user.id}`;
                      const activeActionKey = `user-active-${user.id}`;
                      const deleteActionKey = `user-delete-${user.id}`;
                      const isBusy = isPending(roleActionKey) || isPending(activeActionKey) || isPending(deleteActionKey);

                      return (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.email}</strong>
                          </td>
                          <td>{user.name ?? "-"}</td>
                          <td>
                            <select
                              className="select admin-inline-select"
                              value={user.role}
                              onChange={(event) => void handleRoleChange(user.id, event.target.value as UserRole)}
                              disabled={isBusy}
                              aria-label={`Change role for ${user.email}`}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <Badge tone={user.isActive ? "success" : "warning"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td>{formatDate(user.createdAt, "Unknown")}</td>
                          <td>{formatDate(user.lastLoginAt, "Never")}</td>
                          <td>
                            <div className="admin-action-row">
                              <Button
                                type="button"
                                variant={user.isActive ? "secondary" : "primary"}
                                onClick={() => {
                                  if (!user.isActive) {
                                    void handleActiveStateChange(user.id, true);
                                    return;
                                  }

                                  setDialogState({
                                    kind: "deactivate-user",
                                    userId: user.id,
                                    userLabel: user.email
                                  });
                                }}
                                disabled={isBusy}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                onClick={() => {
                                  setDialogState({
                                    kind: "delete-user",
                                    userId: user.id,
                                    userLabel: user.email
                                  });
                                }}
                                disabled={isBusy}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="toolbar admin-pagination-row">
                <span className="muted">
                  Showing {users.length} of {usersTotal} users
                </span>

                <div className="toolbar">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setUserPage((previous) => Math.max(1, previous - 1))}
                    disabled={usersLoading || userPage <= 1}
                  >
                    Previous
                  </Button>

                  <span className="muted">
                    Page {userPage} of {userTotalPages}
                  </span>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setUserPage((previous) => Math.min(userTotalPages, previous + 1))}
                    disabled={usersLoading || userPage >= userTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card
          title="Tools"
          subtitle="Enable/disable controls sync with backend. Reorder controls are local until ordering API is available."
        >
          {toolsError ? (
            <div className="alert alert-error" role="alert">
              Could not load admin tools: {toolsError}
            </div>
          ) : null}

          {toolsLoading ? (
            <div className="admin-table-wrap" aria-live="polite">
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            </div>
          ) : tools.length === 0 ? (
            <div className="empty-state">
              <h3 className="card-title">No tools found</h3>
              <p className="muted">Tool records will appear here once seeded by backend.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Tool</th>
                    <th scope="col">Slug</th>
                    <th scope="col">Category</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool, index) => {
                    const actionKey = `tool-toggle-${tool.id}`;
                    const isBusy = isPending(actionKey);

                    return (
                      <tr key={tool.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{tool.name}</strong>
                        </td>
                        <td>
                          <code>{tool.slug}</code>
                        </td>
                        <td>
                          <Badge tone="info">{tool.category}</Badge>
                        </td>
                        <td>
                          <Badge tone={tool.isEnabled ? "success" : "warning"}>
                            {tool.isEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </td>
                        <td>
                          <div className="admin-action-row">
                            <Button
                              type="button"
                              variant={tool.isEnabled ? "danger" : "primary"}
                              onClick={() => void handleToggleTool(tool.id)}
                              disabled={isBusy}
                            >
                              {tool.isEnabled ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => moveTool(tool.id, "up")}
                              disabled={index === 0}
                            >
                              Move up
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => moveTool(tool.id, "down")}
                              disabled={index === tools.length - 1}
                            >
                              Move down
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {dialogState ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h2 id="confirm-title" className="card-title">
              {dialogState.kind === "delete-user" ? "Delete user?" : "Deactivate user?"}
            </h2>
            <p className="muted">
              {dialogState.kind === "delete-user"
                ? `This permanently removes ${dialogState.userLabel} from the active user list.`
                : `This will block sign-in for ${dialogState.userLabel} until reactivated.`}
            </p>

            <div className="toolbar">
              <Button type="button" variant="secondary" onClick={() => setDialogState(null)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={() => void confirmDialog()}>
                Confirm
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {toastMessage ? <Toast message={toastMessage} onClose={() => setToastMessage(null)} tone="error" /> : null}
    </RequireAuth>
  );
}
