import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const dynamic = 'force-dynamic';

// GET: Retrieve all manual stocks
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('inventario_manual')
      .select('*')
      .order('stock_id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upsert / Update manual stock quantity
export async function POST(request: NextRequest) {
  try {
    const { stock_id, cantidad, nombre } = await request.json();

    if (!stock_id) {
      return NextResponse.json({ error: 'Falta el stock_id' }, { status: 400 });
    }

    if (cantidad === undefined || cantidad === null) {
      return NextResponse.json({ error: 'Falta la cantidad de stock' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const updatePayload: any = {
      stock_id: Number(stock_id),
      cantidad: Number(cantidad),
      updated_at: new Date().toISOString(),
    };

    if (nombre) {
      updatePayload.nombre = nombre;
    }

    const { data, error } = await supabase
      .from('inventario_manual')
      .upsert(updatePayload, { onConflict: 'stock_id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating manual stock:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Exception in manual stock update:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
