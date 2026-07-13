import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, RefreshCw } from "lucide-react";
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
  SATISFACTION_14D: "Satisfacción 14 días",
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

export default function FollowUpsView() {
  const [tasks, setTasks] = useState<FailedFollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const failedCount = useMemo(() => tasks.length, [tasks]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/follow-up/tasks/failed`);

      if (!response.ok) {
        throw new Error("No se pudieron cargar los seguimientos pendientes de revisión.");
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

  const retryTask = async (task: FailedFollowUpTask) => {
    const name = customerName(task);
    const template = templateLabels[task.templateId] ?? task.templateId;
    const confirmed = window.confirm(`¿Reenviar ahora el seguimiento "${template}" para ${name}?`);

    if (!confirmed) {
      return;
    }

    setRetryingId(task.id);
    setError(null);

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/follow-up/tasks/${task.id}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No se pudo reenviar el seguimiento.");
      }

      setTasks((current) => current.filter((currentTask) => currentTask.id !== task.id));
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el seguimiento.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-500">Seguimientos automáticos</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Seguimientos</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Revisá mensajes fallidos u omitidos y reenviálos para que vuelvan a salir ahora.
            </p>
          </div>
          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-yellow-300"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Pendientes de revisión</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-neutral-100">{failedCount}</p>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-neutral-500">
            Cargando seguimientos...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">No hay seguimientos pendientes</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Cuando un envío falle u omita un contacto, va a aparecer acá.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Asesor</th>
                    <th className="px-4 py-3">Plantilla</th>
                    <th className="px-4 py-3">Estado tarea</th>
                    <th className="px-4 py-3">Estado evento</th>
                    <th className="px-4 py-3">Intentos</th>
                    <th className="px-4 py-3">Procesado</th>
                    <th className="px-4 py-3">Error</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-neutral-100">{customerName(task)}</div>
                        <div className="text-xs text-neutral-500">{task.product || "Sin producto"}</div>
                      </td>
                      <td className="px-4 py-3">{task.assignedTo || "Sin asignar"}</td>
                      <td className="px-4 py-3">{templateLabels[task.templateId] ?? task.templateId}</td>
                      <td className="px-4 py-3">{statusLabels[task.status] ?? task.status}</td>
                      <td className="px-4 py-3">{statusLabels[task.eventStatus ?? ""] ?? task.eventStatus ?? "—"}</td>
                      <td className="px-4 py-3">{task.attempts}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(task.processedAt)}</td>
                      <td className="max-w-xs px-4 py-3 text-red-600 dark:text-red-300 truncate" title={task.error}>
                        {task.error || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => retryTask(task)}
                          disabled={retryingId === task.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-gray-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RotateCcw size={14} />
                          {retryingId === task.id ? "Reenviando..." : "Reenviar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 lg:hidden">
              {tasks.map((task) => (
                <article key={task.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-neutral-100">{customerName(task)}</h2>
                      <p className="text-sm text-neutral-500">{task.product || "Sin producto"}</p>
                    </div>
                    <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-300">
                      {task.attempts} intentos
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm">
                    <div><dt className="text-xs text-neutral-500">Asesor</dt><dd>{task.assignedTo || "Sin asignar"}</dd></div>
                    <div><dt className="text-xs text-neutral-500">Plantilla</dt><dd>{templateLabels[task.templateId] ?? task.templateId}</dd></div>
                    <div><dt className="text-xs text-neutral-500">Estado tarea</dt><dd>{statusLabels[task.status] ?? task.status}</dd></div>
                    <div><dt className="text-xs text-neutral-500">Procesado</dt><dd>{formatDate(task.processedAt)}</dd></div>
                    <div><dt className="text-xs text-neutral-500">Error</dt><dd className="text-red-600 dark:text-red-300">{task.error || "—"}</dd></div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => retryTask(task)}
                    disabled={retryingId === task.id}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw size={15} />
                    {retryingId === task.id ? "Reenviando..." : "Reenviar"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
