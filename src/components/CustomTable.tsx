import React, { useState, useMemo, useEffect, useRef } from "react";
import { SaveIcon, XIcon } from "lucide-react";
import { formatDisplayValue } from "../utils/dataCleaner";
import ProductSelect from "./ProductSelect";

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
  const [widths, setWidths] = useState<number[]>(() => {
    // Anchos específicos por tipo de columna
    return columns.map(col => {
      switch (col.field) {
        case 'nombre':
        case 'apellido':
        case 'producto':
        case 'localidad':
          return 180;
        case 'telefono':
        case 'correo':
          return 160;
        case 'cabezas':
        case 'mesesSuplemento':
          return 100;
        case 'actividad':
        case 'estado':
        case 'siguiendo':
          return 140;
        case 'observaciones':
          return 200;
        case 'createdAt':
          return 120;
        default:
          return 150;
      }
    }).concat(actions ? [120] : []); // Ancho para columna de acciones
  });

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
    // Reiniciar anchos con valores específicos por columna
    setWidths(() => {
      return columns.map(col => {
        switch (col.field) {
          case 'nombre':
          case 'apellido':
          case 'producto':
          case 'localidad':
            return 180;
          case 'telefono':
          case 'correo':
            return 160;
          case 'cabezas':
          case 'mesesSuplemento':
            return 100;
          case 'actividad':
          case 'estado':
          case 'siguiendo':
            return 140;
          case 'observaciones':
            return 200;
          case 'createdAt':
            return 120;
          default:
            return 150;
        }
      }).concat(actions ? [120] : []);
    });
    setSortField(null);
    setSortDirection(null);
  }, [data, totalCols, columns, actions]);

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
    const newWidth = Math.max(startWidthRef.current + deltaX, 80); // Ancho mínimo más razonable
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
        } else if (field === "producto" && typeof editingValue === "string") {
          newValue = editingValue.trim();
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
      } else if (field === "producto" && typeof editingValue === "string") {
        emittedValue = editingValue.trim();
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
      <div className="bg-gray-800/60 border border-gray-700/40 p-4 rounded-lg mb-4 space-y-4">
        {/* Fila 1: Filtro de búsqueda por columna */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="border border-gray-700 bg-gray-800/80 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 w-full sm:w-auto min-w-0 sm:min-w-[180px]"
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
            className="border border-gray-700 bg-gray-800/80 rounded-lg px-3 py-2 text-neutral-200 flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 placeholder:text-neutral-500"
            placeholder="Valor a buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!searchColumn}
          />
        </div>

        {/* Fila 2: Filtro de fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-neutral-300 text-sm font-medium whitespace-nowrap">
              Desde:
            </label>
            <input
              type="date"
              className="border border-gray-700 bg-gray-800/80 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 w-full sm:flex-1"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-neutral-300 text-sm font-medium whitespace-nowrap">
              Hasta:
            </label>
            <input
              type="date"
              className="border border-gray-700 bg-gray-800/80 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 w-full sm:flex-1"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Fila 3: Filtro "siguiendo" por checkboxes */}
        <div className="space-y-2">
          <span className="text-neutral-300 text-sm font-medium block">Siguiendo:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {seguimientoOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 p-2 bg-gray-800/80 rounded-lg border border-gray-700 hover:border-yellow-400/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={siguiendoChecks.includes(opt)}
                  onChange={() => handleSiguiendoChange(opt)}
                  className="focus:ring-2 focus:ring-yellow-400/50 text-yellow-500"
                />
                <span className="text-neutral-200 text-sm select-none">{opt.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ============== TABLA ============== */}
      <div className="overflow-x-auto border border-gray-700/50 rounded-xl">
        <table className="table-fixed w-full text-left border-collapse">
          <thead className="bg-gray-800/70">
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
                    className={`relative px-4 py-2 text-sm font-semibold text-neutral-200 ${col.align === "center"
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
                  className="relative px-4 py-2 text-sm font-semibold text-neutral-200 text-center sticky top-0"
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
              return (
                <tr key={rowIndex} className="border-t border-gray-700/40 hover:bg-gray-800/40">
                  {columns.map((col, colIndex) => {
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

                    // Limpiar y formatear el valor para mostrar
                    let displayValue: any = formatDisplayValue(rawValue, col.field);
                    
                    // Si es createdAt, formatear para mostrar
                    if (col.field === "createdAt" && rawValue !== "-" && rawValue) {
                      displayValue = formatDateDisplay(rawValue);
                    }

                    // Si es observaciones, truncar si es muy largo
                    if (col.field === "observaciones" && displayValue !== "-" && displayValue && displayValue.length > 50) {
                      displayValue = displayValue.substring(0, 50) + "...";
                    }

                    return (
                      <td
                        key={col.field}
                        className={`px-4 py-2 text-sm text-neutral-200 ${col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                              ? "text-right"
                              : "text-left"
                          } relative z-10`}
                        style={{ 
                          maxWidth: widths[colIndex],
                          overflow: isEditingThis ? 'visible' : 'hidden',
                          textOverflow: isEditingThis ? 'clip' : 'ellipsis',
                          whiteSpace: isEditingThis ? 'normal' : 'nowrap',
                          backgroundColor: isEditingThis ? '#ffffff' : undefined
                        }}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, col.field)}
                      >
                        {isEditingThis ? (
                          <div className="relative z-20 w-full bg-white rounded-md shadow-sm">
                            {/* ====== Campo "createdAt" ====== */}
                            {col.field === "createdAt" && (
                              <input
                                type="date"
                                value={editingValue || ""}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                            )}

                            {/* ====== Campo de texto (cabezas y meses) ====== */}
                            {(col.field === "cabezas" || col.field === "mesesSuplemento") && (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                            )}

                            {/* ====== Campo "actividad" ====== */}
                            {col.field === "actividad" && (
                              <select
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              >
                                {seguimientoOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* ====== Campo "observaciones" (textarea) ====== */}
                            {col.field === "observaciones" && (
                              <textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                                rows={3}
                                placeholder="Agregar observaciones..."
                              />
                            )}

                            {/* ====== Campo "producto" (seleccion buscable) ====== */}
                            {col.field === "producto" && (
                              <ProductSelect
                                value={editingValue ?? ""}
                                onChange={(newValue) => setEditingValue(newValue)}
                                autoFocus
                              />
                            )}

                            {/* ====== Texto estandar ====== */}
                            {!(
                              col.field === "createdAt" ||
                              col.field === "cabezas" ||
                              col.field === "mesesSuplemento" ||
                              col.field === "actividad" ||
                              col.field === "medioAdquisicion" ||
                              col.field === "estado" ||
                              col.field === "siguiendo" ||
                              col.field === "observaciones" ||
                              col.field === "producto"
                            ) && (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="border border-gray-400 rounded px-2 py-1 text-sm w-full pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                          <div 
                            className={`cursor-help ${rawValue !== "-" && rawValue && rawValue !== displayValue ? "text-blue-600" : ""}`}
                            title={rawValue !== "-" && rawValue && rawValue !== displayValue ? rawValue : undefined}
                          >
                            {displayValue}
                            {rawValue !== "-" && rawValue && rawValue !== displayValue && (
                              <span className="text-gray-400 ml-1">⋯</span>
                            )}
                          </div>
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
                  className="px-4 py-6 text-center text-neutral-400"
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
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
          <span className="text-sm text-neutral-400">
            Página {page + 1} de {pageCount || 1} · {filteredData.length} resultados
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Filas por página:</span>
            <select
              className="px-2 py-1 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
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
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={page === 0}
              className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200 disabled:opacity-50 hover:border-yellow-400/50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
            >
              Anterior
            </button>
            <button
              onClick={handleNextPage}
              disabled={page >= pageCount - 1}
              className="px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-neutral-200 disabled:opacity-50 hover:border-yellow-400/50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
