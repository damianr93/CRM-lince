import { toast } from "react-toastify";
import type { AppThunk } from "../sotre";
import { addSatisfaction, deleteSatisfaction, setError, setLoading, setSatisfactions, updateSatisfaction, type Satisfaction } from "./satisfaction";

// GET /satisfactions
export const getSatisfactionsThunk = (): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/satisfaction`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al cargar encuestas");
      }

      const data: Satisfaction[] = await response.json();
      dispatch(setSatisfactions(data));
    } catch (error: any) {
      console.error(error);
      dispatch(setError(error.message));
      toast.error(error.message, { position: "top-right" });
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// POST /satisfactions
// Omitimos id/_id/timestamps (los pone el server)
export const postSatisfactionThunk = (
  payload: Omit<Satisfaction, "id" | "_id" | "createdAt" | "updatedAt">
): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/satisfaction`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al crear encuesta");
      }

      const created: Satisfaction = await res.json();
      dispatch(addSatisfaction(created));
      toast.success("Encuesta creada correctamente", { position: "top-right" });
      return created;
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(err.message, { position: "top-right" });
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// PATCH /satisfactions/:id  (update completo/partial)
export const updateSatisfactionThunk = (
  satisfaction: Satisfaction
): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const { _id, id, createdAt, updatedAt, ...rest } = satisfaction;
      const targetId = _id || id;
      if (!targetId) throw new Error("Falta el id de la encuesta");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/satisfaction/${targetId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest), // envío los campos editables
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al actualizar encuesta");
      }

      const updated: Satisfaction = await res.json();
      dispatch(updateSatisfaction(updated));
      toast.success("Encuesta actualizada correctamente", {
        position: "top-right",
      });
      return updated;
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(err.message, { position: "top-right" });
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// PATCH /satisfactions/:id  (update de un campo)
export const updateSatisfactionFieldThunk = (payload: {
  id: string;
  field: keyof Satisfaction;
  value: any;
}): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const updateData: Partial<Satisfaction> = {
        [payload.field]: payload.value,
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/satisfaction/${payload.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || `Error al actualizar ${String(payload.field)}`
        );
      }

      const updated: Satisfaction = await res.json();
      dispatch(updateSatisfaction(updated));
      toast.success(`${String(payload.field)} actualizado correctamente`, {
        position: "top-right",
      });
      return updated;
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(
        `Error al actualizar ${String(payload.field)}: ${err.message}`,
        { position: "top-right" }
      );
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// DELETE /satisfactions/:id
export const deleteSatisfactionThunk = (id: string): AppThunk => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/satisfaction/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al eliminar encuesta");
      }

      dispatch(deleteSatisfaction({ id }));
      toast.success("Encuesta eliminada correctamente", {
        position: "top-right",
      });
    } catch (err: any) {
      dispatch(setError(err.message));
      toast.error(err.message, { position: "top-right" });
    } finally {
      dispatch(setLoading(false));
    }
  };
};