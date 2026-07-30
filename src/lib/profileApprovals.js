/**
 * Profile change requests exist for two separate audiences that live in
 * different tables: customers in `users` and drivers in `riders`. The request
 * tables are column-identical apart from the owner foreign key, so every route
 * resolves a config from here rather than branching on the type inline.
 */

export const APPROVAL_TYPES = {
  user: {
    table: 'profile_change_requests',
    ownerColumn: 'user_id',
    ownerTable: 'users',
    auditTargetType: 'user',
  },
  rider: {
    table: 'rider_profile_change_requests',
    ownerColumn: 'rider_id',
    ownerTable: 'riders',
    auditTargetType: 'rider',
  },
};

/** Days a profile is frozen after an approved change. */
export const PROFILE_LOCK_DAYS = 30;

/**
 * Resolve the table config for a `?type=` query param, defaulting to customers
 * so existing links keep working.
 * @returns {null | typeof APPROVAL_TYPES[keyof typeof APPROVAL_TYPES] & { key: string }}
 */
export function resolveApprovalType(type) {
  const key = type || 'user';
  const config = APPROVAL_TYPES[key];
  return config ? { ...config, key } : null;
}

/** Timestamp the profile stays locked until, counted from now. */
export function profileLockedUntil(from = new Date()) {
  const until = new Date(from);
  until.setDate(until.getDate() + PROFILE_LOCK_DAYS);
  return until.toISOString();
}
