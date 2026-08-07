"use client";

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const OrdersDashboard = dynamic(() => import('../../../../components/orders/OrdersDashboard').then(m => m.OrdersDashboard), { ssr: false });

export default function ShopifyPedidosPage() {
  const router = useRouter();

  return (
    <OrdersDashboard
      onViewOrderDetail={(id) => router.push(`/pedidos/${encodeURIComponent(id)}`)}
    />
  );
}
