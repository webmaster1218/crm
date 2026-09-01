"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ClipboardCheck, Search, Filter, RefreshCw, CheckCircle2, AlertCircle,
  User, Mail, Phone, MapPin, Calendar, ShoppingCart, DollarSign, ExternalLink,
  FileText, MessageSquare
} from 'lucide-react';
import { Button } from '../../../../components/shared/Button';
import { Badge } from '../../../../components/shared/Badge';
import { ExportDropdown } from '../../../../components/shared/ExportDropdown';
import { exportToCSV, exportToXML } from '../../../../utils/exportUtils';
import Swal from 'sweetalert2';
import { CreateManualOrderModal } from '../../../../components/orders/CreateManualOrderModal';
import { ArchiveOrderModal } from '../../../../components/orders/ArchiveOrderModal';

interface PedidoPorConfirmar {
  id: number;
  shopify_order_id: number;
  external_order_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  quantity: number;
  metodo_pago: string;
  status: 'COMFIRMADO' | 'ESPERANDO_COMFIRMACION' | 'ARCHIVADO';
  notas?: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function PedidosConfirmarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pedidos, setPedidos] = useState<PedidoPorConfirmar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ESPERANDO_COMFIRMACION' | 'COMFIRMADO' | 'ARCHIVADO'>('ESPERANDO_COMFIRMACION');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  
  // Create sale modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPedidoPrefill, setSelectedPedidoPrefill] = useState<PedidoPorConfirmar | null>(null);

  // Archive modal states
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedArchivePedido, setSelectedArchivePedido] = useState<PedidoPorConfirmar | null>(null);

  const fetchPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pedidos/confirmar', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al obtener los pedidos por confirmar.');
      const data = await res.json();
      setPedidos(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const handleOpenArchiveModal = (pedido: PedidoPorConfirmar) => {
    setSelectedArchivePedido(pedido);
    setShowArchiveModal(true);
  };

  const filteredPedidos = pedidos.filter(p => {
    // Search filter
    const matchesSearch = 
      String(p.external_order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.city || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    // ALL filter should show everything EXCEPT archived/cancelled orders to keep dashboard clean
    const matchesStatus = 
      statusFilter === 'ALL' 
        ? p.status !== 'ARCHIVADO' 
        : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getPaymentBadge = (metodo: string) => {
    const m = String(metodo).toLowerCase();
    if (m === 'paid' || m === 'pagado') {
      return <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Pagado</Badge>;
    }
    return <Badge variant="warning" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendiente</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMFIRMADO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 size={10} />
          Confirmado
        </span>
      );
    }
    if (status === 'ARCHIVADO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
          <AlertCircle size={10} />
          Archivado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 animate-pulse">
        <AlertCircle size={10} />
        Esperando
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 w-full md:px-2 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
              Pedidos <span className="text-brand">Por Confirmar</span>
            </h1>
          </div>
          <p className="text-text-muted font-medium text-xs mt-1">
            Gestiona y confirma pedidos manuales o pendientes de validación antes de su envío.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchPedidos} disabled={loading} className="flex items-center gap-2 h-9 text-[11px]">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </Button>
          <ExportDropdown
            label="Exportar"
            disabled={loading || pedidos.length === 0}
            onExportCSV={(dateFrom, dateTo) => {
              const headers = ['ID', 'Pedido Shopify', 'Cliente', 'Email', 'Teléfono', 'Ciudad', 'Dirección', 'Cantidad', 'Método Pago', 'Estado', 'Creado', 'Confirmado'];
              let exportSource = filteredPedidos;
              if (dateFrom || dateTo) {
                exportSource = filteredPedidos.filter(p => {
                  const orderDate = new Date(p.created_at);
                  const matchesFrom = !dateFrom || orderDate >= new Date(dateFrom);
                  const matchesTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
                  return matchesFrom && matchesTo;
                });
              }
              const rows = exportSource.map(p => ({
                'ID': p.id,
                'Pedido Shopify': p.external_order_id || p.shopify_order_id || '—',
                'Cliente': p.name || '—',
                'Email': p.email || '—',
                'Teléfono': p.phone || '—',
                'Ciudad': p.city || '—',
                'Dirección': p.address || '—',
                'Cantidad': p.quantity,
                'Método Pago': p.metodo_pago || '—',
                'Estado': p.status === 'COMFIRMADO' ? 'Confirmado' : 'Esperando Confirmación',
                'Creado': formatDate(p.created_at),
                'Confirmado': p.confirmed_at ? formatDate(p.confirmed_at) : '—',
              }));
              exportToCSV(headers, rows, `pedidos_confirmar_${new Date().toISOString().slice(0,10)}`);
            }}
            onExportXML={(dateFrom, dateTo) => {
              const headers = ['ID', 'Pedido Shopify', 'Cliente', 'Email', 'Teléfono', 'Ciudad', 'Dirección', 'Cantidad', 'Método Pago', 'Estado', 'Creado', 'Confirmado'];
              let exportSource = filteredPedidos;
              if (dateFrom || dateTo) {
                exportSource = filteredPedidos.filter(p => {
                  const orderDate = new Date(p.created_at);
                  const matchesFrom = !dateFrom || orderDate >= new Date(dateFrom);
                  const matchesTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
                  return matchesFrom && matchesTo;
                });
              }
              const rows = exportSource.map(p => ({
                'ID': p.id,
                'Pedido Shopify': p.external_order_id || p.shopify_order_id || '—',
                'Cliente': p.name || '—',
                'Email': p.email || '—',
                'Teléfono': p.phone || '—',
                'Ciudad': p.city || '—',
                'Dirección': p.address || '—',
                'Cantidad': p.quantity,
                'Método Pago': p.metodo_pago || '—',
                'Estado': p.status === 'COMFIRMADO' ? 'Confirmado' : 'Esperando Confirmación',
                'Creado': formatDate(p.created_at),
                'Confirmado': p.confirmed_at ? formatDate(p.confirmed_at) : '—',
              }));
              exportToXML(headers, rows, `pedidos_confirmar_${new Date().toISOString().slice(0,10)}`, 'PedidosPorConfirmar', 'Pedido');
            }}
          />
        </div>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
            <ShoppingCart size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pendientes</p>
            <span className="text-base font-black text-amber-500">
              {pedidos.filter(p => p.status === 'ESPERANDO_COMFIRMACION').length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Confirmados</p>
            <span className="text-base font-black text-emerald-500">
              {pedidos.filter(p => p.status === 'COMFIRMADO').length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Archivados</p>
            <span className="text-base font-black text-rose-500">
              {pedidos.filter(p => p.status === 'ARCHIVADO').length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-text-secondary rounded-xl">
            <ClipboardCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total</p>
            <span className="text-base font-black text-text-primary">{pedidos.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/30 dark:border-slate-800/80 w-fit">
          <button
            onClick={() => setStatusFilter('ESPERANDO_COMFIRMACION')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              statusFilter === 'ESPERANDO_COMFIRMACION' 
                ? 'bg-white dark:bg-slate-800 shadow-sm text-brand' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Esperando ({pedidos.filter(p => p.status === 'ESPERANDO_COMFIRMACION').length})
          </button>
          <button
            onClick={() => setStatusFilter('COMFIRMADO')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              statusFilter === 'COMFIRMADO' 
                ? 'bg-white dark:bg-slate-800 shadow-sm text-brand' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Confirmados ({pedidos.filter(p => p.status === 'COMFIRMADO').length})
          </button>
          <button
            onClick={() => setStatusFilter('ARCHIVADO')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              statusFilter === 'ARCHIVADO' 
                ? 'bg-white dark:bg-slate-800 shadow-sm text-brand' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Archivados ({pedidos.filter(p => p.status === 'ARCHIVADO').length})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              statusFilter === 'ALL' 
                ? 'bg-white dark:bg-slate-800 shadow-sm text-brand' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Todos ({pedidos.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente, teléfono o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-ring"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="animate-spin text-brand mx-auto mb-3" size={28} />
            <p className="text-text-muted font-medium text-sm">Cargando pedidos por confirmar...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-danger font-bold text-sm">
            {error}
          </div>
        ) : filteredPedidos.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <ClipboardCheck className="text-text-muted/30" size={40} />
            <p className="text-text-muted font-black text-sm uppercase tracking-wider">No se encontraron pedidos</p>
            <p className="text-text-muted text-xs">No hay pedidos que coincidan con la selección actual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider">Pedido</th>
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider">Entrega / Dirección</th>
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Cant.</th>
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Pago</th>
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Estado</th>
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Creado</th>
                  <th className="px-3 py-2.5 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredPedidos.map((pedido) => (
                  <tr 
                    key={pedido.id} 
                    onClick={() => {
                      if (pedido.shopify_order_id) {
                        router.push(`/pedidos/${encodeURIComponent(`gid://shopify/Order/${pedido.shopify_order_id}`)}`);
                      }
                    }}
                    className="hover:bg-hover transition-colors group cursor-pointer"
                  >
                    <td className="px-3 py-2.5">
                      {pedido.shopify_order_id ? (
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline">
                          #{pedido.external_order_id || pedido.shopify_order_id}
                        </span>
                      ) : (
                        <span className="text-xs font-black text-text-primary">
                          #{pedido.external_order_id || pedido.id}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-xs font-bold text-text-primary">{pedido.name || '—'}</span>
                        <span className="text-text-muted font-medium mt-0.5">{pedido.phone || '—'}</span>
                        <span className="text-[10px] text-text-muted/70 truncate max-w-[150px]">{pedido.email || '—'}</span>
                        
                        {/* Note badge if archived / note exists */}
                        {pedido.notas && (
                          <div className="mt-1.5 flex items-start gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg text-[10px] max-w-[220px]">
                            <FileText size={11} className="shrink-0 mt-0.5" />
                            <span className="font-semibold line-clamp-2 leading-tight" title={pedido.notas}>{pedido.notas}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col text-[11px] font-medium text-text-muted">
                        <span className="text-text-primary font-bold">{pedido.city || '—'}</span>
                        <span className="text-[10px] truncate max-w-[180px]">{pedido.address || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs font-bold text-text-primary">
                      {pedido.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {getPaymentBadge(pedido.metodo_pago)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {getStatusBadge(pedido.status)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-[10px] font-bold text-text-muted whitespace-nowrap">
                      {formatDate(pedido.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {pedido.status === 'ESPERANDO_COMFIRMACION' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="primary"
                            onClick={() => {
                              setSelectedPedidoPrefill(pedido);
                              setShowCreateModal(true);
                            }}
                            className="h-7 px-2.5 text-[10px] font-black uppercase rounded-lg shadow-sm"
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleOpenArchiveModal(pedido)}
                            className="h-7 px-2 text-[10px] font-black uppercase rounded-lg border-rose-500/20 hover:bg-rose-500/10 text-rose-500 dark:border-rose-500/30 dark:hover:bg-rose-500/20"
                          >
                            Archivar
                          </Button>
                        </div>
                      ) : pedido.status === 'ARCHIVADO' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                            Archivado
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => handleOpenArchiveModal(pedido)}
                            className="h-6 px-2 text-[9px] font-bold text-text-muted hover:text-brand border-slate-200/50 dark:border-slate-800"
                            title="Editar nota explicativa"
                          >
                            <FileText size={10} className="mr-1" />
                            {pedido.notas ? 'Editar Nota' : 'Agregar Nota'}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                          {pedido.confirmed_at ? formatDate(pedido.confirmed_at) : 'Confirmado'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateManualOrderModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedPedidoPrefill(null);
        }}
        onSuccess={fetchPedidos}
        prefilledOrder={selectedPedidoPrefill}
      />

      <ArchiveOrderModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setSelectedArchivePedido(null);
        }}
        orderId={selectedArchivePedido?.id || null}
        orderName={selectedArchivePedido ? `#${selectedArchivePedido.external_order_id || selectedArchivePedido.shopify_order_id || selectedArchivePedido.id}` : ''}
        clientName={selectedArchivePedido?.name}
        currentNote={selectedArchivePedido?.notas || ''}
        onSuccess={(id, note) => {
          setPedidos(prev => 
            prev.map(p => p.id === id ? { ...p, status: 'ARCHIVADO', notas: note } : p)
          );
        }}
      />

    </div>
  );
}
