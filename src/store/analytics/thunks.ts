import { apiFetch } from "@/utils/auth";
import type { AppThunk } from "../sotre";
import {
  setLoading,
  setError,
  setTotales,
  setByChannel,
  setEvolution,
  setByProduct,
  type ChannelData,
  type TimePoint,
  type ProductData,
  setStatusPurchase,
  setFollowUpEvents,
  type FollowUpEvent,
  setLocationSummary,
  type LocationSummary,
} from "./analytics";

export const fetchAnalyticsTotales = (): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/analytics/totales`, {});
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
    dispatch(setLoading(false));
  }
};

export const fetchAnalyticsEvolution = (): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/analytics/evolucion`, {});
    if (!res.ok) throw new Error("Error al cargar evolución");
    const data: TimePoint[] = await res.json();
    dispatch(setEvolution(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchAnalyticsDemand = (): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/analytics/demand-of-product`, {});
    if (!res.ok) throw new Error("Error al cargar demanda de producto");
    const data: ProductData[] = await res.json();
    dispatch(setByProduct(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchpurchaseStatus = (): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/analytics/status`, {});
    if (!res.ok) throw new Error("Error al cargar estado de compras");
    const data = await res.json();
    dispatch(setStatusPurchase(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(setLoading(false));
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

export const fetchLocationSummary = (): AppThunk => async (dispatch) => {
  dispatch(setError(null));
  try {
    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/analytics/location-summary`, {});
    if (!res.ok) throw new Error("Error al cargar resumen de ubicaciones");
    const data: LocationSummary = await res.json();
    dispatch(setLocationSummary(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  }
};
