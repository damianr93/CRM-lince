import { apiFetch } from "@/utils/auth";
import type { AppThunk } from "../sotre";
import {
  beginLoading,
  endLoading,
  setError,
  setTotales,
  setByChannel,
  setEvolution,
  setYearlyComparison,
  setByProduct,
  type ChannelData,
  type TimePoint,
  type YearlyComparisonPoint,
  type ProductData,
  setStatusPurchase,
  setFollowUpEvents,
  type FollowUpEvent,
  setLocationSummary,
  type LocationSummary,
} from "./analytics";

export interface AnalyticsComparisonSnapshot {
  year: number;
  totales: { totalContacts: number; totalReconsultas?: number; firstTimeContacts?: number };
  byChannel: ChannelData[];
  byProduct: ProductData[];
  statusPurchase: Array<{ status: string; total: number; percentage: number }>;
  locationSummary: LocationSummary | null;
}

const withYearQuery = (basePath: string, year?: number): string => {
  if (!year) return basePath;
  const qs = new URLSearchParams({ year: String(year) }).toString();
  return `${basePath}?${qs}`;
};

export const fetchAnalyticsTotales = (year?: number): AppThunk => async (dispatch) => {
  dispatch(beginLoading());
  dispatch(setError(null));
  try {
    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/totales", year)}`,
      {},
    );
    if (!res.ok) throw new Error("Error al cargar totales");
    const data: { totalContacts: number; totalReconsultas?: number; firstTimeContacts?: number; byChannel: ChannelData[] } = await res.json();
    const totalReconsultas = data.totalReconsultas ?? 0;
    const firstTimeContacts =
      data.firstTimeContacts ?? Math.max(data.totalContacts - totalReconsultas, 0);
    dispatch(
      setTotales({
        totalContacts: data.totalContacts,
        totalReconsultas,
        firstTimeContacts,
      }),
    );
    dispatch(setByChannel(data.byChannel));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(endLoading());
  }
};

export const fetchAnalyticsEvolution = (year?: number): AppThunk => async (dispatch) => {
  dispatch(beginLoading());
  dispatch(setError(null));
  try {
    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/evolucion", year)}`,
      {},
    );
    if (!res.ok) throw new Error("Error al cargar evolución");
    const data: TimePoint[] = await res.json();
    dispatch(setEvolution(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(endLoading());
  }
};

export const fetchAnalyticsYearlyComparison = (years: number[]): AppThunk => async (dispatch) => {
  dispatch(beginLoading());
  dispatch(setError(null));
  try {
    const params = new URLSearchParams();
    if (years.length > 0) {
      params.set("years", years.join(","));
    }
    const query = params.toString();
    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}/analytics/yearly-comparison${query ? `?${query}` : ""}`,
      {},
    );
    if (!res.ok) throw new Error("Error al cargar comparación anual");
    const data: YearlyComparisonPoint[] = await res.json();
    dispatch(setYearlyComparison(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(endLoading());
  }
};

export const fetchAnalyticsDemand = (year?: number): AppThunk => async (dispatch) => {
  dispatch(beginLoading());
  dispatch(setError(null));
  try {
    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/demand-of-product", year)}`,
      {},
    );
    if (!res.ok) throw new Error("Error al cargar demanda de producto");
    const data: ProductData[] = await res.json();
    dispatch(setByProduct(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(endLoading());
  }
};

export const fetchpurchaseStatus = (year?: number): AppThunk => async (dispatch) => {
  dispatch(beginLoading());
  dispatch(setError(null));
  try {
    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/status", year)}`,
      {},
    );
    if (!res.ok) throw new Error("Error al cargar estado de compras");
    const data = await res.json();
    dispatch(setStatusPurchase(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(endLoading());
  }
}

export const fetchFollowUpEvents = (
  assignedTo?: string,
  status: "READY" | "COMPLETED" = "READY",
): AppThunk => async (dispatch) => {
  dispatch(setError(null));
  try {
    const params = new URLSearchParams();
    const normalizedAssignee = assignedTo?.toUpperCase();
    if (normalizedAssignee && normalizedAssignee !== "ALL") {
      params.set("assignedTo", normalizedAssignee);
    }
    if (status) {
      params.set("status", status);
    }
    const query = params.toString();
    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}/analytics/follow-up-events${query ? `?${query}` : ""}`,
      {},
    );
    if (!res.ok) throw new Error("Error al cargar eventos de seguimiento");
    const data: FollowUpEvent[] = await res.json();
    dispatch(setFollowUpEvents(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  }
};

export const completeFollowUpEvent =
  (
    eventId: string,
    assignedTo?: string,
    status: "READY" | "COMPLETED" = "READY",
  ): AppThunk<Promise<void>> =>
  async (dispatch) => {
    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/follow-up/events/${eventId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "COMPLETED" }),
        },
      );
      if (!res.ok) throw new Error("No se pudo marcar el seguimiento como realizado");
      const normalizedAssignee = assignedTo?.toUpperCase();
      await dispatch(
        fetchFollowUpEvents(
          normalizedAssignee && normalizedAssignee !== "ALL" ? normalizedAssignee : undefined,
          status,
        ),
      );
    } catch (err: any) {
      dispatch(setError(err.message));
      throw err;
    }
  };

export const fetchLocationSummary = (year?: number): AppThunk => async (dispatch) => {
  dispatch(beginLoading());
  dispatch(setError(null));
  try {
    const res = await apiFetch(
      `${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/location-summary", year)}`,
      {},
    );
    if (!res.ok) throw new Error("Error al cargar resumen de ubicaciones");
    const data: LocationSummary = await res.json();
    dispatch(setLocationSummary(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(endLoading());
  }
};

export const fetchAnalyticsComparisonSnapshot =
  (year: number): AppThunk<Promise<AnalyticsComparisonSnapshot | null>> =>
  async (dispatch) => {
    dispatch(beginLoading());
    dispatch(setError(null));
    try {
      const [totalesRes, demandRes, statusRes, locationRes] = await Promise.all([
        apiFetch(`${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/totales", year)}`, {}),
        apiFetch(
          `${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/demand-of-product", year)}`,
          {},
        ),
        apiFetch(`${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/status", year)}`, {}),
        apiFetch(
          `${import.meta.env.VITE_API_URL}${withYearQuery("/analytics/location-summary", year)}`,
          {},
        ),
      ]);

      if (!totalesRes.ok) throw new Error("Error al cargar totales comparativos");
      if (!demandRes.ok) throw new Error("Error al cargar productos comparativos");
      if (!statusRes.ok) throw new Error("Error al cargar estado comparativo");
      if (!locationRes.ok) throw new Error("Error al cargar ubicaciones comparativas");

      const totalsPayload = await totalesRes.json();
      const byProduct = (await demandRes.json()) as ProductData[];
      const statusPurchase = (await statusRes.json()) as Array<{
        status: string;
        total: number;
        percentage: number;
      }>;
      const locationSummary = (await locationRes.json()) as LocationSummary;

      return {
        year,
        totales: {
          totalContacts: totalsPayload.totalContacts ?? 0,
          totalReconsultas: totalsPayload.totalReconsultas ?? 0,
          firstTimeContacts: totalsPayload.firstTimeContacts ?? 0,
        },
        byChannel: (totalsPayload.byChannel ?? []) as ChannelData[],
        byProduct,
        statusPurchase,
        locationSummary,
      };
    } catch (err: any) {
      dispatch(setError(err.message));
      return null;
    } finally {
      dispatch(endLoading());
    }
  };
