import React, { useEffect, useMemo, useState } from "react";
import CustomTable, { type Action, type Column } from "@/components/CustomTable";
import { FileSpreadsheet, PencilIcon, PlusIcon, TargetIcon, TrashIcon, Users } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";

export default function ClientsViewer() {
  const dispatch = useDispatch<AppDispatch>();
  const { clients, loading, error } = useSelector(
    (state: RootState) => state.clients
  );
  const { showSuccess, showError } = useNotificationHelpers();
  const [reconsultaFilter, setReconsultaFilter] = useState<"ALL" | "RECONSULTAS" | "ORIGINAL">("ALL");

  const columns: Column[] = [
    { field: "nombre", headerName: "Nombre", align: "left" },
    { field: "apellido", headerName: "Apellido", align: "left" },
    { field: "telefono", headerName: "Telefono", align: "center" },
    { field: "isReconsulta", headerName: "Reconsulta", align: "center" },
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
    isReconsulta: false,
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
      isReconsulta: false,
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

  // Selector de columnas visibles
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "nombre",
    "apellido",
    "telefono",
    "isReconsulta",
    "producto",
    "localidad",
    "actividad",
    "estado",
    "siguiendo",
    "createdAt",
  ]);

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) =>
      prev.includes(field)
        ? prev.filter((col) => col !== field)
        : [...prev, field]
    );
  };

  const filteredColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.includes(col.field));
  }, [columns, visibleColumns]);

  const reconsultaStats = useMemo(() => {
    const total = clients?.length ?? 0;
    const reconsultas = (clients ?? []).filter((client) => client.isReconsulta).length;
    const originales = Math.max(total - reconsultas, 0);
    return {
      total,
      reconsultas,
      originales,
      ratio: total > 0 ? Math.round((reconsultas / total) * 100) : 0,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const base = clients ?? [];
    switch (reconsultaFilter) {
      case "RECONSULTAS":
        return base.filter((client) => client.isReconsulta);
      case "ORIGINAL":
        return base.filter((client) => !client.isReconsulta);
      default:
        return base;
    }
  }, [clients, reconsultaFilter]);

  const cleanedClients = useMemo(() => filteredClients.map(cleanClientData), [filteredClients]);

  const filterOptions: Array<{ value: typeof reconsultaFilter; label: string; helper: string }> = useMemo(
    () => [
      { value: "ALL", label: "Todos", helper: `${reconsultaStats.total} registros` },
      { value: "RECONSULTAS", label: "Reconsultas", helper: `${reconsultaStats.reconsultas} (${reconsultaStats.ratio}%)` },
      { value: "ORIGINAL", label: "Primer ingreso", helper: `${reconsultaStats.originales} registros únicos` },
    ],
    [reconsultaStats],
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 pt-12 md:p-8">
      {/* Header mejorado */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Título y descripción */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2 flex items-center gap-3">
              <Users className="h-8 w-8 md:h-10 md:w-10" />
              Gestión de Clientes
            </h1>
            <p className="text-gray-300 text-sm md:text-base">
              Administra tus contactos y leads en un solo lugar
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg shadow-lg hover:shadow-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={openAddModal}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 px-4 py-2.5 rounded-lg shadow-lg hover:shadow-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
      </div>
    </div>

    {/* Resumen de reconsultas y filtros */}
    <div className="mb-8 grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-yellow-400/30 shadow-xl">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-1">
              Contactos totales
            </p>
            <p className="text-3xl font-bold text-yellow-400">
              {reconsultaStats.total}
            </p>
            <p className="text-sm text-neutral-400 mt-1">
              Historial completo del CRM
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-400/40 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-100">
                Reconsultas
              </p>
              <span className="text-sm font-semibold text-amber-100">
                {reconsultaStats.ratio}%
              </span>
            </div>
            <p className="text-3xl font-bold text-white">
              {reconsultaStats.reconsultas}
            </p>
            <p className="text-xs text-amber-100/80 mt-2">
              Clientes que regresaron en la misma línea
            </p>
            <div className="mt-3 h-2 rounded-full bg-amber-100/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-yellow-200"
                style={{ width: `${reconsultaStats.ratio}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-400/30 shadow-xl">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-1">
              Primer ingreso
            </p>
            <p className="text-3xl font-bold text-white">
              {reconsultaStats.originales}
            </p>
            <p className="text-xs text-emerald-100/80 mt-2">
              Contactos únicos en la base
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-yellow-400/30 shadow-xl">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-400/20 text-yellow-300">
              <TargetIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                Filtrar por tipo de consulta
              </p>
              <p className="text-xs text-neutral-400">
                Visualiza rápidamente clientes repetidos o nuevos
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setReconsultaFilter(option.value)}
                className={`w-full rounded-lg border px-4 py-2 text-left transition-colors duration-200 ${
                  reconsultaFilter === option.value
                    ? "border-yellow-400/70 bg-yellow-400/10 text-yellow-300"
                    : "border-gray-600/60 bg-gray-800/40 text-neutral-200 hover:border-yellow-400/40"
                }`}
              >
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-xs text-neutral-400">{option.helper}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

      {/* Estados de carga y error mejorados */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent mb-4"></div>
            <p className="text-gray-300 text-lg">Cargando clientes...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <div className="bg-red-500/20 p-2 rounded-lg">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

        {/* Tabla con diseño mejorado */}
        {!loading && (
          <>
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg border border-yellow-400/10 shadow-2xl p-4 mb-6">
              <CustomTable<Client>
                columns={filteredColumns}
                data={cleanedClients}
                actions={actions}
                onActionClick={handleActionClick}
                onSaveCell={handleCellSave}
                pagination={{ rowsPerPage: 7, rowsPerPageOptions: [7, 10, 25] }}
              />
            </div>

            {/* Selector de Columnas */}
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-yellow-400/30 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-yellow-400/10 p-2 rounded-lg">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-yellow-400 font-semibold">Columnas Visibles</h3>
                  <span className="text-gray-400 text-sm ml-auto">
                    {visibleColumns.length} de {columns.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {columns.map((col) => (
                    <label
                      key={col.field}
                      className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors duration-200 border border-gray-700/30 hover:border-yellow-400/30"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.field)}
                        onChange={() => toggleColumn(col.field)}
                        className="w-4 h-4 text-yellow-400 bg-gray-700 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-gray-300 text-sm select-none">
                        {col.headerName}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

      {/* Modal sin cambios */}
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
