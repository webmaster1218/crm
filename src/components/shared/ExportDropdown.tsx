"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileCode2, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';

interface ExportDropdownProps {
  onExportCSV: (dateFrom?: string, dateTo?: string) => void;
  onExportXML: (dateFrom?: string, dateTo?: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ExportDropdown({
  onExportCSV,
  onExportXML,
  disabled = false,
  label = 'Exportar',
  className = '',
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const promptDatesAndExport = async (exportFn: (dateFrom?: string, dateTo?: string) => void) => {
    const isDark = document.documentElement.classList.contains('dark');
    
    const { value: formValues } = await Swal.fire({
      title: 'Rango de fechas para exportar',
      html: `
        <div class="flex flex-col gap-3 text-left">
          <p class="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">
            Deja los campos vacíos si deseas exportar todo según el filtro de la pantalla actual.
          </p>
          <div>
            <label class="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Fecha Desde (Opcional):</label>
            <input id="swal-export-from" type="date" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20">
          </div>
          <div>
            <label class="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">Fecha Hasta (Opcional):</label>
            <input id="swal-export-to" type="date" class="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Exportar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#374151',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
      },
      preConfirm: () => {
        return {
          dateFrom: (document.getElementById('swal-export-from') as HTMLInputElement).value,
          dateTo: (document.getElementById('swal-export-to') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      exportFn(formValues.dateFrom, formValues.dateTo);
    }
  };

  const handleCSV = () => {
    setOpen(false);
    promptDatesAndExport(onExportCSV);
  };

  const handleXML = () => {
    setOpen(false);
    promptDatesAndExport(onExportXML);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none`}
      >
        <Download size={13} />
        <span>{label}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-slate-200/60 dark:border-slate-700/80 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Formato de exportación</p>
          </div>

          <button
            onClick={handleCSV}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors text-left group"
          >
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <FileSpreadsheet size={13} />
            </div>
            <div>
              <p className="font-black text-text-primary">Excel (.xlsx)</p>
              <p className="text-[9px] text-text-muted">Compatible con Excel y Sheets</p>
            </div>
          </button>

          <button
            onClick={handleXML}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors text-left group"
          >
            <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <FileCode2 size={13} />
            </div>
            <div>
              <p className="font-black text-text-primary">XML</p>
              <p className="text-[9px] text-text-muted">Formato estructurado estándar</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
