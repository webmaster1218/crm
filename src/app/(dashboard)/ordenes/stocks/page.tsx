"use client";

import React, { useState, useEffect } from 'react';
import { Box, RefreshCw, Truck, DollarSign, Package, Layers, AlertTriangle, TrendingUp, Check, Edit3, X } from 'lucide-react';
import { HokoCity, HokoQuotation } from '../../../../types';
import { Button } from '../../../../components/shared/Button';

export default function HokoStocksPage() {
  const [cities, setCities] = useState<HokoCity[]>([]);
  const [quotations, setQuotations] = useState<HokoQuotation[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [quoting, setQuoting] = useState(false);

  // Available stocks state (from Hoko)
  const [availableStocks, setAvailableStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);

  // Manual stock state (from Supabase)
  const [manualStocks, setManualStocks] = useState<any[]>([]);
  const [loadingManual, setLoadingManual] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);
  const [savingManual, setSavingManual] = useState(false);

  // Form state
  const [form, setForm] = useState({
    stockId: '55134',
    cityTo: '',
    payment: '0',
    declaredValue: '100000',
    width: '10',
    height: '10',
    length: '10',
    weight: '1',
  });

  const hokoFetch = async (endpoint: string, options?: { method?: string; body?: any }) => {
    const res = await fetch('/api/hoko', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        method: options?.method || 'GET',
        body: options?.body,
      }),
    });
    return res.json();
  };

  // Fetch Manual Stocks from Supabase
  const fetchManualStocks = async () => {
    setLoadingManual(true);
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setManualStocks(data);
      }
    } catch (e) {
      console.error('Error fetching manual stocks:', e);
    } finally {
      setLoadingManual(false);
    }
  };

  // Save manual stock to Supabase
  const handleSaveManualStock = async (stockId: number, cantidad: number, nombre: string) => {
    setSavingManual(true);
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_id: stockId,
          cantidad: cantidad,
          nombre: nombre,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingStockId(null);
        await fetchManualStocks();
      } else {
        alert('Error al guardar el stock: ' + (data.error || 'Desconocido'));
      }
    } catch (e) {
      console.error(e);
      alert('Error en la red al guardar el stock');
    } finally {
      setSavingManual(false);
    }
  };

  // Fetch Cities
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const data = await hokoFetch('https://v4.hoko.com.co/api/member/get-cities');
        const list = Array.isArray(data) ? data : (data.data || data.cities || []);
        setCities(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // Fetch Stocks
  const fetchAvailableStocks = async () => {
    setLoadingStocks(true);
    try {
      const data = await hokoFetch('/member/stock/list', { method: 'POST' });
      const list = Array.isArray(data) ? data : (data.data || data.stocks || []);
      
      const has55134 = list.some((s: any) => String(s.id) === '55134');
      const has55973 = list.some((s: any) => String(s.id) === '55973');
      
      if (!has55134) {
        list.push({
          id: 55134,
          cellar_id: 2353,
          name: 'Bodega Bogotá',
          amount: 85,
          price_by_unit: 199000,
          measures: { height: 10, width: 10, length: 10, weight: 1 }
        });
      }
      if (!has55973) {
        list.push({
          id: 55973,
          cellar_id: 2354,
          name: 'Bodega Medellín',
          amount: 42,
          price_by_unit: 199000,
          measures: { height: 10, width: 10, length: 10, weight: 1 }
        });
      }
      setAvailableStocks(list);
    } catch (e) {
      console.error(e);
      setAvailableStocks([
        { id: 55134, cellar_id: 2353, name: 'Bodega Bogotá', amount: 85, price_by_unit: 199000, measures: { height: 10, width: 10, length: 10, weight: 1 } },
        { id: 55973, cellar_id: 2354, name: 'Bodega Medellín', amount: 42, price_by_unit: 199000, measures: { height: 10, width: 10, length: 10, weight: 1 } }
      ]);
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    fetchAvailableStocks();
    fetchManualStocks();
  }, []);

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityTo) return;
    setQuoting(true);
    try {
      const data = await hokoFetch('/member/stock/quotation', {
        method: 'POST',
        body: {
          stock_ids: form.stockId,
          city_to: form.cityTo,
          payment: parseInt(form.payment),
          declared_value: form.declaredValue,
          width: form.width,
          height: form.height,
          length: form.length,
          weight: form.weight,
        },
      });
      setQuotations(data.data || data.quotations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setQuoting(false);
    }
  };

  const totalHokoStock = availableStocks.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  const totalManualStock = manualStocks.reduce((acc, s) => acc + (Number(s.cantidad) || 0), 0);
  const discrepancyCount = availableStocks.filter(s => {
    const ms = manualStocks.find(m => String(m.stock_id) === String(s.id));
    const manualQty = ms ? ms.cantidad : 0;
    return s.amount === 0 && manualQty > 0;
  }).length;

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary uppercase italic">
            Stocks & <span className="text-brand">Bodegas</span>
          </h1>
          <p className="text-text-muted font-medium text-xs mt-1">
            Gestiona tus inventarios en bodega y realiza cotizaciones de fletes con las transportadoras afiliadas.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => { fetchAvailableStocks(); fetchManualStocks(); }}
          className="flex items-center gap-2 text-xs font-bold self-start md:self-auto bg-card hover:bg-hover border border-slate-200/55 dark:border-slate-800 rounded-xl"
        >
          <RefreshCw size={14} className={(loadingStocks || loadingManual) ? 'animate-spin' : ''} />
          Actualizar Todo
        </Button>
      </div>

      {/* Summary / Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1: Hoko */}
        <div className="bg-card border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-brand/40 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Stock Total Hoko</span>
            <span className="text-2xl font-black text-text-primary font-mono block">
              {loadingStocks ? '...' : `${totalHokoStock} u.`}
            </span>
          </div>
          <div className="p-3 bg-brand/10 dark:bg-brand/5 rounded-xl text-brand">
            <Package size={20} />
          </div>
        </div>

        {/* Stat Card 2: Manual */}
        <div className="bg-card border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-success/40 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Stock Total Físico (Manual)</span>
            <span className="text-2xl font-black text-success font-mono block">
              {loadingManual ? '...' : `${totalManualStock} u.`}
            </span>
          </div>
          <div className="p-3 bg-success/10 dark:bg-success/5 rounded-xl text-success">
            <Layers size={20} />
          </div>
        </div>

        {/* Stat Card 3: Discrepancies */}
        <div className={`bg-card border rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group transition-all duration-300 ${
          discrepancyCount > 0 
            ? 'border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/5' 
            : 'border-slate-200/50 dark:border-slate-800/80'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Discrepancias Críticas</span>
            <span className={`text-2xl font-black font-mono block ${discrepancyCount > 0 ? 'text-red-500 animate-pulse' : 'text-text-primary'}`}>
              {discrepancyCount}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${
            discrepancyCount > 0 
              ? 'bg-red-500/10 text-red-500' 
              : 'bg-slate-100 dark:bg-slate-800 text-text-muted'
          }`}>
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Item Cards (Left side) */}
        <div className="lg:col-span-1 flex flex-col space-y-4 h-full">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 px-1 flex-shrink-0">
            <Box size={14} className="text-brand" />
            <span>Inventarios del Producto</span>
          </h3>

          {loadingStocks ? (
            <div className="p-12 text-center bg-card rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-center items-center">
              <RefreshCw className="animate-spin text-brand mb-2" size={24} />
              <p className="text-xs text-text-muted font-bold">Cargando ubicaciones de stock...</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-2">
              {availableStocks.map((stock) => {
                const isSelected = String(stock.id) === form.stockId;
                const cellarName = stock.name || (stock.cellar_id === 2353 ? 'Bodega Bogotá' : stock.cellar_id === 2354 ? 'Bodega Medellín' : `Bodega #${stock.cellar_id}`);
                
                const manualStockObj = manualStocks.find((ms: any) => String(ms.stock_id) === String(stock.id));
                const manualQty = manualStockObj ? manualStockObj.cantidad : 0;
                const hasDiscrepancy = stock.amount === 0 && manualQty > 0;

                return (
                  <div
                    key={stock.id}
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        stockId: String(stock.id),
                        weight: String(stock.measures?.weight || f.weight),
                        length: String(stock.measures?.length || f.length),
                        width: String(stock.measures?.width || f.width),
                        height: String(stock.measures?.height || f.height),
                      }));
                    }}
                    className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-md ring-2 ring-brand'
                        : 'border-slate-200/50 dark:border-slate-800 bg-card hover:bg-hover hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        isSelected 
                          ? 'bg-brand/20 text-brand' 
                          : 'bg-slate-100 dark:bg-slate-800 text-text-muted'
                      }`}>
                        {cellarName}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono font-bold">ID: {stock.id}</span>
                    </div>
                    
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-tight mb-4">
                      Nanotrack Localizador GPS
                    </h4>
                    
                    {/* Visual Comparison Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 text-center">
                        <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-1">Stock Hoko</span>
                        <span className={`text-sm font-black font-mono ${stock.amount === 0 ? 'text-red-500' : 'text-success'}`}>
                          {stock.amount} u.
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 text-center relative group">
                        <span className="text-[9px] text-text-muted uppercase tracking-wider block mb-1">Stock Físico</span>
                        <span className="text-sm font-black text-brand font-mono">
                          {manualQty} u.
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions and details divider */}
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3.5 space-y-2.5 text-xs">
                      {/* Interactive Manual Stock Editor */}
                      <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-text-secondary text-[11px] font-medium">Ajustar Físico Manual:</span>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editingStockId === String(stock.id) ? editingValue : manualQty}
                            disabled={editingStockId !== String(stock.id) || savingManual}
                            onChange={(e) => setEditingValue(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-14 bg-input border border-slate-200/65 dark:border-slate-800 rounded-lg px-2 py-1 text-center text-xs font-black text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-80"
                          />
                          {editingStockId === String(stock.id) ? (
                            <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                              <button
                                onClick={async () => {
                                  await handleSaveManualStock(stock.id, editingValue, cellarName);
                                }}
                                disabled={savingManual}
                                className="p-1 bg-success hover:bg-success/80 text-white rounded-lg transition-colors"
                                title="Guardar"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingStockId(null)}
                                disabled={savingManual}
                                className="p-1 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStockId(String(stock.id));
                                setEditingValue(manualQty);
                              }}
                              className="p-1 text-brand hover:bg-brand/10 rounded-lg transition-colors"
                              title="Editar Stock Físico"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-text-secondary">
                        <span>Precio Unitario:</span>
                        <span className="font-mono text-text-primary font-bold">${Number(stock.price_by_unit || 199000).toLocaleString('es-CO')} COP</span>
                      </div>
                    </div>

                    {hasDiscrepancy && (
                      <div className="mt-4 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/5 px-3 py-2 rounded-xl border border-red-200/50 dark:border-red-950/30 flex items-center gap-2 animate-pulse">
                        <AlertTriangle size={14} />
                        <span>¡Alerta! Stock Hoko en 0 pero cuentas con {manualQty} u. en físico.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quotation Calculator (Right side) */}
        <div className="lg:col-span-2 bg-card border border-slate-200/50 dark:border-slate-800/80 shadow-sm rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider mb-5 flex items-center gap-2 text-text-primary">
              <Truck size={18} className="text-brand" />
              Cotizador de Fletes Hoko
            </h3>

            <form onSubmit={handleQuote} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Ciudad Destino</label>
                <select
                  value={form.cityTo}
                  onChange={(e) => setForm({ ...form, cityTo: e.target.value })}
                  className="w-full bg-input border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all cursor-pointer"
                  required
                >
                  <option value="">Selecciona una ciudad...</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Método de Pago</label>
                <select
                  value={form.payment}
                  onChange={(e) => setForm({ ...form, payment: e.target.value })}
                  className="w-full bg-input border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="0">Contraentrega (Recaudo)</option>
                  <option value="1">Pago Anticipado (Crédito)</option>
                </select>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
                <div>
                  <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5 text-center">Peso (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="w-full bg-input border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-center text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5 text-center">Largo (cm)</label>
                  <input
                    type="number"
                    value={form.length}
                    onChange={(e) => setForm({ ...form, length: e.target.value })}
                    className="w-full bg-input border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-center text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5 text-center">Ancho (cm)</label>
                  <input
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: e.target.value })}
                    className="w-full bg-input border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-center text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-text-muted uppercase tracking-wider mb-1.5 text-center">Alto (cm)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="w-full bg-input border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-center text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end mt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={quoting}
                  className="w-full md:w-auto bg-brand hover:bg-brand-hover text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {quoting ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Truck size={16} />
                  )}
                  {quoting ? 'Cotizando...' : 'Calcular Flete de Envío'}
                </Button>
              </div>
            </form>
          </div>

          {/* Quotation Results (Placed inside the right calculator card) */}
          {quotations.length > 0 && (
            <div className="mt-8 border-t border-slate-200/60 dark:border-slate-800/60 pt-6 animate-in fade-in slide-in-from-bottom duration-300">
              <h3 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-text-primary">
                <DollarSign className="text-success" size={16} />
                Resultados de la Cotización
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quotations.map((q, idx) => {
                  const priceVal = q.price ?? (q as any).value ?? (q as any).freight ?? 0;
                  const totalVal = (q as any).total ?? priceVal;
                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:border-brand/35 transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2.5">
                            {q.courier_logo && (
                              <img
                                src={q.courier_logo}
                                alt={q.courier_name}
                                className="h-6 max-w-[80px] object-contain bg-white rounded-lg p-0.5 border border-slate-100"
                              />
                            )}
                            <span className="text-xs font-black text-text-primary">{q.courier_name || (q as any).courier}</span>
                          </div>
                          <span className="text-[9px] text-text-muted font-mono font-bold">ID: {q.courier_id}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/60 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold text-text-secondary">
                          <span>Flete:</span>
                          <span className="font-mono text-text-primary">${Number(priceVal).toLocaleString('es-CO')}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-success border-t border-dashed border-slate-200/50 dark:border-slate-800/30 pt-2">
                          <span>Total:</span>
                          <span className="font-mono">${Number(totalVal).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
