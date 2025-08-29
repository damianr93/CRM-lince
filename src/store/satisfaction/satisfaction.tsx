import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type MedioConocimiento =
  | "VISITA_VENDEDOR"
  | "RECOMENDACION_COLEGA"
  | "VENDEDOR"
  | "WEB"
  | "EXPOSICIONES";

export type Recomendacion = "SI" | "NO" | "MAYBE";

export type AnteInconvenientes = "EXCELENTE" | "BUENA" | "MALA" | "N_A";

export type Valoracion =
  | "CALIDAD"
  | "TIEMPO_ENTREGA"
  | "ATENCION"
  | "RESOLUCION_INCONVENIENTES"
  | "SIN_VALORACION";

// Interface alineada al backend que mostraste (viene _id).
export interface Satisfaction {
  _id?: string;
  id?: string; // por si tu toJSON setea 'id'
  name?:string;
  phone?: string;
  product?: string;
  comoNosConocio?: MedioConocimiento;
  productoComprado?: boolean;
  calidad?: number;          // 1..5
  tiempoForme?: number;      // 1..5
  atencion?: number;         // 1..5
  recomendacion?: Recomendacion;
  anteInconvenientes?: AnteInconvenientes;
  valoracion?: Valoracion;
  comentarios?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SatisfactionsState {
  items: Satisfaction[];
  loading: boolean;
  error: string | null;
}

const initialState: SatisfactionsState = {
  items: [],
  loading: false,
  error: null,
};

const satisfactionsSlice = createSlice({
  name: "satisfactions",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setSatisfactions(state, action: PayloadAction<Satisfaction[]>) {
      state.items = action.payload;
    },
    addSatisfaction(state, action: PayloadAction<Satisfaction>) {
      state.items.unshift(action.payload);
    },
    updateSatisfaction(state, action: PayloadAction<Satisfaction>) {
      const updated = action.payload;
      const payloadId = updated.id || updated._id;

      state.items = state.items.map((s) => {
        const sId = s.id || s._id;
        if (sId === payloadId) return updated;
        return s;
      });
    },
    deleteSatisfaction(state, action: PayloadAction<{ id: string }>) {
      const payloadId = action.payload.id;
      state.items = state.items.filter((s) => {
        const sId = s.id || s._id;
        return sId !== payloadId;
      });
    },
  },
});

export const {
  setLoading,
  setError,
  setSatisfactions,
  addSatisfaction,
  updateSatisfaction,
  deleteSatisfaction,
} = satisfactionsSlice.actions;

export default satisfactionsSlice;