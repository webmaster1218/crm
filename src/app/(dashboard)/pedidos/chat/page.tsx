"use client";

import React from 'react';
import { MessageSquare, Search, Filter } from 'lucide-react';

export default function ChatPedidosPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 md:px-6 py-4 animate-in fade-in duration-500">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
              Pedidos <span className="text-brand">Chat</span>
            </h1>
          </div>
          <p className="text-text-muted font-medium text-xs mt-1">
            Pedidos creados desde conversaciones de WhatsApp y Web Chat.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pedidos</p>
          <span className="text-lg font-black text-text-primary">0</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Artículos</p>
          <span className="text-lg font-black text-text-primary">0</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pendientes</p>
          <span className="text-lg font-black text-text-muted">0</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Preparados</p>
          <span className="text-lg font-black text-text-muted">0</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Entregados</p>
          <span className="text-lg font-black text-text-muted">0</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Devoluciones</p>
          <span className="text-lg font-black text-text-muted">$0</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-card p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido o etiqueta..."
            disabled
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-ring opacity-50 cursor-not-allowed"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider border-slate-200/50 dark:border-slate-800 text-text-muted opacity-50 cursor-not-allowed"
          >
            <Filter size={14} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Empty Table Container */}
      <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Pedido</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Canal</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Pago</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Prep.</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Entrega</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Envío</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Arts.</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Etiquetas</th>
                <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={12} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-center">
                      <MessageSquare size={20} className="text-text-muted/40" />
                    </div>
                    <p className="text-text-muted font-black text-sm uppercase tracking-wider">No hay pedidos de chat</p>
                    <p className="text-text-muted text-xs max-w-md">Los pedidos que los agentes registren manualmente en conversaciones aparecerán aquí.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-[10px] font-bold text-text-muted text-right">
        0 pedidos
      </div>

    </div>
  );
}
