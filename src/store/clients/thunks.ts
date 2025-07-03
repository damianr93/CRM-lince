import type { AppThunk } from "../sotre";
import { addClient, deleteClient, setClients, setError, setLoading, updateClient, type Client } from "./clients";
import { toast } from "react-toastify";

export const getClientsThunk = (): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/clients`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cargar clientes");
      }

      const data: Client[] = await response.json();
      dispatch(setClients(data));
    } catch (error: any) {
      console.error(error);
      dispatch(setError(error.message));
      toast.error(error.message, { position: "top-right" });
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const postClientThunk = (
  clientData: Omit<Client, "id" | "createdAt" | "updatedAt">
): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clients`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al crear cliente");
      }
      const newClient: Client = await res.json();
      dispatch(addClient(newClient));
      toast.success("Cliente creado correctamente", { position: "top-right" });
      return newClient;
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(err.message, { position: "top-right" });
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/** Thunk: Actualizar un cliente */
export const updateClientThunk = (
  clientData: Client
): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const { _id, id, ...rest } = clientData;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clients/${_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al actualizar cliente");
      }
      const updatedClient: Client = await res.json();
      dispatch(updateClient(updatedClient));
      toast.success("Cliente actualizado correctamente", { position: "top-right" });
      return updatedClient;
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(err.message, { position: "top-right" });
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateClientFieldThunk = (payload: {
  id: string | number;
  field: string;
  value: any;
}): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const updateData = {
        [payload.field]: payload.value
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clients/${payload.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error al actualizar ${payload.field}`);
      }

      const updatedClient: Client = await res.json();

      dispatch(updateClient(updatedClient));
      
      toast.success(`${payload.field} actualizado correctamente`, { 
        position: "top-right",
      });
      
      return updatedClient;
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(`Error al actualizar ${payload.field}: ${err.message}`, { 
        position: "top-right" 
      });
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

/** Thunk: Eliminar un cliente */
export const deleteClientThunk = (clientId: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al eliminar cliente");
      }
      dispatch(deleteClient({ id: clientId }));
      toast.success("Cliente eliminado correctamente", { position: "top-right" });
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(err.message, { position: "top-right" });
    } finally {
      dispatch(setLoading(false));
    }
  };
};