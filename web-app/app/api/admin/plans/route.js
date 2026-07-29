import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/plans - Ambil semua paket (termasuk yang tidak aktif) untuk admin dashboard
export async function GET(request) {
  // Minimal role admin untuk melihat
  const authCheck = await requireAdmin('admin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { data: packages, error } = await supabaseAdmin
      .from('pricing_packages')
      .select('*')
      .order('type', { ascending: true })
      .order('price', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('[Admin Plans API GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/plans - Tambah paket baru (Hanya Superadmin)
export async function POST(request) {
  // Hanya role superadmin yang diperbolehkan
  const authCheck = await requireAdmin('superadmin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const currentAdmin = authCheck.profile;

  try {
    const body = await request.json();
    const {
      id,
      name,
      type,
      tier,
      price,
      original_price,
      quota_units,
      duration_days,
      description,
      features,
      disabled_features,
      badge,
      is_active,
      allow_bulk_moderation,
      allow_export_csv,
      allow_auto_moderation,
      billing_cycle,
    } = body;

    // Validasi input wajib (tidak lagi mewajibkan type dari request body, melainkan dipaksa 'subscription')
    if (!id || !name || price === undefined || quota_units === undefined || duration_days === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert ke database
    const { data: newPackage, error: insertErr } = await supabaseAdmin
      .from('pricing_packages')
      .insert({
        id,
        name,
        type: 'subscription',
        tier: tier || 'FREE',
        price,
        original_price: original_price || null,
        quota_units,
        duration_days,
        description: description || '',
        features: features || [],
        disabled_features: disabled_features || [],
        badge: badge || null,
        is_active: is_active !== undefined ? is_active : true,
        allow_bulk_moderation: allow_bulk_moderation !== undefined ? allow_bulk_moderation : false,
        allow_export_csv: allow_export_csv !== undefined ? allow_export_csv : false,
        allow_auto_moderation: allow_auto_moderation !== undefined ? allow_auto_moderation : false,
        billing_cycle: billing_cycle || '1M',
      })
      .select()
      .single();

    if (insertErr) {
      // Tangani conflict key
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'Package ID already exists' }, { status: 409 });
      }
      throw insertErr;
    }

    // Catat ke log audit admin
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_email: currentAdmin.email,
        action: 'CREATE_PRICING_PACKAGE',
        target_email: null,
        details: {
          package_id: id,
          package_name: name,
          data: newPackage,
        },
        ip_address: ipAddress,
      });

    return NextResponse.json({
      success: true,
      message: 'Pricing package created successfully',
      package: newPackage,
    });
  } catch (error) {
    console.error('[Admin Plans API POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
