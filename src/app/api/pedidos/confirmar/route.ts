import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../../utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  logger.info('=== INICIO GET /api/pedidos/confirmar ===');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    logger.info('Consultando tabla "pedidos" en Supabase para órdenes de Shopify...');
    
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(*)')
      .not('shopify_order_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error al consultar pedidos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedData = data?.map((p: any) => {
      // Extract shopify order ID from client_id or use shopify_order_id
      let extId = p.shopify_order_id ? String(p.shopify_order_id) : String(p.id);
      if (p.clientes?.cliente_id?.startsWith('cliente_tienda_pedido_')) {
        extId = p.clientes.cliente_id.replace('cliente_tienda_pedido_', '');
      }

      return {
        id: p.id,
        shopify_order_id: p.shopify_order_id,
        external_order_id: extId,
        name: p.clientes?.nombre || '',
        email: p.clientes?.email || '',
        phone: p.clientes?.telefono || '',
        address: p.clientes?.direccion || '',
        city: p.clientes?.ciudad || '',
        quantity: p.quantity || 1,
        metodo_pago: p.payment_type || 'pending',
        status: p.status,
        confirmed_at: p.confirmed_at,
        created_at: p.created_at,
        updated_at: p.updated_at
      };
    }) || [];

    logger.info(`Pedidos por confirmar obtenidos: ${mappedData.length} registros`);
    return NextResponse.json(mappedData);
  } catch (error: any) {
    logger.error('Excepción en GET /api/pedidos/confirmar:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    logger.info('=== FIN GET /api/pedidos/confirmar ===');
  }
}

export async function POST(request: NextRequest) {
  logger.info('=== INICIO POST /api/pedidos/confirmar ===');
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      logger.warn('POST /api/pedidos/confirmar llamado sin ID');
      return NextResponse.json({ error: 'Falta el id del pedido' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    logger.info(`Confirmando pedido ID: ${id} en tabla pedidos de Supabase...`);
    
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        status: 'COMFIRMADO',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, clientes(*)');

    if (error) {
      logger.error(`Error al actualizar pedido ID ${id} en Supabase:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info(`Pedido ID ${id} confirmado exitosamente en base de datos`);
    
    const result = data && data.length > 0 ? {
      id: data[0].id,
      shopify_order_id: data[0].shopify_order_id,
      external_order_id: data[0].shopify_order_id ? String(data[0].shopify_order_id) : String(data[0].id),
      name: data[0].clientes?.nombre || '',
      email: data[0].clientes?.email || '',
      phone: data[0].clientes?.telefono || '',
      address: data[0].clientes?.direccion || '',
      city: data[0].clientes?.ciudad || '',
      quantity: data[0].quantity || 1,
      metodo_pago: data[0].payment_type || 'pending',
      status: data[0].status,
      confirmed_at: data[0].confirmed_at,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at
    } : null;

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Excepción en POST /api/pedidos/confirmar:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    logger.info('=== FIN POST /api/pedidos/confirmar ===');
  }
}
