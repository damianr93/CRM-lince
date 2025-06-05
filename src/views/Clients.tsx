import React, { useEffect, useState } from "react";
import CustomTable, { type Action, type Column } from "@/components/CustomTable";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
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
    { field: "siguiendo", headerName: "Siguiendo", align: "left" },
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
    siguiendo: "SIN_ASIGNAR", 
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