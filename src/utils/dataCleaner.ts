/**
 * Utilidades para limpiar datos del CRM y ManyChat
 */

/**
 * Detecta si un valor es un placeholder de ManyChat/CRM
 */
export const isPlaceholder = (value: any): boolean => {
  if (!value || value === null || value === undefined) {
    return true;
  }

  const stringValue = String(value).trim();
  
  // Si está vacío
  if (stringValue === '') {
    return true;
  }

  // Detectar placeholders de ManyChat/CRM
  if (stringValue.includes('{{cuf_') || 
      stringValue.includes('{{') || 
      stringValue.includes('}}') ||
      stringValue.match(/^\{\{[^}]+\}\}$/)) {
    return true;
  }

  // Detectar otros patrones comunes de placeholders
  if (stringValue.match(/^[a-zA-Z_]+_\d+$/) && stringValue.length > 10) {
    return true;
  }

  // Detectar valores genéricos sin sentido
  const genericValues = [
    'null', 'undefined', 'N/A', 'n/a', 'NA', 'na', 
    'sin datos', 'sin informacion', 'no disponible',
    'placeholder', 'test', 'ejemplo', 'demo'
  ];
  
  if (genericValues.includes(stringValue.toLowerCase())) {
    return true;
  }

  return false;
};

/**
 * Limpia un valor individual
 */
export const cleanValue = (value: any): string | null => {
  if (isPlaceholder(value)) {
    return null;
  }
  return String(value).trim();
};

/**
 * Limpia un objeto cliente completo
 */
export const cleanClientData = (client: any): any => {
  const cleaned = { ...client };

  // Limpiar todos los campos de texto
  const textFields = [
    'nombre', 'apellido', 'telefono', 'correo', 'producto', 
    'localidad', 'provincia', 'observaciones', 'cabezas', 'mesesSuplemento'
  ];

  textFields.forEach(field => {
    cleaned[field] = cleanValue(cleaned[field]);
  });

  // Limpiar campos de selección
  const selectFields = ['actividad', 'medioAdquisicion', 'estado', 'siguiendo'];
  
  selectFields.forEach(field => {
    const cleanedValue = cleanValue(cleaned[field]);
    if (cleanedValue) {
      cleaned[field] = cleanedValue;
    } else {
      // Asignar valores por defecto si están vacíos
      switch (field) {
        case 'actividad':
          cleaned[field] = 'CRIA';
          break;
        case 'medioAdquisicion':
          cleaned[field] = 'OTRO';
          break;
        case 'estado':
          cleaned[field] = 'PENDIENTE';
          break;
        case 'siguiendo':
          cleaned[field] = 'SIN_ASIGNAR';
          break;
      }
    }
  });

  return cleaned;
};

/**
 * Formatea un valor para mostrar en la tabla
 */
export const formatDisplayValue = (value: any, field: string): string => {
  const cleaned = cleanValue(value);
  
  if (!cleaned) {
    return '-';
  }

  // Formateo específico por campo
  switch (field) {
    case 'telefono':
      // Formatear teléfono si es posible
      const phone = cleaned.replace(/\D/g, '');
      if (phone.length >= 8) {
        return phone;
      }
      return cleaned;
    
    case 'correo':
      // Validar formato básico de email
      if (cleaned.includes('@') && cleaned.includes('.')) {
        return cleaned;
      }
      return '-';
    
    default:
      return cleaned;
  }
};

/**
 * Verifica si un cliente tiene datos válidos mínimos
 */
export const hasValidData = (client: any): boolean => {
  const cleaned = cleanClientData(client);
  
  // Debe tener al menos nombre
  return !!(cleaned.nombre && cleaned.nombre !== '-');
};
