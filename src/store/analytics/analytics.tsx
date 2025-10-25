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

export interface FollowUpEvent {
  id: string;
  customerName?: string;
  customerLastName?: string;
  assignedTo?: string;
  customerPhone?: string | null;
  product?: string;
  triggerStatus: string;
  templateId: string;
  message: string;
  channels: string[];
  contactValue?: string | null;
  scheduledFor: string;
  status: 'SCHEDULED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  readyAt?: string | null;
  createdAt?: string;
  completedAt?: string | null;
  notes?: string | null;
}

interface AnalyticsState {
  loading: boolean;
  error: string | null;
  totales: number;                  
  byChannel: ChannelData[];       
  evolution: TimePoint[];        
  byProduct: ProductData[];
  statusPurchase: StatusPoint[];
  followUpEvents: FollowUpEvent[];
}

const initialState: AnalyticsState = {
  loading: false,
  error: null,
  totales: 0,
  byChannel: [],
  evolution: [],
  byProduct: [],
  statusPurchase: [],
  followUpEvents: [],
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    // para indicar que arrancÃ³ una carga
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
    // para guardar la evoluciÃ³n mensual
    setEvolution(state, action) {
      state.evolution = action.payload;
    },
    // para guardar la demanda por producto
    setByProduct(state, action) {
      state.byProduct = action.payload;
    },
    setStatusPurchase(state, action) {
      state.statusPurchase = action.payload;
    },
    setFollowUpEvents(state, action) {
      state.followUpEvents = action.payload;
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
  setStatusPurchase,
  setFollowUpEvents
} = analyticsSlice.actions;

export default analyticsSlice


