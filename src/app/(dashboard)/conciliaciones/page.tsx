"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  DollarSign, 
  Box, 
  Truck, 
  Percent, 
  Activity,
  ArrowUpDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Receipt,
  Wallet,
  BarChart3,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { ExportDropdown } from '../../../components/shared/ExportDropdown';
import { exportToCSV, exportToXML, mapFinancialRow, buildTotalsRow, FINANCIAL_HEADERS, type FinancialOrderRow } from '../../../utils/exportUtils';

export default function LiquidacionPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'ALL',
    payment: 'ALL',
    fulfillment: 'ALL',
    dateFrom: '',
    dateTo: '',
    canal: 'ALL',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Dynamic parameters from Settings/localStorage
  const [costCogs, setCostCogs] = useState(30000);
  const [costShippingRecaudo, setCostShippingRecaudo] = useState(15000);
  const [costShippingCredito, setCostShippingCredito] = useState(10500);
  const [boldPct, setBoldPct] = useState(3.67);

  // Sorting
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Expandable rows
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCogs = localStorage.getItem('financial_cogs');
      const savedRecaudo = localStorage.getItem('financial_shipping_recaudo');
      const savedCredito = localStorage.getItem('financial_shipping_credito');
      const savedBold = localStorage.getItem('financial_bold_commission');

      if (savedCogs) setCostCogs(Number(savedCogs));
      if (savedRecaudo) setCostShippingRecaudo(Number(savedRecaudo));
      if (savedCredito) setCostShippingCredito(Number(savedCredito));
      if (savedBold) setBoldPct(Number(savedBold));
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pedidos', { cache: 'no-store' });
      const dbPedidos = await res.json();
      
      if (Array.isArray(dbPedidos)) {
        let shopifyOrders: any[] = [];
        try {
          const resShopify = await fetch('/api/shopify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query getOrders {
                  orders(first: 50, sortKey: CREATED_AT, reverse: true) {
                    edges {
                      node {
                        id
                        name
                        totalPriceSet {
                          presentmentMoney { amount currencyCode }
                        }
                      }
                    }
                  }
                }
              `
            })
          });
          const shopifyData = await resShopify.json();
          if (shopifyData?.data?.orders?.edges) {
            shopifyOrders = shopifyData.data.orders.edges.map((edge: any) => edge.node);
          }
        } catch (e) {
          console.error("Error fetching Shopify orders on liquidacion:", e);
        }

        const shopifyMap = new Map<string, any>();
        shopifyOrders.forEach((o: any) => {
          shopifyMap.set(o.id.toLowerCase(), o);
          const numOnly = o.id.split('/').pop()?.toLowerCase();
          if (numOnly) shopifyMap.set(numOnly, o);
          shopifyMap.set(o.name.toLowerCase(), o);
        });

        const merged = dbPedidos.map((dbOrder: any) => {
          if (dbOrder.canal === 'pagina_web') {
            let match = null;
            if (dbOrder.shopify_order_id) {
              match = shopifyMap.get(dbOrder.shopify_order_id.toLowerCase());
            }
            if (!match && dbOrder.shopify_order_name) {
              match = shopifyMap.get(dbOrder.shopify_order_name.toLowerCase());
            }
            if (match) {
              return {
                ...dbOrder,
                ...match,
                db_id: dbOrder.db_id,
                hoko_order_id: dbOrder.hoko_order_id,
                canal: dbOrder.canal,
                shopify_order_name: match.name,
                shopify_order_id: match.id,
              };
            }
          }
          return dbOrder;
        });

        setOrders(merged);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatus = (order: any): string => {
    if (order.cancelledAt || order.delivery_state === '5') return 'CANCELLED';
    if (order.displayFinancialStatus === 'VOIDED') return 'VOIDED';
    return 'ACTIVE';
  };

  const getOrderTotalVal = (order: any): number => {
    if (order.totalPriceSet?.presentmentMoney?.amount) {
      return parseFloat(order.totalPriceSet.presentmentMoney.amount);
    }
    return order.total_paid || 0;
  };

  const getOrderFinancials = (order: any) => {
    const isCancelled = getOrderStatus(order) === 'CANCELLED';
    const totalVenta = isCancelled ? 0 : getOrderTotalVal(order);
    const quantity = isCancelled ? 0 : (order.quantity || 1);
    const cogs = quantity * costCogs;
    const isCredit = order.canal === 'pagina_web' || String(order.payment_type || '').toLowerCase().includes('tienda');
    const boldComm = isCredit ? totalVenta * (boldPct / 100) : 0;
    const shipping = isCancelled ? 0 : (isCredit ? costShippingCredito : costShippingRecaudo);
    const utilidad = isCancelled ? 0 : (totalVenta - cogs - boldComm - shipping);

    return { totalVenta, cogs, boldComm, shipping, utilidad, isCredit, isCancelled };
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getFinancialStatus = (order: any): string => {
    if (order.displayFinancialStatus) return order.displayFinancialStatus;
    const payType = String(order.payment_type || '').toLowerCase();
    if (payType.includes('pagado')) return 'PAID';
    return 'PENDING';
  };

  const getFulfillmentStatus = (order: any): string => {
    if (order.displayFulfillmentStatus) return order.displayFulfillmentStatus;
    const state = String(order.delivery_state || '');
    if (state === '4') return 'FULFILLED';
    if (state === '2' || state === '3') return 'PARTIALLY_FULFILLED';
    return 'UNFULFILLED';
  };

  const filteredOrders = orders.filter(o => {
    const clientName = (o.customer?.name || '').toLowerCase();
    const orderName = (o.shopify_order_name || `#${o.db_id}`).toLowerCase();
    const city = (o.customer?.city || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = clientName.includes(query) || orderName.includes(query) || city.includes(query);
    
    const matchesStatus = filters.status === 'ALL' || getOrderStatus(o) === filters.status;
    const matchesPayment = filters.payment === 'ALL' || getFinancialStatus(o) === filters.payment;
    const matchesFulfillment = filters.fulfillment === 'ALL' || getFulfillmentStatus(o) === filters.fulfillment;
    const matchesCanal = filters.canal === 'ALL' || o.canal === filters.canal;

    const orderDate = new Date(o.created_at);
    const matchesDateFrom = !filters.dateFrom || orderDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || orderDate <= new Date(filters.dateTo + 'T23:59:59');

    return matchesSearch && matchesCanal && matchesStatus && matchesPayment && matchesFulfillment && matchesDateFrom && matchesDateTo;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (sortField === 'total_paid') {
      aVal = getOrderTotalVal(a);
      bVal = getOrderTotalVal(b);
    } else if (sortField === 'utilidad') {
      aVal = getOrderFinancials(a).utilidad;
      bVal = getOrderFinancials(b).utilidad;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Aggregate totals
  let sumSales = 0, sumCogs = 0, sumBold = 0, sumShipping = 0, sumUtilidad = 0;
  sortedOrders.forEach(o => {
    const f = getOrderFinancials(o);
    sumSales += f.totalVenta;
    sumCogs += f.cogs;
    sumBold += f.boldComm;
    sumShipping += f.shipping;
    sumUtilidad += f.utilidad;
  });

  const activeOrders = sortedOrders.filter(o => getOrderStatus(o) === 'ACTIVE');
  const cancelledOrders = sortedOrders.filter(o => getOrderStatus(o) === 'CANCELLED');
  const creditOrders = sortedOrders.filter(o => getOrderFinancials(o).isCredit && getOrderStatus(o) === 'ACTIVE');
  const marginPct = sumSales > 0 ? (sumUtilidad / sumSales) * 100 : 0;
  const totalExpenses = sumCogs + sumBold + sumShipping;

  const buildFinancialRows = (ordersList = sortedOrders): FinancialOrderRow[] =>
    ordersList.map(o => {
      const f = getOrderFinancials(o);
      return {
        pedido: o.shopify_order_name || `#${o.db_id}`,
        canal: f.isCredit ? 'Shopify' : 'Chat/Recaudo',
        fecha: new Date(o.created_at).toLocaleDateString('es-CO'),
        cliente: o.customer?.name || '—',
        ciudad: o.customer?.city || '—',
        metodoPago: f.isCredit ? 'Crédito' : 'Recaudo',
        ingresoBruto: f.totalVenta,
        cogs: f.cogs,
        flete: f.shipping,
        comisionBold: f.boldComm,
        utilidadNeta: f.utilidad,
        accesoApp: o.acceso_app || 'PENDIENTE APP',
      } satisfies FinancialOrderRow;
    });

  const handleExportCSV = (dateFrom?: string, dateTo?: string) => {
    let source = sortedOrders;
    if (dateFrom || dateTo) {
      source = sortedOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        const matchesFrom = !dateFrom || orderDate >= new Date(dateFrom);
        const matchesTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
        return matchesFrom && matchesTo;
      });
    }
    const financialRows = buildFinancialRows(source);
    const mappedRows = financialRows.map(mapFinancialRow);
    mappedRows.push(buildTotalsRow(financialRows));
    const date = new Date().toISOString().slice(0, 10);
    exportToCSV(FINANCIAL_HEADERS, mappedRows, `liquidacion_telocalizo_${date}`);
  };

  const handleExportXML = (dateFrom?: string, dateTo?: string) => {
    let source = sortedOrders;
    if (dateFrom || dateTo) {
      source = sortedOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        const matchesFrom = !dateFrom || orderDate >= new Date(dateFrom);
        const matchesTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
        return matchesFrom && matchesTo;
      });
    }
    const financialRows = buildFinancialRows(source);
    const mappedRows = financialRows.map(mapFinancialRow);
    const date = new Date().toISOString().slice(0, 10);
    exportToXML(FINANCIAL_HEADERS, mappedRows, `liquidacion_telocalizo_${date}`, 'Liquidacion', 'Pedido', {
      empresa: 'Telocalizo',
      fecha: date,
      total: String(financialRows.length),
    });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={11} className="text-slate-400 opacity-50" />;
    return sortDirection === 'desc' 
      ? <ChevronDown size={11} className="text-brand" /> 
      : <ChevronUp size={11} className="text-brand" />;
  };

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Receipt className="text-emerald-500" size={20} />
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight italic uppercase">
              Liquidación
            </h1>
          </div>
          <p className="text-text-muted font-medium text-xs pl-10">
            Resumen financiero por pedido · Ingresos, costos y utilidad neta real
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="bg-card hover:bg-hover text-text-secondary border border-slate-200/50 dark:border-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Sincronizar
          </button>
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportXML={handleExportXML}
            disabled={loading || sortedOrders.length === 0}
          />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Ingreso Bruto */}
        <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Ingreso Bruto</span>
            <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
              <DollarSign size={13} />
            </div>
          </div>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <>
              <span className="text-lg font-black text-text-primary font-mono">{fmt(sumSales)}</span>
              <span className="text-[9px] font-bold text-text-muted">{activeOrders.length} pedidos activos</span>
            </>
          )}
        </div>

        {/* Costos Totales */}
        <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Costos Totales</span>
            <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
              <Box size={13} />
            </div>
          </div>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <>
              <span className="text-lg font-black text-red-500 font-mono">-{fmt(totalExpenses)}</span>
              <span className="text-[9px] font-bold text-text-muted">COGS + Flete + Comisión</span>
            </>
          )}
        </div>

        {/* Utilidad Neta */}
        <div className={`rounded-2xl border p-4 shadow-sm flex flex-col gap-2 ${
          sumUtilidad >= 0
            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
            : 'bg-red-500/5 dark:bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-black uppercase tracking-wider ${sumUtilidad >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Utilidad Neta
            </span>
            <div className={`p-1.5 rounded-lg ${sumUtilidad >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              <Activity size={13} />
            </div>
          </div>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <>
              <span className={`text-lg font-black font-mono ${sumUtilidad >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmt(sumUtilidad)}
              </span>
              <span className={`text-[9px] font-bold ${sumUtilidad >= 0 ? 'text-emerald-600/70 dark:text-emerald-400/60' : 'text-red-600/70 dark:text-red-400/60'}`}>
                {marginPct.toFixed(1)}% margen
              </span>
            </>
          )}
        </div>

        {/* Fletes */}
        <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Fletes</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Truck size={13} />
            </div>
          </div>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <>
              <span className="text-lg font-black text-indigo-500 font-mono">-{fmt(sumShipping)}</span>
              <span className="text-[9px] font-bold text-text-muted">
                Rec {fmt(costShippingRecaudo)} · Cred {fmt(costShippingCredito)}
              </span>
            </>
          )}
        </div>

        {/* Comisión Bold */}
        <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Bold ({boldPct}%)</span>
            <div className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
              <Percent size={13} />
            </div>
          </div>
          {loading ? (
            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          ) : (
            <>
              <span className="text-lg font-black text-orange-500 font-mono">-{fmt(sumBold)}</span>
              <span className="text-[9px] font-bold text-text-muted">{creditOrders.length} pedidos crédito</span>
            </>
          )}
        </div>
      </div>

      {/* ── Resumen rápido en una fila ── */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Pedidos Activos</p>
              <span className="text-sm font-black text-text-primary">{activeOrders.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <XCircle size={16} className="text-red-400 shrink-0" />
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Cancelados</p>
              <span className="text-sm font-black text-red-400">{cancelledOrders.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wallet size={16} className="text-brand shrink-0" />
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">COGS Total</p>
              <span className="text-sm font-black text-text-primary">{fmt(sumCogs)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 size={16} className="text-indigo-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Margen</p>
              <span className={`text-sm font-black ${marginPct >= 50 ? 'text-emerald-500' : marginPct >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                {marginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filter ── */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-card p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${showFilters ? 'bg-brand text-white border-brand' : 'border-slate-200/50 dark:border-slate-800 text-text-muted hover:text-text-primary'}`}
          >
            <Filter size={13} />
            <span>Filtros</span>
            {((filters.status !== 'ALL' || filters.payment !== 'ALL' || filters.fulfillment !== 'ALL' || filters.canal !== 'ALL' || filters.dateFrom || filters.dateTo) ? 1 : 0) > 0 && (
              <span className="bg-brand-bg text-brand dark:text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">!</span>
            )}
          </button>
        </div>
        {(searchQuery || filters.status !== 'ALL' || filters.payment !== 'ALL' || filters.fulfillment !== 'ALL' || filters.canal !== 'ALL' || filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilters({ status: 'ALL', payment: 'ALL', fulfillment: 'ALL', dateFrom: '', dateTo: '', canal: 'ALL' });
            }}
            className="text-[10px] font-bold text-brand hover:underline shrink-0"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="VOIDED">Anulados</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Pago</label>
              <select
                value={filters.payment}
                onChange={(e) => setFilters(f => ({ ...f, payment: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="PAID">Pagado</option>
                <option value="PENDING">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Preparación</label>
              <select
                value={filters.fulfillment}
                onChange={(e) => setFilters(f => ({ ...f, fulfillment: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="UNFULFILLED">No preparado</option>
                <option value="FULFILLED">Preparado</option>
                <option value="PARTIALLY_FULFILLED">Parcial</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Origen (Canal)</label>
              <select
                value={filters.canal}
                onChange={(e) => setFilters(f => ({ ...f, canal: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="pagina_web">Shopify</option>
                <option value="whatsApp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Rango Rápido</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  const today = new Date();
                  let from = '';
                  let to = today.toISOString().split('T')[0];

                  if (val === 'today') {
                    from = today.toISOString().split('T')[0];
                  } else if (val === '3days') {
                    const d = new Date();
                    d.setDate(today.getDate() - 2);
                    from = d.toISOString().split('T')[0];
                  } else if (val === 'week') {
                    const d = new Date();
                    d.setDate(today.getDate() - 7);
                    from = d.toISOString().split('T')[0];
                  } else if (val === 'month') {
                    const d = new Date(today.getFullYear(), today.getMonth(), 1);
                    from = d.toISOString().split('T')[0];
                  } else if (val === 'year') {
                    const d = new Date(today.getFullYear(), 0, 1);
                    from = d.toISOString().split('T')[0];
                  }

                  setFilters(f => ({
                    ...f,
                    dateFrom: from,
                    dateTo: to
                  }));
                }}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary cursor-pointer"
              >
                <option value="custom">Personalizado</option>
                <option value="today">Hoy</option>
                <option value="3days">Últimos 3 días</option>
                <option value="week">Últimos 7 días</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-brand" size={28} />
            <p className="text-text-muted font-bold text-xs">Cargando liquidación...</p>
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
            <Receipt className="text-text-muted/30" size={40} />
            <p className="text-text-muted font-black text-xs uppercase tracking-wider">Sin registros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Head */}
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-text-muted select-none">
                  <th
                    onClick={() => handleSort('shopify_order_name')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider">
                      Pedido <SortIcon field="shopify_order_name" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('canal')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors hidden sm:table-cell"
                  >
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider">
                      Canal <SortIcon field="canal" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('created_at')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors hidden md:table-cell"
                  >
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider">
                      Fecha <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider hidden lg:table-cell">Cliente</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-brand">
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('total_paid')}>
                      Ingreso <SortIcon field="total_paid" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hidden md:table-cell">COGS</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hidden md:table-cell">Flete</th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 hidden lg:table-cell">Bold</th>
                  <th
                    onClick={() => handleSort('utilidad')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Utilidad <SortIcon field="utilidad" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-black uppercase tracking-wider hidden lg:table-cell">App</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {sortedOrders.map((o) => {
                  const f = getOrderFinancials(o);
                  const orderId = o.shopify_order_name || `#${o.db_id}`;
                  const isExpanded = expandedRow === String(o.db_id);
                  const isCancelled = f.isCancelled;

                  return (
                    <React.Fragment key={o.db_id}>
                      <tr
                        onClick={() => setExpandedRow(isExpanded ? null : String(o.db_id))}
                        className={`cursor-pointer transition-all ${
                          isCancelled
                            ? 'opacity-40 bg-slate-50 dark:bg-slate-900/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
                        } ${isExpanded ? 'bg-brand/3 dark:bg-brand/5' : ''}`}
                      >
                        {/* Pedido */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-text-primary ${isCancelled ? 'line-through' : ''}`}>
                              {orderId}
                            </span>
                            {isCancelled && (
                              <span className="text-[8px] font-black uppercase bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                Cancelado
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Canal */}
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          {f.isCredit ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-[#96bf48]/10 text-[#557623] dark:text-[#b6d97c] border border-[#96bf48]/20 px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#96bf48] inline-block" />
                              Shopify
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-[#25D366]/10 text-[#0f7a3d] dark:text-[#5fe99a] border border-[#25D366]/20 px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] inline-block" />
                              Chat
                            </span>
                          )}
                        </td>

                        {/* Fecha */}
                        <td className="px-4 py-3.5 text-text-muted font-mono text-[10px] hidden md:table-cell">
                          {new Date(o.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </td>

                        {/* Cliente */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="max-w-[130px]">
                            <p className="font-semibold text-text-secondary truncate">{o.customer?.name || '—'}</p>
                            {o.customer?.city && (
                              <p className="text-[9px] text-text-muted uppercase truncate">{o.customer.city}</p>
                            )}
                          </div>
                        </td>

                        {/* Ingreso Bruto */}
                        <td className="px-4 py-3.5">
                          <span className="font-black text-brand font-mono">{fmt(f.totalVenta)}</span>
                        </td>

                        {/* COGS */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-amber-600 dark:text-amber-400 font-mono">-{fmt(f.cogs)}</span>
                        </td>

                        {/* Flete */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">-{fmt(f.shipping)}</span>
                        </td>

                        {/* Bold */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-orange-500 font-mono">
                            {f.boldComm > 0 ? `-${fmt(f.boldComm)}` : <span className="text-text-muted text-[9px]">N/A</span>}
                          </span>
                        </td>

                        {/* Utilidad */}
                        <td className="px-4 py-3.5">
                          <span className={`font-black font-mono ${f.utilidad >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {fmt(f.utilidad)}
                          </span>
                        </td>

                        {/* App */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className={`inline-block px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${
                            o.acceso_app === 'OK APP'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {o.acceso_app === 'OK APP' ? 'OK' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-brand/3 dark:bg-brand/5">
                          <td colSpan={10} className="px-4 pb-4 pt-0">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">Cliente</p>
                                <p className="text-xs font-bold text-text-primary">{o.customer?.name || '—'}</p>
                                <p className="text-[9px] text-text-muted">{o.customer?.city || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">Método Pago</p>
                                <p className="text-xs font-bold text-text-primary">{f.isCredit ? '🟢 Crédito' : '🟡 Recaudo'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">Ingreso Bruto</p>
                                <p className="text-xs font-black text-brand font-mono">{fmt(f.totalVenta)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">COGS</p>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">-{fmt(f.cogs)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">Flete + Bold</p>
                                <p className="text-xs font-bold text-indigo-500 font-mono">-{fmt(f.shipping + f.boldComm)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">Utilidad Neta</p>
                                <p className={`text-xs font-black font-mono ${f.utilidad >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {fmt(f.utilidad)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">Acceso App</p>
                                <p className="text-xs font-bold text-text-secondary">{o.acceso_app || 'PENDIENTE APP'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-0.5">Fecha</p>
                                <p className="text-xs font-bold text-text-secondary">
                                  {new Date(o.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* ── Totals Footer ── */}
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700">
                  <td colSpan={4} className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                        Total · {sortedOrders.length} registros
                      </span>
                    </div>
                  </td>
                  <td colSpan={2} className="px-4 py-4 lg:hidden">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                      Total · {sortedOrders.length}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-black text-brand font-mono">{fmt(sumSales)}</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="font-black text-amber-600 dark:text-amber-400 font-mono">-{fmt(sumCogs)}</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono">-{fmt(sumShipping)}</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="font-black text-orange-500 font-mono">-{fmt(sumBold)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-black font-mono text-sm ${sumUtilidad >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {fmt(sumUtilidad)}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
