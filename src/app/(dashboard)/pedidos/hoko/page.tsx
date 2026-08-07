"use client";

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, Filter, RefreshCw, ChevronRight, ArrowLeft, Plus, X,
  MapPin, User, Mail, Phone, Package, Truck, Hash, DollarSign, Calendar,
  Eye, Trash2, FileText, ExternalLink, ClipboardList, Box
} from 'lucide-react';
import { HokoOrder, HokoCity, HokoQuotation, HOKO_ORDER_STATES, HOKO_GUIDE_STATES_CO } from '../../../../types';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/shared/Button';

export default function HokoPedidosPage() {
  const router = useRouter();

  // ── State ──
  const [orders, setOrders] = useState<HokoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<HokoOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

  // Create order
  const [showCreate, setShowCreate] = useState(false);
  const [cities, setCities] = useState<HokoCity[]>([]);
  const [quotations, setQuotations] = useState<HokoQuotation[]>([]);
  const [quoting, setQuoting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerName: '',
    customerEmail: '',
    customerIdentification: '',
    customerPhone: '',
    customerAddress: '',
    cityId: '',
    stockId: '55134',
    amount: '1',
    unitPrice: '199000',
    payment: '0',
    courierId: '',
    contain: 'Accesorio localizador',
    declaredValue: '100000',
    height: '10',
    width: '10',
    length: '10',
    weight: '1',
    externalId: '',
  });

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Helpers ──
  const hokoFetch = async (endpoint: string, options?: { method?: string; body?: any; formData?: FormData }) => {
    const res = await fetch('/api/hoko', {
      method: 'POST',
      headers: options?.formData ? {} : { 'Content-Type': 'application/json' },
      body: options?.formData || JSON.stringify({
        endpoint,
        method: options?.method || 'GET',
        body: options?.body,
      }),
    });
    return res.json();
  };

  const hokoFormFetch = async (endpoint: string, formData: FormData) => {
    formData.set('_endpoint', endpoint);
    formData.set('_method', 'POST');
    const res = await fetch('/api/hoko', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  };

  // ── Fetch orders ──
  const fetchOrders = async (p: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await hokoFetch(`/member/order?page=${p}`);
      if (data.error) throw new Error(data.error);
      const list: HokoOrder[] = data.data || data.orders || [];
      setOrders(list);
      setPrevPage(data.prev_page_url || null);
      setNextPage(data.next_page_url || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); }, []);

  // ── Fetch order detail ──
  const fetchOrderDetail = async (id: string) => {
    setOrderLoading(true);
    try {
      const data = await hokoFetch(`/member/order/${id}`);
      setSelectedOrder(data.data || data);
    } catch (e) {
      console.error(e);
    } finally {
      setOrderLoading(false);
    }
  };

  // ── Fetch cities ──
  const fetchCities = async () => {
    try {
      const data = await hokoFetch('https://v4.hoko.com.co/api/member/get-cities');
      setCities(data.data || data.cities || []);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Quote shipping ──
  const handleQuote = async () => {
    if (!createForm.cityId || !createForm.courierId) return;
    setQuoting(true);
    try {
      const data = await hokoFetch('/member/stock/quotation', {
        method: 'POST',
        body: {
          stock_ids: createForm.stockId,
          city_to: createForm.cityId,
          payment: createForm.payment,
          declared_value: createForm.declaredValue,
          width: createForm.width,
          height: createForm.height,
          length: createForm.length,
          weight: createForm.weight,
        },
      });
      setQuotations(data.data || data.quotations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setQuoting(false);
    }
  };

  // ── Create order ──
  const handleCreate = async () => {
    setCreating(true);
    try {
      const form = new FormData();
      form.append('customer', JSON.stringify({
        name: createForm.customerName,
        email: createForm.customerEmail,
        identification: createForm.customerIdentification,
        phone: createForm.customerPhone,
        address: createForm.customerAddress,
        city_id: createForm.cityId,
      }));
      form.append('stocks', JSON.stringify({
        [createForm.stockId]: { amount: parseInt(createForm.amount), price: parseInt(createForm.unitPrice) },
      }));
      form.append('payment', createForm.payment);
      form.append('courier_id', createForm.courierId);
      form.append('contain', createForm.contain);
      form.append('measures', JSON.stringify({
        height: createForm.height,
        width: createForm.width,
        length: createForm.length,
        weight: createForm.weight,
      }));
      form.append('declared_value', createForm.declaredValue);
      if (createForm.externalId) form.append('external_id', createForm.externalId);

      const data = await hokoFormFetch('/member/order/create', form);
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      fetchOrders(1);
    } catch (e: any) {
      alert(`Error al crear orden: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  // ── Generate guide ──
  const handleGenerateGuide = async (id: string) => {
    setActionLoading(id);
    try {
      const data = await hokoFetch(`/member/order/generate-guide/${id}`, { method: 'POST' });
      if (data.error) throw new Error(data.error);
      alert('Guía generada exitosamente');
      fetchOrderDetail(id);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Cancel order ──
  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) return;
    setActionLoading(id);
    try {
      const data = await hokoFetch(`/member/order/cancel/${id}`, { method: 'POST' });
      if (data.error) throw new Error(data.error);
      alert('Orden cancelada');
      if (selectedOrder?.id === id) setSelectedOrder(null);
      fetchOrders(page);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Open create modal ──
  const openCreate = () => {
    setCreateForm({
      customerName: '',
      customerEmail: '',
      customerIdentification: '',
      customerPhone: '',
      customerAddress: '',
      cityId: '',
      stockId: '55134',
      amount: '1',
      unitPrice: '199000',
      payment: '0',
      courierId: '',
      contain: 'Accesorio localizador',
      declaredValue: '100000',
      height: '10',
      width: '10',
      length: '10',
      weight: '1',
      externalId: '',
    });
    setQuotations([]);
    fetchCities();
    setShowCreate(true);
  };

  // ── Filter ──
  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.external_id?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.phone?.toLowerCase().includes(q)
    );
  });

  const stateColor = (state: string) => {
    switch (state) {
      case '1': return 'bg-warning-bg text-warning';
      case '2': return 'bg-info-bg text-info';
      case '3': return 'bg-info-bg text-info';
      case '4': return 'bg-success-bg text-success';
      case '5': return 'bg-danger-bg text-danger';
      case '6': return 'bg-danger-bg text-danger';
      default: return 'bg-card-alt text-text-muted';
    }
  };

  const guideStateColor = (state: string) => {
    switch (state) {
      case '0': case '4': return 'bg-danger-bg text-danger';
      case '1': case '5': return 'bg-success-bg text-success';
      case '2': case '7': return 'bg-info-bg text-info';
      case '3': return 'bg-success-bg text-success';
      case '6': return 'bg-danger-bg text-danger';
      default: return 'bg-card-alt text-text-muted';
    }
  };

  // ── Render ──
  if (selectedOrder) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto px-4 md:px-6 py-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 text-xs font-black uppercase text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft size={14} />
            <span>Volver a órdenes</span>
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleCancel(selectedOrder.id)}
              disabled={actionLoading === selectedOrder.id}
              className="h-8 text-[10px]">
              {actionLoading === selectedOrder.id ? '...' : 'Cancelar orden'}
            </Button>
            <Button variant="primary" onClick={() => handleGenerateGuide(selectedOrder.id)}
              disabled={actionLoading === selectedOrder.id}
              className="h-8 text-[10px]">
              {actionLoading === selectedOrder.id ? '...' : 'Generar guía'}
            </Button>
          </div>
        </div>

        {orderLoading ? (
          <div className="p-20 text-center">
            <RefreshCw className="animate-spin text-brand mx-auto" size={28} />
            <p className="text-text-muted font-medium text-sm mt-3">Cargando detalle...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order Header */}
              <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-text-primary">Orden #{selectedOrder.id}</h2>
                    <p className="text-xs text-text-muted mt-1 font-medium">
                      Creada: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('es-CO') : '—'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full ${stateColor(selectedOrder.delivery_state)}`}>
                    {HOKO_ORDER_STATES[selectedOrder.delivery_state] || selectedOrder.delivery_state}
                  </span>
                </div>
              </div>

              {/* Customer info */}
              <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
                <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <User size={14} className="text-text-muted" />
                  <span>Cliente</span>
                </h3>
                {selectedOrder.customer ? (
                  <div className="text-xs text-text-secondary space-y-2 font-medium">
                    <p className="font-black text-text-primary">{selectedOrder.customer.name}</p>
                    <p className="flex items-center gap-1.5">
                      <Mail size={11} className="text-text-muted" /> {selectedOrder.customer.email}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone size={11} className="text-text-muted" /> {selectedOrder.customer.phone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-text-muted" /> {selectedOrder.customer.address}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Hash size={11} className="text-text-muted" /> ID: {selectedOrder.customer.identification || '—'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">Sin datos</p>
                )}
              </div>

              {/* Guide */}
              {selectedOrder.guide && (
                <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
                  <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <Truck size={14} className="text-text-muted" />
                    <span>Guía de envío</span>
                  </h3>
                  <div className="text-xs space-y-2 font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Número</span>
                      <span className="font-black text-text-primary">{selectedOrder.guide.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Transportadora</span>
                      <span className="font-bold text-text-primary">{selectedOrder.guide.courier_name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Estado</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${guideStateColor(selectedOrder.guide.state)}`}>
                        {HOKO_GUIDE_STATES_CO[selectedOrder.guide.state] || selectedOrder.guide.state}
                      </span>
                    </div>
                    {selectedOrder.guide.total_freight_store && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Costo flete</span>
                        <span className="font-black text-text-primary">${parseInt(selectedOrder.guide.total_freight_store).toLocaleString('es-CO')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Details */}
              <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 space-y-3">
                <h3 className="font-black text-xs uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <ClipboardList size={14} className="text-text-muted" />
                  <span>Detalles</span>
                </h3>
                <div className="text-xs space-y-2.5 font-medium">
                  <div>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Contenido</p>
                    <p className="text-text-primary font-bold mt-0.5">{selectedOrder.contain || '—'}</p>
                  </div>
                  {selectedOrder.measures && (
                    <div>
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Medidas</p>
                      <p className="text-text-primary font-bold mt-0.5">
                        {selectedOrder.measures.width}×{selectedOrder.measures.height}×{selectedOrder.measures.length} cm, {selectedOrder.measures.weight} kg
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Pago</p>
                    <p className="text-text-primary font-bold mt-0.5 capitalize">
                      {selectedOrder.payment === '0' ? 'Contraentrega' : selectedOrder.payment === '1' ? 'Crédito' : selectedOrder.payment || '—'}
                    </p>
                  </div>
                  {selectedOrder.declared_value && (
                    <div>
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Valor declarado</p>
                      <p className="text-text-primary font-bold mt-0.5">${parseInt(selectedOrder.declared_value).toLocaleString('es-CO')}</p>
                    </div>
                  )}
                  {selectedOrder.external_id && (
                    <div>
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Pedido Shopify</p>
                      <button
                        onClick={() => router.push(`/pedidos/${encodeURIComponent(selectedOrder.external_id!)}`)}
                        className="text-brand hover:text-brand/80 font-bold mt-0.5 flex items-center gap-1"
                      >
                        <ExternalLink size={11} />
                        <span>Ver pedido</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 md:px-6 py-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase italic">
              Órdenes <span className="text-brand">Hoko</span>
            </h1>
          </div>
          <p className="text-text-muted font-medium text-xs mt-1">
            Gestiona órdenes de logística, guías y despachos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchOrders(page)}
            disabled={loading}
            className="flex items-center gap-2 h-9 text-[11px]">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </Button>
          <Button variant="primary" onClick={openCreate}
            className="flex items-center gap-2 h-9 text-[11px]">
            <Plus size={14} />
            Nueva orden
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total</p>
          <span className="text-lg font-black text-text-primary">{orders.length}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">En proceso</p>
          <span className="text-lg font-black text-info">{orders.filter(o => o.delivery_state === '2').length}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Despachadas</p>
          <span className="text-lg font-black text-info">{orders.filter(o => o.delivery_state === '3').length}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Finalizadas</p>
          <span className="text-lg font-black text-success">{orders.filter(o => o.delivery_state === '4').length}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Canceladas</p>
          <span className="text-lg font-black text-danger">{orders.filter(o => o.delivery_state === '5').length}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Novedad</p>
          <span className="text-lg font-black text-danger">{orders.filter(o => o.delivery_state === '6').length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por ID, externo, cliente o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-ring"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger-bg text-danger p-4 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Orders table */}
      <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="animate-spin text-brand mx-auto" size={28} />
            <p className="text-text-muted font-medium text-sm mt-3">Cargando órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package size={20} className="text-text-muted/40" />
            </div>
            <p className="text-text-muted font-black text-sm uppercase tracking-wider">Sin órdenes</p>
            <p className="text-text-muted text-xs mt-1">No hay órdenes registradas en Hoko.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Teléfono</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Contenido</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Estado</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Guía</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Shopify</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredOrders.map((order) => (
                  <tr key={order.id}
                    onClick={() => { setSelectedOrder(order); fetchOrderDetail(order.id); }}
                    className="transition-colors cursor-pointer hover:bg-hover">
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-black text-text-primary">#{order.id}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-bold text-text-primary truncate max-w-[150px] block">
                        {order.customer?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] font-medium text-text-muted">
                      {order.customer?.phone || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] font-medium text-text-muted">
                      {order.contain || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${stateColor(order.delivery_state)}`}>
                        {HOKO_ORDER_STATES[order.delivery_state] || order.delivery_state}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {order.guide ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${guideStateColor(order.guide.state)}`}>
                          <FileText size={9} />
                          {order.guide.number?.slice(0, 8) || 'Sí'}
                        </span>
                      ) : (
                        <span className="text-[9px] text-text-muted italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {order.external_id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/pedidos/${encodeURIComponent(order.external_id!)}`);
                          }}
                          className="inline-flex items-center gap-1 text-brand text-[10px] font-bold hover:underline"
                        >
                          <ExternalLink size={10} />
                          Ver
                        </button>
                      ) : (
                        <span className="text-[9px] text-text-muted italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          fetchOrderDetail(order.id);
                        }}
                        className="p-1 rounded-lg text-text-muted hover:text-brand hover:bg-brand-bg transition-all"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-text-muted">
          {filteredOrders.length} órdenes
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setPage(p => p - 1); fetchOrders(page - 1); }}
            disabled={!prevPage || loading}
            className="h-8 text-[10px]">
            Anterior
          </Button>
          <Button variant="outline" onClick={() => { setPage(p => p + 1); fetchOrders(page + 1); }}
            disabled={!nextPage || loading}
            className="h-8 text-[10px]">
            Siguiente
          </Button>
        </div>
      </div>

      {/* ── Create Order Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/50 overflow-y-auto">
          <div className="bg-card rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-xl w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="font-black text-sm uppercase tracking-wider text-text-primary">Nueva orden Hoko</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-card-alt text-text-muted">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Customer */}
              <div>
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3">Datos del destinatario</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-text-muted">Nombre completo</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.customerName} onChange={e => setCreateForm(f => ({ ...f, customerName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Email</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.customerEmail} onChange={e => setCreateForm(f => ({ ...f, customerEmail: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Teléfono</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.customerPhone} onChange={e => setCreateForm(f => ({ ...f, customerPhone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Identificación</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.customerIdentification} onChange={e => setCreateForm(f => ({ ...f, customerIdentification: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Ciudad</label>
                    <select className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.cityId} onChange={e => setCreateForm(f => ({ ...f, cityId: e.target.value }))}>
                      <option value="">Seleccionar...</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-text-muted">Dirección</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.customerAddress} onChange={e => setCreateForm(f => ({ ...f, customerAddress: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Product */}
              <div className="border-t border-slate-100 dark:border-slate-800/50 pt-5">
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3">Producto</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Stock ID</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.stockId} onChange={e => setCreateForm(f => ({ ...f, stockId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Cantidad</label>
                    <input type="number" className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.amount} onChange={e => setCreateForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Precio unitario</label>
                    <input type="number" className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.unitPrice} onChange={e => setCreateForm(f => ({ ...f, unitPrice: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] font-bold text-text-muted">Contenido</label>
                  <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                    value={createForm.contain} onChange={e => setCreateForm(f => ({ ...f, contain: e.target.value }))} />
                </div>
              </div>

              {/* Shipping */}
              <div className="border-t border-slate-100 dark:border-slate-800/50 pt-5">
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3">Envío</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Alto (cm)</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.height} onChange={e => setCreateForm(f => ({ ...f, height: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Ancho (cm)</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.width} onChange={e => setCreateForm(f => ({ ...f, width: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Largo (cm)</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.length} onChange={e => setCreateForm(f => ({ ...f, length: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Peso (kg)</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.weight} onChange={e => setCreateForm(f => ({ ...f, weight: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Valor declarado</label>
                    <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.declaredValue} onChange={e => setCreateForm(f => ({ ...f, declaredValue: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted">Método de pago</label>
                    <select className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                      value={createForm.payment} onChange={e => setCreateForm(f => ({ ...f, payment: e.target.value }))}>
                      <option value="0">Contraentrega</option>
                      <option value="1">Crédito / Pagado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Shopify link */}
              <div className="border-t border-slate-100 dark:border-slate-800/50 pt-5">
                <h3 className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3">Vinculación Shopify</h3>
                <div>
                  <label className="text-[10px] font-bold text-text-muted">External ID (Shopify GID)</label>
                  <input className="w-full text-xs font-medium text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand mt-1"
                    placeholder="gid://shopify/Order/123456789"
                    value={createForm.externalId} onChange={e => setCreateForm(f => ({ ...f, externalId: e.target.value }))} />
                  <p className="text-[9px] text-text-muted mt-1">ID completo de Shopify para vincular la orden.</p>
                </div>
              </div>

              {/* Quotation */}
              <div className="border-t border-slate-100 dark:border-slate-800/50 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[9px] font-black text-text-muted uppercase tracking-widest">Cotizar transportadora</h3>
                  <Button variant="outline" onClick={handleQuote} disabled={quoting || !createForm.cityId}
                    className="h-7 text-[9px]">
                    {quoting ? 'Cotizando...' : 'Cotizar'}
                  </Button>
                </div>
                {quotations.length > 0 && (
                  <div className="space-y-2">
                    {quotations.map((q) => (
                      <label key={q.courier_id}
                        onClick={() => setCreateForm(f => ({ ...f, courierId: String(q.courier_id) }))}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${String(q.courier_id) === createForm.courierId ? 'border-brand bg-brand-bg' : 'border-slate-200/50 dark:border-slate-800 bg-card-alt'}`}>
                        <div>
                          <p className="text-xs font-black text-text-primary">{q.courier_name}</p>
                          <p className="text-[10px] text-text-muted">{q.delivered_days} días hábiles</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-text-primary">${q.price.toLocaleString('es-CO')}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-100 dark:border-slate-800/50">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="h-9 text-xs">Cancelar</Button>
              <Button variant="primary" onClick={handleCreate} disabled={creating || !createForm.courierId}
                className="h-9 text-xs">
                {creating ? 'Creando...' : 'Crear orden'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
