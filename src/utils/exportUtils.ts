/**
 * exportUtils.ts
 * Shared export utilities — generates real .xlsx files via SheetJS (xlsx)
 * and well-formed .xml files for all CRM views.
 */

import * as XLSX from 'xlsx';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

// ─────────────────────────────────────────
// Excel (.xlsx) Export  ← real Excel format
// ─────────────────────────────────────────

/**
 * Exports rows to a real .xlsx file using SheetJS.
 * The first row will be the header (bold + colored background in supported readers).
 *
 * @param headers  - Column display names (in order)
 * @param rows     - Array of objects; keys must match headers array
 * @param filename - Output filename (without extension)
 */
export function exportToExcel(
  headers: string[],
  rows: ExportRow[],
  filename: string
): void {
  // Build the 2D array: first row = headers, then data rows
  const sheetData: (string | number | boolean | null | undefined)[][] = [
    headers,
    ...rows.map(row => headers.map(h => row[h] ?? '')),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column widths — auto-size based on longest value
  const colWidths = headers.map((h, colIdx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(row => String(row[h] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  // Style the header row (bold, green background)
  // SheetJS CE (community edition) supports basic cell styles
  headers.forEach((_, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    if (!ws[cellRef]) return;
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '16A34A' } }, // emerald-600
      alignment: { horizontal: 'center' },
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  // Write and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Alias kept for backward compatibility
export const exportToCSV = exportToExcel;

// ─────────────────────────────────────────
// XML Export
// ─────────────────────────────────────────

/**
 * Exports an array of rows to a well-formed XML file.
 *
 * @param headers  - Column names (used as XML element tags, sanitized)
 * @param rows     - Array of objects
 * @param filename - Output filename (without extension)
 * @param rootTag  - Root XML element name (default: 'Exportacion')
 * @param rowTag   - Row XML element name (default: 'Registro')
 * @param meta     - Optional metadata attributes for the root element
 */
export function exportToXML(
  headers: string[],
  rows: ExportRow[],
  filename: string,
  rootTag = 'Exportacion',
  rowTag = 'Registro',
  meta: Record<string, string> = {}
): void {
  const sanitizeTag = (s: string) =>
    s.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/^([^a-zA-Z_])/, '_$1');

  const escapeXML = (val: unknown): string => {
    const str = val === null || val === undefined ? '' : String(val);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const metaAttrs = Object.entries({
    fecha: new Date().toISOString().slice(0, 10),
    total: String(rows.length),
    ...meta,
  })
    .map(([k, v]) => ` ${sanitizeTag(k)}="${escapeXML(v)}"`)
    .join('');

  const rowsXML = rows
    .map(row => {
      const fields = headers
        .map(h => {
          const tag = sanitizeTag(h);
          return `    <${tag}>${escapeXML(row[h])}</${tag}>`;
        })
        .join('\n');
      return `  <${sanitizeTag(rowTag)}>\n${fields}\n  </${sanitizeTag(rowTag)}>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${sanitizeTag(rootTag)}${metaAttrs}>\n${rowsXML}\n</${sanitizeTag(rootTag)}>`;

  triggerDownload(xml, `${filename}.xml`, 'application/xml;charset=utf-8;');
}

// ─────────────────────────────────────────
// INFO TELOCALIZO TAG — Financial helpers
// ─────────────────────────────────────────

export interface FinancialOrderRow {
  pedido: string;
  canal: string;
  fecha: string;
  cliente: string;
  ciudad: string;
  metodoPago: string;
  ingresoBruto: number;
  cogs: number;
  flete: number;
  comisionBold: number;
  utilidadNeta: number;
  accesoApp: string;
}

export const FINANCIAL_HEADERS = [
  'Pedido',
  'Canal',
  'Fecha',
  'Cliente',
  'Ciudad',
  'Metodo Pago',
  'Ingreso Bruto',
  'COGS (Equipos)',
  'Flete',
  'Comision Bold',
  'Utilidad Neta',
  'Acceso App',
];

/**
 * Maps a FinancialOrderRow to the standard header keys for Excel/XML.
 */
export function mapFinancialRow(r: FinancialOrderRow): ExportRow {
  return {
    'Pedido': r.pedido,
    'Canal': r.canal,
    'Fecha': r.fecha,
    'Cliente': r.cliente,
    'Ciudad': r.ciudad,
    'Metodo Pago': r.metodoPago,
    'Ingreso Bruto': r.ingresoBruto,
    'COGS (Equipos)': r.cogs,
    'Flete': r.flete,
    'Comision Bold': Math.round(r.comisionBold),
    'Utilidad Neta': Math.round(r.utilidadNeta),
    'Acceso App': r.accesoApp,
  };
}

/**
 * Builds a totals summary row for financial exports.
 */
export function buildTotalsRow(rows: FinancialOrderRow[]): ExportRow {
  return {
    'Pedido': 'TOTALES',
    'Canal': '',
    'Fecha': '',
    'Cliente': `${rows.length} pedidos`,
    'Ciudad': '',
    'Metodo Pago': '',
    'Ingreso Bruto': rows.reduce((s, r) => s + r.ingresoBruto, 0),
    'COGS (Equipos)': rows.reduce((s, r) => s + r.cogs, 0),
    'Flete': rows.reduce((s, r) => s + r.flete, 0),
    'Comision Bold': Math.round(rows.reduce((s, r) => s + r.comisionBold, 0)),
    'Utilidad Neta': Math.round(rows.reduce((s, r) => s + r.utilidadNeta, 0)),
    'Acceso App': '',
  };
}

// ─────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
