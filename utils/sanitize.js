//frontend/utils/sanitize.js
// Convierte posibles variantes de QR a un Data URL válido (si ya viene como imagen)
// y expone el "contenido" del QR si no es imagen (para generarlo en el cliente).
export function normalizeQrData(input) {
  if (!input) return { dataUrl: null, content: null };

  let s = String(input).trim();

  // Quitar comillas envolventes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }

  // Quitar saltos de línea y espacios extra
  s = s.replace(/\s+/g, '');

  // Reparar "base 64," -> "base64,"
  s = s.replace(/base\s*64,/i, 'base64,');

  // Si ya es un data URL imagen válido
  if (/^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/i.test(s)) {
    return { dataUrl: s, content: null };
  }

  // Si empieza con data: pero no matchea exacto, intentar extraer payload
  if (s.startsWith('data:')) {
    const idx = s.indexOf(',');
    const payload = idx >= 0 ? s.slice(idx + 1) : '';
    if (/^[A-Za-z0-9+/=]+$/.test(payload)) {
      return { dataUrl: `data:image/png;base64,${payload}`, content: null };
    }
    // data: inválido → no podemos usarlo como imagen
    return { dataUrl: null, content: null };
  }

  // Si parece base64 puro → envolverlo como png
  if (/^[A-Za-z0-9+/=]+$/.test(s)) {
    return { dataUrl: `data:image/png;base64,${s}`, content: null };
  }

  // No es imagen/base64. Trátalo como "contenido" del QR (texto que hay que convertir a PNG)
  return { dataUrl: null, content: s };
}
