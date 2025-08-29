import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/sotre";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Satisfaction } from "@/store/satisfaction/satisfaction";
import { getSatisfactionsThunk } from "@/store/satisfaction/thunks";

const COLORS = [
  "#FFD700",
  "#A44FFF",
  "#E10600",
  "#7E00FF",
  "#F59E0B",
  "#34D399",
  "#60A5FA",
  "#F472B6",
  "#FBBF24",
];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-yellow-400/30 rounded-lg p-3 shadow-2xl text-white">
        {label && <p className="font-medium text-sm mb-1">{label}</p>}
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm">
            <span className="font-medium">{entry.name}: </span>
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
            {entry.name?.toString().toLowerCase().includes("%") ? "%" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Helpers
function groupBy<T, K extends string | number>(arr: T[], keyFn: (x: T) => K) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item as any);
    return acc;
  }, {} as Record<K, T[]>);
}
function avg(nums: (number | undefined)[]) {
  const vals = nums.filter((n): n is number => typeof n === "number");
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function pctFromFive(n: number) {
  if (!n) return 0;
  return Math.round((n / 5) * 100);
}

export default function SatisfactionDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector(
    (s: RootState) => s.satisfaction
  );

  useEffect(() => {
    dispatch(getSatisfactionsThunk());
  }, [dispatch]);

  // ---------- Tabla: búsqueda, orden, paginación ----------
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<
    keyof Satisfaction | "_createdAt" | "_updatedAt"
  >("_createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? items.filter((it) => {
          const blob = [
            it.product,
            it.phone,
            it.comoNosConocio,
            it.recomendacion,
            it.anteInconvenientes,
            it.valoracion,
            it.comentarios, // ahora busca también en comentarios
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return blob.includes(q);
        })
      : items.slice();

    const sorted = base.sort((a, b) => {
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      const getVal = (x: Satisfaction) => {
        if (sortKey === "_createdAt")
          return x.createdAt ? new Date(x.createdAt).getTime() : 0;
        if (sortKey === "_updatedAt")
          return x.updatedAt ? new Date(x.updatedAt).getTime() : 0;
        return (x[sortKey] as any) ?? "";
      };

      const va = getVal(a);
      const vb = getVal(b);

      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa < sb) return sortDir === "asc" ? -1 : 1;
      if (sa > sb) return sortDir === "asc" ? 1 : -1;

      // desempate por fecha creación desc
      return bCreated - aCreated;
    });

    return sorted;
  }, [items, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  function setSort(k: typeof sortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  // ---------- Agregados / KPIs ----------
  // 1) Barras: promedio de calidad por producto
  const qualityByProduct = useMemo(() => {
    const byProd = groupBy(items, (x) => x.product || "SIN_PRODUCTO");
    const rows = Object.entries(byProd).map(([product, arr]) => ({
      product,
      calidad: Number(avg(arr.map((r: Satisfaction) => r.calidad)).toFixed(2)),
    }));
    rows.sort((a, b) => b.calidad - a.calidad);
    return rows;
  }, [items]);

  // 2) Torta: cantidad de respuestas por producto
  const countByProduct = useMemo(() => {
    const byProd = groupBy(items, (x) => x.product || "SIN_PRODUCTO");
    const rows = Object.entries(byProd).map(([product, arr]) => ({
      product,
      total: (arr as Satisfaction[]).length,
    }));
    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [items]);

  // 3) Indicadores % normalizados
  const avgCalidad = useMemo(() => avg(items.map((r) => r.calidad)), [items]);
  const avgTiempo = useMemo(
    () => avg(items.map((r) => r.tiempoForme)),
    [items]
  );
  const avgAtencion = useMemo(() => avg(items.map((r) => r.atencion)), [items]);
  const kpis = [
    { name: "Calidad (%)", value: pctFromFive(avgCalidad) },
    { name: "Tiempo y Forma (%)", value: pctFromFive(avgTiempo) },
    { name: "Atención (%)", value: pctFromFive(avgAtencion) },
  ];

  // 4) Recomendación SI/NO/MAYBE (mini pie)
  const total = items.length;
  const recoSI = items.filter((x) => x.recomendacion === "SI").length;
  const recoNO = items.filter((x) => x.recomendacion === "NO").length;
  const recoMAYBE = items.filter((x) => x.recomendacion === "MAYBE").length;
  const pctRecoSI = total ? Math.round((recoSI / total) * 100) : 0;

  const recoPieData = [
    { name: "SI", value: recoSI },
    { name: "NO", value: recoNO },
    { name: "MAYBE", value: recoMAYBE },
  ];

  // 5) Total encuestas
  const totalEncuestas = total;

  // 6) Distribución de "Ante Inconvenientes"
  const inconvenientesDist = useMemo(() => {
    const by = groupBy(items, (x) => x.anteInconvenientes || "N_A");
    return Object.entries(by).map(([k, arr]) => ({
      label: k,
      total: (arr as Satisfaction[]).length,
    }));
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400">Cargando datos de satisfacción...</span>
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
      {/* Header + totales (¡sin el cuadro de Recomendación aquí!) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">
            Satisfacción · Visión General
          </h1>
          <p className="text-neutral-300 text-lg">
            Encuestas, productos consultados y percepción del servicio
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-stretch">
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-yellow-400/20 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col items-start sm:items-center">
              <span className="text-2xl font-bold text-yellow-400">
                {totalEncuestas}
              </span>
              <span className="text-sm text-neutral-400">Encuestas</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- 1er VH: Tabla --- */}
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-yellow-400/20 backdrop-blur-sm">
        <CardHeader className="border-b border-yellow-400/20 pb-4">
          <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            📋 Respuestas (tabla)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Controles */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por producto, teléfono, recomendación o comentarios…"
              className="w-full md:w-1/2 px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
            />

            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-300">Ordenar por:</label>
              <select
                value={sortKey}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200"
              >
                <option value="_createdAt">Fecha creación</option>
                <option value="_updatedAt">Fecha actualización</option>
                <option value="product">Producto</option>
                <option value="calidad">Calidad</option>
                <option value="tiempoForme">Tiempo y Forma</option>
                <option value="atencion">Atención</option>
                <option value="recomendacion">Recomendación</option>
                <option value="anteInconvenientes">
                  Solución inconvenientes
                </option>
                <option value="valoracion">Valoración</option>
                <option value="comentarios">Comentarios</option>
              </select>

              <button
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
                className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200 hover:border-yellow-400/50"
                title="Cambiar dirección"
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-gray-700/50">
            <table className="min-w-full text-sm text-neutral-200">
              <thead className="bg-gray-800/70">
                <tr className="text-left">
                  <th className="px-3 py-2">Nombre / Razón Social</th>
                  {/* 👈 nueva columna */}
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2">Conocimiento</th>
                  {/* SIN columna "Compró" */}
                  <th className="px-3 py-2">Calidad</th>
                  <th className="px-3 py-2">Tiempo</th>
                  <th className="px-3 py-2">Atención</th>
                  <th className="px-3 py-2">Recomienda</th>
                  <th className="px-3 py-2">Solución Inc.</th>
                  <th className="px-3 py-2">Valoración</th>
                  <th className="px-3 py-2">Comentarios</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r) => (
                  <tr
                    key={(r._id || r.id) as string}
                    className="border-t border-gray-700/40 hover:bg-gray-800/40"
                  >
                    <td className="px-3 py-2">{r.name || "-"}</td>
                    {/* 👈 nuevo dato */}
                    <td className="px-3 py-2">{r.product || "-"}</td>
                    <td className="px-3 py-2">{r.phone || "-"}</td>
                    <td className="px-3 py-2">{r.comoNosConocio || "-"}</td>

                    {/* SIN columna Compró */}

                    <td className="px-3 py-2">{r.calidad ?? "-"}</td>
                    <td className="px-3 py-2">{r.tiempoForme ?? "-"}</td>
                    <td className="px-3 py-2">{r.atencion ?? "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.recomendacion === "NO"
                            ? "text-red-400"
                            : r.recomendacion === "MAYBE"
                            ? "text-yellow-400"
                            : "text-green-400"
                        }
                      >
                        {r.recomendacion || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.anteInconvenientes || "-"}</td>
                    <td className="px-3 py-2">{r.valoracion || "-"}</td>
                    <td className="px-3 py-2">
                      {r.comentarios && r.comentarios.trim() !== ""
                        ? r.comentarios
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
                {!pageData.length && (
                  <tr>
                    <td
                      colSpan={12} // 👈 sumado 1 por la nueva columna
                      className="px-3 py-6 text-center text-neutral-400"
                    >
                      Sin resultados para la búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-neutral-400">
              Página {page} de {totalPages} · {filtered.length} resultados
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- 2do VH: Gráficas + KPIs + Recomendación --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Barras: promedio de calidad por producto */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-yellow-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-yellow-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400">
              🏆 Promedio de Calidad por Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={qualityByProduct}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="product"
                  stroke="#D1D5DB"
                  tick={{ fill: "#D1D5DB" }}
                />
                <YAxis
                  domain={[0, 5]}
                  stroke="#D1D5DB"
                  tick={{ fill: "#D1D5DB" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="calidad" name="Calidad" radius={[4, 4, 0, 0]}>
                  {qualityByProduct.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Torta: respuestas por producto */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-yellow-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-yellow-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400">
              🥧 Respuestas por Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={countByProduct}
                  dataKey="total"
                  nameKey="product"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name}: ${Math.round(percent * 100)}%`
                  }
                >
                  {countByProduct.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NUEVO: Recomendación (mini pie + % SI) */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-yellow-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-yellow-400/20 pb-3">
            <CardTitle className="text-xl font-bold text-yellow-400">
              ✅ Recomendación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex items-center gap-4">
            <div className="w-40 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recoPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    paddingAngle={4}
                    innerRadius={35}
                    outerRadius={50}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${Math.round(percent * 100)}%`
                    }
                  >
                    {recoPieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="min-w-28 rounded-xl p-10 bg-gray-800/60 border border-gray-700/40 text-center">
              <div className="text-xs text-neutral-400 mb-1">
                SI Recomiendan
              </div>
              <div className="text-3xl font-bold text-green-400">
                {pctRecoSI}%
              </div>
              <div className="text-[11px] text-neutral-400">
                {recoSI}/{total} resp.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs: % de indicadores */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-yellow-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-yellow-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400">
              📊 Indicadores Normalizados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {kpis.map((k) => (
                <div
                  key={k.name}
                  className="rounded-xl p-4 bg-gray-800/60 border border-gray-700/40"
                >
                  <div className="text-sm text-neutral-400">{k.name}</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {k.value}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas & Inconvenientes */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-yellow-400/20 backdrop-blur-sm">
          <CardHeader className="border-b border-yellow-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400">
              🚩 Alertas & Inconvenientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl p-4 bg-gray-800/60 border border-gray-700/40">
                <div className="text-sm text-neutral-300 mb-3">
                  Distribución: Solución de inconvenientes
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={inconvenientesDist}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#D1D5DB"
                      tick={{ fill: "#D1D5DB" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="#D1D5DB"
                      tick={{ fill: "#D1D5DB" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                      {inconvenientesDist.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Placeholder para otra métrica si la necesitás */}
              {/* <div className="rounded-xl p-4 bg-gray-800/60 border border-gray-700/40 flex items-center justify-center text-neutral-400">
                Agregá aquí otra tarjeta/KPI si querés (p. ej., tendencia
                mensual).
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
