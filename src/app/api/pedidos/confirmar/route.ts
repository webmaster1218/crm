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
    logger.info('Consultando tabla "pedidos_por_comfirmar" en Supabase...');
    
    const { data, error } = await supabase
      .from('pedidos_por_comfirmar')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error al consultar pedidos_por_comfirmar:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info(`Pedidos por confirmar obtenidos: ${data?.length || 0} registros`);
    return NextResponse.json(data || []);
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
    logger.info(`Confirmando pedido ID: ${id} en Supabase...`);
    
    const { data, error } = await supabase
      .from('pedidos_por_comfirmar')
      .update({
        status: 'COMFIRMADO',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      logger.error(`Error al actualizar pedido ID ${id} en Supabase:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info(`Pedido ID ${id} confirmado exitosamente en base de datos`);
    return NextResponse.json(data && data.length > 0 ? data[0] : null);
  } catch (error: any) {
    logger.error('Excepción en POST /api/pedidos/confirmar:', { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    logger.info('=== FIN POST /api/pedidos/confirmar ===');
  }
}
