"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileCode2, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExportCSV: () => void;
  onExportXML: () => void;
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

  const handleCSV = () => {
    setOpen(false);
    onExportCSV();
  };

  const handleXML = () => {
    setOpen(false);
    onExportXML();
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
