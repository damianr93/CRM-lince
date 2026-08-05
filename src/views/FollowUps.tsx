import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { apiFetch } from "@/utils/auth";

interface FollowUpTask {
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
type FollowUpTab = "problems" | "scheduled" | "sent";

interface ActionState {
  id: string;
  type: FollowUpAction;
}

const statusLabels: Record<string, string> = {
  FAILED: "Fallido",
  SKIPPED: "Omitido",
  PENDING: "Programado",
  PROCESSING: "Enviando",
  SENT: "Enviado",
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

const tabConfig: { id: FollowUpTab; label: string; endpoint: string }[] = [
  { id: "problems", label: "Con problemas", endpoint: "failed" },
  { id: "scheduled", label: "Programados", endpoint: "scheduled" },
  { id: "sent", label: "Enviados", endpoint: "sent" },
];

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

function customerName(task: FollowUpTask) {
  return [task.customerName, task.customerLastName].filter(Boolean).join(" ").trim() || "Cliente sin nombre";
}

function getTemplateLabel(task: FollowUpTask) {
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
  const toneClass =
    normalized === "FAILED"
      ? "bg-red-500/10 text-red-700 dark:text-red-300"
      : normalized === "SKIPPED"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : normalized === "SENT" || normalized === "COMPLETED"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : normalized === "PENDING" || normalized === "SCHEDULED" || normalized === "PROCESSING"
            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
            : "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {statusLabels[normalized] ?? normalized}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "green" | "sky";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClass = {
    red: "from-red-500/15 to-red-500/5 text-red-700 dark:text-red-300",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300",
    green: "from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    sky: "from-sky-500/15 to-sky-500/5 text-sky-700 dark:text-sky-300",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        `rounded-2xl border bg-gradient-to-br ${toneClass} p-4 text-left shadow-sm transition`,
        active ? "border-yellow-400 ring-2 ring-yellow-400/40" : "border-border hover:border-yellow-400/40",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-neutral-100">{value}</p>
    </button>
  );
}

function EmptyState({ tab }: { tab: FollowUpTab }) {
  const copy = {
    problems: {
      title: "No hay nada para revisar",
      body: "Cuando falle un envío automático, va a aparecer acá con su acción de reenvío.",
    },
    scheduled: {
      title: "No hay seguimientos programados",
      body: "Los mensajes pendientes de envío van a listarse acá con la fecha y hora previstas.",
    },
    sent: {
      title: "No hay envíos exitosos recientes",
      body: "Los seguimientos enviados correctamente van a aparecer acá con la fecha de envío.",
    },
  }[tab];

  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={34} />
      <h2 className="text-lg font-semibold text-gray-950 dark:text-neutral-50">{copy.title}</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{copy.body}</p>
    </div>
  );
}

export default function FollowUpsView() {
  const [activeTab, setActiveTab] = useState<FollowUpTab>("problems");
  const [tasksByTab, setTasksByTab] = useState<Record<FollowUpTab, FollowUpTask[]>>({
    problems: [],
    scheduled: [],
    sent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState | null>(null);

  const tasks = tasksByTab[activeTab];

  const summary = useMemo(
    () => ({
      problems: tasksByTab.problems.length,
      scheduled: tasksByTab.scheduled.length,
      sent: tasksByTab.sent.length,
    }),
    [tasksByTab],
  );

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        tabConfig.map(async (tab) => {
          const response = await apiFetch(`${import.meta.env.VITE_API_URL}/follow-up/tasks/${tab.endpoint}`);
          if (!response.ok) {
            throw new Error(await readErrorMessage(response, `No se pudieron cargar los seguimientos (${tab.label}).`));
          }
          const data = (await response.json()) as FollowUpTask[];
          return [tab.id, data] as const;
        }),
      );

      setTasksByTab(Object.fromEntries(results) as Record<FollowUpTab, FollowUpTask[]>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const removeFromProblems = (taskId: string) => {
    setTasksByTab((current) => ({
      ...current,
      problems: current.problems.filter((task) => task.id !== taskId),
    }));
  };

  const retryTask = async (task: FollowUpTask) => {
    const name = customerName(task);
    const template = getTemplateLabel(task);
    const confirmed = window.confirm(
      `¿Reenviar ahora "${template}" para ${name}?\n\nEsto vuelve a poner el mensaje en cola para envío automático.`,
    );

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

      removeFromProblems(task.id);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el seguimiento.");
    } finally {
      setActionState(null);
    }
  };

  const discardTask = async (task: FollowUpTask) => {
    const name = customerName(task);
    const confirmed = window.confirm(
      `¿Borrar este seguimiento de la bandeja?\n\nCliente: ${name}\n\nNo se enviará automáticamente y quedará cancelado para auditoría.`,
    );

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

      removeFromProblems(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar el seguimiento.");
    } finally {
      setActionState(null);
    }
  };

  const isActing = (task: FollowUpTask, type: FollowUpAction) =>
    actionState?.id === task.id && actionState.type === type;

  const headerCopy = {
    problems: {
      badge: "Bandeja operativa",
      title: "Seguimientos",
      body: "Revisá fallidos y omitidos, mirá qué está programado y confirmá los envíos exitosos.",
    },
    scheduled: {
      badge: "Cola de envío",
      title: "Programados",
      body: "Mensajes automáticos pendientes. La fecha indica cuándo se van a enviar.",
    },
    sent: {
      badge: "Historial reciente",
      title: "Enviados exitosos",
      body: "Seguimientos que ya salieron correctamente, con la fecha y hora de envío.",
    },
  }[activeTab];

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-yellow-400/20 via-yellow-400/10 to-transparent p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                  {activeTab === "problems" ? (
                    <AlertTriangle size={14} />
                  ) : activeTab === "scheduled" ? (
                    <Clock3 size={14} />
                  ) : (
                    <Send size={14} />
                  )}{" "}
                  {headerCopy.badge}
                </div>
                <h1 className="mt-4 text-3xl font-bold text-gray-950 dark:text-neutral-50">{headerCopy.title}</h1>
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">{headerCopy.body}</p>
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
          <StatCard
            label="Con problemas"
            value={summary.problems}
            tone="red"
            active={activeTab === "problems"}
            onClick={() => setActiveTab("problems")}
          />
          <StatCard
            label="Programados"
            value={summary.scheduled}
            tone="sky"
            active={activeTab === "scheduled"}
            onClick={() => setActiveTab("scheduled")}
          />
          <StatCard
            label="Enviados"
            value={summary.sent}
            tone="green"
            active={activeTab === "sent"}
            onClick={() => setActiveTab("sent")}
          />
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
          <EmptyState tab={activeTab} />
        ) : (
          <section className="grid gap-4">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-yellow-400/30 hover:shadow-md md:p-5"
              >
                <div
                  className={[
                    "grid gap-4 lg:items-center",
                    activeTab === "problems" ? "lg:grid-cols-[1.4fr_1fr_auto]" : "lg:grid-cols-[1.4fr_1fr]",
                  ].join(" ")}
                >
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      {task.eventStatus && <StatusBadge status={task.eventStatus} />}
                      <span className="inline-flex items-center rounded-full bg-neutral-500/10 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        {getTemplateLabel(task)}
                      </span>
                    </div>

                    <div>
                      <h2 className="truncate text-lg font-bold text-gray-950 dark:text-neutral-50">
                        {customerName(task)}
                      </h2>
                      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {task.product || "Sin producto asociado"}
                      </p>
                    </div>

                    {activeTab === "problems" && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">
                        <p className="break-words" title={task.error}>
                          {task.error || "Sin detalle de error"}
                        </p>
                      </div>
                    )}

                    {activeTab === "scheduled" && (
                      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-sm text-sky-800 dark:text-sky-200">
                        <p className="font-semibold">Se envía el {formatDate(task.executeAt)}</p>
                      </div>
                    )}

                    {activeTab === "sent" && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                        <p className="font-semibold">Enviado el {formatDate(task.processedAt ?? task.executeAt)}</p>
                      </div>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-2">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <UserRound size={13} /> Asesor
                      </dt>
                      <dd className="mt-1 font-semibold text-gray-900 dark:text-neutral-100">
                        {task.assignedTo || "Sin asignar"}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Clock3 size={13} />
                        {activeTab === "scheduled" ? "Programado para" : activeTab === "sent" ? "Enviado" : "Procesado"}
                      </dt>
                      <dd className="mt-1 font-semibold text-gray-900 dark:text-neutral-100">
                        {formatDate(
                          activeTab === "scheduled"
                            ? task.executeAt
                            : activeTab === "sent"
                              ? task.processedAt ?? task.executeAt
                              : task.processedAt,
                        )}
                      </dd>
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

                  {activeTab === "problems" && (
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
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
