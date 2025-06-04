

export const NuevoCliente = () => {

    const closeModal = () => setIsOpen(false);

    const handleChange = (field: keyof Client, value: any) => {
        setNewClient((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setData((prev) => [newClient, ...prev]);
        setIsOpen(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-11/12 max-w-lg p-6 relative">
                    <button
                        onClick={closeModal}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Nuevo Cliente</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={newClient.nombre}
                                onChange={(e) => handleChange("nombre", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Apellido"
                                value={newClient.apellido}
                                onChange={(e) => handleChange("apellido", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Teléfono"
                                value={newClient.telefono}
                                onChange={(e) => handleChange("telefono", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Correo"
                                value={newClient.correo}
                                onChange={(e) => handleChange("correo", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                placeholder="Cabezas"
                                value={newClient.cabezas}
                                onChange={(e) => handleChange("cabezas", Number(e.target.value))}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Meses Supl."
                                value={newClient.mesesSuplemento}
                                onChange={(e) => handleChange("mesesSuplemento", Number(e.target.value))}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="text"
                                placeholder="Producto"
                                value={newClient.producto}
                                onChange={(e) => handleChange("producto", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Localidad"
                                value={newClient.localidad}
                                onChange={(e) => handleChange("localidad", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={newClient.actividad}
                                onChange={(e) => handleChange("actividad", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            >
                                <option value="CRIA">CRIA</option>
                                <option value="RECRIA">RECRIA</option>
                                <option value="MIXTO">MIXTO</option>
                                <option value="DISTRIBUIDOR">DISTRIBUIDOR</option>
                            </select>
                            <select
                                value={newClient.medioAdquisicion}
                                onChange={(e) => handleChange("medioAdquisicion", e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                required
                            >
                                <option value="INSTAGRAM">INSTAGRAM</option>
                                <option value="WEB">WEB</option>
                                <option value="WHATSAPP">WHATSAPP</option>
                                <option value="FACEBOOK">FACEBOOK</option>
                                <option value="OTRO">OTRO</option>
                            </select>
                        </div>
                        <textarea
                            placeholder="Observaciones"
                            value={newClient.observaciones}
                            onChange={(e) => handleChange("observaciones", e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 w-full h-24 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded bg-yellow-400 hover:bg-yellow-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-600"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
