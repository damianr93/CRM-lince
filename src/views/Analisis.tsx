import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AppDispatch, RootState } from "@/store/sotre";
import type { FollowUpEvent } from "@/store/analytics/analytics";
import {
  fetchAnalyticsTotales,
  fetchAnalyticsEvolution,
  fetchAnalyticsDemand,
  fetchpurchaseStatus,
  fetchFollowUpEvents,
  completeFollowUpEvent,
} from "@/store/analytics/thunks";

const COLORS = ["#FFD700", "#A44FFF", "#E10600", "#7E00FF", "#F59E0B"];

interface ChannelData { channel: string; total: number; }
interface TimePoint { date: string; total: number; }
interface ProductData { product: string; total: number; }
interface StatusPoint { status: string; total: number; percentage: number; }

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gold-400/30 rounded-lg p-3 shadow-2xl text-white">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm">
            <span className="font-medium">{entry.name}: </span>
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};



const formatDateTime = (isoDate: string) => {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDate));
  } catch (error) {
    return isoDate;
  }
};

export default function ClientsDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    loading,
    error,
    totales,
    byChannel,
    evolution,
    byProduct,
    statusPurchase,
    followUpEvents,
  } = useSelector((state: RootState) => state.analytics);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"READY" | "COMPLETED">("READY");
  const [completingId, setCompletingId] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: "READY" as const, label: "Pendientes" },
      { value: "COMPLETED" as const, label: "Realizados" },
    ],
    [],
  );

  const filteredEvents = useMemo(
    () =>
      (followUpEvents as FollowUpEvent[]).filter((event) =>
        statusFilter === "READY" ? event.status === "READY" : event.status === "COMPLETED",
      ),
    [followUpEvents, statusFilter],
  );

  const assigneeOptions = useMemo(() => {
    const defaults = ["ALL", "EZEQUIEL", "DENIS", "MARTIN", "SIN_ASIGNAR"];
    const dynamic = (followUpEvents as FollowUpEvent[]).map((event) =>
      event.assignedTo ? event.assignedTo.toUpperCase() : "SIN_ASIGNAR",
    );
    return Array.from(new Set([...defaults, ...dynamic]));
  }, [followUpEvents]);

  const statusLabel = useMemo(
    () => statusOptions.find((option) => option.value === statusFilter)?.label ?? "Pendientes",
    [statusOptions, statusFilter],
  );

  useEffect(() => {
    dispatch(fetchAnalyticsTotales());
    dispatch(fetchAnalyticsEvolution());
    dispatch(fetchAnalyticsDemand());
    dispatch(fetchpurchaseStatus());
  }, [dispatch]);

  useEffect(() => {
    const normalizedAssignee = assigneeFilter.toUpperCase();
    dispatch(
      fetchFollowUpEvents(
        normalizedAssignee === "ALL" ? undefined : normalizedAssignee,
        statusFilter,
      ),
    );
  }, [dispatch, assigneeFilter, statusFilter]);

  const handleAssigneeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAssigneeFilter(event.target.value.toUpperCase());
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value as "READY" | "COMPLETED");
  };

  const handleComplete = async (eventId: string) => {
    try {
      setCompletingId(eventId);
      const normalized = assigneeFilter.toUpperCase();
      await dispatch(
        completeFollowUpEvent(
          eventId,
          normalized === "ALL" ? undefined : normalized,
          statusFilter,
        ),
      );
    } catch (error) {
      // El error ya se guarda en el estado global
    } finally {
      setCompletingId(null);
    }
  };


  const formatAssigneeLabel = (value: string): string => {
    if (!value) {
      return "Sin asignar";
    }
    const upper = value.toUpperCase();
    if (upper === "ALL") {
      return "Todos";
    }
    return upper
      .split("_")
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" ")
      .trim();
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400">Cargando datos...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-red-600">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="mt-10 min-h-screen p-4 md:p-8 space-y-8">
      {/* Header + total contactos */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">
            CRM  Visin General
          </h1>
          <p className="text-neutral-300 text-lg">
            Contactos, canales de adquisicion y productos consultados
          </p>
        </div>
        <Card className="w-full sm:w-auto bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col items-start sm:items-center">
            <span className="text-2xl font-bold text-yellow-400">
              {totales}
            </span>
            <span className="text-sm text-neutral-400">Contactos totales</span>
          </CardContent>
        </Card>
      </div>

      {/* Grid de canales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {byChannel.map((c: ChannelData) => (
          <Card
            key={c.channel}
            className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gold-400/10 backdrop-blur-sm"
          >
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-lg font-semibold text-neutral-200">
                {c.channel.charAt(0).toUpperCase() + c.channel.slice(1).toLowerCase()}
              </span>
              <span className="mt-1 text-2xl font-bold text-yellow-400">
                {c.total}
              </span>
              <span className="text-xs text-neutral-400">Contactos</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Las cuatro graficas principales */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1) Adquisicion por Canal */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              Adquisicion por Canal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={byChannel as ChannelData[]}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="channel"
                  stroke="#D1D5DB"
                  fontSize={12}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <YAxis
                  stroke="#D1D5DB"
                  fontSize={12}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {(byChannel as ChannelData[]).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2) Evolucion de Consultas */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              Evolucion de Consultas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={evolution as TimePoint[]}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#D1D5DB"
                  fontSize={12}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <YAxis
                  stroke="#D1D5DB"
                  fontSize={12}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#A44FFF"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8, fill: "#FFD700" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3) Productos mas Consultados */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              Productos mas Consultados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={byProduct as ProductData[]}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  type="number"
                  stroke="#D1D5DB"
                  fontSize={12}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <YAxis
                  type="category"
                  dataKey="product"
                  stroke="#D1D5DB"
                  fontSize={12}
                  tick={{ fill: "#D1D5DB" }}
                  axisLine={{ stroke: "#6B7280" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {(byProduct as ProductData[]).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4) Estado de Compras */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              Estado de Compras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusPurchase as StatusPoint[]}
                  dataKey="percentage"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name}: ${Math.round(percent * 100)}%`
                  }
                >
                  {(statusPurchase as StatusPoint[]).map((_, idx) => (
                    <Cell key={`slice-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-md">
        <CardHeader className="border-b border-gold-400/20 pb-4">
          <CardTitle className="text-xl font-bold text-yellow-400 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-300 ring-2 ring-yellow-500/40">
                SMS
              </span>
              <div className="flex flex-col">
                <span>Eventos de Seguimiento Manual</span>
                <span className="text-sm font-normal text-neutral-400">
                  {statusFilter === "READY"
                    ? "Seguimientos listos para que el vendedor contacte al cliente."
                    : "Seguimientos ya realizados disponibles como referencia rapida."}
                </span>
              </div>
            </div>
            <div className="flex flex-col md:items-end">
              <span className="text-xs uppercase tracking-widest text-neutral-500">
                {statusLabel}
              </span>
              <span className="text-3xl font-semibold text-yellow-300">
                {filteredEvents.length}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-gold-400/10 bg-gray-900/60 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-neutral-300 md:max-w-2xl">
              El envio automatico esta pausado. Cuando un estado active un seguimiento, se envia un correo a la persona responsable y el evento queda disponible en esta lista.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-widest text-neutral-400">
                  Responsable
                </span>
                <select
                  value={assigneeFilter}
                  onChange={handleAssigneeChange}
                  className="rounded-md border border-yellow-500/40 bg-gray-900/70 px-3 py-1 text-sm text-neutral-100 focus:border-yellow-300 focus:outline-none focus:ring-1 focus:ring-yellow-300"
                >
                  {assigneeOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatAssigneeLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-widest text-neutral-400">
                  Mostrar
                </span>
                <select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  className="rounded-md border border-yellow-500/40 bg-gray-900/70 px-3 py-1 text-sm text-neutral-100 focus:border-yellow-300 focus:outline-none focus:ring-1 focus:ring-yellow-300"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-neutral-400 text-sm">
              {statusFilter === "READY"
                ? "No hay eventos listos para ejecutar. Los cambios de estado apareceran aqui cuando llegue su horario de seguimiento."
                : "No hay eventos realizados dentro de este filtro."}
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto px-6 py-6 pr-4 scrollbar-thin scrollbar-thumb-yellow-500/40 scrollbar-track-transparent space-y-4">
              {filteredEvents.map((event) => {
                const fullName = [event.customerName, event.customerLastName]
                  .filter(Boolean)
                  .join(" ") || "Cliente sin nombre";
                const phoneNumber = event.customerPhone ??
                  (typeof event.contactValue === "string" && !event.contactValue.includes("@")
                    ? event.contactValue
                    : null);
                const isCompleting = completingId === event.id;
                const isCompletedView = statusFilter === "COMPLETED";
                const completedAtDisplay =
                  isCompletedView && event.completedAt ? formatDateTime(event.completedAt) : null;

                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-yellow-500/30 bg-gray-900/80 p-4 shadow-lg shadow-yellow-500/5 transition hover:border-yellow-400/60 hover:shadow-yellow-500/20"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                          Programado
                        </p>
                        <p className="text-sm font-semibold text-yellow-200">
                          {formatDateTime(event.scheduledFor)}
                        </p>
                        {completedAtDisplay ? (
                          <p className="text-xs text-neutral-400 mt-1">
                            Realizado el {completedAtDisplay}
                          </p>
                        ) : null}
                      </div>
                      {statusFilter === "READY" ? (
                        <button
                          type="button"
                          onClick={() => handleComplete(event.id)}
                          disabled={isCompleting}
                          className="inline-flex items-center gap-2 rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCompleting ? "Marcando..." : "Marcar como realizado"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          Realizado
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                          Cliente
                        </p>
                        <p className="text-sm text-neutral-100 break-words">
                          {fullName}
                        </p>
                        {phoneNumber ? (
                          <p className="text-xs text-neutral-400 mt-1">Tel: {phoneNumber}</p>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                          Producto
                        </p>
                        <p className="text-sm text-neutral-200 break-words">
                          {event.product ?? "Sin especificar"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-white/5 bg-gray-950/60 p-4">
                      <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                        Mensaje sugerido
                      </p>
                      <p className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed">
                        {event.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}





