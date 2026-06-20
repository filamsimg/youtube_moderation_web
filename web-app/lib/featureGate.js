/**
 * Athena Shield Feature Gate Utility
 * 
 * Mengevaluasi hak akses fitur pengguna (gating) berdasarkan kolom boolean 
 * yang diaktifkan/dinonaktifkan oleh Superadmin di database pricing_packages.
 */

/**
 * Memeriksa apakah suatu fitur dinonaktifkan (dikunci) untuk profil pengguna tertentu.
 * 
 * @param {string} featureKey - Kunci fitur ('bulk_moderation', 'export_csv', atau 'auto_moderation')
 * @param {object} profile - Objek profil pengguna dari /api/quota/profile (mengandung status boolean)
 * @returns {boolean} true jika fitur dinonaktifkan (dikunci)
 */
export function checkIsFeatureDisabled(featureKey, profile = {}) {
  if (!profile) return true;

  // Jika user adalah superadmin/admin di sistem, kita bisa bypass (atau biarkan mengevaluasi paket jika itu bagian dari hak akses client)
  // Untuk konsistensi pengujian tier, evaluasi tetap didasarkan pada paket aktif:
  if (featureKey === 'bulk_moderation') {
    return !profile.allow_bulk_moderation;
  }
  
  if (featureKey === 'export_csv') {
    return !profile.allow_export_csv;
  }
  
  if (featureKey === 'auto_moderation') {
    return !profile.allow_auto_moderation;
  }

  return false;
}
