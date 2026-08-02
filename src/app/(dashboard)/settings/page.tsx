"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../../../components/shared/Avatar';
import { Button } from '../../../components/shared/Button';
import { User as UserIcon, Radio, Settings as SettingsIcon, Box, Truck, Percent, DollarSign, Activity } from 'lucide-react';
import Swal from 'sweetalert2';

const ChannelsTab = dynamic(() => import('../../../components/settings/ChannelsTab').then(m => m.ChannelsTab), { ssr: false });

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const [subTab, setSubTab] = useState<'profile' | 'channels' | 'financial'>('profile');

  // Financial configuration form states
  const [cogsVal, setCogsVal] = useState('30000');
  const [shippingRecaudo, setShippingRecaudo] = useState('15000');
  const [shippingCredito, setShippingCredito] = useState('10500');
  const [boldCommission, setBoldCommission] = useState('3.67');

  // Load custom values on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCogs = localStorage.getItem('financial_cogs');
      const savedRecaudo = localStorage.getItem('financial_shipping_recaudo');
      const savedCredito = localStorage.getItem('financial_shipping_credito');
      const savedBold = localStorage.getItem('financial_bold_commission');

      if (savedCogs) setCogsVal(savedCogs);
      if (savedRecaudo) setShippingRecaudo(savedRecaudo);
      if (savedCredito) setShippingCredito(savedCredito);
      if (savedBold) setBoldCommission(savedBold);
    }
  }, []);

  const handleSaveFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('financial_cogs', cogsVal);
      localStorage.setItem('financial_shipping_recaudo', shippingRecaudo);
      localStorage.setItem('financial_shipping_credito', shippingCredito);
      localStorage.setItem('financial_bold_commission', boldCommission);

      const isDark = document.documentElement.classList.contains('dark');
      Swal.fire({
        title: '¡Valores Actualizados!',
        text: 'Los costos y comisiones operativas se guardaron correctamente. Las utilidades del Dashboard se actualizaron en tiempo real.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#10b981',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        customClass: {
          popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
        }
      });
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase underline decoration-blue-600 decoration-4 underline-offset-8">Ajustes Generales</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Gestiona tu perfil de usuario, preferencias y canales de comunicación del CRM.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-25 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setSubTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'profile'
                ? 'bg-white dark:bg-slate-805 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <UserIcon size={12} />
            <span>Mi Perfil</span>
          </button>
          
          <button
            onClick={() => setSubTab('financial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'financial'
                ? 'bg-white dark:bg-slate-805 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <SettingsIcon size={12} />
            <span>Costos y Utilidades</span>
          </button>

          <button
            onClick={() => setSubTab('channels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              subTab === 'channels'
                ? 'bg-white dark:bg-slate-805 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Radio size={12} className={subTab === 'channels' ? 'text-emerald-500 animate-pulse' : ''} />
            <span>Canales</span>
          </button>
        </div>
      </div>

      {/* RENDER PROFILE SUBTAB */}
      {subTab === 'profile' && (
        <div className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800/60">
            <Avatar name={state.currentUser?.name || ''} size="xl" className="shadow-2xl ring-4 ring-blue-500/10" />
            <div className="text-center md:text-left flex-1">
               <h2 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{state.currentUser?.name}</h2>
               <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase">{state.currentUser?.role}</p>
               <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                     <p className="text-sm font-bold text-slate-700 dark:text-white">{state.currentUser?.email}</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                       <p className="text-sm font-bold text-slate-700 dark:text-white">{state.currentUser?.status}</p>
                     </div>
                  </div>
               </div>
            </div>
            <Button variant="primary" className="h-12 px-8 font-black uppercase text-xs tracking-widest">Editar Perfil</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-2 border-blue-600 pl-3">Preferencias de Sistema</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                      <div>
                         <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight italic uppercase">Modo Oscuro</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Activa la interfaz de alto contraste</p>
                      </div>
                      <button 
                        onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                        className={`w-12 h-6 rounded-full transition-all relative ${state.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.darkMode ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800 opacity-50">
                      <div>
                         <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight italic uppercase">Notificaciones Push</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Recibe alertas en tiempo real</p>
                      </div>
                      <button className="w-12 h-6 rounded-full bg-slate-300 relative">
                         <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"></div>
                      </button>
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-2 border-blue-600 pl-3">Seguridad</h3>
                <div className="space-y-4">
                   <Button variant="outline" className="w-full justify-start h-14 px-5 rounded-2xl border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-300">
                      Cambiar Contraseña
                   </Button>
                   <Button variant="danger" className="w-full justify-start h-14 px-5 rounded-2xl border-transparent bg-red-50 dark:bg-rose-955 text-red-650 hover:bg-red-100 font-bold uppercase text-[10px] tracking-widest">
                      Cerrar todas las sesiones
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* RENDER FINANCIAL SUBTAB */}
      {subTab === 'financial' && (
        <form onSubmit={handleSaveFinancials} className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Activity size={18} className="text-brand" />
              <span>Configuración Operativa de Costos y Utilidad</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configura los valores de adquisición y transporte. Estos parámetros modifican el cálculo dinámico de utilidades en el Dashboard en tiempo real.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Equipment cost COGS */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Costo del Producto / Equipos (COGS) ($ COP)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={cogsVal}
                  onChange={e => setCogsVal(e.target.value)}
                  className="w-full text-xs font-bold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-brand"
                />
                <Box size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="text-[9px] text-text-muted block">Costo unitario del localizador (default: $30.000 COP)</span>
            </div>

            {/* Bold Commission */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Comisión Pasarela Bold (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={boldCommission}
                  onChange={e => setBoldCommission(e.target.value)}
                  className="w-full text-xs font-bold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-brand"
                />
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="text-[9px] text-text-muted block">Porcentaje cobrado en pasarelas/crédito (default: 3.67%)</span>
            </div>

            {/* Average Recaudo Shipping */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Flete Promedio Recaudo / COD ($ COP)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={shippingRecaudo}
                  onChange={e => setShippingRecaudo(e.target.value)}
                  className="w-full text-xs font-bold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-brand"
                />
                <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="text-[9px] text-text-muted block">Flete de envío para Pago Contra Entrega (default: $15.000 COP)</span>
            </div>

            {/* Average Credit Shipping */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Flete Promedio Pago Anticipado / Crédito ($ COP)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={shippingCredito}
                  onChange={e => setShippingCredito(e.target.value)}
                  className="w-full text-xs font-bold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-brand"
                />
                <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <span className="text-[9px] text-text-muted block">Flete de envío para Pago Anticipado/Tienda (default: $10.500 COP)</span>
            </div>

          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" className="h-11 px-8 font-black uppercase text-xs tracking-wider">
              Guardar Cambios
            </Button>
          </div>
        </form>
      )}

      {/* RENDER CHANNELS SUBTAB */}
      {subTab === 'channels' && (
        <ChannelsTab />
      )}
    </div>
  );
}
