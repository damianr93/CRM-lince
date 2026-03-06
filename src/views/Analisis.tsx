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
import type { FollowUpEvent, YearlyComparisonPoint } from "@/store/analytics/analytics";
import {
  fetchAnalyticsTotales,
  fetchAnalyticsEvolution,
  fetchAnalyticsYearlyComparison,
  fetchAnalyticsComparisonSnapshot,
  fetchAnalyticsDemand,
  fetchpurchaseStatus,
  fetchFollowUpEvents,
  completeFollowUpEvent,
  fetchLocationSummary,
  type AnalyticsComparisonSnapshot,
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

function toSafeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function ClientsDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    loading,
    error,
    totales,
    byChannel,
    evolution,
    yearlyComparison,
    byProduct,
    statusPurchase,
    followUpEvents,
    locationSummary,
  } = useSelector((state: RootState) => state.analytics);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [comparisonMode, setComparisonMode] = useState<"none" | "compare">("none");
  const [compareYear, setCompareYear] = useState<number>(currentYear - 1);
  const comparisonEnabled = comparisonMode === "compare" && compareYear !== selectedYear;
  const [comparisonSnapshot, setComparisonSnapshot] = useState<AnalyticsComparisonSnapshot | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear, currentYear - 1]);
    const extractYearFromDate = (value?: string) => {
      if (!value) return;
      const match = String(value).match(/^(\d{4})/);
      if (!match) return;
      const year = Number(match[1]);
      if (!Number.isNaN(year)) years.add(year);
    };
    (evolution as TimePoint[]).forEach((point) => extractYearFromDate(point.date));
    (yearlyComparison as YearlyComparisonPoint[]).forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (key.startsWith("y")) {
          const year = Number(key.slice(1));
          if (!Number.isNaN(year)) years.add(year);
        }
      });
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear, evolution, yearlyComparison]);

  const selectedComparisonData = useMemo(() => {
    const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return (yearlyComparison as YearlyComparisonPoint[]).map((point, idx) => ({
      month: monthLabels[idx] ?? String(point.month),
      [`y${selectedYear}`]: Number(point[`y${selectedYear}`] ?? 0),
      [`y${compareYear}`]: Number(point[`y${compareYear}`] ?? 0),
    }));
  }, [yearlyComparison, selectedYear, compareYear]);
  const selectedYearEvolutionData = useMemo(() => {
    const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return (evolution as TimePoint[]).map((point, idx) => ({
      month: monthLabels[idx] ?? String(point.date),
      total: Number(point.total ?? 0),
    }));
  }, [evolution]);

  const [statusFilter, setStatusFilter] = useState<"READY" | "COMPLETED">("READY");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const totalContacts = totales?.totalContacts ?? 0;
  const totalReconsultas = totales?.totalReconsultas ?? 0;
  const firstTimeContacts = totales?.firstTimeContacts ?? Math.max(totalContacts - totalReconsultas, 0);
  const reconsultaRatio = totalContacts > 0 ? Math.round((totalReconsultas / totalContacts) * 100) : 0;

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

  // Filtrar productos inválidos (null, "-", "Sin dato", etc.) SOLO para el gráfico
  const filteredByProduct = useMemo(() => {
    if (!byProduct) return [];
    return (byProduct as ProductData[]).filter(
      (item) => {
        // Excluir si es null, undefined o vacío
        if (!item.product || item.product === null || item.product === undefined) {
          return false;
        }
        
        const productStr = String(item.product).trim();
        
        // Excluir valores inválidos
        return (
          productStr !== "" &&
          productStr !== "-" &&
          productStr !== "Sin dato" &&
          productStr.toLowerCase() !== "null" &&
          productStr.toLowerCase() !== "undefined"
        );
      }
    );
  }, [byProduct]);

  const comparisonByChannel = useMemo(() => {
    if (!comparisonSnapshot) return [];
    const selectedMap = new Map(
      (byChannel as ChannelData[]).map((item) => [item.channel, toSafeNumber(item.total)]),
    );
    const compareMap = new Map(
      (comparisonSnapshot.byChannel as ChannelData[]).map((item) => [item.channel, toSafeNumber(item.total)]),
    );
    const channels = Array.from(new Set([...selectedMap.keys(), ...compareMap.keys()]));
    return channels
      .map((channel) => {
        const selectedTotal = selectedMap.get(channel) ?? 0;
        const compareTotal = compareMap.get(channel) ?? 0;
        return { channel, selectedTotal, compareTotal, delta: selectedTotal - compareTotal };
      })
      .sort((a, b) => b.selectedTotal - a.selectedTotal);
  }, [byChannel, comparisonSnapshot]);

  const comparisonByProduct = useMemo(() => {
    if (!comparisonSnapshot) return [];
    const sanitize = (items: ProductData[]) =>
      items.filter((item) => {
        const v = String(item.product ?? "").trim().toLowerCase();
        return v && v !== "-" && v !== "sin dato" && v !== "null" && v !== "undefined";
      });
    const selectedMap = new Map(
      sanitize(filteredByProduct as ProductData[]).map((item) => [item.product, toSafeNumber(item.total)]),
    );
    const compareMap = new Map(
      sanitize(comparisonSnapshot.byProduct as ProductData[]).map((item) => [item.product, toSafeNumber(item.total)]),
    );
    const products = Array.from(new Set([...selectedMap.keys(), ...compareMap.keys()]));
    return products
      .map((product) => {
        const selectedTotal = selectedMap.get(product) ?? 0;
        const compareTotal = compareMap.get(product) ?? 0;
        return { product, selectedTotal, compareTotal, delta: selectedTotal - compareTotal };
      })
      .sort((a, b) => Math.max(b.selectedTotal, b.compareTotal) - Math.max(a.selectedTotal, a.compareTotal))
      .slice(0, 10);
  }, [filteredByProduct, comparisonSnapshot]);

  const comparisonStatusData = useMemo(() => {
    if (!comparisonSnapshot) return [];
    const selectedMap = new Map(
      (statusPurchase as StatusPoint[]).map((item) => [item.status, toSafeNumber(item.total)]),
    );
    const compareMap = new Map(
      comparisonSnapshot.statusPurchase.map((item) => [item.status, toSafeNumber(item.total)]),
    );
    const statuses = ["Compras", "No Compras", "Pendientes"];
    return statuses.map((status) => ({
      status,
      selectedTotal: selectedMap.get(status) ?? 0,
      compareTotal: compareMap.get(status) ?? 0,
    }));
  }, [statusPurchase, comparisonSnapshot]);

  useEffect(() => {
    if (compareYear === selectedYear) {
      const fallback = availableYears.find((year) => year !== selectedYear);
      if (fallback) {
        setCompareYear(fallback);
      }
    }
  }, [availableYears, selectedYear, compareYear]);

  useEffect(() => {
    dispatch(fetchAnalyticsTotales(selectedYear));
    dispatch(fetchAnalyticsEvolution(selectedYear));
    if (comparisonEnabled && compareYear !== selectedYear) {
      const yearsToCompare = Array.from(new Set([selectedYear, compareYear]));
      dispatch(fetchAnalyticsYearlyComparison(yearsToCompare));
    }
    dispatch(fetchAnalyticsDemand(selectedYear));
    dispatch(fetchpurchaseStatus(selectedYear));
    dispatch(fetchLocationSummary(selectedYear));
  }, [dispatch, selectedYear, compareYear, comparisonEnabled]);

  useEffect(() => {
    let cancelled = false;
    if (!comparisonEnabled) {
      setComparisonSnapshot(null);
      return () => {
        cancelled = true;
      };
    }
    dispatch(fetchAnalyticsComparisonSnapshot(compareYear)).then((result) => {
      if (!cancelled) {
        setComparisonSnapshot(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, comparisonEnabled, compareYear]);

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

  const locationCoverage = useMemo(() => {
    if (!locationSummary) {
      return { percent: 0, total: 0 };
    }
    const total = Math.max(locationSummary.total - locationSummary.noLocation.total, 0);
    const percent =
      locationSummary.total > 0
        ? Math.round((total / locationSummary.total) * 100)
        : 0;
    return { percent, total };
  }, [locationSummary]);
  const compareLocationCoverage = useMemo(() => {
    if (!comparisonSnapshot?.locationSummary) {
      return { percent: 0, total: 0 };
    }
    const total = Math.max(
      comparisonSnapshot.locationSummary.total - comparisonSnapshot.locationSummary.noLocation.total,
      0,
    );
    const percent =
      comparisonSnapshot.locationSummary.total > 0
        ? Math.round((total / comparisonSnapshot.locationSummary.total) * 100)
        : 0;
    return { percent, total };
  }, [comparisonSnapshot]);
  const formatDelta = (delta: number) => {
    if (delta === 0) return "0";
    return delta > 0 ? `+${delta}` : `${delta}`;
  };

  const comparisonChannelChartData = useMemo(() => {
    if (!comparisonEnabled) return [];
    if (comparisonByChannel.length > 0) return comparisonByChannel;
    return (byChannel as ChannelData[]).map((item) => ({
      channel: item.channel,
      selectedTotal: toSafeNumber(item.total),
      compareTotal: 0,
      delta: toSafeNumber(item.total),
    }));
  }, [comparisonEnabled, comparisonByChannel, byChannel]);

  const comparisonProductChartData = useMemo(() => {
    if (!comparisonEnabled) return [];
    if (comparisonByProduct.length > 0) return comparisonByProduct;
    return (filteredByProduct as ProductData[]).map((item) => ({
      product: item.product,
      selectedTotal: toSafeNumber(item.total),
      compareTotal: 0,
      delta: toSafeNumber(item.total),
    }));
  }, [comparisonEnabled, comparisonByProduct, filteredByProduct]);

  const normalizedComparisonChannelData = useMemo(
    () =>
      comparisonChannelChartData.map((item) => ({
        ...item,
        selectedTotal: toSafeNumber(item.selectedTotal),
        compareTotal: toSafeNumber(item.compareTotal),
      })),
    [comparisonChannelChartData],
  );

  const normalizedComparisonProductData = useMemo(
    () =>
      comparisonProductChartData.map((item) => ({
        ...item,
        selectedTotal: toSafeNumber(item.selectedTotal),
        compareTotal: toSafeNumber(item.compareTotal),
      })),
    [comparisonProductChartData],
  );
  const maxChannelComparisonValue = useMemo(() => {
    if (normalizedComparisonChannelData.length === 0) return 1;
    return Math.max(
      1,
      ...normalizedComparisonChannelData.flatMap((item) => [
        toSafeNumber(item.selectedTotal),
        toSafeNumber(item.compareTotal),
      ]),
    );
  }, [normalizedComparisonChannelData]);
  const maxProductComparisonValue = useMemo(() => {
    if (normalizedComparisonProductData.length === 0) return 1;
    return Math.max(
      1,
      ...normalizedComparisonProductData.flatMap((item) => [
        toSafeNumber(item.selectedTotal),
        toSafeNumber(item.compareTotal),
      ]),
    );
  }, [normalizedComparisonProductData]);
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
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Año</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-md border border-yellow-500/40 bg-gray-900/70 px-3 py-1 text-sm text-neutral-100 focus:border-yellow-300 focus:outline-none focus:ring-1 focus:ring-yellow-300"
              >
                {availableYears.map((year) => (
                  <option key={`selected-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Vista</span>
              <select
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value as "none" | "compare")}
                className="rounded-md border border-purple-500/40 bg-gray-900/70 px-3 py-1 text-sm text-neutral-100 focus:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
              >
                <option value="none">Solo año seleccionado</option>
                <option value="compare">Comparar con otro año</option>
              </select>
            </div>
            {comparisonMode === "compare" && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Comparar con</span>
                <select
                  value={compareYear}
                  onChange={(e) => setCompareYear(Number(e.target.value))}
                  className="rounded-md border border-purple-500/40 bg-gray-900/70 px-3 py-1 text-sm text-neutral-100 focus:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
                >
                  {availableYears.filter((year) => year !== selectedYear).map((year) => (
                    <option key={`compare-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-stretch">
          <Card className="w-full sm:w-auto bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col items-start sm:items-center">
              <span className="text-2xl font-bold text-yellow-400">
                {totalContacts}
              </span>
              <span className="text-sm text-neutral-400">Contactos totales</span>
              <span className="text-xs text-neutral-500 mt-1">
                Primer ingreso: {firstTimeContacts}
              </span>
              {comparisonEnabled && comparisonSnapshot && (
                <span className="text-xs text-cyan-300 mt-1">
                  {compareYear}: {comparisonSnapshot.totales.totalContacts} ({formatDelta(totalContacts - comparisonSnapshot.totales.totalContacts)})
                </span>
              )}
            </CardContent>
          </Card>
          <Card className="w-full sm:w-auto bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-400/30 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col items-start sm:items-center gap-1">
              <span className="text-xs uppercase tracking-[0.2em] text-amber-100">
                Reconsultas
              </span>
              <span className="text-2xl font-bold text-white">
                {totalReconsultas}
              </span>
              <span className="text-sm text-amber-100/80">
                {reconsultaRatio}% del total
              </span>
              {comparisonEnabled && comparisonSnapshot && (
                <span className="text-xs text-amber-100/70">
                  {compareYear}: {comparisonSnapshot.totales.totalReconsultas ?? 0} ({formatDelta(totalReconsultas - (comparisonSnapshot.totales.totalReconsultas ?? 0))})
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid de canales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {(comparisonEnabled ? normalizedComparisonChannelData : (byChannel as ChannelData[])).map((c: any) => (
          <Card
            key={c.channel ?? c?.channel}
            className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gold-400/10 backdrop-blur-sm"
          >
            <CardContent className="p-4 flex flex-col items-start">
              <span className="text-lg font-semibold text-neutral-200">
                {String(c.channel).charAt(0).toUpperCase() + String(c.channel).slice(1).toLowerCase()}
              </span>
              <span className="mt-1 text-2xl font-bold text-yellow-400">
                {comparisonEnabled ? c.selectedTotal : c.total}
              </span>
              <span className="text-xs text-neutral-400">Contactos</span>
              {comparisonEnabled && (
                <span className="text-xs text-cyan-300 mt-1">
                  {compareYear}: {c.compareTotal} ({formatDelta(c.delta)})
                </span>
              )}
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
            {comparisonEnabled ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {normalizedComparisonChannelData.map((item) => (
                  <div
                    key={item.channel}
                    className="rounded-lg border border-gray-600/40 bg-gray-900/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-neutral-100">{item.channel}</span>
                      <span className="text-xs text-neutral-400">
                        {selectedYear}: {item.selectedTotal} | {compareYear}: {item.compareTotal} | Δ {formatDelta(item.delta)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-2 rounded bg-gray-700/70 overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${(toSafeNumber(item.selectedTotal) / maxChannelComparisonValue) * 100}%` }}
                        />
                      </div>
                      <div className="h-2 rounded bg-gray-700/70 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400"
                          style={{ width: `${(toSafeNumber(item.compareTotal) / maxChannelComparisonValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* 2) Evolucion de Consultas */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              {comparisonEnabled
                ? `Evolucion de Consultas (${selectedYear} vs ${compareYear})`
                : `Evolucion de Consultas (${selectedYear})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={comparisonEnabled ? selectedComparisonData : selectedYearEvolutionData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="month"
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
                {comparisonEnabled ? (
                  <Line
                    type="monotone"
                    dataKey={`y${selectedYear}`}
                    name={String(selectedYear)}
                    stroke="#A44FFF"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    activeDot={{ r: 8, fill: "#FFD700" }}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="total"
                    name={String(selectedYear)}
                    stroke="#A44FFF"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    activeDot={{ r: 8, fill: "#FFD700" }}
                  />
                )}
                {comparisonEnabled && compareYear !== selectedYear && (
                  <Line
                    type="monotone"
                    dataKey={`y${compareYear}`}
                    name={String(compareYear)}
                    stroke="#22D3EE"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7, fill: "#22D3EE" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3) Productos mas Consultados */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              {comparisonEnabled
                ? `Productos mas Consultados (${selectedYear} vs ${compareYear})`
                : "Productos mas Consultados"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {comparisonEnabled ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {normalizedComparisonProductData.map((item) => (
                  <div
                    key={item.product}
                    className="rounded-lg border border-gray-600/40 bg-gray-900/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-neutral-100 truncate max-w-[60%]">
                        {item.product}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {selectedYear}: {item.selectedTotal} | {compareYear}: {item.compareTotal} | Δ {formatDelta(item.delta)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-2 rounded bg-gray-700/70 overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${(toSafeNumber(item.selectedTotal) / maxProductComparisonValue) * 100}%` }}
                        />
                      </div>
                      <div className="h-2 rounded bg-gray-700/70 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400"
                          style={{ width: `${(toSafeNumber(item.compareTotal) / maxProductComparisonValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  layout="vertical"
                  data={filteredByProduct}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
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
                    fontSize={10}
                    width={120}
                    tick={{ fill: "#D1D5DB" }}
                    axisLine={{ stroke: "#6B7280" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {filteredByProduct.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 4) Estado de Compras */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              {comparisonEnabled
                ? `Estado de Compras (${selectedYear} vs ${compareYear})`
                : "Estado de Compras"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              {comparisonEnabled ? (
                <BarChart data={comparisonStatusData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="status" stroke="#D1D5DB" fontSize={12} tick={{ fill: "#D1D5DB" }} />
                  <YAxis stroke="#D1D5DB" fontSize={12} tick={{ fill: "#D1D5DB" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="selectedTotal" name={String(selectedYear)} fill="#FFD700" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="compareTotal" name={String(compareYear)} fill="#22D3EE" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
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
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {locationSummary && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm">
            <CardHeader className="border-b border-gold-400/20 pb-4">
              <CardTitle className="text-xl font-bold text-yellow-400">
                Panorama de Ubicaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">
                    Cobertura de ubicación
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {locationCoverage.percent}%
                  </p>
                  <p className="text-xs text-emerald-100/80">
                    {locationCoverage.total} clientes ubicados
                  </p>
                  {comparisonEnabled && comparisonSnapshot?.locationSummary && (
                    <p className="text-xs text-cyan-200 mt-1">
                      {compareYear}: {compareLocationCoverage.percent}% ({formatDelta(locationCoverage.percent - compareLocationCoverage.percent)} pts)
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-600/30 bg-gray-800/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Top provincias</p>
                  <div className="mt-2 space-y-1 text-sm text-neutral-200">
                    {locationSummary.topProvinces.slice(0, 6).map((item) => (
                      <div key={item.name} className="flex justify-between gap-2">
                        <span>{item.name}</span>
                        {comparisonEnabled && comparisonSnapshot?.locationSummary ? (
                          <span className="text-neutral-400">
                            {item.total} / {
                              comparisonSnapshot.locationSummary.topProvinces.find((p) => p.name === item.name)?.total ?? 0
                            }
                          </span>
                        ) : (
                          <span className="text-neutral-400">{item.total}</span>
                        )}
                      </div>
                    ))}
                    {locationSummary.topProvinces.length === 0 && (
                      <span className="text-xs text-neutral-500">Sin datos suficientes</span>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-600/30 bg-gray-800/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Top localidades</p>
                  <div className="mt-2 space-y-1 text-sm text-neutral-200">
                    {locationSummary.topLocalities.slice(0, 6).map((item) => (
                      <div key={`${item.name}-${item.province}`} className="flex justify-between gap-2">
                        <span>{item.name}</span>
                        {comparisonEnabled && comparisonSnapshot?.locationSummary ? (
                          <span className="text-neutral-400">
                            {item.total} / {
                              comparisonSnapshot.locationSummary.topLocalities.find((l) => l.name === item.name && l.province === item.province)?.total ?? 0
                            }
                          </span>
                        ) : (
                          <span className="text-neutral-400">{item.total}</span>
                        )}
                      </div>
                    ))}
                    {locationSummary.topLocalities.length === 0 && (
                      <span className="text-xs text-neutral-500">Sin datos suficientes</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
