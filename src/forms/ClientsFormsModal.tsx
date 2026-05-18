import React from "react";
import { XIcon } from "lucide-react";
import ProductSelect from "@/components/ProductSelect";
import { LocationSearch, type LocationOption } from "@/components/LocationSearch";
import type { Client } from "@/store/clients/clients";

const fieldClass =
    "border border-input bg-background rounded px-3 py-2 w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400/50";

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
    const siguiendoOptions = ["EZEQUIEL", "DENIS", "MARTIN", "JULIAN", "SIN_ASIGNAR"];
    const handleLocationSelect = (option: LocationOption) => {
        onChange("ubicacion", {
            pais: undefined,
            provincia: option.provincia,
            localidad: option.localidad,
            zona: option.zona,
            lat: option.lat,
            lon: option.lon,
            displayName: option.displayName ?? option.label,
            fuente: option.fuente ?? "NOMINATIM",
            esNormalizada: true,
        });
        if (option.localidad) {
            onChange("localidad", option.localidad);
        }
        if (option.provincia) {
            onChange("provincia", option.provincia);
        }
    };

    const handleLocationClear = () => {
        onChange("ubicacion", undefined);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground focus:outline-none z-10"
                >
                    <XIcon className="h-5 w-5" />
                </button>

                <div className="p-6 pb-4">
                    <h3 className="text-xl font-semibold text-card-foreground">
                        {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
                    </h3>
                </div>

                {currentClient.isReconsulta && (
                    <div className="px-6 pb-2">
                        <div className="rounded-lg border border-amber-400/40 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30">
                            Este registro fue marcado como reconsulta automáticamente.
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6">
                    <form onSubmit={onSubmit} className="space-y-4 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={currentClient.nombre}
                                onChange={(e) => onChange("nombre", e.target.value)}
                                className={fieldClass}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Apellido"
                                value={currentClient.apellido}
                                onChange={(e) => onChange("apellido", e.target.value)}
                                className={fieldClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <label className="text-muted-foreground font-medium">Siguiendo</label>
                            <select
                                value={currentClient.siguiendo}
                                onChange={(e) => onChange("siguiendo", e.target.value)}
                                className={fieldClass}
                                required
                            >
                                {siguiendoOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Teléfono"
                                value={currentClient.telefono}
                                onChange={(e) => onChange("telefono", e.target.value)}
                                className={fieldClass}
                            />
                            <input
                                type="email"
                                placeholder="Correo"
                                value={currentClient.correo}
                                onChange={(e) => onChange("correo", e.target.value)}
                                className={fieldClass}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-muted-foreground font-medium block mb-2">Cabezas</label>
                                <input
                                    type="text"
                                    placeholder="Cabezas"
                                    value={currentClient.cabezas}
                                    onChange={(e) => onChange("cabezas", e.target.value)}
                                    className={fieldClass}
                                />
                            </div>
                            <div>
                                <label className="text-muted-foreground font-medium block mb-2">Meses</label>
                                <input
                                    type="text"
                                    placeholder="Meses Supl."
                                    value={currentClient.mesesSuplemento}
                                    onChange={(e) => onChange("mesesSuplemento", e.target.value)}
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <ProductSelect
                                value={currentClient.producto ?? ""}
                                onChange={(selected) => onChange("producto", selected)}
                                placeholder="Seleccionar producto"
                            />
                            <div>
                                <label className="text-muted-foreground font-medium block mb-2">Ubicación</label>
                                <LocationSearch
                                    value={currentClient.ubicacion?.displayName ?? ""}
                                    onSelect={handleLocationSelect}
                                    onClear={handleLocationClear}
                                />
                                {currentClient.ubicacion?.displayName && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Seleccionado: {currentClient.ubicacion.displayName}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Provincia"
                                    value={currentClient.provincia ?? ""}
                                    onChange={(e) => onChange("provincia", e.target.value)}
                                    className={fieldClass}
                                />
                                <input
                                    type="text"
                                    placeholder="Localidad"
                                    value={currentClient.localidad ?? ""}
                                    onChange={(e) => onChange("localidad", e.target.value)}
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <select
                                value={currentClient.actividad}
                                onChange={(e) => onChange("actividad", e.target.value)}
                                className={fieldClass}
                            >
                                <option value="CRIA">CRIA</option>
                                <option value="RECRIA">RECRIA</option>
                                <option value="MIXTO">MIXTO</option>
                                <option value="DISTRIBUIDOR">DISTRIBUIDOR</option>
                            </select>
                            <select
                                value={currentClient.medioAdquisicion}
                                onChange={(e) => onChange("medioAdquisicion", e.target.value)}
                                className={fieldClass}
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
                                className={fieldClass}
                            >
                                <option value="PENDIENTE">PENDIENTE</option>
                                <option value="NO_CONTESTO">NO CONTESTO</option>
                                <option value="DERIVADO_A_DISTRIBUIDOR">DERIVADO A DISTRIBUIDOR</option>
                                <option value="SE_COTIZO_Y_PENDIENTE">SE COTIZO Y ESTA PENDIENTE</option>
                                <option value="SE_COTIZO_Y_NO_INTERESO">SE COTIZO Y NO LE INTERESO</option>
                                <option value="COMPRO">COMPRO</option>
                            </select>
                        </div>

                        <textarea
                            placeholder="Observaciones"
                            value={currentClient.observaciones}
                            onChange={(e) => onChange("observaciones", e.target.value)}
                            className={`${fieldClass} h-20 resize-none`}
                        />
                    </form>
                </div>

                <div className="border-t border-border bg-muted px-6 py-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-input rounded text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={onSubmit}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    >
                        {isEditing ? "Actualizar" : "Crear"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientFormModal;
