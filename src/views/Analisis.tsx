// src/views/ClientsDashboard.tsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart,
  Bar,
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
import { fetchAnalyticsDemand, fetchAnalyticsEvolution, fetchAnalyticsTotales } from "@/store/analytics/thunks";


/* -------------------------------------------------------------------------- */
/*                                  helpers                                   */
/* -------------------------------------------------------------------------- */

const COLORS = ["#FFD700", "#A44FFF", "#E10600", "#7E00FF", "#F59E0B"];

interface ChannelData {
  channel: string;
  total: number;
}
interface TimePoint {
  date: string; // formato "YYYY-MM"
  total: number;
}
interface ProductData {
  product: string;
  total: number;
}

/* -------------------------------------------------------------------------- */
/*                                 component                                  */
/* -------------------------------------------------------------------------- */

export default function ClientsDashboard() {
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error, totales, byChannel, evolution, byProduct } = useSelector(
    (state: RootState) => state.analytics
  );

  useEffect(() => {
    dispatch(fetchAnalyticsTotales());
    dispatch(fetchAnalyticsEvolution());
    dispatch(fetchAnalyticsDemand());
  }, [dispatch]);

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
    <div className="min-h-screen p-4 md:p-8 space-y-8">
      {/* Header + total contacts */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">
            CRM · Visión General
          </h1>
          <p className="text-neutral-300 text-lg">
            Contactos, canales de adquisición y productos consultados
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

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart – canales */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm shadow-2xl">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              📣 Adquisición por Canal
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

        {/* Line chart – evolución */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm shadow-2xl">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              📈 Evolución de Consultas
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
                  dot={{ fill: "#A44FFF", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "#A44FFF", strokeWidth: 2, fill: "#FFD700" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Horizontal bars – productos */}
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gold-400/20 backdrop-blur-sm shadow-2xl">
          <CardHeader className="border-b border-gold-400/20 pb-4">
            <CardTitle className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              🛒 Productos más Consultados
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
      </div>
    </div>
  );
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gold-400/30 rounded-lg p-3 shadow-2xl">
        <p className="text-gold-400 font-medium text-sm">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-neutral-100 text-sm">
            <span className="font-medium">{entry.name}: </span>
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
