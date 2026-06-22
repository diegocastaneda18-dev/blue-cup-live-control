"use client";

import { Card } from "@bluecup/ui";
import { EmptyState } from "../../../components/EmptyState";
import {
  btnGhostClass,
  btnPrimaryClass,
  btnResponsiveClass,
  btnSecondaryClass,
  cardListShellClass,
  contentStackClass,
  fieldInputClass,
  FormField,
  formStackClass,
  InlineNotice,
  LoadingBlock,
  PageHeader,
  PageMain,
  SectionLabel
} from "../../../components/PageChrome";
import { useToast } from "../../../components/Toast";
import { demoTournamentsList } from "@bluecup/types";
import { getPublicApiBaseUrl, publicApiUrl } from "../../../lib/env";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const API_USERS = publicApiUrl("/users");
const API_TOURNAMENTS = publicApiUrl("/tournaments");
const API_TEAMS = publicApiUrl("/teams");

const ROLES = ["admin", "committee", "captain", "team_member"] as const;
type AssignableRole = (typeof ROLES)[number];

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  team: { id: string; name: string; tournamentId: string } | null;
};

type TeamOption = { id: string; name: string };
type TournamentOption = { id: string; name: string };

function roleRequiresTeam(role: string): boolean {
  return role === "captain" || role === "team_member";
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseApiError(raw: unknown): string {
  if (raw && typeof raw === "object" && "message" in raw) {
    const msg = (raw as { message?: string | string[] }).message;
    if (Array.isArray(msg)) return msg.join(" ");
    if (typeof msg === "string") return msg;
  }
  return "Request failed.";
}

const emptyCreateForm = {
  email: "",
  displayName: "",
  role: "team_member" as AssignableRole,
  password: "",
  isActive: true,
  tournamentId: "",
  teamId: ""
};

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();

  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    displayName: "",
    role: "team_member" as AssignableRole,
    isActive: true,
    tournamentId: "",
    teamId: ""
  });
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (roleFilter) params.set("role", roleFilter);
    if (activeFilter) params.set("isActive", activeFilter);
    const qs = params.toString();
    try {
      const res = await fetch(qs ? `${API_USERS}?${qs}` : API_USERS, {
        cache: "no-store",
        headers: { ...authHeaders() }
      });
      if (res.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        setError("Admin access required.");
        setRows([]);
        return;
      }
      if (!res.ok) {
        setError(parseApiError(await res.json().catch(() => null)) || `Could not load users (${res.status}).`);
        setRows([]);
        return;
      }
      const data = (await res.json()) as unknown;
      setRows(Array.isArray(data) ? (data as UserRow[]) : []);
    } catch {
      setError(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [router, search, roleFilter, activeFilter]);

  const loadTournaments = useCallback(async () => {
    try {
      const res = await fetch(API_TOURNAMENTS, { cache: "no-store", headers: { ...authHeaders() } });
      if (!res.ok) {
        setTournaments(demoTournamentsList());
        return;
      }
      const data = (await res.json()) as unknown;
      const list = Array.isArray(data) ? (data as TournamentOption[]) : [];
      setTournaments(list.length > 0 ? list : demoTournamentsList());
    } catch {
      setTournaments(demoTournamentsList());
    }
  }, []);

  const loadTeams = useCallback(async (tournamentId: string) => {
    if (!tournamentId) {
      setTeams([]);
      return;
    }
    setTeamsLoading(true);
    try {
      const url = `${API_TEAMS}/tournament/${encodeURIComponent(tournamentId)}`;
      const res = await fetch(url, { cache: "no-store", headers: { ...authHeaders() } });
      if (!res.ok) {
        setTeams([]);
        return;
      }
      const data = (await res.json()) as unknown;
      const list = Array.isArray(data) ? (data as { id: string; name: string }[]) : [];
      setTeams(list.map((t) => ({ id: t.id, name: t.name })));
    } catch {
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    void loadTeams(createForm.tournamentId);
  }, [createForm.tournamentId, loadTeams]);

  useEffect(() => {
    if (editingId) void loadTeams(editForm.tournamentId);
  }, [editForm.tournamentId, editingId, loadTeams]);

  const filteredCount = useMemo(() => rows.length, [rows]);

  function openEdit(user: UserRow) {
    setEditingId(user.id);
    setEditError(null);
    setEditForm({
      email: user.email,
      displayName: user.displayName,
      role: user.role as AssignableRole,
      isActive: user.isActive,
      tournamentId: user.team?.tournamentId ?? tournaments[0]?.id ?? "",
      teamId: user.team?.id ?? ""
    });
    setShowCreate(false);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreatePending(true);
    setCreateError(null);
    const body: Record<string, unknown> = {
      email: createForm.email.trim(),
      displayName: createForm.displayName.trim(),
      role: createForm.role,
      password: createForm.password,
      isActive: createForm.isActive
    };
    if (roleRequiresTeam(createForm.role)) {
      body.teamId = createForm.teamId;
    }
    try {
      const res = await fetch(API_USERS, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = parseApiError(raw) || `Create failed (${res.status}).`;
        setCreateError(msg);
        toast.error(msg);
        return;
      }
      toast.success("User created.");
      setCreateForm(emptyCreateForm);
      setShowCreate(false);
      await loadUsers();
    } catch {
      const msg = `Could not reach the API at ${getPublicApiBaseUrl()}.`;
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreatePending(false);
    }
  }

  async function onEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditPending(true);
    setEditError(null);
    const body: Record<string, unknown> = {
      email: editForm.email.trim(),
      displayName: editForm.displayName.trim(),
      role: editForm.role,
      isActive: editForm.isActive
    };
    if (roleRequiresTeam(editForm.role)) {
      body.teamId = editForm.teamId || null;
    } else {
      body.teamId = null;
    }
    try {
      const res = await fetch(`${API_USERS}/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = parseApiError(raw) || `Update failed (${res.status}).`;
        setEditError(msg);
        toast.error(msg);
        return;
      }
      toast.success("User updated.");
      setEditingId(null);
      await loadUsers();
    } catch {
      const msg = `Could not reach the API at ${getPublicApiBaseUrl()}.`;
      setEditError(msg);
      toast.error(msg);
    } finally {
      setEditPending(false);
    }
  }

  async function toggleActive(user: UserRow) {
    try {
      const res = await fetch(`${API_USERS}/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(parseApiError(raw) || `Update failed (${res.status}).`);
        return;
      }
      toast.success(user.isActive ? "User deactivated." : "User activated.");
      await loadUsers();
    } catch {
      toast.error(`Could not reach the API at ${getPublicApiBaseUrl()}.`);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetPending(true);
    setResetError(null);
    try {
      const res = await fetch(`${API_USERS}/${encodeURIComponent(resetTarget.id)}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ password: resetPassword })
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = parseApiError(raw) || `Reset failed (${res.status}).`;
        setResetError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Password reset for ${resetTarget.email}.`);
      setResetTarget(null);
      setResetPassword("");
    } catch {
      const msg = `Could not reach the API at ${getPublicApiBaseUrl()}.`;
      setResetError(msg);
      toast.error(msg);
    } finally {
      setResetPending(false);
    }
  }

  return (
    <PageMain className="max-w-5xl">
      <PageHeader
        kicker="Administration"
        title="Users"
        description="Create and manage tournament accounts, roles, team assignments, and temporary passwords."
        aside={
          <button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v);
              setEditingId(null);
              setCreateError(null);
            }}
            className={`${btnPrimaryClass} ${btnResponsiveClass}`}
          >
            {showCreate ? "Close form" : "Create user"}
          </button>
        }
      />

      <div className={contentStackClass}>
        <div>
          <SectionLabel className="mb-3 text-slate-500">Search & filters</SectionLabel>
          <Card title="Find users">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Search" hint="Email or display name">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={fieldInputClass}
                  placeholder="Search users…"
                />
              </FormField>
              <FormField label="Role">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={fieldInputClass}
                >
                  <option value="">All roles</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className={fieldInputClass}
                >
                  <option value="">All statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </FormField>
              <div className="flex items-end">
                <button type="button" onClick={() => void loadUsers()} className={`${btnGhostClass} ${btnResponsiveClass}`}>
                  Apply filters
                </button>
              </div>
            </div>
          </Card>
        </div>

        {showCreate ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">New account</SectionLabel>
            <Card title="Create user">
              <form className={formStackClass} onSubmit={onCreate}>
                {createError ? <InlineNotice variant="error">{createError}</InlineNotice> : null}
                <FormField label="Email">
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    className={fieldInputClass}
                    autoComplete="off"
                  />
                </FormField>
                <FormField label="Display name">
                  <input
                    required
                    minLength={2}
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                    className={fieldInputClass}
                  />
                </FormField>
                <FormField label="Role">
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, role: e.target.value as AssignableRole, teamId: "" }))
                    }
                    className={fieldInputClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </FormField>
                {roleRequiresTeam(createForm.role) ? (
                  <>
                    <FormField label="Tournament">
                      <select
                        value={createForm.tournamentId}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, tournamentId: e.target.value, teamId: "" }))
                        }
                        className={fieldInputClass}
                      >
                        <option value="">Select tournament</option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Team">
                      <select
                        required
                        value={createForm.teamId}
                        onChange={(e) => setCreateForm((f) => ({ ...f, teamId: e.target.value }))}
                        disabled={!createForm.tournamentId || teamsLoading}
                        className={fieldInputClass}
                      >
                        <option value="">Select team</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </>
                ) : null}
                <FormField label="Temporary password">
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className={fieldInputClass}
                    autoComplete="new-password"
                  />
                </FormField>
                <label className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950"
                  />
                  Active account
                </label>
                <button type="submit" disabled={createPending} className={`${btnPrimaryClass} ${btnResponsiveClass}`}>
                  {createPending ? "Creating…" : "Create user"}
                </button>
              </form>
            </Card>
          </div>
        ) : null}

        {editingId ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Edit account</SectionLabel>
            <Card title="Edit user">
              <form className={formStackClass} onSubmit={onEdit}>
                {editError ? <InlineNotice variant="error">{editError}</InlineNotice> : null}
                <FormField label="Email">
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className={fieldInputClass}
                  />
                </FormField>
                <FormField label="Display name">
                  <input
                    required
                    minLength={2}
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    className={fieldInputClass}
                  />
                </FormField>
                <FormField label="Role">
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, role: e.target.value as AssignableRole, teamId: "" }))
                    }
                    className={fieldInputClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </FormField>
                {roleRequiresTeam(editForm.role) ? (
                  <>
                    <FormField label="Tournament">
                      <select
                        value={editForm.tournamentId}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, tournamentId: e.target.value, teamId: "" }))
                        }
                        className={fieldInputClass}
                      >
                        <option value="">Select tournament</option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Team">
                      <select
                        required
                        value={editForm.teamId}
                        onChange={(e) => setEditForm((f) => ({ ...f, teamId: e.target.value }))}
                        disabled={!editForm.tournamentId || teamsLoading}
                        className={fieldInputClass}
                      >
                        <option value="">Select team</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </>
                ) : null}
                <label className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950"
                  />
                  Active account
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={editPending} className={`${btnPrimaryClass} ${btnResponsiveClass}`}>
                    {editPending ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className={`${btnGhostClass} ${btnResponsiveClass}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          </div>
        ) : null}

        {resetTarget ? (
          <div>
            <SectionLabel className="mb-3 text-slate-500">Password reset</SectionLabel>
            <Card title={`Reset password — ${resetTarget.email}`}>
              <form className={formStackClass} onSubmit={onResetPassword}>
                {resetError ? <InlineNotice variant="error">{resetError}</InlineNotice> : null}
                <FormField label="Temporary password" hint="Share this securely with the user.">
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className={fieldInputClass}
                    autoComplete="new-password"
                  />
                </FormField>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={resetPending} className={`${btnPrimaryClass} ${btnResponsiveClass}`}>
                    {resetPending ? "Saving…" : "Set temporary password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetTarget(null);
                      setResetPassword("");
                      setResetError(null);
                    }}
                    className={`${btnGhostClass} ${btnResponsiveClass}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          </div>
        ) : null}

        <div>
          <SectionLabel className="mb-3 text-slate-500">
            Accounts {filteredCount > 0 ? `(${filteredCount})` : ""}
          </SectionLabel>
          <Card title="User directory">
            {loading ? (
              <LoadingBlock label="Loading users…" />
            ) : error ? (
              <div className="space-y-4">
                <InlineNotice variant="error">{error}</InlineNotice>
                <button type="button" onClick={() => void loadUsers()} className={btnGhostClass}>
                  Try again
                </button>
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                title="No users found"
                description="Adjust your filters or create a new user account."
              />
            ) : (
              <>
                <ul className={`divide-y divide-white/[0.06] sm:hidden ${cardListShellClass}`}>
                  {rows.map((user) => (
                    <li key={user.id} className="space-y-3 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-50">{user.displayName}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 capitalize text-slate-200">
                          {user.role.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 ${
                            user.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Team: {user.team?.name ?? "—"}</p>
                      <div className="grid gap-2">
                        <button type="button" onClick={() => openEdit(user)} className={`${btnGhostClass} ${btnResponsiveClass} text-xs`}>
                          Edit
                        </button>
                        <button type="button" onClick={() => toggleActive(user)} className={`${btnSecondaryClass} ${btnResponsiveClass} text-xs`}>
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTarget(user);
                            setResetPassword("");
                            setResetError(null);
                          }}
                          className={`${btnGhostClass} ${btnResponsiveClass} text-xs`}
                        >
                          Reset password
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className={`hidden overflow-x-auto sm:block ${cardListShellClass}`}>
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-white/[0.06] bg-white/[0.04] text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Team</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {rows.map((user) => (
                        <tr key={user.id} className="text-slate-200">
                          <td className="px-4 py-3 font-medium text-slate-50">{user.displayName}</td>
                          <td className="px-4 py-3 text-slate-400">{user.email}</td>
                          <td className="px-4 py-3 capitalize">{user.role.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs ${
                                user.isActive
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                  : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{user.team?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button type="button" onClick={() => openEdit(user)} className={`${btnGhostClass} text-xs`}>
                                Edit
                              </button>
                              <button type="button" onClick={() => toggleActive(user)} className={`${btnSecondaryClass} text-xs`}>
                                {user.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setResetTarget(user);
                                  setResetPassword("");
                                  setResetError(null);
                                }}
                                className={`${btnGhostClass} text-xs`}
                              >
                                Reset password
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </PageMain>
  );
}
