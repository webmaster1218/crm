import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Falta el id del pedido o el nuevo estado de acceso.' }, { status: 400 });
    }

    if (status !== 'OK APP' && status !== 'PENDIENTE APP') {
      return NextResponse.json({ error: 'Estado de acceso inválido.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('pedidos')
      .update({ 
        acceso_app: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar acceso_app:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err: any) {
    console.error('Excepción en update-app-status route:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
