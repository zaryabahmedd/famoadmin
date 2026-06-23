import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Append an entry to the admin audit trail. Best-effort: failures are logged
 * but never bubble up to fail the action being audited.
 *
 * @param {object}  entry
 * @param {object}  entry.actor        Session object ({ sub, name, email }).
 * @param {string}  entry.action       e.g. 'rider.approved', 'user.blocked'.
 * @param {string} [entry.targetType]  'rider' | 'user' | 'admin' | 'pricing'.
 * @param {string} [entry.targetId]
 * @param {string} [entry.targetLabel] Human-readable target (name/email).
 * @param {object} [entry.details]     Arbitrary JSON context (from/to, reason…).
 */
export async function logAudit({ actor, action, targetType, targetId, targetLabel, details }) {
  try {
    const { error } = await supabaseAdmin.from('admin_audit_logs').insert({
      actor_id: actor?.sub || null,
      actor_name: actor?.name || null,
      actor_email: actor?.email || null,
      action,
      target_type: targetType || null,
      target_id: targetId != null ? String(targetId) : null,
      target_label: targetLabel || null,
      details: details || null,
    });
    if (error) console.error('[audit] failed to write log:', error.message);
  } catch (err) {
    console.error('[audit] unexpected error:', err?.message || err);
  }
}
