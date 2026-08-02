/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Role = 'Superadmin' | 'Administrador' | 'Supervisor' | 'Agente';
export type UserStatus = 'En línea' | 'Ocupado' | 'Ausente' | 'Desconectado';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatar?: string;
  activeConversations: number;
  lastAccess: string;
}

export type ContactStatus = 'Cliente activo' | 'Prospecto' | 'Lead' | 'Perdido' | 'Inactivo';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  status: ContactStatus;
  agentId: string;
  score: number;
  tags: string[];
  city: string;
  country: string;
  createdAt: string;
}

export type DealStage = 'Nuevo lead' | 'Contactado' | 'Propuesta enviada' | 'Negociación' | 'Cerrado ganado' | 'Cerrado perdido';

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  value: number;
  probability: number;
  stage: DealStage;
  estimatedCloseDate: string;
  responsibleId: string;
  description?: string;
}

export type MessageChannel = 'WhatsApp' | 'Email' | 'Web Chat' | 'Instagram' | 'Facebook';
export type MessageStatus = 'Abierta' | 'En espera' | 'Resuelta';

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isInternal?: boolean;
}

export interface Conversation {
  id: string;
  contactId: string;
  channel: MessageChannel;
  status: MessageStatus;
  assignedTo: string;
  messages: Message[];
  priority?: 'Baja' | 'Media' | 'Alta';
}

export type TaskPriority = 'Baja' | 'Media' | 'Alta';
export type TaskStatus = 'Pendiente' | 'En progreso' | 'Completada';

export interface Task {
  id: string;
  title: string;
  contactId?: string;
  dealId?: string;
  dueDate: string;
  priority: TaskPriority;
  assignedId: string;
  status: TaskStatus;
  description?: string;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  originalUnitPriceSet: {
    presentmentMoney: ShopifyMoney;
  };
  image?: {
    url: string;
  } | null;
  sku?: string;
}

export interface ShopifyCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  numberOfOrders?: number;
}

export interface ShopifyShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip?: string;
  country: string;
  phone?: string;
}

export interface ShopifyShippingLine {
  title: string;
  code?: string;
}

export interface ShopifyFulfillmentOrder {
  id: string;
  status: string;
  deliveryMethod?: {
    methodType: string;
  };
}

export interface ShopifyFulfillment {
  id: string;
  status: string;
  trackingInfo?: Array<{
    number?: string;
    url?: string;
    company?: string;
  }>;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  cancelledAt?: string | null;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  note?: string;
  tags?: string | string[];
  channelInformation?: {
    channelDefinition?: {
      channelName: string;
    };
  } | null;
  totalPriceSet: {
    presentmentMoney: ShopifyMoney;
  };
  subtotalPriceSet?: {
    presentmentMoney: ShopifyMoney;
  };
  totalShippingPriceSet?: {
    presentmentMoney: ShopifyMoney;
  };
  customer?: ShopifyCustomer | null;
  shippingAddress?: ShopifyShippingAddress | null;
  billingAddress?: ShopifyShippingAddress | null;
  billingAddressMatchesShippingAddress?: boolean;
  lineItems: {
    edges: Array<{
      node: ShopifyLineItem;
    }>;
  };
  shippingLines?: {
    edges: Array<{
      node: ShopifyShippingLine;
    }>;
  };
  shippingLine?: { title: string } | null;
  fulfillments?: Array<{
    id: string;
    status: string;
    trackingInfo?: Array<{
      number?: string;
      url?: string;
      company?: string;
    }>;
  }>;
  fulfillmentOrders?: {
    edges: Array<{
      node: ShopifyFulfillmentOrder;
    }>;
  };
  paymentGatewayNames?: string[];
  discountCodes?: string[];
  risk?: { recommendation?: string } | null;
  fullyPaid?: boolean;
  cancelReason?: string | null;
  confirmationNumber?: string;
  sourceName?: string;
  email?: string;
  phone?: string;
  poNumber?: string;
  clientIp?: string;
  returns?: {
    edges: Array<{ node: { status: string } }>;
  };
  refunds?: Array<{ id: string; createdAt: string }>;
  events?: {
    edges: Array<{ node: { id: string; message?: string; createdAt: string } }>;
  };
}

// ─── Hoko Types ─────────────────────────────────────────
export interface HokoCustomer {
  name: string;
  email: string;
  identification: string;
  phone: string;
  address: string;
  city_id: string;
  city?: string;
}

export interface HokoMeasures {
  height: string;
  width: string;
  length: string;
  weight: string;
}

export interface HokoOrder {
  id: string;
  delivery_state: string;
  cellar_id?: string;
  courier_id?: string;
  warranty?: string;
  payment?: string;
  measures?: HokoMeasures;
  external_id?: string;
  customer?: HokoCustomer;
  contain?: string;
  declared_value?: string;
  created_at?: string;
  prev_page_url?: string | null;
  next_page_url?: string | null;
  guide?: HokoGuide;
}

export interface HokoGuide {
  id: string;
  number: string;
  state: string;
  total_freight_store?: string;
  courier_name?: string;
}

export interface HokoCity {
  id: string;
  name: string;
  department?: string;
}

export interface HokoQuotation {
  courier_id: number;
  courier_name: string;
  price: number;
  delivered_days: string;
  courier_logo?: string;
  value?: number;
}

export const HOKO_ORDER_STATES: Record<string, string> = {
  '1': 'Creada',
  '2': 'En proceso',
  '3': 'Despachada',
  '4': 'Finalizada',
  '5': 'Cancelada',
  '6': 'En Novedad',
};

export const HOKO_GUIDE_STATES_CO: Record<string, string> = {
  '0': 'Cancelada',
  '1': 'Activa',
  '2': 'Despachada',
  '3': 'Entregada',
  '4': 'Anulada',
  '5': 'Generada',
  '6': 'En Novedad',
  '7': 'En Reparto',
  '8': 'En Bodega',
  '9': 'Reexpedición',
  '10': 'Solucionada en Malla',
  '11': 'Devolución',
  '12': 'En Procesamiento',
  '13': 'Recibido del Cliente',
  '14': 'Redireccionado',
  '15': 'En Espera de Ruta Domestica',
  '16': 'Mercancía Recogida',
  '17': 'Pagado',
  '18': 'Error por Saldo',
  '19': 'Pagado a Tienda',
  '20': 'Devolución Cobrado',
  '21': 'Error por API',
  '22': 'Transportadora Invalida',
};
