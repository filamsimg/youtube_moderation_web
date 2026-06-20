import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/plans/[id] - Update detail paket (Hanya Superadmin)
export async function PATCH(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing package ID' }, { status: 400 });
  }

  // Hanya role superadmin yang diperbolehkan mengubah
  const authCheck = await requireAdmin('superadmin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const currentAdmin = authCheck.profile;

  try {
    const body = await request.json();
    const {
      name,
      price,
      original_price,
      quota_units,
      duration_days,
      description,
      features,
      disabled_features,
      badge,
      color,
      is_active,
      allow_bulk_moderation,
      allow_export_csv,
      allow_auto_moderation,
    } = body;

    // Ambil data sebelum update untuk log audit
    const { data: oldPackage, error: fetchErr } = await supabaseAdmin
      .from('pricing_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !oldPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const updatedData = {
      updated_at: new Date().toISOString(),
    };

    const allowedKeys = [
      'name', 'price', 'original_price', 'quota_units', 'duration_days',
      'description', 'features', 'disabled_features', 'badge', 'color', 'is_active',
      'allow_bulk_moderation', 'allow_export_csv', 'allow_auto_moderation'
    ];

    const auditDetails = {
      before: {},
      after: {},
    };

    let hasChanges = false;
    allowedKeys.forEach((key) => {
      if (body[key] !== undefined && JSON.stringify(body[key]) !== JSON.stringify(oldPackage[key])) {
        // Normalisasi undefined/null originalPrice
        if (key === 'original_price' && body[key] === '') {
          updatedData[key] = null;
        } else {
          updatedData[key] = body[key];
        }
        auditDetails.before[key] = oldPackage[key];
        auditDetails.after[key] = updatedData[key];
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected',
        package: oldPackage,
      });
    }

    // Update ke database
    const { data: newPackage, error: updateErr } = await supabaseAdmin
      .from('pricing_packages')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Catat ke log audit admin
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_email: currentAdmin.email,
        action: 'UPDATE_PRICING_PACKAGE',
        target_email: null,
        details: {
          package_id: id,
          changes: auditDetails,
        },
        ip_address: ipAddress,
      });

    return NextResponse.json({
      success: true,
      message: 'Pricing package updated successfully',
      package: newPackage,
    });
  } catch (error) {
    console.error('[Admin Plans API PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/plans/[id] - Hapus paket secara permanen (Hanya Superadmin)
export async function DELETE(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing package ID' }, { status: 400 });
  }

  // Hanya role superadmin yang diperbolehkan menghapus
  const authCheck = await requireAdmin('superadmin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const currentAdmin = authCheck.profile;

  try {
    // Ambil data sebelum dihapus untuk log audit
    const { data: oldPackage, error: fetchErr } = await supabaseAdmin
      .from('pricing_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !oldPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Hapus dari database
    const { error: deleteErr } = await supabaseAdmin
      .from('pricing_packages')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    // Catat ke log audit admin
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_email: currentAdmin.email,
        action: 'DELETE_PRICING_PACKAGE',
        target_email: null,
        details: {
          package_id: id,
          package_name: oldPackage.name,
        },
        ip_address: ipAddress,
      });

    return NextResponse.json({
      success: true,
      message: 'Pricing package deleted successfully',
    });
  } catch (error) {
    console.error('[Admin Plans API DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
