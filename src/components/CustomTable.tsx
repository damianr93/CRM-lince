import React, { useState, useMemo, useEffect, useRef } from "react";
import { SaveIcon, XIcon } from "lucide-react";

export interface Column {
  field: string;
  headerName: string;
  align?: "left" | "center" | "right";
}

export interface RowData {
  [key: string]: any;
}
  
export interface Action {
  name?: string;
  color?: "default" | "primary" | "secondary" | "inherit";
  icon: React.ReactNode;
  tooltip: string;
}

/** Callback para enviar solo el campo editado */
export interface CellSave<T extends RowData> {
  (rowId: string | number, field: keyof T, value: any): void;
}

interface PaginationProps {
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
}

export interface CustomTableProps<T extends RowData> {
  columns: Column[];
  data: T[];
  actions?: Action[];
  onActionClick: (action: Action, row: T) => void;
  pagination?: PaginationProps;
  onSaveCell?: CellSave<T>;
}

export default function CustomTable<T extends RowData>({
  columns,
  data,
  actions,
  onActionClick,
  pagination,
  onSaveCell,
}: CustomTableProps<T>) {
  // --------------------------------------
  // State interno
  // --------------------------------------
  const [tableData, setTableData] = useState<T[]>(data);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pagination?.rowsPerPage ?? 7);
  const [searchColumn, setSearchColumn] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /** Filtros adicionales */
  const [dateFrom, setDateFrom] = useState<string>(""); // formato "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState<string>(""); // formato "YYYY-MM-DD"
  const seguimientoOptions = ["EZEQUIEL", "DENIS", "MARTIN", "SIN_ASIGNAR"];
  const [siguiendoChecks, setSiguiendoChecks] = useState<string[]>([]);

  /** Para inline editing: fila y campo en edición */
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<any>("");

  /** =========== Ordenamiento =========== */
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  /** ========== Anchos dinámicos ========== */
  const totalCols = columns.length + (actions ? 1 : 0);
  const [widths, setWidths] = useState<number[]>(Array.from({ length: totalCols }, () => 150));

  /** Refs para resize */
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const activeColRef = useRef<number>(-1);

  // --------------------------------------
  // Effects: 
  // - cuando cambian data o totalCols, reiniciar estado de orden y anchuras
  // - resetear 'page' cuando cambian filtros u orden
  // --------------------------------------
  useEffect(() => {
    setTableData(data);
    setPage(0);
    setWidths(Array.from({ length: totalCols }, () => 150));
    setSortField(null);
    setSortDirection(null);
  }, [data, totalCols]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, searchColumn, sortField, sortDirection, dateFrom, dateTo, siguiendoChecks]);

  // --------------------------------------
  // Filtrado + Ordenamiento
  // --------------------------------------
  const filteredData = useMemo(() => {
    let temp = tableData;

    // 0) Filtrar por rango de fechas (createdAt) si se especifica
    if (dateFrom || dateTo) {
      temp = temp.filter((row) => {
        const raw = row["createdAt"];
        if (!raw) return false;
        const rowDate = new Date(raw).getTime();
        let valid = true;
        if (dateFrom) {
          const fromMs = new Date(dateFrom + "T00:00:00Z").getTime();
          valid = valid && rowDate >= fromMs;
        }
        if (dateTo) {
          const toMs = new Date(dateTo + "T23:59:59Z").getTime();
          valid = valid && rowDate <= toMs;
        }
        return valid;
      });
    }

    // 1) Filtrar por "siguiendo" si hay checks
    if (siguiendoChecks.length > 0) {
      temp = temp.filter((row) => {
        const s = row["siguiendo"];
        return s && siguiendoChecks.includes(s);
      });
    }

    // 2) Filtrar por búsqueda de columna
    if (searchColumn && searchTerm) {
      temp = temp.filter((row) => {
        let value: any = "";
        if (searchColumn.includes(".")) {
          const [parent, child] = searchColumn.split(".");
          value = row[parent] && row[parent][child] !== undefined ? row[parent][child] : "";
        } else {
          value = row[searchColumn] ?? "";
        }
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // 3) Ordenar si hay sortField y sortDirection
    if (sortField && sortDirection) {
      temp = [...temp].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        // Comparar números
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        // Comparar fechas ISO
        if (
          typeof aVal === "string" &&
          typeof bVal === "string" &&
          /\d{4}-\d{2}-\d{2}T/.test(aVal) &&
          /\d{4}-\d{2}-\d{2}T/.test(bVal)
        ) {
          const da = new Date(aVal).getTime();
          const db = new Date(bVal).getTime();
          return sortDirection === "asc" ? da - db : db - da;
        }

        // Comparar como cadenas
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        const cmp = aStr.localeCompare(bStr);
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return temp;
  }, [tableData, searchColumn, searchTerm, sortField, sortDirection, dateFrom, dateTo, siguiendoChecks]);

  // --------------------------------------
  // Paginación
  // --------------------------------------
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage, pagination]);

  const pageCount = pagination ? Math.ceil(filteredData.length / rowsPerPage) : 1;
  const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNextPage = () => {
    if (page < pageCount - 1) setPage((prev) => prev + 1);
  };
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // --------------------------------------
  // Resize de columnas: maneja mousedown, mousemove, mouseup
  // --------------------------------------
  const onMouseMove = (e: MouseEvent) => {
    if (activeColRef.current < 0) return;
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(startWidthRef.current + deltaX, 50);
    setWidths((prev) => {
      const copy = [...prev];
      copy[activeColRef.current] = newWidth;
      return copy;
    });
  };

  const onMouseUp = () => {
    activeColRef.current = -1;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    // PREVENIR que el click de resize dispare ordenamiento
    e.stopPropagation();
    activeColRef.current = index;
    startXRef.current = e.clientX;
    startWidthRef.current = widths[index];
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // --------------------------------------
  // Inline editing: doble clic, guardar, cancelar
  // --------------------------------------
  const handleCellDoubleClick = (rowIdx: number, field: string) => {
    const original = paginatedData[rowIdx][field];
    // Si es createdAt, extraer "YYYY-MM-DD"
    if (field === "createdAt" && original) {
      const isoDate = String(original).split("T")[0];
      setEditingValue(isoDate);
    } else {
      setEditingValue(original ?? "");
    }
    setEditingCell({ rowIndex: rowIdx, field });
  };

  const saveCell = () => {
    if (!editingCell) return;
    const { rowIndex, field } = editingCell;
    const currentRow = paginatedData[rowIndex];

    // Actualizar localmente
    setTableData((prev) => {
      const updated = [...prev];
      const realIdx = filteredData.findIndex((r) => r === paginatedData[rowIndex]);
      if (realIdx >= 0) {
        let newValue = editingValue;
        if (field === "createdAt") {
          // convertir de "YYYY-MM-DD" a ISO
          newValue = new Date(editingValue + "T00:00:00Z").toISOString();
        }
        updated[realIdx] = { ...updated[realIdx], [field]: newValue };
      }
      return updated;
    });

    // Notificar al padre
    const identifier = (currentRow as any).id || (currentRow as any)._id;
    if (onSaveCell && identifier) {
      let emittedValue = editingValue;
      if (field === "createdAt") {
        emittedValue = new Date(editingValue + "T00:00:00Z").toISOString();
      }
      onSaveCell(identifier, field as keyof T, emittedValue);
    }

    setEditingCell(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const tabFilteredData = paginatedData;

  /** Opciones para selects en ciertos campos */
  const actividades = ["CRIA", "RECRIA", "MIXTO", "DISTRIBUIDOR"];
  const medios = ["INSTAGRAM", "WEB", "WHATSAPP", "FACEBOOK", "OTRO"];
  const estados = ['PENDIENTE' ,'NO_CONTESTO' , 'SE_COTIZO_Y_PENDIENTE' , 'SE_COTIZO_Y_NO_INTERESO' , 'DERIVADO_A_DISTRIBUIDOR', 'COMPRO'];

  /** Formatear ISO a "YYYY/MM/DD" usando UTC  */ 
  const formatDateDisplay = (isoString: string) => {
    const d = new Date(isoString);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  };

  /** Alternar ordenamiento al hacer clic en el ícono (solo allí) */
  const handleSortClick = (field: string) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
    } else {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    }
  };

  /** Manejar cambio de checkboxes "siguiendo" */
  const handleSiguiendoChange = (opt: string) => {
    setSiguiendoChecks((prev) => {
      if (prev.includes(opt)) {
        return prev.filter((s) => s !== opt);
      } else {
        return [...prev, opt];
      }
    });
  };

  // --------------------------------------
  // Render general
  // --------------------------------------
  return (
    <div className="w-full">
      {/* ============== FILTROS RESPONSIVOS ============== */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
        {/* Fila 1: Filtro de búsqueda por columna */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full sm:w-auto min-w-0 sm:min-w-[180px]"
            value={searchColumn}
            onChange={(e) => {
              setSearchColumn(e.target.value);
              setSearchTerm("");
            }}
          >
            <option value="">Buscar por...</option>
            {columns.map((col) => (
              <option key={col.field} value={col.field}>
                {col.headerName}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 text-gray-700 flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Valor a buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!searchColumn}
          />
        </div>

        {/* Fila 2: Filtro de fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-gray-700 text-sm font-medium whitespace-nowrap">
              Desde:
            </label>
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full sm:flex-1"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-gray-700 text-sm font-medium whitespace-nowrap">
              Hasta:
            </label>
            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full sm:flex-1"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Fila 3: Filtro "siguiendo" por checkboxes */}
        <div className="space-y-2">
          <span className="text-gray-700 text-sm font-medium block">Siguiendo:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {seguimientoOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={siguiendoChecks.includes(opt)}
                  onChange={() => handleSiguiendoChange(opt)}
                  className="focus:ring-2 focus:ring-yellow-400 text-yellow-500"
                />
                <span className="text-gray-700 text-sm select-none">{opt.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ============== TABLA ============== */}
      <div className="overflow-x-auto overflow-y-visible border border-gray-200 rounded">
        <table className="table-fixed w-full text-left border-collapse">
          <thead className="bg-gray-800">
            <tr>
              {columns.map((col, colIndex) => {
                // Determinar flecha de orden ("▲" or "▼")
                let arrow = "";
                if (sortField === col.field) {
                  arrow = sortDirection === "asc" ? " ▲" : " ▼";
                }
                return (
                  <th
                    key={col.field}
                    style={{ width: widths[colIndex] }}
                    className={`relative px-4 py-2 text-sm font-semibold text-white ${col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      } sticky top-0`}
                  >
                    {/* 
                      Agrupamos el título y la flecha en un span que captura el click 
                      para ordenar. 
                    */}
                    <span
                      className="inline-flex items-center gap-1 cursor-pointer select-none"
                      onClick={() => handleSortClick(col.field)}
                    >
                      <span>{col.headerName}</span>
                      <span className="text-xs">{arrow}</span>
                    </span>

                    {/* 
                      Zona estrecha a la derecha: "resize handle". 
                      Solo responde a mousedown para redimensionar, 
                      y usamos e.stopPropagation() para evitar que dispare sort.
                    */}
                    <div
                      onMouseDown={(e) => handleMouseDown(colIndex, e)}
                      className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-gray-400"
                    />
                  </th>
                );
              })}

              {actions && (
                <th
                  style={{ width: widths[columns.length] }}
                  className="relative px-4 py-2 text-sm font-semibold text-white text-center sticky top-0"
                >
                  Acciones
                  <div
                    onMouseDown={(e) => handleMouseDown(columns.length, e)}
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-gray-400"
                  />
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {tabFilteredData.map((row, rowIndex) => {
              const isEven = rowIndex % 2 === 0;
              return (
                <tr key={rowIndex} className={isEven ? "bg-gray-50" : "bg-white"}>
                  {columns.map((col) => {
                    const isEditingThis =
                      editingCell?.rowIndex === rowIndex && editingCell.field === col.field;

                    // Obtener valor bruto
                    let rawValue: any = "-";
                    if (col.field.includes(".")) {
                      const [parent, child] = col.field.split(".");
                      rawValue = row[parent] && row[parent][child] !== undefined ? row[parent][child] : "-";
                    } else {
                      rawValue = row[col.field] ?? "-";
                    }

                    // Si es createdAt, formatear para mostrar
                    let displayValue: any = rawValue;
                    if (col.field === "createdAt" && rawValue !== "-") {
                      displayValue = formatDateDisplay(rawValue);
                    }

                    return (
                      <td
                        key={col.field}
                        className={`px-4 py-2 text-sm text-gray-700 ${col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                              ? "text-right"
                              : "text-left"
                          } overflow-visible relative z-10`}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, col.field)}
                      >
                        {isEditingThis ? (
                          <div className="relative w-full">
                            {/* ====== Campo "createdAt" ====== */}
                            {col.field === "createdAt" && (
                              <input
                                type="date"
                                value={editingValue || ""}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                            )}

                            {/* ====== Campo numérico ====== */}
                            {(col.field === "cabezas" || col.field === "mesesSuplemento") && (
                              <input
                                type="number"
                                value={editingValue}
                                onChange={(e) => setEditingValue(Number(e.target.value))}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                            )}

                            {/* ====== Campo "actividad" ====== */}
                            {col.field === "actividad" && (
                              <select
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {actividades.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* ====== Campo "medioAdquisicion" ====== */}
                            {col.field === "medioAdquisicion" && (
                              <select
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {medios.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* ====== Campo "estado" ====== */}
                            {col.field === "estado" && (
                              <select
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {estados.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* ====== Campo "siguiendo" ====== */}
                            {col.field === "siguiendo" && (
                              <select
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {seguimientoOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* ====== Texto estándar ====== */}
                            {!(
                              col.field === "createdAt" ||
                              col.field === "cabezas" ||
                              col.field === "mesesSuplemento" ||
                              col.field === "actividad" ||
                              col.field === "medioAdquisicion" ||
                              col.field === "estado" ||
                              col.field === "siguiendo"
                            ) && (
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                              )}

                            {/* Icono de guardar */}
                            <SaveIcon
                              onClick={saveCell}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800 cursor-pointer"
                              size={16}
                            />
                            {/* Icono de cancelar */}
                            <XIcon
                              onClick={cancelEdit}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800 cursor-pointer"
                              size={16}
                            />
                          </div>
                        ) : (
                          displayValue
                        )}
                      </td>
                    );
                  })}

                  {actions && (
                    <td className="px-4 py-2 text-sm text-center">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          className={`mx-1 p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${action.color === "primary"
                              ? "text-blue-600"
                              : action.color === "secondary"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          onClick={() => onActionClick(action, row as T)}
                          title={action.tooltip}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              );
            })}

            {tabFilteredData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No hay registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============== PAGINACIÓN ============== */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm">Filas por página:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            >
              {(pagination.rowsPerPageOptions ?? [7, 10, 25]).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-gray-700 text-sm">
            <button
              onClick={handlePrevPage}
              disabled={page === 0}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              ◀️
            </button>
            <span>
              Página {page + 1} de {pageCount || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page >= pageCount - 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              ▶️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
