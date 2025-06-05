import React from "react";
import { XIcon } from "lucide-react";
import type { Client } from "@/store/clients/clients";

interface ClientFormModalProps {
    isOpen: boolean;
    isEditing: boolean;
    currentClient: Client;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (field: keyof Client, value: any) => void;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({
    isOpen,
    isEditing,
    currentClient,
    onClose,
    onSubmit,
    onChange,
}) => {
    const siguiendoOptions = ["EZEQUIEL", "DENIS", "MARTIN", "SIN_ASIGNAR"];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                >
                    <XIcon className="h-5 w-5" />
                </button>

                <div className="p-6 pb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                        {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto px-6">
                    <form onSubmit={onSubmit} className="space-y-4 pb-4">
                        {/* Nombre y Apellido */}
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={currentClient.nombre}
                                onChange={(e) => onChange("nombre", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Apellido"
                                value={currentClient.apellido}
                                onChange={(e) => onChange("apellido", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                        </div>

                        {/* Siguiendo */}
                        <div className="grid grid-cols-1 gap-4">
                            <label className="text-gray-700 font-medium">Siguiendo</label>
                            <select
                                value={currentClient.siguiendo}
                                onChange={(e) => onChange("siguiendo", e.target.value)}
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

                        {/* Teléfono y Correo */}
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Teléfono"
                                value={currentClient.telefono}
                                onChange={(e) => onChange("telefono", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <input
                                type="email"
                                placeholder="Correo"
                                value={currentClient.correo}
                                onChange={(e) => onChange("correo", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                        </div>

                        {/* Cabezas y Meses */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-700 font-medium block mb-2">Cabezas</label>
                                <input
                                    type="number"
                                    placeholder="Cabezas"
                                    value={currentClient.cabezas}
                                    onChange={(e) => onChange("cabezas", Number(e.target.value))}
                                    className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>
                            <div>
                                <label className="text-gray-700 font-medium block mb-2">Meses</label>
                                <input
                                    type="number"
                                    placeholder="Meses Supl."
                                    value={currentClient.mesesSuplemento}
                                    onChange={(e) => onChange("mesesSuplemento", Number(e.target.value))}
                                    className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                            </div>
                        </div>

                        {/* Producto y Localidad */}
                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="text"
                                placeholder="Producto"
                                value={currentClient.producto}
                                onChange={(e) => onChange("producto", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <input
                                type="text"
                                placeholder="Localidad"
                                value={currentClient.localidad}
                                onChange={(e) => onChange("localidad", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                        </div>

                        {/* Selects: Actividad, Medio Adquisición, Estado */}
                        <div className="grid grid-cols-3 gap-4">
                            <select
                                value={currentClient.actividad}
                                onChange={(e) => onChange("actividad", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                                <option value="CRIA">CRIA</option>
                                <option value="RECRIA">RECRIA</option>
                                <option value="MIXTO">MIXTO</option>
                                <option value="DISTRIBUIDOR">DISTRIBUIDOR</option>
                            </select>
                            <select
                                value={currentClient.medioAdquisicion}
                                onChange={(e) => onChange("medioAdquisicion", e.target.value)}
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
                                onChange={(e) => onChange("estado", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                                <option value="PENDIENTE">PENDIENTE</option>
                                <option value="COMPRO">COMPRO</option>
                                <option value="NO_COMPRO">NO_COMPRO</option>
                            </select>
                        </div>

                        {/* Observaciones */}
                        <textarea
                            placeholder="Observaciones"
                            value={currentClient.observaciones}
                            onChange={(e) => onChange("observaciones", e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 w-full h-20 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </form>
                </div>

                {/* Botones fijos en la parte inferior */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={onSubmit}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    >
                        {isEditing ? "Actualizar" : "Crear"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientFormModal;