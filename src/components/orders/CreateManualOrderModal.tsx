"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, MapPin, Package, Truck, DollarSign, RefreshCw, ShoppingCart, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../shared/Button';
import { HokoCity, HokoQuotation } from '../../types';
import Swal from 'sweetalert2';

const DEPARTMENTS: Record<number | string, string> = {
  5: 'Antioquia',
  8: 'Atlántico',
  11: 'Bogotá D.C.',
  13: 'Bolívar',
  15: 'Boyacá',
  17: 'Caldas',
  18: 'Caquetá',
  19: 'Cauca',
  20: 'Cesar',
  23: 'Córdoba',
  25: 'Cundinamarca',
  27: 'Chocó',
  41: 'Huila',
  44: 'La Guajira',
  47: 'Magdalena',
  50: 'Meta',
  52: 'Nariño',
  54: 'Norte de Santander',
  63: 'Quindío',
  66: 'Risaralda',
  68: 'Santander',
  70: 'Sucre',
  73: 'Tolima',
  76: 'Valle del Cauca',
  81: 'Arauca',
  85: 'Casanare',
  86: 'Putumayo',
  88: 'San Andrés y Providencia',
  91: 'Amazonas',
  94: 'Guainía',
  95: 'Guaviare',
  97: 'Vaupés',
  99: 'Vichada'
};

interface CreateManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type StepId = 'destinatario' | 'productos_envio';

export function CreateManualOrderModal({ isOpen, onClose, onSuccess }: CreateManualOrderModalProps) {
  const [activeStep, setActiveStep] = useState<StepId>('destinatario');
  const [cities, setCities] = useState<HokoCity[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<HokoQuotation[]>([]);
  
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    identification: '',
    address: '',
    city: '',
    city_id: ''
  });

  const [selectedStockId, setSelectedStockId] = useState('55134'); // GPS localizer default
  const [quantity, setQuantity] = useState(1);
  const [paymentType, setPaymentType] = useState('pago contra entrega'); // Hoko: 0 (Contraentrega) / 1 (Pago anticipado)
  const [selectedCourier, setSelectedCourier] = useState<HokoQuotation | null>(null);
  const [declaredValue, setDeclaredValue] = useState('100000');

  // Custom price input
  const [customPrice, setCustomPrice] = useState<string>('199000');

  // Helper for SweetAlert2 notifications
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

  // Searchable City states
  const [citySearchText, setCitySearchText] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  
  const cityContainerRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

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

  // Check and update dropdown display direction
  const updateDropdownDirection = () => {
    if (cityInputRef.current) {
      const rect = cityInputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownDirection(spaceBelow < 260 ? 'up' : 'down');
    }
  };

  // Close city suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityContainerRef.current && !cityContainerRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load cities on mount
  useEffect(() => {
    if (!isOpen) return;
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const data = await hokoFetch('https://v4.hoko.com.co/api/member/get-cities');
        const list = Array.isArray(data) ? data : (data.data || data.cities || []);
        setCities(list);
      } catch (e) {
        console.error('Error fetching cities:', e);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [isOpen]);

  // Load stocks on mount
  useEffect(() => {
    if (!isOpen) return;
    const fetchStocks = async () => {
      setLoadingStocks(true);
      try {
        const data = await hokoFetch('/member/stock/list', { method: 'POST' });
        const list = Array.isArray(data) ? data : (data.data || data.stocks || []);
        
        // Ensure default stock items exist for manual order
        const hasGPS = list.some((s: any) => String(s.id) === '55134');
        if (!hasGPS) {
          list.push({
            id: 55134,
            cellar_id: 2353,
            name: 'Bodega Bogotá',
            amount: 85,
            price_by_unit: 199000,
            measures: { height: 10, width: 10, length: 10, weight: 1 },
            cellar_name: 'FULFILLMENT BOGOTA Telocalizo'
          });
        }
        setStocks(list);
      } catch (e) {
        console.error('Error fetching stocks:', e);
        setStocks([
          { id: 55134, cellar_id: 2353, name: 'Bodega Bogotá', amount: 85, price_by_unit: 199000, measures: { height: 10, width: 10, length: 10, weight: 1 }, cellar_name: 'FULFILLMENT BOGOTA Telocalizo' }
        ]);
      } finally {
        setLoadingStocks(false);
      }
    };
    fetchStocks();
  }, [isOpen]);

  const selectedStockObj = stocks.find(s => String(s.id) === selectedStockId);

  // Price calculations based on quantity for GPS Tracker
  const getPricePerUnit = (qty: number) => {
    if (selectedStockId === '55134') {
      if (qty >= 3) return 139300;
      if (qty === 2) return 159200;
      return 199000;
    }
    return selectedStockObj?.price_by_unit || 199000;
  };

  // Set default suggested price when quantity or stock changes
  useEffect(() => {
    const sug = getPricePerUnit(quantity);
    setCustomPrice(String(sug));
  }, [selectedStockId, quantity, stocks]);

  const pricePerUnit = Number(String(customPrice || '0').replace(/[.,\s]/g, '')) || 0;
  const totalItemsPrice = pricePerUnit * quantity;

  const getCityDept = (c: any) => {
    return DEPARTMENTS[c.department_id] || c.department || '';
  };

  // Filter cities for search
  const filteredCities = citySearchText.trim() === ''
    ? cities.slice(0, 30) // limit to first 30 by default when empty
    : cities.filter(c => {
        const dept = getCityDept(c);
        return c.name.toLowerCase().includes(citySearchText.toLowerCase()) || 
               dept.toLowerCase().includes(citySearchText.toLowerCase());
      }).slice(0, 50);

  // Calculate shipment quotation
  const handleQuote = async () => {
    if (!customer.city_id) {
      showNotification('Información Faltante', 'Por favor selecciona la ciudad de destino primero.', 'warning');
      return;
    }
    setQuoting(true);
    setQuotations([]);
    setSelectedCourier(null);
    try {
      const stockMeasures = selectedStockObj?.measures || { height: 10, width: 10, length: 10, weight: 1 };
      const data = await hokoFetch('/member/stock/quotation', {
        method: 'POST',
        body: {
          stock_ids: selectedStockId,
          city_to: customer.city_id,
          payment: paymentType === 'pago contra entrega' ? 0 : 1,
          declared_value: declaredValue,
          width: String(stockMeasures.width || 10),
          height: String(stockMeasures.height || 10),
          length: String(stockMeasures.length || 10),
          weight: String(stockMeasures.weight || 1),
        },
      });
      const list = data.data || data.quotations || [];
      setQuotations(list);
      if (list.length > 0) {
        // Auto select first courier
        setSelectedCourier(list[0]);
      }
    } catch (e) {
      console.error('Error fetching quotation:', e);
      showNotification('Error de Cotización', 'Error al realizar la cotización de envío.', 'error');
    } finally {
      setQuoting(false);
    }
  };

  // Trigger quotation automatically when required fields change
  useEffect(() => {
    if (!customer.city_id || !selectedStockId || !paymentType || !declaredValue) return;

    const delayDebounce = setTimeout(() => {
      const fetchQuotationAuto = async () => {
        setQuoting(true);
        setQuotations([]);
        setSelectedCourier(null);
        try {
          const stockMeasures = selectedStockObj?.measures || { height: 10, width: 10, length: 10, weight: 1 };
          const data = await hokoFetch('/member/stock/quotation', {
            method: 'POST',
            body: {
              stock_ids: selectedStockId,
              city_to: customer.city_id,
              payment: paymentType === 'pago contra entrega' ? 0 : 1,
              declared_value: declaredValue,
              width: String(stockMeasures.width || 10),
              height: String(stockMeasures.height || 10),
              length: String(stockMeasures.length || 10),
              weight: String(stockMeasures.weight || 1),
            },
          });
          const list = data.data || data.quotations || [];
          setQuotations(list);
          if (list.length > 0) {
            setSelectedCourier(list[0]);
          }
        } catch (e) {
          console.error('Error fetching quotation automatically:', e);
        } finally {
          setQuoting(false);
        }
      };
      fetchQuotationAuto();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [customer.city_id, selectedStockId, paymentType, declaredValue, stocks]);

  // Submit order to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourier) {
      showNotification('Transportadora Requerida', 'Por favor cotiza el envío y selecciona una transportadora en la Fase 2.', 'warning');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedCityObj = cities.find(c => String(c.id) === customer.city_id);
      const payload = {
        customer: {
          ...customer,
          city: selectedCityObj ? `${selectedCityObj.name}, ${getCityDept(selectedCityObj)}` : ''
        },
        stock_id: Number(selectedStockId),
        quantity,
        price_by_unit: pricePerUnit,
        courier_id: selectedCourier.courier_id,
        courier_name: selectedCourier.courier_name,
        payment_type: paymentType,
        total_paid: totalItemsPrice,
        declared_value: declaredValue
      };

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al guardar la orden.');
      }

      showNotification('¡Venta Registrada!', 'Venta registrada con éxito en el CRM y Hoko.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error inesperado al crear el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Validation checks for next step helper
  const canGoNext = () => {
    if (activeStep === 'destinatario') {
      return customer.name.trim() !== '' && customer.phone.trim() !== '' && customer.address.trim() !== '' && customer.city_id !== '';
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[3px] animate-in fade-in duration-200">
      <div className="bg-card rounded-[28px] border border-slate-200/50 dark:border-slate-800 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[85vh] lg:h-[80vh] animate-in zoom-in-95 duration-200">
        
        {/* LEFT SIDEBAR PANEL (fases) */}
        <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-200/60 dark:border-slate-800/80 p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand/10 text-brand rounded-xl">
                <ShoppingCart size={18} />
              </div>
              <div>
                <span className="text-[10px] text-brand font-black uppercase tracking-wider block">Winners Hub</span>
                <span className="text-xs font-black text-text-primary uppercase tracking-tight">Venta</span>
              </div>
            </div>

            {/* Steps list (Reduced to 2 Phases) */}
            <nav className="space-y-2.5 pt-4">
              
              <button
                type="button"
                onClick={() => setActiveStep('destinatario')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                  activeStep === 'destinatario'
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-brand ring-1 ring-slate-100 dark:ring-slate-700'
                    : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    activeStep === 'destinatario' ? 'bg-brand/10 text-brand' : 'bg-card text-text-muted group-hover:text-text-primary'
                  }`}>
                    <User size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-text-muted font-bold">Fase 1</span>
                    <span className="text-xs font-black">Destinatario</span>
                  </div>
                </div>
                <ChevronRight size={14} className={`opacity-0 transition-opacity ${activeStep === 'destinatario' ? 'opacity-100' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (customer.name.trim() !== '' && customer.phone.trim() !== '' && customer.city_id !== '') {
                    setActiveStep('productos_envio');
                  } else {
                    alert('Por favor completa los datos del destinatario primero.');
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                  activeStep === 'productos_envio'
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-brand ring-1 ring-slate-100 dark:ring-slate-700'
                    : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    activeStep === 'productos_envio' ? 'bg-brand/10 text-brand' : 'bg-card text-text-muted group-hover:text-text-primary'
                  }`}>
                    <Package size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-text-muted font-bold">Fase 2</span>
                    <span className="text-xs font-black">Productos y Envío</span>
                  </div>
                </div>
                <ChevronRight size={14} className={`opacity-0 transition-opacity ${activeStep === 'productos_envio' ? 'opacity-100' : ''}`} />
              </button>

            </nav>
          </div>

          {/* Quick Resumen Panel */}
          <div className="mt-6 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2 font-semibold">
            <span className="text-[9px] text-text-muted uppercase tracking-wider block">Resumen de Venta</span>
            <div className="flex justify-between text-[11px] text-text-secondary">
              <span>Cant:</span>
              <span className="text-text-primary font-bold">{quantity} u.</span>
            </div>
            <div className="flex justify-between text-[11px] text-text-secondary">
              <span>Unitario:</span>
              <span className="font-mono text-text-primary">${pricePerUnit.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-xs font-black text-brand pt-2 border-t border-slate-200/50 dark:border-slate-700">
              <span>Total Venta:</span>
              <span className="font-mono text-base">${totalItemsPrice.toLocaleString('es-CO')}</span>
            </div>
          </div>

        </div>

        {/* RIGHT CONTENT PANEL (active stage details) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-card">
          
          {/* Header Area */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-tight font-bold">
                {activeStep === 'destinatario' && "Fase 1: Información del Destinatario"}
                {activeStep === 'productos_envio' && "Fase 2: Productos, Precios y Envío"}
              </h2>
              <p className="text-[10px] text-text-muted font-medium mt-0.5">
                {activeStep === 'destinatario' && "Completa el nombre, celular, cédula, dirección y ciudad de destino."}
                {activeStep === 'productos_envio' && "Selecciona el producto/bodega, edita el precio unitario y cotiza con Hoko."}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-hover rounded-xl text-text-muted transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* FASE 1: Destinatario */}
            {activeStep === 'destinatario' && (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={customer.name}
                      onChange={e => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 placeholder:text-text-placeholder/60"
                      placeholder="Ej. Dallas Agresort valiente"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Teléfono Celular *</label>
                    <input
                      type="tel"
                      required
                      value={customer.phone}
                      onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 placeholder:text-text-placeholder/60"
                      placeholder="Ej. 3228118835"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Cédula / NIT</label>
                    <input
                      type="text"
                      value={customer.identification}
                      onChange={e => setCustomer({ ...customer, identification: e.target.value })}
                      className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 placeholder:text-text-placeholder/60"
                      placeholder="Ej. 1143334247"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Email (Opcional)</label>
                    <input
                      type="email"
                      value={customer.email}
                      onChange={e => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 placeholder:text-text-placeholder/60"
                      placeholder="Ej. cliente@correo.com"
                    />
                  </div>

                  {/* Searchable City */}
                  <div className="col-span-2 relative" ref={cityContainerRef}>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Ciudad de Destino *</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        ref={cityInputRef}
                        required
                        value={citySearchText}
                        onFocus={() => {
                          setShowCitySuggestions(true);
                          updateDropdownDirection();
                        }}
                        onChange={e => {
                          setCitySearchText(e.target.value);
                          setShowCitySuggestions(true);
                          updateDropdownDirection();
                        }}
                        className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand"
                        placeholder="Buscar ciudad (Ej: Bogotá, Cali, Humadea...)"
                      />
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    </div>
                    
                    {showCitySuggestions && (
                      <div className={`absolute z-50 left-0 right-0 max-h-60 overflow-y-auto bg-card border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-xl ${
                        dropdownDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                      }`}>
                        {loadingCities ? (
                          <div className="p-4 text-center text-xs text-text-muted">Cargando lista de ciudades...</div>
                        ) : filteredCities.length === 0 ? (
                          <div className="p-4 text-center text-xs text-text-muted">No se encontraron ciudades.</div>
                        ) : (
                          filteredCities.map(c => {
                            const dept = getCityDept(c);
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setCustomer({
                                    ...customer,
                                    city: `${c.name} (${dept})`,
                                    city_id: String(c.id)
                                  });
                                  setCitySearchText(`${c.name} (${dept})`);
                                  setShowCitySuggestions(false);
                                }}
                                className="px-4 py-2.5 hover:bg-hover text-xs font-semibold text-text-primary cursor-pointer border-b border-slate-100 dark:border-slate-800/40 last:border-0"
                              >
                                {c.name} <span className="text-text-muted font-normal text-[10px]">({dept})</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Dirección de Entrega *</label>
                    <input
                      type="text"
                      required
                      value={customer.address}
                      onChange={e => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 placeholder:text-text-placeholder/60"
                      placeholder="Calle, Carrera, Barrio, Apto..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FASE 2: Productos, Precios y Envío */}
            {activeStep === 'productos_envio' && (
              <div className="space-y-5 max-w-2xl">
                
                {/* Bodega / Stock de Producto */}
                <div>
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Bodega / Stock de Producto *</label>
                  <select
                    value={selectedStockId}
                    onChange={e => setSelectedStockId(e.target.value)}
                    className="w-full text-xs font-bold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 appearance-none cursor-pointer"
                  >
                    {stocks.map(s => {
                      const cellar = s.cellar_name || (s.cellar_id === 2353 ? 'FULFILLMENT BOGOTA Telocalizo' : s.cellar_id === 3391 ? 'FULFILLMENT MEDELLIN TELOCALIZO' : `Bodega #${s.cellar_id}`);
                      return (
                        <option key={s.id} value={s.id}>
                          [{cellar}] {s.name} (Disp: {s.amount} u. - Sug: ${Number(s.price_by_unit || 199000).toLocaleString('es-CO')})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Qty & Custom Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Cantidad *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-xs font-bold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Precio Unitario Personalizado ($) *</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        required
                        value={customPrice}
                        onChange={e => setCustomPrice(e.target.value)}
                        className="w-full text-xs font-black text-brand pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl focus:outline-none focus:border-brand"
                        placeholder="Ej. 159.200"
                      />
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
                    </div>
                  </div>
                </div>

                {/* Method Payment & Declared Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Método de Pago *</label>
                    <select
                      value={paymentType}
                      onChange={e => setPaymentType(e.target.value)}
                      className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1 appearance-none cursor-pointer"
                    >
                      <option value="pago contra entrega">Contra entrega</option>
                      <option value="pagado en la tienda">Pago Anticipado / Tienda</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Valor Declarado *</label>
                    <input
                      type="number"
                      required
                      value={declaredValue}
                      onChange={e => setDeclaredValue(e.target.value)}
                      className="w-full text-xs font-semibold text-text-primary bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand mt-1"
                    />
                  </div>
                </div>

                {/* Hoko Freight Quotation */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Transportadoras Hoko</span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={quoting || !customer.city_id}
                      onClick={handleQuote}
                      className="h-7 px-3 text-[10px] uppercase font-bold"
                    >
                      {quoting ? 'Cotizando...' : 'Cotizar Envío'}
                    </Button>
                  </div>

                  {quotations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
                      {quotations.map((q, idx) => {
                        const isSelected = selectedCourier?.courier_id === q.courier_id;
                        const freightCost = q.price ?? (q as any).value ?? (q as any).freight ?? 0;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedCourier(q)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                              isSelected
                                ? 'border-brand bg-brand/5 dark:bg-brand/10 ring-1 ring-brand'
                                : 'border-slate-200/50 dark:border-slate-800 bg-card hover:bg-hover'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-black text-text-primary block">{q.courier_name}</span>
                              <span className="text-[10px] text-text-muted font-medium mt-0.5">Flete y despacho</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-success">${Number(freightCost).toLocaleString('es-CO')} COP</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200/60 dark:border-slate-800 rounded-2xl text-[11px] text-text-muted italic">
                      Presiona \"Cotizar Envío\" para elegir la transportadora.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

          </div>

          {/* Footer Area */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-card flex items-center justify-between shrink-0">
            <div>
              {activeStep === 'destinatario' && (
                <Button type="button" variant="ghost" onClick={onClose} className="h-10 px-5 text-xs font-bold">Cancelar</Button>
              )}
              {activeStep !== 'destinatario' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep('destinatario')}
                  className="h-10 px-5 text-xs font-bold flex items-center gap-1.5"
                >
                  <ChevronLeft size={14} />
                  <span>Atrás</span>
                </Button>
              )}
            </div>
            
            <div>
              {activeStep === 'destinatario' ? (
                <Button
                  type="button"
                  variant="primary"
                  disabled={!canGoNext()}
                  onClick={() => setActiveStep('productos_envio')}
                  className="h-10 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={14} />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  disabled={submitting || !selectedCourier}
                  onClick={handleSubmit}
                  className="h-10 px-7 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={14} />
                      <span>Registrar Venta</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
