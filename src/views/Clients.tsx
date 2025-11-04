import React, { useEffect, useState } from "react";
import CustomTable, { type Action, type Column } from "@/components/CustomTable";
import { FileSpreadsheet, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { Client } from "@/store/clients/clients";
import {
  deleteClientThunk,
  getClientsThunk,
  postClientThunk,
  updateClientFieldThunk,
  updateClientThunk,
} from "@/store/clients/thunks";
import type { AppDispatch, RootState } from "@/store/sotre";
import ClientFormModal from "@/forms/ClientsFormsModal";
import { useNotificationHelpers } from "@/components/NotificationSystem";
import { cleanClientData } from "@/utils/dataCleaner";
import { apiFetch } from "@/utils/auth";

export default function ClientsViewer() {
  const dispatch = useDispatch<AppDispatch>();
  const { clients, loading, error } = useSelector(
    (state: RootState) => state.clients
  );
  const { showSuccess, showError } = useNotificationHelpers();

  const columns: Column[] = [
    { field: "nombre", headerName: "Nombre", align: "left" },
    { field: "apellido", headerName: "Apellido", align: "left" },
    { field: "telefono", headerName: "Telefono", align: "center" },
    { field: "cabezas", headerName: "Cabezas", align: "right" },
    { field: "mesesSuplemento", headerName: "Meses Supl.", align: "right" },
    { field: "producto", headerName: "Producto", align: "left" },
    { field: "localidad", headerName: "Localidad", align: "left" },
    { field: "actividad", headerName: "Actividad", align: "center" },
    { field: "estado", headerName: "Estado", align: "center" },
    { field: "siguiendo", headerName: "Siguiendo", align: "left" },
    { field: "observaciones", headerName: "Observaciones", align: "left" },
    { field: "correo", headerName: "Email", align: "left" },
    { field: "createdAt", headerName: "Creado el", align: "center" },
  ];

  const actions: Action[] = [
    {
      name: "editar",
      icon: <PencilIcon className="h-5 w-5 text-blue-600" />,
      color: "primary",
      tooltip: "Editar cliente",
    },
    {
      name: "eliminar",
      icon: <TrashIcon className="h-5 w-5 text-red-600" />,
      color: "secondary",
      tooltip: "Eliminar cliente",
    },
  ];

  // Modal y edicion
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client>({
    id: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    cabezas: "",
    mesesSuplemento: "",
    producto: "",
    localidad: "",
    actividad: "CRIA",
    medioAdquisicion: "OTRO",
    estado: "PENDIENTE",
    siguiendo: "SIN_ASIGNAR",
    observaciones: "",
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        await dispatch(getClientsThunk());
      } catch (error: any) {
        showError("Error al cargar clientes", error.message || "No se pudieron cargar los clientes");
      }
    };
    loadClients();
  }, [dispatch, showError]);

  const openAddModal = () => {
    setCurrentClient({
      id: "",
      nombre: "",
      apellido: "",
      telefono: "",
      correo: "",
      cabezas: "",
      mesesSuplemento: "",
      producto: "",
      localidad: "",
      actividad: "CRIA",
      medioAdquisicion: "OTRO",
      estado: "PENDIENTE",
      siguiendo: "SIN_ASIGNAR",
      observaciones: "",
    });
    setIsEditing(false);
    setIsOpen(true);
  };

  const openEditModal = (client: Client) => {
    setCurrentClient(client);
    setIsEditing(true);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleChange = (field: keyof Client, value: any) => {
    setCurrentClient((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dispatch(updateClientThunk(currentClient));
        showSuccess("Cliente actualizado", "El cliente se ha actualizado correctamente");
      } else {
        const { id, createdAt, updatedAt, ...payload } = currentClient;
        await dispatch(postClientThunk(payload));
        showSuccess("Cliente creado", "El cliente se ha creado correctamente");
      }
      setIsOpen(false);
    } catch (error: any) {
      showError(
        isEditing ? "Error al actualizar cliente" : "Error al crear cliente",
        error.message || "Ha ocurrido un error inesperado"
      );
    }
  };

  const handleActionClick = async (action: Action, row: Client) => {
    if (action.name === "editar") {
      openEditModal(row);
    } else if (action.name === "eliminar") {
      const rowId = row.id ? row.id : row._id!;
      try {
        await dispatch(deleteClientThunk(rowId));
        showSuccess("Cliente eliminado", "El cliente se ha eliminado correctamente");
      } catch (error: any) {
        showError("Error al eliminar cliente", error.message || "No se pudo eliminar el cliente");
      }
    }
  };

  const handleCellSave = async (
    rowId: string | number,
    field: keyof Client,
    value: any
  ) => {
    const clientId = typeof rowId === "string" ? rowId : String(rowId);
    try {
      await dispatch(
        updateClientFieldThunk({
          id: clientId,
          field: field as string,
          value: value,
        })
      );
      showSuccess("Campo actualizado", `${field} se ha actualizado correctamente`);
    } catch (error: any) {
      showError("Error al actualizar campo", error.message || `No se pudo actualizar ${field}`);
    }
  };

  const handleDownloadExcel = async () => {
    try {

      const baseUrl = import.meta.env.VITE_API_URL || "";
      const url = `${baseUrl}/clients/export/excel`;

      const response = await apiFetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Error al generar Excel: ${response.status}`);
      }

      // Convertimos la respuesta en blob
      const blob = await response.blob();
      // Creamos un object URL y forzamos descarga
      const downloadUrl = window.URL.createObjectURL(
        new Blob([blob], { type: response.headers.get("Content-Type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      );
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "clientes_completos.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showSuccess("Excel descargado", "El archivo Excel se ha descargado correctamente");
    } catch (err: any) {
      console.error("No se pudo descargar el Excel:", err);
      showError("Error al descargar Excel", err.message || "Ocurrio un error al descargar el archivo Excel");
    }
  };


  return (
    <div className="p-4 pt-12 md:p-8 bg-gray-100 min-h-screen">
      {/* Header responsive */}
      <div className="mb-4">
        {/* Titulo siempre visible */}
        <h2 className="text-xl sm:text-2xl font-bold text-yellow-500 mb-4 sm:mb-0">
          Clientes
        </h2>

        {/* Contenedor de botones responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4">
          {/* Boton Excel */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center justify-center gap-2 bg-green-400 hover:bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base transition-colors duration-200"
          >
            <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Descargar Excel</span>
            <span className="xs:hidden">Excel</span>
          </button>

          {/* Boton Agregar Cliente */}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-yellow-600 text-sm sm:text-base transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Agregar Cliente</span>
            <span className="xs:hidden">Agregar</span>
          </button>
        </div>
      </div>

      {loading && <div className="mb-4 text-gray-700">Cargando clientes...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}

      <CustomTable<Client>
        columns={columns}
        data={(clients || []).map(cleanClientData)}
        actions={actions}
        onActionClick={handleActionClick}
        onSaveCell={handleCellSave}
        pagination={{ rowsPerPage: 7, rowsPerPageOptions: [7, 10, 25] }}
      />

      <ClientFormModal
        isOpen={isOpen}
        isEditing={isEditing}
        currentClient={currentClient}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
      />
    </div>
  );
}
