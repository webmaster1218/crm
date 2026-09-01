"use client";

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, FileText, CheckCircle2, MessageSquare, Tag, ShieldAlert } from 'lucide-react';
import { Button } from '../shared/Button';
import Swal from 'sweetalert2';

interface ArchiveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | string | null;
  orderName?: string;
  clientName?: string;
  currentNote?: string;
  onSuccess: (orderId: number | string, note: string) => void;
}

const PRESET_REASONS = [
  { id: 'no_interesado', label: 'Cliente no interesado / Canceló pedido', icon: '🚫' },
  { id: 'no_responde', label: 'No contesta llamadas ni WhatsApp', icon: '📵' },
  { id: 'precio_alto', label: 'Precio o costo de flete elevado', icon: '💸' },
  { id: 'competencia', label: 'Compró en otra tienda / competencia', icon: '🏬' },
  { id: 'datos_erroneos', label: 'Datos de contacto o entrega inválidos', icon: '📍' },
  { id: 'duplicado', label: 'Pedido duplicado o de prueba', icon: '🔄' },
];

export function ArchiveOrderModal({
  isOpen,
  onClose,
  orderId,
  orderName,
  clientName,
  currentNote = '',
  onSuccess
}: ArchiveOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [noteText, setNoteText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNoteText(currentNote || '');
      const match = PRESET_REASONS.find(r => r.label === currentNote);
      setSelectedReason(match ? match.label : '');
      setError(null);
    }
  }, [isOpen, currentNote]);

  if (!isOpen || !orderId) return null;

  const handleSelectReason = (label: string) => {
    setSelectedReason(label);
    setNoteText(label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = noteText.trim() || selectedReason || 'Cliente no interesado';

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pedidos/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: 'ARCHIVADO',
          notas: finalNote
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al archivar el pedido.');
      }

      const isDark = document.documentElement.classList.contains('dark');
      Swal.fire({
        title: 'Pedido Archivado',
        text: 'El pedido ha sido archivado con su nota explicativa.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        customClass: {
          popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
        }
      });

      onSuccess(orderId, finalNote);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al archivar el pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-card rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/15 text-rose-500 rounded-2xl">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-text-primary tracking-tight">
                Archivar Pedido
              </h3>
              <p className="text-xs text-text-muted font-medium">
                {orderName ? `Pedido ${orderName}` : `ID: ${orderId}`} {clientName ? `· ${clientName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-hover rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-text-muted mb-2">
              Seleccionar motivo rápido:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_REASONS.map((preset) => {
                const isSelected = selectedReason === preset.label;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectReason(preset.label)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'bg-card-alt border-slate-200/60 dark:border-slate-800 text-text-secondary hover:border-slate-300 dark:hover:border-slate-700 hover:text-text-primary'
                    }`}
                  >
                    <span className="text-sm">{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                Nota explicativa / Observaciones:
              </label>
              <span className="text-[10px] text-text-muted">
                {noteText.length}/500 caracteres
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value);
                if (selectedReason && e.target.value !== selectedReason) {
                  setSelectedReason('');
                }
              }}
              placeholder="Explica el motivo por el cual se archiva el pedido (ej. Cliente no interesado por el tiempo de entrega o costo)..."
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none font-medium leading-relaxed"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              Al archivar, este pedido dejará de aparecer en la lista de espera y quedará registrado en el historial de pedidos archivados con esta nota.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="h-10 px-5 text-xs font-black uppercase tracking-wider rounded-xl bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md shadow-rose-600/20 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Archivando...</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Archivar Pedido</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
