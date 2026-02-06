import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test basic Supabase connectivity
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    return Response.json({
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      database_url_exists: !!process.env.DATABASE_URL,
      direct_url_exists: !!process.env.DIRECT_URL,
      anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_status: response.status,
      supabase_ok: response.ok,
      message: response.ok ? 'Supabase is reachable' : `Supabase returned ${response.status}`,
    });
  } catch (error) {
    return Response.json({
      error: 'Failed to reach Supabase',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
