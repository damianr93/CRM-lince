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
} from "./analytics";

export const fetchAnalyticsTotales = (): AppThunk => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/totales`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error al cargar totales");
    const data: { totalContacts: number; byChannel: ChannelData[] } = await res.json();
    dispatch(setTotales(data.totalContacts));
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
    const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/evolucion`, {
      credentials: "include",
    });
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
    const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/demand-of-product`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error al cargar demanda de producto");
    const data: ProductData[] = await res.json();
    dispatch(setByProduct(data));
  } catch (err: any) {
    dispatch(setError(err.message));
  } finally {
    dispatch(setLoading(false));
  }
};
