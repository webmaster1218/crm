import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const HOKO_BASE = process.env.HOKO_BASE_URL || 'https://hoko.com.co/api';
const HOKO_TOKEN = process.env.HOKO_API_TOKEN || '';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  logger.info('=== INICIO GET /api/pedidos (SERVER SIDE) ===');
  try {
    const urlParams = new URL(request.url).searchParams;
    const orderIdParam = urlParams.get('id');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    logger.info('Consultando tabla "pedidos" en Supabase...');
    
    let dbQuery = supabase
      .from('pedidos')
      .select('*, clientes(*)');
      
    if (orderIdParam) {
      dbQuery = dbQuery.eq('id', orderIdParam);
    } else {
      const statusParam = urlParams.get('status');
      if (statusParam) {
        dbQuery = dbQuery.eq('status', statusParam);
      } else {
        dbQuery = dbQuery.eq('status', 'COMFIRMADO');
      }
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data: dbPedidos, error: dbError } = await dbQuery;

    if (dbError) {
      logger.error('Error al consultar Supabase pedidos:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    logger.info(`Pedidos obtenidos de Supabase: ${dbPedidos?.length || 0} registros`);

    if (!dbPedidos || dbPedidos.length === 0) {
      return NextResponse.json(orderIdParam ? null : []);
    }

    const orders: any[] = [];

    // Map database fields to standard response format
    const dbOrdersList = dbPedidos.map((p: any) => {
      const canalStr = p.clientes?.canal || 'whatsApp';
      const cleanClienteId = p.cliente_id || '';
      
      let shopifyOrderId = null;
      let shopifyOrderName = '';
      
      if (canalStr === 'pagina_web') {
        if (cleanClienteId.startsWith('cliente_tienda_pedido_')) {
          const num = cleanClienteId.replace('cliente_tienda_pedido_', '');
          shopifyOrderId = `gid://shopify/Order/${num}`;
          shopifyOrderName = `#${num}`;
        } else if (/^\d+$/.test(cleanClienteId)) {
          shopifyOrderId = `gid://shopify/Order/${cleanClienteId}`;
          shopifyOrderName = `#${cleanClienteId}`;
        } else {
          shopifyOrderId = cleanClienteId;
          shopifyOrderName = cleanClienteId.split('/').pop() || 'Shopify';
        }
      } else {
        shopifyOrderName = `Chat: #${p.id}`;
      }

      return {
        id: p.hoko_order_id || `db-${p.id}`,
        db_id: p.id,
        hoko_order_id: p.hoko_order_id,
        hoko_store_id: p.hoko_store_id,
        quantity: p.quantity || 1,
        stock_id: p.stock_id,
        courier_id: p.courier_id,
        courier_name: p.courier_name,
        payment_type: p.payment_type,
        total_paid: p.total_paid,
        created_at: p.created_at,
        updated_at: p.updated_at,
        canal: canalStr,
        acceso_app: p.acceso_app || 'PENDIENTE APP',
        customer: {
          name: p.clientes?.nombre || '—',
          email: p.clientes?.email || '—',
          phone: p.clientes?.telefono || '—',
          address: p.clientes?.direccion || '—',
          identification: p.clientes?.identificacion || '—',
          city: p.clientes?.ciudad || '—',
        },
        shopify_order_id: shopifyOrderId,
        shopify_order_name: shopifyOrderName,
      };
    });

    // Fetch Hoko details in parallel for orders with hoko_order_id
    await Promise.all(dbOrdersList.map(async (fullOrder) => {
      if (!fullOrder.hoko_order_id) {
        orders.push(fullOrder);
        return;
      }
      try {
        const hokoId = fullOrder.hoko_order_id;
        const url = `${HOKO_BASE}/member/order/${hokoId}`;
        logger.info(`Llamando Hoko para detalle: ${url}`);
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${HOKO_TOKEN}`,
            Accept: 'application/json',
          },
          cache: 'no-store'
        });
        const detail = await res.json();
        logger.info(`Respuesta Hoko para orden ${hokoId}:`, detail);

        if (detail.error) {
          logger.error(`Error de Hoko para orden ${hokoId}:`, detail.error);
          orders.push(fullOrder);
          return;
        }

        const hokoOrder = detail.data || detail;
        const mergedOrder = {
          ...fullOrder,
          ...hokoOrder,
          id: hokoOrder.id || fullOrder.id,
          db_id: fullOrder.db_id,
          canal: fullOrder.canal,
          shopify_order_id: fullOrder.shopify_order_id,
          shopify_order_name: fullOrder.shopify_order_name,
        };

        if (fullOrder.customer.name !== '—') {
          mergedOrder.customer = {
            ...mergedOrder.customer,
            name: fullOrder.customer.name,
            email: fullOrder.customer.email,
            phone: fullOrder.customer.phone,
            address: fullOrder.customer.address,
            identification: fullOrder.customer.identification,
            city: fullOrder.customer.city,
          };
        }

        orders.push(mergedOrder);
      } catch (e: any) {
        logger.error(`Error al procesar orden ${fullOrder.hoko_order_id} en servidor:`, { message: e.message, stack: e.stack });
        orders.push(fullOrder);
      }
    }));

    // Sort orders by created_at desc (to match DB order)
    orders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const responsePayload = orderIdParam ? (orders[0] || null) : orders;
    logger.info(`Retornando ${orderIdParam ? 'pedido único' : `${orders.length} pedidos unificados`}`);
    
    return new NextResponse(JSON.stringify(responsePayload), {
      status: orderIdParam && !orders[0] ? 404 : 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    logger.error('Excepción en GET /api/pedidos:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    logger.info('=== FIN GET /api/pedidos (SERVER SIDE) ===');
  }
}

export async function POST(request: NextRequest) {
  logger.info('=== INICIO POST /api/pedidos (REGISTRO/CONFIRMACIÓN DE VENTA) ===');
  try {
    const body = await request.json();
    const {
      customer,
      stock_id,
      quantity,
      price_by_unit,
      courier_id,
      courier_name,
      payment_type,
      total_paid,
      declared_value = '10000',
      acceso_app = 'PENDIENTE APP',
      pedido_id,
      delivery_method = 'hoko_auto',
      manual_hoko_id,
      other_courier_name
    } = body;

    // Validation
    if (!customer?.name || !customer?.phone || !customer?.address || !stock_id || !quantity) {
      logger.warn('POST /api/pedidos llamado con campos incompletos');
      return NextResponse.json({ error: 'Faltan campos obligatorios para registrar el pedido' }, { status: 400 });
    }

    if (delivery_method === 'hoko_auto' && (!customer?.city_id || !courier_id)) {
      logger.warn('POST /api/pedidos: Hoko automático requiere ciudad y transportadora');
      return NextResponse.json({ error: 'Faltan ciudad o transportadora para el envío por Hoko' }, { status: 400 });
    }

    if (delivery_method === 'hoko_manual' && !manual_hoko_id) {
      logger.warn('POST /api/pedidos: Hoko manual requiere el ID de orden');
      return NextResponse.json({ error: 'Debes ingresar el ID de orden de Hoko manual' }, { status: 400 });
    }

    if (delivery_method === 'other' && !other_courier_name) {
      logger.warn('POST /api/pedidos: Otro canal requiere especificar el medio de envío');
      return NextResponse.json({ error: 'Debes especificar por qué canal o transportadora se realiza el envío' }, { status: 400 });
    }

    let hokoOrderId: any = null;
    let hokoStoreId: any = 23789; // Default store id
    let finalCourierName = '';
    let finalCourierId: any = null;

    if (delivery_method === 'hoko_auto') {
      // 1. Create Hoko order automatically
      logger.info('Registrando orden en Hoko automáticamente...');
      const customerPayload = {
        name: customer.name,
        email: customer.email || 'cliente@correo.com',
        identification: customer.identification || '12345678',
        phone: customer.phone,
        address: customer.address,
        city_id: String(customer.city_id)
      };
      logger.info('Customer payload enviado a Hoko:', customerPayload);
      const hokoFormData = new FormData();
      hokoFormData.append('customer', JSON.stringify(customerPayload));
      hokoFormData.append('stocks', JSON.stringify({
        [String(stock_id)]: {
          amount: Number(quantity),
          price: Number(price_by_unit)
        }
      }));
      // Hoko payment: 0 = Contraentrega/Recaudo, 1 = Pago anticipado/Crédito
      const hokoPaymentVal = payment_type === 'pago contra entrega' ? '0' : '1';
      hokoFormData.append('payment', hokoPaymentVal);
      hokoFormData.append('courier_id', String(courier_id));
      hokoFormData.append('contain', 'Accesorio localizador');
      hokoFormData.append('measures', JSON.stringify({
        height: "10",
        width: "10",
        length: "10",
        weight: "1"
      }));
      hokoFormData.append('declared_value', String(declared_value));

      const hokoUrl = `${HOKO_BASE}/member/order/create`;
      logger.info(`Llamando endpoint Hoko: ${hokoUrl}`);
      const hokoRes = await fetch(hokoUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HOKO_TOKEN}`,
          Accept: 'application/json'
        },
        body: hokoFormData
      });

      if (!hokoRes.ok) {
        const errText = await hokoRes.text();
        logger.error('Error de red al llamar a Hoko:', errText);
        return NextResponse.json({ error: `Hoko Error: ${errText}` }, { status: hokoRes.status });
      }

      const hokoData = await hokoRes.json();
      logger.info('Respuesta de creación en Hoko:', hokoData);

      const hokoOrderResult = hokoData.data || hokoData;
      hokoOrderId = hokoOrderResult.id || hokoData.order_id;
      hokoStoreId = hokoOrderResult.cellar_id || hokoData.store_id || 23789;

      if (hokoData.error || !hokoOrderId) {
        logger.error('Error devuelto por Hoko:', hokoData.error || hokoData);
        return NextResponse.json({ error: hokoData.error || 'No se pudo crear la orden en Hoko' }, { status: 400 });
      }

      finalCourierId = Number(courier_id);
      finalCourierName = courier_name;

    } else if (delivery_method === 'hoko_manual') {
      logger.info(`Asociando ID de Hoko ingresado manualmente: ${manual_hoko_id}`);
      hokoOrderId = String(manual_hoko_id);
      finalCourierName = 'Hoko Manual';
      finalCourierId = null;
    } else if (delivery_method === 'other') {
      logger.info(`Registrando envío por otro canal/transportadora: ${other_courier_name}`);
      hokoOrderId = null;
      finalCourierName = String(other_courier_name);
      finalCourierId = null;
    }

    // 2. Database client lookup / insertion
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    logger.info(`Buscando cliente con teléfono: ${customer.phone}`);
    
    let { data: existingClient, error: clientFindError } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', customer.phone)
      .maybeSingle();

    if (clientFindError) {
      logger.error('Error consultando cliente en Supabase:', clientFindError);
    }

    let cliente_id = '';
    if (existingClient?.cliente_id) {
      cliente_id = existingClient.cliente_id;
      logger.info(`Cliente existente encontrado: ${cliente_id}`);
      
      // Update client address and city if they changed
      await supabase
        .from('clientes')
        .update({
          direccion: customer.address,
          ciudad: customer.city || existingClient.ciudad,
          updated_at: new Date().toISOString()
        })
        .eq('cliente_id', cliente_id);
    } else {
      cliente_id = `cliente_directo_${Date.now()}`;
      logger.info(`Creando nuevo cliente: ${cliente_id}`);
      const { error: clientInsertError } = await supabase
        .from('clientes')
        .insert({
          cliente_id,
          canal: 'chat',
          nombre: customer.name,
          email: customer.email || null,
          telefono: customer.phone,
          identificacion: customer.identification || null,
          direccion: customer.address,
          ciudad: customer.city || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (clientInsertError) {
        logger.error('Error insertando cliente en Supabase:', clientInsertError);
        return NextResponse.json({ error: clientInsertError.message }, { status: 500 });
      }
    }

    // 3. Insert or Update order in local database
    let orderResult = null;
    if (pedido_id) {
      logger.info(`Actualizando pedido existente por confirmar ID local: ${pedido_id}`);
      const { data: updatedOrder, error: orderUpdateError } = await supabase
        .from('pedidos')
        .update({
          cliente_id,
          hoko_order_id: hokoOrderId,
          hoko_store_id: hokoStoreId,
          quantity: Number(quantity),
          stock_id: Number(stock_id),
          courier_id: finalCourierId,
          courier_name: finalCourierName,
          payment_type: payment_type,
          total_paid: Number(total_paid),
          acceso_app: acceso_app,
          status: 'COMFIRMADO',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pedido_id)
        .select()
        .single();

      if (orderUpdateError) {
        logger.error(`Error al actualizar pedido ID ${pedido_id} en Supabase:`, orderUpdateError);
        return NextResponse.json({ error: orderUpdateError.message }, { status: 500 });
      }
      orderResult = updatedOrder;
      logger.info(`Pedido ID local ${pedido_id} confirmado y actualizado exitosamente`);
    } else {
      logger.info('Registrando nuevo pedido en Supabase...');
      const { data: newOrder, error: orderInsertError } = await supabase
        .from('pedidos')
        .insert({
          cliente_id,
          hoko_order_id: hokoOrderId,
          hoko_store_id: hokoStoreId,
          quantity: Number(quantity),
          stock_id: Number(stock_id),
          courier_id: finalCourierId,
          courier_name: finalCourierName,
          payment_type: payment_type,
          total_paid: Number(total_paid),
          acceso_app: acceso_app,
          status: 'COMFIRMADO',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderInsertError) {
        logger.error('Error insertando pedido en Supabase:', orderInsertError);
        return NextResponse.json({ error: orderInsertError.message }, { status: 500 });
      }
      orderResult = newOrder;
      logger.info(`Pedido creado exitosamente con ID local ${newOrder.id} y Hoko ID ${hokoOrderId}`);
    }

    return NextResponse.json({ success: true, order: orderResult });

  } catch (error: any) {
    logger.error('Excepción en POST /api/pedidos:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    logger.info('=== FIN POST /api/pedidos ===');
  }
}
