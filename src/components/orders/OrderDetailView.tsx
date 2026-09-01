"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RefreshCw, ShoppingBag, MapPin, User, Mail, Phone, Calendar, 
  Clipboard, CreditCard, Box, Tag, Clock, RotateCcw, Receipt, Globe, Hash, 
  Truck, FileText, ExternalLink, Copy, Check, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { Button } from '../shared/Button';
import Swal from 'sweetalert2';
import { CreateManualOrderModal } from './CreateManualOrderModal';
import { ArchiveOrderModal } from './ArchiveOrderModal';
import { HOKO_ORDER_STATES, HOKO_GUIDE_STATES_CO } from '../../types';
import { useRouter } from 'next/navigation';

interface OrderDetailViewProps {
  orderId: string | null;
  onBack: () => void;
}

export function OrderDetailView({ orderId, onBack }: OrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [hokoOrder, setHokoOrder] = useState<any | null>(null);
  const [loadingHoko, setLoadingHoko] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [updatingAppStatus, setUpdatingAppStatus] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [activeSection, setActiveSection] = useState<'items' | 'customer' | 'payment' | 'notes'>('items');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  
  // Note states (Shopify only)
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Customer states (Shopify only)
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Tags states (Shopify only)
  const [editingTags, setEditingTags] = useState(false);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);

  // Address states (Shopify only)
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ firstName: '', lastName: '', company: '', address1: '', address2: '', city: '', province: '', zip: '', country: '', phone: '' });
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchHokoDetails = async (hokoId: string | number) => {
    if (!hokoId) return;
    setLoadingHoko(true);
    try {
      const res = await fetch('/api/hoko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: `/member/order/${hokoId}`,
          method: 'GET'
        })
      });
      const data = await res.json();
      const hokoData = data.data || data;
      if (hokoData && !hokoData.error) {
        setHokoOrder(hokoData);
      }
    } catch (err) {
      console.error("Error fetching live Hoko order details:", err);
    } finally {
      setLoadingHoko(false);
    }
  };

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const decodedId = decodeURIComponent(orderId);
      let localOrder = null;
      let isShopifyDirect = false;
      let shopifyGID = '';

      if (decodedId.startsWith('gid://shopify/Order/') || (String(decodedId).length > 8 && /^\d+$/.test(decodedId))) {
        isShopifyDirect = true;
        shopifyGID = decodedId.startsWith('gid://') ? decodedId : `gid://shopify/Order/${decodedId}`;
        
        // Try fetching locally first to get Hoko database id if possible
        try {
          const localRes = await fetch(`/api/pedidos?id=${encodeURIComponent(decodedId)}`, { cache: 'no-store' });
          if (localRes.ok) {
            localOrder = await localRes.json();
          }
        } catch (e) {
          // ignore
        }

        if (!localOrder) {
          localOrder = {
            canal: 'pagina_web',
            shopify_order_id: shopifyGID,
            db_id: decodedId.split('/').pop() || '0',
            cliente_id: shopifyGID,
          };
        }
      } else {
        // 1. Fetch from our local pedidos API
        const localRes = await fetch(`/api/pedidos?id=${encodeURIComponent(decodedId)}`, { cache: 'no-store' });
        if (localRes.ok) {
          localOrder = await localRes.json();
        }
      }
      
      if (!localOrder) {
        setErrorMessage(`No se pudo encontrar el pedido con ID "${orderId}" en la base de datos.`);
        setLoading(false);
        return;
      }
      
      const isShopify = localOrder.canal === 'pagina_web' || !!localOrder.shopify_order_id;
      
      if (isShopify && localOrder.shopify_order_id) {
        // Fetch additional details from Shopify API
        try {
          const response = await fetch('/api/shopify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query getOrderDetails($id: ID!) {
                  order(id: $id) {
                    id
                    name
                    createdAt
                    cancelledAt
                    displayFinancialStatus
                    displayFulfillmentStatus
                    tags
                    note
                    totalPriceSet {
                      presentmentMoney { amount currencyCode }
                    }
                    subtotalPriceSet {
                      presentmentMoney { amount currencyCode }
                    }
                    totalShippingPriceSet {
                      presentmentMoney { amount currencyCode }
                    }
                    totalTaxSet {
                      presentmentMoney { amount currencyCode }
                    }
                    customer {
                      id firstName lastName email phone numberOfOrders
                    }
                    shippingAddress {
                      firstName lastName company address1 address2 city province zip country phone
                    }
                    lineItems(first: 50) {
                      edges {
                        node {
                          id title quantity sku
                          originalUnitPriceSet { presentmentMoney { amount currencyCode } }
                          image { url }
                        }
                      }
                    }
                    fulfillmentOrders(first: 5) {
                      edges { node { id status } }
                    }
                    paymentGatewayNames
                    discountCodes
                    billingAddressMatchesShippingAddress
                    billingAddress { firstName lastName address1 address2 city province zip country phone }
                    fullyPaid
                    cancelReason
                    confirmationNumber
                    sourceName
                    email
                    phone
                    poNumber
                    clientIp
                    shippingLine { title }
                  }
                }
              `,
              variables: { id: localOrder.shopify_order_id }
            })
          });
          const shopifyRes = await response.json();
          if (shopifyRes?.data?.order) {
            // Merge Shopify details with Hoko details
            const merged = {
              ...shopifyRes.data.order,
              ...localOrder,
              id: shopifyRes.data.order.id, // keep GID for shopify actions
              shopify_order_id: localOrder.shopify_order_id,
              db_id: localOrder.db_id,
              cliente_id: localOrder.cliente_id,
              canal: localOrder.canal,
              notas: localOrder.notas || '',
            };
            setOrder(merged);
            if (localOrder.hoko_order_id) {
              fetchHokoDetails(localOrder.hoko_order_id);
            }
            setLoading(false);
            return;
          } else {
            console.warn("Shopify API returned null order for GID:", localOrder.shopify_order_id);
          }
        } catch (shopifyError) {
          console.error("Error fetching from Shopify, falling back to local data:", shopifyError);
        }
      }
      
      // Fallback or Chat order (no Shopify)
      // Construct a compatible order object from db/Hoko data
      const mockLineItems = {
        edges: [
          {
            node: {
              id: 'mock-item-1',
              title: localOrder.contain || 'Producto de Chat',
              quantity: localOrder.quantity || 1,
              sku: 'STOCK-' + (localOrder.stock_id || ''),
              originalUnitPriceSet: {
                presentmentMoney: {
                  amount: String((localOrder.total_paid || 199000) / (localOrder.quantity || 1)),
                  currencyCode: 'COP',
                }
              },
              image: { 
                url: (localOrder.stock_id === 55134 || localOrder.stock_id === 55973 || String(localOrder.stock_id) === '55134' || String(localOrder.stock_id) === '55973') 
                  ? '/nanotrack.png' 
                  : null 
              }
            }
          }
        ]
      };
      
      const compatibleOrder: any = {
        id: localOrder.id || `db-${localOrder.db_id}`,
        db_id: localOrder.db_id,
        cliente_id: localOrder.cliente_id,
        canal: localOrder.canal,
        name: localOrder.shopify_order_name || `Pedido #${localOrder.db_id}`,
        createdAt: localOrder.created_at,
        displayFinancialStatus: localOrder.displayFinancialStatus || (String(localOrder.payment_type || '').toLowerCase().includes('pagado') ? 'PAID' : 'PENDING'),
        displayFulfillmentStatus: localOrder.displayFulfillmentStatus || (localOrder.delivery_state === '4' ? 'FULFILLED' : (localOrder.delivery_state === '2' || localOrder.delivery_state === '3' ? 'PARTIALLY_FULFILLED' : 'UNFULFILLED')),
        tags: localOrder.tags || [],
        note: localOrder.note || 'Pedido de Chat',
        status: localOrder.status,
        notas: localOrder.notas || '',
        hoko_order_id: localOrder.hoko_order_id,
        delivery_state: localOrder.delivery_state,
        guide: localOrder.guide,
        courier_name: localOrder.courier_name,
        stock_id: localOrder.stock_id,
        totalPriceSet: {
          presentmentMoney: {
            amount: String(localOrder.total_paid || 0),
            currencyCode: 'COP'
          }
        },
        subtotalPriceSet: {
          presentmentMoney: {
            amount: String(localOrder.total_paid || 0),
            currencyCode: 'COP'
          }
        },
        totalShippingPriceSet: {
          presentmentMoney: {
            amount: '0',
            currencyCode: 'COP'
          }
        },
        customer: {
          id: localOrder.customer?.phone || 'chat-client',
          firstName: localOrder.customer?.name || 'Cliente de Chat',
          lastName: '',
          email: localOrder.customer?.email || '',
          phone: localOrder.customer?.phone || '',
          numberOfOrders: 1
        },
        shippingAddress: {
          firstName: localOrder.customer?.name || 'Cliente',
          lastName: '',
          company: '',
          address1: localOrder.customer?.address || '',
          address2: '',
          city: localOrder.customer?.city || '',
          province: '',
          zip: '',
          country: 'Colombia',
          phone: localOrder.customer?.phone || ''
        },
        lineItems: mockLineItems,
        fulfillmentOrders: {
          edges: localOrder.hoko_order_id ? [{ node: { id: String(localOrder.hoko_order_id), status: 'OPEN' } }] : []
        },
        paymentGatewayNames: [localOrder.payment_type || 'Manual'],
        fullyPaid: String(localOrder.payment_type || '').toLowerCase().includes('pagado'),
        sourceName: localOrder.canal || 'whatsApp'
      };
      
      setOrder(compatibleOrder);
      if (localOrder.hoko_order_id) {
        fetchHokoDetails(localOrder.hoko_order_id);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGuide = async (hokoId: string | number) => {
    setActionLoading('guide');
    try {
      const res = await fetch('/api/hoko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: `/member/order/generate-guide/${hokoId}`,
          method: 'POST'
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      Swal.fire({
        title: 'Guía Generada',
        text: data.message || 'La solicitud para generar la guía fue enviada con éxito.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#10b981',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        customClass: {
          popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
        }
      });
      fetchHokoDetails(hokoId);
      fetchOrderDetails();
    } catch (err: any) {
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudo generar la guía.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAppStatus = async () => {
    if (!order || !order.db_id) return;
    const currentStatus = order.acceso_app || 'PENDIENTE APP';
    const nextStatus = currentStatus === 'OK APP' ? 'PENDIENTE APP' : 'OK APP';
    setUpdatingAppStatus(true);
    try {
      const res = await fetch('/api/pedidos/update-app-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.db_id, status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al actualizar acceso.');
      }
      setOrder((prev: any) => prev ? { ...prev, acceso_app: nextStatus } : null);
      
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      Swal.fire({
        title: 'Acceso Actualizado',
        text: `El estado del acceso cambió a ${nextStatus}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        customClass: {
          popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
        }
      });
    } catch (err: any) {
      console.error(err);
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudo actualizar el acceso.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a'
      });
    } finally {
      setUpdatingAppStatus(false);
    }
  };

  const stateColor = (state: string | number) => {
    const s = String(state);
    switch (s) {
      case '4': return 'bg-emerald-600/80 text-white border-emerald-500/30 border'; // Finalizada
      case '5': return 'bg-rose-600/80 text-white border-rose-500/30 border'; // Cancelada
      case '6': return 'bg-amber-600/80 text-white border-amber-500/30 border'; // En Novedad
      case '2': // En proceso
      case '3': // Despachada
        return 'bg-blue-600/80 text-white border-blue-500/30 border';
      default:
        return 'bg-brand/20 text-brand border border-brand/30';
    }
  };

  const guideStateColor = (state: string | number) => {
    const s = String(state);
    switch (s) {
      case '3': // Entregada
      case '17': // Pagado
      case '19': // Pagado a Tienda
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case '0': // Cancelada
      case '4': // Anulada
      case '11': // Devolución
      case '20': // Devolución Cobrado
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case '6': // En Novedad
      case '18': // Error por Saldo
      case '21': // Error por API
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case '2': // Despachada
      case '7': // En Reparto
      case '9': // Reexpedición
      case '13': // Recibido del Cliente
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      default:
        return 'bg-brand/10 text-brand border border-brand/20';
    }
  };

  const handleArchiveOrder = async (id: number | string, currentNote = '') => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const { value: formValues, isConfirmed } = await Swal.fire({
      title: 'Archivar Pedido',
      html: `
        <div class="text-left space-y-3 font-sans">
          <p class="text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}">
            Ingresa o selecciona el motivo por el cual el cliente no está interesado o se cancela el pedido:
          </p>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}">Motivo rápido:</label>
            <select id="archive-reason-select" class="w-full text-xs p-2.5 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'} focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Seleccionar motivo común --</option>
              <option value="Cliente no interesado / Canceló pedido">Cliente no interesado / Canceló pedido</option>
              <option value="No contesta llamadas ni WhatsApp">No contesta llamadas ni WhatsApp</option>
              <option value="Precio o costo de flete elevado">Precio o costo de flete elevado</option>
              <option value="Compró en otra tienda / competidor">Compró en otra tienda / competidor</option>
              <option value="Datos de entrega / teléfono erróneos">Datos de entrega / teléfono erróneos</option>
              <option value="Pedido duplicado o de prueba">Pedido duplicado o de prueba</option>
            </select>
          </div>

          <div class="space-y-1.5 pt-1">
            <label class="text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}">Nota explicativa / Observaciones:</label>
            <textarea id="archive-note-textarea" rows="3" placeholder="Escribe los detalles o comentarios sobre este pedido..." class="w-full text-xs p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'} focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none">${currentNote || ''}</textarea>
          </div>
        </div>
      `,
      didOpen: () => {
        const select = document.getElementById('archive-reason-select') as HTMLSelectElement;
        const textarea = document.getElementById('archive-note-textarea') as HTMLTextAreaElement;
        if (select && textarea) {
          select.addEventListener('change', () => {
            if (select.value) {
              textarea.value = select.value;
            }
          });
        }
      },
      preConfirm: () => {
        const textarea = document.getElementById('archive-note-textarea') as HTMLTextAreaElement;
        return {
          note: textarea ? textarea.value.trim() : ''
        };
      },
      showCancelButton: true,
      confirmButtonText: 'Archivar Pedido',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      customClass: {
        popup: 'rounded-[28px] border border-slate-200 dark:border-slate-800 p-6'
      }
    });

    if (!isConfirmed) return;

    const note = formValues?.note || 'Cliente no interesado';

    try {
      const res = await fetch('/api/pedidos/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'ARCHIVADO', notas: note })
      });
      
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al archivar el pedido.');
      }
      
      Swal.fire({
        title: 'Pedido Archivado',
        text: 'El pedido ha sido archivado con su nota explicativa.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        customClass: {
          popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
        }
      });

      fetchOrderDetails();
    } catch (e: any) {
      Swal.fire({
        title: 'Error',
        text: e.message || 'Error al archivar el pedido.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        customClass: {
          popup: 'rounded-[24px] border border-slate-200 dark:border-slate-800'
        }
      });
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleFulfill = async () => {
    if (!order || fulfilling) return;
    const fulfillmentOrderId = order.fulfillmentOrders?.edges?.[0]?.node?.id;
    if (!fulfillmentOrderId) {
      alert("No se encontrÃ³ una orden de preparaciÃ³n (FulfillmentOrder) vÃ¡lida.");
      return;
    }

    setFulfilling(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation fulfillmentCreate($fulfillment: FulfillmentInput!) {
              fulfillmentCreate(fulfillment: $fulfillment) {
                fulfillment { id status }
                userErrors { field message }
              }
            }
          `,
          variables: {
            fulfillment: {
              lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: fulfillmentOrderId }],
              notifyCustomer: false
            }
          }
        })
      });
      
      const resData = await response.json();
      const errors = resData?.data?.fulfillmentCreate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error de Shopify: ${errors[0].message}`);
      } else {
        alert("Â¡Pedido marcado como PREPARADO con Ã©xito!");
        fetchOrderDetails();
      }
    } catch (error) {
      console.error("Error fulfilling order:", error);
      alert("Error de conexiÃ³n al marcar el pedido como preparado.");
    } finally {
      setFulfilling(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!order || paying) return;
    setPaying(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderMarkAsPaid($id: ID!) {
              orderMarkAsPaid(input: { id: $id }) {
                order { id displayFinancialStatus }
                userErrors { field message }
              }
            }
          `,
          variables: { id: order.id }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderMarkAsPaid?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error de Shopify: ${errors[0].message}`);
      } else {
        alert("Â¡Pedido marcado como PAGADO con Ã©xito!");
        fetchOrderDetails();
      }
    } catch (error) {
      console.error("Error marking order as paid:", error);
    } finally {
      setPaying(false);
    }
  };

  const handleSaveNote = async () => {
    if (!order || savingNote) return;
    setSavingNote(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                order { id note }
                userErrors { field message }
              }
            }
          `,
          variables: { input: { id: order.id, note: noteText } }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingNote(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexiÃ³n al guardar la nota.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!order?.customer || savingCustomer) return;
    setSavingCustomer(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation customerUpdate($input: CustomerInput!) {
              customerUpdate(input: $input) {
                customer { id firstName lastName email phone }
                userErrors { field message }
              }
            }
          `,
          variables: {
            input: {
              id: order.customer.id,
              firstName: customerForm.firstName,
              lastName: customerForm.lastName,
              email: customerForm.email,
              phone: customerForm.phone || null
            }
          }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.customerUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingCustomer(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexiÃ³n al actualizar el cliente.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSaveTags = async () => {
    if (!order || savingTags) return;
    setSavingTags(true);
    try {
      const tagsString = tagsList.map(t => t.trim()).filter(Boolean).join(', ');
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                order { id tags }
                userErrors { field message }
              }
            }
          `,
          variables: { input: { id: order.id, tags: tagsString } }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingTags(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexiÃ³n al guardar etiquetas.');
    } finally {
      setSavingTags(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!order || savingAddress) return;
    setSavingAddress(true);
    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                order { id }
                userErrors { field message }
              }
            }
          `,
          variables: {
            input: {
              id: order.id,
              shippingAddress: {
                firstName: addressForm.firstName,
                lastName: addressForm.lastName,
                company: addressForm.company || null,
                address1: addressForm.address1,
                address2: addressForm.address2 || null,
                city: addressForm.city,
                province: addressForm.province || null,
                zip: addressForm.zip || null,
                country: addressForm.country,
                phone: addressForm.phone || null
              }
            }
          }
        })
      });
      const resData = await response.json();
      const errors = resData?.data?.orderUpdate?.userErrors;
      if (errors && errors.length > 0) {
        alert(`Error: ${errors[0].message}`);
      } else {
        setEditingAddress(false);
        fetchOrderDetails();
      }
    } catch (error) {
      alert('Error de conexiÃ³n al actualizar la direcciÃ³n.');
    } finally {
      setSavingAddress(false);
    }
  };

  const getFinancialStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: 'Pago pendiente', class: 'bg-warning-bg text-warning border-warning/30' };
      case 'PAID': return { text: 'Pagado', class: 'bg-success-bg text-success border-success/30' };
      case 'REFUNDED': return { text: 'Reembolsado', class: 'bg-danger-bg text-danger border-danger/20' };
      case 'VOIDED': return { text: 'Anulado', class: 'bg-card-alt text-text-muted border-slate-200/50 dark:border-slate-800' };
      default: return { text: status, class: 'bg-card-alt text-text-secondary border-slate-200/50 dark:border-slate-800' };
    }
  };

  const getFulfillmentStatusLabel = (order: any) => {
    // Prioritize Hoko delivery state if present
    const hokoState = String(order.delivery_state || '');
    if (hokoState === '4') {
      return { text: 'Preparado', class: 'bg-success-bg text-success' };
    }
    if (hokoState === '2' || hokoState === '3') {
      return { text: 'Parcialmente preparado', class: 'bg-info-bg text-info' };
    }
    if (hokoState === '5') {
      return { text: 'Cancelado', class: 'bg-danger-bg text-danger' };
    }

    const status = order.displayFulfillmentStatus;
    switch (status) {
      case 'UNFULFILLED': return { text: 'No preparado', class: 'bg-warning-bg text-warning' };
      case 'FULFILLED': return { text: 'Preparado', class: 'bg-success-bg text-success' };
      case 'PARTIALLY_FULFILLED': return { text: 'Parcialmente preparado', class: 'bg-info-bg text-info' };
      default: return { text: status || 'No preparado', class: 'bg-card-alt text-text-muted' };
    }
  };

  const formatPrice = (amountStr?: string) => {
    if (!amountStr) return '$0';
    return '$' + parseFloat(amountStr).toLocaleString('es-CO');
  };

  const translateGatewayName = (name: string): string => {
    const map: Record<string, string> = {
      'Cash on Delivery (COD)': 'Contra reembolso',
      'cash_on_delivery': 'Contra reembolso',
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'paypal': 'PayPal',
      'nequi': 'Nequi',
      'bancolombia': 'Bancolombia',
      'pse': 'PSE',
    };
    return map[name] || name;
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-brand" size={32} />
        <p className="text-text-muted font-medium text-sm">Cargando detalles del pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <p className="text-danger font-black">Error al cargar pedido</p>
        <p className="text-text-muted text-xs">{errorMessage || 'No se pudo cargar la informaciÃ³n del pedido.'}</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={fetchOrderDetails} variant="outline">Reintentar</Button>
          <Button onClick={onBack}>Volver a Pedidos</Button>
        </div>
      </div>
    );
  }

  const isShopify = order.canal === 'pagina_web' || !!order.shopify_order_id;
  const payment = getFinancialStatusLabel(order.displayFinancialStatus);
  const fulfillment = getFulfillmentStatusLabel(order);
  const totalItems = order.lineItems?.edges?.reduce((sum: number, edge: any) => sum + (edge.node.quantity || 1), 0) || 1;

  const total = formatPrice(order.totalPriceSet?.presentmentMoney?.amount);

  return (
    <div className="w-full animate-in fade-in duration-300">

      {/* â•â•â• HERO HEADER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl mx-4 md:mx-6 mt-2 mb-5 shadow-2xl border border-white/5">
        {/* ambient glow blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-brand/8 blur-3xl pointer-events-none" />

        <div className="relative px-6 md:px-8 pt-6 pb-5">
          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors mb-5"
          >
            <ArrowLeft size={12} />
            <span>Volver</span>
          </button>

          {/* Main hero row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="space-y-2.5">
              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border text-white ${
                  order.displayFinancialStatus === 'PAID' ? 'bg-emerald-600/80 border-emerald-500/30' :
                  order.displayFinancialStatus === 'PENDING' ? 'bg-amber-600/80 border-amber-500/30' :
                  'bg-rose-600/80 border-rose-500/30'
                }`}>
                  {payment.text}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full text-white ${
                  order.displayFulfillmentStatus === 'FULFILLED' ? 'bg-emerald-600/80' : 
                  order.displayFulfillmentStatus === 'UNFULFILLED' ? 'bg-amber-600/80' : 'bg-blue-600/80'
                }`}>
                  {fulfillment.text}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border text-white ${
                  isShopify ? 'bg-brand/20 border-brand/30' : 'bg-emerald-500/20 border-emerald-500/30'
                }`}>
                  {isShopify ? 'Shopify' : order.canal}
                </span>

                {/* Hoko status badge if available */}
                {(order.hoko_order_id || hokoOrder?.id) && (
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${stateColor(hokoOrder?.delivery_state || order.delivery_state || '1')}`}>
                    Hoko: {HOKO_ORDER_STATES[hokoOrder?.delivery_state || order.delivery_state] || 'En Despacho'}
                  </span>
                )}
                {(hokoOrder?.guide?.state !== undefined || order.guide?.state !== undefined) && (
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${guideStateColor((hokoOrder?.guide || order.guide)?.state)}`}>
                    Guía: {HOKO_GUIDE_STATES_CO[(hokoOrder?.guide || order.guide)?.state] || 'Generada'}
                  </span>
                )}
              </div>

              {/* Order number */}
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
                {order.name}
              </h1>

              {/* Meta */}
              <p className="text-white/50 text-[11px] font-medium flex flex-wrap items-center gap-2">
                <Calendar size={12} />
                <span>{new Date(order.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}</span>
                {order.confirmationNumber && (
                  <>
                    <span className="text-white/20">•</span>
                    <Hash size={11} />
                    <span className="font-bold text-white/75">{order.confirmationNumber}</span>
                  </>
                )}
              </p>
            </div>

            {/* Total + actions */}
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="md:text-right">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Total del pedido</p>
                <p className="text-3xl font-black text-white">{total}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(order.hoko_order_id || hokoOrder?.id) && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/ordenes/${order.hoko_order_id || hokoOrder?.id}`)}
                    className="h-9 text-[11px] font-black uppercase tracking-wide border-brand/40 text-brand-light hover:bg-brand/10"
                  >
                    <ExternalLink size={13} className="mr-1" />
                    <span>Ver en Órdenes</span>
                  </Button>
                )}
                {order.status === 'ESPERANDO_COMFIRMACION' && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateModal(true)}
                      className="h-9 text-[11px] font-black uppercase tracking-wide bg-brand border-0 text-white"
                    >
                      Confirmar Pedido
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowArchiveModal(true)}
                      className="h-9 text-[11px] font-black uppercase tracking-wide border-rose-500/30 text-rose-500 hover:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/40"
                    >
                      Archivar
                    </Button>
                  </>
                )}
                {isShopify && order.displayFulfillmentStatus === 'UNFULFILLED' && order.status !== 'ESPERANDO_COMFIRMACION' && (
                  <Button
                    variant="primary"
                    onClick={handleFulfill}
                    disabled={fulfilling}
                    className="h-9 text-[11px] font-black uppercase tracking-wide bg-brand border-0 text-white"
                  >
                    {fulfilling ? 'Preparando...' : 'Solicitar Preparación'}
                  </Button>
                )}
                {isShopify && order.displayFinancialStatus === 'PENDING' && order.status !== 'ESPERANDO_COMFIRMACION' && (
                  <Button
                    variant="outline"
                    onClick={handleMarkAsPaid}
                    disabled={paying}
                    className="h-9 text-[11px] font-black uppercase tracking-wide border-white/20 text-white hover:bg-white/10"
                  >
                    {paying ? 'Procesando...' : 'Marcar Pagado'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hoko strip */}
        {(order.hoko_order_id || hokoOrder?.id) && (
          <div className="relative border-t border-white/8 px-6 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-2.5">
              <Truck size={14} className="text-brand shrink-0" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Envío Hoko:</span>
              <span className="px-2 py-0.5 bg-brand/20 border border-brand/30 rounded-full text-white text-[10px] font-black font-mono">
                #{order.hoko_order_id || hokoOrder?.id}
              </span>
              
              {(hokoOrder?.guide?.number || order.guide?.number) ? (
                <span className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5 ml-2">
                  <span className="text-white/40">•</span>
                  <span className="text-[10px] text-white/50 uppercase font-black">Guía:</span>
                  <span className="font-mono font-black text-brand-light">{(hokoOrder?.guide || order.guide)?.number}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${guideStateColor((hokoOrder?.guide || order.guide)?.state)}`}>
                    {HOKO_GUIDE_STATES_CO[(hokoOrder?.guide || order.guide)?.state] || 'Activa'}
                  </span>
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-bold ml-2">
                  (Pendiente por generar guía)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {((hokoOrder as any)?.guide_pdf || (hokoOrder?.guide as any)?.pdf) && (
                <a
                  href={(hokoOrder as any)?.guide_pdf || (hokoOrder?.guide as any)?.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase rounded-lg transition-colors border border-white/10"
                >
                  <FileText size={11} />
                  <span>PDF Guía</span>
                </a>
              )}
              <button
                onClick={() => router.push(`/ordenes/${order.hoko_order_id || hokoOrder?.id}`)}
                className="inline-flex items-center gap-1 text-[10px] font-black text-brand-light hover:underline uppercase tracking-wider"
              >
                <span>Módulo Órdenes</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ ARCHIVED ORDER ALERT BANNER (PRO-341) ═══ */}
      {order.status === 'ARCHIVADO' && (
        <div className="mx-4 md:mx-6 mb-5 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase rounded-full">
                  Pedido Archivado
                </span>
                <span className="text-[11px] font-bold text-text-muted">Cliente No Interesado</span>
              </div>
              <p className="text-xs text-text-primary mt-1.5 font-medium leading-relaxed">
                <span className="font-bold">Motivo / Nota: </span>
                {order.notas || 'No se registró una nota explicativa al archivar.'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowArchiveModal(true)}
            className="h-8 px-3 text-[10px] font-bold border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 shrink-0 self-start md:self-auto"
          >
            <FileText size={12} className="mr-1.5" />
            <span>{order.notas ? 'Editar Nota de Archivo' : 'Agregar Nota de Archivo'}</span>
          </Button>
        </div>
      )}

      {/* BODY: 5-col grid */}
      <div className="px-4 md:px-6 grid grid-cols-1 xl:grid-cols-5 gap-4 pb-10">

        {/* LEFT COL (3/5): Items + Financials + Notes */}
        <div className="xl:col-span-3 flex flex-col gap-4">

          {/* Items card */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
              <div className="flex items-center gap-2">
                <ShoppingBag size={14} className="text-text-muted" />
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">
                  Artículos · {totalItems}
                </span>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${fulfillment.class}`}>
                {fulfillment.text}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {order.lineItems?.edges?.map((edge: any) => {
                const item = edge.node;
                return (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    {/* thumb */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/40 dark:border-slate-700/30">
                      <img
                        src={item.image?.url || '/nanotrack.png'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/nanotrack.png'; }}
                      />
                    </div>
                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-text-primary leading-tight truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.sku && (
                          <span className="text-[9px] font-bold text-text-muted bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                            {item.sku}
                          </span>
                        )}
                        <span className="text-[10px] text-text-muted">x{item.quantity}</span>
                      </div>
                    </div>
                    {/* price */}
                    <p className="text-sm font-black text-text-primary shrink-0">
                      {formatPrice(item.originalUnitPriceSet?.presentmentMoney?.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financials card */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
              <CreditCard size={14} className="text-text-muted" />
              <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Resumen de Pago</span>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="font-bold text-text-primary">{formatPrice(order.subtotalPriceSet?.presentmentMoney?.amount)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Envío</span>
                <span className="font-bold text-text-primary">{formatPrice(order.totalShippingPriceSet?.presentmentMoney?.amount)}</span>
              </div>
              {order.paymentGatewayNames?.length > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Método de pago</span>
                  <span className="font-bold text-text-primary text-right">{order.paymentGatewayNames.map(translateGatewayName).join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/50 pt-2.5 text-sm font-black text-text-primary">
                <span>Total</span>
                <span>{total}</span>
              </div>
            </div>
          </div>

          {/* Notes card — Shopify only */}
          {isShopify && (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <Clipboard size={14} className="text-text-muted" />
                  <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Nota del Pedido</span>
                </div>
                {!editingNote && (
                  <button
                    onClick={() => { setNoteText(order.note || ''); setEditingNote(true); }}
                    className="text-[10px] font-black text-brand hover:text-brand/70 uppercase tracking-wider"
                  >
                    Editar
                  </button>
                )}
              </div>
              <div className="px-5 py-4">
                {editingNote ? (
                  <div className="space-y-2.5">
                    <textarea
                      className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl p-3 resize-none focus:outline-none focus:border-brand"
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Escribe una nota..."
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setEditingNote(false)} className="h-8 text-[10px]">Cancelar</Button>
                      <Button variant="primary" onClick={handleSaveNote} disabled={savingNote} className="h-8 text-[10px]">
                        {savingNote ? 'Guardando...' : 'Guardar nota'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic leading-relaxed">
                    {order.note || 'Sin notas para este pedido.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COL (2/5): Hoko Logistics + Customer + Address + Tags */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* ═══ HOKO SHIPPING & LOGISTICS CARD ═══ */}
          {(order.hoko_order_id || hokoOrder?.id) ? (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden shadow-sm animate-in fade-in duration-300">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70 bg-gradient-to-r from-brand/10 via-transparent to-transparent">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-brand" />
                  <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">
                    Despacho & Guía Hoko
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full ${stateColor((hokoOrder || order).delivery_state || '1')}`}>
                    {HOKO_ORDER_STATES[(hokoOrder || order).delivery_state] || `Orden #${(order.hoko_order_id || hokoOrder?.id)}`}
                  </span>
                  <button
                    onClick={() => router.push(`/ordenes/${order.hoko_order_id || hokoOrder?.id}`)}
                    className="p-1 text-text-muted hover:text-brand transition-colors rounded-lg"
                    title="Ver en módulo de órdenes Hoko"
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Guide Highlight Box */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-wider block">Número de Guía</span>
                      {((hokoOrder || order).guide?.number) ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-black font-mono text-text-primary tracking-wide">
                            {(hokoOrder || order).guide.number}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText((hokoOrder || order).guide.number);
                              setCopiedGuide(true);
                              setTimeout(() => setCopiedGuide(false), 2000);
                            }}
                            className="text-text-muted hover:text-brand p-1 transition-colors rounded-lg"
                            title="Copiar número de guía"
                          >
                            {copiedGuide ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted font-bold italic mt-0.5 block">Sin guía generada</span>
                      )}
                    </div>

                    {((hokoOrder || order).guide?.state !== undefined) && (
                      <div className="text-right">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-wider block">Estado Guía</span>
                        <span className={`inline-block mt-0.5 px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full ${guideStateColor((hokoOrder || order).guide.state)}`}>
                          {HOKO_GUIDE_STATES_CO[(hokoOrder || order).guide.state] || `Estado #${(hokoOrder || order).guide.state}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-xs font-semibold">
                    <div>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Transportadora</span>
                      <span className="text-text-primary font-black text-[11px] truncate block">
                        {(hokoOrder || order).courier?.name || order.courier_name || ((hokoOrder || order).courier_id ? `Courier #${(hokoOrder || order).courier_id}` : '—')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Flete Tienda</span>
                      <span className="text-text-primary font-black text-[11px] font-mono block">
                        {(hokoOrder || order).guide?.total_freight_store ? `$${parseInt((hokoOrder || order).guide.total_freight_store).toLocaleString('es-CO')} COP` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Actions inside guide block */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {((hokoOrder as any)?.guide_pdf || (hokoOrder?.guide as any)?.pdf || (order as any).guide_pdf) ? (
                      <a
                        href={(hokoOrder as any)?.guide_pdf || (hokoOrder?.guide as any)?.pdf || (order as any).guide_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand text-white text-[10px] font-black uppercase rounded-xl hover:bg-brand/90 transition-all shadow-sm"
                      >
                        <FileText size={13} />
                        <span>Imprimir Guía PDF</span>
                      </a>
                    ) : (
                      !((hokoOrder || order).guide?.number) && (
                        <Button
                          variant="primary"
                          onClick={() => handleGenerateGuide(order.hoko_order_id || hokoOrder?.id)}
                          disabled={actionLoading === 'guide'}
                          className="w-full text-center flex items-center justify-center gap-1.5 h-8 text-[10px] font-black uppercase bg-brand text-white rounded-xl shadow-sm"
                        >
                          {actionLoading === 'guide' ? <RefreshCw size={12} className="animate-spin" /> : <Truck size={12} />}
                          <span>Generar Guía de Envío</span>
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Logistic Specifications Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold text-text-secondary">
                  <div className="bg-slate-50/80 dark:bg-slate-900/30 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Bodega Despacho</span>
                    <span className="text-text-primary font-black text-xs">
                      {(hokoOrder || order).cellar_id === 2353 ? 'Bodega Bogotá (#2353)' : (hokoOrder || order).cellar_id === 2354 ? 'Bodega Medellín (#2354)' : ((hokoOrder || order).cellar_id ? `Bodega #${(hokoOrder || order).cellar_id}` : (order.stock_id ? `Stock #${order.stock_id}` : 'Principal'))}
                    </span>
                  </div>

                  <div className="bg-slate-50/80 dark:bg-slate-900/30 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Valor Declarado</span>
                    <span className="text-text-primary font-black text-xs font-mono">
                      ${(hokoOrder || order).declared_value ? parseInt((hokoOrder || order).declared_value).toLocaleString('es-CO') : '100.000'}
                    </span>
                  </div>

                  <div className="bg-slate-50/80 dark:bg-slate-900/30 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Método Recaudo</span>
                    <span className="text-text-primary font-black text-xs">
                      {(hokoOrder || order).payment === '1' ? 'Contra entrega' : (hokoOrder || order).payment === '2' ? 'Ordinario' : (order.payment_type || 'Contra entrega')}
                    </span>
                  </div>

                  <div className="bg-slate-50/80 dark:bg-slate-900/30 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Empaque y Peso</span>
                    <span className="text-text-primary font-black text-xs">
                      {(hokoOrder || order).measures ? `${(hokoOrder || order).measures.width}x${(hokoOrder || order).measures.height}x${(hokoOrder || order).measures.length} cm (${(hokoOrder || order).measures.weight}kg)` : '10x10x10 cm (1kg)'}
                    </span>
                  </div>
                </div>

                {/* Contenido Declarado */}
                {((hokoOrder || order).contain) && (
                  <div className="text-xs">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Contenido Declarado</span>
                    <p className="font-bold text-text-primary text-[11px] truncate bg-slate-50/80 dark:bg-slate-900/30 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/30">
                      {(hokoOrder || order).contain}
                    </p>
                  </div>
                )}

                {/* Acceso a App Mobile */}
                {order.db_id && (
                  <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Acceso Plataforma App</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border mt-1 select-none ${
                        order.acceso_app === 'OK APP'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {order.acceso_app || 'PENDIENTE APP'}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={updatingAppStatus}
                      onClick={toggleAppStatus}
                      className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary rounded-xl border border-slate-200 dark:border-slate-800 transition-all active:scale-95 whitespace-nowrap"
                    >
                      {updatingAppStatus ? '...' : 'Cambiar Acceso'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No Hoko order yet card */
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-text-muted" />
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">
                  Despacho Hoko
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Este pedido no cuenta con una orden de despacho creada en Hoko todavía.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="w-full h-9 text-[10px] font-black uppercase tracking-wider bg-brand border-0 text-white rounded-xl flex items-center justify-center gap-1.5"
              >
                <Truck size={13} />
                <span>Crear Orden en Hoko</span>
              </Button>
            </div>
          )}

          {/* Customer card */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
              <div className="flex items-center gap-2">
                <User size={14} className="text-text-muted" />
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Cliente</span>
              </div>
              {isShopify && order.customer && !editingCustomer && (
                <button
                  onClick={() => {
                    setCustomerForm({
                      firstName: order.customer?.firstName || '',
                      lastName: order.customer?.lastName || '',
                      email: order.customer?.email || '',
                      phone: order.customer?.phone || ''
                    });
                    setEditingCustomer(true);
                  }}
                  className="text-[10px] font-black text-brand hover:text-brand/70 uppercase tracking-wider"
                >
                  Editar
                </button>
              )}
            </div>
            <div className="px-5 py-4">
              {order.customer ? (
                isShopify && editingCustomer ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Nombre</label>
                        <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={customerForm.firstName} onChange={(e) => setCustomerForm(f => ({ ...f, firstName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Apellido</label>
                        <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={customerForm.lastName} onChange={(e) => setCustomerForm(f => ({ ...f, lastName: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Email</label>
                      <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={customerForm.email} onChange={(e) => setCustomerForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <Button variant="ghost" onClick={() => setEditingCustomer(false)} className="h-8 text-[10px]">Cancelar</Button>
                      <Button variant="primary" onClick={handleSaveCustomer} disabled={savingCustomer} className="h-8 text-[10px]">{savingCustomer ? 'Guardando...' : 'Guardar'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                        <User size={15} className="text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-text-primary truncate">{order.customer.firstName} {order.customer.lastName}</p>
                        <p className="text-[10px] text-text-muted">{order.customer.numberOfOrders || 1} pedido(s)</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-text-secondary">
                      {order.customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={11} className="text-text-muted shrink-0" />
                          <span className="truncate">{order.customer.email}</span>
                        </div>
                      )}
                      {order.customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={11} className="text-text-muted shrink-0" />
                          <span>{order.customer.phone}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/contacts?id=${encodeURIComponent(order.cliente_id || order.customer?.phone || '')}`)}
                      className="w-full py-1.5 text-[10px] font-black text-brand border border-brand/20 rounded-xl hover:bg-brand/5 transition-colors uppercase tracking-wider"
                    >
                      Ver perfil →
                    </button>
                  </div>
                )
              ) : (
                <p className="text-xs text-text-muted italic">Sin información de cliente.</p>
              )}
            </div>
          </div>

          {/* Shipping address card */}
          {order.shippingAddress && (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-text-muted" />
                  <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Envío</span>
                </div>
                {isShopify && !editingAddress && (
                  <button
                    onClick={() => {
                      setAddressForm({
                        firstName: order.shippingAddress?.firstName || '',
                        lastName: order.shippingAddress?.lastName || '',
                        company: order.shippingAddress?.company || '',
                        address1: order.shippingAddress?.address1 || '',
                        address2: order.shippingAddress?.address2 || '',
                        city: order.shippingAddress?.city || '',
                        province: order.shippingAddress?.province || '',
                        zip: order.shippingAddress?.zip || '',
                        country: order.shippingAddress?.country || '',
                        phone: order.shippingAddress?.phone || ''
                      });
                      setEditingAddress(true);
                    }}
                    className="text-[10px] font-black text-brand hover:text-brand/70 uppercase tracking-wider"
                  >
                    Editar
                  </button>
                )}
              </div>
              <div className="px-5 py-4">
                {isShopify && editingAddress ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Nombre</label>
                        <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={addressForm.firstName} onChange={(e) => setAddressForm(f => ({ ...f, firstName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Apellido</label>
                        <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={addressForm.lastName} onChange={(e) => setAddressForm(f => ({ ...f, lastName: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Dirección</label>
                      <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={addressForm.address1} onChange={(e) => setAddressForm(f => ({ ...f, address1: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Ciudad</label>
                        <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={addressForm.city} onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Teléfono</label>
                        <input className="w-full text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-brand" value={addressForm.phone} onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <Button variant="ghost" onClick={() => setEditingAddress(false)} className="h-8 text-[10px]">Cancelar</Button>
                      <Button variant="primary" onClick={handleSaveAddress} disabled={savingAddress} className="h-8 text-[10px]">{savingAddress ? 'Guardando...' : 'Guardar'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs text-text-secondary">
                    <p className="font-bold text-text-primary">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p>{order.shippingAddress.address1}</p>
                    <p>{order.shippingAddress.city}</p>
                    {order.shippingAddress.phone && (
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <Phone size={11} className="text-text-muted" />
                        <span>{order.shippingAddress.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags card — Shopify only */}
          {isShopify && (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-text-muted" />
                  <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">Etiquetas</span>
                </div>
                {!editingTags && (
                  <button
                    onClick={() => {
                      const current = Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
                      setTagsList(current);
                      setEditingTags(true);
                    }}
                    className="text-[10px] font-black text-brand hover:text-brand/70 uppercase tracking-wider"
                  >
                    Editar
                  </button>
                )}
              </div>
              <div className="px-5 py-4">
                {editingTags ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {tagsList.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand/10 text-brand text-[10px] font-black uppercase rounded-full">
                          {tag}
                          <button onClick={() => setTagsList(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-danger ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-xs text-text-primary bg-card-alt border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand"
                        placeholder="Nueva etiqueta..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newTagInput.trim()) { setTagsList(prev => [...prev, newTagInput.trim()]); setNewTagInput(''); }}}
                      />
                      <button onClick={() => { if (newTagInput.trim()) { setTagsList(prev => [...prev, newTagInput.trim()]); setNewTagInput(''); }}} className="px-3 py-1.5 bg-brand text-white text-[10px] font-black rounded-xl">+</button>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => { setEditingTags(false); setNewTagInput(''); }} className="h-8 text-[10px]">Cancelar</Button>
                      <Button variant="primary" onClick={handleSaveTags} disabled={savingTags} className="h-8 text-[10px]">{savingTags ? 'Guardando...' : 'Guardar'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(order.tags) ? order.tags : (order.tags ? order.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])).length > 0
                      ? (Array.isArray(order.tags) ? order.tags : order.tags.split(',').map((t: string) => t.trim()).filter(Boolean)).map((tag: string, i: number) => (
                          <span key={i} className="px-2.5 py-0.5 bg-brand/10 text-brand text-[10px] font-black uppercase rounded-full">{tag}</span>
                        ))
                      : <p className="text-[10px] text-text-muted italic">Sin etiquetas.</p>
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {order && (
        <>
          <CreateManualOrderModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchOrderDetails();
            }}
            prefilledOrder={{
              id: order.db_id,
              name: order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
              email: order.customer?.email || '',
              phone: order.customer?.phone || '',
              address: order.shippingAddress?.address1 || '',
              city: order.shippingAddress?.city || '',
              quantity: totalItems || 1,
              metodo_pago: order.paymentGatewayNames?.[0] || 'cod'
            }}
          />

          <ArchiveOrderModal
            isOpen={showArchiveModal}
            onClose={() => setShowArchiveModal(false)}
            orderId={order.db_id || null}
            orderName={order.shopify_order_name || `#${order.shopify_order_id || order.id || order.db_id}`}
            clientName={order.customer?.name}
            currentNote={order.notas || ''}
            onSuccess={(id, note) => {
              setOrder((prev: any) => prev ? { ...prev, status: 'ARCHIVADO', notas: note } : prev);
              fetchOrderDetails();
            }}
          />
        </>
      )}
    </div>
  );
}
