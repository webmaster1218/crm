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
  Truck
} from 'lucide-react';
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
  Cell
} from 'recharts';

export function Dashboard() {
  const { state } = useApp();
  const router = useRouter();
  
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [realClients, setRealClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data on mount
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch orders and clients
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
        // 2. Fetch Shopify orders list to merge rich pricing details (totalPriceSet)
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

        // Map Shopify orders
        const shopifyMap = new Map<string, any>();
        shopifyOrders.forEach((o: any) => {
          shopifyMap.set(o.id.toLowerCase(), o);
          const numOnly = o.id.split('/').pop()?.toLowerCase();
          if (numOnly) shopifyMap.set(numOnly, o);
          shopifyMap.set(o.name.toLowerCase(), o);
          shopifyMap.set(o.name.replace('#', '').toLowerCase(), o);
        });

        // Merge Shopify data into DB orders
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

  // Calculations
  const activeConversations = state.conversations?.filter(c => c.status === 'Abierta').length || 0;
  
  const totalSalesReal = realOrders
    .filter(o => getOrderStatus(o) !== 'CANCELLED')
    .reduce((sum, o) => sum + getOrderTotalVal(o), 0);

  const totalOrdersReal = realOrders.length;
  const totalClientsReal = realClients.length;

  const pipelineStages = [
    { name: 'Shopify Ventas', value: realOrders.filter(o => o.canal === 'pagina_web' && getOrderStatus(o) !== 'CANCELLED').reduce((sum, o) => sum + getOrderTotalVal(o), 0), color: '#3b82f6' },
    { name: 'WhatsApp Ventas', value: realOrders.filter(o => o.canal !== 'pagina_web' && getOrderStatus(o) !== 'CANCELLED').reduce((sum, o) => sum + getOrderTotalVal(o), 0), color: '#10b981' },
  ];

  // Group last 7 days of orders trend
  const getOrdersTrendData = () => {
    const dailyMap = new Map<string, number>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      dailyMap.set(dateStr, 0);
    }
    
    realOrders.forEach(o => {
      const orderDate = new Date(o.created_at);
      const dateStr = orderDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, dailyMap.get(dateStr)! + 1);
      }
    });
    
    return Array.from(dailyMap.entries()).map(([name, count]) => ({
      name,
      pedidos: count
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">¡Hola, {state.currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aquí está lo que está pasando en Telocalizo Chats hoy con datos reales.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={fetchDashboardData}
             className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary border border-slate-200 dark:border-slate-800 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors"
           >
             <RefreshCw size={14} /> Sincronizar
           </button>
           <button 
             onClick={() => router.push('/pipeline')}
             className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 transition-transform"
           >
             <Target size={16} /> Nuevo negocio
           </button>
        </div>
      </div>

      {/* Styled KPIs Row matching Pedidos Hub */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Facturación Total</p>
            <span className="text-base font-black text-text-primary">${totalSalesReal.toLocaleString('es-CO')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-success/10 text-success rounded-xl">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pedidos Totales</p>
            <span className="text-base font-black text-text-primary">{totalOrdersReal}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-info/10 text-info rounded-xl">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Clientes</p>
            <span className="text-base font-black text-text-primary">{totalClientsReal}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
            <MessageCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Chats Activos</p>
            <span className="text-base font-black text-warning">{activeConversations}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart (Order Trend Line Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Tendencia de Pedidos (Últimos 7 días)</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><MoreVertical size={16}/></button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart (Sales Distribution Pie) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Ingresos por Canal</h3>
             <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><MoreVertical size={16}/></button>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineStages}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pipelineStages.map((s, i) => (
              <div key={i} className="flex items-center gap-2 font-medium text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                <span className="text-[10px] font-black text-slate-500 uppercase">{s.name}: ${s.value.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgencies and Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Urgencies Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Resumen de Pedidos Recientes</h3>
            <button 
              onClick={() => router.push('/pedidos')}
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

        {/* Tasks urgency */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
           <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900 dark:text-white tracking-tight italic uppercase text-sm">Tareas urgentes</h3>
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
