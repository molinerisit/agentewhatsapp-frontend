// Normaliza cualquier variante de QR que llegue (code/qrcode/base64/data-url)
export function normalizeQrData(input) {
  if (!input) return null;

  let s = String(input).trim();

  // Quitar comillas envolventes si viniera como JSON stringificado
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }

  // Quitar saltos de línea y espacios
  s = s.replace(/\s+/g, '');

  // Reparar "base 64," -> "base64,"
  s = s.replace(/base\s*64,/i, 'base64,');

  // Si ya es un data URL válido, usarlo tal cual
  if (/^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]+$/i.test(s)) {
    return s;
  }

  // Si empieza con "data:" pero no matchea, intentar forzar a png base64
  if (s.startsWith('data:')) {
    // extraer payload base64 si existe luego de la coma
    const idx = s.indexOf(',');
    const payload = idx >= 0 ? s.slice(idx + 1) : '';
    if (/^[A-Za-z0-9+/=]+$/.test(payload)) {
      return `data:image/png;base64,${payload}`;
    }
    return null; // irreparable
  }

  // Si parece base64 "puro" (sólo charset base64), envolverlo
  if (/^[A-Za-z0-9+/=]+$/.test(s)) {
    return `data:image/png;base64,${s}`;
  }

  // No es base64 ni data URL: no se puede renderizar como imagen
  return null;
}
