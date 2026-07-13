import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { apiFetch } from "@/utils/auth";

interface FailedFollowUpTask {
  id: string;
  customerName?: string;
  customerLastName?: string;
  assignedTo?: string;
  product?: string;
  status: string;
  triggerStatus: string;
  templateId: string;
  executeAt: string;
  processedAt?: string;
  error?: string;
  attempts: number;
  eventId?: string;
  eventStatus?: string;
}

type FollowUpAction = "retry" | "discard";

interface ActionState {
  id: string;
  type: FollowUpAction;
}

const statusLabels: Record<string, string> = {
  FAILED: "Fallido",
  SKIPPED: "Omitido",
  SCHEDULED: "Programado",
  READY: "Listo",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const templateLabels: Record<string, string> = {
  NO_RESPONSE_24H: "Sin respuesta 24 h",
  QUOTE_PENDING_48H: "Cotización pendiente 48 h",
  SATISFACTION_14D: "Encuesta de calidad",
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function customerName(task: FailedFollowUpTask) {
  return [task.customerName, task.customerLastName].filter(Boolean).join(" ").trim() || "Cliente sin nombre";
}

function getTemplateLabel(task: FailedFollowUpTask) {
  return templateLabels[task.templateId] ?? task.templateId;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = status ?? "UNKNOWN";
  const isSkipped = normalized === "SKIPPED";
  const isFailed = normalized === "FAILED";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        isFailed
          ? "bg-red-500/10 text-red-700 dark:text-red-300"
          : isSkipped
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300",
      ].join(" ")}
    >
      {statusLabels[normalized] ?? normalized}
    </span>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "green" }) {
  const toneClass = {
    red: "from-red-500/15 to-red-500/5 text-red-700 dark:text-red-300",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300",
    green: "from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  }[tone];

  return (
    <div className={`rounded-2xl border border-border bg-gradient-to-br ${toneClass} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-neutral-100">{value}</p>
    </div>
  );
}

export default function FollowUpsView() {
  const [tasks, setTasks] = useState<FailedFollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState | null>(null);

  const summary = useMemo(() => {
    const failed = tasks.filter((task) => task.status === "FAILED").length;
    const skipped = tasks.filter((task) => task.status === "SKIPPED").length;
    return {
      total: tasks.length,
      failed,
      skipped,
    };
  }, [tasks]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/follow-up/tasks/failed`);

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudieron cargar los seguimientos."));
      }

      const data = (await response.json()) as FailedFollowUpTask[];
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const removeFromList = (taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  };

  const retryTask = async (task: FailedFollowUpTask) => {
    const name = customerName(task);
    const template = getTemplateLabel(task);
    const confirmed = window.confirm(`¿Reenviar ahora "${template}" para ${name}?\n\nEsto vuelve a poner el mensaje en cola para envío automático.`);

    if (!confirmed) return;

    setActionState({ id: task.id, type: "retry" });
    setError(null);

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/follow-up/tasks/${task.id}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudo reenviar el seguimiento."));
      }

      removeFromList(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el seguimiento.");
    } finally {
      setActionState(null);
    }
  };

  const discardTask = async (task: FailedFollowUpTask) => {
    const name = customerName(task);
    const confirmed = window.confirm(`¿Borrar este seguimiento de la bandeja?\n\nCliente: ${name}\n\nNo se enviará automáticamente y quedará cancelado para auditoría.`);

    if (!confirmed) return;

    setActionState({ id: task.id, type: "discard" });
    setError(null);

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/follow-up/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudo borrar el seguimiento."));
      }

      removeFromList(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar el seguimiento.");
    } finally {
      setActionState(null);
    }
  };

  const isActing = (task: FailedFollowUpTask, type: FollowUpAction) =>
    actionState?.id === task.id && actionState.type === type;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-yellow-400/20 via-yellow-400/10 to-transparent p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                  <AlertTriangle size={14} /> Bandeja operativa
                </div>
                <h1 className="mt-4 text-3xl font-bold text-gray-950 dark:text-neutral-50">Seguimientos con problemas</h1>
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  Acá revisás mensajes automáticos fallidos u omitidos. Podés reenviarlos cuando el problema esté resuelto o borrarlos de la bandeja sin perder auditoría.
                </p>
              </div>

              <button
                type="button"
                onClick={loadTasks}
                disabled={loading || actionState !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total en bandeja" value={summary.total} tone="green" />
          <StatCard label="Fallidos" value={summary.failed} tone="red" />
          <StatCard label="Omitidos" value={summary.skipped} tone="amber" />
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
            Cargando seguimientos...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={34} />
            <h2 className="text-lg font-semibold text-gray-950 dark:text-neutral-50">No hay nada para revisar</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Cuando falle un envío automático, va a aparecer acá con su acción de reenvío.
            </p>
          </div>
        ) : (
          <section className="grid gap-4">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-yellow-400/30 hover:shadow-md md:p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      {task.eventStatus && <StatusBadge status={task.eventStatus} />}
                      <span className="inline-flex items-center rounded-full bg-neutral-500/10 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        {getTemplateLabel(task)}
                      </span>
                    </div>

                    <div>
                      <h2 className="truncate text-lg font-bold text-gray-950 dark:text-neutral-50">{customerName(task)}</h2>
                      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{task.product || "Sin producto asociado"}</p>
                    </div>

                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">
                      <p className="break-words" title={task.error}>{task.error || "Sin detalle de error"}</p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-2">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-neutral-500"><UserRound size={13} /> Asesor</dt>
                      <dd className="mt-1 font-semibold text-gray-900 dark:text-neutral-100">{task.assignedTo || "Sin asignar"}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-neutral-500"><Clock3 size={13} /> Procesado</dt>
                      <dd className="mt-1 font-semibold text-gray-900 dark:text-neutral-100">{formatDate(task.processedAt)}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <dt className="text-xs text-neutral-500">Intentos</dt>
                      <dd className="mt-1 font-semibold text-gray-900 dark:text-neutral-100">{task.attempts}</dd>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <dt className="text-xs text-neutral-500">Disparador</dt>
                      <dd className="mt-1 font-semibold text-gray-900 dark:text-neutral-100">{task.triggerStatus}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      onClick={() => retryTask(task)}
                      disabled={actionState !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      {isActing(task, "retry") ? "Reenviando..." : "Reenviar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => discardTask(task)}
                      disabled={actionState !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/25 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
                    >
                      <Trash2 size={16} />
                      {isActing(task, "discard") ? "Borrando..." : "Borrar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
