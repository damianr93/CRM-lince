import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, KeyRound, RefreshCw, ShieldCheck, Trash2, UserCog, UserPlus } from "lucide-react";
import { apiFetch } from "@/utils/auth";
import { isAdmin, useCurrentUser } from "@/context/CurrentUserContext";
import { useNotificationHelpers } from "@/components/NotificationSystem";

type Role = "ADMIN" | "USER";

interface UserRow {
  id: string;
  username: string;
  role: Role;
}

const API_URL = import.meta.env.VITE_API_URL;

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  USER: "Usuario",
};

const inputClasses =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20";

const primaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-gray-700/50 disabled:cursor-not-allowed disabled:opacity-60";

// The API returns `message` as a string, or as a list of validation errors
async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    const message = Array.isArray(body?.message) ? body.message.join(". ") : body?.message;
    return typeof message === "string" && message ? message : fallback;
  } catch {
    return fallback;
  }
}

export default function UsersView() {
  const currentUser = useCurrentUser();
  const { showSuccess, showError } = useNotificationHelpers();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("USER");
  const [creating, setCreating] = useState(false);

  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${API_URL}/users`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudieron cargar los usuarios"));
      }
      setUsers(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin(currentUser)) {
      loadUsers();
    }
  }, [currentUser, loadUsers]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await apiFetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, role: newRole }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudo crear el usuario"));
      }
      showSuccess("Usuario creado", `${newUsername.trim()} ya puede ingresar al CRM`);
      setNewUsername("");
      setNewPassword("");
      setNewRole("USER");
      await loadUsers();
    } catch (err) {
      showError("Error al crear usuario", err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (user: UserRow, changes: Partial<{ role: Role; password: string }>, successMessage: string) => {
    setBusyUserId(user.id);
    try {
      const response = await apiFetch(`${API_URL}/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudo actualizar el usuario"));
      }
      showSuccess("Usuario actualizado", successMessage);
      await loadUsers();
      return true;
    } catch (err) {
      showError("Error al actualizar usuario", err instanceof Error ? err.message : "No se pudo actualizar el usuario");
      return false;
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = (user: UserRow, role: Role) => {
    if (role === user.role) return;
    updateUser(user, { role }, `${user.username} ahora es ${ROLE_LABELS[role].toLowerCase()}`);
  };

  const handlePasswordSave = async (user: UserRow) => {
    const saved = await updateUser(user, { password: passwordValue }, `Se cambió la contraseña de ${user.username}`);
    if (saved) {
      setPasswordUserId(null);
      setPasswordValue("");
    }
  };

  const handleDelete = async (user: UserRow) => {
    const confirmed = window.confirm(`¿Eliminar al usuario ${user.username}? Ya no podrá ingresar al CRM.`);
    if (!confirmed) return;

    setBusyUserId(user.id);
    try {
      const response = await apiFetch(`${API_URL}/users/${user.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudo eliminar el usuario"));
      }
      showSuccess("Usuario eliminado", `${user.username} fue eliminado`);
      await loadUsers();
    } catch (err) {
      showError("Error al eliminar usuario", err instanceof Error ? err.message : "No se pudo eliminar el usuario");
    } finally {
      setBusyUserId(null);
    }
  };

  if (!isAdmin(currentUser)) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-10 text-center text-neutral-500">
          <ShieldCheck className="mx-auto mb-3" size={22} />
          Solo los administradores pueden gestionar usuarios.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-yellow-400/20 via-yellow-400/10 to-transparent p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                  <UserCog size={14} /> Administración
                </div>
                <h1 className="mt-4 text-3xl font-bold text-gray-950 dark:text-neutral-50">Usuarios</h1>
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  Alta y baja de usuarios, roles de administrador y cambio de contraseñas.
                </p>
              </div>

              <button type="button" onClick={loadUsers} disabled={loading} className={primaryButtonClasses}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-950 dark:text-neutral-50">
            <UserPlus size={18} /> Nuevo usuario
          </h2>
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
            <label className="space-y-1 text-xs font-semibold text-neutral-500">
              Usuario
              <input
                className={inputClasses}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                minLength={4}
                maxLength={15}
                required
                autoComplete="off"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-neutral-500">
              Contraseña
              <input
                className={inputClasses}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                maxLength={15}
                required
                autoComplete="new-password"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-neutral-500">
              Rol
              <select className={inputClasses} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
                <option value="USER">{ROLE_LABELS.USER}</option>
                <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
              </select>
            </label>
            <button type="submit" disabled={creating} className={primaryButtonClasses}>
              <UserPlus size={16} />
              {creating ? "Creando..." : "Crear"}
            </button>
          </form>
          <p className="mt-2 text-xs text-neutral-500">Usuario de 4 a 15 caracteres. Contraseña de 6 a 15 caracteres.</p>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-neutral-500">
            <RefreshCw className="mx-auto mb-3 animate-spin" size={22} />
            Cargando usuarios...
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <ul className="divide-y divide-border">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.userId;
                const busy = busyUserId === user.id;
                return (
                  <li key={user.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950 dark:text-neutral-50">
                        {user.username}
                        {isSelf && <span className="ml-2 text-xs font-normal text-neutral-500">(sesión actual)</span>}
                      </p>
                      <p className="text-xs text-neutral-500">{ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className={`${inputClasses} w-auto py-1.5 text-xs`}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                        disabled={busy || isSelf}
                        title={isSelf ? "No puede quitarse su propio rol de administrador" : "Cambiar rol"}
                        aria-label={`Rol de ${user.username}`}
                      >
                        <option value="USER">{ROLE_LABELS.USER}</option>
                        <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                      </select>

                      {passwordUserId === user.id ? (
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handlePasswordSave(user);
                          }}
                        >
                          <input
                            className={`${inputClasses} w-40 py-1.5 text-xs`}
                            type="password"
                            placeholder="Nueva contraseña"
                            value={passwordValue}
                            onChange={(e) => setPasswordValue(e.target.value)}
                            minLength={6}
                            maxLength={15}
                            required
                            autoFocus
                            autoComplete="new-password"
                          />
                          <button type="submit" disabled={busy} className={secondaryButtonClasses}>
                            Guardar
                          </button>
                          <button
                            type="button"
                            className={secondaryButtonClasses}
                            onClick={() => {
                              setPasswordUserId(null);
                              setPasswordValue("");
                            }}
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          className={secondaryButtonClasses}
                          onClick={() => {
                            setPasswordUserId(user.id);
                            setPasswordValue("");
                          }}
                        >
                          <KeyRound size={14} /> Contraseña
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busy || isSelf}
                        title={isSelf ? "No puede eliminar su propio usuario" : "Eliminar usuario"}
                        className={`${secondaryButtonClasses} text-red-600 dark:text-red-400`}
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
