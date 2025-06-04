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

// Callback para enviar solo el campo editado
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
  const [tableData, setTableData] = useState<T[]>(data);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    pagination?.rowsPerPage ?? 7
  );
  const [searchColumn, setSearchColumn] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Para inline editing: fila y campo en edición
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    field: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<any>("");

  // =================== Ordenamiento ===================
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  // ================== Anchos dinámicos ==================
  const totalCols = columns.length + (actions ? 1 : 0);
  const [widths, setWidths] = useState<number[]>(
    Array.from({ length: totalCols }, () => 150)
  );

  // Refs para resize
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const activeColRef = useRef<number>(-1);

  useEffect(() => {
    setTableData(data);
    setPage(0);
    setWidths(Array.from({ length: totalCols }, () => 150));
    // si cambia data, reiniciamos orden también
    setSortField(null);
    setSortDirection(null);
  }, [data, totalCols]);

  // Resetear página al cambiar búsqueda, columna o orden
  useEffect(() => {
    setPage(0);
  }, [searchTerm, searchColumn, sortField, sortDirection]);

  // =================== Filtrado + Orden ===================
  const filteredData = useMemo(() => {
    let temp = tableData;

    // 1) Filtrar si hay searchColumn + searchTerm
    if (searchColumn && searchTerm) {
      temp = temp.filter((row) => {
        let value: any = "";
        if (searchColumn.includes(".")) {
          const [parent, child] = searchColumn.split(".");
          value =
            row[parent] && row[parent][child] !== undefined
              ? row[parent][child]
              : "";
        } else {
          value = row[searchColumn] ?? "";
        }
        return String(value)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    }

    // 2) Ordenar si sortField no es null
    if (sortField && sortDirection) {
      temp = [...temp].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        // Si ambos son números
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        // Si ambos parecen fechas ISO
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

        // Compara como cadenas por defecto
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        const cmp = aStr.localeCompare(bStr);
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return temp;
  }, [tableData, searchColumn, searchTerm, sortField, sortDirection]);

  // =================== Paginación ===================
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage, pagination]);

  const pageCount = pagination
    ? Math.ceil(filteredData.length / rowsPerPage)
    : 1;

  const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNextPage = () => {
    if (page < pageCount - 1) setPage((prev) => prev + 1);
  };
  const handleRowsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // =================== Resize de columnas ===================
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
    activeColRef.current = index;
    startXRef.current = e.clientX;
    startWidthRef.current = widths[index];
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // =================== Inline editing ===================
  const handleCellDoubleClick = (rowIdx: number, field: string) => {
    const original = paginatedData[rowIdx][field];
    // Si es createdAt y existe valor, extraemos directamente "YYYY-MM-DD"
    if (field === "createdAt" && original) {
      // original es algo como "2025-02-04T00:00:00.000Z"
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

    // 1) Actualizar localmente en tableData
    setTableData((prev) => {
      const updated = [...prev];
      const realIdx = filteredData.findIndex(
        (r) => r === paginatedData[rowIndex]
      );
      if (realIdx >= 0) {
        let newValue = editingValue;
        if (field === "createdAt") {
          // editingValue es "YYYY-MM-DD". Creamos ISO a medianoche UTC:
          newValue = new Date(editingValue + "T00:00:00.000Z").toISOString();
        }
        updated[realIdx] = { ...updated[realIdx], [field]: newValue };
      }
      return updated;
    });

    // 2) Notificar al padre sólo el campo modificado
    const identifier = (currentRow as any).id || (currentRow as any)._id;
    if (onSaveCell && identifier) {
      let emittedValue = editingValue;
      if (field === "createdAt") {
        emittedValue = new Date(editingValue + "T00:00:00.000Z").toISOString();
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

  // Opciones para select (si se usan más adelante)
  const actividades = ["CRIA", "RECRIA", "MIXTO", "DISTRIBUIDOR"];
  const medios = ["INSTAGRAM", "WEB", "WHATSAPP", "FACEBOOK", "OTRO"];
  const estados = ["PENDIENTE", "COMPRO", "NO_COMPRO"];

  // =================== Formatear ISO a "YYYY/MM/DD" usando UTC ===================
  const formatDateDisplay = (isoString: string) => {
    const d = new Date(isoString);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  };

  // =================== Manejo de clic en encabezado: alterna orden ===================
  const handleHeaderClick = (field: string) => {
    if (sortField !== field) {
      // Nueva columna, arrancar en asc
      setSortField(field);
      setSortDirection("asc");
    } else {
      // Si ya era asc, cambiar a desc
      if (sortDirection === "asc") {
        setSortDirection("desc");
      }
      // Si era desc, reset único (sin orden)
      else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    }
  };

  return (
    <div className="w-full">
      {/* ============== FILTROS ============== */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <select
          className="border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          className="border border-gray-300 rounded px-2 py-1 text-gray-700 flex-grow focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Valor a buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={!searchColumn}
        />
      </div>

      {/* ============== TABLA ============== */}
      <div className="overflow-x-auto overflow-y-visible border border-gray-200 rounded">
        <table className="table-fixed w-full text-left border-collapse">
          <thead className="bg-gray-800">
            <tr>
              {columns.map((col, colIndex) => {
                // Mostrar flecha de orden si corresponde
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
                      } sticky top-0 cursor-pointer select-none`}
                    onClick={() => handleHeaderClick(col.field)}
                  >
                    {col.headerName}
                    <span className="ml-1 text-xs">{arrow}</span>
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
                <tr
                  key={rowIndex}
                  className={isEven ? "bg-gray-50" : "bg-white"}
                >
                  {columns.map((col) => {
                    const isEditingThis =
                      editingCell?.rowIndex === rowIndex &&
                      editingCell.field === col.field;

                    // Obtener valor bruto
                    let rawValue: any = "-";
                    if (col.field.includes(".")) {
                      const [parent, child] = col.field.split(".");
                      rawValue =
                        row[parent] && row[parent][child] !== undefined
                          ? row[parent][child]
                          : "-";
                    } else {
                      rawValue = row[col.field] ?? "-";
                    }

                    // Si es createdAt, formateamos para mostrar
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
                        onDoubleClick={() =>
                          handleCellDoubleClick(rowIndex, col.field)
                        }
                      >
                        {isEditingThis ? (
                          <div className="relative w-full">
                            {/* ====== Campo "createdAt" ====== */}
                            {col.field === "createdAt" && (
                              <input
                                type="date"
                                value={editingValue || ""}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                            )}

                            {/* ====== Números ====== */}
                            {(col.field === "cabezas" ||
                              col.field === "mesesSuplemento") && (
                                <input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) =>
                                    setEditingValue(Number(e.target.value))
                                  }
                                  className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                              )}

                            {/* ====== actividad ====== */}
                            {col.field === "actividad" && (
                              <select
                                value={editingValue}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {actividades.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* ====== medioAdquisicion ====== */}
                            {col.field === "medioAdquisicion" && (
                              <select
                                value={editingValue}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {medios.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* ====== estado ====== */}
                            {col.field === "estado" && (
                              <select
                                value={editingValue}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {estados.map((opt) => (
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
                              col.field === "estado"
                            ) && (
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) =>
                                    setEditingValue(e.target.value)
                                  }
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
