import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/sotre";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { Satisfaction } from "@/store/satisfaction/satisfaction";
import { getSatisfactionsThunk } from "@/store/satisfaction/thunks";

const COLORS = ["#FFD700","#A44FFF","#E10600","#7E00FF","#F59E0B","#34D399","#60A5FA","#F472B6","#FBBF24"];

// ── Labels legibles ──────────────────────────────────────────────────
const CONOCIO_LABEL: Record<string, string> = {
  VISITA_VENDEDOR: "Visita vendedor",
  RECOMENDACION_COLEGA: "Recomendación colega",
  RECOMENDACION_ASESOR: "Recomendación asesor",
  VENDEDOR: "Vendedor",
  WEB: "Web",
  EXPOSICIONES: "Exposiciones",
  REDES_SOCIALES: "Redes sociales",
  OTRO: "Otro",
};
const RECO_LABEL: Record<string, string> = { SI: "Sí", NO: "No", MAYBE: "Tal vez" };
const INCONVENIENTES_LABEL: Record<string, string> = {
  EXCELENTE: "Excelente", BUENA: "Buena", MALA: "Mala", N_A: "N/A",
};
const VALORACION_LABEL: Record<string, string> = {
  CALIDAD: "Calidad",
  TIEMPO_ENTREGA: "Tiempo entrega",
  ATENCION: "Atención",
  RESOLUCION_INCONVENIENTES: "Resolución inc.",
  SIN_VALORACION: "Sin valoración",
};

// ── Chips de color por valor numérico (escala 1-10) ──────────────────
function ScoreChip({ value }: { value?: number }) {
  if (value == null) return <span className="text-neutral-500">—</span>;
  const color =
    value >= 8 ? "bg-green-500/20 text-green-400 ring-green-500/30"
    : value >= 5 ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30"
    : "bg-red-500/20 text-red-400 ring-red-500/30";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-7 rounded-md text-xs font-bold ring-1 ${color}`}>
      {value}
    </span>
  );
}

function RecoBadge({ value }: { value?: string }) {
  if (!value) return <span className="text-neutral-500">—</span>;
  const styles: Record<string, string> = {
    SI: "bg-green-500/20 text-green-400 ring-green-500/30",
    NO: "bg-red-500/20 text-red-400 ring-red-500/30",
    MAYBE: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${styles[value] ?? "bg-gray-500/20 text-gray-400"}`}>
      {RECO_LABEL[value] ?? value}
    </span>
  );
}

function SourceBadge({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${
      value === "FLOW"
        ? "bg-purple-500/20 text-purple-400 ring-purple-500/30"
        : "bg-blue-500/20 text-blue-400 ring-blue-500/30"
    }`}>
      {value}
    </span>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────
function groupBy<T>(arr: T[], keyFn: (x: T) => string) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item as any);
    return acc;
  }, {} as Record<string, T[]>);
}
function avg(nums: (number | undefined)[]) {
  const vals = nums.filter((n): n is number => typeof n === "number");
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function pctFrom10(n: number) {
  return n ? Math.round((n / 10) * 100) : 0;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-2xl">
      {label && <p className="font-medium text-sm mb-1">{label}</p>}
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-sm"><span className="font-medium">{e.name}: </span>{e.value}</p>
      ))}
    </div>
  );
};

// ── Fila expandible ───────────────────────────────────────────────────
function SatisfactionRow({ r }: { r: Satisfaction }) {
  const [open, setOpen] = useState(false);

  const hasFlowFields = r.relacionPrecioCalidad != null || r.atencionComercial != null || r.nps != null;

  return (
    <>
      <tr
        className="border-t border-border hover:bg-muted/40 cursor-pointer transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Nombre / tel */}
        <td className="px-3 py-2.5">
          <div className="font-medium text-sm text-foreground">{r.name || <span className="text-neutral-500">—</span>}</div>
          <div className="text-xs text-neutral-500">{r.phone || ""}</div>
        </td>
        {/* Producto */}
        <td className="px-3 py-2.5 text-sm">{r.product || <span className="text-neutral-500">—</span>}</td>
        {/* Cómo nos conoció */}
        <td className="px-3 py-2.5 text-sm text-neutral-300">
          {r.comoNosConocio ? CONOCIO_LABEL[r.comoNosConocio] ?? r.comoNosConocio : <span className="text-neutral-500">—</span>}
        </td>
        {/* Calidad */}
        <td className="px-3 py-2.5"><ScoreChip value={r.calidad} /></td>
        {/* NPS */}
        <td className="px-3 py-2.5"><ScoreChip value={r.nps} /></td>
        {/* Recomienda */}
        <td className="px-3 py-2.5"><RecoBadge value={r.recomendacion} /></td>
        {/* Fuente */}
        <td className="px-3 py-2.5"><SourceBadge value={r.source} /></td>
        {/* Fecha */}
        <td className="px-3 py-2.5 text-xs text-neutral-400 whitespace-nowrap">
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-AR") : "—"}
        </td>
        {/* Expand */}
        <td className="px-3 py-2.5 text-neutral-500 text-xs select-none">
          {open ? "▲" : "▼"}
        </td>
      </tr>

      {open && (
        <tr className="border-t border-yellow-400/10 bg-muted/20">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">

              {hasFlowFields && (
                <>
                  <Detail label="Relación precio/calidad"><ScoreChip value={r.relacionPrecioCalidad} /></Detail>
                  <Detail label="Atención comercial"><ScoreChip value={r.atencionComercial} /></Detail>
                  <Detail label="Atención administración"><ScoreChip value={r.atencionAdmin} /></Detail>
                  <Detail label="Tiempo entrega"><ScoreChip value={r.tiempoForme} /></Detail>
                </>
              )}

              {!hasFlowFields && r.tiempoForme != null && (
                <Detail label="Tiempo y forma"><ScoreChip value={r.tiempoForme} /></Detail>
              )}
              {!hasFlowFields && r.atencion != null && (
                <Detail label="Atención"><ScoreChip value={r.atencion} /></Detail>
              )}

              {r.anteInconvenientes && (
                <Detail label="Ante inconvenientes">
                  <span className="text-neutral-200">{INCONVENIENTES_LABEL[r.anteInconvenientes] ?? r.anteInconvenientes}</span>
                </Detail>
              )}

              {r.valoracion && (
                <Detail label="Lo que más valora">
                  <span className="text-neutral-200">{VALORACION_LABEL[r.valoracion] ?? r.valoracion}</span>
                </Detail>
              )}

              {r.porQueNosCompra && (
                <Detail label="Por qué nos compra" wide>
                  <span className="text-neutral-200">{r.porQueNosCompra}</span>
                </Detail>
              )}

              {r.comentarios && (
                <Detail label="Comentarios" wide>
                  <span className="text-neutral-200">{r.comentarios}</span>
                </Detail>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────
export default function SatisfactionDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((s: RootState) => s.satisfaction);

  useEffect(() => { dispatch(getSatisfactionsThunk()); }, [dispatch]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? items.filter((it) =>
          [it.name, it.product, it.phone, it.comoNosConocio ? CONOCIO_LABEL[it.comoNosConocio] : "", it.comentarios, it.porQueNosCompra]
            .filter(Boolean).join(" ").toLowerCase().includes(q)
        )
      : items.slice();
    return base.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // KPIs
  const avgCalidad = useMemo(() => avg(items.map((r) => r.calidad)), [items]);
  const avgNPS = useMemo(() => avg(items.map((r) => r.nps)), [items]);
  const avgAtencion = useMemo(() => avg(items.map((r) => r.atencionComercial ?? r.atencion)), [items]);

  const total = items.length;
  const recoSI = items.filter((x) => x.recomendacion === "SI").length;
  const recoNO = items.filter((x) => x.recomendacion === "NO").length;
  const recoMAYBE = items.filter((x) => x.recomendacion === "MAYBE").length;
  const pctRecoSI = total ? Math.round((recoSI / total) * 100) : 0;

  const qualityByProduct = useMemo(() => {
    const valid = items.filter((i) => i.product && i.product.trim() && !["null","undefined","-"].includes(i.product.toLowerCase()));
    const byProd = groupBy(valid, (x) => x.product!);
    return Object.entries(byProd)
      .map(([product, arr]) => ({ product, calidad: Number(avg(arr.map((r: Satisfaction) => r.calidad)).toFixed(1)) }))
      .sort((a, b) => b.calidad - a.calidad);
  }, [items]);

  const inconvenientesDist = useMemo(() => {
    const by = groupBy(items.filter((x) => x.anteInconvenientes), (x) => x.anteInconvenientes!);
    return Object.entries(by).map(([k, arr]) => ({ label: INCONVENIENTES_LABEL[k] ?? k, total: arr.length }));
  }, [items]);

  const recoPieData = [
    { name: "Sí", value: recoSI },
    { name: "No", value: recoNO },
    { name: "Tal vez", value: recoMAYBE },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="text-gray-400">Cargando...</span></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><span className="text-red-600">Error: {error}</span></div>;

  return (
    <div className="mt-10 min-h-screen bg-background p-4 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-yellow-400">Satisfacción</h1>
          <p className="text-gray-600 dark:text-neutral-400 text-sm mt-1">{total} encuesta{total !== 1 ? "s" : ""} registrada{total !== 1 ? "s" : ""}</p>
        </div>

        {/* KPI chips */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Calidad", value: pctFrom10(avgCalidad) },
            { label: "NPS promedio", value: avgNPS ? avgNPS.toFixed(1) : "—" },
            { label: "Atención", value: pctFrom10(avgAtencion) },
            { label: "Recomiendan", value: `${pctRecoSI}%` },
          ].map((k) => (
            <div key={k.label} className="rounded-xl px-4 py-2 border border-yellow-400/20 bg-card text-center min-w-[90px]">
              <div className="text-lg font-bold text-gray-800 dark:text-yellow-400">{k.value}{typeof k.value === "number" ? "%" : ""}</div>
              <div className="text-[11px] text-neutral-400">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <Card className="dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-800/90 border border-yellow-400/20">
        <CardHeader className="border-b border-yellow-400/20 pb-4 flex flex-col md:flex-row md:items-center gap-3">
          <CardTitle className="text-lg font-bold text-gray-800 dark:text-yellow-400 flex-1">Respuestas</CardTitle>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, producto, teléfono…"
            className="w-full md:w-72 px-3 py-1.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 dark:bg-gray-800/70">
                <tr className="text-left text-xs text-neutral-400 uppercase tracking-wide">
                  <th className="px-3 py-2.5">Nombre / Teléfono</th>
                  <th className="px-3 py-2.5">Producto</th>
                  <th className="px-3 py-2.5">Cómo nos conoció</th>
                  <th className="px-3 py-2.5">Calidad</th>
                  <th className="px-3 py-2.5">NPS</th>
                  <th className="px-3 py-2.5">Recomienda</th>
                  <th className="px-3 py-2.5">Fuente</th>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r) => (
                  <SatisfactionRow key={(r._id || r.id) as string} r={r} />
                ))}
                {!pageData.length && (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-neutral-500">
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-border">
            <span className="text-xs text-neutral-400">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} · Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg bg-background border border-input disabled:opacity-40 hover:border-yellow-400/50"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg bg-background border border-input disabled:opacity-40 hover:border-yellow-400/50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <Card className="dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-800/90 border border-yellow-400/20">
          <CardHeader className="border-b border-yellow-400/20 pb-3">
            <CardTitle className="text-base font-bold text-gray-800 dark:text-yellow-400">Calidad promedio por producto</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={qualityByProduct} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="product" stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis domain={[0, 10]} stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="calidad" name="Calidad" radius={[4, 4, 0, 0]}>
                  {qualityByProduct.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-800/90 border border-yellow-400/20">
          <CardHeader className="border-b border-yellow-400/20 pb-3">
            <CardTitle className="text-base font-bold text-gray-800 dark:text-yellow-400">¿Recomendaría?</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex items-center gap-6">
            <div className="w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={recoPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                    {recoPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              {[
                { label: "Sí recomiendan", value: recoSI, color: "text-green-400" },
                { label: "No recomiendan", value: recoNO, color: "text-red-400" },
                { label: "Tal vez", value: recoMAYBE, color: "text-yellow-400" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className={`font-bold text-base ${r.color}`}>{r.value}</span>
                  <span className="text-neutral-400">{r.label}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border">
                <span className="text-2xl font-bold text-green-400">{pctRecoSI}%</span>
                <span className="text-xs text-neutral-400 ml-1">recomiendan</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-800/90 border border-yellow-400/20">
          <CardHeader className="border-b border-yellow-400/20 pb-3">
            <CardTitle className="text-base font-bold text-gray-800 dark:text-yellow-400">Resolución de inconvenientes</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={inconvenientesDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                  {inconvenientesDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
