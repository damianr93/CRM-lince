import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { productosLince } from "@/utils/productos";

interface ProductSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
    containerClassName?: string;
}

const productNames = productosLince.map((item) => item.name);

export default function ProductSelect({
    value,
    onChange,
    placeholder = "Seleccionar producto",
    autoFocus,
    className = "",
    containerClassName = "",
}: ProductSelectProps) {
    const [inputValue, setInputValue] = useState(value ?? "");
    const [open, setOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value ?? "");
    }, [value]);

    // Actualizar posición del dropdown
    const updateDropdownPosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (!open) return;

        // Actualizar posición inicial
        updateDropdownPosition();

        const handleClickOutside = (event: MouseEvent) => {
            const container = containerRef.current;
            if (!container) return;
            
            // Verificar si el click fue en el dropdown
            const dropdownElement = document.getElementById('product-select-dropdown');
            if (dropdownElement && dropdownElement.contains(event.target as Node)) {
                return;
            }
            
            if (container.contains(event.target as Node)) {
                return;
            }
            closeDropdown();
        };

        const handleScroll = () => {
            updateDropdownPosition();
        };

        const handleResize = () => {
            updateDropdownPosition();
        };

        window.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);
        
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
        };
    }, [open, value]);

    const closeDropdown = () => {
        setOpen(false);
        if (!value) {
            setInputValue("");
            return;
        }
        const exactMatch = productNames.find(
            (name) => name.toLowerCase() === value.toLowerCase()
        );
        setInputValue(exactMatch ?? value);
    };

    const filteredOptions = useMemo(() => {
        const normalized = inputValue.trim().toLowerCase();
        if (!normalized) {
            return productNames;
        }
        return productNames.filter((name) =>
            name.toLowerCase().includes(normalized)
        );
    }, [inputValue]);

    const handleOptionSelect = (option: string) => {
        setInputValue(option);
        onChange(option);
        setOpen(false);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setInputValue(newValue);
        setOpen(true);

        const exactMatch = productNames.find(
            (name) => name.toLowerCase() === newValue.trim().toLowerCase()
        );

        if (exactMatch) {
            onChange(exactMatch);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (filteredOptions.length > 0) {
                handleOptionSelect(filteredOptions[0]);
            }
        }

        if (event.key === "Escape") {
            event.stopPropagation();
            closeDropdown();
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full bg-white rounded shadow-sm ${containerClassName}`}
        >
            <input
                value={inputValue}
                onFocus={() => {
                    updateDropdownPosition();
                    setOpen(true);
                }}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className={`border border-gray-400 rounded px-2 py-1 text-sm w-full pr-12 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${className}`}
            />
            {inputValue && (
                <button
                    type="button"
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                        setInputValue("");
                        onChange("");
                        setOpen(false);
                    }}
                    aria-label="Limpiar seleccion"
                >
                    x
                </button>
            )}
            {open && createPortal(
                <div 
                    id="product-select-dropdown"
                    className="bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-y-auto"
                    style={{
                        position: 'absolute',
                        zIndex: 9999,
                        width: `${dropdownPosition.width}px`,
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleOptionSelect(option)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-yellow-100 ${
                                    option === value ? "bg-yellow-50" : ""
                                }`}
                            >
                                {option}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                            Sin coincidencias
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
