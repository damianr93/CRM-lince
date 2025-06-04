
import React, { useEffect, useState } from "react";
import CustomTable, { type Action, type Column } from "@/components/CustomTable";
import { PencilIcon, PlusIcon, TrashIcon, XIcon } from "lucide-react";
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

export default function ClientsViewer() {
  const dispatch = useDispatch<AppDispatch>();
  const { clients, loading, error } = useSelector(
    (state: RootState) => state.clients
  );

  const columns: Column[] = [
    { field: "nombre", headerName: "Nombre", align: "left" },
    { field: "telefono", headerName: "Teléfono", align: "center" },
    { field: "cabezas", headerName: "Cabezas", align: "right" },
    { field: "mesesSuplemento", headerName: "Meses Supl.", align: "right" },
    { field: "producto", headerName: "Producto", align: "left" },
    { field: "localidad", headerName: "Localidad", align: "left" },
    { field: "actividad", headerName: "Actividad", align: "center" },
    { field: "estado", headerName: "Estado", align: "center" },
    { field: "siguiendo", headerName: "Siguiendo", align: "left" }, // ← Aquí agregas la columna
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

  // ========================================================================
  // 8 Opciones válidas para "siguiendo" (usa las mismas en CustomTable)
  const siguiendoOptions = ["EZEQUIEL", "DENIS", "MARTIN", "SIN_ASIGNAR"];
  // ========================================================================

  // Modal y edición
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client>({
    id: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    cabezas: 0,
    mesesSuplemento: 1,
    producto: "",
    localidad: "",
    actividad: "CRIA",
    medioAdquisicion: "OTRO",
    estado: "PENDIENTE",
    siguiendo: "SIN_ASIGNAR", // Inicializa en "SIN_ASIGNAR"
    observaciones: "",
  });

  useEffect(() => {
    dispatch(getClientsThunk());
  }, [dispatch]);

  const openAddModal = () => {
    setCurrentClient({
      id: "",
      nombre: "",
      apellido: "",
      telefono: "",
      correo: "",
      cabezas: 0,
      mesesSuplemento: 1,
      producto: "",
      localidad: "",
      actividad: "CRIA",
      medioAdquisicion: "OTRO",
      estado: "PENDIENTE",
      siguiendo: "SIN_ASIGNAR", // ← también aquí lo inicializas
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
    if (isEditing) {
      await dispatch(updateClientThunk(currentClient));
    } else {
      const { id, createdAt, updatedAt, ...payload } = currentClient;
      await dispatch(postClientThunk(payload));
    }
    setIsOpen(false);
  };

  const handleActionClick = (action: Action, row: Client) => {
    if (action.name === "editar") {
      openEditModal(row);
    } else if (action.name === "eliminar") {
      const rowId = row.id ? row.id : row._id!;
      dispatch(deleteClientThunk(rowId));
    }
  };

  const handleCellSave = (
    rowId: string | number,
    field: keyof Client,
    value: any
  ) => {
    const clientId = typeof rowId === "string" ? rowId : String(rowId);
    dispatch(
      updateClientFieldThunk({
        id: clientId,
        field: field as string,
        value: value,
      })
    );
  };

  return (
    <div className="p-4 pt-12 md:p-8 bg-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-yellow-500">Clientes</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-yellow-600"
        >
          <PlusIcon className="h-5 w-5" />
          Agregar Cliente
        </button>
      </div>

      {loading && <div className="mb-4 text-gray-700">Cargando clientes...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}

      <CustomTable<Client>
        columns={columns}
        data={clients || []}
        actions={actions}
        onActionClick={handleActionClick}
        onSaveCell={handleCellSave}
        pagination={{ rowsPerPage: 7, rowsPerPageOptions: [7, 10, 25] }}
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-lg p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={currentClient.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={currentClient.apellido}
                  onChange={(e) => handleChange("apellido", e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* ========== NUEVO CAMPO "Siguiendo" ========== */}
              <div className="grid grid-cols-1 gap-4">
                <label className="text-gray-700 font-medium">Siguiendo</label>
                <select
                  value={currentClient.siguiendo}
                  onChange={(e) =>
                    handleChange("siguiendo", e.target.value)
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                >
                  {siguiendoOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              {/* ============================================== */}

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={currentClient.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="email"
                  placeholder="Correo"
                  value={currentClient.correo}
                  onChange={(e) => handleChange("correo", e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Cabezas"
                  value={currentClient.cabezas}
                  onChange={(e) =>
                    handleChange("cabezas", Number(e.target.value))
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="number"
                  placeholder="Meses Supl."
                  value={currentClient.mesesSuplemento}
                  onChange={(e) =>
                    handleChange("mesesSuplemento", Number(e.target.value))
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Producto"
                  value={currentClient.producto}
                  onChange={(e) =>
                    handleChange("producto", e.target.value)
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="text"
                  placeholder="Localidad"
                  value={currentClient.localidad}
                  onChange={(e) =>
                    handleChange("localidad", e.target.value)
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <select
                  value={currentClient.actividad}
                  onChange={(e) =>
                    handleChange("actividad", e.target.value)
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="CRIA">CRIA</option>
                  <option value="RECRIA">RECRIA</option>
                  <option value="MIXTO">MIXTO</option>
                  <option value="DISTRIBUIDOR">DISTRIBUIDOR</option>
                </select>
                <select
                  value={currentClient.medioAdquisicion}
                  onChange={(e) =>
                    handleChange("medioAdquisicion", e.target.value)
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="INSTAGRAM">INSTAGRAM</option>
                  <option value="WEB">WEB</option>
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="FACEBOOK">FACEBOOK</option>
                  <option value="OTRO">OTRO</option>
                </select>
                <select
                  value={currentClient.estado}
                  onChange={(e) =>
                    handleChange("estado", e.target.value)
                  }
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="COMPRO">COMPRO</option>
                  <option value="NO_COMPRO">NO_COMPRO</option>
                </select>
              </div>
              <textarea
                placeholder="Observaciones"
                value={currentClient.observaciones}
                onChange={(e) =>
                  handleChange("observaciones", e.target.value)
                }
                className="border border-gray-300 rounded px-3 py-2 w-full h-20 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-600"
                >
                  {isEditing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}