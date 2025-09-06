import { createSlice } from "@reduxjs/toolkit";


// Define la interfaz Client según tu backend
export interface Client {
  _id?: string;
  id: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
  cabezas?: string;
  mesesSuplemento?: string;
  producto?: string;
  localidad?: string;
  actividad?: "CRIA" | "RECRIA" | "MIXTO" | "DISTRIBUIDOR";
  medioAdquisicion?: "INSTAGRAM" | "WEB" | "WHATSAPP" | "FACEBOOK" | "OTRO";
  estado?: "PENDIENTE" | "COMPRO" | "NO_COMPRO";
  observaciones?: string;
  createdAt?: string;
  siguiendo?: "EZEQUIEL" | "DENIS" | "MARTIN" | "SIN_ASIGNAR";
  updatedAt?: string;
}

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
}

const initialState: ClientsState = {
  clients: [],
  loading: false,
  error: null,
};

const clientsSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setClients(state, action) {
      state.clients = action.payload;
    },
    addClient(state, action) {
      state.clients.unshift(action.payload);
    },
    updateClient(state, action) {
      const updated = action.payload;

      const payloadId = updated.id || updated._id;
      state.clients = state.clients.map((c) => {
        const clientId = c.id || c._id;
        if (clientId === payloadId) {
          return updated;
        }
        return c;
      });
    },
    deleteClient(state, action) {
      const payloadId = action.payload.id;
      state.clients = state.clients.filter((c) => {
        const clientId = c.id || c._id;
        return clientId !== payloadId;
      });
    },
  },
});

export const {
  setLoading,
  setError,
  setClients,
  addClient,
  updateClient,
  deleteClient,
} = clientsSlice.actions;

export default clientsSlice;    