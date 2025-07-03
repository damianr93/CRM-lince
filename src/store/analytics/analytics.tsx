import { createSlice } from "@reduxjs/toolkit";

export interface ChannelData {
  channel: string;
  total: number;
}

export interface TimePoint {
  date: string;
  total: number;
}

export interface StatusPoint {
  status: 'Compras' | 'No Compras' | 'Pendientes';
  total: number;
  percentage: number;
}

export interface ProductData {
  product: string;
  total: number;
}

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  totales: number;                  
  byChannel: ChannelData[];       
  evolution: TimePoint[];        
  byProduct: ProductData[];
  statusPurchase: StatusPoint[]
}

const initialState: AnalyticsState = {
  loading: false,
  error: null,
  totales: 0,
  byChannel: [],
  evolution: [],
  byProduct: [],
  statusPurchase: []
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    // para indicar que arrancó una carga
    setLoading(state, action) {
      state.loading = action.payload;
    },
    // para setear un error (string o null)
    setError(state, action) {
      state.error = action.payload;
    },

    // para guardar el valor total de contactos
    setTotales(state, action) {
      state.totales = action.payload;
    },
    // para guardar los datos por canal
    setByChannel(state, action) {
      state.byChannel = action.payload;
    },
    // para guardar la evolución mensual
    setEvolution(state, action) {
      state.evolution = action.payload;
    },
    // para guardar la demanda por producto
    setByProduct(state, action) {
      state.byProduct = action.payload;
    },
    setStatusPurchase(state, action) {
      state.statusPurchase = action.payload;
    }
  },
});

export const {
  setLoading,
  setError,
  setTotales,
  setByChannel,
  setEvolution,
  setByProduct,
  setStatusPurchase
} = analyticsSlice.actions;

export default analyticsSlice