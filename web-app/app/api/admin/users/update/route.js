import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  // Verifikasi wewenang admin (minimal role 'admin')
  const authCheck = await requireAdmin('admin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const currentAdmin = authCheck.profile;

  try {
    const body = await request.json();
    const { target_email, updates } = body;

    if (!target_email || !updates) {
      return NextResponse.json({ error: 'Missing target_email or updates object' }, { status: 400 });
    }

    // 1. Ambil data target user saat ini
    const { data: targetProfile, error: fetchErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', target_email)
      .single();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: 'Target user profile not found' }, { status: 404 });
    }

    // 2. Proteksi Otoritas
    // a. Admin biasa TIDAK BISA memodifikasi akun Superadmin
    if (targetProfile.role === 'superadmin' && currentAdmin.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Regular admins cannot modify a superadmin account' }, { status: 403 });
    }

    // b. Hanya Superadmin yang bisa mengubah Role
    if (updates.role && updates.role !== targetProfile.role) {
      if (currentAdmin.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden: Only superadmin can modify user roles' }, { status: 403 });
      }
    }

    // 3. Susun data update dan audit log dengan type casting yang aman
    const updatedData = {};
    const auditDetails = {
      before: {},
      after: {},
    };

    let hasChanges = false;
    const allowedKeys = ['tier', 'subscription_quota', 'trial_quota', 'quota_limit', 'quota_expiry', 'is_active', 'role'];

    allowedKeys.forEach((key) => {
      if (updates[key] !== undefined) {
        let val = updates[key];

        // Konversi tipe data numerik
        if (['subscription_quota', 'trial_quota', 'quota_limit'].includes(key)) {
          val = parseInt(val, 10);
          if (isNaN(val)) val = 0;
        }

        // Penanganan tanggal kosong agar tidak memicu error sintaks timestamp di Postgres
        if (key === 'quota_expiry') {
          val = val && typeof val === 'string' && val.trim() !== '' ? new Date(val).toISOString() : null;
        }

        const targetVal = targetProfile[key];
        
        // Cek perbedaan nilai secara presisi
        let isDifferent = false;
        if (key === 'quota_expiry') {
          const t1 = targetVal ? new Date(targetVal).getTime() : null;
          const t2 = val ? new Date(val).getTime() : null;
          isDifferent = t1 !== t2;
        } else {
          isDifferent = targetVal !== val;
        }

        if (isDifferent) {
          updatedData[key] = val;
          auditDetails.before[key] = targetVal;
          auditDetails.after[key] = val;
          hasChanges = true;
        }
      }
    });

    if (!hasChanges) {
      return NextResponse.json({ success: true, message: 'No changes detected', profile: targetProfile });
    }

    // Tambahkan timestamp update
    updatedData.updated_at = new Date().toISOString();

    // 4. Lakukan update di database
    const { data: newProfile, error: updateErr } = await supabaseAdmin
      .from('user_profiles')
      .update(updatedData)
      .eq('email', target_email)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 5. Catat ke Admin Audit Logs
    // Tentukan jenis aksi untuk log audit
    let action = 'UPDATE_USER_PROFILE';
    if (updates.is_active !== undefined && updates.is_active !== targetProfile.is_active) {
      action = updates.is_active ? 'UNSUSPEND_USER' : 'SUSPEND_USER';
    } else if (updates.role !== undefined && updates.role !== targetProfile.role) {
      action = 'CHANGE_USER_ROLE';
    } else if (updates.tier !== undefined && updates.tier !== targetProfile.tier) {
      action = 'CHANGE_USER_TIER';
    } else if (updates.subscription_quota !== undefined) {
      action = 'ADJUST_USER_QUOTA';
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    const { error: auditErr } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_email: currentAdmin.email,
        action,
        target_email,
        details: auditDetails,
        ip_address: ipAddress,
      });

    if (auditErr) {
      console.error('Failed to write audit log:', auditErr);
      // Jangan return error agar operasi utama tetap terhitung sukses
    }

    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
      profile: newProfile,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
