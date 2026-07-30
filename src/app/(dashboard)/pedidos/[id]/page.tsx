"use client";

import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const OrderDetailView = dynamic(() => import('../../../../components/orders/OrderDetailView').then(m => m.OrderDetailView), { ssr: false });

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <OrderDetailView
      orderId={decodeURIComponent(params.id as string)}
      onBack={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
        } else {
          router.push('/pedidos');
        }
      }}
    />
  );
}
