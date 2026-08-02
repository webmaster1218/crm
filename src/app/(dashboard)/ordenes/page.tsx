"use client";

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, Filter, RefreshCw, ChevronRight, ArrowLeft, Plus, X,
  MapPin, User, Mail, Phone, Package, Truck, Hash, DollarSign, Calendar,
  Eye, Trash2, FileText, ExternalLink, ClipboardList, Box, FileSpreadsheet
} from 'lucide-react';
import { HokoOrder, HokoCity, HokoQuotation, HOKO_ORDER_STATES, HOKO_GUIDE_STATES_CO } from '../../../types';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/shared/Button';
import { ExportDropdown } from '../../../components/shared/ExportDropdown';
import { exportToCSV, exportToXML } from '../../../utils/exportUtils';
import Swal from 'sweetalert2';

export default function HokoPedidosPage() {
  const router = useRouter();

  // SweetAlert2 notification helper
  const showNotification = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => {
    if (typeof window === 'undefined') return;
    const isDark = document.documentElement.classList.contains('dark');
    const colorThemeMap = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'Entendido',
      confirmButtonColor: colorThemeMap[icon],
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
      }
    });
  };

  // SweetAlert2 confirm helper
  const showConfirm = async (title: string, text: string) => {
    if (typeof window === 'undefined') return false;
    const isDark = document.documentElement.classList.contains('dark');
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
      }
    });
    return result.isConfirmed;
  };

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
  const [availableStocks, setAvailableStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
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

  // Edit order state
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerEmail: '',
    customerIdentification: '',
    customerPhone: '',
    customerAddress: '',
    cityId: '',
    contain: '',
    height: '10',
    width: '10',
    length: '10',
    weight: '1',
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
      const res = await fetch('/api/pedidos', { cache: 'no-store' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOrders(data);
      setPrevPage(null);
      setNextPage(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); }, []);

  // ── Auto Quotation Effect ──
  useEffect(() => {
    if (!createForm.cityId) return;

    const triggerQuote = async () => {
      setQuoting(true);
      try {
        const data = await hokoFetch('/member/stock/quotation', {
          method: 'POST',
          body: {
            stock_ids: createForm.stockId,
            city_to: createForm.cityId,
            payment: parseInt(createForm.payment),
            declared_value: createForm.declaredValue,
            width: createForm.width,
            height: createForm.height,
            length: createForm.length,
            weight: createForm.weight,
          },
        });
        const list = data.data || data.quotations || [];
        setQuotations(list);

        // Auto select first courier if available and none selected yet
        if (list.length > 0) {
          const firstCourierId = String(list[0].courier_id);
          setCreateForm(f => ({ ...f, courierId: firstCourierId }));
        } else {
          setCreateForm(f => ({ ...f, courierId: '' }));
        }
      } catch (e) {
        console.error('Error auto-quoting transportadoras', e);
      } finally {
        setQuoting(false);
      }
    };

    const timer = setTimeout(triggerQuote, 400);
    return () => clearTimeout(timer);
  }, [
    createForm.cityId,
    createForm.payment,
    createForm.declaredValue,
    createForm.height,
    createForm.width,
    createForm.length,
    createForm.weight,
    createForm.stockId
  ]);

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
      const list = Array.isArray(data) ? data : (data.data || data.cities || []);
      setCities(list);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Fetch Available Stocks ──
  const fetchAvailableStocks = async () => {
    setLoadingStocks(true);
    try {
      const data = await hokoFetch('/member/stock/list', { method: 'POST' });
      const list = Array.isArray(data) ? data : (data.data || data.stocks || []);
      setAvailableStocks(list);
    } catch (e) {
      console.error('Error fetching stock locations', e);
    } finally {
      setLoadingStocks(false);
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
      showNotification('Error de Creación', `Error al crear orden: ${e.message}`, 'error');
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
      showNotification('Guía Generada', 'La guía ha sido generada exitosamente.', 'success');
      fetchOrderDetail(id);
    } catch (e: any) {
      showNotification('Error', e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Cancel order ──
  const handleCancel = async (id: string) => {
    const confirmed = await showConfirm('¿Cancelar Orden?', '¿Estás seguro de cancelar esta orden?');
    if (!confirmed) return;
    setActionLoading(id);
    try {
      const data = await hokoFetch(`/member/order/cancel/${id}`, { method: 'POST' });
      if (data.error) throw new Error(data.error);
      showNotification('Orden Cancelada', 'La orden ha sido cancelada exitosamente.', 'success');
      if (selectedOrder?.id === id) setSelectedOrder(null);
      fetchOrders(page);
    } catch (e: any) {
      showNotification('Error', e.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Edit order handlers ──
  const handleOpenEdit = () => {
    if (!selectedOrder) return;
    setEditForm({
      customerName: selectedOrder.customer?.name || '',
      customerEmail: selectedOrder.customer?.email || '',
      customerIdentification: selectedOrder.customer?.identification || '',
      customerPhone: selectedOrder.customer?.phone || '',
      customerAddress: selectedOrder.customer?.address || '',
      cityId: (selectedOrder as any).city_id || '',
      contain: selectedOrder.contain || '',
      height: selectedOrder.measures?.height || '10',
      width: selectedOrder.measures?.width || '10',
      length: selectedOrder.measures?.length || '10',
      weight: selectedOrder.measures?.weight || '1',
    });
    fetchCities();
    setShowEdit(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setEditing(true);
    try {
      const formData = new FormData();
      
      const customerJSON = JSON.stringify({
        name: editForm.customerName,
        email: editForm.customerEmail,
        identification: editForm.customerIdentification,
        phone: editForm.customerPhone,
        address: editForm.customerAddress,
        city_id: editForm.cityId,
      });

      const measuresJSON = JSON.stringify({
        height: editForm.height,
        width: editForm.width,
        length: editForm.length,
        weight: editForm.weight,
      });

      formData.append('customer', customerJSON);
      formData.append('contain', editForm.contain);
      formData.append('measures', measuresJSON);

      const data = await hokoFormFetch(`/member/order/update/${selectedOrder.id}`, formData);
      if (data.error) throw new Error(data.error);

      showNotification('Orden Actualizada', 'La orden ha sido actualizada con éxito.', 'success');
      setShowEdit(false);
      fetchOrderDetail(selectedOrder.id);
    } catch (err: any) {
      showNotification('Error', `Error al actualizar orden: ${err.message}`, 'error');
    } finally {
      setEditing(false);
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
    fetchAvailableStocks();
    setShowCreate(true);
  };

  // ── Filter ──
  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(o.id || '').toLowerCase().includes(q) ||
      String(o.external_id || '').toLowerCase().includes(q) ||
      String(o.customer?.name || '').toLowerCase().includes(q) ||
      String(o.customer?.phone || '').toLowerCase().includes(q)
    );
  });

  const stateColor = (state: string) => {
    switch (state) {
      case '1': return 'bg-brand-bg text-brand border border-brand/20'; // Creada
      case '2': return 'bg-info-bg text-info border border-info/20'; // En Proceso
      case '3': return 'bg-info-bg text-info border border-info/20'; // Despachada
      case '4': return 'bg-success-bg text-success border border-success/20'; // Finalizada
      case '5': return 'bg-danger-bg text-danger border border-danger/20'; // Cancelada
      case '6': return 'bg-warning-bg text-warning border border-warning/20'; // En Novedad
      default: return 'bg-card-alt text-text-muted border border-slate-100 dark:border-slate-800';
    }
  };

  const guideStateColor = (state: string) => {
    switch (state) {
      case '3':
      case '17':
      case '19':
        return 'bg-success-bg text-success border border-success/20';
      case '0':
      case '4':
      case '11':
      case '20':
        return 'bg-danger-bg text-danger border border-danger/20';
      case '6':
      case '18':
      case '21':
        return 'bg-warning-bg text-warning border border-warning/20';
      case '2':
      case '7':
      case '9':
      case '13':
        return 'bg-info-bg text-info border border-info/20';
      default:
        return 'bg-brand-bg text-brand border border-brand/20';
    }
  };

  // ── Render ──

  return (
    <div className="space-y-4 w-full md:px-2 animate-in fade-in duration-500">
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
          <ExportDropdown
            label="Exportar"
            disabled={loading || filteredOrders.length === 0}
            onExportCSV={() => {
              const headers = [
                'ID', 'Cliente', 'Email', 'Teléfono', 'Ciudad', 'Contenido',
                'Estado Orden', 'Estado Guía', 'Guía', 'Transportadora', 'Pedido Relacionado'
              ];
              const rows = filteredOrders.map(order => ({
                'ID': `#${order.id}`,
                'Cliente': order.customer?.name || '—',
                'Email': order.customer?.email || '—',
                'Teléfono': order.customer?.phone || '—',
                'Ciudad': order.customer?.city || '—',
                'Contenido': `${(order as any).quantity || 1}x ${order.contain || 'Nanotrack'}`,
                'Estado Orden': HOKO_ORDER_STATES[order.delivery_state] || order.delivery_state || '—',
                'Estado Guía': order.guide ? (HOKO_GUIDE_STATES_CO[order.guide.state] || order.guide.state) : '—',
                'Guía': order.guide?.number || '—',
                'Transportadora': (order as any).courier_name || order.courier_id || '—',
                'Pedido Relacionado': (order as any).shopify_order_name || '—',
              }));
              exportToCSV(headers, rows, `ordenes_hoko_${new Date().toISOString().slice(0,10)}`);
            }}
            onExportXML={() => {
              const headers = [
                'ID', 'Cliente', 'Email', 'Teléfono', 'Ciudad', 'Contenido',
                'Estado Orden', 'Estado Guía', 'Guía', 'Transportadora', 'Pedido Relacionado'
              ];
              const rows = filteredOrders.map(order => ({
                'ID': `#${order.id}`,
                'Cliente': order.customer?.name || '—',
                'Email': order.customer?.email || '—',
                'Teléfono': order.customer?.phone || '—',
                'Ciudad': order.customer?.city || '—',
                'Contenido': `${(order as any).quantity || 1}x ${order.contain || 'Nanotrack'}`,
                'Estado Orden': HOKO_ORDER_STATES[order.delivery_state] || order.delivery_state || '—',
                'Estado Guía': order.guide ? (HOKO_GUIDE_STATES_CO[order.guide.state] || order.guide.state) : '—',
                'Guía': order.guide?.number || '—',
                'Transportadora': (order as any).courier_name || order.courier_id || '—',
                'Pedido Relacionado': (order as any).shopify_order_name || '—',
              }));
              exportToXML(headers, rows, `ordenes_hoko_${new Date().toISOString().slice(0,10)}`, 'OrdenesHoko', 'Orden');
            }}
          />
          <Button variant="primary" onClick={openCreate}
            className="flex items-center gap-2 h-9 text-[11px]">
            <Plus size={14} />
            Nueva orden
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
            <Box size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Hoko</p>
            <span className="text-base font-black text-text-primary">{orders.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-info/10 text-info rounded-xl">
            <RefreshCw size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">En proceso</p>
            <span className="text-base font-black text-info">{orders.filter(o => o.delivery_state === '2').length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-info/10 text-info rounded-xl">
            <Package size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Despachadas</p>
            <span className="text-base font-black text-info">{orders.filter(o => o.delivery_state === '3').length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-success/10 text-success rounded-xl">
            <Truck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Finalizadas</p>
            <span className="text-base font-black text-success">{orders.filter(o => o.delivery_state === '4').length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-danger/10 text-danger rounded-xl">
            <X size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Canceladas</p>
            <span className="text-base font-black text-danger">{orders.filter(o => o.delivery_state === '5').length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Novedades</p>
            <span className="text-base font-black text-warning">{orders.filter(o => o.delivery_state === '6').length}</span>
          </div>
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
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Teléfono</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Contenido</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Estado</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Guía</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Pedido</th>
                    <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}
                      onClick={() => router.push(`/ordenes/${order.id}`)}
                      className="transition-colors cursor-pointer hover:bg-hover">
                      <td className="px-4 py-4">
                        <span className="text-xs font-black text-text-primary">#{order.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-primary truncate max-w-[150px]">{order.customer?.name || '—'}</span>
                          {order.customer?.email && (
                            <span className="text-[9px] font-medium text-text-muted truncate max-w-[150px]">{order.customer.email}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[11px] font-medium text-text-muted">
                        {order.customer?.phone || '—'}
                      </td>
                      <td className="px-4 py-4 text-[11px] font-medium text-text-muted">
                        {((order as any).quantity || 1)} / {order.contain || 'Nanotrack'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${stateColor(order.delivery_state)}`}>
                          {HOKO_ORDER_STATES[order.delivery_state] || order.delivery_state}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {order.guide ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${guideStateColor(order.guide.state)}`}>
                            <FileText size={9} />
                            {order.guide.number?.slice(0, 8) || 'Sí'}
                          </span>
                        ) : (
                          <span className="text-[9px] text-text-muted italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {((order as any).shopify_order_id && ((order as any).shopify_order_id.startsWith('gid://shopify/') || (order as any).shopify_order_id.startsWith('cliente_tienda_pedido_') || /^\d+$/.test((order as any).shopify_order_id))) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const destId = (order as any).shopify_order_id;
                              router.push(`/pedidos/${encodeURIComponent(destId)}`);
                            }}
                            className="inline-flex items-center gap-1 text-brand text-[10px] font-black hover:underline"
                          >
                            <ExternalLink size={10} className="text-brand/70" />
                            <span>{(order as any).shopify_order_name || (order as any).shopify_order_id.split('/').pop() || (order as any).shopify_order_id}</span>
                          </button>
                        ) : (
                          <span className="text-[9px] text-text-muted italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/ordenes/${order.id}`);
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

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/ordenes/${order.id}`)}
                  className="p-4 flex flex-col gap-2.5 hover:bg-hover active:bg-hover transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-text-primary">#{order.id}</span>
                    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full ${stateColor(order.delivery_state)}`}>
                      {HOKO_ORDER_STATES[order.delivery_state] || order.delivery_state}
                    </span>
                  </div>

                  <div className="text-[11px] text-text-secondary font-medium">
                    <p className="font-bold text-text-primary">{order.customer?.name || 'Sin cliente'}</p>
                    {order.customer?.email && (
                      <p className="text-[9px] text-text-muted mt-0.5">{order.customer.email}</p>
                    )}
                    <p className="text-[10px] text-text-muted mt-0.5">{order.customer?.phone || '—'}</p>
                    <p className="mt-0.5 truncate">{((order as any).quantity || 1)} / {order.contain || 'Nanotrack'}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                    <div className="font-bold text-text-muted">
                      {order.guide ? `Guía: ${order.guide.number}` : 'Sin guía'}
                    </div>
                    <div>
                      {((order as any).shopify_order_id && ((order as any).shopify_order_id.startsWith('gid://shopify/') || (order as any).shopify_order_id.startsWith('cliente_tienda_pedido_') || /^\d+$/.test((order as any).shopify_order_id))) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const destId = (order as any).shopify_order_id;
                            router.push(`/pedidos/${encodeURIComponent(destId)}`);
                          }}
                          className="inline-flex items-center gap-1 text-brand font-black hover:underline"
                        >
                          <ExternalLink size={10} />
                          <span>{(order as any).shopify_order_name || (order as any).shopify_order_id.split('/').pop() || (order as any).shopify_order_id}</span>
                        </button>
                      ) : (
                        <span className="text-text-placeholder italic">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-card rounded-[32px] border border-slate-200/50 dark:border-slate-800 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[80vh] animate-in zoom-in-95 duration-300">
            
            {/* Left Side: Form Fields (60%) */}
            <div className="lg:w-[58%] flex flex-col h-full bg-card">
              {/* Form Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black tracking-tight text-text-primary uppercase italic">
                    Crear <span className="text-brand">Nueva Orden</span>
                  </h2>
                  <p className="text-[10px] text-text-muted mt-0.5 font-medium">Ingresa los datos para registrar el envío en Hoko</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-card-alt text-text-muted hover:text-text-primary transition-colors lg:hidden">
                  <X size={18} />
                </button>
              </div>

              {/* Form Scroll Container */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Section 1: Customer Details */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <User size={12} className="text-brand" />
                    <span>Datos del Destinatario</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Nombre Completo</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        placeholder="Nombre y apellido del cliente"
                        value={createForm.customerName} onChange={e => setCreateForm(f => ({ ...f, customerName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Teléfono Celular</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        placeholder="Ej. 3001234567"
                        value={createForm.customerPhone} onChange={e => setCreateForm(f => ({ ...f, customerPhone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Cédula / Identificación</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        placeholder="CC o NIT"
                        value={createForm.customerIdentification} onChange={e => setCreateForm(f => ({ ...f, customerIdentification: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Correo Electrónico</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        placeholder="correo@ejemplo.com"
                        value={createForm.customerEmail} onChange={e => setCreateForm(f => ({ ...f, customerEmail: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Ciudad de Destino</label>
                      <select className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 appearance-none cursor-pointer"
                        value={createForm.cityId} onChange={e => setCreateForm(f => ({ ...f, cityId: e.target.value }))}>
                        <option value="">Seleccionar ciudad...</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Dirección de Entrega</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        placeholder="Dirección completa"
                        value={createForm.customerAddress} onChange={e => setCreateForm(f => ({ ...f, customerAddress: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Package Specs */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <Package size={12} className="text-brand" />
                    <span>Detalles del Producto y Empaque</span>
                  </h3>
                  
                  {/* Warehouse Stock Location Selector */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 space-y-2">
                    <label className="text-[9px] font-black text-brand uppercase tracking-wider block">Bodega Origen (Stock)</label>
                    {loadingStocks ? (
                      <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold py-2">
                        <RefreshCw size={12} className="animate-spin text-brand" />
                        <span>Obteniendo inventarios de bodegas...</span>
                      </div>
                    ) : availableStocks.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {availableStocks.map((s) => {
                          const isSelected = createForm.stockId === String(s.id);
                          const name = s.name || s.cellar?.name || (s.cellar_id === 2353 ? 'Bodega Bogotá' : s.cellar_id === 2354 ? 'Bodega Medellín' : `Bodega #${s.cellar_id || s.id}`);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setCreateForm(f => ({
                                  ...f,
                                  stockId: String(s.id),
                                  unitPrice: String(s.price_by_unit || s.minimal_price || f.unitPrice),
                                  height: s.measures?.height || f.height,
                                  width: s.measures?.width || f.width,
                                  length: s.measures?.length || f.length,
                                  weight: s.measures?.weight || f.weight,
                                }));
                              }}
                              className={`px-4.5 py-2.5 rounded-2xl border text-left transition-all ${
                                isSelected
                                  ? 'border-brand bg-brand-bg text-brand shadow-sm ring-2 ring-brand'
                                  : 'border-slate-200/40 dark:border-slate-800 bg-card text-text-muted hover:bg-hover'
                              }`}
                            >
                              <span className="block text-[10px] font-black uppercase tracking-wide">{name}</span>
                              <span className="block text-[8px] text-text-placeholder font-medium lowercase mt-0.5">Stock: {s.amount} u. | ID: {s.id}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-text-muted italic py-1">No se encontraron stocks activos en Hoko.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Stock ID</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={createForm.stockId} onChange={e => setCreateForm(f => ({ ...f, stockId: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Cantidad</label>
                      <input type="number" className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={createForm.amount} onChange={e => setCreateForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Precio Unitario</label>
                      <input type="number" className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={createForm.unitPrice} onChange={e => setCreateForm(f => ({ ...f, unitPrice: e.target.value }))} />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Contenido Declarado</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        placeholder="Descripción del contenido"
                        value={createForm.contain} onChange={e => setCreateForm(f => ({ ...f, contain: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-[20px] border border-slate-200/30 dark:border-slate-800/50">
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase">Alto (cm)</label>
                      <input className="w-full text-xs font-bold text-text-primary bg-card border border-slate-200/50 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand mt-1 transition-all"
                        value={createForm.height} onChange={e => setCreateForm(f => ({ ...f, height: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase">Ancho (cm)</label>
                      <input className="w-full text-xs font-bold text-text-primary bg-card border border-slate-200/50 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand mt-1 transition-all"
                        value={createForm.width} onChange={e => setCreateForm(f => ({ ...f, width: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase">Largo (cm)</label>
                      <input className="w-full text-xs font-bold text-text-primary bg-card border border-slate-200/50 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand mt-1 transition-all"
                        value={createForm.length} onChange={e => setCreateForm(f => ({ ...f, length: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase">Peso (kg)</label>
                      <input className="w-full text-xs font-bold text-text-primary bg-card border border-slate-200/50 dark:border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand mt-1 transition-all"
                        value={createForm.weight} onChange={e => setCreateForm(f => ({ ...f, weight: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Valor Declarado</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={createForm.declaredValue} onChange={e => setCreateForm(f => ({ ...f, declaredValue: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Método de Cobro</label>
                      <select className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 appearance-none cursor-pointer"
                        value={createForm.payment} onChange={e => setCreateForm(f => ({ ...f, payment: e.target.value }))}>
                        <option value="0">Contraentrega (Recaudo)</option>
                        <option value="1">Ordinario (Pagado)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Shopify field */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <ExternalLink size={12} className="text-brand" />
                    <span>Vinculación Shopify (Opcional)</span>
                  </h3>
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">External ID (Shopify Order ID)</label>
                    <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                      placeholder="Ej. 524584210"
                      value={createForm.externalId} onChange={e => setCreateForm(f => ({ ...f, externalId: e.target.value }))} />
                  </div>
                </div>

              </div>

              {/* Form Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-card flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="h-11 px-6 rounded-2xl text-xs font-bold transition-all">Cancelar</Button>
                <Button type="button" variant="primary" onClick={handleCreate} disabled={creating || !createForm.courierId}
                  className="h-11 px-8 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  {creating ? 'Creando Orden...' : 'Generar Orden'}
                </Button>
              </div>
            </div>

            {/* Right Side: Live Receipt & Courier Selector (40%) */}
            <div className="lg:w-[42%] flex flex-col h-full bg-card-alt border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800/60">
              
              {/* Right Panel Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-card-alt">
                <div>
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wide flex items-center gap-1.5">
                    <Truck size={14} className="text-brand" />
                    <span>Cotización y Resumen</span>
                  </h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Estadísticas estimadas del despacho</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-card-alt text-text-muted hover:text-text-primary transition-colors hidden lg:block">
                  <X size={18} />
                </button>
              </div>

              {/* Summary Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Client Label Preview */}
                <div className="bg-card p-5 rounded-3xl border border-slate-200/40 dark:border-slate-800/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Destinatario</span>
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-brand-bg text-brand">Hoko Logística</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-text-primary truncate">{createForm.customerName || '—'}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted font-semibold">
                      <p className="flex items-center gap-1"><Phone size={10} className="text-text-placeholder" /> {createForm.customerPhone || '—'}</p>
                      <p className="flex items-center gap-1"><Hash size={10} className="text-text-placeholder" /> {createForm.customerIdentification || '—'}</p>
                      <p className="col-span-2 flex items-center gap-1"><MapPin size={10} className="text-text-placeholder" /> <span className="truncate">{createForm.customerAddress || '—'} ({cities.find(c => String(c.id) === createForm.cityId)?.name || 'Sin ciudad'})</span></p>
                    </div>
                  </div>
                </div>

                {/* Package Totals Card */}
                <div className="bg-card p-5 rounded-3xl border border-slate-200/40 dark:border-slate-800/80 shadow-sm space-y-3">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Resumen de Totales</span>
                  <div className="space-y-1.5 text-xs font-semibold text-text-muted">
                    <div className="flex items-center justify-between">
                      <span>Valor de Productos</span>
                      <span className="text-text-primary">${(parseInt(createForm.amount || '0') * parseInt(createForm.unitPrice || '0')).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cobro al cliente</span>
                      <span className="text-text-primary font-black">${createForm.payment === '0' ? (parseInt(createForm.amount || '0') * parseInt(createForm.unitPrice || '0')).toLocaleString('es-CO') : '$0'}</span>
                    </div>
                  </div>
                </div>

                {/* Courier Selection List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Transportadoras Disponibles</span>
                    {quoting && <RefreshCw size={12} className="animate-spin text-brand" />}
                  </div>

                  {quoting ? (
                    <div className="text-center py-10 bg-card rounded-3xl border border-dashed border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                      <RefreshCw size={24} className="animate-spin text-brand mx-auto" />
                      <p className="text-[10px] text-text-muted font-bold mt-3">Calculando flete para {cities.find(c => String(c.id) === createForm.cityId)?.name}...</p>
                    </div>
                  ) : quotations.length > 0 ? (
                    <div className="space-y-2">
                       {quotations.map((q) => {
                         const priceVal = q.price ?? (q as any).freight ?? (q as any).total ?? 0;
                         const daysVal = q.delivered_days ?? (q as any).days ?? (q as any).transit_days ?? (q as any).delivery_time ?? '—';
                         return (
                           <div key={q.courier_id}
                             onClick={() => setCreateForm(f => ({ ...f, courierId: String(q.courier_id) }))}
                             className={`group flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${String(q.courier_id) === createForm.courierId ? 'border-brand bg-brand-bg/40 shadow-sm ring-2 ring-brand' : 'border-slate-200/40 dark:border-slate-800 bg-card hover:bg-hover'}`}>
                             <div className="space-y-1">
                               <p className="text-xs font-black text-text-primary uppercase tracking-tight">{q.courier_name}</p>
                               <span className="inline-block px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-card-alt border border-slate-100 dark:border-slate-800 text-text-muted">
                                 {daysVal} días hábiles
                               </span>
                             </div>
                             <div className="text-right">
                               <p className="text-xs font-black text-brand">${Number(priceVal).toLocaleString('es-CO')}</p>
                               <p className="text-[8px] text-text-placeholder font-bold uppercase mt-0.5">Costo envío</p>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  ) : createForm.cityId ? (
                    <div className="text-center py-10 bg-card rounded-3xl border border-slate-200/40 dark:border-slate-800/80 shadow-sm">
                      <p className="text-[10px] text-text-muted italic font-bold">No hay tarifas calculadas para este destino.</p>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-card rounded-3xl border border-dashed border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                      <p className="text-[10px] text-text-muted italic font-bold">Completa la ciudad destino para listar las tarifas.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── Edit Order Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="bg-card rounded-[32px] border border-slate-200/50 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh] lg:h-[75vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-brand text-[9px] font-black uppercase tracking-widest">Modificar Detalles</span>
                <h2 className="text-sm font-black text-text-primary uppercase mt-0.5">Editar orden Hoko #{selectedOrder?.id}</h2>
              </div>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-hover rounded-xl text-text-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Customer */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <User size={12} className="text-brand" />
                    <span>Datos del destinatario</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Nombre completo</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerName} onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Email</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerEmail} onChange={e => setEditForm(f => ({ ...f, customerEmail: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Teléfono</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerPhone} onChange={e => setEditForm(f => ({ ...f, customerPhone: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Identificación</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerIdentification} onChange={e => setEditForm(f => ({ ...f, customerIdentification: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Ciudad</label>
                      <select className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 appearance-none cursor-pointer"
                        value={editForm.cityId} onChange={e => setEditForm(f => ({ ...f, cityId: e.target.value }))} required>
                        <option value="">Seleccionar...</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Dirección</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.customerAddress} onChange={e => setEditForm(f => ({ ...f, customerAddress: e.target.value }))} required />
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <Package size={12} className="text-brand" />
                    <span>Contenido y Medidas</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Contenido de la orden</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.contain} onChange={e => setEditForm(f => ({ ...f, contain: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Peso (kg)</label>
                      <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                        value={editForm.weight} onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-3 gap-3 col-span-2">
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Ancho (cm)</label>
                        <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                          value={editForm.width} onChange={e => setEditForm(f => ({ ...f, width: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Alto (cm)</label>
                        <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                          value={editForm.height} onChange={e => setEditForm(f => ({ ...f, height: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Largo (cm)</label>
                        <input className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand/80 focus:ring-4 focus:ring-brand/10 transition-all mt-1 placeholder:text-text-placeholder/60"
                          value={editForm.length} onChange={e => setEditForm(f => ({ ...f, length: e.target.value }))} required />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-card flex items-center justify-between shrink-0">
                <Button type="button" variant="ghost" onClick={() => setShowEdit(false)} className="h-11 px-6 rounded-2xl text-xs font-bold transition-all">Cancelar</Button>
                <Button type="submit" variant="primary" disabled={editing} className="h-11 px-8 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  {editing ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
