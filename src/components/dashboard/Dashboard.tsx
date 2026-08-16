"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  TrendingUp, 
  CheckSquare, 
  Target,
  Clock,
  MoreVertical,
  DollarSign,
  ShoppingBag,
  Users,
  MessageCircle,
  RefreshCw,
  Box,
  Truck,
  Percent,
  Activity,
  Layers,
  ChevronRight,
  TrendingDown,
  Filter,
  X
} from 'lucide-react';
import { ExportDropdown } from '../shared/ExportDropdown';
import { exportToCSV, exportToXML, mapFinancialRow, buildTotalsRow, FINANCIAL_HEADERS, type FinancialOrderRow } from '../../utils/exportUtils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export function Dashboard() {
  const { state } = useApp();
  const router = useRouter();
  
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [realClients, setRealClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    canal: 'ALL',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Financial values customizable from Settings
  const [costCogs, setCostCogs] = useState(30000);
  const [costShippingRecaudo, setCostShippingRecaudo] = useState(15000);
  const [costShippingCredito, setCostShippingCredito] = useState(10500);
  const [boldPct, setBoldPct] = useState(3.67);

  // Load custom cost values on mount
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
  }, []);

  // Fetch real data on mount
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resOrders, resClients] = await Promise.all([
        fetch('/api/pedidos', { cache: 'no-store' }),
        fetch('/api/clientes', { cache: 'no-store' })
      ]);
      const dbPedidos = await resOrders.json();
      const dataClients = await resClients.json();
      
      if (Array.isArray(dataClients)) {
        setRealClients(dataClients);
      }

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
          console.error("Error fetching Shopify orders on dashboard:", e);
        }

        const shopifyMap = new Map<string, any>();
        shopifyOrders.forEach((o: any) => {
          shopifyMap.set(o.id.toLowerCase(), o);
          const numOnly = o.id.split('/').pop()?.toLowerCase();
          if (numOnly) shopifyMap.set(numOnly, o);
          shopifyMap.set(o.name.toLowerCase(), o);
          shopifyMap.set(o.name.replace('#', '').toLowerCase(), o);
        });

        const mergedOrders = dbPedidos.map((dbOrder: any) => {
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

        setRealOrders(mergedOrders);
      }
    } catch (e) {
      console.error("Error loading dashboard metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  // Filtered orders for dynamic calculations
  const filteredOrders = realOrders.filter(order => {
    const orderDate = new Date(order.created_at);
    const matchesDateFrom = !filters.dateFrom || orderDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || orderDate <= new Date(filters.dateTo + 'T23:59:59');
    const matchesCanal = filters.canal === 'ALL' || order.canal === filters.canal;
    return matchesDateFrom && matchesDateTo && matchesCanal;
  });

  // Calculations General
  const totalSalesReal = filteredOrders
    .filter(o => getOrderStatus(o) !== 'CANCELLED')
    .reduce((sum, o) => sum + getOrderTotalVal(o), 0);

  const totalOrdersReal = filteredOrders.length;
  const totalClientsReal = realClients.length;
  const averageTicketReal = totalOrdersReal > 0 ? totalSalesReal / totalOrdersReal : 0;

  const unfulfilledOrdersCount = filteredOrders.filter(o => {
    if (o.displayFulfillmentStatus) return o.displayFulfillmentStatus === 'UNFULFILLED';
    return o.delivery_state !== '4';
  }).length;

  const deliveredCount = filteredOrders.filter(o => {
    if (o.guide) {
      const state = String(o.guide.state);
      return state === '3' || state === '17' || state === '19';
    }
    return o.delivery_state === '4';
  }).length;

  // Telocalizo business specific calculations based on customized rules
  // 1. Cost of equipment (COGS)
  const totalCOGS = filteredOrders
    .filter(o => getOrderStatus(o) !== 'CANCELLED')
    .reduce((sum, o) => sum + ((o.quantity || 1) * costCogs), 0);

  // 2. Bold Commission
  const totalBoldCommission = filteredOrders
    .filter(o => getOrderStatus(o) !== 'CANCELLED' && (o.canal === 'pagina_web' || String(o.payment_type || '').toLowerCase().includes('tienda')))
    .reduce((sum, o) => sum + (getOrderTotalVal(o) * (boldPct / 100)), 0);

  // 3. Fletes / Envíos
  const totalShippingCost = filteredOrders
    .filter(o => getOrderStatus(o) !== 'CANCELLED')
    .reduce((sum, o) => {
      const isRecaudo = !(o.canal === 'pagina_web' || String(o.payment_type || '').toLowerCase().includes('tienda'));
      return sum + (isRecaudo ? costShippingRecaudo : costShippingCredito);
    }, 0);

  // 4. Utility / profit
  const totalUtilidadReal = totalSalesReal - totalBoldCommission - totalShippingCost - totalCOGS;
  const totalExpenses = totalBoldCommission + totalShippingCost + totalCOGS;
  const marginPercentage = totalSalesReal > 0 ? (totalUtilidadReal / totalSalesReal) * 100 : 0;

  // ── Export helpers ──
  const buildFinancialRows = (ordersList = filteredOrders): FinancialOrderRow[] =>
    ordersList
      .filter(o => getOrderStatus(o) !== 'CANCELLED')
      .map(o => {
        const totalVenta = getOrderTotalVal(o);
        const cogs = (o.quantity || 1) * costCogs;
        const isCredit = o.canal === 'pagina_web' || String(o.payment_type || '').toLowerCase().includes('tienda');
        const boldComm = isCredit ? totalVenta * (boldPct / 100) : 0;
        const shipping = isCredit ? costShippingCredito : costShippingRecaudo;
        const utilidad = totalVenta - cogs - boldComm - shipping;
        return {
          pedido: o.shopify_order_name || `#${o.db_id}`,
          canal: o.canal === 'pagina_web' ? 'Shopify' : o.canal,
          fecha: new Date(o.created_at).toLocaleDateString('es-CO'),
          cliente: o.customer?.name || '—',
          ciudad: o.customer?.city || '—',
          metodoPago: isCredit ? 'Crédito' : 'Recaudo',
          ingresoBruto: totalVenta,
          cogs,
          flete: shipping,
          comisionBold: boldComm,
          utilidadNeta: utilidad,
          accesoApp: o.acceso_app || 'PENDIENTE APP',
        } satisfies FinancialOrderRow;
      });

  const handleExportCSV = (dateFrom?: string, dateTo?: string) => {
    let source = filteredOrders;
    if (dateFrom || dateTo) {
      source = filteredOrders.filter(o => {
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
    exportToCSV(FINANCIAL_HEADERS, mappedRows, `INFO_TELOCALIZO_TAG_${date}`);
  };

  const handleExportXML = (dateFrom?: string, dateTo?: string) => {
    let source = filteredOrders;
    if (dateFrom || dateTo) {
      source = filteredOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        const matchesFrom = !dateFrom || orderDate >= new Date(dateFrom);
        const matchesTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
        return matchesFrom && matchesTo;
      });
    }
    const financialRows = buildFinancialRows(source);
    const mappedRows = financialRows.map(mapFinancialRow);
    const date = new Date().toISOString().slice(0, 10);
    exportToXML(FINANCIAL_HEADERS, mappedRows, `INFO_TELOCALIZO_TAG_${date}`, 'Liquidacion', 'Pedido', {
      empresa: 'Telocalizo',
      fecha: date,
      total: String(financialRows.length),
    });
  };

  const pipelineStages = [
    { name: 'Shopify Ventas', value: filteredOrders.filter(o => o.canal === 'pagina_web' && getOrderStatus(o) !== 'CANCELLED').reduce((sum, o) => sum + getOrderTotalVal(o), 0), color: '#3b82f6' },
    { name: 'WhatsApp Ventas', value: filteredOrders.filter(o => o.canal !== 'pagina_web' && getOrderStatus(o) !== 'CANCELLED').reduce((sum, o) => sum + getOrderTotalVal(o), 0), color: '#10b981' },
  ];

  // Financial pie chart distribution data
  const financialDistribution = [
    { name: 'Costo Equipos (COGS)', value: totalCOGS, color: '#f59e0b' },
    { name: 'Fletes / Envíos', value: totalShippingCost, color: '#3b82f6' },
    { name: 'Comisiones Pasarela', value: totalBoldCommission, color: '#ef4444' },
    { name: 'Utilidad Neta', value: totalUtilidadReal > 0 ? totalUtilidadReal : 0, color: '#10b981' }
  ];

  // Group last 7 days of orders trend
  const getOrdersTrendData = () => {
    const dailyMap = new Map<string, { count: number; sales: number; profit: number }>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      dailyMap.set(dateStr, { count: 0, sales: 0, profit: 0 });
    }
    
    filteredOrders.forEach(o => {
      const orderDate = new Date(o.created_at);
      const dateStr = orderDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      if (dailyMap.has(dateStr)) {
        const current = dailyMap.get(dateStr)!;
        const totalVal = getOrderStatus(o) === 'CANCELLED' ? 0 : getOrderTotalVal(o);
        const cogs = getOrderStatus(o) === 'CANCELLED' ? 0 : (o.quantity || 1) * costCogs;
        const commission = getOrderStatus(o) === 'CANCELLED' ? 0 : (o.canal === 'pagina_web' || String(o.payment_type || '').toLowerCase().includes('tienda')) ? totalVal * (boldPct / 100) : 0;
        const shipping = getOrderStatus(o) === 'CANCELLED' ? 0 : (o.canal === 'pagina_web' || String(o.payment_type || '').toLowerCase().includes('tienda')) ? costShippingCredito : costShippingRecaudo;
        const profit = totalVal - cogs - commission - shipping;

        dailyMap.set(dateStr, {
          count: current.count + 1,
          sales: current.sales + totalVal,
          profit: current.profit + profit
        });
      }
    });
    
    return Array.from(dailyMap.entries()).map(([name, val]) => ({
      name,
      pedidos: val.count,
      ventas: val.sales,
      utilidad: val.profit
    }));
  };

  const trendData = getOrdersTrendData();

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-brand" size={32} />
        <p className="text-text-muted font-medium text-sm">Cargando métricas del negocio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">
            ¡Hola, {state.currentUser?.name.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Panel de control unificado comercial, operacional y rentabilidad neta real.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${showFilters ? 'bg-brand text-white border-brand' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary border border-slate-200 dark:border-slate-800'}`}
          >
            <Filter size={14} /> Filtros
            {(filters.dateFrom || filters.dateTo || filters.canal !== 'ALL') && (
              <span className="bg-brand-bg text-brand dark:text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">!</span>
            )}
          </button>
          <button 
            onClick={fetchDashboardData}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary border border-slate-200 dark:border-slate-800 font-bold px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <RefreshCw size={14} /> Sincronizar
          </button>
          <ExportDropdown
            label="INFO TAG"
            onExportCSV={handleExportCSV}
            onExportXML={handleExportXML}
            disabled={loading || filteredOrders.length === 0}
          />
          <button 
            onClick={() => router.push('/pipeline')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform whitespace-nowrap"
          >
            <Target size={16} /> Nuevo negocio
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Origen (Canal)</label>
              <select
                value={filters.canal}
                onChange={(e) => setFilters(f => ({ ...f, canal: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              >
                <option value="ALL">Todos</option>
                <option value="pagina_web">Shopify</option>
                <option value="whatsApp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-text-muted uppercase tracking-wider block mb-1">Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-800 bg-input text-text-secondary"
              />
            </div>
          </div>
          {(filters.dateFrom || filters.dateTo || filters.canal !== 'ALL') && (
            <div className="flex justify-end">
              <button
                onClick={() => setFilters({ dateFrom: '', dateTo: '', canal: 'ALL' })}
                className="text-xs text-brand hover:underline font-bold"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Row 1: Financial KPIs */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-emerald-500">Métricas Financieras Reales</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Gross Income Card */}
          <div className="bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Ingresos Brutos</span>
              <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                <DollarSign size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-xl font-black text-text-primary tracking-tight font-mono">
                ${totalSalesReal.toLocaleString('es-CO')}
              </h3>
              <span className="text-[8px] font-bold text-text-muted block">Facturación Bruta Valida</span>
            </div>
          </div>

          {/* COGS (Costo Equipos) Card */}
          <div className="bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Costo Equipos (COGS)</span>
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                <Box size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                ${totalCOGS.toLocaleString('es-CO')}
              </h3>
              <span className="text-[8px] font-bold text-text-muted block">
                ${costCogs.toLocaleString('es-CO')} COP x unidad
              </span>
            </div>
          </div>

          {/* Fletes Card */}
          <div className="bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Fletes y Envíos</span>
              <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                <Truck size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight font-mono">
                ${totalShippingCost.toLocaleString('es-CO')}
              </h3>
              <span className="text-[8px] font-bold text-text-muted block">
                ${costShippingRecaudo.toLocaleString('es-CO')} Rec | ${costShippingCredito.toLocaleString('es-CO')} Cred
              </span>
            </div>
          </div>

          {/* Net Profit Real Glowing Card */}
          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Utilidad Neta Real</span>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Activity size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-xl font-black text-emerald-500 tracking-tight font-mono">
                ${totalUtilidadReal.toLocaleString('es-CO')}
              </h3>
              <span className="text-[8px] font-bold text-emerald-600/70 dark:text-emerald-400/70 block">
                Ganancia líquida libre
              </span>
            </div>
          </div>

          {/* Margin Percentage Card */}
          <div className="bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Margen de Utilidad</span>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <Percent size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
                {marginPercentage.toFixed(1)}%
              </h3>
              <span className="text-[8px] font-bold text-text-muted block">
                Rentabilidad sobre venta
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Row 2: General & Operational KPIs */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-blue-500">Resumen Operativo del Negocio</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Facturación Total</p>
              <span className="text-sm font-black text-text-primary">${totalSalesReal.toLocaleString('es-CO')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 text-success rounded-xl">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Ticket Promedio</p>
              <span className="text-sm font-black text-text-primary">${averageTicketReal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <ShoppingBag size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Pedidos Totales</p>
              <span className="text-sm font-black text-text-primary">{totalOrdersReal}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 text-info rounded-xl">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Clientes</p>
              <span className="text-sm font-black text-text-primary">{totalClientsReal}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 text-warning rounded-xl">
              <Box size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Por Enviar</p>
              <span className="text-sm font-black text-warning">{unfulfilledOrdersCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 text-success rounded-xl">
              <Truck size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">Entregados</p>
              <span className="text-sm font-black text-emerald-500">{deliveredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Main Financial & Operational Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-xs">
              Histórico Financiero Semanal (Ventas Brutas vs Utilidad Neta)
            </h3>
            <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">Últimos 7 días</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toLocaleString('es-CO')}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area name="Venta Bruta" type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area name="Utilidad Neta" type="monotone" dataKey="utilidad" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-xs">
                Distribución Financiera
              </h3>
            </div>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialDistribution}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {financialDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {financialDistribution.map((item, i) => {
              const pct = totalSalesReal > 0 ? (item.value / totalSalesReal) * 100 : 0;
              return (
                <div key={i} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-text-secondary truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="text-text-primary font-mono font-bold">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Row 4: Channels Chart & Direct Expenses Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Channels Income Pie */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-xs">Ingresos por Canal Comercial</h3>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineStages}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 border-t border-slate-50 dark:border-slate-800/50 pt-4">
            {pipelineStages.map((s, i) => (
              <div key={i} className="flex items-center gap-2 font-medium text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                <span className="text-[10px] font-black text-slate-500 uppercase">{s.name}: ${s.value.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Expenses Breakdown Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-xs mb-6">
            Impuestos y Deducciones Directas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider">Concepto</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-right">Porcentaje</th>
                  <th className="px-4 py-3 text-[9px] font-black text-text-muted uppercase tracking-wider text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-semibold text-text-secondary">
                <tr>
                  <td className="px-4 py-3">Ingresos Totales (Venta Bruta)</td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">100.0%</td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary font-bold">${totalSalesReal.toLocaleString('es-CO')}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Costo de Equipos (COGS)</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-500">{(totalSalesReal > 0 ? (totalCOGS / totalSalesReal) * 100 : 0).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">-${totalCOGS.toLocaleString('es-CO')}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Costo de Envío Promedio (Fletes)</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-500">{(totalSalesReal > 0 ? (totalShippingCost / totalSalesReal) * 100 : 0).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-600 dark:text-blue-400 font-bold">-${totalShippingCost.toLocaleString('es-CO')}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Pasarela de Pago (Bold - {boldPct}%)</td>
                  <td className="px-4 py-3 text-right font-mono text-red-500">{(totalSalesReal > 0 ? (totalBoldCommission / totalSalesReal) * 100 : 0).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 dark:text-red-400 font-bold">-${totalBoldCommission.toLocaleString('es-CO')}</td>
                </tr>
                <tr className="bg-slate-50 dark:bg-slate-800/20 font-black text-text-primary">
                  <td className="px-4 py-3.5">Utilidad Neta Real Liquidada</td>
                  <td className="px-4 py-3.5 text-right font-mono">{marginPercentage.toFixed(1)}%</td>
                  <td className="px-4 py-3.5 text-right font-mono text-emerald-500 text-sm font-black">${totalUtilidadReal.toLocaleString('es-CO')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Row 5: Recent Orders & Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-xs">Resumen de Pedidos Recientes</h3>
            <button 
              onClick={() => router.push('/ordenes')}
              className="text-blue-600 text-xs font-bold hover:underline bg-transparent border-0 cursor-pointer"
            >
              Ver pedidos Hub
            </button>
          </div>
          <div className="space-y-4">
            {realOrders.slice(0, 4).map((order) => {
              const clientName = order.customer?.name || 'Cliente';
              const orderTotal = getOrderTotalVal(order);
              const orderDate = new Date(order.created_at).toLocaleDateString('es-CO');
              return (
                <div key={order.db_id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 dark:border-slate-800/50">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {order.shopify_order_name || `Pedido #${order.db_id}`}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">{clientName} | {orderDate}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-text-primary">${orderTotal.toLocaleString('es-CO')}</span>
                    <p className="text-[10px] font-extrabold uppercase mt-0.5 text-brand">{order.canal === 'pagina_web' ? 'Shopify' : order.canal}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-xs">Tareas urgentes</h3>
            <button 
              onClick={() => router.push('/tasks')}
              className="text-blue-600 text-xs font-bold hover:underline bg-transparent border-0 cursor-pointer"
            >
              Ir a tareas
            </button>
          </div>
          <div className="space-y-3">
            {state.tasks?.slice(0, 4).map((task) => (
              <div key={task.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.title}</p>
                    <p className="text-[11px] font-bold text-slate-400">Vence hoy, 4:00 PM</p>
                  </div>
                </div>
                <CheckSquare className="text-slate-300 group-hover:text-blue-600 transition-colors cursor-pointer" size={18} />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
