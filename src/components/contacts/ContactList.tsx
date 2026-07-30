"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  User,
  Hash,
  Globe,
  Tag,
  Eye
} from 'lucide-react';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Avatar } from '../shared/Avatar';

export function ContactList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get('id');

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Single Client view details
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [loadingClientDetail, setLoadingClientDetail] = useState(false);

  // Fetch all clients
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single client detail (with their orders)
  const fetchClientDetail = async (id: string) => {
    setLoadingClientDetail(true);
    try {
      const res = await fetch(`/api/clientes?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSelectedClient(data);
      } else {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
      setSelectedClient(null);
    } finally {
      setLoadingClientDetail(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Listen to URL parameter changes to show client detail immediately
  useEffect(() => {
    if (clientIdFromUrl) {
      fetchClientDetail(clientIdFromUrl);
    } else {
      setSelectedClient(null);
    }
  }, [clientIdFromUrl]);

  const filteredClients = clients.filter(c => 
    String(c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.telefono || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChannelBadge = (canal: string) => {
    switch (canal) {
      case 'pagina_web':
        return <Badge variant="success" className="font-extrabold uppercase bg-brand/10 border-brand/20 text-brand">Shopify</Badge>;
      case 'whatsApp':
        return <Badge variant="info" className="font-extrabold uppercase bg-success/10 border-success/20 text-success">WhatsApp</Badge>;
      default:
        return <Badge variant="default" className="font-extrabold uppercase">{canal || 'Desconocido'}</Badge>;
    }
  };

  if (loadingClientDetail) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-brand" size={32} />
        <p className="text-text-muted font-medium text-sm">Cargando perfil del cliente...</p>
      </div>
    );
  }

  // Single Client Details View
  if (selectedClient) {
    const totalSpent = selectedClient.orders?.reduce((sum: number, o: any) => sum + (o.total_paid || 0), 0) || 0;

    return (
      <div className="w-full animate-in fade-in duration-300">

        {/* ═══ HERO HEADER ══════════════════════════════════════ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl mx-4 md:mx-6 mt-2 mb-5 shadow-2xl border border-white/5">
          {/* ambient glow blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-brand/8 blur-3xl pointer-events-none" />

          <div className="relative px-6 md:px-8 pt-6 pb-6">
            {/* Back */}
            <button
              onClick={() => {
                setSelectedClient(null);
                router.push('/contacts');
              }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors mb-5"
            >
              <ArrowLeft size={12} />
              <span>Volver a Clientes</span>
            </button>

            {/* Main hero row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-xl border border-white/10 shrink-0">
                  {String(selectedClient.nombre || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border text-white ${
                      selectedClient.canal === 'pagina_web' ? 'bg-brand/20 border-brand/30' : 'bg-emerald-500/20 border-emerald-500/30'
                    }`}>
                      {selectedClient.canal === 'pagina_web' ? 'Shopify' : selectedClient.canal || 'WhatsApp'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white leading-none">
                    {selectedClient.nombre}
                  </h1>
                  <p className="text-white/40 text-[10px] font-mono font-medium">
                    ID: {selectedClient.cliente_id}
                  </p>
                </div>
              </div>

              {/* Total spent summary */}
              <div className="md:text-right shrink-0">
                <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-0.5">Total Comprado</p>
                <p className="text-3xl font-black text-white">${totalSpent.toLocaleString('es-CO')}</p>
                <p className="text-[10px] text-white/45 font-bold uppercase mt-0.5">{selectedClient.orders?.length || 0} pedido(s) registrado(s)</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BODY: Split grid ════════════════════════════════ */}
        <div className="px-4 md:px-6 grid grid-cols-1 xl:grid-cols-5 gap-4 pb-10">

          {/* LEFT COL (2/5): General Info */}
          <div className="xl:col-span-2">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
                <User size={14} className="text-text-muted" />
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Informacion General</span>
              </div>
              <div className="px-5 py-4 space-y-3.5 text-xs font-medium">
                {selectedClient.identificacion && (
                  <div>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Identificacion</span>
                    <span className="text-text-primary font-bold">{selectedClient.identificacion}</span>
                  </div>
                )}
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Telefono</span>
                  <span className="text-text-primary font-bold flex items-center gap-1.5 mt-1">
                    <Phone size={12} className="text-text-muted shrink-0" />
                    {selectedClient.telefono || 'Sin telefono'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Email</span>
                  <span className="text-text-primary font-bold flex items-center gap-1.5 mt-1">
                    <Mail size={12} className="text-text-muted shrink-0" />
                    {selectedClient.email || 'Sin correo registrado'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Direccion</span>
                  <span className="text-text-primary font-bold flex items-center gap-1.5 mt-1">
                    <MapPin size={12} className="text-text-muted shrink-0" />
                    {selectedClient.direccion || 'Sin direccion'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block">Ciudad</span>
                  <span className="text-text-primary font-bold mt-1 block">{selectedClient.ciudad || 'Sin ciudad'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COL (3/5): Orders History */}
          <div className="xl:col-span-3">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={14} className="text-text-muted" />
                  <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Historial de Pedidos</span>
                </div>
                <span className="bg-brand/10 text-brand text-[9px] px-2 py-0.5 rounded-full font-black">
                  {selectedClient.orders?.length || 0}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {!selectedClient.orders || selectedClient.orders.length === 0 ? (
                  <p className="p-8 text-center text-xs text-text-muted italic">Este cliente no tiene pedidos registrados.</p>
                ) : (
                  selectedClient.orders.map((order: any) => {
                    const orderDate = new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
                    const isFulfill = order.delivery_state === '4';

                    return (
                      <div key={order.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <div>
                          <p className="text-xs font-black text-text-primary hover:text-brand transition-colors cursor-pointer" onClick={() => router.push(`/pedidos/${order.id}`)}>
                            {order.shopify_order_name || `Pedido #${order.id}`}
                          </p>
                          <p className="text-[10px] text-text-muted font-medium mt-0.5">
                            {orderDate} | <span className="uppercase font-bold">{order.payment_type || 'Manual'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-black text-text-primary">
                              ${(order.total_paid || 0).toLocaleString('es-CO')}
                            </p>
                            <span className={`inline-block text-[9px] font-bold mt-0.5 ${isFulfill ? 'text-success' : 'text-warning'}`}>
                              {isFulfill ? 'Entregado' : 'Pendiente'}
                            </span>
                          </div>
                          <button
                            onClick={() => router.push(`/pedidos/${order.id}`)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-bg transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6 py-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase italic">
            Clientes <span className="text-brand">Telocalizo</span>
          </h1>
          <p className="text-text-muted font-medium text-xs mt-1">Gestiona los clientes registrados en Telocalizo Chats desde Supabase.</p>
        </div>
        <Button 
          variant="outline"
          onClick={fetchClients} 
          disabled={loading}
          className="flex items-center gap-2 border-slate-200/50 dark:border-slate-800"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sincronizar</span>
        </Button>
      </div>

      {/* Search bar */}
      <div className="bg-card p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-ring"
            placeholder="Buscar clientes por nombre, teléfono, email..."
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-brand" size={28} />
            <p className="text-text-muted font-medium text-sm">Cargando lista de clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <User className="text-text-muted/40" size={40} />
            <p className="text-text-muted font-black text-sm uppercase tracking-wider">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-card-alt">
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Origen</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Identificación</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Teléfono / Email</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Ciudad / Dirección</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredClients.map((client) => (
                  <tr 
                    key={client.cliente_id} 
                    onClick={() => router.push(`/contacts?id=${encodeURIComponent(client.cliente_id)}`)}
                    className="hover:bg-hover transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={client.nombre || 'Cliente'} />
                        <span className="text-xs font-black text-text-primary">{client.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getChannelBadge(client.canal)}
                    </td>
                    <td className="px-4 py-4 text-xs font-mono font-bold text-text-secondary">
                      {client.identificacion || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{client.telefono || '—'}</span>
                        {client.email && <span className="text-[10px] text-text-muted">{client.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{client.ciudad || '—'}</span>
                        {client.direccion && <span className="text-[10px] text-text-muted truncate max-w-[200px]">{client.direccion}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/contacts?id=${encodeURIComponent(client.cliente_id)}`);
                        }}
                        className="p-1 rounded-lg text-text-muted hover:text-brand hover:bg-brand-bg transition-colors"
                      >
                        <Eye size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-[10px] font-bold text-text-muted text-right">
        {filteredClients.length} de {clients.length} clientes
      </div>
    </div>
  );
}
