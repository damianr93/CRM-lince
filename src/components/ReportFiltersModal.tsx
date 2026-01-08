import React, { useState } from "react";
import { XIcon } from "lucide-react";

export type ReportFilters = {
  startDate?: string;
  endDate?: string;
  provincias?: string;
  paises?: string;
  zonas?: string;
};

interface ReportFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (filters: ReportFilters) => void;
}

export const ReportFiltersModal: React.FC<ReportFiltersModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [filters, setFilters] = useState<ReportFilters>({});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="p-6 pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Emitir informe PDF</h3>
          <p className="text-sm text-gray-500 mt-1">
            Filtrá por fechas, provincias, países o zonas. Si dejás vacío, se incluye todo.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 text-sm font-medium">Desde</label>
                <input
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="text-gray-700 text-sm font-medium">Hasta</label>
                <input
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-700 text-sm font-medium">Provincias (separadas por coma)</label>
              <input
                type="text"
                placeholder="Ej: Córdoba, Santa Fe"
                value={filters.provincias ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, provincias: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="text-gray-700 text-sm font-medium">Países (separados por coma)</label>
              <input
                type="text"
                placeholder="Ej: Argentina, Uruguay"
                value={filters.paises ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, paises: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="text-gray-700 text-sm font-medium">Zonas (separadas por coma)</label>
              <input
                type="text"
                placeholder="Ej: Gran Córdoba"
                value={filters.zonas ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, zonas: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
        </div>

        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSubmit(filters)}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-yellow-600"
          >
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
