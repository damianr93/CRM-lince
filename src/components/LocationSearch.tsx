import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/utils/auth";

export type LocationOption = {
  id: string;
  label: string;
  pais?: string;
  provincia?: string;
  localidad?: string;
  zona?: string;
  lat?: number;
  lon?: number;
  displayName?: string;
  fuente?: string;
};

interface LocationSearchProps {
  value?: string;
  onSelect: (option: LocationOption) => void;
  onClear?: () => void;
  compact?: boolean;
}

const buildLabel = (option: LocationOption) => {
  const parts = [
    option.localidad,
    option.provincia,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : option.label;
};

export const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onSelect,
  onClear,
  compact,
}) => {
  const [query, setQuery] = useState(value ?? "");
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const normalizedValue = useMemo(() => value ?? "", [value]);

  useEffect(() => {
    setQuery(normalizedValue);
  }, [normalizedValue]);

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setOptions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        const response = await apiFetch(
          `${baseUrl}/geo/search?q=${encodeURIComponent(query.trim())}&limit=6`,
        );
        if (!response.ok) {
          throw new Error("No se pudo buscar la ubicación");
        }
        const data = (await response.json()) as LocationOption[];
        setOptions(data);
        setOpen(true);
      } catch (error) {
        setOptions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (option: LocationOption) => {
    onSelect(option);
    setQuery(buildLabel(option));
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setOptions([]);
    setOpen(false);
    onClear?.();
  };

  return (
    <div className="relative">
      <div className={`flex gap-2 ${compact ? "items-center" : ""}`}>
        <input
          type="text"
          placeholder="Buscar localidad, provincia o país"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`border border-input bg-background rounded w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${
            compact ? "px-2 py-1 text-sm" : "px-3 py-2"
          }`}
        />
        <button
          type="button"
          onClick={handleClear}
          className={`border border-input bg-background rounded text-foreground hover:bg-accent ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-2"
          }`}
        >
          Limpiar
        </button>
      </div>

      {loading && (
        <div className={`text-muted-foreground ${compact ? "text-[11px] mt-1" : "text-xs mt-1"}`}>
          Buscando ubicaciones...
        </div>
      )}

      {open && options.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg max-h-56 overflow-auto">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
            >
              <div className="font-medium text-popover-foreground">{buildLabel(option)}</div>
              <div className="text-xs text-muted-foreground">{option.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
