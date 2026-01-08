import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import { apiFetch } from "@/utils/auth";

type HeatmapProvince = {
  name: string;
  normalized: string;
  total: number;
  percentage: number;
};

const cacheTtlMs = 1000 * 60 * 5;
let cachedGeoJson: FeatureCollection | null = null;
let cachedAt = 0;

const normalizeProvinceKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bprovincia\s+de\s+/g, "")
    .replace(/\bprovincia\s+/g, "")
    .replace(/\bprov\.?\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getFeatureName = (feature: Feature) => {
  const props = feature.properties as Record<string, any> | undefined;
  return (
    props?.nam ||
    props?.fna ||
    props?.nombre ||
    props?.name ||
    "Sin provincia"
  );
};

const getFillColor = (total: number, maxTotal: number) => {
  if (!total || maxTotal <= 0) {
    return "#111827";
  }
  const ratio = total / maxTotal;
  if (ratio > 0.8) return "#F59E0B";
  if (ratio > 0.6) return "#38BDF8";
  if (ratio > 0.4) return "#2563EB";
  if (ratio > 0.2) return "#1E40AF";
  return "#0F172A";
};

type LocationHeatmapProps = {
  provinces: HeatmapProvince[];
};

export default function LocationHeatmap({ provinces }: LocationHeatmapProps) {
  const [geoJson, setGeoJson] = useState<FeatureCollection | null>(null);
  const heatmap = useMemo(() => {
    const map: Record<string, HeatmapProvince> = {};
    provinces.forEach((province) => {
      map[province.normalized] = province;
    });
    return map;
  }, [provinces]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const now = Date.now();
      if (cachedGeoJson && cachedAt > 0 && now - cachedAt < cacheTtlMs) {
        setGeoJson(cachedGeoJson);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        const geoResponse = await apiFetch(`${baseUrl}/geo/argentina-provinces`, {
          method: "GET",
        });

        if (!geoResponse.ok) {
          throw new Error("No se pudo cargar el mapa provincial");
        }

        const geoData = (await geoResponse.json()) as FeatureCollection;

        setGeoJson(geoData);
        cachedGeoJson = geoData;
        cachedAt = Date.now();
      } catch (err) {
        setError("No se pudo cargar el mapa");
        setGeoJson(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const maxTotal = useMemo(() => {
    const values = Object.values(heatmap).map((item) => item.total);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [heatmap]);

  const svgConfig = useMemo(() => {
    if (!geoJson) {
      return null;
    }
    const width = 800;
    const height = 360;
    const projection = geoMercator().fitSize([width, height], geoJson as any);
    const path = geoPath(projection);
    return { width, height, path };
  }, [geoJson]);

  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center rounded-lg border border-gray-700/40 text-neutral-400 text-sm">
        Cargando mapa...
      </div>
    );
  }

  if (error || !geoJson) {
    return (
      <div className="h-72 flex items-center justify-center rounded-lg border border-gray-700/40 text-neutral-400 text-sm">
        {error ?? "Sin datos para mostrar"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-72 overflow-hidden rounded-lg border border-gray-700/40 bg-slate-900">
        <svg
          viewBox={`0 0 ${svgConfig?.width ?? 800} ${svgConfig?.height ?? 360}`}
          className="h-full w-full"
          aria-label="Mapa de consultas por provincia"
        >
          <rect width="100%" height="100%" fill="#0B1220" />
          {geoJson?.features.map((feature, index) => {
            if (!svgConfig?.path) {
              return null;
            }
            const name = getFeatureName(feature);
            const normalized = normalizeProvinceKey(name);
            const total = heatmap[normalized]?.total ?? 0;
            const fill = getFillColor(total, maxTotal);
            return (
              <path
                key={`${name}-${index}`}
                d={svgConfig.path(feature as any) ?? undefined}
                fill={fill}
                stroke="#1F2937"
                strokeWidth={1}
                opacity={total > 0 ? 0.75 : 0.25}
              >
                <title>{`${name}: ${total} consultas`}</title>
              </path>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        <span className="uppercase tracking-[0.2em] text-neutral-500">Intensidad</span>
        {[
          { label: "Alta", color: "#F59E0B" },
          { label: "Media", color: "#38BDF8" },
          { label: "Baja", color: "#2563EB" },
          { label: "Muy baja", color: "#1E40AF" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
