import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { id, shopify_order_id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Falta el id del pedido o el nuevo estado de pago.' }, { status: 400 });
    }

    if (status !== 'PAID' && status !== 'PENDING') {
      return NextResponse.json({ error: 'Estado de pago inválido.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Determine the payment_type text to save locally
    const localPaymentType = status === 'PAID' ? 'pagado en la tienda' : 'pago contra entrega';

    // 1. If it's a Shopify order, call Shopify GraphQL API to mark as paid
    if (shopify_order_id && status === 'PAID') {
      console.log(`Marcando pedido Shopify ${shopify_order_id} como pagado...`);
      const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-07';
      const token = process.env.SHOPIFY_ACCESS_TOKEN || '';
      
      const query = `
        mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
          orderMarkAsPaid(input: $input) {
            order {
              id
              displayFinancialStatus
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const formattedShopifyId = String(shopify_order_id).startsWith('gid://') 
        ? shopify_order_id 
        : `gid://shopify/Order/${shopify_order_id}`;

      const response = await fetch(`https://telocalizo-tags.myshopify.com/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            input: {
              id: formattedShopifyId
            }
          }
        }),
      });

      const shopifyRes = await response.json();
      console.log('Respuesta de Shopify al marcar pago:', shopifyRes);

      if (shopifyRes.errors || shopifyRes.data?.orderMarkAsPaid?.userErrors?.length > 0) {
        const errMsg = shopifyRes.errors?.[0]?.message || shopifyRes.data?.orderMarkAsPaid?.userErrors?.[0]?.message || 'Error en Shopify';
        return NextResponse.json({ error: `Shopify Error: ${errMsg}` }, { status: 500 });
      }
    }

    // 2. Update the local database order
    const { data, error } = await supabase
      .from('pedidos')
      .update({ 
        payment_type: localPaymentType,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar pago en Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err: any) {
    console.error('Excepción en update-payment-status route:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
